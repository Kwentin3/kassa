import { AlertTriangle, CheckCircle2, CreditCard, Minus, PackagePlus, Plus, ScanLine, Search, ShieldCheck, ShoppingBasket, Trash2, UserCheck, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { createRuntimeAdapterFactory, type RuntimeAdapterFactoryResult } from './runtime/adapterFactory';
import { createCommand, type CommandPayloadByType } from './runtime/commands';
import { BOLARS_ROUTE, DEFAULT_TEXTS, MOCK_PRODUCTS } from './runtime/defaults';
import { exposeBolarsSelfCheckoutApi } from './runtime/webApi';
import type { AlertNotification, CartLine, CommandSource, CommandType, CurrentScreen, RuntimeDebugState, SelfCheckoutRuntimePort, SelfCheckoutStateSnapshot, TextScale } from './runtime/types';
import { bolarsLightDefaultTokens } from './theme/bolarsTheme';

const useRuntimeSnapshot = (runtime: SelfCheckoutRuntimePort) =>
  useSyncExternalStore(
    (listener) => runtime.subscribe(() => listener()),
    () => runtime.getState(),
    () => runtime.getState()
  );

type RuntimeActions = {
  send: <T extends CommandType>(type: T, payload: CommandPayloadByType[T], source?: CommandSource) => void;
};

type TextKey = keyof typeof DEFAULT_TEXTS;

const copy = (snapshot: SelfCheckoutStateSnapshot, key: TextKey): string => snapshot.uiConfig.texts[key] ?? DEFAULT_TEXTS[key];

export const BolarsSelfCheckoutApp = () => {
  const factory = useMemo(() => createRuntimeAdapterFactory(window.location.href), []);
  const snapshot = useRuntimeSnapshot(factory.runtime);

  useEffect(() => {
    exposeBolarsSelfCheckoutApi(factory);
  }, [factory]);

  const send: RuntimeActions['send'] = useCallback(
    (type, payload, source = 'touch') => {
      void factory.runtime.dispatch(createCommand(type, payload, source));
    },
    [factory.runtime]
  );

  useEffect(() => {
    if (snapshot.currentScreen !== 'finalSuccess' || snapshot.adapterKind === 'preview') return undefined;
    const timer = window.setTimeout(() => send('resetToStart', { reason: 'finalCountdown' }, 'system'), snapshot.uiConfig.finalAutoResetSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [send, snapshot.adapterKind, snapshot.currentScreen, snapshot.uiConfig.finalAutoResetSeconds]);

  return (
    <main className={`bolars-root bolars-scale-${snapshot.textScale}`} style={bolarsLightDefaultTokens as CSSProperties}>
      <div className="bolars-stage">
        {renderScreen(snapshot, { send })}
        {snapshot.alerts.length > 0 && <AlertStack alerts={snapshot.alerts} />}
        {snapshot.modalState.type !== 'none' && <BolarsModal snapshot={snapshot} send={send} />}
      </div>
      {factory.debugMode && <DebugPanel runtime={factory.runtime} factory={factory} />}
      {factory.previewMode && factory.preview && <PreviewPanel factory={factory} currentScenario={snapshot.previewScenarioId} textScale={snapshot.textScale} />}
    </main>
  );
};

const renderScreen = (snapshot: SelfCheckoutStateSnapshot, actions: RuntimeActions) => {
  switch (snapshot.currentScreen) {
    case 'cart':
      return <CartScreen snapshot={snapshot} send={actions.send} />;
    case 'paymentSetup':
      return <PaymentSetupScreen snapshot={snapshot} send={actions.send} />;
    case 'paymentWaiting':
      return <PaymentWaitingScreen snapshot={snapshot} />;
    case 'paymentError':
      return <PaymentErrorScreen snapshot={snapshot} send={actions.send} />;
    case 'finalSuccess':
      return <FinalSuccessScreen snapshot={snapshot} />;
    case 'start':
    default:
      return <StartScreen snapshot={snapshot} send={actions.send} />;
  }
};

const WorkHeader = ({ title, snapshot, send }: { title: string; snapshot: SelfCheckoutStateSnapshot; send: RuntimeActions['send'] }) => (
  <header className="bolars-work-header">
    <div>
      <div className="bolars-logo">БОЛАРС</div>
      <h1>{title}</h1>
    </div>
    <div className="bolars-header-actions">
      {snapshot.manager.status === 'bound' && (
        <div className="bolars-manager-badge">
          <UserCheck size={22} /> Менеджер: {snapshot.manager.displayName}
        </div>
      )}
      <div className="bolars-scale-control" aria-label="Размер текста">
        {(['normal', 'large', 'extraLarge'] as TextScale[]).map((scale) => (
          <button key={scale} className={snapshot.textScale === scale ? 'active' : ''} type="button" onClick={() => send('setTextScale', { scale })}>
            {scale === 'normal' ? 'A' : scale === 'large' ? 'A+' : 'A++'}
          </button>
        ))}
      </div>
      <button className="bolars-secondary-action" type="button" onClick={() => send('cancelPurchaseRequest', undefined)}>
        <X size={22} /> {copy(snapshot, 'cancelPurchase')}
      </button>
    </div>
  </header>
);

const StartScreen = ({ snapshot, send }: { snapshot: SelfCheckoutStateSnapshot; send: RuntimeActions['send'] }) => (
  <section className="bolars-start-screen" aria-label="Стартовый экран">
    <div className="bolars-start-brand">
      <div className="bolars-logo-large">БОЛАРС</div>
      <p>Касса самообслуживания</p>
    </div>
    <div className="bolars-scan-hero">
      <div className="bolars-scanner-visual" aria-hidden="true">
        <ScanLine size={132} />
      </div>
      <h1>{copy(snapshot, 'startInstruction')}</h1>
      <p>{copy(snapshot, 'startSubtitle')}</p>
      <div className="bolars-start-actions">
        <button className="bolars-primary-action" type="button" onClick={() => send('startPurchase', undefined)}>
          <ShoppingBasket size={34} /> {copy(snapshot, 'startAction')}
        </button>
        <button className="bolars-info-action" type="button" onClick={() => send('scanCode', { code: MOCK_PRODUCTS[0].barcode }, 'scanner')}>
          <ScanLine size={32} /> {copy(snapshot, 'mockScan')}
        </button>
      </div>
    </div>
    <div className="bolars-help-strip">{copy(snapshot, 'helpAvailable')}</div>
  </section>
);

const CartScreen = ({ snapshot, send }: { snapshot: SelfCheckoutStateSnapshot; send: RuntimeActions['send'] }) => {
  const [query, setQuery] = useState(snapshot.searchState.query);

  useEffect(() => {
    setQuery(snapshot.searchState.query);
  }, [snapshot.searchState.query]);

  const onSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length >= snapshot.uiConfig.searchMinLength) {
      send('searchProducts', { query: value }, 'keyboard');
    }
  };

  return (
    <section className="bolars-work-screen">
      <WorkHeader title={copy(snapshot, 'cartTitle')} snapshot={snapshot} send={send} />
      <div className="bolars-cart-layout">
        <div className="bolars-main-column">
          <label className="bolars-search-box">
            <Search size={28} />
            <input value={query} onChange={(event) => onSearch(event.target.value)} placeholder={copy(snapshot, 'searchPlaceholder')} aria-label="Поиск товара" />
          </label>
          <button className="bolars-scan-action-card" type="button" onClick={() => send('scanCode', { code: MOCK_PRODUCTS[1].barcode }, 'scanner')}>
            <ScanLine size={42} />
            <span>
              <strong>{copy(snapshot, 'addProduct')}</strong>
              <small>{copy(snapshot, 'addProductHint')}</small>
            </span>
            <Plus size={28} />
          </button>
          <SearchCandidates snapshot={snapshot} query={query} send={send} />
          <div className="bolars-cart-list" aria-label="Список товаров">
            {snapshot.cartLines.length === 0 ? (
              <div className="bolars-empty-cart">
                <ScanLine size={54} />
                <h2>{copy(snapshot, 'emptyCartTitle')}</h2>
                <p>{copy(snapshot, 'emptyCartHint')}</p>
              </div>
            ) : (
              snapshot.cartLines.map((line) => <CartLineRow key={line.lineId} line={line} send={send} />)
            )}
          </div>
        </div>
        <aside className="bolars-summary-panel">
          <div className="bolars-summary-label">{copy(snapshot, 'total')}</div>
          <div className="bolars-total">{snapshot.totals.payableTotal.formatted}</div>
          <div className="bolars-summary-meta">
            {snapshot.cart.lineCount} {copy(snapshot, 'positions')} · {snapshot.cart.itemCount} {copy(snapshot, 'pieces')}
          </div>
          <button className="bolars-primary-action sticky" type="button" disabled={!snapshot.cart.canGoToPayment} onClick={() => send('goToPaymentSetup', undefined)}>
            {copy(snapshot, 'goToPayment')}
          </button>
          <button className="bolars-info-action full" type="button" onClick={() => send('scanCode', { code: MOCK_PRODUCTS[1].barcode }, 'scanner')}>
            <ScanLine size={26} /> {copy(snapshot, 'scanMore')}
          </button>
        </aside>
      </div>
    </section>
  );
};

const SearchCandidates = ({ snapshot, query, send }: { snapshot: SelfCheckoutStateSnapshot; query: string; send: RuntimeActions['send'] }) => {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length > 0 && normalizedQuery.length < snapshot.uiConfig.searchMinLength) return <div className="bolars-inline-status">{copy(snapshot, 'searchBelowMin')}</div>;
  if (normalizedQuery === '') return null;
  if (normalizedQuery !== snapshot.searchState.query.trim()) return null;
  if (snapshot.searchState.status === 'idle') return null;
  if (snapshot.searchState.status === 'belowMinLength') return <div className="bolars-inline-status">{snapshot.searchState.message}</div>;
  if (snapshot.searchState.status === 'notFound') return <div className="bolars-inline-status warning">{snapshot.searchState.message}</div>;
  if (snapshot.searchState.status !== 'found') return <div className="bolars-inline-status">{copy(snapshot, 'searchInProgress')}</div>;
  return (
    <div className="bolars-candidates" aria-label="Кандидаты поиска">
      {snapshot.searchState.candidates.map((candidate) => (
        <button key={candidate.candidateId} type="button" onClick={() => send('selectSearchCandidate', { candidateId: candidate.candidateId })}>
          <span>
            <strong>{candidate.name}</strong>
            <small>{candidate.identifierLabel}</small>
          </span>
          <b>{candidate.price.formatted}</b>
        </button>
      ))}
    </div>
  );
};

