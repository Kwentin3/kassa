import { CreditCard } from 'lucide-react';
import { CartPanel } from '../components/CartPanel';
import { Header } from '../components/Header';
import { ScannerPanel } from '../components/ScannerPanel';
import { Button, Screen } from '../components/ui';
import { useTerminalStore } from '../state/store';

export const CartScreen = () => {
  const { cart, scannerMessage, dispatch } = useTerminalStore();
  return (
    <Screen>
      <Header compact />
      <div className="grid h-[calc(100vh-104px)] grid-cols-[1fr_410px] overflow-hidden">
        <section className="space-y-5 overflow-auto px-8 pb-8">
          <ScannerPanel />
          {scannerMessage && <div className="rounded-lg bg-emerald-50 px-5 py-4 text-[22px] font-black text-emerald-800">{scannerMessage}</div>}
          <div className="panel p-6">
            <div className="text-[20px] font-bold text-slate-500">Следующий шаг</div>
            <div className="mt-2 text-[34px] font-black">Проверьте корзину и переходите к оплате</div>
            <div className="mt-5 flex gap-4">
              <Button disabled={cart.length === 0} onClick={() => dispatch({ type: 'GO_TO_PAYMENT', cartIsEmpty: cart.length === 0 })}>
                <CreditCard size={28} /> Оплатить
              </Button>
              <Button variant="secondary" onClick={() => dispatch({ type: 'REQUEST_HELP', source: 'Отмена покупки' })}>
                Отменить покупку
              </Button>
            </div>
          </div>
        </section>
        <CartPanel />
      </div>
    </Screen>
  );
};
