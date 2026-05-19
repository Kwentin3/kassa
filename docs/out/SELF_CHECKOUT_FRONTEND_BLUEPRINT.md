# Self-Checkout Terminal Web UI Prototype - Frontend Blueprint

Статус: Blueprint Draft 0.1  
Дата: 2026-05-19  
Основание: `docs/product-ux/self-checkout-terminal-mvp-prd.v0.2.md`  
Цель: спроектировать frontend MVP перед реализацией

## 1. Назначение Blueprint

Этот документ проектирует frontend MVP веб-интерфейса кассы самообслуживания. Он описывает структуру приложения, состояние терминала, mock-сервисы, компоненты, данные, scanner fallback, quick branding, idle promotion и Demo Control Panel.

Этот документ не проектирует:

- промышленный backend;
- реальную 1С-интеграцию;
- реальную оплату, эквайринг или СБП;
- реальную ККТ, фискализацию и чек;
- реальную CMS;
- промышленное управление сетью терминалов;
- промышленный update-flow, rollout/rollback или MDM.

Вся business logic на этапе MVP mock-only. UI должен выглядеть так, будто внешние контуры существуют, но фактически работать через local fixtures и mock adapters.

## 2. Сводка PRD-решений

Ключевые решения Draft 0.2:

- основной demo-форм-фактор: Android-планшет 10-13" в landscape;
- secondary adaptation: большой сенсорный экран или терминал;
- camera demo scanning желателен, но не является промышленным сканером;
- обязательные fallback: mock code input, keyboard wedge input, manual search, catalog;
- Core Demo: idle -> add product -> cart -> payment success -> receipt -> reset;
- Extended Demo: payment errors, SBP QR mock, receipt error, help/staff, idle promotion, quick branding, Demo Control Panel;
- Optional: mock loyalty, multi-language, advanced camera tuning, PWA install prompt, service worker;
- quick branding - sales-demo mechanism, не production admin;
- idle promotion разрешен только вне активной покупки;
- Demo Control Panel - служебный инструмент демонстрации и тестирования;
- Vite frontend env использует `VITE_*`; все `VITE_*` публичны и не содержат секретов.

## 3. Архитектурный Подход

Frontend строится как статическое Vite-приложение с разделением UI и mock-доменной логики.

Рекомендуемый стек:

- React;
- TypeScript;
- Vite;
- Tailwind CSS;
- Zustand + typed reducer/state machine;
- local TypeScript/JSON fixtures;
- browser camera API + scanner library adapter;
- PWA-ready manifest без обязательного service worker;
- production build как static assets.

Почему не Next.js/SSR/backend: MVP является kiosk/web prototype, не требует server rendering, backend routes или database. SSR усложнит deployment и смешает mock frontend с будущей backend-архитектурой.

Слои приложения:

- UI layer: screens, reusable touch-first components, layout.
- State machine/session state: терминальное состояние, корзина, payment status, staff/help, idle timers.
- Mock services: catalog, search, payment, receipt, staff, branding, promo.
- Mock fixtures: products, brands, promo slides, scenarios.
- Scanner adapter: camera, mock input, keyboard wedge.
- Payment mock adapter: deterministic state transitions.
- Receipt mock adapter: mock receipt id, mock QR, receipt failure.
- Branding/theme adapter: controlled theme tokens, no arbitrary CSS.
- Promo/idle adapter: idle timer, promo fallback, no active-session display.
- Demo control adapter: scenario selection, scanner mode, reset.
- Storage/session adapter: optional safe demo persistence for brand/demo preferences only.
- Screen composition layer: maps terminal state to screen components.

Closed-world rule for implementation: runtime must only rely on files bundled into `dist` or declared dependencies. No workspace-only imports, no hidden local config paths, no secrets in client build.

## 4. State Machine Implementation

For MVP, use a simple typed state machine implemented as pure reducer + Zustand store actions. XState is a valid stricter alternative, but it is not necessary unless transitions become hard to audit.

### State Types

Represent terminal state as discriminated unions:

