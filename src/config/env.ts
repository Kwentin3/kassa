type CameraMode = 'html5-qrcode' | 'zxing' | 'disabled';

const read = (key: string, fallback: string): string => {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
};

const bool = (key: string, fallback: boolean): boolean => {
  const value = import.meta.env[key];
  if (value === undefined || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const int = (key: string, fallback: number): number => {
  const raw = import.meta.env[key];
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const env = {
  appName: read('VITE_APP_NAME', 'Self-Checkout Terminal Web UI Prototype'),
  appEnv: read('VITE_APP_ENV', 'demo'),
  appVersion: read('VITE_APP_VERSION', '0.1.0'),
  baseUrl: read('VITE_BASE_URL', globalThis.location?.origin ?? 'http://localhost:5173'),
  demoMode: bool('VITE_DEMO_MODE', true),
  defaultLocale: read('VITE_DEFAULT_LOCALE', 'ru'),
  terminalId: read('VITE_TERMINAL_ID', 'DEMO-001'),
  defaultBrand: read('VITE_DEFAULT_BRAND', 'demo-market'),
  enableQuickBranding: bool('VITE_ENABLE_QUICK_BRANDING', true),
  enableIdlePromo: bool('VITE_ENABLE_IDLE_PROMO', true),
  idlePromoDelaySec: int('VITE_IDLE_PROMO_DELAY_SEC', 20),
  enableCameraScanner: bool('VITE_ENABLE_CAMERA_SCANNER', true),
  cameraScannerMode: read('VITE_CAMERA_SCANNER_MODE', 'html5-qrcode') as CameraMode,
  scannerFallbackEnabled: bool('VITE_SCANNER_FALLBACK_ENABLED', true),
  mockCatalogSource: read('VITE_MOCK_CATALOG_SOURCE', 'local-fixtures'),
  mockPaymentMode: read('VITE_MOCK_PAYMENT_MODE', 'demo'),
  mockReceiptMode: read('VITE_MOCK_RECEIPT_MODE', 'demo'),
  mockStaffPinEnabled: bool('VITE_MOCK_STAFF_PIN_ENABLED', true)
};

export const assertPublicEnvOnly = (): true => true;
