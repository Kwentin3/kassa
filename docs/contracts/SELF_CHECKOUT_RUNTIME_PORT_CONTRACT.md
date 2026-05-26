# BOLARS MVP: Внутренний контракт Runtime Port

Статус: draft 0.3
Дата: 2026-05-26
Аудитория: frontend/runtime-разработчик.

## 1. Важно Про Аудиторию

Этот документ описывает внутреннюю границу frontend runtime: `SelfCheckoutRuntimePort`, команды, adapter-слой и snapshot-driven UI.

Для 1С-разработчика основной рабочий JSON-контракт находится здесь:

- `docs/contracts/BOLARS_1C_JSON_EXCHANGE_CONTRACT.md`

Для пошаговой интеграции с 1С:

- `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md`

Этот файл можно использовать как справочник по внутренней архитектуре, но не как готовый JSON payload для `receiveStateSnapshot(...)`.

## 2. Назначение Runtime Port

`SelfCheckoutRuntimePort` - единая граница между UI и источником состояния кассы.

UI не знает, кто сейчас отдаёт состояние:

- `MockAdapter`;
- `PreviewAdapter`;
- `OneCInterfaceAdapter`;
- будущий production runtime.

UI только:

- отправляет typed commands;
- получает `SelfCheckoutStateSnapshot`;
- подписывается на изменения snapshot;
- рисует экран по snapshot.

UI не должен:

- искать товар;
- определять тип штрихкода;
- считать цены, скидки, налоги и итоги;
- решать, создать строку или увеличить количество;
- запускать provider-specific оплату;
- очищать чек после успеха или ошибки;
- ходить напрямую в 1С, backend, payment, scanner, search, loyalty или theme source;
- хранить корзину или оплату как source of truth в localStorage.

## 3. Реальный Источник Типов

Кодовый source of truth:

- `src/bolars/runtime/types.ts`
- `src/bolars/runtime/commands.ts`
- `src/bolars/runtime/baseAdapter.ts`
- `src/bolars/runtime/onecInterfaceAdapter.ts`
- `src/bolars/runtime/webApi.ts`

Документ ниже является читаемой спецификацией этих типов. При расхождении приоритет у кода, а документацию нужно обновить.

## 4. API Runtime Port

```ts
interface SelfCheckoutRuntimePort {
  dispatch(command: SelfCheckoutCommand): Promise<CommandResult>;
  getState(): SelfCheckoutStateSnapshot;
  subscribe(listener: (snapshot: SelfCheckoutStateSnapshot, event?: RuntimeEvent) => void): Unsubscribe;
}
```

`dispatch` принимает только известные команды. UI не должен создавать произвольный `{ type: string; payload: any }`.

## 5. Envelope Команды

```ts
type CommandEnvelope<TType extends CommandType, TPayload = undefined> = {
  type: TType;
  commandId: string;
  issuedAt: string;
  source: 'scanner' | 'touch' | 'keyboard' | 'system' | 'mock';
  payload: TPayload;
};
```

В JSON команды без payload могут сериализоваться без поля `payload`, потому что в runtime оно равно `undefined`.

## 6. Команды

Список соответствует `src/bolars/runtime/types.ts` и `src/bolars/runtime/commands.ts`.

| Команда | Payload |
| --- | --- |
| `startPurchase` | `undefined` |
| `scanCode` | `{ code: string }` |
| `searchProducts` | `{ query: string }` |
| `selectSearchCandidate` | `{ candidateId: string }` |
| `changeQuantity` | `{ lineId: string; quantity: number }` |
| `incrementQuantity` | `{ lineId: string }` |
| `decrementQuantity` | `{ lineId: string }` |
| `openQuantityNumpad` | `{ lineId: string }` |
| `confirmQuantityInput` | `{ lineId: string; quantity: number }` |
| `removeCartLine` | `{ lineId: string }` |
| `cancelPurchaseRequest` | `undefined` |
| `confirmCancelPurchase` | `undefined` |
| `returnToPurchase` | `undefined` |
| `goToPaymentSetup` | `undefined` |
| `addPackage` | `{ packageCode: string }` |
| `applyDiscountByPhone` | `{ phone: string }` |
| `startPayment` | `undefined` |
| `retryPayment` | `undefined` |
| `returnToPaymentSetup` | `undefined` |
| `bindManager` | `{ code: string }` |
| `setTextScale` | `{ scale: 'normal' | 'large' | 'extraLarge' }` |
| `resetToStart` | `{ reason: ResetReason }` |

