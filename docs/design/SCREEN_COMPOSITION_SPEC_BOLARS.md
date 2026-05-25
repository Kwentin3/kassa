# Screen Composition Spec: BOLARS Self-Checkout

Статус: draft 0.4
Дата: 2026-05-24
Назначение: подробная композиционная спецификация MVP-экранов по эскизам БОЛАРС и адаптивным viewport profiles.

Базовый reference viewport: `1080x1920`, portrait. Обязательный рабочий fallback: landscape tablet/WebView.
Визуальный источник: пять PNG-эскизов из `D:\Users\Roman\Desktop\Эскизы для терминала кассы самообслуживания\тема боларс`.
Связанные документы:

- `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md`
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/README.md`
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`
- `docs/integrations/1c-html-shell/runtime-profiles/1C_HTML_SHELL_RUNTIME_CAPABILITY_CONTRACT_V8WEBKIT.md`

## 1. Общие Правила Экранов

- UI собирается из `SelfCheckoutStateSnapshot`, `themeProfile`, `uiConfig` и tokens.
- Screen component не вызывает backend/1C/payment/scanner/search напрямую.
- Основной сценарий: scan-first, cart-first после первого товара.
- Search и quantity numpad являются состояниями рабочего экрана, не отдельным каталогом.
- Старый showcase/catalog подход не переносится: product catalog не является главным экраном BOLARS MVP.
- `1080x1920` является базовым target, но screen layout не прибивается к абсолютным пикселям; stage/tokens/layout contract должны выдерживать отличающийся HTML-shell/WebView viewport.
- Layout должен выбирать viewport profile (`portrait1080`, `portraitCompact`, `landscapeKiosk`, `landscapeCompact`, `microFallback`) и менять плотность/композицию до того, как primary actions уйдут ниже viewport.
- Sticky CTA не должен пропадать без явной scroll-зоны.
- Help доступна на ключевых экранах.
- Cancel purchase destructive action требует confirmation modal, если cart не пустая.
- Честный знак / маркированный товар допускается только как unresolved runtime branch/state marker; UI не угадывает маркировку и не реализует реальный сценарий без отдельного решения.

## 2. Стартовый Экран

| Пункт | Спецификация |
| --- | --- |
| Назначение | Встретить покупателя и направить к первому scan. |
| Пользовательский контекст | Покупатель подошёл к терминалу, cart пустая. |
| Входные сценарии | `currentScreen=start`, `cart.isEmpty=true`; reset after final; inactivity reset. |
| Выходные сценарии | `startPurchase()` -> empty cart; `scanCode(code)` -> cart/payment-relevant state; manual search action -> cart with search active; help. |
| Обязательные зоны | `brandHeader`, hero instruction, scanner visual, scan action card, manual search card, text scale card, help card. |
| Optional зоны | Product/promotional images, date/time. |
| Постоянные зоны | Help может жить в bottom action rail на compact viewport. |
| Главная CTA | Scan instruction, не обычная кнопка. Scan card визуально первая. |
| Вторичные действия | Manual search, text scale, help. |
| Runtime state | `currentScreen`, `scannerState`, `textScale`, `themeProfile`, `uiConfig.showClock`. |
| Tokens | `color.bg.header`, `color.brand.primary`, `scanner.*`, `radius.card`, `shadow.card`. |
| uiConfig | `showClock`, `manualSearchEnabled`, `finalAutoResetSeconds`, `motionProfile`. |

Visual states:

- idle: barcode/cyan scan visual visible;
- scanning: короткий scan-line или pulse;
- unknown/not found after scan: alert, then stay start or move cart depending runtime;
- help requested: runtime modal/alert state.

Acceptance criteria:

- Главный текст `Поднесите штрих-код товара к сканеру` читается первым.
- Касание стартового экрана открывает cart screen без добавленной строки.
- Brand zone БОЛАРС узнаваема, но не перекрывает scan instruction.
- Manual search не выглядит главным сценарием.
- Text scale controls живут в верхней чёрной шапке, имеют visible selected/focus/pressed states и используют три `A` разного визуального размера.