const CartLineRow = ({ line, send }: { line: CartLine; send: RuntimeActions['send'] }) => (
  <article className={`bolars-cart-line ${line.lastChange ? 'changed' : ''}`}>
    <div className="bolars-line-number">{line.positionNumber}</div>
    <div className="bolars-line-name">
      <strong>{line.name}</strong>
      <span>{line.article} · {line.packageLabel ?? line.sku}</span>
      {line.lastChange && <em>{line.lastChange.message}</em>}
    </div>
    <div className="bolars-quantity-control">
      <button type="button" aria-label="Уменьшить количество" disabled={!line.quantityControls.canDecrement} onClick={() => send('decrementQuantity', { lineId: line.lineId })}>
        <Minus size={24} />
      </button>
      <button className="quantity-value" type="button" onClick={() => send('openQuantityNumpad', { lineId: line.lineId })}>
        {line.quantity} {line.unitLabel}
      </button>
      <button type="button" aria-label="Увеличить количество" onClick={() => send('incrementQuantity', { lineId: line.lineId })}>
        <Plus size={24} />
      </button>
    </div>
    <div className="bolars-line-total">{line.lineTotal.formatted}</div>
    <button className="bolars-delete" type="button" aria-label="Удалить товар" onClick={() => send('removeCartLine', { lineId: line.lineId })}>
      <Trash2 size={28} />
    </button>
  </article>
);

