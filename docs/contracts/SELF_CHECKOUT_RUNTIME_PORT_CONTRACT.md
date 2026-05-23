# SelfCheckoutRuntimePort Contract

Статус: draft 0.1
Дата: 2026-05-23
Назначение: единый контракт общения frontend с backend/1C/runtime для scan-first кассы самообслуживания.
Основание: `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md`; прототип MVP должен быть готов к runtime/adapter boundary, UI не вызывает внешние контуры напрямую.

## 1. Зачем Нужен Runtime Port

UI-компоненты не должны напрямую обращаться к 1C, backend, scanner-router, search service, payment adapter или theme source. Внешний мир скрыт за одной логической точкой: `SelfCheckoutRuntimePort`.

Причины:

- UI не владеет бизнес-решениями;
- разные адаптеры можно заменить без переписывания экранов;
- prototype mock mode и 1C/runtime mode имеют один frontend contract;
- повторные scans, скидки, менеджеры, оплата и ошибки обрабатываются авторитетным runtime;
- компоненты остаются render-only: получают snapshot и отправляют user intent.

## Related Documents

- `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md` - каноническое upstream ТЗ.
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md` - продуктовая рамка MVP.
- `docs/AGENT_START_HERE.md` - implementation handoff и первый срез.
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md` - Web ↔ 1С delivery, route и `window.BolarsSelfCheckout` API.
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md` - `debug=1` diagnostics.
- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md` - adapter selection.
- `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md` - preview adapter/scenario mode.
- `docs/architecture/BOLARS_LAYERED_ARCHITECTURE_AND_ADAPTERS.md` - слои и dependency rules.
- `docs/README.md` - индекс документации и порядок чтения.
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md` - визуальная система и UI-инварианты.
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md` - `themeProfile` и token config.
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md` - screen/state usage.
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md` - runtime-boundary acceptance criteria.

## 2. Boundary

UI может:

- render state snapshot;
- dispatch typed commands;
- subscribe to state updates;
- показывать pending/error/success состояния из snapshot.

UI не может:

- определять тип scanned code;
- искать товар напрямую;
- считать цены, скидки и итоги;
- решать, создать строку или увеличить quantity;
- применять скидку;
- привязывать менеджера;
- инициировать provider-specific payment call;
- очищать cart после успеха/ошибки;
- ходить в 1C/backend/scanner/payment/search/theme adapters напрямую;
- мутировать cart, totals, discount или payment state локально;
- решать repeated scan или payment outcome без snapshot.

Для implementation slice `MockAdapter`, `PreviewAdapter` и `OneCInterfaceAdapter` реализуются за тем же `SelfCheckoutRuntimePort`. Отдельный mock-only или preview-only UI path запрещён.

Delivery details between HTML and 1С are outside this RuntimePort type contract and live in `BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`.

Adapter selection lives in `RuntimeAdapterFactory`. UI components must not instantiate or import concrete adapters.

## 3. Минимальный API

```ts
interface SelfCheckoutRuntimePort {
  dispatch(command: SelfCheckoutCommand): Promise<CommandResult>;
  getState(): SelfCheckoutStateSnapshot;
  subscribe(listener: (snapshot: SelfCheckoutStateSnapshot, event?: RuntimeEvent) => void): Unsubscribe;
}

type Unsubscribe = () => void;

type CommandResult =
  | { ok: true; commandId: string; snapshotVersion: number }
  | { ok: false; commandId: string; error: RuntimeCommandError; snapshotVersion?: number };
```

`dispatch` принимает только typed commands. Не использовать один generic command вида `{ type: string; payload: any }` без discriminated union.

## 4. Command Envelope

```ts
type CommandEnvelope<TType extends string, TPayload = undefined> = {
  type: TType;
  commandId: string;
  issuedAt: string;
  source: 'scanner' | 'touch' | 'keyboard' | 'system' | 'mock';
  payload: TPayload;
};
```

`commandId` нужен для idempotency, повторов и диагностики. UI генерирует id, runtime решает side effects.

## 5. Обязательные Commands