## 3. Корзина / Ваши Покупки

| Пункт | Спецификация |
| --- | --- |
| Назначение | Основной рабочий экран покупки: видеть состав, продолжать scan, менять количество, перейти к оплате. |
| Пользовательский контекст | Первый товар уже добавлен или cart открыта после manual search. |
| Входные сценарии | scan product; select search candidate; return from payment setup; timeout warning return. |
| Выходные сценарии | goToPaymentSetup; cancelPurchaseRequest; help; payment setup. |
| Обязательные зоны | `workHeader`, search bar, scan continuation hint, cart list, summary card, payment CTA, help. |
| Optional зоны | Manager badge, recent alert chip, image fallback. |
| Постоянные зоны | Summary/payment CTA; help may sit below summary or in bottom action rail. |
| Главная CTA | `Перейти к оплате`, green, disabled only when runtime says `canGoToPayment=false`. |
| Вторичные действия | Search, plus/minus, quantity numpad, delete, cancel purchase, help. |
| Runtime state | `cart`, `cartLines`, `totals`, `searchState`, `scannerState`, `manager`, `alerts`, `modalState`. |
| Tokens | `color.cta.pay.*`, `state.highlight.*`, `color.delete.fg`, `color.scan.*`, `manager.badge.*`. |
| uiConfig | `searchMinLength`, `productImageMode`, `showManagerBadge`, `showHelpAction`. |

Visual states:

- empty cart: no product rows; clear scan/manual search instruction; payment CTA disabled or hidden by runtime.
- product added: row visible and highlighted.
- repeated product: same row quantity updated; `lastChange.kind='quantityIncreased'`.
- product removed: row removed after runtime snapshot; optional alert/undo only if runtime supplies action.
- quantity changed: row highlighted with `Количество изменено`.
- barcode not found: alert plus search fallback.
- unknown code: warning alert; no UI business inference.

Acceptance criteria:

- Наименование товара крупное, максимум две строки.
- В строке товара виден номер позиции из runtime snapshot или из упорядоченного `cartLines`.
- `+`, `-`, quantity field доступны пальцем.
- Quantity в MVP целочисленное, если весовые/дробные товары не утверждены отдельно.
- Сумма и CTA читаются быстрее деталей.
- Ошибка scan не очищает cart.
- Повторное сканирование не создаёт дубликат строки, если runtime вернул increment.

## 4. Поиск и Кандидаты Поиска как Состояние Корзины

| Пункт | Спецификация |
| --- | --- |
| Назначение | Fallback для товара без scan или при плохом barcode. |
| Пользовательский контекст | Покупатель вводит название/артикул на cart screen. |
| Входные сценарии | Tap search bar; manual search from start; barcode not found alert action. |
| Выходные сценарии | selectSearchCandidate; clear search; return to cart; help. |
| Обязательные зоны | Search input, on-screen search keyboard, min length hint, candidates area, current cart summary still visible or recoverable. |
| Optional зоны | Loading indicator, not-found fallback. |
| Постоянные зоны | Cart summary/payment CTA remains available if cart has items. |
| Главная CTA | Candidate row/card action: tap candidate to add. |
| Вторичные действия | Clear query, close search, help. |
| Runtime state | `searchState.status`, `searchState.query`, `searchState.candidates`, `cart`, `totals`. |
| Tokens | `color.scan.primary`, `color.bg.surface`, `state.focus.*`, `shadow.card`. |
| uiConfig | `searchMinLength=4`, `productImageMode`, `manualSearchEnabled`. |

Visual states:

