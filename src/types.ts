export type TerminalState =
  | { name: 'idle' }
  | { name: 'promo_idle'; slideId: string }
  | { name: 'active_cart' }
  | { name: 'scan_feedback'; result: 'success' | 'not_found' | 'blocked'; productId?: string; message: string }
  | { name: 'manual_barcode_input' }
  | { name: 'product_search'; query: string }
  | { name: 'catalog'; categoryId?: string }
  | { name: 'payment_method' }
  | { name: 'payment_pending'; method: PaymentMethod; scenarioId: string }
  | { name: 'payment_error'; reason: string; canRetry: boolean }
  | { name: 'receipt_success'; receiptId: string }
  | { name: 'receipt_error'; reason: string }
  | { name: 'help_requested'; source: string }
  | { name: 'staff_mode'; source: string }
  | { name: 'branding_demo' }
  | { name: 'session_timeout_warning'; returnTo: 'active_cart' | 'product_search' | 'catalog' };

export type TerminalEvent =
  | { type: 'START_PURCHASE' }
  | { type: 'IDLE_PROMO_TIMEOUT'; slideId: string }
  | { type: 'PROMO_TOUCH' }
  | { type: 'SCAN_SUCCESS'; productId: string; message: string }
  | { type: 'SCAN_NOT_FOUND'; code: string }
  | { type: 'SCAN_BLOCKED'; productId?: string; message: string }
  | { type: 'OPEN_MANUAL_BARCODE' }
  | { type: 'OPEN_SEARCH'; query?: string }
  | { type: 'OPEN_CATALOG'; categoryId?: string }
  | { type: 'GO_TO_PAYMENT'; cartIsEmpty: boolean }
  | { type: 'START_PAYMENT'; method: PaymentMethod; scenarioId: string }
  | { type: 'PAYMENT_SUCCESS'; receiptId: string }
  | { type: 'PAYMENT_FAILED'; reason: string }
  | { type: 'RECEIPT_FAILED'; reason: string }
  | { type: 'REQUEST_HELP'; source: string }
  | { type: 'ENTER_STAFF_MODE'; source: string }
  | { type: 'OPEN_BRANDING_DEMO' }
  | { type: 'SESSION_TIMEOUT' }
  | { type: 'SESSION_CONTINUE' }
  | { type: 'RESET_SESSION' };

export type Product = {
  id: string;
  barcode?: string;
  sku: string;
  name: string;
  brand?: string;
  category: string;
  packageSize?: string;
  price: number;
  imageTone: string;
  aliases: string[];
  tags: string[];
  isWeightedMock?: boolean;
  requiresStaffApproval?: boolean;
  isUnavailable?: boolean;
  hasPriceError?: boolean;
};

export type CartItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  addedAt: string;
};

export type PaymentMethod = 'card' | 'sbp';
export type PaymentOutcome = 'success' | 'declined' | 'timeout' | 'connection_error' | 'cancelled' | 'not_paid';

export type PaymentScenario = {
  id: string;
  label: string;
  method: PaymentMethod;
  outcome: PaymentOutcome;
  delayMs: number;
};

export type Receipt = {
  id: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  qrPayload: string;
  status: 'success' | 'failed';
};

export type StaffAction =
  | 'confirm'
  | 'remove_item'
  | 'resume_purchase'
  | 'end_session'
  | 'reset_terminal'
  | 'resolve_receipt_error';

export type BrandConfig = {
  id: string;
  storeName: string;
  logoText: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  welcomeText: string;
  tagline: string;
  terminalNumber: string;
  idleBackground: string;
};

export type PromoSlide = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  imageTone: string;
  ctaText: string;
  durationSec: number;
  isEnabled: boolean;
  brokenAsset?: boolean;
};

export type ScannerMode = 'camera' | 'mock_input' | 'keyboard';

export type DemoControlState = {
  scannerMode: ScannerMode;
  paymentScenarioId: string;
  receiptScenarioId: 'receipt_success' | 'receipt_failed_after_payment';
  edgeCasesEnabled: boolean;
  idlePromoEnabled: boolean;
  brandId: string;
};