Команды выражают намерение пользователя, а не backend-процедуру.

## 7. Навигационные Команды

Навигация внутри покупки snapshot-driven.

UI не хранит доверенный стек предыдущих экранов и не восстанавливает старую корзину из памяти браузера.

`returnToPurchase` означает:

- если открыта модалка, runtime закрывает модалку и возвращает тот же underlying screen;
- если текущий экран `paymentSetup`, runtime возвращает `currentScreen='cart'`;
- чек, строки, скидка, менеджер, итоги и payment state не очищаются.

Очистка покупки относится только к destructive flow:

- `cancelPurchaseRequest`;
- `confirmCancelPurchase`;
- `resetToStart` с корректным reason.

## 8. Snapshot

Runtime возвращает immutable authoritative snapshot.

```ts
type SelfCheckoutStateSnapshot = {
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
};
```

UI рендерит `currentScreen`, но modal/overlay состояния могут быть активны поверх экрана.

Для 1С JSON-форма этого snapshot описана в `docs/contracts/BOLARS_1C_JSON_EXCHANGE_CONTRACT.md`.

## 9. Основные Enum-Значения

```ts
type CurrentScreen = 'start' | 'cart' | 'paymentSetup' | 'paymentWaiting' | 'paymentError' | 'finalSuccess';
type TextScale = 'normal' | 'large' | 'extraLarge';
type AdapterKind = 'mock' | 'preview' | 'onec' | 'unknown';
```

```ts
type TerminalStatus =
  | 'terminalFree'
  | 'purchaseStarted'
  | 'paymentInProgress'
  | 'purchaseCompleted'
  | 'purchaseCancelled'
  | 'inactivityTimedOut';
```

```ts
type ResetReason =
  | 'finalCountdown'
  | 'cancelConfirmed'
  | 'emptyCartCancel'
  | 'inactivityTimeout'
  | 'staffReset'
  | 'runtimeRecovery'
  | 'mockScenarioReset';
```

## 10. CartState

```ts
type CartState = {
  id: string;
  status: 'empty' | 'active' | 'lockedForPayment' | 'completed' | 'cancelled';
  lineCount: number;
  itemCount: number;
  isEmpty: boolean;
  canGoToPayment: boolean;
  updatedAt: string;
};
```

`cart.status='lockedForPayment'` означает, что UI не должен менять количество или удалять строки, если runtime явно не разрешил команду.

## 11. CartLine

```ts
type CartLine = {
  lineId: string;
  positionNumber: number;
  productId: string;
  sku: string;
  barcode?: string;
  name: string;
  article?: string;
  packageLabel?: string;
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
};
```

UI не считает `lineTotal` и не выводит `lastChange` сам. Эти данные приходят из runtime.

## 12. Money И Totals

```ts
type Money = {
  amount: number;
  currency: 'RUB';
  formatted: string;
};
```

```ts
type TotalsState = {
  goodsSubtotal: Money;
  packageSubtotal: Money;
  discountTotal: Money;
  payableTotal: Money;
  lines: Array<{
    id: string;
    label: string;
    value: Money;
    kind: 'goods' | 'package' | 'discount' | 'tax' | 'total';
  }>;
};
```

UI показывает `formatted` и не пересчитывает суммы.

## 13. SearchState

```ts
type SearchState = {
  query: string;
  minQueryLength: 4;
  source: 'oneC' | 'runtimeAdapter' | 'mock';
  fields: Array<'name' | 'article' | 'barcodeDigits'>;
  maxCandidates: number;
  candidateDisplayFormatId: string;
  status: 'idle' | 'belowMinLength' | 'searching' | 'found' | 'notFound' | 'error';
  candidates: SearchCandidate[];
  message?: string;
};
```

```ts
type SearchCandidate = {
  candidateId: string;
  productId: string;
  name: string;
  article?: string;
  barcodeMasked?: string;
  identifierLabel?: string;
  packageLabel?: string;
  price: Money;
  actionLabel: string;
};
```

Поиск - часть состояния покупки. Выбор кандидата отправляет `selectSearchCandidate(candidateId)`, а runtime добавляет или увеличивает строку корзины.

Экранная клавиатура поиска является UI-owned draft state. Runtime видит только `searchProducts(query)` после достижения `uiConfig.searchMinLength`.

