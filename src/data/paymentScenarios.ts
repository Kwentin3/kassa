import type { PaymentScenario } from '../types';

export const paymentScenarios: PaymentScenario[] = [
  { id: 'card_success', label: 'Карта: успешно', method: 'card', outcome: 'success', delayMs: 1200 },
  { id: 'card_declined', label: 'Карта: отказ', method: 'card', outcome: 'declined', delayMs: 1200 },
  { id: 'card_timeout', label: 'Карта: таймаут', method: 'card', outcome: 'timeout', delayMs: 1700 },
  { id: 'card_connection_error', label: 'Карта: нет связи', method: 'card', outcome: 'connection_error', delayMs: 1200 },
  { id: 'card_cancelled', label: 'Карта: отмена', method: 'card', outcome: 'cancelled', delayMs: 900 },
  { id: 'sbp_qr_shown', label: 'СБП: QR показан', method: 'sbp', outcome: 'not_paid', delayMs: 1600 },
  { id: 'sbp_paid', label: 'СБП: оплачено', method: 'sbp', outcome: 'success', delayMs: 1500 },
  { id: 'sbp_not_paid', label: 'СБП: не оплачено', method: 'sbp', outcome: 'not_paid', delayMs: 1600 },
  { id: 'sbp_timeout', label: 'СБП: QR истёк', method: 'sbp', outcome: 'timeout', delayMs: 1700 },
  { id: 'sbp_cancelled', label: 'СБП: отмена', method: 'sbp', outcome: 'cancelled', delayMs: 900 }
];
