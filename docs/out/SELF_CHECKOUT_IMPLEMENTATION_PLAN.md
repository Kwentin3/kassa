# Self-Checkout Terminal - Implementation Plan

Статус: Blueprint Draft 0.1  
Дата: 2026-05-19  
Scope: future implementation plan, not current implementation

## 1. Principle

Implement Core Demo first, then Extended Demo, then Optional. Do not build backend, real payment, real fiscalization, real CMS or production update-flow.

Each stage must keep mock services separated from UI so future adapters can replace them.

## Stage 0: Repo Bootstrap

Goal:

- initialize Vite React TypeScript project;
- add Tailwind CSS;
- add baseline lint/test tooling;
- add `.env.example` and `.gitignore`;
- add static app shell.

Implements:

- package setup;
- Vite config;
- Tailwind config;
- TypeScript config;
- empty app shell.
- documentation structure:
  - `docs/product-ux/` for PRD;
  - `docs/blueprints/` for canonical blueprint docs if the team decides to move them from `docs/`;
  - `docs/runbooks/` for deployment and smoke runbooks.

Does not implement:

- business flows;
- deployment;
- scanner.

Acceptance:

- `npm ci` works;
- `npm run build` works;
- no real `.env` or secrets committed.

## Stage 1: App Shell, Theme, Routing/State

Goal:

- create app layout for Android tablet landscape;
- create root Zustand store structure;
- add state-to-screen composition.

Implements:

- `App.tsx`;
- base layout;
- `src/config/env.ts`;
- theme tokens;
- placeholder screens.

Does not implement:

- final UI polish;
- scanner/payment logic.

Acceptance:

- app renders idle placeholder;
- VITE config parsed through one entrypoint;
- touch-first layout constraints are visible.

## Stage 2: Terminal State Machine

Goal:

- implement typed state machine from PRD.

Implements:

- states;
- events;
- reducer;
- guards;
- selectors;
- session timeout warning.

Does not implement:

- final services;
- camera.

Acceptance:

- unit tests cover allowed transitions;
- quick branding blocked/read-only during `payment_pending`;
- idle promo blocked during active states;
- `receipt_error` routes through help/staff.

## Stage 3: Mock Catalog, Search, Cart

Goal:

- implement local product fixtures, search and cart.

Implements:

- 40-80 products;
- categories;
- aliases/tags;
- `CatalogService`;
- `CartStore`;
- search screen;
- catalog screen;
- cart list/summary.

Does not implement:

- real prices;
- stocks;
- discounts;
- backend search.

Acceptance:

- manual search finds products by name/brand/category/barcode/sku/tags;
- repeated add increments quantity;
- empty cart blocks payment.

## Stage 4: Scanner Modes

Goal:

- implement resilient scanner architecture.

Implements:

- mock input;
- keyboard wedge input;
- camera scanner spike;
- permission/error handling;
- fallback actions.

Does not implement:

- production scanner guarantees;
- device bridge.

Acceptance:

- code can be added through mock input;
- keyboard-like Enter flow works;
- camera mode works on target Android tablet or fails gracefully;
- fallback never breaks Core Demo.

## Stage 5: Payment and Receipt Mock

Goal:

- implement mock card success and receipt success for Core Demo.

Implements:

- `PaymentMockService`;
- `ReceiptMockService`;
- payment method screen;
- card success flow;
- receipt success screen.

Does not implement:

- card data collection;
- real bank UI;
- real SBP;
- real fiscalization.

Acceptance:

- Core Demo completes idle -> cart -> payment success -> receipt -> idle.

## Stage 6: Help and Staff Mode

Goal:

- implement Extended Demo assistance.

Implements:

- help requested;
- mock PIN;
- staff actions;
- remove item with staff;
- resolve receipt error;
- reset terminal.

Does not implement:

- real authorization;
- audit;
- cash shift operations.

Acceptance:

- staff can resume, remove item, reset and resolve receipt error.

## Stage 7: Quick Branding and Idle Promo

Goal:

- demonstrate terminal as brandable web storefront.

Implements:

- `BrandConfig`;
- brand fixtures;
- `QuickBrandingPanel`;
- CSS variable theme application;
- promo slides;
- idle promo timer and guards.

Does not implement:

- CMS;
- media upload;
- campaign schedules;
- analytics.

Acceptance:

- presenter can change logo/name/color/background;
- idle promo appears only outside active session;
- broken promo asset falls back to idle screen.

## Stage 8: Demo Control Panel

Goal:

- provide one demo/test control surface.

Implements:

- select brand;
- toggle idle promo;
- select scanner mode;
- select payment scenario;
- select receipt scenario;
- toggle edge cases;
- reset/go idle/show staff scenario.

Does not implement:

- production admin panel;
- roles/permissions.

Acceptance:

- panel controls scenarios;
- panel is disabled/read-only during `payment_pending`.

## Stage 9: Docker/Traefik Deployment Assets

Goal:

- prepare deployment artifacts after app implementation.

Implements:

- Dockerfile;
- nginx config;
- compose template;
- Traefik labels with placeholders;
- deployment docs.

Does not implement:

- actual deployment unless explicitly requested;
- Traefik changes;
- secrets.

Acceptance:

- local Docker build works;
- static runtime serves app;
- compose template uses external Traefik network placeholder.

## Stage 10: Android Tablet Smoke and PRD Audit

Goal:

- verify MVP on target device and against PRD acceptance.

Checks:

- HTTPS opens on Android tablet;
- landscape layout;
- camera permission;
- camera scan or graceful fallback;
- manual search;
- catalog;
- cart;
- payment success;
- receipt success;
- idle promotion;
- quick branding;
- Demo Control Panel;
- no real payment/fiscalization/secret exposure.

Acceptance:

- Core acceptance passes;
- Extended acceptance passed or documented as deferred;
- Optional scope clearly marked.

## Acceptance Mapping by Stage

| Acceptance | Stage |
| --- | --- |
| app bootstraps and builds | 0 |
| Android tablet layout | 1 |
| state model and guards | 2 |
| manual search/catalog/cart | 3 |
| camera/mock/keyboard scanner | 4 |
| payment success and receipt | 5 |
| help/staff | 6 |
| branding/idle promo | 7 |
| demo scenario control | 8 |
| Docker/Traefik readiness | 9 |
| Android smoke and PRD audit | 10 |

## Definition of Done for Implementation

- Core Demo passes end to end.
- Fallback path works without camera.
- Build artifact can be served statically.
- No real secrets committed.
- No server-only future secrets in frontend.
- Mock services separated from UI.
- PRD acceptance mapping updated with actual status.