```ts
type TerminalState =
  | { name: 'idle' }
  | { name: 'promo_idle'; slideId: string }
  | { name: 'active_cart' }
  | { name: 'scan_feedback'; result: 'success' | 'not_found' | 'blocked'; productId?: string; message: string }
  | { name: 'manual_barcode_input' }
  | { name: 'product_search'; query: string }
  | { name: 'catalog'; categoryId?: string }
  | { name: 'payment_method' }
  | { name: 'payment_pending'; method: 'card' | 'sbp'; scenarioId: string }
  | { name: 'payment_error'; reason: string; canRetry: boolean }
  | { name: 'receipt_success'; receiptId: string }
  | { name: 'receipt_error'; reason: string }
  | { name: 'help_requested'; source: string }
  | { name: 'staff_mode'; source: string }
  | { name: 'branding_demo' }
  | { name: 'session_timeout_warning'; returnTo: 'active_cart' | 'product_search' | 'catalog' };
```

Events should also be typed:

```ts
type TerminalEvent =
  | { type: 'START_PURCHASE' }
  | { type: 'IDLE_PROMO_TIMEOUT' }
  | { type: 'PROMO_TOUCH' }
  | { type: 'SCAN_SUCCESS'; productId: string }
  | { type: 'SCAN_NOT_FOUND'; code: string }
  | { type: 'OPEN_MANUAL_BARCODE' }
  | { type: 'OPEN_SEARCH'; query?: string }
  | { type: 'OPEN_CATALOG'; categoryId?: string }
  | { type: 'GO_TO_PAYMENT' }
  | { type: 'START_PAYMENT'; method: 'card' | 'sbp'; scenarioId: string }
  | { type: 'PAYMENT_SUCCESS' }
  | { type: 'PAYMENT_FAILED'; reason: string }
  | { type: 'RECEIPT_FAILED'; reason: string }
  | { type: 'REQUEST_HELP'; source: string }
  | { type: 'ENTER_STAFF_MODE'; source: string }
  | { type: 'OPEN_BRANDING_DEMO' }
  | { type: 'SESSION_TIMEOUT' }
  | { type: 'SESSION_CONTINUE' }
  | { type: 'RESET_SESSION' };
```

### Guards

Required guards:

- payment is unavailable when cart is empty;
- quick branding and Demo Control Panel are disabled or read-only during `payment_pending`;
- idle promotion never starts during active cart, search, catalog, payment, payment error, receipt, help, or staff mode;
- `receipt_error` exits only through `help_requested` or `staff_mode`;
- session timeout during active purchase first shows `session_timeout_warning`;
- scanner events from `promo_idle` start purchase before adding product;
- scanner fallback remains available if camera mode fails.

### Side Effects

Keep reducers pure. Trigger side effects from store actions or service adapters:

- start/stop idle timers;
- start/stop camera scanner;
- play visual/sound feedback if enabled;
- call mock payment delay;
- generate mock receipt id;
- persist optional demo brand preference;
- reset session after receipt success.

### Store Shape

Suggested Zustand slices:

- `terminal`: current state and dispatch.
- `cart`: cart items and totals.
- `catalog`: products and search index.
- `scanner`: scanner mode, status, last code, errors.
- `payment`: selected scenario, pending status.
- `receipt`: latest mock receipt.
- `staff`: staff modal/mode state.
- `branding`: active brand/theme.
- `promo`: slides and idle settings.
- `demoControl`: enabled scenarios and controls.

Selectors:

- `selectCanPay`;
- `selectCanShowIdlePromo`;
- `selectCanOpenBrandingDemo`;
- `selectCartTotal`;
- `selectVisibleScreen`;
- `selectScannerFallbackActions`.

## 5. Структура Проекта

Recommended repo structure after bootstrap:

```text
src/
  app/
    App.tsx
    providers/
    router/
  terminal/
    state/
    machine/
    session/
  screens/
    IdleScreen/
    CartScreen/
    ProductSearchScreen/
    CatalogScreen/
    PaymentScreen/
    ReceiptScreen/
    HelpScreen/
    StaffModeScreen/
    BrandingDemoScreen/
    DemoControlPanel/
  components/
    ui/
    cart/
    product/
    scanner/
    keyboard/
    payment/
    receipt/
    promo/
  services/
    catalog/
    scanner/
    payment/
    receipt/
    staff/
    branding/
    promo/
  mocks/
    products.ts
    brands.ts
    promoSlides.ts
    paymentScenarios.ts
    receiptScenarios.ts
    staffScenarios.ts
  config/
    env.ts
    appConfig.ts
    featureFlags.ts
  theme/
    tokens.ts
    applyBrandTheme.ts
  assets/
  styles/
  tests/
```