```ts
type SelfCheckoutCommand =
  | CommandEnvelope<'startPurchase'>
  | CommandEnvelope<'scanCode', { code: string }>
  | CommandEnvelope<'searchProducts', { query: string }>
  | CommandEnvelope<'selectSearchCandidate', { candidateId: string }>
  | CommandEnvelope<'changeQuantity', { lineId: string; quantity: number }>
  | CommandEnvelope<'incrementQuantity', { lineId: string }>
  | CommandEnvelope<'decrementQuantity', { lineId: string }>
  | CommandEnvelope<'openQuantityNumpad', { lineId: string }>
  | CommandEnvelope<'confirmQuantityInput', { lineId: string; quantity: number }>
  | CommandEnvelope<'removeCartLine', { lineId: string }>
  | CommandEnvelope<'cancelPurchaseRequest'>
  | CommandEnvelope<'confirmCancelPurchase'>
  | CommandEnvelope<'returnToPurchase'>
  | CommandEnvelope<'goToPaymentSetup'>
  | CommandEnvelope<'addPackage', { packageCode: string }>
  | CommandEnvelope<'applyDiscountByPhone', { phone: string }>
  | CommandEnvelope<'startPayment'>
  | CommandEnvelope<'retryPayment'>
  | CommandEnvelope<'returnToPaymentSetup'>
  | CommandEnvelope<'bindManager', { code: string }>
  | CommandEnvelope<'setTextScale', { scale: TextScale }>
  | CommandEnvelope<'resetToStart', { reason: ResetReason }>;
```

Commands map to user intentions. They do not encode backend-specific procedures.

## 6. Runtime Events

Events are optional metadata emitted with snapshot updates. UI must not depend on events instead of snapshot state, but events are useful for short visual feedback and logs.

```ts
type RuntimeEvent =
  | { type: 'stateChanged'; snapshotVersion: number }
  | { type: 'purchaseStarted'; source: 'startTouch' | 'scan' | 'manualSearch' }
  | { type: 'commandAccepted'; commandId: string; commandType: SelfCheckoutCommand['type'] }
  | { type: 'commandRejected'; commandId: string; reason: RuntimeCommandError }
  | { type: 'scanResolved'; codeKind: ScannedCodeKind; lineId?: string; alertId?: string }
  | { type: 'cartLineAdded'; lineId: string }
  | { type: 'cartLineQuantityIncreased'; lineId: string; quantity: number }
  | { type: 'cartLineRemoved'; lineId: string }
  | { type: 'quantityChanged'; lineId: string; quantity: number }
  | { type: 'searchStarted'; query: string }
  | { type: 'searchCompleted'; query: string; resultCount: number }
  | { type: 'discountApplied'; discountId: string }
  | { type: 'discountRejected'; reason: string }
  | { type: 'managerBound'; managerId: string }
  | { type: 'paymentStateChanged'; status: PaymentStatus }
  | { type: 'paymentSucceeded'; paymentId: string }
  | { type: 'paymentFailed'; reason: PaymentFailureReason }
  | { type: 'modalOpened'; modal: ModalState['type'] }
  | { type: 'modalClosed' }
  | { type: 'timeoutWarningStarted'; secondsLeft: number }
  | { type: 'sessionReset'; reason: ResetReason };
```

## 7. State Snapshot

Runtime returns an authoritative immutable snapshot.

```ts
type CurrentScreen =
  | 'start'
  | 'cart'
  | 'paymentSetup'
  | 'paymentWaiting'
  | 'paymentError'
  | 'finalSuccess';

type TextScale = 'normal' | 'large' | 'extraLarge';

type AdapterKind = 'mock' | 'preview' | 'onec' | 'unknown';

type ResetReason =
  | 'finalCountdown'
  | 'cancelConfirmed'
  | 'emptyCartCancel'
  | 'inactivityTimeout'
  | 'staffReset'
  | 'runtimeRecovery'
  | 'mockScenarioReset';

interface SelfCheckoutStateSnapshot {
  snapshotVersion: number;
  sessionId: string;
  terminalStatus: TerminalStatus;
  currentScreen: CurrentScreen;
  cart: CartState;
  cartLines: CartLine[];
  totals: TotalsState;
  discount: DiscountState;
  manager: ManagerState;
  searchState: SearchState;
  scannerState: ScannerState;
  paymentState: PaymentState;
  alerts: AlertNotification[];
  modalState: ModalState;
  textScale: TextScale;
  themeProfile: ThemeProfileState;
  uiConfig: UiConfigState;
  featureFlags: FeatureFlagsState;
  adapterKind: AdapterKind;
  previewMode?: boolean;
  previewScenarioId?: string;
  lastProcessedCommandId?: string;
  lastCommandResult?: SnapshotCommandResult;
  updatedAt: string;
}
```

