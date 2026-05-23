import {
  DEFAULT_TEXTS,
  MOCK_PRODUCTS,
  PACKAGE_PRODUCTS,
  createCartLine,
  createEmptySnapshot,
  emptySearchState,
  lineToCandidate,
  money,
  recalculateSnapshot
} from './defaults';
import type { CurrentScreen, DiscountState, ManagerState, SelfCheckoutStateSnapshot, TextScale } from './types';

export type PreviewScenario = {
  id: string;
  label: string;
  screen: CurrentScreen;
  createSnapshot: (textScale?: TextScale) => SelfCheckoutStateSnapshot;
};

const withScale = (snapshot: SelfCheckoutStateSnapshot, textScale: TextScale = 'normal') => ({
  ...snapshot,
  textScale,
  previewMode: true,
  adapterKind: 'preview' as const,
  featureFlags: { ...snapshot.featureFlags, previewModeEnabled: true },
  updatedAt: new Date().toISOString()
});

const base = (scenarioId: string, screen: CurrentScreen = 'start', textScale: TextScale = 'normal') =>
  withScale(
    createEmptySnapshot('preview', {
      sessionId: `preview-${scenarioId}`,
      currentScreen: screen,
      previewScenarioId: scenarioId,
      snapshotVersion: 100 + PREVIEW_SCENARIOS.findIndex((item) => item.id === scenarioId)
    }),
    textScale
  );

const cartWithProducts = (scenarioId: string, count: number, textScale: TextScale = 'normal') => {
  const lines = MOCK_PRODUCTS.slice(0, count).map((product, index) => createCartLine(product, index === 0 ? 2 : 1, index + 1, index === 0 ? 'quantityIncreased' : 'added'));
  return withScale(
    recalculateSnapshot(base(scenarioId, 'cart', textScale), lines, {
      screen: 'cart',
      searchState: emptySearchState('runtimeAdapter')
    }),
    textScale
  );
};

const paymentSetup = (scenarioId: string, textScale: TextScale = 'normal') => {
  const start = cartWithProducts(scenarioId, 4, textScale);
  const packageLine = createCartLine(PACKAGE_PRODUCTS[1], 1, start.cartLines.length + 1, 'added');
  return withScale(
    recalculateSnapshot(start, [...start.cartLines, packageLine], {
      screen: 'paymentSetup'
    }),
    textScale
  );
};