Folder responsibilities:

- `app`: root composition, providers, top-level layout.
- `terminal`: state machine, session lifecycle, idle timers.
- `screens`: route/state-level screens mapped from `TerminalState`.
- `components`: reusable UI blocks with no business logic.
- `services`: mock adapters and later replaceable domain ports.
- `mocks`: deterministic fixtures only.
- `config`: `import.meta.env` parsing, defaults, feature flags.
- `theme`: controlled brand tokens and theme application.
- `tests`: unit and component smoke tests.

Do not put mock data directly inside screen components. Do not read env directly inside business components; use `config/env.ts`.

## 6. Компонентная Карта

Core components:

| Component | Назначение | Main props | State link | Dependencies | Must not do |
| --- | --- | --- | --- | --- | --- |
| `IdleScreen` | старт покупки | brand, terminalId, onStart | `idle` | branding, scanner start | payment logic |
| `IdlePromotionScreen` | idle-реклама | slide, brand, onExit | `promo_idle` | promo service | show during active session |
| `CartScreen` | основная корзина | items, total, canPay | `active_cart` | cart service | price engine |
| `ScannerPanel` | выбор/статус сканера | mode, status, actions | active states | scanner adapter | own cart mutation |
| `CameraScanner` | camera demo scan | enabled, onCode, onError | scanner slice | scanner adapter | assume production reliability |
| `ManualBarcodeInput` | fallback code input | value, onSubmit | `manual_barcode_input` | catalog lookup | hide fallback actions |
| `ProductSearch` | ручной поиск | query, results | `product_search` | catalog search | remote search |
| `OnScreenKeyboard` | touch keyboard | layout, onInput | search/input | UI only | business logic |
| `SearchResults` | крупные результаты | products, onAdd | search | catalog service | calculate discounts |
| `CatalogGrid` | категории/товары | categories, products | `catalog` | catalog service | deep PLU logic |
| `ProductCard` | товарная карточка | product, onAdd | search/catalog | none | direct state transitions |
| `CartList` | позиции корзины | items, actions | cart slice | cart service | payment calls |
| `CartSummary` | итоги и CTA | total, canPay | cart/payment guard | cart service | real tax/discount logic |
| `PaymentMethodScreen` | выбор оплаты | total, methods | `payment_method` | payment mock | collect card data |
| `CardPaymentMockScreen` | ожидание карты | scenario, status | `payment_pending` | payment mock | real bank UI |
| `SbpQrMockScreen` | mock QR СБП | qr, timer, status | `payment_pending` | payment mock | generate real QR |
| `PaymentErrorScreen` | ошибка оплаты | reason, actions | `payment_error` | payment mock | technical codes |
| `ReceiptSuccessScreen` | mock-чек | receipt | `receipt_success` | receipt mock | fiscal promise |
| `ReceiptErrorScreen` | чек не сформирован | reason, onHelp | `receipt_error` | receipt mock | self-reset |
| `HelpRequestedScreen` | сотрудник идет | source, actions | `help_requested` | staff mock | real dispatch |
| `StaffPinScreen` | mock PIN | onSubmit | `staff_mode` entry | staff mock | real auth |
| `StaffActionsPanel` | действия сотрудника | allowedActions | `staff_mode` | staff mock | audit/shift logic |
| `QuickBrandingPanel` | sales-demo брендинг | config, onApply | `branding_demo` | branding service | arbitrary CSS |
| `DemoControlPanel` | mock-сценарии | state, actions | `branding_demo`/staff | demo control service | mutate during payment pending |

## 7. Mock Data Model

Types to define:

