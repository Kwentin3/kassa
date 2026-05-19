import { ArrowLeft, CreditCard, QrCode } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useTerminalStore } from '../state/store';
import { Button, Screen } from '../components/ui';
import { Header } from '../components/Header';

export const PaymentScreen = () => {
  const { state, dispatch, startPayment, selectCartTotal } = useTerminalStore();

  if (state.name === 'payment_pending') {
    return (
      <Screen>
        <Header compact />
        <section className="screen-body center-layout">
          <div className="panel responsive-panel text-center" style={{ '--panel-max': '760px' } as CSSProperties}>
            <div className="mx-auto mb-6 h-20 w-20 animate-pulse rounded-lg bg-[var(--brand-primary)]" />
            <div className="text-[44px] font-black">{state.method === 'sbp' ? 'Ожидаем оплату по QR' : 'Ожидаем оплату картой'}</div>
            {state.method === 'sbp' && (
              <div className="mx-auto mt-6 flex h-52 w-52 items-center justify-center rounded-lg border-8 border-slate-900 bg-white">
                <QrCode size={150} />
              </div>
            )}
            <p className="mt-4 text-[24px] font-semibold text-slate-600">Это mock-оплата. Карточные данные не вводятся и не сохраняются.</p>
            {state.method === 'sbp' && <p className="mt-3 text-[20px] font-bold text-slate-500">QR демонстрационный и не ведёт к реальному платежу.</p>}
          </div>
        </section>
      </Screen>
    );
  }

  if (state.name === 'payment_error') {
    return (
      <Screen>
        <Header compact />
        <section className="screen-body center-layout">
          <div className="panel responsive-panel" style={{ '--panel-max': '860px' } as CSSProperties}>
            <div className="text-[42px] font-black text-red-700">Оплата не прошла</div>
            <p className="mt-4 text-[26px] font-semibold text-slate-700">{state.reason}</p>
            <div className="mt-8 flex flex-wrap gap-4">
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
      <section className="screen-body center-layout">
        <div className="panel responsive-panel" style={{ '--panel-max': '980px' } as CSSProperties}>
          <Button variant="secondary" onClick={() => dispatch({ type: 'START_PURCHASE' })}>
            <ArrowLeft size={24} /> В корзину
          </Button>
          <div className="mt-8 text-[22px] font-bold text-slate-500">К оплате</div>
          <div className="text-[64px] font-black">{selectCartTotal()} ₽</div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
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
