import { useEffect } from 'react';
import { appConfig } from '../config/appConfig';
import { applyBrandTheme } from '../services/branding';
import { useTerminalStore } from '../state/store';
import { BrandingDemoScreen } from '../screens/BrandingDemoScreen';
import { CartScreen } from '../screens/CartScreen';
import { CatalogScreen } from '../screens/CatalogScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { HelpStaffScreen } from '../screens/HelpStaffScreen';
import { IdlePromotionScreen } from '../screens/IdlePromotionScreen';
import { IdleScreen } from '../screens/IdleScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { ProductSearchScreen } from '../screens/ProductSearchScreen';
import { ReceiptScreen } from '../screens/ReceiptScreen';
import { SessionTimeoutScreen } from '../screens/SessionTimeoutScreen';
import { BolarsSelfCheckoutApp, isBolarsRoute } from '../bolars/BolarsSelfCheckoutApp';

export default function App() {
  if (isBolarsRoute(window.location.pathname)) {
    return <BolarsSelfCheckoutApp />;
  }

  const { state, activeBrand, dispatch } = useTerminalStore();

  useEffect(() => {
    applyBrandTheme(activeBrand);
  }, [activeBrand]);

  useEffect(() => {
    const timeoutStates = new Set(['active_cart', 'product_search', 'catalog']);
    if (!timeoutStates.has(state.name)) return undefined;

    let timer: number | undefined;
    const restartTimer = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => dispatch({ type: 'SESSION_TIMEOUT' }), appConfig.sessionTimeoutSec * 1000);
    };

    restartTimer();
    window.addEventListener('pointerdown', restartTimer, { passive: true });
    window.addEventListener('keydown', restartTimer);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('pointerdown', restartTimer);
      window.removeEventListener('keydown', restartTimer);
    };
  }, [dispatch, state.name]);

  switch (state.name) {
    case 'idle':
      return <IdleScreen />;
    case 'promo_idle':
      return <IdlePromotionScreen />;
    case 'active_cart':
    case 'manual_barcode_input':
      return <CartScreen />;
    case 'scan_feedback':
      return <FeedbackScreen />;
    case 'product_search':
      return <ProductSearchScreen />;
    case 'catalog':
      return <CatalogScreen />;
    case 'payment_method':
    case 'payment_pending':
    case 'payment_error':
      return <PaymentScreen />;
    case 'receipt_success':
    case 'receipt_error':
      return <ReceiptScreen />;
    case 'help_requested':
    case 'staff_mode':
      return <HelpStaffScreen />;
    case 'branding_demo':
      return <BrandingDemoScreen />;
    case 'session_timeout_warning':
      return <SessionTimeoutScreen />;
    default:
      return <IdleScreen />;
  }
}
