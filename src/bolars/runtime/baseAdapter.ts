import { BOLARS_ROUTE, createEmptySnapshot, maskCode, maskPhone } from './defaults';
import type {
  AdapterKind,
  ApplyStatus,
  CommandResult,
  OutboundCommandRecord,
  RuntimeDebugState,
  RuntimeCommandError,
  RuntimeEvent,
  SelfCheckoutCommand,
  SelfCheckoutRuntimePort,
  SelfCheckoutStateSnapshot
} from './types';

export type RuntimeRouteContext = {
  url: URL;
  route: string;
  debug: boolean;
  preview: boolean;
  runId?: string;
  terminalLabel?: string;
  buildId: string;
};

const createInitialApplyStatus = (): ApplyStatus => ({
  ok: true,
  kind: 'runtimeInfo',
  errors: [],
  warnings: [],
  renderedScreen: 'start',
  updatedAt: new Date().toISOString()
});

export const maskSensitive = (value: unknown): unknown => {
  if (typeof value === 'string') {
    const emailMasked = value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[masked-email]');
    const tokenMasked = emailMasked.replace(/(token|secret|password|authorization|bearer)[=: ]+[^\s,"']+/gi, '$1=[masked-secret]');
    const phoneMasked = tokenMasked.replace(/(?:\+7|8)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/g, maskPhone);
    const longDigitsMasked = phoneMasked.replace(/\b\d{8,}\b/g, (digits) => maskCode(digits));
    return longDigitsMasked.replace(/\b[a-zA-Zа-яА-Я]+Ref[:#-][\w-]+/g, '[masked-ref]');
  }
  if (Array.isArray(value)) return value.map(maskSensitive);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => {
        if (/token|secret|password|card|phone|barcode|code|ref|email|fio|name/i.test(key)) {
          return [key, typeof child === 'string' ? maskSensitive(child) : '[masked]'];
        }
        return [key, maskSensitive(child)];
      })
    );
  }
  return value;
};

export const payloadSummary = (command?: SelfCheckoutCommand): string => {
  if (!command || command.payload === undefined) return 'none';
  const masked = maskSensitive(command.payload);
  return JSON.stringify(masked);
};

export class BaseRuntimeAdapter implements SelfCheckoutRuntimePort {
  protected snapshot: SelfCheckoutStateSnapshot;
  protected listeners = new Set<(snapshot: SelfCheckoutStateSnapshot, event?: RuntimeEvent) => void>();
  protected lastApplyStatus: ApplyStatus = createInitialApplyStatus();
  protected lastInboundSnapshot: SelfCheckoutStateSnapshot | null = null;

  constructor(
    protected readonly adapterKind: AdapterKind,
    protected readonly routeContext: RuntimeRouteContext
  ) {
    this.snapshot = createEmptySnapshot(adapterKind);
  }

  async dispatch(command: SelfCheckoutCommand): Promise<CommandResult> {
    this.applyCommandMetadata(command, { ok: false, code: 'invalidCommand', message: 'Adapter does not handle commands directly.' });
    return {
      ok: false,
      commandId: command.commandId,
      snapshotVersion: this.snapshot.snapshotVersion,
      error: { code: 'invalidCommand', message: 'Adapter does not handle commands directly.' }
    };
  }

  getState(): SelfCheckoutStateSnapshot {
    return this.snapshot;
  }

  subscribe(listener: (snapshot: SelfCheckoutStateSnapshot, event?: RuntimeEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getDebugState(): RuntimeDebugState {
    const snapshot = this.snapshot;
    return {
      ok: true,
      route: this.routeContext.route,
      debug: this.routeContext.debug,
      ready: true,
      runId: this.routeContext.runId,
      terminalLabel: this.routeContext.terminalLabel,
      buildId: this.routeContext.buildId,
      viewport: {
        width: typeof window === 'undefined' ? 1080 : window.innerWidth,
        height: typeof window === 'undefined' ? 1920 : window.innerHeight,
        profile: snapshot.uiConfig.viewportProfile
      },
      api: {
        namespaceExists: typeof window !== 'undefined' && Boolean(window.BolarsSelfCheckout),
        receiveStateSnapshotExists: true,
        outboundChannelStatus: 'ready'
      },
      adapter: {
        adapterKind: snapshot.adapterKind,
        previewMode: Boolean(snapshot.previewMode),
        selectedPreviewScreen: snapshot.currentScreen,
        selectedPreviewScenario: snapshot.previewScenarioId,
        previewSnapshotVersion: snapshot.previewMode ? snapshot.snapshotVersion : undefined,
        outboundCommandsMode: snapshot.adapterKind === 'preview' ? 'local' : 'disabled',
        previewWarning: snapshot.previewMode ? 'Preview mode does not call 1С and does not perform business operations.' : undefined,
        runtimePortStatus: 'ready',
        pendingOutboundCount: 0
      },
      outboundQueue: {
        pendingCount: 0,
        queuedCount: 0,
        drainedCount: 0,
        processingCount: 0,
        failedCount: 0,
        timeoutCount: 0,
        lastUnackedCommandId: null,
        oldestPendingAgeMs: null,
        queueOverflow: false,
        lastDrainAt: null,
        lastSnapshotCorrelationCommandId: snapshot.lastProcessedCommandId ?? null
      },
      lastOutboundCommand: null,
      lastInboundSnapshot: this.lastInboundSnapshot
        ? {
            snapshotVersion: this.lastInboundSnapshot.snapshotVersion,
            lastProcessedCommandId: this.lastInboundSnapshot.lastProcessedCommandId,
            lastCommandResult: this.lastInboundSnapshot.lastCommandResult,
            currentScreen: this.lastInboundSnapshot.currentScreen,
            cartLineCount: this.lastInboundSnapshot.cartLines.length,
            paymentStatus: this.lastInboundSnapshot.paymentState.status,
            managerStatus: this.lastInboundSnapshot.manager.status,
            alertsCount: this.lastInboundSnapshot.alerts.length
          }
        : {
            snapshotVersion: snapshot.snapshotVersion,
            lastProcessedCommandId: snapshot.lastProcessedCommandId,
            lastCommandResult: snapshot.lastCommandResult,
            currentScreen: snapshot.currentScreen,
            cartLineCount: snapshot.cartLines.length,
            paymentStatus: snapshot.paymentState.status,
            managerStatus: snapshot.manager.status,
            alertsCount: snapshot.alerts.length
          },
      lastApplyStatus: this.lastApplyStatus
    };
  }

  getLastApplyStatus(): ApplyStatus {
    return this.lastApplyStatus;
  }

  receiveStateSnapshot(snapshotJsonString: string): ApplyStatus {
    let parsed: unknown;
    try {
      parsed = JSON.parse(snapshotJsonString);
    } catch {
      return this.rejectApply('invalidJson', ['Snapshot JSON parse failed.']);
    }

    const validation = validateSnapshot(parsed);
    if (!validation.ok) return this.rejectApply('invalidSnapshotShape', validation.errors);

    const nextSnapshot = parsed as SelfCheckoutStateSnapshot;
    if (nextSnapshot.snapshotVersion < this.snapshot.snapshotVersion) {
      return this.rejectApply('staleSnapshotRejected', [`Incoming snapshotVersion ${nextSnapshot.snapshotVersion} is lower than current ${this.snapshot.snapshotVersion}.`]);
    }

    const runId = this.routeContext.runId;
    const terminalLabel = this.routeContext.terminalLabel;
    const maybeRouteSnapshot = nextSnapshot as SelfCheckoutStateSnapshot & { runId?: string; terminalLabel?: string };
    if (runId && maybeRouteSnapshot.runId && maybeRouteSnapshot.runId !== runId) {
      return this.rejectApply('sessionMismatch', ['Snapshot runId does not match route runId.']);
    }
    if (terminalLabel && maybeRouteSnapshot.terminalLabel && maybeRouteSnapshot.terminalLabel !== terminalLabel) {
      return this.rejectApply('sessionMismatch', ['Snapshot terminalLabel does not match route terminalLabel.']);
    }

    this.snapshot = {
      ...nextSnapshot,
      adapterKind: this.adapterKind,
      updatedAt: nextSnapshot.updatedAt || new Date().toISOString()
    };
    this.lastInboundSnapshot = this.snapshot;
    this.lastApplyStatus = {
      ok: true,
      kind: 'snapshot',
      snapshotVersion: this.snapshot.snapshotVersion,
      errors: [],
      warnings: nextSnapshot.snapshotVersion === this.snapshot.snapshotVersion ? [] : [],
      renderedScreen: this.snapshot.currentScreen,
      lastValidSnapshotVersion: this.snapshot.snapshotVersion,
      updatedAt: new Date().toISOString()
    };
    this.notify({ type: 'stateChanged', snapshotVersion: this.snapshot.snapshotVersion });
    return this.lastApplyStatus;
  }

  protected setSnapshot(snapshot: SelfCheckoutStateSnapshot, event?: RuntimeEvent): void {
    this.snapshot = snapshot;
    this.lastApplyStatus = {
      ok: true,
      kind: 'snapshot',
      snapshotVersion: snapshot.snapshotVersion,
      errors: [],
      warnings: [],
      renderedScreen: snapshot.currentScreen,
      lastValidSnapshotVersion: snapshot.snapshotVersion,
      updatedAt: new Date().toISOString()
    };
    this.notify(event ?? { type: 'stateChanged', snapshotVersion: snapshot.snapshotVersion });
  }

  protected notify(event?: RuntimeEvent): void {
    for (const listener of this.listeners) {
      listener(this.snapshot, event);
    }
  }

  protected applyCommandMetadata(command: SelfCheckoutCommand, result: { ok: true } | { ok: false; code: RuntimeCommandError['code']; message: string }) {
    this.snapshot = {
      ...this.snapshot,
      lastProcessedCommandId: command.commandId,
      lastCommandResult: {
        ok: result.ok,
        commandId: command.commandId,
        processedAt: new Date().toISOString(),
        error: result.ok ? undefined : { code: result.code, message: result.message }
      }
    };
  }

  protected ok(command: SelfCheckoutCommand): CommandResult {
    this.applyCommandMetadata(command, { ok: true });
    return { ok: true, commandId: command.commandId, snapshotVersion: this.snapshot.snapshotVersion };
  }

  protected fail(command: SelfCheckoutCommand, code: RuntimeCommandError['code'], message: string): CommandResult {
    this.applyCommandMetadata(command, { ok: false, code, message });
    return { ok: false, commandId: command.commandId, snapshotVersion: this.snapshot.snapshotVersion, error: { code, message } };
  }

  protected rejectApply(reason: string, errors: string[]): ApplyStatus {
    this.lastApplyStatus = {
      ok: false,
      kind: 'snapshot',
      errors,
      warnings: [],
      renderedScreen: this.snapshot.currentScreen,
      rejectedReason: reason,
      lastValidSnapshotVersion: this.snapshot.snapshotVersion,
      updatedAt: new Date().toISOString()
    };
    return this.lastApplyStatus;
  }

  protected recordsToQueueState(records: OutboundCommandRecord[], queueOverflow = false): RuntimeDebugState['outboundQueue'] {
    const pending = records.filter((record) => !['snapshotReceived', 'acknowledged', 'failed', 'timeout'].includes(record.status));
    const oldest = pending[0] ? Date.now() - Date.parse(pending[0].queuedAt) : null;
    return {
      pendingCount: pending.length,
      queuedCount: records.filter((record) => record.status === 'queued').length,
      drainedCount: records.filter((record) => record.status === 'drainedByOneC').length,
      processingCount: records.filter((record) => record.status === 'processing').length,
      failedCount: records.filter((record) => record.status === 'failed').length,
      timeoutCount: records.filter((record) => record.status === 'timeout').length,
      lastUnackedCommandId: pending.length > 0 ? pending[pending.length - 1].command.commandId : null,
      oldestPendingAgeMs: oldest,
      queueOverflow,
      lastDrainAt: records.filter((record) => record.drainedAt).slice(-1)[0]?.drainedAt ?? null,
      lastSnapshotCorrelationCommandId: this.snapshot.lastProcessedCommandId ?? null
    };
  }
}

export const createRouteContext = (inputUrl: string | URL, buildId = import.meta.env?.VITE_APP_VERSION ?? 'local-dev'): RuntimeRouteContext => {
  const url = typeof inputUrl === 'string' ? new URL(inputUrl, 'https://kassa.speechbattle.com') : inputUrl;
  const debug = url.searchParams.get('debug') === '1';
  const preview = debug && url.searchParams.get('preview') === '1';
  return {
    url,
    route: url.pathname || BOLARS_ROUTE,
    debug,
    preview,
    runId: url.searchParams.get('runId') ?? undefined,
    terminalLabel: url.searchParams.get('terminalLabel') ?? undefined,
    buildId: url.searchParams.get('build') ?? buildId
  };
};

export const validateSnapshot = (input: unknown): { ok: true } | { ok: false; errors: string[] } => {
  const errors: string[] = [];
  const snapshot = input as Partial<SelfCheckoutStateSnapshot> | null;
  if (!snapshot || typeof snapshot !== 'object') errors.push('snapshot must be an object');
  if (typeof snapshot?.snapshotVersion !== 'number') errors.push('snapshotVersion must be a number');
  if (!snapshot?.sessionId || typeof snapshot.sessionId !== 'string') errors.push('sessionId must be a string');
  if (!['start', 'cart', 'paymentSetup', 'paymentWaiting', 'paymentError', 'finalSuccess'].includes(String(snapshot?.currentScreen))) errors.push('currentScreen is unsupported');
  for (const field of ['cart', 'cartLines', 'totals', 'paymentState', 'searchState', 'scannerState', 'uiConfig', 'themeProfile'] as const) {
    if (!(field in (snapshot ?? {}))) errors.push(`${field} is required`);
  }
  if (!Array.isArray(snapshot?.cartLines)) errors.push('cartLines must be an array');
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
};
