import { paymentScenarios } from '../data/paymentScenarios';
import type { PaymentMethod, PaymentOutcome, PaymentScenario } from '../types';

export const getPaymentScenario = (id: string, method?: PaymentMethod): PaymentScenario => {
  const scenario = paymentScenarios.find((item) => item.id === id && (!method || item.method === method));
  if (scenario) return scenario;
  return method === 'sbp'
    ? paymentScenarios.find((item) => item.id === 'sbp_paid')!
    : paymentScenarios.find((item) => item.id === 'card_success')!;
};

export const scenarioMessage = (outcome: PaymentOutcome): string => {
  switch (outcome) {
    case 'success':
      return 'Оплата подтверждена';
    case 'declined':
      return 'Банк отклонил оплату. Попробуйте ещё раз или выберите другой способ.';
    case 'timeout':
      return 'Время ожидания оплаты истекло.';
    case 'connection_error':
      return 'Нет связи с mock-терминалом оплаты.';
    case 'cancelled':
      return 'Оплата отменена покупателем.';
    case 'not_paid':
      return 'Оплата по QR пока не найдена.';
  }
};

export const runPaymentScenario = async (scenario: PaymentScenario): Promise<PaymentOutcome> =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(scenario.outcome), scenario.delayMs);
  });