const PaymentSetupScreen = ({ snapshot, send }: { snapshot: SelfCheckoutStateSnapshot; send: RuntimeActions['send'] }) => {
  const [phone, setPhone] = useState('');

  return (
    <section className="bolars-work-screen">
      <WorkHeader title={copy(snapshot, 'paymentTitle')} snapshot={snapshot} send={send} />
      <div className="bolars-payment-layout">
        <div className="bolars-main-column">
          <section className="bolars-review-panel">
            <h2>{copy(snapshot, 'reviewTitle')}</h2>
            {snapshot.cartLines.map((line) => (
              <div className="bolars-review-line" key={line.lineId}>
                <span>{line.name}</span>
                <b>{line.quantity} · {line.lineTotal.formatted}</b>
              </div>
            ))}
          </section>
          <section className="bolars-package-panel">
            <h2>{copy(snapshot, 'addPackageTitle')}</h2>
            <div className="bolars-package-grid">
              {snapshot.uiConfig.packageButtons.map((item) => (
                <button type="button" key={item.packageCode} onClick={() => send('addPackage', { packageCode: item.packageCode })}>
                  <PackagePlus size={28} /> {item.label}
                </button>
              ))}
            </div>
          </section>
          <section className="bolars-discount-panel">
            <h2>{copy(snapshot, 'discountTitle')}</h2>
            <p>{copy(snapshot, 'discountHint')}</p>
            <div className="bolars-phone-row">
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+7 900 000 00 00" aria-label="Телефон для скидки" />
              <button type="button" onClick={() => send('applyDiscountByPhone', { phone }, 'keyboard')}>
                {copy(snapshot, 'apply')}
              </button>
            </div>
            {snapshot.discount.status === 'applied' && <div className="bolars-success-note">{snapshot.discount.message}</div>}
            {snapshot.discount.status === 'notFound' && <div className="bolars-warning-note">{snapshot.discount.message}</div>}
          </section>
        </div>
        <aside className="bolars-summary-panel">
          <div className="bolars-summary-label">{copy(snapshot, 'totalToPay')}</div>
          <div className="bolars-total">{snapshot.totals.payableTotal.formatted}</div>
          <div className="bolars-totals-list">
            {snapshot.totals.lines.map((line) => (
              <div key={line.id}>
                <span>{line.label}</span>
                <b>{line.value.formatted}</b>
              </div>
            ))}
          </div>
          <button className="bolars-primary-action sticky" type="button" onClick={() => send('startPayment', undefined)}>
            <CreditCard size={30} /> {copy(snapshot, 'pay')}
          </button>
          <button className="bolars-info-action full" type="button" onClick={() => send('bindManager', { code: '900000000001' }, 'scanner')}>
            <UserCheck size={24} /> {copy(snapshot, 'managerCard')}
          </button>
        </aside>
      </div>
    </section>
  );
};

