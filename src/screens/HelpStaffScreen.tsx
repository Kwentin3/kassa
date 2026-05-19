import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { verifyStaffPin } from '../services/staff';
import { useTerminalStore } from '../state/store';
import { Header } from '../components/Header';
import { Button, Screen, TextInput } from '../components/ui';

export const HelpStaffScreen = () => {
  const { state, dispatch, resetSession } = useTerminalStore();
  const [pin, setPin] = useState('0000');
  const [error, setError] = useState('');

  if (state.name === 'staff_mode') {
    return (
      <Screen>
        <Header compact />
        <section className="flex h-[calc(100vh-104px)] items-center justify-center px-8 pb-8">
          <div className="panel w-[900px] p-10">
            <div className="text-[20px] font-bold text-slate-500">Mock staff mode</div>
            <div className="text-[44px] font-black">Служебные действия</div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Button onClick={() => dispatch({ type: 'START_PURCHASE' })}>Подтвердить и вернуться</Button>
              <Button variant="secondary" onClick={() => dispatch({ type: 'START_PURCHASE' })}>Вернуться к покупке</Button>
              <Button variant="secondary" onClick={resetSession}>Завершить сессию</Button>
              <Button variant="danger" onClick={resetSession}>Сбросить терминал</Button>
              <Button variant="secondary" onClick={() => dispatch({ type: 'OPEN_BRANDING_DEMO' })}>Открыть DEMO панель</Button>
            </div>
            <p className="mt-6 text-[20px] font-semibold text-slate-500">Это не реальная авторизация и не кассовая смена.</p>
          </div>
        </section>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header compact />
      <section className="flex h-[calc(100vh-104px)] items-center justify-center px-8 pb-8">
        <div className="panel w-[820px] p-10 text-center">
          <ShieldCheck size={72} className="mx-auto text-[var(--brand-primary)]" />
          <div className="mt-4 text-[44px] font-black">Сотрудник уже идёт</div>
          <p className="mt-3 text-[24px] font-semibold text-slate-600">Причина: {state.name === 'help_requested' ? state.source : 'Помощь покупателю'}</p>
          <form
            className="mx-auto mt-8 flex max-w-[520px] gap-3"
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
          <Button className="mt-5" variant="secondary" onClick={() => dispatch({ type: 'START_PURCHASE' })}>Вернуться к покупке</Button>
        </div>
      </section>
    </Screen>
  );
};