- below min length: hint `Поиск начнется после 4+ символов`.
- searching: visible spinner/progress in candidates area.
- found: large candidate rows/cards, no product detail modal.
- candidate row may show name, article, barcode/identifier and price if runtime supplied them.
- not found: clear message, suggest scan again/help.
- error: user-readable alert, query preserved.
- keyboard open: own touch keyboard visible after tap/focus on search input.
- keyboard dismissed: hidden after explicit close, candidate selection, or touch outside search input/keyboard.

Acceptance criteria:

- Search starts only after `4+` characters.
- Search fields are name, article and barcode digits through runtime/search adapter.
- Selecting candidate dispatches `selectSearchCandidate(candidateId)` and immediately returns to cart state after snapshot.
- Candidate card does not open product details.
- Search results do not replace cart source of truth.
- On-screen search keyboard is mandatory for touch flow and remains UI-owned; it must not search locally or mutate cart state directly.
- Keyboard controls include close, clear, backspace, space and layout/digit access for name/article/barcode search.
- Tapping a candidate or any non-search area dismisses the search keyboard.

## 5. Нумпад Количества как Overlay-Состояние

| Пункт | Спецификация |
| --- | --- |
| Назначение | Быстро ввести точное количество товара. |
| Пользовательский контекст | Покупатель нажал quantity field в строке товара. |
| Входные сценарии | `openQuantityNumpad(lineId)`. |
| Выходные сценарии | `confirmQuantityInput(lineId, quantity)`, close/cancel through runtime modal state. |
| Обязательные зоны | Dim overlay, modal/card, product short label, draft quantity, numeric keys, confirm, cancel/backspace. |
| Optional зоны | Unit label, max/min hints if runtime supplies. |
| Постоянные зоны | None; overlay owns focus. |
| Главная CTA | Confirm quantity. |
| Вторичные действия | Backspace, clear, cancel. |
| Runtime state | `modalState.type='quantityNumpad'`, `cartLine.quantityControls`. |
| Tokens | `color.bg.overlay`, `radius.modal`, `shadow.modal`, `state.focus.*`. |
| uiConfig | `quantityNumpadEnabled`, `motionProfile`. |

Visual states:

- open: background visible but inactive.
- invalid quantity: runtime validation error displayed near draft field.
- busy confirm: confirm disabled/busy until snapshot.

Acceptance criteria:

- Overlay is keyboard and touch operable.
- Confirm sends quantity intent only; UI does not recalculate totals.
- Focus is trapped inside modal while open.
- Reduced motion uses opacity transition only.

## 6. Подтверждение Отмены Покупки как Modal-Состояние

| Пункт | Спецификация |
| --- | --- |
| Назначение | Защитить покупателя от случайной потери корзины. |
| Пользовательский контекст | Cart not empty, user tapped `Отменить покупку`. |
| Входные сценарии | `cancelPurchaseRequest()` with non-empty cart. |
| Выходные сценарии | `confirmCancelPurchase()` or `returnToPurchase()`. |
| Обязательные зоны | Modal title `Отменить покупку и очистить корзину?`, explanation, destructive confirm `Да, отменить`, safe return `Вернуться к покупке`. |
| Optional зоны | Summary: item count/total. |
| Постоянные зоны | None; modal owns focus. |
| Главная CTA | Safe action `Вернуться к покупке`; destructive action visually secondary but clear. |
| Вторичные действия | Confirm cancel. |
| Runtime state | `modalState.type='cancelPurchaseConfirm'`, `cart.isEmpty=false`. |
| Tokens | `color.error.*`, `color.cta.cancel.*`, `color.bg.overlay`, `radius.modal`. |
| uiConfig | `motionProfile`. |

Visual states:

- open: dim overlay;
- busy confirm: destructive action busy;
- cancelled: runtime resets to start.

Acceptance criteria:

- Empty cart cancel returns directly to start.
- Non-empty cart never resets without confirmation.
- Destructive action is not the default focused action.

## 7. Подготовка к Оплате