UI renders `currentScreen`, but modal/overlay states can be active on top of a screen.

Command/snapshot correlation metadata:

```ts
interface SnapshotCommandResult {
  ok: boolean;
  commandId: string;
  processedAt?: string;
  error?: RuntimeCommandError;
}
```

`lastProcessedCommandId` and `lastCommandResult` are optional but recommended for `OneCInterfaceAdapter`. They let Web/debug correlate an outbound command with the authoritative snapshot that resulted from it. If a snapshot is periodic and not related to a command, these fields may be omitted.

```ts
type TerminalStatus =
  | 'terminalFree'
  | 'purchaseStarted'
  | 'paymentInProgress'
  | 'purchaseCompleted'
  | 'purchaseCancelled'
  | 'inactivityTimedOut';
```

## 8. Cart

```ts
interface CartState {
  id: string;
  status: 'empty' | 'active' | 'lockedForPayment' | 'completed' | 'cancelled';
  lineCount: number;
  itemCount: number;
  isEmpty: boolean;
  canGoToPayment: boolean;
  updatedAt: string;
}
```

`cart.status === 'lockedForPayment'` means UI must not mutate quantity or remove lines unless runtime explicitly allows a command.

## 9. CartLine

```ts
interface CartLine {
  lineId: string;
  positionNumber: number;
  productId: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  packageLabel?: string;
  article?: string;
  imageUrl?: string;
  quantity: number;
  quantityMode: 'integer' | 'weightedOrFractionalReserved';
  unitLabel: string;
  unitPrice: Money;
  lineTotal: Money;
  isRemovable: boolean;
  quantityControls: {
    canIncrement: boolean;
    canDecrement: boolean;
    canOpenNumpad: boolean;
  };
  lastChange?: {
    kind: 'added' | 'quantityIncreased' | 'quantityChanged' | 'removedUndoAvailable';
    occurredAt: string;
    highlightUntil?: string;
    message: string;
  };
}
```

UI does not calculate `lineTotal` and does not infer `lastChange`.

MVP quantity is integer-only unless weighted or fractional products are approved separately. `positionNumber` is the visible line number from the authoritative ordered cart snapshot.

## 10. Totals

```ts
interface Money {
  amount: number;
  currency: 'RUB';
  formatted: string;
}

interface TotalsState {
  goodsSubtotal: Money;
  packageSubtotal: Money;
  discountTotal: Money;
  taxTotal?: Money;
  payableTotal: Money;
  lines: Array<{
    id: string;
    label: string;
    value: Money;
    kind: 'goods' | 'package' | 'discount' | 'tax' | 'total';
  }>;
}
```

UI shows formatted values from runtime. UI must not format amounts by recalculating numbers differently from runtime.

## 11. SearchState

```ts
interface SearchState {
  query: string;
  minQueryLength: 4;
  source: 'oneC' | 'runtimeAdapter' | 'mock';
  fields: SearchField[];
  maxCandidates: number;
  candidateDisplayFormatId: string;
  status: 'idle' | 'belowMinLength' | 'searching' | 'found' | 'notFound' | 'error';
  candidates: SearchCandidate[];
  message?: string;
}

type SearchField = 'name' | 'article' | 'barcodeDigits';

interface SearchCandidate {
  candidateId: string;
  productId: string;
  name: string;
  article?: string;
  barcodeMasked?: string;
  identifierLabel?: string;
  packageLabel?: string;
  price: Money;
  imageUrl?: string;
  actionLabel: string;
}
```

Search is a cart state, not a separate product catalog. Selecting candidate dispatches `selectSearchCandidate(candidateId)` and runtime adds/increments cart line.

Product target source for search is 1C/runtime search adapter. UI must not perform product search directly.

## 12. ScannerState

Обязательные статусы:

```ts
type ScannerStatus =
  | 'idle'
  | 'scanning'
  | 'productDetected'
  | 'discountDetected'
  | 'managerDetected'
  | 'unknownCode'
  | 'markedProductPendingDecision'
  | 'error';

type ScannedCodeKind = 'product' | 'discount' | 'manager' | 'unknown' | 'markedProduct' | 'error';

interface ScannerState {
  status: ScannerStatus;
  lastCodeMasked?: string;
  lastResolvedKind?: ScannedCodeKind;
  message?: string;
  canScan: boolean;
  fallbackActions: Array<'search' | 'manualCode' | 'help'>;
}
```

