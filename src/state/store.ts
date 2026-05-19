import { create } from 'zustand';
import { appConfig } from '../config/appConfig';
import { brands } from '../data/brands';
import { paymentScenarios } from '../data/paymentScenarios';
import { products } from '../data/products';
import { promoSlides } from '../data/promoSlides';
import { addProductToCart, cartCount, cartTotal, changeQuantity, removeProductFromCart } from '../services/cart';
import { findProductByCode } from '../services/catalog';
import { getPaymentScenario, runPaymentScenario, scenarioMessage } from '../services/payment';
import { createMockReceipt } from '../services/receipt';
import type { BrandConfig, CartItem, DemoControlState, PaymentMethod, Product, Receipt, ScannerMode, TerminalEvent, TerminalState } from '../types';
import { transition } from './machine';

type TerminalStore = {
  state: TerminalState;
  cart: CartItem[];
  receipt: Receipt | null;
  activeBrand: BrandConfig;
  demo: DemoControlState;
  lastRemoved: CartItem | null;
  scannerMessage: string;
  dispatch: (event: TerminalEvent) => void;
  startPurchase: () => void;
  openPromo: () => void;
  addProduct: (product: Product) => void;
  addCode: (code: string) => void;
  changeQty: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  undoRemove: () => void;
  startPayment: (method: PaymentMethod) => Promise<void>;
  resetSession: () => void;
  resolveReceiptError: () => void;
  setBrand: (brandId: string) => void;
  updateBrandConfig: (patch: Partial<BrandConfig>) => void;
  setScannerMode: (mode: ScannerMode) => void;
  setPaymentScenario: (scenarioId: string) => void;
  setReceiptScenario: (scenarioId: DemoControlState['receiptScenarioId']) => void;
  toggleIdlePromo: () => void;
  toggleEdgeCases: () => void;
  selectCartTotal: () => number;
  selectCartCount: () => number;
};

const defaultBrand = brands.find((brand) => brand.id === appConfig.defaultBrand) ?? brands[0];

const defaultDemo: DemoControlState = {
  scannerMode: appConfig.enableCameraScanner ? 'camera' : 'mock_input',
  paymentScenarioId: 'card_success',
  receiptScenarioId: 'receipt_success',
  edgeCasesEnabled: true,
  idlePromoEnabled: appConfig.enableIdlePromo,
  brandId: defaultBrand.id
};

