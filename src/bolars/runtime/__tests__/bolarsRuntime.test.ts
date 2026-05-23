import { describe, expect, it, vi } from 'vitest';
import { createRuntimeAdapterFactory } from '../adapterFactory';
import { createCommand } from '../commands';
import { createEmptySnapshot } from '../defaults';
import { MockAdapter } from '../mockAdapter';
import { OneCInterfaceAdapter } from '../onecInterfaceAdapter';
import { PreviewAdapter } from '../previewAdapter';

const route = (query = '') => `https://kassa.speechbattle.com/bolars/self-checkout-mvp${query}`;

describe('BOLARS RuntimeAdapterFactory', () => {
  it('selects preview only with debug preview route and keeps customer route on mock', () => {
    expect(createRuntimeAdapterFactory(route()).adapterKind).toBe('mock');
    expect(createRuntimeAdapterFactory(route('?preview=1')).adapterKind).toBe('mock');
    expect(createRuntimeAdapterFactory(route('?debug=1&preview=1')).adapterKind).toBe('preview');
    expect(createRuntimeAdapterFactory(route('?debug=1&adapter=onec')).adapterKind).toBe('onec');
  });

  it('does not expose adapter override on customer route', () => {
    const result = createRuntimeAdapterFactory(route('?adapter=onec'));
    expect(result.adapterKind).toBe('mock');
    expect(result.warnings.join(' ')).toMatch(/ignored/);
  });
});

describe('BOLARS MockAdapter', () => {
  it('builds default snapshot and processes scan-first flow through snapshots', async () => {
    const adapter = new MockAdapter(createRuntimeAdapterFactory(route()).routeContext);

    expect(adapter.getState().currentScreen).toBe('start');
    await adapter.dispatch(createCommand('startPurchase', undefined));
    expect(adapter.getState().currentScreen).toBe('cart');
    expect(adapter.getState().cart.isEmpty).toBe(true);

    await adapter.dispatch(createCommand('scanCode', { code: '4600001000011' }, 'scanner'));
    expect(adapter.getState().cartLines).toHaveLength(1);
    expect(adapter.getState().cartLines[0].quantity).toBe(1);

    await adapter.dispatch(createCommand('scanCode', { code: '4600001000011' }, 'scanner'));
    expect(adapter.getState().cartLines).toHaveLength(1);
    expect(adapter.getState().cartLines[0].quantity).toBe(2);
    expect(adapter.getState().cartLines[0].lastChange?.kind).toBe('quantityIncreased');
  });

  it('keeps search below min length inside runtime and adds selected candidate', async () => {
    const adapter = new MockAdapter(createRuntimeAdapterFactory(route()).routeContext);

    await adapter.dispatch(createCommand('startPurchase', undefined));
    await adapter.dispatch(createCommand('searchProducts', { query: 'кле' }, 'keyboard'));
    expect(adapter.getState().searchState.status).toBe('belowMinLength');

    await adapter.dispatch(createCommand('searchProducts', { query: 'клей' }, 'keyboard'));
    expect(adapter.getState().searchState.status).toBe('found');
    const candidateId = adapter.getState().searchState.candidates[0].candidateId;

    await adapter.dispatch(createCommand('selectSearchCandidate', { candidateId }));
    expect(adapter.getState().cartLines).toHaveLength(1);
  });
});

describe('BOLARS PreviewAdapter', () => {
  it('renders deterministic preview snapshots through RuntimePort', () => {
    const adapter = new PreviewAdapter(createRuntimeAdapterFactory(route('?debug=1&preview=1&scenario=paymentError')).routeContext);
    expect(adapter.getState().adapterKind).toBe('preview');
    expect(adapter.getState().previewMode).toBe(true);
    expect(adapter.getState().currentScreen).toBe('paymentError');

    adapter.selectScenario('cartManyItems', 'extraLarge');
    expect(adapter.getState().currentScreen).toBe('cart');
    expect(adapter.getState().cartLines.length).toBeGreaterThan(1);
    expect(adapter.getState().textScale).toBe('extraLarge');
  });
});

describe('BOLARS OneCInterfaceAdapter', () => {
  it('drains commands without treating drain as success and correlates snapshot later', async () => {
    const adapter = new OneCInterfaceAdapter(createRuntimeAdapterFactory(route('?debug=1&adapter=onec')).routeContext);
    const command = createCommand('startPurchase', undefined);

    await adapter.dispatch(command);
    expect(adapter.getDebugState().outboundQueue.queuedCount).toBe(1);

    const drained = JSON.parse(adapter.drainOutboundCommandsJson());
    expect(drained.commands[0].commandId).toBe(command.commandId);
    expect(adapter.getDebugState().lastOutboundCommand?.deliveryStatus).toBe('drainedByOneC');

    const snapshot = {
      ...createEmptySnapshot('onec', {
        snapshotVersion: 2,
        currentScreen: 'cart',
        sessionId: 'session-onec',
        lastProcessedCommandId: command.commandId,
        lastCommandResult: { ok: true, commandId: command.commandId }
      })
    };
    const apply = adapter.receiveStateSnapshot(JSON.stringify(snapshot));
    expect(apply.ok).toBe(true);
    expect(adapter.getDebugState().lastOutboundCommand?.deliveryStatus).toBe('snapshotReceived');
  });

  it('rejects stale snapshots and exposes queue overflow', async () => {
    vi.useFakeTimers();
    const adapter = new OneCInterfaceAdapter(createRuntimeAdapterFactory(route('?debug=1&adapter=onec')).routeContext);
    const current = createEmptySnapshot('onec', { snapshotVersion: 5 });
    expect(adapter.receiveStateSnapshot(JSON.stringify(current)).ok).toBe(true);
    expect(adapter.receiveStateSnapshot(JSON.stringify(createEmptySnapshot('onec', { snapshotVersion: 4 }))).ok).toBe(false);
    expect(adapter.getLastApplyStatus().rejectedReason).toBe('staleSnapshotRejected');

    for (let index = 0; index < 21; index += 1) {
      await adapter.dispatch(createCommand('scanCode', { code: `46000010000${index}` }, 'scanner'));
    }
    expect(adapter.getDebugState().outboundQueue.queueOverflow).toBe(true);

    vi.useRealTimers();
  });

  it('masks sensitive payloads in debug summary', async () => {
    const adapter = new OneCInterfaceAdapter(createRuntimeAdapterFactory(route('?debug=1&adapter=onec')).routeContext);
    await adapter.dispatch(createCommand('applyDiscountByPhone', { phone: '+7 900 123 45 67' }, 'keyboard'));
    expect(adapter.getDebugState().lastOutboundCommand?.payloadSummary).not.toContain('900 123 45 67');
  });
});
