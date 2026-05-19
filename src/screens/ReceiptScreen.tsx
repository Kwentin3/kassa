import { CheckCircle2, QrCode, RotateCcw } from 'lucide-react';
import { products } from '../data/products';
import { useTerminalStore } from '../state/store';
import { Header } from '../components/Header';
import { Button, Screen } from '../components/ui';

export const ReceiptScreen = () => {
  const { state, receipt, resetSession, dispatch } = useTerminalStore();

  if (state.name === 'receipt_error') {
    return (
      <Screen>
        <Header compact />
        <section className="flex h-[calc(100vh-104px)] items-center justify-center px-8 pb-8">
          <div className="panel w-[860px] p-10">
            <div className="text-[42px] font-black text-red-700">Чек не сформирован</div>
            <p className="mt-4 text-[26px] font-semibold text-slate-700">{state.reason}</p>
            <p className="mt-2 text-[20px] font-semibold text-slate-500">Оплата в mock-сценарии уже прошла. Нужен сотрудник.</p>
            <Button className="mt-8" onClick={() => dispatch({ type: 'REQUEST_HELP', source: 'Ошибка чека' })}>Позвать сотрудника</Button>
          </div>
        </section>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header compact />
      <section className="grid h-[calc(100vh-104px)] grid-cols-[1fr_420px] gap-8 px-8 pb-8">
        <div className="panel p-8">
          <div className="flex items-center gap-4">
            <CheckCircle2 size={56} className="text-emerald-600" />
            <div>
              <div className="text-[42px] font-black">Оплата прошла</div>
              <div className="text-[20px] font-semibold text-slate-500">Mock-чек {receipt?.id}</div>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {receipt?.items.map((item) => {
              const product = products.find((entry) => entry.id === item.productId)!;
              return (
                <div className="flex justify-between rounded-lg bg-slate-50 px-5 py-4 text-[22px] font-bold" key={item.productId}>
                  <span>{product.name} × {item.quantity}</span>
                  <span>{item.unitPrice * item.quantity} ₽</span>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex items-end justify-between border-t border-slate-200 pt-5">
            <span className="text-[24px] font-bold text-slate-500">Итого</span>
            <span className="text-[52px] font-black">{receipt?.total ?? 0} ₽</span>
          </div>
        </div>
        <aside className="panel flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="flex h-52 w-52 items-center justify-center rounded-lg border-8 border-slate-900 bg-white">
            <QrCode size={150} />
          </div>
          <div className="text-[21px] font-bold text-slate-600">QR и электронный чек показаны как mock-данные.</div>
          <Button className="w-full" onClick={resetSession}>
            <RotateCcw size={24} /> Готово
          </Button>
        </aside>
      </section>
    </Screen>
  );
};
