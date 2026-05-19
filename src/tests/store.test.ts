import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { products } from '../data/products';
import { useTerminalStore } from '../state/store';

const demoCartItem = {
  productId: 'milk-25',
  quantity: 1,
  unitPrice: 89,
  addedAt: '2026-05-19T00:00:00.000Z'
};

describe('terminal store flows', () => {
  beforeEach(() => {
    vi.useRealTimers();
    useTerminalStore.getState().resetSession();
    useTerminalStore.setState((current) => ({
      demo: {
        ...current.demo,
        paymentScenarioId: 'card_success',
        receiptScenarioId: 'receipt_success',
        edgeCasesEnabled: true
      }
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    useTerminalStore.getState().resetSession();
  });

  it('does not start payment for an empty cart', async () => {
    await useTerminalStore.getState().startPayment('card');
    expect(useTerminalStore.getState().state).toEqual({ name: 'idle' });
    expect(useTerminalStore.getState().receipt).toBeNull();
  });

  it('finishes payment only through payment pending', async () => {
    vi.useFakeTimers();
    useTerminalStore.setState({
      cart: [demoCartItem],
      state: { name: 'payment_method' }
    });

    const payment = useTerminalStore.getState().startPayment('card');
    expect(useTerminalStore.getState().state).toEqual({ name: 'payment_pending', method: 'card', scenarioId: 'card_success' });

    await vi.advanceTimersByTimeAsync(1300);
    await payment;

    expect(useTerminalStore.getState().state.name).toBe('receipt_success');
    expect(useTerminalStore.getState().receipt?.items).toEqual([demoCartItem]);
  });

  it('resolves receipt error by staff reset path', () => {
    useTerminalStore.setState({
      cart: [demoCartItem],
      receipt: {
        id: 'MCK-20260519-000001',
        createdAt: '2026-05-19T00:00:00.000Z',
        items: [demoCartItem],
        total: 89,
        qrPayload: 'mock-receipt:MCK-20260519-000001',
        status: 'failed'
      },
      state: { name: 'staff_mode', source: 'Ошибка чека' }
    });

    useTerminalStore.getState().resolveReceiptError();
    expect(useTerminalStore.getState().state).toEqual({ name: 'idle' });
    expect(useTerminalStore.getState().cart).toEqual([]);
    expect(useTerminalStore.getState().receipt).toBeNull();
  });

  it('updates quick branding fields without arbitrary css', () => {
    useTerminalStore.getState().updateBrandConfig({ storeName: 'Demo Shop', logoText: 'DS', primaryColor: '#1d4ed8' });
    expect(useTerminalStore.getState().activeBrand.storeName).toBe('Demo Shop');
    expect(useTerminalStore.getState().activeBrand.logoText).toBe('DS');
    expect(useTerminalStore.getState().activeBrand.primaryColor).toBe('#1d4ed8');
    expect(products.length).toBeGreaterThanOrEqual(40);
  });
});