export const PREVIEW_SCENARIOS: PreviewScenario[] = [
  {
    id: 'startIdle',
    label: 'Start idle',
    screen: 'start',
    createSnapshot: (textScale = 'normal') => base('startIdle', 'start', textScale)
  },
  {
    id: 'cartEmpty',
    label: 'Cart empty',
    screen: 'cart',
    createSnapshot: (textScale = 'normal') => withScale(recalculateSnapshot(base('cartEmpty', 'cart', textScale), [], { screen: 'cart' }), textScale)
  },
  {
    id: 'cartOneItem',
    label: 'Cart 1 item',
    screen: 'cart',
    createSnapshot: (textScale = 'normal') => cartWithProducts('cartOneItem', 1, textScale)
  },
  {
    id: 'cartManyItems',
    label: 'Cart many items',
    screen: 'cart',
    createSnapshot: (textScale = 'normal') => cartWithProducts('cartManyItems', 10, textScale)
  },
  {
    id: 'cartWithManager',
    label: 'Cart with manager',
    screen: 'cart',
    createSnapshot: (textScale = 'normal') => {
      const manager: ManagerState = { status: 'bound', managerId: 'manager-preview', displayName: 'Иванов Иван', boundAt: new Date().toISOString() };
      const snapshot = cartWithProducts('cartWithManager', 1, textScale);
      return withScale(recalculateSnapshot(snapshot, snapshot.cartLines, { screen: 'cart', manager }), textScale);
    }
  },
  {
    id: 'searchBelowMin',
    label: 'Search below min length',
    screen: 'cart',
    createSnapshot: (textScale = 'normal') => {
      const snapshot = cartWithProducts('searchBelowMin', 1, textScale);
      return withScale(
        recalculateSnapshot(snapshot, snapshot.cartLines, {
          screen: 'cart',
          searchState: { ...emptySearchState('runtimeAdapter'), query: 'кл', status: 'belowMinLength', message: DEFAULT_TEXTS.searchBelowMin }
        }),
        textScale
      );
    }
  },
  {
    id: 'searchFound',
    label: 'Search found',
    screen: 'cart',
    createSnapshot: (textScale = 'normal') => {
      const snapshot = cartWithProducts('searchFound', 1, textScale);
      return withScale(
        recalculateSnapshot(snapshot, snapshot.cartLines, {
          screen: 'cart',
          searchState: {
            ...emptySearchState('runtimeAdapter'),
            query: 'клей',
            status: 'found',
            candidates: MOCK_PRODUCTS.slice(0, 2).map(lineToCandidate)
          }
        }),
        textScale
      );
    }
  },
  {
    id: 'searchNotFound',
    label: 'Search not found',
    screen: 'cart',
    createSnapshot: (textScale = 'normal') => {
      const snapshot = cartWithProducts('searchNotFound', 1, textScale);
      return withScale(
        recalculateSnapshot(snapshot, snapshot.cartLines, {
          screen: 'cart',
          searchState: { ...emptySearchState('runtimeAdapter'), query: 'xxxx', status: 'notFound', message: DEFAULT_TEXTS.searchNotFound }
        }),
        textScale
      );
    }
  },
  {
    id: 'quantityNumpad',
    label: 'Quantity numpad',
    screen: 'cart',
    createSnapshot: (textScale = 'normal') => {
      const snapshot = cartWithProducts('quantityNumpad', 1, textScale);
      const line = snapshot.cartLines[0];
      return withScale(
        recalculateSnapshot(snapshot, snapshot.cartLines, {
          screen: 'cart',
          modalState: { type: 'quantityNumpad', lineId: line.lineId, currentQuantity: line.quantity, draftQuantity: String(line.quantity), unitLabel: line.unitLabel }
        }),
        textScale
      );
    }
  },
  {
    id: 'cancelConfirmation',
    label: 'Cancel confirmation',
    screen: 'cart',
    createSnapshot: (textScale = 'normal') => {
      const snapshot = cartWithProducts('cancelConfirmation', 1, textScale);
      return withScale(
        recalculateSnapshot(snapshot, snapshot.cartLines, {
          screen: 'cart',
          modalState: {
            type: 'cancelPurchaseConfirm',
            title: DEFAULT_TEXTS.cancelConfirmTitle,
            message: 'Корзина будет очищена.',
            confirmLabel: DEFAULT_TEXTS.cancelConfirm,
            returnLabel: DEFAULT_TEXTS.cancelReturn
          }
        }),
        textScale
      );
    }
  },
  {
    id: 'paymentSetup',
    label: 'Payment setup with packages',
    screen: 'paymentSetup',
    createSnapshot: (textScale = 'normal') => paymentSetup('paymentSetup', textScale)
  },
  {
    id: 'discountApplied',
    label: 'Discount applied',
    screen: 'paymentSetup',
    createSnapshot: (textScale = 'normal') => {
      const snapshot = paymentSetup('discountApplied', textScale);
      const discount: DiscountState = { status: 'applied', discountId: 'preview-discount', phoneMasked: '+7 *** *** 12 **', label: 'Скидка по телефону', amount: money(120), message: `${DEFAULT_TEXTS.discountApplied}: -120 ₽` };
      return withScale(recalculateSnapshot(snapshot, snapshot.cartLines, { screen: 'paymentSetup', discount }), textScale);
    }
  },
  {
    id: 'discountNotFound',
    label: 'Discount not found',
    screen: 'paymentSetup',
    createSnapshot: (textScale = 'normal') => {
      const snapshot = paymentSetup('discountNotFound', textScale);
      const discount: DiscountState = { status: 'notFound', phoneMasked: '+7 *** *** 00 **', message: DEFAULT_TEXTS.discountNotFound };
      return withScale(recalculateSnapshot(snapshot, snapshot.cartLines, { screen: 'paymentSetup', discount }), textScale);
    }
  },
  {
    id: 'paymentWaiting',
    label: 'Payment waiting',
    screen: 'paymentWaiting',
    createSnapshot: (textScale = 'normal') => {
      const snapshot = paymentSetup('paymentWaiting', textScale);
      return withScale(recalculateSnapshot(snapshot, snapshot.cartLines, { screen: 'paymentWaiting', paymentStatus: 'waitingForCard' }), textScale);
    }
  },
  {
    id: 'paymentError',
    label: 'Payment error',
    screen: 'paymentError',
    createSnapshot: (textScale = 'normal') => {
      const snapshot = paymentSetup('paymentError', textScale);
      const next = recalculateSnapshot(snapshot, snapshot.cartLines, { screen: 'paymentError', paymentStatus: 'failed' });
      return withScale({ ...next, paymentState: { ...next.paymentState, failureReason: 'declined', message: DEFAULT_TEXTS.paymentFailed } }, textScale);
    }
  },
  {
    id: 'finalSuccess',
    label: 'Final success countdown',
    screen: 'finalSuccess',
    createSnapshot: (textScale = 'normal') => {
      const snapshot = paymentSetup('finalSuccess', textScale);
      return withScale(recalculateSnapshot(snapshot, snapshot.cartLines, { screen: 'finalSuccess', paymentStatus: 'success' }), textScale);
    }
  },
  {
    id: 'inactivityTimeoutWarning',
    label: 'Inactivity timeout warning',
    screen: 'cart',
    createSnapshot: (textScale = 'normal') => {
      const snapshot = cartWithProducts('inactivityTimeoutWarning', 1, textScale);
      return withScale(recalculateSnapshot(snapshot, snapshot.cartLines, { screen: 'cart', modalState: { type: 'timeoutWarning', secondsLeft: 30, returnTo: 'cart' } }), textScale);
    }
  },
  {
    id: 'textScaleLarge',
    label: 'Text scale large',
    screen: 'cart',
    createSnapshot: () => cartWithProducts('textScaleLarge', 4, 'large')
  },
  {
    id: 'textScaleExtraLarge',
    label: 'Text scale extra large',
    screen: 'cart',
    createSnapshot: () => cartWithProducts('textScaleExtraLarge', 4, 'extraLarge')
  },
  {
    id: 'themeError',
    label: 'Theme error',
    screen: 'start',
    createSnapshot: (textScale = 'normal') => withScale({ ...base('themeError', 'start', textScale), themeProfile: { id: 'bolars-light-default', status: 'error', version: '0.1', tokenSetId: 'bolars-light-default', highContrast: false } }, textScale)
  }
];

export const getPreviewScenario = (id?: string | null): PreviewScenario => PREVIEW_SCENARIOS.find((scenario) => scenario.id === id) ?? PREVIEW_SCENARIOS[0];
