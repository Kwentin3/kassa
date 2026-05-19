import { Clock } from 'lucide-react';
import { useEffect, type CSSProperties } from 'react';
import { appConfig } from '../config/appConfig';
import { useTerminalStore } from '../state/store';
import { Button, Screen } from '../components/ui';

export const SessionTimeoutScreen = () => {
  const { dispatch, resetSession } = useTerminalStore();
  useEffect(() => {
    const timer = window.setTimeout(resetSession, appConfig.sessionTimeoutWarningSec * 1000);
    return () => window.clearTimeout(timer);
  }, [resetSession]);

  return (
    <Screen className="center-layout p-[var(--screen-pad)]">
      <div className="panel responsive-panel text-center" style={{ '--panel-max': '820px' } as CSSProperties}>
        <Clock size={76} className="mx-auto text-amber-600" />
        <div className="mt-4 text-[44px] font-black">Продолжить покупку?</div>
        <p className="mt-3 text-[24px] font-semibold text-slate-600">Терминал скоро очистит корзину из-за бездействия.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button onClick={() => dispatch({ type: 'SESSION_CONTINUE' })}>Продолжить</Button>
          <Button variant="danger" onClick={resetSession}>Сбросить</Button>
        </div>
      </div>
    </Screen>
  );
};