```ts
type Product = {
  id: string;
  barcode?: string;
  sku: string;
  name: string;
  brand?: string;
  category: string;
  packageSize?: string;
  price: number;
  imageUrl?: string;
  aliases: string[];
  tags: string[];
  isWeightedMock?: boolean;
  requiresStaffApproval?: boolean;
  isUnavailable?: boolean;
  hasPriceError?: boolean;
};

type CartItem = { productId: string; quantity: number; unitPrice: number; addedAt: string };
type TerminalSession = { id: string; startedAt: string; state: TerminalState['name'] };
type PaymentScenario = { id: string; method: 'card' | 'sbp'; outcome: 'success' | 'declined' | 'timeout' | 'connection_error' | 'cancelled' | 'not_paid'; delayMs: number };
type Receipt = { id: string; createdAt: string; items: CartItem[]; total: number; qrPayload: string; status: 'success' | 'failed' };
type StaffAction = 'confirm' | 'remove_item' | 'resume_purchase' | 'end_session' | 'reset_terminal' | 'resolve_receipt_error';
type BrandConfig = { id: string; storeName: string; logoUrl?: string; primaryColor: string; idleBackgroundUrl?: string; welcomeText: string; tagline?: string; terminalNumber: string };
type PromoSlide = { id: string; title: string; subtitle?: string; imageUrl?: string; backgroundColor?: string; ctaText: string; durationSec: number; isEnabled: boolean };
type DemoControlState = { scannerMode: 'camera' | 'mock_input' | 'keyboard'; paymentScenarioId: string; receiptScenarioId: string; edgeCasesEnabled: boolean; idlePromoEnabled: boolean; brandId: string };
```

Fixtures:

- 40-80 demo products;
- categories: vegetables, fruits, bakery, drinks, ready food, bags, popular;
- aliases/tags for search;
- known demo barcode list;
- unavailable product fixtures;
- price error fixtures;
- requiresStaffApproval fixtures;
- 2-3 demo brand themes;
- 3-5 promo slides;
- one broken promo asset for fallback checks.

Do not use localStorage as the source of truth for cart/payment. Optional localStorage is acceptable only for safe demo preferences such as selected brand or scanner mode.

## 8. Поиск Товара

Manual search is local and deterministic.

Search fields:

- `name`;
- `brand`;
- `category`;
- `barcode`;
- `sku`;
- `packageSize`;
- `aliases`;
- `tags`.

Rules:

- normalize case;
- support Cyrillic, Latin, digits;
- search after 2-3 characters;
- partial contains match is enough;
- clear query button;
- return to cart without losing cart;
- result cards must be large and touch-friendly.

Do not add a full-text engine for MVP. A local array search over fixtures is enough.

## 9. Scanner Architecture

Scanner modes:

- `camera`: Android tablet camera demo scanning.
- `mock_input`: visible/manual demo code input.
- `keyboard`: hidden input for keyboard wedge scanner behavior.

Recommended library choice: start with `html5-qrcode` for MVP because it exposes a browser-friendly high-level camera scanning API with callbacks and explicit failure surfaces. Keep scanner usage behind `ScannerAdapter` so ZXing for JS can replace it if camera behavior is better on the target Android tablet.

Adapter shape:

```ts
type ScannerMode = 'camera' | 'mock_input' | 'keyboard';
type ScannerError = 'permission_denied' | 'no_camera' | 'not_supported' | 'decode_timeout' | 'unknown';

interface ScannerAdapter {
  start(mode: ScannerMode): Promise<void>;
  stop(): Promise<void>;
  onCode(cb: (code: string) => void): void;
  onError(cb: (error: ScannerError) => void): void;
}
```

Camera requirements:

- HTTPS domain or localhost;
- permission request UX;
- permission denied fallback;
- no-result timeout fallback;
- poor lighting message;
- fallback links to manual input, search, catalog.

Core Demo must not depend only on camera. If camera fails, demo continues through mock input or manual search.

## 10. Cart Architecture

Cart rules:

- add product by product id;
- repeated scan increments quantity;
- quantity increase/decrease through large controls;
- remove item with optional undo;
- `requiresStaffApproval` can route to help/staff for Extended Demo;
- calculate total from mock unit prices;
- payment CTA disabled when cart is empty;
- no real discounts, taxes, loyalty, inventory or legal price logic.