UI never determines code kind. It only dispatches `scanCode(code)`.

## 13. PaymentState

Обязательные статусы:

```ts
type PaymentStatus =
  | 'idle'
  | 'preparing'
  | 'waitingForCard'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'timeout'
  | 'unknown';

type PaymentFailureReason =
  | 'declined'
  | 'terminalUnavailable'
  | 'connectionError'
  | 'timeout'
  | 'cancelled'
  | 'unknown';

interface PaymentState {
  status: PaymentStatus;
  paymentId?: string;
  orderNumber?: string;
  amount: Money;
  method: 'card' | 'sbp' | 'unknown';
  message?: string;
  failureReason?: PaymentFailureReason;
  canRetry: boolean;
  canReturnToPaymentSetup: boolean;
  startedAt?: string;
  updatedAt?: string;
}
```

Payment success/failure is authoritative only from runtime/payment adapter.

## 14. DiscountState

```ts
interface DiscountState {
  status: 'none' | 'waitingForScanOrPhone' | 'checking' | 'applied' | 'notFound' | 'error';
  discountId?: string;
  phoneMasked?: string;
  cardMasked?: string;
  label?: string;
  amount?: Money;
  message?: string;
}
```

UI can dispatch `applyDiscountByPhone(phone)` or `scanCode(code)`. Runtime decides whether discount exists and how it affects totals.

## 15. ManagerState

```ts
interface ManagerState {
  status: 'none' | 'binding' | 'bound' | 'rejected' | 'error';
  managerId?: string;
  displayName?: string;
  boundAt?: string;
  message?: string;
}
```

Manager binding can happen through `bindManager(code)` or runtime-resolved scan. UI does not decide whether code belongs to manager.

## 16. ModalState

```ts
type ModalState =
  | { type: 'none' }
  | { type: 'quantityNumpad'; lineId: string; currentQuantity: number; draftQuantity: string; unitLabel: string }
  | { type: 'cancelPurchaseConfirm'; title: string; message: string; confirmLabel: string; returnLabel: string }
  | { type: 'timeoutWarning'; secondsLeft: number; returnTo: CurrentScreen }
  | { type: 'alertDetails'; alertId: string };
```

Quantity numpad and cancel confirmation are UI overlays driven by runtime state.

## 17. Alerts / Notifications

```ts
interface AlertNotification {
  id: string;
  kind: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  relatedLineId?: string;
  autoDismissMs?: number;
  actions?: Array<{
    id: string;
    label: string;
    command: SelfCheckoutCommand['type'];
  }>;
}
```

Alerts must be user-readable. Technical provider errors should be mapped by runtime.

## 18. UiConfig

```ts
interface UiConfigState {
  viewportProfile: 'portrait1080' | 'portraitCompact' | 'landscapeFallback';
  language: 'ru';
  showClock: boolean;
  showManagerBadge: boolean;
  showHelpAction: boolean;
  searchMinLength: 4;
  searchFields: SearchField[];
  searchMaxCandidates: number;
  searchCandidateDisplayFormatId: string;
  finalAutoResetSeconds: number;
  inactivityTimeoutSeconds: number;
  inactivityWarningSeconds: number;
  inactivityActivityEvents: ActivityEventKind[];
  productImageMode: 'show' | 'fallbackInitials' | 'hide';
  motionProfile: 'normal' | 'reduced';
  paymentProviderLabel?: string;
  paymentResponseTimeoutSeconds?: number;
  packageButtons: Array<{ packageCode: string; label: string }>;
}
```

UI layout choices should come from config/tokens, not scattered constants.

```ts
type ActivityEventKind =
  | 'screenTouch'
  | 'scanProduct'
  | 'searchInput'
  | 'selectSearchCandidate'
  | 'changeQuantity'
  | 'removeCartLine'
  | 'phoneInput'
  | 'scanDiscountCard'
  | 'scanManagerCard'
  | 'screenTransition'
  | 'addPackage';
```

Default inactivity timeout is `300` seconds unless runtime config overrides it. If acquiring transaction has already been sent and the runtime is waiting for the payment terminal, inactivity reset must not break the payment process.

## 19. ThemeProfile

```ts
interface ThemeProfileState {
  id:
    | 'bolars-light-default'
    | 'bolars-light-contrast'
    | 'bolars-dark-optional'
    | 'custom';
  status: 'loaded' | 'defaultProfile' | 'error';
  version: string;
  tokenSetId: string;
  highContrast: boolean;
}
```