const PaymentWaitingScreen = ({ snapshot }: { snapshot: SelfCheckoutStateSnapshot }) => (
  <section className="bolars-status-screen">
    <div className="bolars-status-card">
      <CreditCard size={96} />
      <div className="bolars-status-brand">БОЛАРС</div>
      <div className="bolars-summary-label">{copy(snapshot, 'paymentWaitingAmount')}</div>
      <div className="bolars-total huge">{snapshot.totals.payableTotal.formatted}</div>
      <h1>{copy(snapshot, 'paymentWaitingInstruction')}</h1>
      <p>{copy(snapshot, 'paymentWaitingStatus')}</p>
      <CompactOrderPreview snapshot={snapshot} />
      <div className="bolars-spinner" aria-label="Ожидание оплаты" />
    </div>
  </section>
);

const PaymentErrorScreen = ({ snapshot, send }: { snapshot: SelfCheckoutStateSnapshot; send: RuntimeActions['send'] }) => (
  <section className="bolars-status-screen error">
    <div className="bolars-status-card">
      <AlertTriangle size={96} />
      <h1>{copy(snapshot, 'paymentFailed')}</h1>
      <p>{copy(snapshot, 'paymentFailureHint')}</p>
      <div className="bolars-total">{snapshot.totals.payableTotal.formatted}</div>
      <div className="bolars-start-actions">
        <button className="bolars-primary-action" type="button" onClick={() => send('retryPayment', undefined)}>
          {copy(snapshot, 'retryPayment')}
        </button>
        <button className="bolars-info-action" type="button" onClick={() => send('returnToPaymentSetup', undefined)}>
          {copy(snapshot, 'returnToPayment')}
        </button>
      </div>
    </div>
  </section>
);

