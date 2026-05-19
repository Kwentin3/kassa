import { ScanLine, ShoppingBasket } from 'lucide-react';
import { useEffect } from 'react';
import { appConfig } from '../config/appConfig';
import { promoSlides } from '../data/promoSlides';
import { useTerminalStore } from '../state/store';
import { Header } from '../components/Header';
import { Button, Screen } from '../components/ui';

export const IdleScreen = () => {
  const { activeBrand, demo, startPurchase, openPromo, state } = useTerminalStore();

  useEffect(() => {
    if (!demo.idlePromoEnabled || state.name !== 'idle') return undefined;
    const timer = window.setTimeout(openPromo, appConfig.idlePromoDelaySec * 1000);
    return () => window.clearTimeout(timer);
  }, [demo.idlePromoEnabled, openPromo, state.name]);

  return (
    <Screen>
      <Header />
      <section className="grid h-[calc(100vh-112px)] grid-cols-[1.05fr_0.95fr] gap-8 px-8 pb-8">
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit rounded-lg bg-white px-4 py-2 text-[18px] font-bold text-slate-600 shadow-sm">
            Терминал {activeBrand.terminalNumber}
          </div>
          <h1 className="max-w-[760px] text-[64px] font-black leading-[1.02] text-slate-950">{activeBrand.welcomeText}</h1>
          <p className="mt-5 max-w-[620px] text-[28px] font-semibold leading-tight text-slate-700">{activeBrand.tagline}</p>
          <div className="mt-9 flex gap-4">
            <Button className="min-h-[86px] px-9 text-[26px]" onClick={startPurchase}>
              <ShoppingBasket size={32} /> Начать покупку
            </Button>
            <Button variant="secondary" className="min-h-[86px] px-9 text-[24px]" onClick={() => useTerminalStore.getState().addCode('4600001000011')}>
              <ScanLine size={30} /> Demo scan
            </Button>
          </div>
        </div>
        <div className="flex items-center">
          <div className="relative h-[78%] w-full overflow-hidden rounded-lg border border-white/80 bg-white shadow-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#e4f2ef,#fff7e8)]" />
            <div className="absolute left-8 top-8 rounded-lg bg-[var(--brand-primary)] px-5 py-3 text-[22px] font-black text-white">
              {promoSlides[0].badge}
            </div>
            <div className="absolute bottom-8 left-8 right-8">
              <div className="text-[44px] font-black leading-tight text-slate-950">Сканируйте товары сами</div>
              <div className="mt-3 text-[24px] font-semibold text-slate-700">Камера, поиск, каталог и mock-оплата в одном web-терминале.</div>
            </div>
          </div>
        </div>
      </section>
    </Screen>
  );
};
