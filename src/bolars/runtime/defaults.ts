import type {
  AdapterKind,
  AlertNotification,
  CartLine,
  CartState,
  DiscountState,
  FeatureFlagsState,
  ManagerState,
  Money,
  PaymentState,
  ScannerState,
  SearchCandidate,
  SearchState,
  SelfCheckoutStateSnapshot,
  TextScale,
  ThemeProfileState,
  TotalsState,
  UiConfigState
} from './types';

export type RuntimeProduct = {
  productId: string;
  sku: string;
  barcode: string;
  name: string;
  article: string;
  unitPrice: number;
  unitLabel: string;
  packageLabel?: string;
  aliases: string[];
  kind: 'product' | 'package';
};

export const BOLARS_ROUTE = '/bolars/self-checkout-mvp';

export const DEFAULT_TEXTS = {
  startInstruction: 'Поднесите штрих-код товара к сканеру',
  startAction: 'Начать покупку',
  mockScan: 'Сканировать тестовый товар',
  cartTitle: 'Ваши покупки',
  cancelPurchase: 'Отменить покупку',
  searchPlaceholder: 'Поиск товара по названию, артикулу или штрих-коду',
  searchBelowMin: 'Введите минимум 4 символа',
  searchNotFound: 'Товар не найден',
  goToPayment: 'Перейти к оплате',
  paymentTitle: 'Оплата',
  pay: 'Оплатить',
  discountHint: 'Для применения скидки отсканируйте карту или введите номер телефона',
  discountApplied: 'Скидка применена',
  discountNotFound: 'Скидка не найдена',
  unknownCode: 'Код не распознан. Обратитесь к сотруднику.',
  paymentWaitingInstruction: 'Приложите карту к терминалу оплаты',
  paymentWaitingStatus: 'Ожидаем оплату...',
  paymentSuccess: 'Оплата прошла успешно',
  paymentFailed: 'Оплата не прошла',
  paymentFailureHint: 'Попробуйте ещё раз или обратитесь к сотруднику',
  finalTitle: 'Спасибо за покупку!',
  finalSubtitle: 'До новых встреч',
  cancelConfirmTitle: 'Отменить покупку и очистить корзину?',
  cancelConfirm: 'Да, отменить',
  cancelReturn: 'Вернуться к покупке',
  startSubtitle: 'Сканируйте товар. После первого товара откроется корзина.',
  helpAvailable: 'Помощь сотрудника доступна на рабочих экранах',
  emptyCartTitle: 'Корзина пока пустая',
  emptyCartHint: 'Сканируйте штрих-код товара или найдите товар вручную.',
  total: 'Итого',
  totalToPay: 'Итого к оплате',
  positions: 'позиций',
  pieces: 'шт',
  scanMore: 'Сканировать ещё товар',
  addProduct: 'Добавить товар',
  addProductHint: 'Сымитировать сканирование следующего товара',
  searchInProgress: 'Поиск выполняется...',
  reviewTitle: 'Состав покупки',
  addPackageTitle: 'Добавить пакет',
  discountTitle: 'Скидка',
  apply: 'Применить',
  paymentWaitingAmount: 'Сумма к оплате',
  retryPayment: 'Попробовать ещё раз',
  returnToPayment: 'Вернуться к оплате',
  managerCard: 'Карта менеджера',
  finalCountdown: 'Возврат на старт через',
  secondsShort: 'сек.',
  purchaseWillBeCancelled: 'Покупка будет отменена',
  resetSecondsLeft: 'До сброса осталось',
  quantity: 'Количество',
  clear: 'C',
  ok: 'OK',
  compactOrderPreview: 'Состав покупки',
  receiptPreview: 'Покупка оплачена',
  moreItems: 'ещё позиций',
  managerBound: 'Менеджер привязан',
  managerRejected: 'Карта менеджера не распознана',
  productAdded: 'Товар добавлен',
  productRemoved: 'Товар удалён',
  purchaseCancelled: 'Покупка отменена',
  quantityIncreased: 'Количество увеличено',
  quantityChanged: 'Количество изменено'
};

