# 1C HTML Shell Self-Checkout Showcase Implementation

Дата: 2026-05-21
Статус: local implementation verified, deployment pending
Область: demo-only showcase runtime inside `public/diagnostics/1c-html-shell/index.html`

## Что реализовано

- `mode=diagnostic` и `mode=showcase` в одном single-file compatible diagnostic artifact.
- Кнопка **"Открыть витрину"** на диагностической странице.
- Служебная кнопка **"Назад к диагностике"** в витрине с сохранением `runId`, `terminalLabel`, `build` и `v`.
- Mock-only state machine: `idle`, `shopping`, `search`, `cart`, `payment_select`, `payment_processing`, `payment_success`, `payment_error`, `staff_required`, `error`, edit overlay.
- Категории, productGrid, ProductCard, mock-cart, plus/minus/remove, 20-50 товаров и 100-product visual set.
- Edge-case mock data: missing image, long titles, long price, badges, staff-required, mock age restriction, unavailable product, 10+ cart lines.
- Landscape layout with productGrid + right cartPanel.
- Portrait layout with collapsed cart bar + bounded bottom sheet.
- Five themes: light, dark, graphite, coffee, retail.
- Demo edit mode with allowed zones, fallback movement controls, density/card-size controls and reset.
- Own HTML keyboard with click-based JS buffer and no OS keyboard dependency.
- Mock payment with visible demo-only wording and no real payment logos.
- Staff/help mock flow with buyer-safe messages.
- Anti-false-readiness banner: **"Демо-режим. Данные тестовые. РМК, оплата и ККТ не подключены."**

## Runtime границы

Витрина не подключает РМК, production bridge, реальную оплату, эквайринг, ККТ, чек, фискализацию, печать или маркировку. Все сценарии работают только на mock-данных.

Первичный runtime не требует React/Vite hydration внутри HTML-поля 1С, CDN, ES modules, `fetch`, Clipboard API, `position: sticky`, touch/pointer events, service worker или внешних CSS/JS bundles.

## Локальная проверка

- `npm run build`: passed.
- `npm run test:run`: passed, 9 files / 26 tests.
- Inline diagnostic/showcase script syntax: `node --check`: passed.
- Playwright smoke against Vite preview:
  - diagnostic -> showcase -> diagnostic;
  - query params preserved;
  - add item / qty plus-minus / mock payment success;
  - theme switcher;
  - edit mode fallback controls;
  - keyboard open/type/backspace/hide;
  - landscape no global horizontal scroll;
  - portrait profile, collapsed cart bar, cart bottom sheet;
  - portrait keyboard and back-to-diagnostic accessible;
  - no console/page errors that break runtime.

## Sticky TODO

- TODO: Slice 2 Diagnostic Loader / `diag.*` bridge remains separate from showcase.
- TODO: RMK Adapter spike remains separate.
- TODO: real payment/KKT/fiscalization are intentionally not implemented.
- TODO: same-origin external resource smoke is required before any split-assets variant.
- TODO: validate on a real touch terminal / 1C V8WebKit workspace.
- TODO: scanner mock, layout persistence and backend config persistence are vNext.

## Deployment note

Use the existing runbook: build locally, archive the checked commit, copy to `roman@192.168.7.64:/tmp/kassa-web.tar`, extract to `/opt/stacks/kassa-web`, then run:

```bash
docker compose --env-file .env.deploy up -d --build kassa-web
```

Do not change Traefik or unrelated containers.