const FinalSuccessScreen = ({ snapshot }: { snapshot: SelfCheckoutStateSnapshot }) => (
  <section className="bolars-status-screen success">
    <div className="bolars-status-card">
      <CheckCircle2 size={112} />
      <div className="bolars-status-brand">БОЛАРС</div>
      <h1>{copy(snapshot, 'finalTitle')}</h1>
      <p>{copy(snapshot, 'finalSubtitle')}</p>
      <CompactOrderPreview snapshot={snapshot} receipt />
      <div className="bolars-summary-label">{copy(snapshot, 'finalCountdown')} {snapshot.uiConfig.finalAutoResetSeconds} {copy(snapshot, 'secondsShort')}</div>
    </div>
  </section>
);

const BolarsModal = ({ snapshot, send }: { snapshot: SelfCheckoutStateSnapshot; send: RuntimeActions['send'] }) => {
  if (snapshot.modalState.type === 'cancelPurchaseConfirm') {
    return (
      <div className="bolars-modal-backdrop" role="dialog" aria-modal="true" aria-label={snapshot.modalState.title}>
        <div className="bolars-modal">
          <h2>{snapshot.modalState.title}</h2>
          <p>{snapshot.modalState.message}</p>
          <div className="bolars-start-actions">
            <button className="bolars-danger-action" type="button" onClick={() => send('confirmCancelPurchase', undefined)}>
              {snapshot.modalState.confirmLabel}
            </button>
            <button className="bolars-info-action" type="button" onClick={() => send('returnToPurchase', undefined)}>
              {snapshot.modalState.returnLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (snapshot.modalState.type === 'quantityNumpad') {
    return <QuantityNumpad snapshot={snapshot} send={send} />;
  }

  if (snapshot.modalState.type === 'timeoutWarning') {
    return (
      <div className="bolars-modal-backdrop" role="dialog" aria-modal="true" aria-label="Таймаут неактивности">
        <div className="bolars-modal">
          <h2>{copy(snapshot, 'purchaseWillBeCancelled')}</h2>
          <p>{copy(snapshot, 'resetSecondsLeft')} {snapshot.modalState.secondsLeft} {copy(snapshot, 'secondsShort')}</p>
          <button className="bolars-primary-action" type="button" onClick={() => send('returnToPurchase', undefined)}>{copy(snapshot, 'cancelReturn')}</button>
        </div>
      </div>
    );
  }

  return null;
};

const QuantityNumpad = ({ snapshot, send }: { snapshot: SelfCheckoutStateSnapshot; send: RuntimeActions['send'] }) => {
  const modal = snapshot.modalState.type === 'quantityNumpad' ? snapshot.modalState : null;
  const [draft, setDraft] = useState(modal?.draftQuantity ?? '1');
  if (!modal) return null;
  const append = (value: string) => setDraft((current) => (current === '0' ? value : `${current}${value}`).slice(0, 3));
  return (
    <div className="bolars-modal-backdrop" role="dialog" aria-modal="true" aria-label="Ввод количества">
      <div className="bolars-modal numpad">
        <h2>{copy(snapshot, 'quantity')}</h2>
        <div className="bolars-numpad-display">{draft} {modal.unitLabel}</div>
        <div className="bolars-numpad-grid">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
            <button key={digit} type="button" onClick={() => append(digit)}>{digit}</button>
          ))}
          <button type="button" onClick={() => setDraft('')}>{copy(snapshot, 'clear')}</button>
          <button type="button" onClick={() => send('confirmQuantityInput', { lineId: modal.lineId, quantity: Number(draft || '1') })}>{copy(snapshot, 'ok')}</button>
        </div>
      </div>
    </div>
  );
};

const AlertStack = ({ alerts }: { alerts: AlertNotification[] }) => (
  <div className="bolars-alert-stack" aria-live="polite" aria-label="Статусы операции">
    {alerts.slice(-3).map((alert) => (
      <div className={`bolars-alert ${alert.kind}`} key={alert.id}>
        <strong>{alert.title}</strong>
        {alert.message && <span>{alert.message}</span>}
      </div>
    ))}
  </div>
);