export const MOCK_PRODUCTS: RuntimeProduct[] = [
  {
    productId: 'bolars-glue-standard',
    sku: 'BL-GLUE-25',
    barcode: '4600001000011',
    name: 'Клей плиточный БОЛАРС Стандарт, 25 кг',
    article: 'БЛ-001',
    unitPrice: 480,
    unitLabel: 'шт',
    packageLabel: 'мешок 25 кг',
    aliases: ['клей', 'плиточный', 'стандарт'],
    kind: 'product'
  },
  {
    productId: 'bolars-primer-deep',
    sku: 'BL-PRIMER-10',
    barcode: '4600001000028',
    name: 'Грунтовка глубокого проникновения БОЛАРС, 10 л',
    article: 'БЛ-014',
    unitPrice: 620,
    unitLabel: 'шт',
    packageLabel: 'канистра 10 л',
    aliases: ['грунтовка', 'грунт', 'проникновения'],
    kind: 'product'
  },
  {
    productId: 'bolars-grout-white',
    sku: 'BL-GROUT-W',
    barcode: '4600001000035',
    name: 'Затирка для швов БОЛАРС белая, 2 кг',
    article: 'БЛ-027',
    unitPrice: 210,
    unitLabel: 'шт',
    packageLabel: 'пакет 2 кг',
    aliases: ['затирка', 'швы', 'белая'],
    kind: 'product'
  },
  {
    productId: 'tool-drill-basic',
    sku: 'DRL-500',
    barcode: '4600001000042',
    name: 'Дрель ударная 500 Вт',
    article: 'ИН-118',
    unitPrice: 2490,
    unitLabel: 'шт',
    aliases: ['дрель', 'инструмент', 'ударная'],
    kind: 'product'
  }
];

export const PACKAGE_PRODUCTS: RuntimeProduct[] = [
  {
    productId: 'package-small',
    sku: 'PKG-S',
    barcode: 'PKG-S',
    name: 'Маленький пакет',
    article: 'ПАК-С',
    unitPrice: 7,
    unitLabel: 'шт',
    aliases: ['пакет', 'маленький'],
    kind: 'package'
  },
  {
    productId: 'package-medium',
    sku: 'PKG-M',
    barcode: 'PKG-M',
    name: 'Средний пакет',
    article: 'ПАК-М',
    unitPrice: 12,
    unitLabel: 'шт',
    aliases: ['пакет', 'средний'],
    kind: 'package'
  },
  {
    productId: 'package-large',
    sku: 'PKG-L',
    barcode: 'PKG-L',
    name: 'Большой пакет',
    article: 'ПАК-Б',
    unitPrice: 18,
    unitLabel: 'шт',
    aliases: ['пакет', 'большой'],
    kind: 'package'
  }
];

export const ALL_RUNTIME_PRODUCTS = [...MOCK_PRODUCTS, ...PACKAGE_PRODUCTS];

export const money = (amount: number): Money => ({
  amount,
  currency: 'RUB',
  formatted: `${new Intl.NumberFormat('ru-RU').format(amount)} ₽`
});

export const maskCode = (code: string): string => {
  if (code.length <= 4) return '****';
  return `${code.slice(0, 3)}****${code.slice(-2)}`;
};

export const maskPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '+7 *** *** ** **';
  return `+7 *** *** ${digits.slice(-2).padStart(2, '*')} **`;
};

export const createUiConfig = (): UiConfigState => ({
  viewportProfile: 'portrait1080',
  language: 'ru',
  showClock: true,
  showManagerBadge: true,
  showHelpAction: true,
  searchMinLength: 4,
  searchFields: ['name', 'article', 'barcodeDigits'],
  searchMaxCandidates: 6,
  searchCandidateDisplayFormatId: 'name-article-price',
  finalAutoResetSeconds: 4,
  inactivityTimeoutSeconds: 300,
  inactivityWarningSeconds: 30,
  productImageMode: 'hide',
  motionProfile: 'normal',
  paymentProviderLabel: 'банковский терминал',
  paymentResponseTimeoutSeconds: 60,
  packageButtons: PACKAGE_PRODUCTS.map((item) => ({ packageCode: item.barcode, label: item.name })),
  texts: DEFAULT_TEXTS
});

