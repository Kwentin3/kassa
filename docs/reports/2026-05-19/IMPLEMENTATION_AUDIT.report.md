# Implementation Audit - Self-Checkout Terminal MVP

Дата: 2026-05-19  
Сравнение: PRD Draft 0.2 / Blueprint Pack vs текущая реализация  
Статус: superseded by gap closure fixes

Update: gaps listed in this audit were fixed after the audit. See `docs/reports/2026-05-19/GAP_CLOSURE_VERIFICATION.report.md` for the current status.

## Итог

Текущая реализация хорошо закрывает основной frontend-only MVP: приложение собрано на React/TypeScript/Vite/Tailwind/Zustand, работает без backend, использует mock data/services, деплоится как static app через Docker/Nginx/Traefik и открывается по HTTPS.

Критичные промышленные границы соблюдены: нет реальной 1С, оплаты, СБП-интеграции, ККТ, фискализации, CMS, сбора карточных данных и production update-flow.

Основные расхождения находятся не в технологическом стеке, а в terminal-state строгости и части Extended Demo: staff actions, receipt-error resolution, Demo Control Panel edge cases, timeout automation и SBP QR mock.

## Findings

### High - Payment terminal outcomes are not guarded by current state

PRD/Blueprint требуют управляемую terminal state machine, где оплата проходит только через `payment_method -> payment_pending`, а пустая корзина блокирует оплату.

В reducer `START_PAYMENT` ограничен `payment_method`, но terminal outcomes принимаются из любого состояния:

- `src/state/machine.ts:41` `PAYMENT_SUCCESS` всегда переводит в `receipt_success`;
- `src/state/machine.ts:43` `PAYMENT_FAILED` всегда переводит в `payment_error`;
- `src/state/machine.ts:45` `RECEIPT_FAILED` всегда переводит в `receipt_error`.

Дополнительно `startPayment` запускает mock payment даже если `GO_TO_PAYMENT` не перевел store в `payment_method`:

- `src/state/store.ts:109-123`.

Практический риск: будущая UI-ошибка, race condition или вызов store action не из `PaymentScreen` сможет создать чек/ошибку оплаты из неверного состояния, включая сценарий пустой корзины. Текущий UI в основном скрывает этот риск, но store/state machine не защищают контракт.

Required fix: в `startPayment` после `GO_TO_PAYMENT` проверять `get().state.name === 'payment_method'`; terminal outcome events принимать только из `payment_pending`; добавить unit tests именно на store-level flow.

### High - Receipt error can be bypassed by buyer after help screen

PRD/Blueprint требуют: `receipt_error` выходит только через help/staff; ошибка чека после оплаты должна требовать сотрудника.

Реализация отправляет из `receipt_error` в help:

- `src/screens/ReceiptScreen.tsx:10-20`.

Но на help screen покупатель может нажать публичную кнопку "Вернуться к покупке" без PIN/staff confirmation:

- `src/screens/HelpStaffScreen.tsx:55`.

Практический риск: сценарий "оплата прошла, чек не сформирован" можно обойти без mock staff resolution, что противоречит PRD.

Required fix: если source/state связан с `receipt_error`, скрыть public resume; разрешить только staff PIN и staff action `resolve_receipt_error` / `reset_terminal`.

### Medium - Staff mock mode misses required actions

PRD требует mock staff actions: подтвердить, удалить позицию, вернуться к покупке, завершить сессию, сбросить терминал. Blueprint также добавляет `resolve_receipt_error`.

В типах эти actions заявлены:

- `src/types.ts:86-92`.

Но UI staff mode реализует только confirm/resume/end/reset/open demo:

- `src/screens/HelpStaffScreen.tsx:21-27`.

Нет staff remove item, нет выбора позиции для удаления, нет явного resolve receipt error. При этом предыдущий acceptance audit завысил статус, указав "Remove item with staff: реализовано".

Required fix: добавить staff action panel с текущей корзиной, удалением выбранной позиции и отдельным resolve receipt error state/action.

### Medium - Demo Control Panel edge cases toggle has no behavioral effect

Blueprint требует Demo Control Panel: "включить товарные edge cases". В UI toggle есть:

- `src/screens/BrandingDemoScreen.tsx:83-84`;
- state: `src/types.ts:125`;
- store update: `src/state/store.ts:133`.

Но `edgeCasesEnabled` нигде не применяется в catalog/search/product filtering. Edge-case товары доступны всегда, независимо от toggle.

Required fix: применить toggle в catalog/search service или selectors: скрывать/показывать товары с `requiresStaffApproval`, `isUnavailable`, `hasPriceError` в demo views.

### Medium - Session timeout is manual, not idle-driven

PRD требует idle timeout, warning, reset незавершенной сессии после бездействия. Blueprint требует timeout через warning, но не мгновенный reset.

Сейчас timeout запускается только demo-кнопкой:

- `src/screens/CartScreen.tsx:24-26`.

Warning screen не запускает автоматический reset timer:

- `src/screens/SessionTimeoutScreen.tsx:5-19`.

