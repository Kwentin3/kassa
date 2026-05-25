import {
  ALL_RUNTIME_PRODUCTS,
  DEFAULT_TEXTS,
  MOCK_PRODUCTS,
  PACKAGE_PRODUCTS,
  createCartLine,
  defaultScannerState,
  emptySearchState,
  lineToCandidate,
  maskCode,
  maskPhone,
  money,
  recalculateSnapshot,
  type RuntimeProduct
} from './defaults';
import { BaseRuntimeAdapter, type RuntimeRouteContext } from './baseAdapter';
import type { CartLine, CommandResult, DiscountState, ManagerState, SelfCheckoutCommand, SelfCheckoutStateSnapshot, TextScale } from './types';

const findProductByCode = (code: string): RuntimeProduct | undefined => ALL_RUNTIME_PRODUCTS.find((product) => product.barcode === code || product.sku === code);

const findProductByCandidate = (candidateId: string): RuntimeProduct | undefined =>
  ALL_RUNTIME_PRODUCTS.find((product) => `candidate-${product.productId}` === candidateId);

const addOrIncrementLine = (snapshot: SelfCheckoutStateSnapshot, product: RuntimeProduct): CartLine[] => {
  const existing = snapshot.cartLines.find((line) => line.productId === product.productId);
  if (existing) {
    return snapshot.cartLines.map((line) =>
      line.productId === product.productId ? createCartLine(product, line.quantity + 1, line.positionNumber, 'quantityIncreased') : { ...line, lastChange: undefined }
    );
  }
  return [...snapshot.cartLines.map((line) => ({ ...line, lastChange: undefined })), createCartLine(product, 1, snapshot.cartLines.length + 1, 'added')];
};

const updateLineQuantity = (lines: CartLine[], lineId: string, quantity: number): CartLine[] =>
  lines
    .map((line) => {
      if (line.lineId !== lineId) return { ...line, lastChange: undefined };
      const product = ALL_RUNTIME_PRODUCTS.find((item) => item.productId === line.productId);
      if (!product) return line;
      return createCartLine(product, Math.max(1, Math.trunc(quantity)), line.positionNumber, 'quantityChanged');
    })
    .map((line, index) => ({ ...line, positionNumber: index + 1 }));

const searchProducts = (query: string) => {
  const normalized = query.trim().toLocaleLowerCase('ru-RU');
  return MOCK_PRODUCTS.filter((product) => {
    const fields = [product.name, product.article, product.barcode, product.sku, ...product.aliases].join(' ').toLocaleLowerCase('ru-RU');
    return fields.includes(normalized);
  }).slice(0, 6);
};

export class MockAdapter extends BaseRuntimeAdapter {
  private finalTimer: number | undefined;
  private inactivityWarningTimer: number | undefined;
  private inactivityResetTimer: number | undefined;

  constructor(routeContext: RuntimeRouteContext) {
    super('mock', routeContext);
    this.snapshot = this.createRuntimeSnapshot();
  }

  override async dispatch(command: SelfCheckoutCommand): Promise<CommandResult> {
    const preservePendingPayment = this.snapshot.currentScreen === 'paymentWaiting' && command.type !== 'resetToStart';
    if (this.finalTimer && !preservePendingPayment) {
      window.clearTimeout(this.finalTimer);
      this.finalTimer = undefined;
    }
    this.clearInactivityTimers();

    let next = this.snapshot;

    switch (command.type) {
      case 'startPurchase':
        next = recalculateSnapshot(this.snapshot, [], {
          screen: 'cart',
          searchState: emptySearchState('mock'),
          scannerState: defaultScannerState(),
          alerts: []
        });
        break;

      case 'scanCode': {
        const code = command.payload.code.trim();
        if (code === '7770000000007') {
          const discount: DiscountState = {
            status: 'applied',
            discountId: 'discount-card-demo',
            cardMasked: maskCode(code),
            label: 'Карта БОЛАРС',
            amount: money(120),
            message: `${DEFAULT_TEXTS.discountApplied}: -120 ₽`
          };
          next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, {
            screen: this.snapshot.currentScreen === 'start' ? 'cart' : this.snapshot.currentScreen,
            discount,
            scannerState: {
              status: 'discountDetected',
              lastCodeMasked: maskCode(code),
              lastResolvedKind: 'discount',
              message: DEFAULT_TEXTS.discountApplied,
              canScan: true,
              fallbackActions: ['search', 'help']
            },
            alerts: [{ id: `alert-${command.commandId}`, kind: 'success', title: DEFAULT_TEXTS.discountApplied, message: '-120 ₽' }]
          });
          break;
        }

        if (code === '900000000001') {
          const manager: ManagerState = {
            status: 'bound',
            managerId: 'manager-demo',
            displayName: 'Петров Алексей',
            boundAt: new Date().toISOString()
          };
          next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, {
            screen: this.snapshot.currentScreen === 'start' ? 'cart' : this.snapshot.currentScreen,
            manager,
            scannerState: {
              status: 'managerDetected',
              lastCodeMasked: maskCode(code),
              lastResolvedKind: 'manager',
              message: 'Продажа закреплена за менеджером',
              canScan: true,
              fallbackActions: ['search', 'help']
            },
            alerts: [{ id: `alert-${command.commandId}`, kind: 'info', title: 'Менеджер привязан', message: manager.displayName }]
          });
          break;
        }

        const product = findProductByCode(code);
        if (!product || product.kind !== 'product') {
          next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, {
            screen: this.snapshot.currentScreen === 'start' ? 'cart' : this.snapshot.currentScreen,
            scannerState: {
              status: 'unknownCode',
              lastCodeMasked: maskCode(code),
              lastResolvedKind: 'unknown',
              message: DEFAULT_TEXTS.unknownCode,
              canScan: true,
              fallbackActions: ['search', 'help']
            },
            alerts: [{ id: `alert-${command.commandId}`, kind: 'error', title: DEFAULT_TEXTS.unknownCode }]
          });
          break;
        }

