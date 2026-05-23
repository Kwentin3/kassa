# BOLARS Full Screen Adaptive Audit

Дата: 2026-05-23
Статус: implemented locally, full preview matrix passed

## Зачем сделан аудит

Предыдущий smoke проверял основной customer flow и несколько ключевых экранов. Этого оказалось недостаточно: часть состояний открывается только через preview/runtime snapshots и не проходила через обычный путь. Этот аудит фиксирует полный реестр экранов и состояний BOLARS Self-Checkout MVP, которые должны адаптироваться вместе с текущим landscape refactor.

## Реестр экранов и состояний

| Scenario | Screen | Primary UI surface |
| --- | --- | --- |
| `startIdle` | `start` | стартовая инструкция, scan-first CTA, ручной поиск |
| `cartEmpty` | `cart` | пустая корзина, поиск, добавление товара |
| `cartOneItem` | `cart` | одна строка товара, quantity controls, sticky total/CTA |
| `cartManyItems` | `cart` | несколько строк товара, internal cart list scroll |
| `cartWithManager` | `cart` | корзина с manager badge в шапке |
| `searchBelowMin` | `cart` | search state до 4 символов |
| `searchFound` | `cart` | search candidates |
| `searchNotFound` | `cart` | search not found status |
| `quantityNumpad` | `cart` | quantity numpad modal |
| `cancelConfirmation` | `cart` | cancel purchase confirmation modal |
| `paymentSetup` | `paymentSetup` | review, package buttons, discount input, total, pay CTA |
| `discountApplied` | `paymentSetup` | payment setup with success discount note |
| `discountNotFound` | `paymentSetup` | payment setup with warning discount note |
| `paymentWaiting` | `paymentWaiting` | amount, terminal visual, payment instruction, compact order |
| `paymentError` | `paymentError` | retry/return actions, amount, compact order |
| `finalSuccess` | `finalSuccess` | success message, receipt preview, countdown reset |
| `inactivityTimeoutWarning` | `cart` | timeout warning modal |
| `textScaleLarge` | `cart` | large text profile |
| `textScaleExtraLarge` | `cart` | extraLarge text profile |
| `themeError` | `start` | start screen with theme error marker |

## Viewport Matrix

Проверенные viewport-профили:

- `landscapeCompact`: `1366x768`
- `landscapeSmall`: `1280x800`
- `landscapeKiosk`: `1920x1080`
- `portrait1080`: `1080x1920`

Итого проверено: 20 сценариев × 4 viewport = 80 комбинаций.

## Найденные расхождения

Первичный matrix-audit нашёл неадаптивные зоны:

- `discountApplied` / `discountNotFound` на `paymentSetup`: review panel и secondary manager action могли выходить ниже stage в compact landscape.
- `paymentWaiting`: compact order preview имел дочерние элементы ниже stage, особенно `+2` item badge.
- `discountApplied` / `discountNotFound` в `1080x1920`: optional help card и вертикальные отступы payment setup создавали внешний page overflow.

## Исправления

Изменён только визуальный слой:

- `src/styles/index.css`
  - `paymentSetup` скрывает optional help card, чтобы не вытеснять оплату и скидку;
  - `paymentSetup` использует ограниченный `padding-block`, чтобы состояние скидки помещалось в portrait reference;
  - landscape payment review panel получил `max-height: 100%` и internal scroll;
  - landscape right column compacted: package buttons, phone row, discount notes, total band, pay CTA, manager action;
  - `paymentWaiting` в landscape скрывает items внутри compact order preview, оставляя основной amount/status/instruction видимыми.
- `src/tests/visual-contract.test.ts`
  - добавлена проверка CSS-инвариантов для hidden states: payment setup help hiding, review max-height, payment waiting compact order.

RuntimePort, adapters, command/snapshot logic, totals, discounts and payment outcome не менялись.

## Финальный Audit Result

Финальный локальный Playwright matrix-audit:

| Viewport | Checked | Failed |
| --- | ---: | ---: |
| `landscapeCompact` | 20 | 0 |
| `landscapeSmall` | 20 | 0 |
| `landscapeKiosk` | 20 | 0 |
| `portrait1080` | 20 | 0 |

Критерии:

- no document vertical overflow;
- no document horizontal overflow;
- required primary selectors exist and are inside viewport;
- no non-decorative `.bolars-stage` child offenders outside viewport.

## Tests and Checks

PowerShell / local Vite:

- `npm run typecheck` - passed.
- `npm run test:run` - passed, 11 files / 44 tests.
- `npm run build` - passed.
- `npm run visual:cards` - passed.
- `npm run smoke:showcase-catalog` - passed.
- BOLARS static HEX scan outside theme config - no matches.
- BOLARS direct concrete adapter import scan from UI layer - no matches.
- BOLARS manual JSON/file upload/window.Showcase/localStorage scan - no matches.
- Customer flow audit with discount applied passed for `1366x768`, `1280x800`, `1920x1080`, `1080x1920`.

## UI Integrity Notes

- Основная user action на каждом экране осталась видимой: scan/add product, go to payment, pay, retry/return, final countdown.
- Business logic boundary не изменён: UI по-прежнему только рендерит snapshot и dispatch typed commands.
- Preview mode использован только как способ открыть deterministic state snapshots; прямого рендера экранов в обход RuntimePort нет.
- Optional help не считается primary action и может быть скрыт в constrained payment setup, чтобы не ломать оплату.

## Remaining Manual Checks

- Проверить на физическом Android tablet/WebView.
- Проверить в 1C HTML shell, когда будет доступен реальный контейнер.
- Если позже вернётся media delivery/product imagery в BOLARS flow, повторить matrix-audit.