| Пункт | Спецификация |
| --- | --- |
| Назначение | Проверить заказ, добавить пакет, применить скидку/телефон, начать оплату. |
| Пользовательский контекст | Покупатель закончил scan/cart editing. |
| Входные сценарии | `goToPaymentSetup()`. |
| Выходные сценарии | `startPayment()`, `returnToPurchase()`, `cancelPurchaseRequest()`, help. |
| Обязательные зоны | Header, order review card, packages card, discount/phone card, payment CTA with payable total, help. |
| Optional зоны | Manager badge, applied discount badge, package selected state. |
| Постоянные зоны | Bottom `Оплатить` CTA. |
| Главная CTA | `Оплатить` with payable total, full-width green. |
| Вторичные действия | Add package, remove receipt line, apply discount phone, scan discount, bind manager, return/cancel/help. |
| Runtime state | `cartLines`, `totals`, `discount`, `manager`, `paymentState.status='idle|preparing'`, `featureFlags`. |
| Tokens | `discount.*`, `color.cta.pay.*`, `manager.badge.*`, `radius.card`, `shadow.card`. |
| uiConfig | `packagesEnabled`, `discountByPhoneEnabled`, `managerBindingEnabled`, `showHelpAction`. |

Visual states:

- no discount: instruction and phone input.
- checking discount: visible busy state.
- discount applied: green confirmation with amount.
- discount not found: warning/error inline, payment remains available unless runtime disables.
- package added: order review/totals update after snapshot.
- receipt line removed: any removable `cartLines[]` entry can be removed with `removeCartLine(lineId)`; order review, totals and payable CTA update only from the next runtime snapshot. If the last line is removed, runtime returns to empty cart with payment disabled.
- manager bound: badge visible in header.

Acceptance criteria:

- Customer can review items without returning to cart for every detail.
- Customer can remove the same receipt line types from cart and payment setup through the same `removeCartLine(lineId)` command.
- Package cards are clear actions, not decorative.
- Discount status does not obscure total.
- `Оплатить` is disabled/busy only from runtime state.

## 8. Применение Скидки по Телефону

| Пункт | Спецификация |
| --- | --- |
| Назначение | Ввести phone fallback для скидки/бонусов. |
| Пользовательский контекст | Покупатель не сканирует карту скидки или карта не читается. |
| Входные сценарии | Tap/focus phone field; tap keypad action; scan discount not available. |
| Выходные сценарии | `applyDiscountByPhone(phone)`, clear/return. |
| Обязательные зоны | Phone input/display, central numeric numpad modal, status area. |
| Optional зоны | Masked phone, validation message. |
| Постоянные зоны | Payment CTA remains below. |
| Главная CTA | Apply/confirm phone if separate button exists; otherwise input submit. |
| Вторичные действия | Clear phone, scan card hint. |
| Runtime state | `discount.status`, `discount.phoneMasked`, `alerts`, `totals`. |
| Tokens | `discount.input.*`, `discount.applied.*`, `discount.notFound.*`, `state.focus.*`. |
| uiConfig | `discountByPhoneEnabled`, `language`. |

Visual states:

- input empty;
- invalid phone local draft formatting allowed, validation from runtime;
- checking;
- applied;
- not found;
- error.

Acceptance criteria:

- Phone entry never computes discount locally.
- Phone entry uses a central numeric numpad modal, not the alphabetic search keyboard.
- Phone numpad has close, clear, backspace and apply/confirm actions.
- Not found state is understandable and recoverable.
- Applied discount changes totals only after snapshot.

## 9. Ожидание Оплаты