        const lines = addOrIncrementLine(this.snapshot, product);
        next = recalculateSnapshot(this.snapshot, lines, {
          screen: 'cart',
          scannerState: {
            status: 'productDetected',
            lastCodeMasked: maskCode(code),
            lastResolvedKind: 'product',
            message: 'Товар добавлен',
            canScan: true,
            fallbackActions: ['search', 'help']
          },
          searchState: emptySearchState('mock'),
          alerts: [{ id: `alert-${command.commandId}`, kind: 'success', title: 'Товар добавлен', relatedLineId: `line-${product.productId}` }]
        });
        break;
      }

      case 'searchProducts': {
        const query = command.payload.query;
        if (query.trim().length < 4) {
          next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, {
            screen: 'cart',
            searchState: { ...emptySearchState('mock'), query, status: 'belowMinLength', message: DEFAULT_TEXTS.searchBelowMin }
          });
          break;
        }
        const found = searchProducts(query);
        next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, {
          screen: 'cart',
          searchState: {
            ...emptySearchState('mock'),
            query,
            status: found.length > 0 ? 'found' : 'notFound',
            candidates: found.map(lineToCandidate),
            message: found.length > 0 ? undefined : DEFAULT_TEXTS.searchNotFound
          }
        });
        break;
      }

      case 'selectSearchCandidate': {
        const product = findProductByCandidate(command.payload.candidateId);
        if (!product) return this.fail(command, 'validationError', 'Кандидат поиска не найден');
        next = recalculateSnapshot(this.snapshot, addOrIncrementLine(this.snapshot, product), {
          screen: 'cart',
          searchState: emptySearchState('mock'),
          alerts: [{ id: `alert-${command.commandId}`, kind: 'success', title: 'Товар добавлен' }]
        });
        break;
      }

      case 'incrementQuantity': {
        const line = this.snapshot.cartLines.find((item) => item.lineId === command.payload.lineId);
        if (!line) return this.fail(command, 'validationError', 'Строка не найдена');
        next = recalculateSnapshot(this.snapshot, updateLineQuantity(this.snapshot.cartLines, line.lineId, line.quantity + 1), { screen: this.snapshot.currentScreen });
        break;
      }

      case 'decrementQuantity': {
        const line = this.snapshot.cartLines.find((item) => item.lineId === command.payload.lineId);
        if (!line) return this.fail(command, 'validationError', 'Строка не найдена');
        next = recalculateSnapshot(this.snapshot, updateLineQuantity(this.snapshot.cartLines, line.lineId, Math.max(1, line.quantity - 1)), { screen: this.snapshot.currentScreen });
        break;
      }

      case 'changeQuantity':
      case 'confirmQuantityInput':
        next = recalculateSnapshot(this.snapshot, updateLineQuantity(this.snapshot.cartLines, command.payload.lineId, command.payload.quantity), {
          screen: this.snapshot.currentScreen,
          modalState: { type: 'none' }
        });
        break;

      case 'openQuantityNumpad': {
        const line = this.snapshot.cartLines.find((item) => item.lineId === command.payload.lineId);
        if (!line) return this.fail(command, 'validationError', 'Строка не найдена');
        next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, {
          screen: this.snapshot.currentScreen,
          modalState: {
            type: 'quantityNumpad',
            lineId: line.lineId,
            currentQuantity: line.quantity,
            draftQuantity: String(line.quantity),
            unitLabel: line.unitLabel
          }
        });
        break;
      }

      case 'removeCartLine':
        if (this.snapshot.currentScreen !== 'cart' && this.snapshot.currentScreen !== 'paymentSetup') {
          return this.fail(command, 'notAllowedInCurrentState', 'Строки чека нельзя менять в текущем состоянии');
        }
        {
          const remainingLines = this.snapshot.cartLines.filter((line) => line.lineId !== command.payload.lineId);
          const nextScreen = this.snapshot.currentScreen === 'paymentSetup' && remainingLines.length > 0 ? 'paymentSetup' : 'cart';
          next = recalculateSnapshot(
            this.snapshot,
            remainingLines,
            { screen: nextScreen, modalState: { type: 'none' }, alerts: [{ id: `alert-${command.commandId}`, kind: 'info', title: 'Строка удалена' }] }
          );
        }
        break;

      case 'cancelPurchaseRequest':
        if (this.snapshot.cart.isEmpty) {
          next = this.createRuntimeSnapshot({ snapshotVersion: this.snapshot.snapshotVersion + 1 });
        } else {
          next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, {
            screen: this.snapshot.currentScreen,
            modalState: {
              type: 'cancelPurchaseConfirm',
              title: DEFAULT_TEXTS.cancelConfirmTitle,
              message: 'Корзина будет очищена.',
              confirmLabel: DEFAULT_TEXTS.cancelConfirm,
              returnLabel: DEFAULT_TEXTS.cancelReturn
            }
          });
        }
        break;

      case 'confirmCancelPurchase':
        next = this.createRuntimeSnapshot({
          snapshotVersion: this.snapshot.snapshotVersion + 1,
          terminalStatus: 'purchaseCancelled',
          alerts: [{ id: `alert-${command.commandId}`, kind: 'info', title: 'Покупка отменена' }]
        });
        break;

      case 'returnToPurchase':
        next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, {
          screen:
            this.snapshot.modalState.type !== 'none'
              ? this.snapshot.currentScreen
              : this.snapshot.currentScreen === 'paymentSetup'
                ? 'cart'
                : this.snapshot.currentScreen === 'paymentError'
                  ? 'paymentSetup'
                  : this.snapshot.currentScreen,
          modalState: { type: 'none' }
        });
        break;

      case 'goToPaymentSetup':
        if (this.snapshot.cart.isEmpty) return this.fail(command, 'notAllowedInCurrentState', 'Корзина пустая');
        next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, { screen: 'paymentSetup', modalState: { type: 'none' } });
        break;

      case 'addPackage': {
        const product = PACKAGE_PRODUCTS.find((item) => item.barcode === command.payload.packageCode);
        if (!product) return this.fail(command, 'validationError', 'Пакет не найден');
        next = recalculateSnapshot(this.snapshot, addOrIncrementLine(this.snapshot, product), {
          screen: 'paymentSetup',
          alerts: [{ id: `alert-${command.commandId}`, kind: 'success', title: `${product.name} добавлен` }]
        });
        break;
      }

      case 'applyDiscountByPhone': {
        const phone = command.payload.phone;
        const notFound = phone.replace(/\D/g, '').endsWith('0000');
        const discount: DiscountState = notFound
          ? { status: 'notFound', phoneMasked: maskPhone(phone), message: DEFAULT_TEXTS.discountNotFound }
          : {
              status: 'applied',
              discountId: 'discount-phone-demo',
              phoneMasked: maskPhone(phone),
              label: 'Скидка по телефону',
              amount: money(120),
              message: `${DEFAULT_TEXTS.discountApplied}: -120 ₽`
            };
        next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, {
          screen: 'paymentSetup',
          discount,
          alerts: [{ id: `alert-${command.commandId}`, kind: notFound ? 'warning' : 'success', title: notFound ? DEFAULT_TEXTS.discountNotFound : DEFAULT_TEXTS.discountApplied }]
        });
        break;
      }

      case 'bindManager': {
        if (command.payload.code === 'bad-manager') {
          const manager: ManagerState = {
            status: 'rejected',
            message: DEFAULT_TEXTS.managerRejected
          };
          next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, {
            screen: this.snapshot.currentScreen === 'start' ? 'cart' : this.snapshot.currentScreen,
            manager,
            alerts: [{ id: `alert-${command.commandId}`, kind: 'warning', title: DEFAULT_TEXTS.managerRejected }]
          });
          break;
        }

        const manager: ManagerState = {
          status: 'bound',
          managerId: 'manager-demo',
          displayName: 'Петров Алексей',
          boundAt: new Date().toISOString()
        };
        next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, {
          screen: this.snapshot.currentScreen === 'start' ? 'cart' : this.snapshot.currentScreen,
          manager,
          alerts: [{ id: `alert-${command.commandId}`, kind: 'info', title: 'Менеджер привязан', message: manager.displayName }]
        });
        break;
      }

      case 'startPayment':
        if (this.snapshot.paymentState.status === 'waitingForCard') return this.fail(command, 'runtimeBusy', 'Оплата уже запущена');
        if (this.snapshot.cart.isEmpty) return this.fail(command, 'notAllowedInCurrentState', 'Корзина пустая');
        next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, { screen: 'paymentWaiting', paymentStatus: 'waitingForCard' });
        this.finalTimer = window.setTimeout(() => {
          if (this.routeContext.url.searchParams.get('mockPayment') === 'failed') {
            const failed = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, {
              screen: 'paymentError',
              paymentStatus: 'failed',
              alerts: [{ id: `alert-${command.commandId}`, kind: 'error', title: DEFAULT_TEXTS.paymentFailed, message: DEFAULT_TEXTS.paymentFailureHint }]
            });
            this.setSnapshot(failed, { type: 'paymentFailed', reason: 'declined' });
            return;
          }

          const success = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, { screen: 'finalSuccess', paymentStatus: 'success' });
          this.setSnapshot(success, { type: 'paymentSucceeded', paymentId: 'mock-payment-success' });
        }, 1200);
        break;

      case 'retryPayment':
        next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, { screen: 'paymentWaiting', paymentStatus: 'waitingForCard' });
        break;

      case 'returnToPaymentSetup':
        next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, { screen: 'paymentSetup', paymentStatus: 'idle' });
        break;

      case 'setTextScale':
        next = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, { screen: this.snapshot.currentScreen, textScale: command.payload.scale as TextScale });
        break;

      case 'resetToStart':
        next = this.createRuntimeSnapshot({ snapshotVersion: this.snapshot.snapshotVersion + 1 });
        break;

      default:
        return this.fail(command, 'invalidCommand', 'Команда не поддержана');
    }

    next = {
      ...next,
      lastProcessedCommandId: command.commandId,
      lastCommandResult: { ok: true, commandId: command.commandId, processedAt: new Date().toISOString() }
    };
    this.setSnapshot(next, { type: 'commandAccepted', commandId: command.commandId, commandType: command.type });
    this.armInactivityTimers();
    return { ok: true as const, commandId: command.commandId, snapshotVersion: next.snapshotVersion };
  }

  private clearInactivityTimers() {
    if (this.inactivityWarningTimer) window.clearTimeout(this.inactivityWarningTimer);
    if (this.inactivityResetTimer) window.clearTimeout(this.inactivityResetTimer);
    this.inactivityWarningTimer = undefined;
    this.inactivityResetTimer = undefined;
  }

  private armInactivityTimers() {
    if (this.snapshot.currentScreen === 'start' || this.snapshot.currentScreen === 'paymentWaiting' || this.snapshot.currentScreen === 'finalSuccess') return;
    const timeoutMs = this.snapshot.uiConfig.inactivityTimeoutSeconds * 1000;
    const warningMs = Math.max(0, timeoutMs - this.snapshot.uiConfig.inactivityWarningSeconds * 1000);

    this.inactivityWarningTimer = window.setTimeout(() => {
      if (this.snapshot.currentScreen === 'start' || this.snapshot.currentScreen === 'paymentWaiting' || this.snapshot.currentScreen === 'finalSuccess') return;
      const warned = recalculateSnapshot(this.snapshot, this.snapshot.cartLines, {
        screen: this.snapshot.currentScreen,
        modalState: { type: 'timeoutWarning', secondsLeft: this.snapshot.uiConfig.inactivityWarningSeconds, returnTo: this.snapshot.currentScreen }
      });
      this.setSnapshot(warned, { type: 'stateChanged', snapshotVersion: warned.snapshotVersion });
    }, warningMs);

    this.inactivityResetTimer = window.setTimeout(() => {
      if (this.snapshot.currentScreen === 'paymentWaiting') return;
      this.setSnapshot(
        this.createRuntimeSnapshot({
          snapshotVersion: this.snapshot.snapshotVersion + 1,
          terminalStatus: 'inactivityTimedOut',
          alerts: [{ id: 'inactivity-timeout', kind: 'warning', title: 'Сработал таймаут неактивности' }]
        }),
        { type: 'sessionReset', reason: 'inactivityTimeout' }
      );
      this.clearInactivityTimers();
    }, timeoutMs);
  }
}