The actual token values live in theme config. Snapshot chooses the active profile.

## 20. FeatureFlags

```ts
interface FeatureFlagsState {
  mockMode: boolean;
  manualSearchEnabled: boolean;
  quantityNumpadEnabled: boolean;
  packagesEnabled: boolean;
  discountByPhoneEnabled: boolean;
  managerBindingEnabled: boolean;
  paymentRetryEnabled: boolean;
  finalReceiptPreviewEnabled: boolean;
  previewModeEnabled?: boolean;
}
```

Feature flags may hide UI capabilities, but must not create business bypasses.

## 21. Idempotency and Repeated Scan Rules

- Each command has `commandId`.
- Runtime must ignore duplicate `commandId` side effects and return current snapshot/result.
- Repeated scan of the same product in active cart increments quantity according to runtime rules.
- Repeated scan while payment is locked is either rejected with user-readable alert or queued only if runtime explicitly supports it.
- UI must not locally increment line quantity before receiving snapshot.
- Highlighting added/incremented row is derived from `CartLine.lastChange`.

## 22. Error Handling

- Command rejection returns `RuntimeCommandError` and should also be reflected in `alerts` if user-visible.
- Payment errors keep cart/order state.
- Search errors do not clear search query or cart.
- Unknown barcode offers scan again/search/help.
- Discount not found does not block payment unless runtime says so.
- Manager binding rejection does not block payment unless sale policy says so.
- Cancel confirmation is required for non-empty cart.
- Empty-cart cancel returns to start without confirmation.
- Unknown code default text: `Код не распознан. Обратитесь к сотруднику.`
- Discount not-found default text: `Скидка не найдена`.
- Payment failed default text: `Оплата не прошла`; recovery hint: `Попробуйте ещё раз или обратитесь к сотруднику`.

```ts
interface RuntimeCommandError {
  code:
    | 'invalidCommand'
    | 'notAllowedInCurrentState'
    | 'validationError'
    | 'runtimeBusy'
    | 'queueOverflow'
    | 'runtimeUnavailable'
    | 'adapterError'
    | 'timeout'
    | 'unknown';
  message: string;
  fieldErrors?: Record<string, string>;
}
```

## 23. Inactivity Timeout Contract

- Default inactivity timeout: `300` seconds (`5 минут`) unless configured otherwise.
- Activity events are listed in `uiConfig.inactivityActivityEvents`.
- Runtime owns timeout decisions and returns a new state snapshot.
- On active working screens with no payment in progress, timeout closes the current purchase and returns terminal to `start`.
- If payment has already been sent to acquiring and runtime waits for the payment terminal response, timeout must not break payment processing.
- A warning overlay may be shown only if configured; it is not a substitute for the terminal timeout outcome.

## 24. MVP Mandatory Runtime Subset

Этот раздел задаёт минимальный обязательный runtime-объём для первого implementation slice. Он не отменяет полный контракт, но не требует реализовать все расширения сразу.

Implementation order: сначала runtime/mock state model и port API, затем screens/overlays, затем visual polish. UI должен рендерить snapshot уже в первом срезе.

### Mandatory Screens

- `start`;
- `cart`;
- `paymentSetup`;
- `paymentWaiting`;
- `paymentError`;
- `finalSuccess`.

### Mandatory Commands

- `scanCode`;
- `startPurchase`;
- `searchProducts`;
- `selectSearchCandidate`;
- `incrementQuantity`;
- `decrementQuantity`;
- `openQuantityNumpad`;
- `confirmQuantityInput`;
- `removeCartLine`;
- `cancelPurchaseRequest`;
- `confirmCancelPurchase`;
- `returnToPurchase`;
- `goToPaymentSetup`;
- `addPackage`;
- `applyDiscountByPhone`;
- `startPayment`;
- `retryPayment`;
- `returnToPaymentSetup`;
- `setTextScale`;
- `resetToStart`.

### Optional For First Slice, Contract-Reserved

- `bindManager`;
- `markedProductPendingDecision` / Честный знак branch;
- advanced payment provider states;
- custom profile management UI.

Эти возможности зарезервированы контрактом, но могут быть вынесены за первый implementation slice, если MVP delivery требует меньшего среза.

### Mandatory Mock Scenarios

