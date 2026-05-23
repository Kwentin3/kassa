import type { CommandSource, CommandType, SelfCheckoutCommand } from './types';

let commandCounter = 0;

const nextCommandId = () => {
  commandCounter += 1;
  return `cmd-${Date.now().toString(36)}-${commandCounter.toString(36)}`;
};

export type CommandPayloadByType = {
  startPurchase: undefined;
  scanCode: { code: string };
  searchProducts: { query: string };
  selectSearchCandidate: { candidateId: string };
  changeQuantity: { lineId: string; quantity: number };
  incrementQuantity: { lineId: string };
  decrementQuantity: { lineId: string };
  openQuantityNumpad: { lineId: string };
  confirmQuantityInput: { lineId: string; quantity: number };
  removeCartLine: { lineId: string };
  cancelPurchaseRequest: undefined;
  confirmCancelPurchase: undefined;
  returnToPurchase: undefined;
  goToPaymentSetup: undefined;
  addPackage: { packageCode: string };
  applyDiscountByPhone: { phone: string };
  startPayment: undefined;
  retryPayment: undefined;
  returnToPaymentSetup: undefined;
  bindManager: { code: string };
  setTextScale: { scale: 'normal' | 'large' | 'extraLarge' };
  resetToStart: { reason: 'finalCountdown' | 'cancelConfirmed' | 'emptyCartCancel' | 'inactivityTimeout' | 'staffReset' | 'runtimeRecovery' | 'mockScenarioReset' };
};

export function createCommand<TType extends CommandType>(
  type: TType,
  payload: CommandPayloadByType[TType],
  source: CommandSource = 'touch'
): Extract<SelfCheckoutCommand, { type: TType }> {
  return {
    type,
    commandId: nextCommandId(),
    issuedAt: new Date().toISOString(),
    source,
    payload
  } as Extract<SelfCheckoutCommand, { type: TType }>;
}
