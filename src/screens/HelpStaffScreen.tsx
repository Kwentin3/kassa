import { ShieldCheck } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { products } from '../data/products';
import { verifyStaffPin } from '../services/staff';
import { isReceiptIssueState } from '../state/machine';
import { useTerminalStore } from '../state/store';
import { Header } from '../components/Header';
import { Button, Screen, TextInput } from '../components/ui';

export const HelpStaffScreen = () => {
  const { state, cart, dispatch, removeItem, resetSession, resolveReceiptError } = useTerminalStore();
  const [pin, setPin] = useState('0000');
  const [error, setError] = useState('');
  const receiptIssue = isReceiptIssueState(state);

  if (state.name === 'staff_mode') {
    return (
      <Screen>
        <Header compact />
        <section className="screen-body center-layout">
          <div className="panel responsive-panel" style={{ '--panel-max': '900px' } as CSSProperties}>
            <div className="text-[20px] font-bold text-slate-500">Mock staff mode</div>
            <div className="text-[44px] font-black">Служебные действия</div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {!receiptIssue && <Button onClick={() => dispatch({ type: 'START_PURCHASE' })}>Подтвердить и вернуться</Button>}
              {!receiptIssue && <Button variant="secondary" onClick={() => dispatch({ type: 'START_PURCHASE' })}>Вернуться к покупке</Button>}
              {receiptIssue && <Button onClick={resolveReceiptError}>Закрыть ошибку чека</Button>}
              <Button variant="secondary" onClick={resetSession}>Завершить сессию</Button>
              <Button variant="danger" onClick={resetSession}>Сбросить терминал</Button>
              {!receiptIssue && <Button variant="secondary" onClick={() => dispatch({ type: 'OPEN_BRANDING_DEMO' })}>Открыть DEMO панель</Button>}
            </div>
            {cart.length > 0 && !receiptIssue && (
              <div className="mt-6 rounded-lg bg-slate-50 p-4">
                <div className="text-[20px] font-black">Удалить позицию</div>
                <div className="mt-3 space-y-2">
                  {cart.map((item) => {
                    const product = products.find((entry) => entry.id === item.productId);
                    return (
                      <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 text-[18px] font-bold" key={item.productId}>
                        <span>{product?.name ?? item.productId} × {item.quantity}</span>
                        <Button className="min-h-[54px] px-4 text-[17px]" variant="secondary" onClick={() => removeItem(item.productId)}>Удалить</Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <p className="mt-6 text-[20px] font-semibold text-slate-500">Это не реальная авторизация и не кассовая смена.</p>
          </div>
        </section>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header compact />
      <section className="screen-body center-layout">
        <div className="panel responsive-panel text-center" style={{ '--panel-max': '820px' } as CSSProperties}>
          <ShieldCheck size={72} className="mx-auto text-[var(--brand-primary)]" />
          <div className="mt-4 text-[44px] font-black">Сотрудник уже идёт</div>
          <p className="mt-3 text-[24px] font-semibold text-slate-600">Причина: {state.name === 'help_requested' ? state.source : 'Помощь покупателю'}</p>
          <form
            className="mx-auto mt-8 flex max-w-[520px] flex-wrap gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (verifyStaffPin(pin)) dispatch({ type: 'ENTER_STAFF_MODE', source: 'PIN' });
              else setError('Неверный demo PIN');
            }}
          >
            <TextInput value={pin} onChange={(event) => setPin(event.target.value)} aria-label="Demo PIN сотрудника" />
            <Button type="submit">Войти</Button>
          </form>
          {error && <div className="mt-3 text-[18px] font-bold text-red-700">{error}</div>}
          {!receiptIssue && <Button className="mt-5" variant="secondary" onClick={() => dispatch({ type: 'START_PURCHASE' })}>Вернуться к покупке</Button>}
        </div>
      </section>
    </Screen>
  );
};