- стартовый экран;
- tap start screen -> cart;
- scan product -> cart;
- repeated scan -> quantity increment;
- search `4+` chars -> found;
- search -> not found;
- select candidate -> cart line;
- quantity numpad;
- remove line;
- cancel confirmation;
- add package;
- discount applied;
- discount not found;
- manager bound if snapshot has manager;
- payment waiting;
- payment success;
- payment failed;
- inactivity timeout;
- final auto reset.

### Mandatory Preview Scenarios

For service/dev/acceptance mode, `PreviewAdapter` must provide deterministic snapshots for:

- start idle;
- cart empty;
- cart 1 item;
- cart many items;
- search found;
- search not found;
- quantity numpad open;
- cancel confirmation;
- payment setup;
- payment waiting;
- payment error;
- final success;
- inactivity timeout warning;
- text scale variants;
- theme loaded/default/error where supported.

## 25. Prototype Mock Mode Contract

Prototype mock mode must implement the same `SelfCheckoutRuntimePort` API.

Mock mode is an adapter for reproducing external contours in prototype MVP. It does not replace the product/runtime contract and must not create a second UI API.

Required mock capabilities:

- tap start screen -> empty cart;
- start screen -> scan product -> cart;
- repeated scan increments quantity;
- search after 4+ chars;
- found/not found search;
- select candidate adds/increments cart;
- quantity plus/minus/numpad;
- remove line;
- discount applied/not found;
- manager bound/rejected;
- barcode product not found;
- unknown code;
- payment waiting/success/failed/timeout/cancelled;
- cancel confirmation;
- inactivity timeout reset with optional warning overlay;
- inactivity timeout reset with payment guard;
- final auto reset.

Mock data must be deterministic enough for tests and visual acceptance.

## 26. Preview Mode Contract

`PreviewAdapter` is a service/dev/acceptance adapter implementation of the same `SelfCheckoutRuntimePort`.

Rules:

- returns deterministic snapshots for selected screen/scenario;
- marks snapshots with `adapterKind='preview'` or equivalent debug/runtime metadata;
- sets `previewMode=true` when preview route is active;
- does not create a separate UI API;
- does not directly render screens/components;
- does not call 1С;
- does not enqueue commands to `OneCInterfaceAdapter`;
- must not be used as business runtime.

Preview route and scenarios are defined in `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md`.

## 27. Adapter Boundary

Runtime may internally use:

- `OneCInterfaceAdapter`;
- `MockAdapter`;
- `PreviewAdapter`;
- `PaymentAdapter`;
- `ThemeConfigAdapter`;
- `ScannerRouterAdapter`;
- `SearchAdapter`;
- `SessionTimerAdapter`.

These adapters are runtime internals. UI imports only the runtime port and typed contracts.

### OneCInterfaceAdapter Boundary

`OneCInterfaceAdapter` is the concrete real adapter implementation for the BOLARS MVP 1С contour. It owns:

- mapping scan/search/cart/payment commands to 1С-safe operations;
- translating 1C responses to state snapshot;
- masking sensitive codes;
- handling 1C unavailable/timeout states;
- preserving idempotency.

It must not leak 1С-specific objects into UI components.

HTML route, `window.BolarsSelfCheckout` methods, command delivery channel and `debug=1` diagnostics are defined in `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`.

## 28. Business Logic Ban in UI

Forbidden in UI components:

- `if barcode startsWith ... then discount`;
- direct price math for payable total;
- direct line total, discount or tax math;
- direct product lookup by barcode;
- direct payment adapter call;
- direct manager card detection;
- direct cart mutation outside snapshot;
- direct preview screen/component render bypassing RuntimePort;
- repeated-scan decision outside runtime;
- payment outcome decision outside runtime;
- localStorage as cart/payment source of truth;
- branch-specific behavior based on provider names.

Allowed in UI components:

- local input draft state;
- focus/open/close visual details when mirrored by runtime where needed;
- dispatching typed commands;
- rendering snapshot fields;
- formatting already formatted strings for layout only.

## 29. Acceptance Surface

Implementation is contract-compliant when:

- every external action goes through `SelfCheckoutRuntimePort`;
- UI renders all required screens/states from snapshot;
- all mandatory commands are typed and covered in mock mode;
- preview scenarios render through `PreviewAdapter` snapshots, not direct component bypass;
- UI has no direct imports from 1C/payment/scanner/search/theme adapters;
- cart/payment/search/discount/manager behavior is verified through runtime tests, not UI component hacks.