| Пункт | Спецификация |
| --- | --- |
| Назначение | Дать ясную инструкцию приложить карту и показать payment progress. |
| Пользовательский контекст | Покупатель нажал `Оплатить`; эквайринг ожидает карту. |
| Входные сценарии | `startPayment()` -> `paymentState.status='waitingForCard'`. |
| Выходные сценарии | payment success -> final; failed/timeout -> error screen; cancel/return if runtime allows. |
| Обязательные зоны | Brand header, title/order number, amount card, central payment visual, status line, compact order preview. |
| Optional зоны | Provider label, secondary details, collapsed item count. |
| Постоянные зоны | Secondary actions area only if runtime exposes actions. |
| Главная CTA | Нет customer CTA в чистом waiting state; основной action физически на payment terminal. |
| Вторичные действия | Retry/return only for failed/timeout or explicit runtime availability. |
| Runtime state | `paymentState`, `totals`, `cartLines`, `uiConfig.paymentProviderLabel`. |
| Tokens | `scanner.corner.*`, `color.scan.*`, `color.brand.primary`, `shadow.card`. |
| uiConfig | `motionProfile`, `productImageMode`, `paymentProviderLabel`. |

Visual states:

- preparing: amount visible, busy status.
- waitingForCard: instruction `Приложите карту к терминалу оплаты`.
- processing: status changes, no duplicate payment button.
- timeout/unknown: transition to payment error state.
- inactivity timeout must not break payment after acquiring transaction was sent.

Acceptance criteria:

- Сумма к оплате крупная и совпадает со snapshot.
- Waiting state не предлагает повторно нажать `Оплатить`.
- Cart remains preserved until runtime finalizes.

## 10. Ошибка Оплаты

| Пункт | Спецификация |
| --- | --- |
| Назначение | Объяснить, что оплата не прошла, и дать безопасные recovery actions. |
| Пользовательский контекст | Payment declined, timeout, connection error or unknown. |
| Входные сценарии | `paymentState.status='failed|timeout|cancelled|unknown'`. |
| Выходные сценарии | `retryPayment()`, `returnToPaymentSetup()`, help, cancel request if allowed. |
| Обязательные зоны | Error title/message, amount/order context, retry action, return action, help. |
| Optional зоны | Provider-readable reason, order preview. |
| Постоянные зоны | Recovery actions. |
| Главная CTA | `Попробовать ещё раз` when `canRetry=true`. |
| Вторичные действия | `Вернуться к оплате`, help. |
| Runtime state | `paymentState.failureReason`, `paymentState.canRetry`, `cart`, `totals`. |
| Tokens | `color.error.*`, `color.warning.*`, `color.scan.*`, `color.cta.pay.*`. |
| uiConfig | `paymentRetryEnabled`, `showHelpAction`. |

Visual states:

- declined;
- timeout;
- connection error;
- cancelled;
- unknown.

Acceptance criteria:

- Ошибка не очищает корзину.
- Технические коды не показываются без пользовательского текста.
- Retry disabled/hidden if runtime does not allow retry.
- Return to setup keeps order context.

## 11. Успешная Оплата / Финальный Экран

| Пункт | Спецификация |
| --- | --- |
| Назначение | Подтвердить успех, показать receipt preview, вернуть терминал к старту. |
| Пользовательский контекст | Payment completed. |
| Входные сценарии | `paymentState.status='success'`, `currentScreen='finalSuccess'`. |
| Выходные сценарии | automatic reset after countdown; optional `resetToStart(reason='finalCountdown')`. |
| Обязательные зоны | Brand header, success mark, thank-you text, receipt preview, countdown card. |
| Optional зоны | Payment masked card, order number, small confetti. |
| Постоянные зоны | None; countdown card should remain visible. |
| Главная CTA | Нет обязательной CTA; automatic reset is primary outcome. |
| Вторичные действия | Staff/help only if runtime requires receipt error handling, not on success. |
| Runtime state | `paymentState`, `totals`, `cartLines`, `uiConfig.finalAutoResetSeconds`. |
| Tokens | `final.*`, `color.success.*`, `color.brand.primary`, `shadow.card`. |
| uiConfig | `finalAutoResetSeconds`, `finalReceiptPreviewEnabled`, `motionProfile`. |

Visual states:

- success stable;
- countdown decreasing;
- reduced motion: static check, progress updates without decorative animation.

Acceptance criteria:

