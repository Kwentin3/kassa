export type CurrentScreen = 'start' | 'cart' | 'paymentSetup' | 'paymentWaiting' | 'paymentError' | 'finalSuccess';

export type TextScale = 'normal' | 'large' | 'extraLarge';

export type AdapterKind = 'mock' | 'preview' | 'onec' | 'unknown';

export type ResetReason =
  | 'finalCountdown'
  | 'cancelConfirmed'
  | 'emptyCartCancel'
  | 'inactivityTimeout'
  | 'staffReset'
  | 'runtimeRecovery'
  | 'mockScenarioReset';

export type CommandSource = 'scanner' | 'touch' | 'keyboard' | 'system' | 'mock';

export type PaymentStatus =
  | 'idle'
  | 'preparing'
  | 'waitingForCard'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'timeout'
  | 'unknown';

export type PaymentFailureReason = 'declined' | 'terminalUnavailable' | 'connectionError' | 'timeout' | 'cancelled' | 'unknown';

export type ScannerStatus =
  | 'idle'
  | 'scanning'
  | 'productDetected'
  | 'discountDetected'
  | 'managerDetected'
  | 'unknownCode'
  | 'markedProductPendingDecision'
  | 'error';

export type CommandType =
  | 'startPurchase'
  | 'scanCode'
  | 'searchProducts'
  | 'selectSearchCandidate'
  | 'changeQuantity'
  | 'incrementQuantity'
  | 'decrementQuantity'
  | 'openQuantityNumpad'
  | 'confirmQuantityInput'
  | 'removeCartLine'
  | 'cancelPurchaseRequest'
  | 'confirmCancelPurchase'
  | 'returnToPurchase'
  | 'goToPaymentSetup'
  | 'addPackage'
  | 'applyDiscountByPhone'
  | 'startPayment'
  | 'retryPayment'
  | 'returnToPaymentSetup'
  | 'bindManager'
  | 'setTextScale'
  | 'resetToStart';

export type CommandEnvelope<TType extends CommandType, TPayload = undefined> = {
  type: TType;
  commandId: string;
  issuedAt: string;
  source: CommandSource;
  payload: TPayload;
};

export type SelfCheckoutCommand =
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

export type RuntimeCommandError = {
  code: 'invalidCommand' | 'notAllowedInCurrentState' | 'validationError' | 'runtimeBusy' | 'queueOverflow' | 'runtimeUnavailable' | 'adapterError' | 'timeout' | 'unknown';
  message: string;
  fieldErrors?: Record<string, string>;
};

export type CommandResult =
  | { ok: true; commandId: string; snapshotVersion: number }
  | { ok: false; commandId: string; error: RuntimeCommandError; snapshotVersion?: number };

export type RuntimeEvent =
  | { type: 'stateChanged'; snapshotVersion: number }
  | { type: 'commandAccepted'; commandId: string; commandType: SelfCheckoutCommand['type'] }
  | { type: 'commandRejected'; commandId: string; reason: RuntimeCommandError }
  | { type: 'paymentSucceeded'; paymentId: string }
  | { type: 'paymentFailed'; reason: PaymentFailureReason }
  | { type: 'sessionReset'; reason: ResetReason };

export type Money = {
  amount: number;
  currency: 'RUB';
  formatted: string;
};

export type CartState = {
  id: string;
  status: 'empty' | 'active' | 'lockedForPayment' | 'completed' | 'cancelled';
  lineCount: number;
  itemCount: number;
  isEmpty: boolean;
  canGoToPayment: boolean;
  updatedAt: string;
};

