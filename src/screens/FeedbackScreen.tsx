import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useTerminalStore } from '../state/store';
import { Screen } from '../components/ui';

export const FeedbackScreen = () => {
  const { state } = useTerminalStore();
  if (state.name !== 'scan_feedback') return null;
  const success = state.result === 'success';
  return (
    <Screen className="center-layout p-[var(--screen-pad)]">
      <div className="panel responsive-panel text-center" style={{ '--panel-max': '760px' } as CSSProperties}>
        {success ? <CheckCircle2 size={84} className="mx-auto text-emerald-600" /> : <AlertTriangle size={84} className="mx-auto text-amber-600" />}
        <div className="mt-5 text-[44px] font-black">{state.message}</div>
        {!success && <div className="mt-4 text-[24px] font-semibold text-slate-600">Попробуйте ещё раз, найдите товар вручную или позовите сотрудника.</div>}
      </div>
    </Screen>
  );
};