- Success state is unmistakable.
- Countdown is visible and concrete.
- UI does not clear cart independently; reset comes from runtime.
- Receipt preview is clearly visual/demo-safe in mock mode.

## 12. Cross-Screen Acceptance Criteria

- Все экраны помещаются в portrait `1080x1920` без horizontal scroll.
- `1080x1920` проверяется визуальным smoke, но implementation обязан сохранять читаемость и persistent action zones при `portraitCompact` или WebView fallback.
- Scroll зоны явные: list/content scroll не ломает header и CTA.
- Все actionable элементы имеют visible focus/pressed/disabled/busy states.
- `normal`, `large`, `extraLarge` не ломают layout.
- Тексты и labels приходят из config/dictionary layer.
- Цвета, тени, radii и spacing берутся из theme tokens.
- UI rendering is deterministic for mock snapshots.
- Нет product detail modal, catalog browsing или internet-shop behavior.
- Customer visual acceptance screenshots снимаются без debug/preview overlays. Preview screenshots допустимы как scenario evidence, но не заменяют clean customer screenshots.

## 13. Default RU Copy

Default copy должен приходить из config/dictionary layer и быть overrideable:

- `Поднесите штрих-код товара к сканеру`
- `Для применения скидки отсканируйте карту или введите номер телефона`
- `Скидка не найдена`
- `Код не распознан. Обратитесь к сотруднику.`
- `Приложите карту к терминалу оплаты`
- `Ожидаем оплату...`
- `Оплата прошла успешно`
- `Оплата не прошла`
- `Попробуйте ещё раз или обратитесь к сотруднику`
- `Спасибо за покупку!`
- `До новых встреч`
- `Отменить покупку и очистить корзину?`
- `Да, отменить`
- `Вернуться к покупке`

## 14. Reference Fidelity Refactor Notes

Этот раздел уточняет, какие screen composition решения должны быть закрыты перед следующим UI refactor. Он не добавляет новые product scenarios и не меняет runtime contract.

### 14.1 Shared Screen Frame

- На start, payment waiting и final использовать `brandHeader`: black header, large BOLARS logo, optional clock/date.
- На cart и payment setup использовать `workHeader`: black header, title, cancel, text scale, manager badge.
- Body на customer screens преимущественно light surface/texture. Magenta используется как accent/brand/amount, а не как сплошная поверхность для всех экранов.
- Help card является отдельной bottom zone, если `uiConfig.showHelpAction=true`.
- Debug/preview floating panels не входят в customer composition.

### 14.2 Start Refactor Target

Required screen zones in vertical order:

1. `brandHeader`: logo + clock/date.
2. Hero scan area: magenta welcome line, large black instruction, cyan scanner corners/barcode visual.
3. Product imagery side zones: configured bitmaps or fallback placeholders.
4. Action card row: `Сканировать товар` first, `Найти товар вручную` second.
5. Header text-scale control: three contrast `A` glyphs in `brandHeader`, no separate bottom text-scale card.
6. Help card.

Acceptance additions:

- Start must not be accepted as only a full-magenta hero with two compact buttons.
- Manual search card is visible but visually secondary to scan.
- Text scale control is visible in the start header if enabled by config and changes start hero/supporting copy as well as work screens.

### 14.3 Cart Refactor Target

Required screen zones in vertical order:

1. `workHeader`.
2. Full-width search input with `4+` hint.
3. Scan continuation/add-product card.
4. Product list.
5. Bottom summary band with item count, payable total and green `Перейти к оплате`.
6. Help card.

Product row anatomy:

- image/thumbnail slot;
- product name, package/size, article;
- quantity controls `-`, value, `+`;
- unit label below value if useful;
- line total;
- delete icon;
- last-change chip/border from `cartLine.lastChange`.

Acceptance additions:

- Portrait cart should not rely on a desktop-style right summary rail as the primary pattern.
- Product rows must reserve image slots even when real media is unavailable.
- Recent-change highlight uses cyan reference language; green remains success/pay color.