export type CartLine = {
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

export type TotalsState = {
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

export type SearchCandidate = {
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

export type SearchState = {
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

export type ScannerState = {
  status: ScannerStatus;
  lastCodeMasked?: string;
  lastResolvedKind?: 'product' | 'discount' | 'manager' | 'unknown' | 'markedProduct' | 'error';
  message?: string;
  canScan: boolean;
  fallbackActions: Array<'search' | 'manualCode' | 'help'>;
};

export type PaymentState = {
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
};

export type DiscountState = {
  status: 'none' | 'waitingForScanOrPhone' | 'checking' | 'applied' | 'notFound' | 'error';
  discountId?: string;
  phoneMasked?: string;
  cardMasked?: string;
  label?: string;
  amount?: Money;
  message?: string;
};

export type ManagerState = {
  status: 'none' | 'binding' | 'bound' | 'rejected' | 'error';
  managerId?: string;
  displayName?: string;
  boundAt?: string;
  message?: string;
};

export type ModalState =
  | { type: 'none' }
  | { type: 'quantityNumpad'; lineId: string; currentQuantity: number; draftQuantity: string; unitLabel: string }
  | { type: 'cancelPurchaseConfirm'; title: string; message: string; confirmLabel: string; returnLabel: string }
  | { type: 'timeoutWarning'; secondsLeft: number; returnTo: CurrentScreen }
  | { type: 'alertDetails'; alertId: string };

export type AlertNotification = {
  id: string;
  kind: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  relatedLineId?: string;
  autoDismissMs?: number;
};

export type UiConfigState = {
  viewportProfile: 'portrait1080' | 'portraitCompact' | 'landscapeFallback';
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

export type ThemeProfileState = {
  id: 'bolars-light-default' | 'bolars-light-contrast' | 'bolars-dark-optional' | 'custom';
  status: 'loaded' | 'defaultProfile' | 'error';
  version: string;
  tokenSetId: string;
  highContrast: boolean;
};

export type FeatureFlagsState = {
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

export type SnapshotCommandResult = {
  ok: boolean;
  commandId: string;
  processedAt?: string;
  error?: RuntimeCommandError;
};

export type SelfCheckoutStateSnapshot = {
  snapshotVersion: number;
  sessionId: string;
  terminalStatus: 'terminalFree' | 'purchaseStarted' | 'paymentInProgress' | 'purchaseCompleted' | 'purchaseCancelled' | 'inactivityTimedOut';
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

export type Unsubscribe = () => void;

export interface SelfCheckoutRuntimePort {
  dispatch(command: SelfCheckoutCommand): Promise<CommandResult>;
  getState(): SelfCheckoutStateSnapshot;
  subscribe(listener: (snapshot: SelfCheckoutStateSnapshot, event?: RuntimeEvent) => void): Unsubscribe;
}

export type DeliveryStatus = 'queued' | 'drainedByOneC' | 'processing' | 'snapshotReceived' | 'acknowledged' | 'failed' | 'timeout' | 'unknown';

export type OutboundCommandRecord = {
  command: SelfCheckoutCommand;
  status: DeliveryStatus;
  queuedAt: string;
  drainedAt?: string;
  completedAt?: string;
  error?: RuntimeCommandError;
};

export type ApplyStatus = {
  ok: boolean;
  kind: 'snapshot' | 'config' | 'catalog' | 'command' | 'runtimeInfo';
  snapshotVersion?: number;
  errors: string[];
  warnings: string[];
  renderedScreen?: CurrentScreen;
  rejectedReason?: string;
  lastValidSnapshotVersion?: number;
  updatedAt: string;
};

export type RuntimeDebugState = {
  ok: boolean;
  route: string;
  debug: boolean;
  ready: boolean;
  runId?: string;
  terminalLabel?: string;
  buildId: string;
  viewport: { width: number; height: number; profile: string };
  api: Record<string, boolean | string>;
  adapter: {
    adapterKind: AdapterKind;
    previewMode: boolean;
    selectedPreviewScreen?: CurrentScreen;
    selectedPreviewScenario?: string;
    previewSnapshotVersion?: number;
    outboundCommandsMode: 'disabled' | 'local' | 'queued';
    previewWarning?: string;
    runtimePortStatus: 'ready' | 'initializing' | 'error';
    pendingOutboundCount: number;
    lastRoundtripMs?: number;
  };
  outboundQueue: {
    pendingCount: number;
    queuedCount: number;
    drainedCount: number;
    processingCount: number;
    failedCount: number;
    timeoutCount: number;
    lastUnackedCommandId: string | null;
    oldestPendingAgeMs: number | null;
    queueOverflow: boolean;
    lastDrainAt: string | null;
    lastSnapshotCorrelationCommandId: string | null;
  };
  lastOutboundCommand: null | {
    type: string;
    commandId: string;
    issuedAt: string;
    payloadSummary: string;
    deliveryStatus: DeliveryStatus;
  };
  lastInboundSnapshot: null | {
    snapshotVersion: number;
    lastProcessedCommandId?: string;
    lastCommandResult?: SnapshotCommandResult;
    currentScreen: CurrentScreen;
    cartLineCount: number;
    paymentStatus: PaymentStatus;
    managerStatus: ManagerState['status'];
    alertsCount: number;
  };
  lastApplyStatus: ApplyStatus;
};