If discounts are visually needed, represent them as mock display rows only.

## 11. Mock Payment Architecture

`PaymentMockService` should expose deterministic scenarios:

- `card_success`;
- `card_declined`;
- `card_timeout`;
- `card_connection_error`;
- `card_cancelled`;
- `sbp_qr_shown`;
- `sbp_paid`;
- `sbp_not_paid`;
- `sbp_timeout`;
- `sbp_cancelled`.

Rules:

- no card number input;
- no real bank forms;
- no real SBP QR;
- no payment provider calls;
- display demo status clearly;
- success transitions to receipt generation;
- failure transitions to `payment_error`.

## 12. Mock Receipt Architecture

`ReceiptMockService`:

- creates mock receipt id, for example `MCK-YYYYMMDD-000001`;
- includes cart items and total;
- produces mock QR payload;
- supports `receipt_success`;
- supports `receipt_failed_after_payment`.

Rules:

- `receipt_success -> idle` after `Готово`;
- `receipt_error -> help_requested/staff_mode`;
- no real fiscalization;
- no OFD/KKT integration;
- no promise of real fiscal receipt.

## 13. Staff Mock Mode

Staff mode:

- mock PIN such as `0000` controlled by demo config;
- no real auth;
- no real audit;
- no shift management.

Actions:

- confirm;
- remove item;
- resume purchase;
- end session;
- reset terminal;
- resolve receipt error.

PIN values must not be treated as secrets. They are demo controls only.

## 14. Branding & Idle Promotion

Branding implementation:

- `BrandConfig` fixtures;
- `theme/tokens.ts` with controlled tokens;
- `applyBrandTheme` maps config to CSS variables;
- no arbitrary CSS;
- validate contrast for main CTA and critical text;
- never hide help, cart total, payment CTA, errors.

Quick Branding:

- sales-demo mechanism;
- visible enough for presenter;
- can be opened from small icon, staff mode or Demo Control Panel;
- production version must move to protected staff/admin contour.

Idle promotion:

- only outside active session;
- stops on touch, scan or input;
- fallback to default idle screen if asset fails;
- sound off by default;
- not shown during cart, search, catalog, payment, errors, receipt, help, staff.

## 15. Demo Control Panel

Purpose: demo/test control layer for MVP.

Visual rule: Demo Control Panel must be visually marked as `DEMO / Настройка прототипа`. This makes it clear in sales presentations that the panel is not part of the final buyer flow.

Capabilities:

- select brand/theme;
- toggle idle promotion;
- select payment scenario;
- select receipt scenario;
- select scanner mode;
- toggle product edge cases;
- reset session;
- go to idle;
- show staff scenario.

Guard:

- during `payment_pending`, panel is disabled or read-only.

It is not production admin, CMS, backend, roles or permissions.

## 16. Touch-First UI Guidance

Technical UI constraints:

- minimum touch target: 48 px, primary CTA preferably 64-80 px;
- large type: body around 20 px or larger on tablet;
- primary landscape tablet layout;
- secondary large screen adaptation;
- no desktop-first dense tables;
- no cashier terminology;
- one main CTA per screen;
- help button always visible on key screens;
- product cards large enough for finger selection;
- keyboard keys large and spaced;
- text must not overflow touch buttons.

## 17. PWA-Ready Scope

Include:

- `manifest.webmanifest`;
- `display`: `standalone` or `fullscreen` after device testing;
- placeholder icons;
- `theme_color`;
- orientation recommendation: landscape;
- HTTPS assumption.

Do not design:

- `version.json`;
- rollout/rollback;
- MDM;
- production service worker update-flow;
- offline-first as MVP requirement.

Service worker is optional and risky for first kiosk demo because stale shell can confuse acceptance testing.

## 18. Testing Strategy

Recommended test coverage:

- unit tests for terminal reducer/state machine;
- unit tests for allowed transitions and guards;
- unit tests for local search;
- unit tests for cart add/increment/remove/total;
- unit tests for mock payment service;
- unit tests for receipt mock generation;
- unit tests for theme/config validation;
- component smoke tests for main screens;
- manual E2E checklist;
- Android tablet checklist;
- camera fallback checklist.