### 14.4 Payment Setup Refactor Target

Required screen zones in vertical order:

1. `workHeader`.
2. Order review card with product thumbnails, quantities, line totals and delete action for removable receipt lines.
3. Subtotal/discount/payable total section inside or immediately after review card.
4. Package card with three package actions and prices when runtime provides prices.
5. Discount/bonus card with phone input, keypad/apply action and result state.
6. Full-width green `Оплатить` CTA with payable total.
7. Help card.

Acceptance additions:

- Payment setup must look like order confirmation, not a generic admin list.
- Discount applied/not found states must be visually adjacent to discount controls and totals.
- `Оплатить` is the dominant bottom CTA.

### 14.5 Payment Waiting/Error Refactor Target

Required waiting zones:

1. `brandHeader`.
2. Title/order number.
3. Top amount/order summary card.
4. Central payment visual with cyan frame.
5. Instruction and waiting/processing status.
6. Compact order preview with thumbnails/placeholders.

Required error zones:

1. Same order context as waiting.
2. User-readable error message.
3. `Попробовать ещё раз` as primary recovery when runtime allows.
4. `Вернуться к оплате` as secondary recovery.
5. Help card if configured.

Acceptance additions:

- Waiting screen must not be accepted as a small centered generic card without brand header/payment visual/order preview.
- Retry/return actions are hidden/disabled in pure waiting state and visible in failed/timeout state.

### 14.6 Final Success Refactor Target

Required screen zones:

1. `brandHeader`.
2. Green success mark.
3. Large black thank-you copy.
4. Receipt preview card with order lines and total.
5. Countdown reset card with seconds and progress indicator.

Acceptance additions:

- Final screen must not be accepted as a solid magenta page with only a centered card.
- Receipt preview is visual/demo-safe and does not imply legal fiscalization in mock mode.
- Countdown is visible, concrete and driven by `uiConfig.finalAutoResetSeconds`.

## 15. Adaptive Composition Profiles

Этот раздел является обязательным уточнением к screen anatomy. Portrait sketches остаются visual source of truth, но implementation должен иметь self-scaling layout contract для landscape и low-height WebView.

### 15.1 Общая модель

- Screen body получает `availableHeight = viewportHeight - headerHeight - safeAreaInsets`.
- Header, spacing, media, cards and typography use adaptive tokens from `BOLARS_THEME_AND_TOKENS_CONTRACT.md`.
- `critical zones` должны помещаться в initial viewport без page scroll.
- `detail zones` могут иметь explicit internal scroll, compact variant или collapsed summary.
- Decorative product/media zones collapse first; primary instruction, totals and payment CTA collapse last.
- Если профиль неизвестен, implementation обязан выбрать nearest safe profile and expose it in debug state.

Critical zones:

| Screen | Critical zones |
| --- | --- |
| Start | brand identity, scan instruction, scanner cue, scan action, manual search fallback, visible help/text-scale access. |
| Cart | title, search/add scan controls, product/empty state, payable total, `Перейти к оплате`. |
| Payment setup | order summary, packages access, discount access, payable total on `Оплатить` CTA. |
| Payment waiting | amount, apply-card instruction, waiting status, payment visual cue. |
| Payment error | error message, amount/order context, retry and return actions. |
| Final success | success mark, thanks text, countdown reset. |

### 15.2 Start Landscape Compact

For `landscapeCompact` (`1366x768`, `1280x800` class):

- `brandHeader` becomes compact height; logo/date stay readable but do not consume portrait header height.
- Body becomes two-column or compressed grid:
  - left/main: instruction + scanner visual;
  - right/bottom: scan card, manual search card and help access.
- Scanner visual width/height use adaptive media tokens and must not push actions below viewport.
- Side product imagery becomes cropped background/faint edge decoration or hidden if it competes with actions.
- Text scale remains in the compact black header; help may become compact horizontal control but must remain discoverable.
- Page scroll is a failure if scan action or manual search is below viewport.

