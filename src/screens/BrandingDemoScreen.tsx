import { ArrowLeft, BadgeCheck, MonitorCog } from 'lucide-react';
import { brands } from '../data/brands';
import { paymentScenarios } from '../data/paymentScenarios';
import { useTerminalStore } from '../state/store';
import { Header } from '../components/Header';
import { Button, Screen, TextInput } from '../components/ui';

export const BrandingDemoScreen = () => {
  const {
    state,
    activeBrand,
    demo,
    setBrand,
    updateBrandConfig,
    setPaymentScenario,
    setReceiptScenario,
    setScannerMode,
    toggleEdgeCases,
    toggleIdlePromo,
    resetSession,
    dispatch
  } = useTerminalStore();
  const locked = state.name === 'payment_pending';

  return (
    <Screen>
      <Header compact />
      <section className="h-[calc(100vh-104px)] overflow-auto px-8 pb-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-[18px] font-black text-white">
              <MonitorCog size={22} /> DEMO / Настройка прототипа
            </div>
            <div className="mt-3 text-[40px] font-black">Quick Branding и Demo Control Panel</div>
          </div>
          <Button variant="secondary" onClick={() => dispatch({ type: 'START_PURCHASE' })}>
            <ArrowLeft size={24} /> В покупку
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-5">
          <section className="panel p-5">
            <div className="text-[26px] font-black">Бренд</div>
            <div className="mt-4 space-y-3">
              {brands.map((brand) => (
                <button
                  className={`flex min-h-[78px] w-full items-center gap-4 rounded-lg border p-3 text-left ${activeBrand.id === brand.id ? 'border-[var(--brand-primary)] bg-emerald-50' : 'border-slate-200 bg-white'}`}
                  key={brand.id}
                  onClick={() => setBrand(brand.id)}
                  disabled={locked}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg text-[20px] font-black text-white" style={{ background: brand.primaryColor }}>{brand.logoText}</span>
                  <span>
                    <span className="block text-[20px] font-black">{brand.storeName}</span>
                    <span className="block text-[15px] font-semibold text-slate-500">{brand.tagline}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="panel p-5">
            <div className="text-[26px] font-black">Быстрая правка</div>
            <label className="mt-4 block text-[18px] font-bold text-slate-500">Название магазина</label>
            <TextInput value={activeBrand.storeName} disabled={locked} onChange={(event) => updateBrandConfig({ storeName: event.target.value })} />
            <label className="mt-4 block text-[18px] font-bold text-slate-500">Логотип-текст</label>
            <TextInput value={activeBrand.logoText} disabled={locked} maxLength={4} onChange={(event) => updateBrandConfig({ logoText: event.target.value.slice(0, 4).toUpperCase() })} />
            <label className="mt-4 block text-[18px] font-bold text-slate-500">Основной цвет</label>
            <input
              aria-label="Основной цвет интерфейса"
              className="mt-2 h-16 w-full rounded-lg border border-slate-300 bg-white p-2"
              disabled={locked}
              type="color"
              value={activeBrand.primaryColor}
              onChange={(event) => updateBrandConfig({ primaryColor: event.target.value })}
            />
          </section>
          <section className="panel p-5">
            <div className="text-[26px] font-black">Сценарии</div>
            <label className="mt-4 block text-[18px] font-bold text-slate-500">Оплата</label>
            <select className="mt-2 min-h-[58px] w-full rounded-lg border border-slate-300 px-3 text-[18px] font-bold" value={demo.paymentScenarioId} onChange={(event) => setPaymentScenario(event.target.value)} disabled={locked}>
              {paymentScenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.label}</option>)}
            </select>
            <label className="mt-4 block text-[18px] font-bold text-slate-500">Чек</label>
            <select className="mt-2 min-h-[58px] w-full rounded-lg border border-slate-300 px-3 text-[18px] font-bold" value={demo.receiptScenarioId} onChange={(event) => setReceiptScenario(event.target.value as 'receipt_success' | 'receipt_failed_after_payment')} disabled={locked}>
              <option value="receipt_success">Чек: успешно</option>
              <option value="receipt_failed_after_payment">Чек: ошибка после оплаты</option>
            </select>
            <label className="mt-4 block text-[18px] font-bold text-slate-500">Сканер</label>
            <select className="mt-2 min-h-[58px] w-full rounded-lg border border-slate-300 px-3 text-[18px] font-bold" value={demo.scannerMode} onChange={(event) => setScannerMode(event.target.value as 'camera' | 'mock_input' | 'keyboard')} disabled={locked}>
              <option value="camera">Камера</option>
              <option value="mock_input">Mock input</option>
              <option value="keyboard">Keyboard scanner</option>
            </select>
          </section>
          <section className="panel p-5">
            <div className="text-[26px] font-black">Тексты</div>
            <label className="mt-4 block text-[18px] font-bold text-slate-500">Приветствие</label>
            <TextInput value={activeBrand.welcomeText} disabled={locked} onChange={(event) => updateBrandConfig({ welcomeText: event.target.value })} />
            <label className="mt-4 block text-[18px] font-bold text-slate-500">Подпись</label>
            <TextInput value={activeBrand.tagline} disabled={locked} onChange={(event) => updateBrandConfig({ tagline: event.target.value })} />
            <label className="mt-4 block text-[18px] font-bold text-slate-500">Номер терминала</label>
            <TextInput value={activeBrand.terminalNumber} disabled={locked} onChange={(event) => updateBrandConfig({ terminalNumber: event.target.value })} />
          </section>
          <section className="panel p-5">
            <div className="text-[26px] font-black">Управление demo</div>
            <div className="mt-4 space-y-3">
              <Button className="w-full" variant={demo.idlePromoEnabled ? 'primary' : 'secondary'} disabled={locked} onClick={toggleIdlePromo}>
                <BadgeCheck size={22} /> Idle promo: {demo.idlePromoEnabled ? 'вкл' : 'выкл'}
              </Button>
              <Button className="w-full" variant={demo.edgeCasesEnabled ? 'primary' : 'secondary'} disabled={locked} onClick={toggleEdgeCases}>
                Edge cases: {demo.edgeCasesEnabled ? 'вкл' : 'выкл'}
              </Button>
              <Button className="w-full" variant="secondary" disabled={locked} onClick={() => dispatch({ type: 'REQUEST_HELP', source: 'Demo staff scenario' })}>Показать staff scenario</Button>
              <Button className="w-full" variant="danger" disabled={locked} onClick={resetSession}>Сбросить сессию</Button>
            </div>
            {locked && <div className="mt-4 rounded-lg bg-amber-50 p-4 text-[18px] font-bold text-amber-800">Во время оплаты панель только для просмотра.</div>}
          </section>
        </div>
      </section>
    </Screen>
  );
};
