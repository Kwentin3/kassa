import { ArrowLeft, CreditCard, QrCode } from 'lucide-react';
import { useTerminalStore } from '../state/store';
import { Button, Screen } from '../components/ui';
import { Header } from '../components/Header';

export const PaymentScreen = () => {
  const { state, dispatch, startPayment, selectCartTotal } = useTerminalStore();

  if (state.name === 'payment_pending') {
    return (
      <Screen>
        <Header compact />
        <section className="flex h-[calc(100vh-104px)] items-center justify-center px-8 pb-8">
          <div className="panel w-[760px] p-10 text-center">
            <div className="mx-auto mb-6 h-20 w-20 animate-pulse rounded-lg bg-[var(--brand-primary)]" />
            <div className="text-[44px] font-black">{state.method === 'sbp' ? 'Ожидаем оплату по QR' : 'Ожидаем оплату картой'}</div>
            <p className="mt-4 text-[24px] font-semibold text-slate-600">Это mock-оплата. Карточные данные не вводятся и не сохраняются.</p>
          </div>
        </section>
      </Screen>
    );
  }

  if (state.name === 'payment_error') {
    return (
      <Screen>
        <Header compact />
        <section className="flex h-[calc(100vh-104px)] items-center justify-center px-8 pb-8">
          <div className="panel w-[860px] p-10">
            <div className="text-[42px] font-black text-red-700">Оплата не прошла</div>
            <p className="mt-4 text-[26px] font-semibold text-slate-700">{state.reason}</p>
            <div className="mt-8 flex gap-4">
              <Button onClick={() => dispatch({ type: 'GO_TO_PAYMENT', cartIsEmpty: false })}>Попробовать снова</Button>
              <Button variant="secondary" onClick={() => dispatch({ type: 'START_PURCHASE' })}>Вернуться в корзину</Button>
              <Button variant="secondary" onClick={() => dispatch({ type: 'REQUEST_HELP', source: 'Ошибка оплаты' })}>Помощь</Button>
            </div>
          </div>
        </section>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header compact />
      <section className="flex h-[calc(100vh-104px)] items-center justify-center px-8 pb-8">
        <div className="panel w-[980px] p-10">
          <Button variant="secondary" onClick={() => dispatch({ type: 'START_PURCHASE' })}>
            <ArrowLeft size={24} /> В корзину
          </Button>
          <div className="mt-8 text-[22px] font-bold text-slate-500">К оплате</div>
          <div className="text-[64px] font-black">{selectCartTotal()} ₽</div>
          <div className="mt-8 grid grid-cols-2 gap-5">
            <Button className="min-h-[150px] flex-col text-[30px]" onClick={() => startPayment('card')}>
              <CreditCard size={46} /> Картой
            </Button>
            <Button className="min-h-[150px] flex-col text-[30px]" variant="secondary" onClick={() => startPayment('sbp')}>
              <QrCode size={46} /> СБП QR
            </Button>
          </div>
          <p className="mt-6 text-[20px] font-semibold text-slate-500">Демонстрационный режим: реальные платежи и фискализация не выполняются.</p>
        </div>
      </section>
    </Screen>
  );
};
