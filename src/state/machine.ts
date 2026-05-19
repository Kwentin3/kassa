import type { TerminalEvent, TerminalState } from '../types';

const activeStates = new Set<TerminalState['name']>([
  'active_cart',
  'scan_feedback',
  'manual_barcode_input',
  'product_search',
  'catalog',
  'payment_method',
  'payment_error'
]);

export const isReceiptIssueState = (state: TerminalState): boolean =>
  state.name === 'receipt_error' ||
  ((state.name === 'help_requested' || state.name === 'staff_mode') && state.source === 'Ошибка чека');

export const canShowIdlePromo = (state: TerminalState): boolean => state.name === 'idle';
export const canOpenBrandingDemo = (state: TerminalState): boolean =>
  state.name === 'idle' || state.name === 'promo_idle' || (state.name === 'staff_mode' && !isReceiptIssueState(state)) || state.name === 'branding_demo';

export const transition = (state: TerminalState, event: TerminalEvent): TerminalState => {
  switch (event.type) {
    case 'START_PURCHASE':
      if (state.name === 'payment_pending' || isReceiptIssueState(state)) return state;
      return { name: 'active_cart' };
    case 'IDLE_PROMO_TIMEOUT':
      return canShowIdlePromo(state) ? { name: 'promo_idle', slideId: event.slideId } : state;
    case 'PROMO_TOUCH':
      return state.name === 'promo_idle' ? { name: 'active_cart' } : state;
    case 'SCAN_SUCCESS':
      return { name: 'scan_feedback', result: 'success', productId: event.productId, message: event.message };
    case 'SCAN_NOT_FOUND':
      return { name: 'scan_feedback', result: 'not_found', message: `Код ${event.code} не найден` };
    case 'SCAN_BLOCKED':
      return { name: 'scan_feedback', result: 'blocked', productId: event.productId, message: event.message };
    case 'OPEN_MANUAL_BARCODE':
      return state.name === 'payment_pending' ? state : { name: 'manual_barcode_input' };
    case 'OPEN_SEARCH':
      return state.name === 'payment_pending' ? state : { name: 'product_search', query: event.query ?? '' };
    case 'OPEN_CATALOG':
      return state.name === 'payment_pending' ? state : { name: 'catalog', categoryId: event.categoryId };
    case 'GO_TO_PAYMENT':
      return event.cartIsEmpty || state.name === 'payment_pending' ? state : { name: 'payment_method' };
    case 'START_PAYMENT':
      return state.name === 'payment_method' ? { name: 'payment_pending', method: event.method, scenarioId: event.scenarioId } : state;
    case 'PAYMENT_SUCCESS':
      return state.name === 'payment_pending' ? { name: 'receipt_success', receiptId: event.receiptId } : state;
    case 'PAYMENT_FAILED':
      return state.name === 'payment_pending' ? { name: 'payment_error', reason: event.reason, canRetry: true } : state;
    case 'RECEIPT_FAILED':
      return state.name === 'payment_pending' ? { name: 'receipt_error', reason: event.reason } : state;
    case 'REQUEST_HELP':
      return { name: 'help_requested', source: event.source };
    case 'ENTER_STAFF_MODE':
      return { name: 'staff_mode', source: state.name === 'help_requested' ? state.source : event.source };
    case 'OPEN_BRANDING_DEMO':
      return canOpenBrandingDemo(state) ? { name: 'branding_demo' } : state;
    case 'SESSION_TIMEOUT':
      if (state.name === 'product_search' || state.name === 'catalog' || state.name === 'active_cart') {
        return { name: 'session_timeout_warning', returnTo: state.name };
      }
      return state;
    case 'SESSION_CONTINUE':
      if (state.name !== 'session_timeout_warning') return state;
      if (state.returnTo === 'product_search') return { name: 'product_search', query: '' };
      if (state.returnTo === 'catalog') return { name: 'catalog' };
      return { name: 'active_cart' };
    case 'RESET_SESSION':
      return { name: 'idle' };
    default:
      return state;
  }
};

export const isActivePurchaseState = (state: TerminalState): boolean => activeStates.has(state.name);
