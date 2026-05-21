# 1C Showcase Catalog Delivery Implementation Report

Дата: 2026-05-21
Область: `public/diagnostics/1c-html-shell/index.html`

## Что изменено

- Добавлен ранний публичный API `window.Showcase`.
- Реализован `receiveCatalog(catalogJsonString)` для нативной передачи каталога из 1С в HTML.
- Реализованы `getRuntimeInfo()`, `getCatalogStatusJson()`, `getCatalogStatus()` и `clearCatalog()`.
- Добавлен DOM mailbox fallback: `#showcase-catalog-mailbox` и `#showcase-catalog-result-mailbox`.
- Добавлена валидация и нормализация catalog contract `0.1`.
- При полной замене каталога очищается demo-корзина, закрываются mock modal/payment states и сбрасывается выбранная категория.
- `visible=false` и `available=false` скрываются в первом срезе.
- Товары без картинки показывают placeholder; битая картинка заменяется placeholder.

## Границы

- РМК не подключался.
- Реальный чек не подключался.
- Оплата, эквайринг, ККТ, фискализация и маркировка не подключались.
- `cart.*`, `payment.*`, `receipt.*` production bridge команды не добавлялись.
- HTML не ходит в базу 1С и не ходит в OData.
- Ручного импорта JSON в UI витрины нет.

## Документы

- `docs/integrations/1c-html-shell/1C_SHOWCASE_CATALOG_DELIVERY_HANDOFF_FOR_1C_SPECIALIST.md`
- `docs/integrations/1c-html-shell/1C_SHOWCASE_CURRENT_STATE_ANAMNESIS.md`
- `docs/integrations/1c-html-shell/1C_SHOWCASE_CATALOG_DATA_CONTRACT.md`
- `docs/integrations/1c-html-shell/1C_SHOWCASE_CATALOG_ADAPTATION_PLAN.md`
- `docs/integrations/1c-html-shell/1C_TO_HTML_DIRECT_CATALOG_DELIVERY_RESEARCH.md`
- копии обновлены в `docs/out/`

## Dev/test assets

- `docs/integrations/1c-html-shell/fixtures/showcase-catalog.1c.sample.json`
- `scripts/showcase-catalog-api-smoke.mjs`
- npm script: `npm run smoke:showcase-catalog`

Fixture используется только для dev/test smoke. Он не является runtime fallback и не требует ручной загрузки JSON пользователем.

## Проверки

- `node --check` extracted inline script: passed.
- `node --check scripts/showcase-catalog-api-smoke.mjs`: passed.
- `npm run typecheck`: passed.
- `npm run test:run`: passed, 9 files / 26 tests.
- `npm run build`: passed.
- Local browser smoke `npm run smoke:showcase-catalog`: passed.
- Local browser smoke with no trailing slash URL and retry: passed.

Smoke проверяет:

- `window.Showcase` существует;
- `ready=true`;
- `getRuntimeInfo()` возвращает `mode=showcase`;
- mock status до замены каталога;
- direct `receiveCatalog(jsonString)`;
- замену групп/товаров;
- скрытие `visible=false`;
- скрытие `available=false`;
- placeholder для товара без картинки;
- отсутствие catalog textarea/file import внутри showcase UI;
- очистку demo-корзины при замене каталога;
- invalid JSON без поломки UI;
- DOM mailbox fallback;
- `getCatalogStatusJson()`.

## Деплой

Статус внешнего деплоя и public smoke фиксируются в итоговом отчете агента после выполнения runbook.

## Git

Локальный commit/push status фиксируется в итоговом отчете агента.
