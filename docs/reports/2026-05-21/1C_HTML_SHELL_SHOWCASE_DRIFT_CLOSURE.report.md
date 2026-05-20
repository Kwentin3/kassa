# 1C HTML Shell Showcase Drift Closure

Дата: 2026-05-21
Статус: deployed and smoke-verified
Область: refactor after PRD/Blueprint audit

## Закрытые drift-пункты

- Modal contract: во все showcase modal states добавлен доступный выход **"Назад к диагностике"** через общий modal renderer. Это закрывает требование PRD/Blueprint: modal layer не должен trap user away from diagnostic.
- Visual matrix contract: режим **"100 товаров"** теперь показывает 100 карточек сразу из shopping/catalog режима, а не только после перехода в search. Это делает 100-card visual contract test прямым и проверяемым.

## Что не менялось

- РМК, production bridge, реальная оплата, эквайринг, ККТ, чек, фискализация, печать и маркировка не подключались.
- Runtime по-прежнему single-file compatible: без CDN, ES modules, обязательного `fetch`, Clipboard API, `position: sticky`, service worker или внешних CSS/JS bundles.
- Showcase остался mock-only демонстрацией.

## Локальная проверка

- Inline diagnostic/showcase script syntax: `node --check`: passed.
- `npm run typecheck`: passed.
- `npm run test:run`: passed, 9 files / 26 tests.
- `npm run build`: passed.
- `npm run visual:cards`: passed.
- Local Playwright drift smoke:
  - `100-product mode`: `afterToggle === 100`;
  - `payment_select` modal contains `back-diagnostic`;
  - `payment_error` modal contains `back-diagnostic`;
  - modal back returns to `mode=diagnostic` with query params preserved.
- Local full showcase smoke:
  - diagnostic -> showcase -> diagnostic;
  - theme switcher;
  - edit fallback controls;
  - keyboard open/type/backspace/hide;
  - landscape no global horizontal scroll;
  - portrait profile, collapsed cart bar, cart bottom sheet;
  - portrait keyboard and back-to-diagnostic accessible;
  - no console/page errors that break runtime.

## Деплой и публичная проверка

- Refactor commit deployed: `3bed573`.
- Target: `roman@192.168.7.64`, `/opt/stacks/kassa-web`.
- Container: `kassa-web`, rebuilt and running.
- `https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=diagnostic&runId=drift-deploy&terminalLabel=server`: HTTP 200.
- `https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=showcase&runId=drift-deploy&terminalLabel=server`: HTTP 200.
- Public Playwright drift smoke:
  - `100-product mode`: 100 product cards rendered;
  - payment modal contains `back-diagnostic`;
  - payment error modal contains `back-diagnostic`;
  - portrait has no global horizontal scroll;
  - modal back returns to diagnostic mode with `runId` preserved.

## Remaining manual validation

- Запуск внутри реального 1С/V8WebKit терминала всё ещё нужен отдельно.
- Touch terminal behavior remains a manual validation item.
