import { describe, expect, it } from 'vitest';
import { canOpenBrandingDemo, canShowIdlePromo, transition } from '../state/machine';
import type { TerminalState } from '../types';

describe('terminal state machine', () => {
  it('starts purchase from idle and blocks empty cart payment', () => {
    const active = transition({ name: 'idle' }, { type: 'START_PURCHASE' });
    expect(active).toEqual({ name: 'active_cart' });
    expect(transition(active, { type: 'GO_TO_PAYMENT', cartIsEmpty: true })).toEqual(active);
  });

  it('allows payment only through payment method state', () => {
    const state: TerminalState = { name: 'active_cart' };
    const paymentMethod = transition(state, { type: 'GO_TO_PAYMENT', cartIsEmpty: false });
    expect(paymentMethod).toEqual({ name: 'payment_method' });
    expect(transition(paymentMethod, { type: 'START_PAYMENT', method: 'card', scenarioId: 'card_success' })).toEqual({
      name: 'payment_pending',
      method: 'card',
      scenarioId: 'card_success'
    });
  });

  it('blocks branding and idle promo during payment pending', () => {
    const state: TerminalState = { name: 'payment_pending', method: 'card', scenarioId: 'card_success' };
    expect(canShowIdlePromo(state)).toBe(false);
    expect(canOpenBrandingDemo(state)).toBe(false);
    expect(transition(state, { type: 'OPEN_BRANDING_DEMO' })).toEqual(state);
  });

  it('routes receipt failure to receipt error and then help', () => {
    const receiptError = transition({ name: 'payment_pending', method: 'card', scenarioId: 'card_success' }, { type: 'RECEIPT_FAILED', reason: 'fail' });
    expect(receiptError).toEqual({ name: 'receipt_error', reason: 'fail' });
    expect(transition(receiptError, { type: 'REQUEST_HELP', source: 'Ошибка чека' })).toEqual({
      name: 'help_requested',
      source: 'Ошибка чека'
    });
  });

  it('uses warning before session reset', () => {
    expect(transition({ name: 'active_cart' }, { type: 'SESSION_TIMEOUT' })).toEqual({
      name: 'session_timeout_warning',
      returnTo: 'active_cart'
    });
  });
});
