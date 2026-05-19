import { LifeBuoy, Settings } from 'lucide-react';
import { appConfig } from '../config/appConfig';
import { useTerminalStore } from '../state/store';
import { Button } from './ui';

export const Header = ({ compact = false }: { compact?: boolean }) => {
  const { activeBrand, state, dispatch } = useTerminalStore();
  const canOpenDemo = state.name !== 'payment_pending';
  return (
    <header className="flex items-center justify-between gap-4 px-8 py-5">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-[24px] font-black text-white">
          {activeBrand.logoText}
        </div>
        <div>
          <div className="text-[24px] font-black leading-tight">{activeBrand.storeName}</div>
          {!compact && <div className="text-[17px] font-semibold text-slate-600">Терминал {activeBrand.terminalNumber} · {appConfig.appVersion}</div>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {appConfig.enableQuickBranding && (
          <Button
            variant="secondary"
            className="min-h-[56px] px-4 text-[18px]"
            disabled={!canOpenDemo}
            onClick={() => dispatch({ type: 'OPEN_BRANDING_DEMO' })}
            title="DEMO / Настройка прототипа"
          >
            <Settings size={22} /> DEMO
          </Button>
        )}
        <Button
          variant="secondary"
          className="min-h-[56px] px-4 text-[18px]"
          onClick={() => dispatch({ type: 'REQUEST_HELP', source: 'Кнопка помощи' })}
        >
          <LifeBuoy size={24} /> Помощь
        </Button>
      </div>
    </header>
  );
};