Heavy E2E can be added later. For first implementation, prioritize reducer/search/cart/payment unit tests and manual Android smoke.

## 19. Open Questions

- Which Android tablet and browser version are target devices for first demo?
- Should portrait get a dedicated layout after landscape is accepted?
- Which scanner library behaves best on the target device: html5-qrcode or ZXing for JS?
- How many brand themes are required for first sales demo?
- Should idle promo be a slideshow in Core Extended Demo or one slide first?
- Should Demo Control Panel be visible by icon or query flag in customer-facing demo?

## 20. Assumptions

- Repository is initially empty except docs.
- First app bootstrap will use Vite React TypeScript.
- App is client-only and static.
- Domain target is `kassa.speechbattle.com`.
- Deployment will be handled separately after blueprint approval.
- Existing Traefik configuration must not be modified without explicit deployment task.

## 21. Risks

- Camera scan may be unreliable on the target tablet or browser.
- Service worker, if added too early, can create stale UI during demo.
- Demo Control Panel can leak into customer flow if not visually isolated.
- Demo Control Panel can be mistaken for production admin unless it is visibly marked as `DEMO / Настройка прототипа`.
- Over-flexible branding can break contrast or touch-first UX.
- Mock services can become tangled with UI if adapters are not enforced.

## 22. Implementation Readiness Checklist

- PRD v0.2 reviewed.
- Vite `VITE_*` env contract accepted.
- Core/Extended/Optional scope accepted.
- State machine transitions accepted.
- Scanner fallback architecture accepted.
- Demo domain and deployment placeholders accepted.
- No real secrets in docs or repo.
- No backend implementation planned for MVP.

## 23. PRD Acceptance Mapping

| PRD acceptance | Technical modules |
| --- | --- |
| idle -> add product -> cart -> payment success -> receipt -> reset | state machine, IdleScreen, CartScreen, CatalogService, PaymentMockService, ReceiptMockService |
| camera demo scan or mock scan | ScannerAdapter, CameraScanner, ManualBarcodeInput, scanner feature flags |
| manual search | ProductSearchScreen, CatalogSearchService, OnScreenKeyboard |
| catalog | CatalogScreen, CatalogGrid, ProductCard, product fixtures |
| cart total | CartStore, CartList, CartSummary |
| mock card success | PaymentMethodScreen, CardPaymentMockScreen, PaymentMockService |
| mock receipt success | ReceiptSuccessScreen, ReceiptMockService |
| Android tablet HTTPS | deployment blueprint, manifest, responsive layout |
| payment errors | PaymentErrorScreen, payment scenarios |
| SBP QR mock | SbpQrMockScreen, mock QR fixture |
| receipt failed after payment | ReceiptErrorScreen, HelpRequestedScreen, StaffActionsPanel |
| help/staff | HelpScreen, StaffModeScreen, StaffService |
| idle promotion | PromoService, IdlePromotionScreen, state guards |
| quick branding | BrandConfig, QuickBrandingPanel, theme adapter |
| Demo Control Panel | DemoControlPanel, DemoControlState, state guards |

## 24. Changelog

- Created frontend blueprint from PRD Draft 0.2.
- Fixed env naming assumption for Vite by requiring `VITE_*`.
- Chose Zustand + typed reducer/state machine as default.
- Defined scanner adapter and fallback policy.
- Defined modular project structure and component map.
- Added PRD acceptance mapping.

## 25. Source Notes

- Vite env variables and modes: https://vite.dev/guide/env-and-mode/
- Vite getting started/templates: https://vite.dev/guide/
- React TypeScript guidance: https://react.dev/learn/typescript
- Tailwind CSS with Vite: https://tailwindcss.com/docs/installation/using-vite
- Zustand docs: https://zustand.docs.pmnd.rs/
- html5-qrcode docs: https://scanapp.org/html5-qrcode-docs/docs/apis/classes/Html5Qrcode
- ZXing for JS: https://github.com/zxing-js
- MDN `getUserMedia`: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- MDN Web App Manifest display: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display
- MDN Web App Manifest orientation: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/orientation