export const createThemeProfile = (): ThemeProfileState => ({
  id: 'bolars-light-default',
  status: 'loaded',
  version: '0.1',
  tokenSetId: 'bolars-light-default',
  highContrast: false
});

export const createFeatureFlags = (adapterKind: AdapterKind): FeatureFlagsState => ({
  mockMode: adapterKind === 'mock',
  manualSearchEnabled: true,
  quantityNumpadEnabled: true,
  packagesEnabled: true,
  discountByPhoneEnabled: true,
  managerBindingEnabled: true,
  paymentRetryEnabled: true,
  finalReceiptPreviewEnabled: false,
  previewModeEnabled: adapterKind === 'preview'
});

export const emptySearchState = (source: SearchState['source']): SearchState => ({
  query: '',
  minQueryLength: 4,
  source,
  fields: ['name', 'article', 'barcodeDigits'],
  maxCandidates: 6,
  candidateDisplayFormatId: 'name-article-price',
  status: 'idle',
  candidates: []
});

export const defaultScannerState = (): ScannerState => ({
  status: 'idle',
  canScan: true,
  fallbackActions: ['search', 'help']
});

export const defaultDiscountState = (): DiscountState => ({
  status: 'waitingForScanOrPhone',
  message: DEFAULT_TEXTS.discountHint
});

export const defaultManagerState = (): ManagerState => ({
  status: 'none'
});

export const totalsFromLines = (lines: CartLine[], discount: DiscountState): TotalsState => {
  const goodsSubtotal = lines.filter((line) => !line.productId.startsWith('package-')).reduce((sum, line) => sum + line.lineTotal.amount, 0);
  const packageSubtotal = lines.filter((line) => line.productId.startsWith('package-')).reduce((sum, line) => sum + line.lineTotal.amount, 0);
  const discountAmount = discount.amount?.amount ?? 0;
  const payable = Math.max(0, goodsSubtotal + packageSubtotal - discountAmount);

  return {
    goodsSubtotal: money(goodsSubtotal),
    packageSubtotal: money(packageSubtotal),
    discountTotal: money(discountAmount),
    payableTotal: money(payable),
    lines: [
      { id: 'goods', label: 'Товары', value: money(goodsSubtotal), kind: 'goods' },
      { id: 'packages', label: 'Пакеты', value: money(packageSubtotal), kind: 'package' },
      { id: 'discount', label: 'Скидка', value: money(discountAmount), kind: 'discount' },
      { id: 'total', label: 'Итого', value: money(payable), kind: 'total' }
    ]
  };
};

export const cartStateFromLines = (lines: CartLine[], status: CartState['status'] = lines.length === 0 ? 'empty' : 'active'): CartState => {
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  return {
    id: 'cart-current',
    status,
    lineCount: lines.length,
    itemCount: quantity,
    isEmpty: lines.length === 0,
    canGoToPayment: lines.length > 0 && status === 'active',
    updatedAt: new Date().toISOString()
  };
};

export const paymentStateFromTotals = (totals: TotalsState, status: PaymentState['status'] = 'idle'): PaymentState => ({
  status,
  amount: totals.payableTotal,
  method: status === 'idle' ? 'unknown' : 'card',
  canRetry: status === 'failed' || status === 'timeout',
  canReturnToPaymentSetup: status === 'failed' || status === 'timeout',
  message:
    status === 'waitingForCard'
      ? DEFAULT_TEXTS.paymentWaitingStatus
      : status === 'failed'
        ? DEFAULT_TEXTS.paymentFailed
        : status === 'success'
          ? DEFAULT_TEXTS.paymentSuccess
          : undefined,
  updatedAt: new Date().toISOString()
});

type CartLineChangeKind = NonNullable<CartLine['lastChange']>['kind'];