export const useTerminalStore = create<TerminalStore>((set, get) => ({
  state: { name: 'idle' },
  cart: [],
  receipt: null,
  activeBrand: defaultBrand,
  demo: defaultDemo,
  lastRemoved: null,
  scannerMessage: '',
  dispatch: (event) => set((current) => ({ state: transition(current.state, event) })),
  startPurchase: () => get().dispatch({ type: 'START_PURCHASE' }),
  openPromo: () => {
    const slide = promoSlides.find((item) => item.isEnabled && !item.brokenAsset) ?? promoSlides[0];
    get().dispatch({ type: 'IDLE_PROMO_TIMEOUT', slideId: slide.id });
  },
  addProduct: (product) => {
    if (product.isUnavailable) {
      get().dispatch({ type: 'SCAN_BLOCKED', productId: product.id, message: 'Этот товар сейчас нельзя добавить. Позовите сотрудника.' });
      return;
    }
    if (product.hasPriceError) {
      get().dispatch({ type: 'SCAN_BLOCKED', productId: product.id, message: 'Цена не найдена. Нужна помощь сотрудника.' });
      return;
    }
    if (product.requiresStaffApproval) {
      set((current) => ({ cart: addProductToCart(current.cart, product), scannerMessage: `${product.name}: требуется подтверждение сотрудника` }));
      get().dispatch({ type: 'REQUEST_HELP', source: 'Товар требует подтверждения' });
      return;
    }
    set((current) => ({ cart: addProductToCart(current.cart, product), scannerMessage: `Добавлено: ${product.name}` }));
    get().dispatch({ type: 'SCAN_SUCCESS', productId: product.id, message: `Добавлено: ${product.name}` });
    window.setTimeout(() => {
      if (get().state.name === 'scan_feedback') get().dispatch({ type: 'START_PURCHASE' });
    }, appConfig.feedbackMs);
  },
  addCode: (code) => {
    const product = findProductByCode(code);
    if (!product) {
      get().dispatch({ type: 'SCAN_NOT_FOUND', code });
      window.setTimeout(() => {
        if (get().state.name === 'scan_feedback') get().dispatch({ type: 'START_PURCHASE' });
      }, appConfig.feedbackMs);
      return;
    }
    get().addProduct(product);
  },
  changeQty: (productId, delta) => set((current) => ({ cart: changeQuantity(current.cart, productId, delta) })),
  removeItem: (productId) =>
    set((current) => ({
      lastRemoved: current.cart.find((item) => item.productId === productId) ?? null,
      cart: removeProductFromCart(current.cart, productId)
    })),
  undoRemove: () =>
    set((current) => ({
      cart: current.lastRemoved ? [...current.cart, current.lastRemoved] : current.cart,
      lastRemoved: null
    })),
  startPayment: async (method) => {
    const { cart, demo } = get();
    get().dispatch({ type: 'GO_TO_PAYMENT', cartIsEmpty: cart.length === 0 });
    if (cart.length === 0 || get().state.name !== 'payment_method') return;
    const selected = getPaymentScenario(demo.paymentScenarioId, method);
    get().dispatch({ type: 'START_PAYMENT', method, scenarioId: selected.id });
    if (get().state.name !== 'payment_pending') return;
    const outcome = await runPaymentScenario(selected);
    if (get().state.name !== 'payment_pending') return;
    if (outcome === 'success') {
      const receipt = createMockReceipt(cart, demo.receiptScenarioId === 'receipt_failed_after_payment');
      set({ receipt });
      if (receipt.status === 'failed') get().dispatch({ type: 'RECEIPT_FAILED', reason: 'Оплата прошла, но mock-чек не сформирован' });
      else get().dispatch({ type: 'PAYMENT_SUCCESS', receiptId: receipt.id });
      return;
    }
    get().dispatch({ type: 'PAYMENT_FAILED', reason: scenarioMessage(outcome) });
  },
  resetSession: () => set({ cart: [], receipt: null, lastRemoved: null, scannerMessage: '', state: { name: 'idle' } }),
  resolveReceiptError: () => set({ cart: [], receipt: null, lastRemoved: null, scannerMessage: 'Ошибка чека обработана сотрудником', state: { name: 'idle' } }),
  setBrand: (brandId) => {
    const brand = brands.find((item) => item.id === brandId) ?? brands[0];
    set((current) => ({ activeBrand: brand, demo: { ...current.demo, brandId } }));
  },
  updateBrandConfig: (patch) =>
    set((current) => ({
      activeBrand: { ...current.activeBrand, ...patch, id: current.activeBrand.id },
      demo: { ...current.demo, brandId: current.activeBrand.id }
    })),
  setScannerMode: (mode) => set((current) => ({ demo: { ...current.demo, scannerMode: mode } })),
  setPaymentScenario: (scenarioId) => set((current) => ({ demo: { ...current.demo, paymentScenarioId: scenarioId } })),
  setReceiptScenario: (scenarioId) => set((current) => ({ demo: { ...current.demo, receiptScenarioId: scenarioId } })),
  toggleIdlePromo: () => set((current) => ({ demo: { ...current.demo, idlePromoEnabled: !current.demo.idlePromoEnabled } })),
  toggleEdgeCases: () => set((current) => ({ demo: { ...current.demo, edgeCasesEnabled: !current.demo.edgeCasesEnabled } })),
  selectCartTotal: () => cartTotal(get().cart),
  selectCartCount: () => cartCount(get().cart)
}));

export const getProduct = (productId: string): Product => products.find((product) => product.id === productId) ?? products[0];
export const allPaymentScenarios = paymentScenarios;
