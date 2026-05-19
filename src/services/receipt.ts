import type { CartItem, Receipt } from '../types';
import { cartTotal } from './cart';

let receiptCounter = 1;

export const createMockReceipt = (items: CartItem[], shouldFail = false): Receipt => {
  const createdAt = new Date();
  const id = `MCK-${createdAt.toISOString().slice(0, 10).replace(/-/g, '')}-${String(receiptCounter++).padStart(6, '0')}`;
  return {
    id,
    createdAt: createdAt.toISOString(),
    items,
    total: cartTotal(items),
    qrPayload: `mock-receipt:${id}`,
    status: shouldFail ? 'failed' : 'success'
  };
};

export const resetReceiptCounter = (): void => {
  receiptCounter = 1;
};