### 15.3 Cart Landscape Compact

- `workHeader` becomes compact; title and cancel/text-scale remain visible.
- Search and add/scan card may sit in a single row or two compact rows.
- Product list uses remaining height and internal scroll.
- Summary band/CTA remains visible in the initial viewport, either as a reserved bottom action rail or right-side summary column.
- Help collapses to compact row/icon if needed; it must not push `Перейти к оплате` down.
- At least one cart row or empty state is visible without page scroll.

### 15.4 Payment Setup Landscape Compact

- Use two-column composition when width allows:
  - left: order review with internal scroll;
  - right: packages, discount and `Оплатить` CTA with payable total.
- `Оплатить` with payable total is always visible without page scroll.
- Package and discount cards may become compact rows; they must not disappear behind review details.
- Long order details scroll inside review card, not by pushing payment CTA below the viewport.
- Help collapses below/aside only if primary payment path remains visible.

### 15.5 Payment Waiting/Error Landscape Compact

- `brandHeader` compresses.
- Amount card and instruction are above the fold.
- Payment visual reduces/crops proportionally; it must be a cue, not a fixed 520px block.
- Compact order preview may collapse to item count + total in landscapeCompact.
- Error state keeps retry/return actions visible without page scroll.

### 15.6 Final Success Landscape Compact

- Success mark, thank-you copy and countdown are visible in the initial viewport.
- Receipt preview switches to compact receipt summary or side card.
- Countdown card may become horizontal and shorter, but seconds/progress remain visible.
- Decorative receipt details collapse before countdown.

### 15.7 Adaptive Acceptance

- `1366x768`, `1280x800`, `1920x1080` and `1080x1920` must be part of visual smoke.
- For `landscapeCompact`, customer-critical zones listed above must have `offBottom=0` in viewport metrics.
- Horizontal scroll remains forbidden.
- Page scroll may exist only when documented detail zones overflow; it must not be required for the primary next action.

### 15.8 1C Embedded Composition Profile

`embeddedOneC` is a stricter composition profile for `/bolars/self-checkout-mvp-1c.html` and any HTML rendered inside the 1C HTML field.

General rules:

- The stage fills the host HTML field width. It is not centered with decorative desktop gutters.
- Header, body, list and action zones are sized from the measured host viewport, not from an assumed browser tab viewport.
- The page itself must not need scroll for the next primary action. Only product/order detail zones may scroll internally.
- Summary/CTA/help are reserved layout zones. They must not rely on `position: sticky`.
- Grid is allowed only where the same screen remains readable with long Russian names, text-scale changes and a narrower host field.
- Decorative shadows/glow/gradients are reduced. Borders, static fills and clear spacing carry the layout.

Cart rules for 1C:

- Search, scan/add product, first visible cart row or empty state, total and `Перейти к оплате` must fit into the 1C field at `1628x823`, `1366x768` and `1280x800`.
- Cart rows may switch from five fixed columns to a safer two-zone structure: product identity/content on the left, controls/price/delete on the right.
- Product thumbnail is reserved but may shrink or switch to a simple placeholder; it must not push text or controls out of the row.
- Long names wrap or clamp inside the content zone; they do not expand columns or hide quantity controls.
- Summary can be a bottom rail or right rail, but it must be part of the grid/flex layout, not sticky.

Payment/final rules for 1C:

- Payment setup keeps `Оплатить` with payable total visible while order review scrolls internally.
- Payment waiting keeps amount, instruction and waiting status visible; payment visual is a cue, not a fixed-height illustration.
- Final success keeps success mark and countdown visible; receipt preview collapses before countdown.

Acceptance evidence for 1C must include clean screenshots from the 1C-safe URL and viewport metrics for each customer screen. Browser-only Chrome screenshots are useful but not sufficient for 1C visual acceptance.
