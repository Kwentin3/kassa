import { promoSlides } from '../data/promoSlides';
import { useTerminalStore } from '../state/store';
import { Screen } from '../components/ui';

export const IdlePromotionScreen = () => {
  const { state, activeBrand, dispatch } = useTerminalStore();
  const slide = state.name === 'promo_idle' ? promoSlides.find((item) => item.id === state.slideId) : undefined;

  if (!slide || slide.brokenAsset) {
    window.setTimeout(() => dispatch({ type: 'RESET_SESSION' }), 0);
    return null;
  }

  return (
    <Screen>
      <button className="h-full w-full text-left" onClick={() => dispatch({ type: 'PROMO_TOUCH' })}>
        <div className="flex h-full flex-col md:flex-row">
          <section className="flex min-w-0 flex-1 flex-col justify-between overflow-y-auto px-[var(--screen-pad)] py-10">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-[30px] font-black text-white">{activeBrand.logoText}</div>
              <div>
                <div className="text-[34px] font-black">{activeBrand.storeName}</div>
                <div className="text-[20px] font-bold text-slate-600">Терминал {activeBrand.terminalNumber}</div>
              </div>
            </div>
            <div>
              <div className="mb-5 inline-flex rounded-lg bg-[var(--brand-accent)] px-5 py-3 text-[22px] font-black text-white">{slide.badge}</div>
              <h1 className="max-w-[860px] text-[clamp(44px,7vw,76px)] font-black leading-[1.02]">{slide.title}</h1>
              <p className="mt-5 max-w-[760px] text-[clamp(24px,3vw,32px)] font-semibold leading-tight text-slate-700">{slide.subtitle}</p>
            </div>
            <div className="rounded-lg bg-white px-8 py-6 text-center text-[34px] font-black shadow-xl">{slide.ctaText}</div>
          </section>
          <section className="hidden w-[38%] items-center justify-center bg-[var(--brand-primary)] md:flex">
            <div className="flex h-[66%] w-[72%] items-center justify-center rounded-lg bg-white/90 text-center text-[56px] font-black text-slate-900 shadow-2xl">
              {slide.title.slice(0, 2).toLocaleUpperCase('ru-RU')}
            </div>
          </section>
        </div>
      </button>
    </Screen>
  );
};