export const createCartLine = (product: RuntimeProduct, quantity: number, positionNumber: number, changeKind: CartLineChangeKind = 'added'): CartLine => {
  const now = new Date().toISOString();
  return {
    lineId: `line-${product.productId}`,
    positionNumber,
    productId: product.productId,
    sku: product.sku,
    barcode: product.kind === 'product' ? product.barcode : undefined,
    name: product.name,
    article: product.article,
    packageLabel: product.packageLabel,
    quantity,
    quantityMode: 'integer',
    unitLabel: product.unitLabel,
    unitPrice: money(product.unitPrice),
    lineTotal: money(product.unitPrice * quantity),
    isRemovable: true,
    quantityControls: {
      canIncrement: true,
      canDecrement: quantity > 1,
      canOpenNumpad: true
    },
    lastChange: {
      kind: changeKind,
      occurredAt: now,
      highlightUntil: new Date(Date.now() + 1400).toISOString(),
      message:
        changeKind === 'quantityIncreased'
          ? 'Количество увеличено'
          : changeKind === 'quantityChanged'
            ? 'Количество изменено'
            : 'Товар добавлен'
    }
  };
};

export const lineToCandidate = (product: RuntimeProduct): SearchCandidate => ({
  candidateId: `candidate-${product.productId}`,
  productId: product.productId,
  name: product.name,
  article: product.article,
  barcodeMasked: maskCode(product.barcode),
  identifierLabel: `${product.article} · ${maskCode(product.barcode)}`,
  packageLabel: product.packageLabel,
  price: money(product.unitPrice),
  actionLabel: 'Добавить'
});

export const createEmptySnapshot = (adapterKind: AdapterKind, overrides: Partial<SelfCheckoutStateSnapshot> = {}): SelfCheckoutStateSnapshot => {
  const discount = defaultDiscountState();
  const totals = totalsFromLines([], discount);
  const now = new Date().toISOString();
  return {
    snapshotVersion: 1,
    sessionId: 'session-idle',
    terminalStatus: 'terminalFree',
    currentScreen: 'start',
    cart: cartStateFromLines([]),
    cartLines: [],
    totals,
    discount,
    manager: defaultManagerState(),
    searchState: emptySearchState(adapterKind === 'onec' ? 'oneC' : adapterKind === 'mock' ? 'mock' : 'runtimeAdapter'),
    scannerState: defaultScannerState(),
    paymentState: paymentStateFromTotals(totals),
    alerts: [],
    modalState: { type: 'none' },
    textScale: 'normal',
    themeProfile: createThemeProfile(),
    uiConfig: createUiConfig(),
    featureFlags: createFeatureFlags(adapterKind),
    adapterKind,
    previewMode: adapterKind === 'preview',
    updatedAt: now,
    ...overrides
  };
};

export const recalculateSnapshot = (
  snapshot: SelfCheckoutStateSnapshot,
  lines: CartLine[],
  options: {
    screen?: SelfCheckoutStateSnapshot['currentScreen'];
    discount?: DiscountState;
    manager?: ManagerState;
    searchState?: SearchState;
    scannerState?: ScannerState;
    paymentStatus?: PaymentState['status'];
    modalState?: SelfCheckoutStateSnapshot['modalState'];
    alerts?: AlertNotification[];
    textScale?: TextScale;
  } = {}
): SelfCheckoutStateSnapshot => {
  const discount = options.discount ?? snapshot.discount;
  const totals = totalsFromLines(lines, discount);
  const screen = options.screen ?? snapshot.currentScreen;
  const cartStatus = screen === 'paymentWaiting' ? 'lockedForPayment' : lines.length === 0 ? 'empty' : 'active';
  return {
    ...snapshot,
    snapshotVersion: snapshot.snapshotVersion + 1,
    terminalStatus: screen === 'start' ? 'terminalFree' : screen === 'paymentWaiting' ? 'paymentInProgress' : screen === 'finalSuccess' ? 'purchaseCompleted' : 'purchaseStarted',
    currentScreen: screen,
    cart: cartStateFromLines(lines, cartStatus),
    cartLines: lines.map((line, index) => ({ ...line, positionNumber: index + 1 })),
    totals,
    discount,
    manager: options.manager ?? snapshot.manager,
    searchState: options.searchState ?? snapshot.searchState,
    scannerState: options.scannerState ?? snapshot.scannerState,
    paymentState: paymentStateFromTotals(totals, options.paymentStatus ?? snapshot.paymentState.status),
    modalState: options.modalState ?? snapshot.modalState,
    alerts: options.alerts ?? snapshot.alerts,
    textScale: options.textScale ?? snapshot.textScale,
    updatedAt: new Date().toISOString()
  };
};