Нет общего activity tracker для active session.

Required fix: добавить session idle service/hook: activity events reset timer; active states open `session_timeout_warning`; warning screen после grace period вызывает `resetSession`.

### Medium - SBP QR mock is functionally shallow

PRD/Blueprint требуют SBP QR mock: QR shown, paid, not paid, timeout, cancelled.

Scenarios есть:

- `src/data/paymentScenarios.ts:9-13`.

Но UI во время SBP pending показывает только текст ожидания, без mock QR payload/visual:

- `src/screens/PaymentScreen.tsx:9-18`.

Required fix: для `payment_pending.method === 'sbp'` показывать крупный mock QR, таймер/статус и демо-текст, что QR не является реальным платежным QR.

### Low - Quick Branding is preset-only, not field-level configuration

PRD допускает mock-config/demo menu, но перечисляет поля настройки: название, логотип, цвет, фон, приветственный текст, слоган, номер терминала, рекламные баннеры.

Brand config содержит эти поля:

- `src/data/brands.ts:3-40`.

UI позволяет только выбрать один из готовых брендов:

- `src/screens/BrandingDemoScreen.tsx:40-58`.

Для sales-demo это уже полезно, но "быстрая настройка полей" пока не показана.

Required fix: либо явно зафиксировать в PRD acceptance, что MVP v1 использует preset themes only, либо добавить контролы для safe-edit полей без arbitrary CSS.

### Low - Test coverage is green but not acceptance-complete

Tests passed: 5 files / 13 tests. Они покрывают reducer basics, search, cart, payment/receipt/theme basics and idle render.

Пробелы:

- нет store-level test для `startPayment` invalid states;
- нет теста receipt-error cannot resume without staff;
- нет теста Demo Control Panel read-only/unavailable during `payment_pending`;
- нет теста `edgeCasesEnabled` behavior;
- нет test/component flow для Core Demo end-to-end;
- `src/tests/catalog.test.ts:6` использует нечитабельный placeholder-expression, формально корректный, но ухудшает доверие к тесту.

Required fix: добавить focused unit/component tests for acceptance-critical flows, без snapshot-only подхода.

## Coverage Matrix

| PRD / Blueprint item | Status | Evidence |
|---|---|---|
| React + TypeScript + Vite + Tailwind | Done | `package.json`, `vite.config.ts`, `src/styles/index.css` |
| Zustand / typed reducer state machine | Done with gaps | `src/state/machine.ts`, `src/state/store.ts` |
| Core flow idle -> add -> cart -> payment success -> receipt -> reset | Mostly done | `IdleScreen`, `ScannerPanel`, `CartScreen`, `PaymentScreen`, `ReceiptScreen` |
| Mock-only business logic | Done | local services/data only |
| Manual barcode input | Done | `ScannerPanel` |
| Keyboard scanner input | Done | `ScannerPanel` focus + form submit |
| Camera demo scan | Implemented, not device-verified | `src/services/scanner.ts` |
| Manual search | Done | `ProductSearchScreen`, `catalog.ts` |
| Catalog | Done | `CatalogScreen`, `products.ts` |
| Cart totals/qty/remove/undo | Done | `CartPanel`, `cart.ts` |
| Payment errors | Done | `paymentScenarios.ts`, `PaymentScreen` |
| SBP QR mock | Partial | scenarios exist, QR visual missing in pending state |
| Mock receipt success | Done | `ReceiptScreen`, `receipt.ts` |
| Receipt error via staff | Partial | public resume bypass exists |
| Help/staff mock mode | Partial | PIN/staff screen exists; required staff actions missing |
| Quick Branding | Partial | preset themes, no field-level edit |
| Idle promotion | Partial | starts from idle; no slideshow rotation; fallback exists |
| Demo Control Panel | Partial | panel exists; edge-case toggle unused |
| Android tablet landscape | Likely | CSS min-width 1024/min-height 720; no device smoke |
| HTTPS deployment | Done | deployment audit/runbook |
| PWA-ready manifest without SW | Done | `public/manifest.webmanifest`; no SW |
| Env VITE_* public-only | Done | `.env.example`, `src/config/env.ts` |
| No secrets in git | Done | `.gitignore`, `git ls-files` check |

## Verification Run

Shell: Windows PowerShell in `d:\Users\Roman\Desktop\Проекты\Витрина`.

- `npm run typecheck`: passed.
- `npm run test:run`: passed, 5 files / 13 tests.
- `npm run build`: passed.

Local Docker was not run because this workspace has no Docker/Linux/WSL. Server-side Docker deploy was previously performed on `roman@192.168.7.64`.

## Recommended Fix Order

1. Harden state machine/store payment outcomes.
2. Fix receipt-error/help/staff resolution so buyer cannot bypass receipt error.
3. Complete staff mode actions: remove item and resolve receipt error.
4. Make `edgeCasesEnabled` actually affect catalog/search.
5. Add idle timeout automation and warning auto-reset.
6. Improve SBP QR pending screen.
7. Add acceptance-level tests for the above.