## 14. ScannerState

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
```

```ts
type ScannerState = {
  status: ScannerStatus;
  lastCodeMasked?: string;
  lastResolvedKind?: 'product' | 'discount' | 'manager' | 'unknown' | 'markedProduct' | 'error';
  message?: string;
  canScan: boolean;
  fallbackActions: Array<'search' | 'manualCode' | 'help'>;
};
```

UI не определяет тип кода. UI только отправляет `scanCode(code)`.

## 15. PaymentState

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
```

```ts
type PaymentState = {
  status: PaymentStatus;
  paymentId?: string;
  orderNumber?: string;
  amount: Money;
  method: 'card' | 'sbp' | 'unknown';
  message?: string;
  failureReason?: 'declined' | 'terminalUnavailable' | 'connectionError' | 'timeout' | 'cancelled' | 'unknown';
  canRetry: boolean;
  canReturnToPaymentSetup: boolean;
  startedAt?: string;
  updatedAt?: string;
};
```

Payment outcome приходит только из runtime/payment/1С-контура.

## 16. DiscountState И ManagerState

```ts
type DiscountState = {
  status: 'none' | 'waitingForScanOrPhone' | 'checking' | 'applied' | 'notFound' | 'error';
  discountId?: string;
  phoneMasked?: string;
  cardMasked?: string;
  label?: string;
  amount?: Money;
  message?: string;
};
```

```ts
type ManagerState = {
  status: 'none' | 'binding' | 'bound' | 'rejected' | 'error';
  managerId?: string;
  displayName?: string;
  boundAt?: string;
  message?: string;
};
```

UI может отправить `applyDiscountByPhone(phone)`, `bindManager(code)` или `scanCode(code)`. Runtime решает, что это за код и как это влияет на чек.

## 17. ModalState

```ts
type ModalState =
  | { type: 'none' }
  | { type: 'quantityNumpad'; lineId: string; currentQuantity: number; draftQuantity: string; unitLabel: string }
  | { type: 'cancelPurchaseConfirm'; title: string; message: string; confirmLabel: string; returnLabel: string }
  | { type: 'timeoutWarning'; secondsLeft: number; returnTo: CurrentScreen }
  | { type: 'alertDetails'; alertId: string };
```

Телефонный numpad для скидки сейчас UI-owned и не представлен отдельным `ModalState`.

## 18. UiConfig

```ts
type UiConfigState = {
  viewportProfile:
    | 'portrait1080'
    | 'portraitCompact'
    | 'landscapeKiosk'
    | 'landscapeCompact'
    | 'landscapeFallback'
    | 'embeddedOneC'
    | 'microFallback';
  language: 'ru';
  showClock: boolean;
  showManagerBadge: boolean;
  showHelpAction: boolean;
  searchMinLength: 4;
  searchFields: Array<'name' | 'article' | 'barcodeDigits'>;
  searchMaxCandidates: number;
  searchCandidateDisplayFormatId: string;
  finalAutoResetSeconds: number;
  inactivityTimeoutSeconds: number;
  inactivityWarningSeconds: number;
  productImageMode: 'show' | 'fallbackInitials' | 'hide';
  motionProfile: 'normal' | 'reduced';
  paymentProviderLabel?: string;
  paymentResponseTimeoutSeconds?: number;
  packageButtons: Array<{ packageCode: string; label: string }>;
  texts: Record<string, string>;
};
```

Для 1С HTML shell используется `viewportProfile='embeddedOneC'`.

`texts` должен быть объектом. Если переопределений нет, допустим пустой объект.

## 19. ThemeProfile И FeatureFlags

```ts
type ThemeProfileState = {
  id:
    | 'bolars-light-default'
    | 'bolars-light-contrast'
    | 'bolars-light-clean'
    | 'bolars-light-promo'
    | 'bolars-light-magenta-soft'
    | 'bolars-dark-optional'
    | 'custom';
  status: 'loaded' | 'defaultProfile' | 'error';
  version: string;
  tokenSetId: string;
  highContrast: boolean;
};
```

```ts
type FeatureFlagsState = {
  mockMode: boolean;
  manualSearchEnabled: boolean;
  quantityNumpadEnabled: boolean;
  packagesEnabled: boolean;
  discountByPhoneEnabled: boolean;
  managerBindingEnabled: boolean;
  paymentRetryEnabled: boolean;
  finalReceiptPreviewEnabled: boolean;
  previewModeEnabled?: boolean;
};
```

