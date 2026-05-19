import { describe, expect, it } from 'vitest';
import { getPaymentScenario, scenarioMessage } from '../services/payment';
import { createMockReceipt, resetReceiptCounter } from '../services/receipt';
import { hasReadableContrast } from '../services/branding';

describe('payment, receipt and theme services', () => {
  it('selects fallback payment scenario by method', () => {
    expect(getPaymentScenario('missing', 'card').id).toBe('card_success');
    expect(getPaymentScenario('missing', 'sbp').id).toBe('sbp_paid');
    expect(scenarioMessage('declined')).toContain('отклонил');
  });

  it('generates deterministic mock receipt shape', () => {
    resetReceiptCounter();
    const receipt = createMockReceipt([{ productId: 'milk-25', quantity: 2, unitPrice: 89, addedAt: 'now' }]);
    expect(receipt.id).toMatch(/^MCK-\d{8}-000001$/);
    expect(receipt.total).toBe(178);
    expect(receipt.status).toBe('success');
  });

  it('validates basic readable contrast for brand colors', () => {
    expect(hasReadableContrast('#0f766e')).toBe(true);
  });
});