const CompactOrderPreview = ({ snapshot, receipt = false }: { snapshot: SelfCheckoutStateSnapshot; receipt?: boolean }) => (
  <div className="bolars-compact-order" aria-label={receipt ? copy(snapshot, 'receiptPreview') : copy(snapshot, 'compactOrderPreview')}>
    <strong>{receipt ? copy(snapshot, 'receiptPreview') : copy(snapshot, 'compactOrderPreview')}</strong>
    {snapshot.cartLines.slice(0, 3).map((line) => (
      <span key={line.lineId}>
        {line.name} · {line.quantity} {line.unitLabel} · {line.lineTotal.formatted}
      </span>
    ))}
    {snapshot.cartLines.length > 3 && <em>{snapshot.cartLines.length - 3} {copy(snapshot, 'moreItems')}</em>}
  </div>
);

const PreviewPanel = ({ factory, currentScenario, textScale }: { factory: RuntimeAdapterFactoryResult; currentScenario?: string; textScale: TextScale }) => {
  if (!factory.preview) return null;
  return (
    <aside className="bolars-preview-panel" aria-label="Preview controls">
      <strong>Preview</strong>
      <select value={currentScenario ?? 'startIdle'} onChange={(event) => factory.preview?.selectScenario(event.target.value, textScale)} aria-label="Preview scenario">
        {factory.preview.scenarios.map((scenario) => (
          <option value={scenario.id} key={scenario.id}>{scenario.label}</option>
        ))}
      </select>
      <select value={textScale} onChange={(event) => factory.preview?.selectScenario(currentScenario ?? 'startIdle', event.target.value as TextScale)} aria-label="Preview text scale">
        <option value="normal">normal</option>
        <option value="large">large</option>
        <option value="extraLarge">extraLarge</option>
      </select>
      <small>Preview mode does not call 1С and does not perform business operations.</small>
    </aside>
  );
};

const DebugPanel = ({ runtime, factory }: { runtime: SelfCheckoutRuntimePort; factory: RuntimeAdapterFactoryResult }) => {
  const [debug, setDebug] = useState<RuntimeDebugState>(() => (runtime as unknown as { getDebugState: () => RuntimeDebugState }).getDebugState());

  useEffect(() => {
    const read = () => setDebug((runtime as unknown as { getDebugState: () => RuntimeDebugState }).getDebugState());
    read();
    const unsubscribe = runtime.subscribe(read);
    const interval = window.setInterval(read, 500);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [runtime]);

  const raw = window.BolarsSelfCheckout?.getDebugStateJson() ?? '{}';

  return (
    <aside className="bolars-debug-panel" aria-label="Debug panel">
      <h2>Debug</h2>
      <dl>
        <dt>route</dt>
        <dd>{debug.route}</dd>
        <dt>build</dt>
        <dd>{debug.buildId}</dd>
        <dt>adapterKind</dt>
        <dd>{debug.adapter.adapterKind}</dd>
        <dt>previewMode</dt>
        <dd>{String(debug.adapter.previewMode)}</dd>
        <dt>queue</dt>
        <dd>{debug.outboundQueue.pendingCount} pending / overflow {String(debug.outboundQueue.queueOverflow)}</dd>
        <dt>last command</dt>
        <dd>{debug.lastOutboundCommand ? `${debug.lastOutboundCommand.type} · ${debug.lastOutboundCommand.deliveryStatus}` : 'none'}</dd>
        <dt>snapshot</dt>
        <dd>{debug.lastInboundSnapshot?.snapshotVersion ?? runtime.getState().snapshotVersion}</dd>
        <dt>apply</dt>
        <dd>{debug.lastApplyStatus.ok ? 'ok' : debug.lastApplyStatus.rejectedReason}</dd>
      </dl>
      {factory.warnings.length > 0 && <div className="bolars-debug-warning">{factory.warnings.join('; ')}</div>}
      {debug.adapter.previewWarning && <div className="bolars-debug-warning">{debug.adapter.previewWarning}</div>}
      <details>
        <summary>Safe debug JSON</summary>
        <pre>{raw}</pre>
      </details>
    </aside>
  );
};

export const isBolarsRoute = (pathname: string) => pathname === BOLARS_ROUTE || pathname.startsWith(`${BOLARS_ROUTE}/`);