Feature flags могут скрывать UI-возможности, но не должны создавать обход бизнес-правил.

## 20. Runtime Events

Текущая реализация использует ограниченный набор событий:

```ts
type RuntimeEvent =
  | { type: 'stateChanged'; snapshotVersion: number }
  | { type: 'commandAccepted'; commandId: string; commandType: SelfCheckoutCommand['type'] }
  | { type: 'commandRejected'; commandId: string; reason: RuntimeCommandError }
  | { type: 'paymentSucceeded'; paymentId: string }
  | { type: 'paymentFailed'; reason: PaymentFailureReason }
  | { type: 'sessionReset'; reason: ResetReason };
```

UI не должен полагаться на event вместо snapshot.

## 21. OneCInterfaceAdapter

`OneCInterfaceAdapter` - текущая реализация runtime-port для 1С smoke/integration режима.

Фактическое поведение:

- команды складываются в outbound queue;
- `drainOutboundCommandsJson()` отдаёт команды 1С и переводит их в `drainedByOneC`;
- `receiveStateSnapshot(...)` применяет snapshot и связывает его с командой по `lastProcessedCommandId`;
- максимум незавершённых команд - 20;
- незавершённые команды старше 30 секунд получают `timeout`;
- повторный `startPayment` блокируется, если предыдущая payment-команда ещё pending.

HTML API для 1С описан в `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`.

## 22. Apply-Валидация Snapshot

Текущий `BaseRuntimeAdapter.receiveStateSnapshot(...)` проверяет:

- JSON парсится;
- snapshot является объектом;
- `snapshotVersion` - number;
- `sessionId` - string;
- `currentScreen` входит в известный список;
- существуют `cart`, `cartLines`, `totals`, `paymentState`, `searchState`, `scannerState`, `uiConfig`, `themeProfile`;
- `cartLines` является массивом;
- `snapshotVersion` не меньше текущего;
- `runId` и `terminalLabel` совпадают с route context, если они переданы в snapshot.

После успешного apply Web принудительно оставляет свой текущий `adapterKind`. Snapshot от 1С не может переключить активный adapter.

Минимальная apply-валидация не означает, что неполный snapshot считается корректным бизнес-контрактом. UI ожидает полный shape.

## 23. Mock И Preview

`MockAdapter`:

- имитирует бизнес-runtime внутри frontend;
- нужен для demo, тестов и разработки;
- обязан использовать тот же runtime-port и snapshot shape.

`PreviewAdapter`:

- отдаёт детерминированные snapshot для фиксированных состояний;
- нужен для visual/dev/acceptance проверок;
- не вызывает 1С;
- не пишет команды в `OneCInterfaceAdapter`;
- не является business runtime.

## 24. Inactivity Timeout

Текущие поля:

- `uiConfig.inactivityTimeoutSeconds`;
- `uiConfig.inactivityWarningSeconds`;
- `modalState.type='timeoutWarning'`;
- `resetToStart` с reason `inactivityTimeout`.

Runtime владеет итоговым timeout-решением. UI может вести presentation/activity механику, но не должен ломать оплату, если acquiring/payment уже в процессе.

## 25. Запреты Для UI

В UI-компонентах запрещено:

- определять скидку по префиксу штрихкода;
- искать товар по barcode напрямую;
- считать `lineTotal`, `payableTotal`, скидку или налог;
- напрямую вызывать 1С/payment/search/scanner/theme adapters;
- мутировать cart/payment/search state вне snapshot;
- делать отдельный preview-only render path;
- принимать payment outcome без snapshot;
- использовать localStorage как source of truth для корзины или оплаты.

Разрешено:

- хранить локальный draft ввода;
- открывать/закрывать UI-owned клавиатуру или numpad;
- отправлять typed commands;
- рисовать поля snapshot;
- использовать `formatted` строки из snapshot для отображения.

## 26. Критерий Соответствия

Runtime-port считается соблюдённым, если:

- все действия пользователя проходят через typed commands;
- UI рендерит все рабочие экраны из snapshot;
- mock, preview и onec используют один shape состояния;
- UI не импортирует конкретные adapters;
- 1С-интеграция идёт через `window.BolarsSelfCheckout`, outbound queue и inbound snapshot;
- бизнес-логика находится в runtime/1С, а не в React-компонентах.
