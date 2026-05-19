import { Clock } from 'lucide-react';
import { useTerminalStore } from '../state/store';
import { Button, Screen } from '../components/ui';

export const SessionTimeoutScreen = () => {
  const { dispatch, resetSession } = useTerminalStore();
  return (
    <Screen className="flex items-center justify-center">
      <div className="panel w-[820px] p-10 text-center">
        <Clock size={76} className="mx-auto text-amber-600" />
        <div className="mt-4 text-[44px] font-black">Продолжить покупку?</div>
        <p className="mt-3 text-[24px] font-semibold text-slate-600">Терминал скоро очистит корзину из-за бездействия.</p>
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={() => dispatch({ type: 'SESSION_CONTINUE' })}>Продолжить</Button>
          <Button variant="danger" onClick={resetSession}>Сбросить</Button>
        </div>
      </div>
    </Screen>
  );
};
