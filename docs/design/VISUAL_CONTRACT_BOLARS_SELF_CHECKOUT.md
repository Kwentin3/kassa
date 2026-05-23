# Visual Contract: BOLARS Self-Checkout

Статус: draft 0.3
Дата: 2026-05-23
Назначение: визуальный контракт адаптивного scan-first интерфейса кассы самообслуживания в теме БОЛАРС.
Основание: эскизы БОЛАРС, `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md`, этап prototype MVP, runtime/adapter boundary и visual delta audit текущей реализации.

## 1. Назначение

Этот документ фиксирует визуальные решения из эскизов БОЛАРС в техническом виде для следующего implementation agent. Контракт описывает композицию, иерархию, зоны, состояния и запреты. Он не реализует frontend; prototype MVP может использовать `MockAdapter`, но визуальный контракт сохраняет продуктовую границу с runtime/1С/лояльностью/эквайрингом.

Цель: получить scan-first kiosk UI, который можно собрать из theme tokens, runtime state snapshot и typed user-intent commands без хардкода бренда и без бизнес-логики в UI-компонентах.

Refactor rule: перед визуальным refactor реализации сначала обновляется этот контракт и screen composition spec. Кодовые изменения должны ссылаться на конкретные пункты контракта, а не на субъективное "похоже / не похоже".

## Related Documents

- `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md` - каноническое upstream ТЗ.
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md` - продуктовая рамка MVP.
- `docs/AGENT_START_HERE.md` - implementation handoff и первый срез.
- `docs/README.md` - индекс документации и порядок чтения.
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md` - theme/tokens contract.
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md` - runtime boundary.
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md` - экранная композиция.
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md` - критерии приёмки.

## 2. Проанализированные эскизы

Источник: `D:\Users\Roman\Desktop\Эскизы для терминала кассы самообслуживания\тема боларс`

Все найденные PNG имеют размер `941x1672`, что пропорционально целевому viewport `1080x1920`.

| Файл | Роль в контракте |
| --- | --- |
| `стартовый экран 23 мая 2026 г., 10_05_21 (1).png` | Start screen: брендовая шапка, центральная scan-инструкция, scanner visual, action cards, A/A+/A++, help. |
| `корзина  23 мая 2026 г., 10_05_21 (2).png` | Cart screen: рабочий список товаров, поиск, scan hint, quantity controls, sticky summary CTA, manager badge. |
| `подтверждение заказа 23 мая 2026 г., 10_05_21 (3).png` | Payment setup: проверка заказа, пакеты, скидки/телефон, финальная сумма, `Оплатить`. |
| `оплата  23 мая 2026 г., 10_05_21 (4).png` | Payment waiting/error family: сумма, инструкция приложить карту, крупный status, preview заказа, retry/return actions. |
| `завершение  23 мая 2026 г., 10_05_21 (5).png` | Final success: green success mark, благодарность, receipt preview, countdown reset. |

## 3. Базовый Viewport

- Базовый дизайн: `1080x1920`, portrait.
- Эскизы: `941x1672`, масштаб около `0.871` от целевого viewport.
- Контракт реализации: проектировать от `1080x1920`, затем адаптировать через токены, а не через fixed screenshot dimensions.
- `1080x1920` - design target, не единственный допустимый размер. Не прибивать layout к скриншоту абсолютными пикселями.
- Отличающиеся HTML-shell/WebView viewport должны сохранять stage, readable hierarchy, sticky CTA/help и отсутствие horizontal scroll.
- Root viewport должен поддерживать `100dvh` с fallback на `100vh`.
- Горизонтальный scroll в customer flow запрещён.
- Основная scroll-зона находится внутри body screen area; sticky CTA и sticky help не должны исчезать без явного scroll contract.

### 3.1 Adaptive Viewport Contract

Контракт адаптивности является обязательной частью визуальной системы. Интерфейс не должен просто брать portrait-размеры из `1080x1920` и давать body page scroll в landscape. Layout обязан вычислять viewport profile и применять height-aware density rules до рендера ключевых зон.

Базовая модель расчёта:

- `baseWidth = 1080`, `baseHeight = 1920`.
- `viewportWidth` и `viewportHeight` берутся из фактического visual viewport / WebView viewport.
- `scaleX = viewportWidth / baseWidth`.
- `scaleY = viewportHeight / baseHeight`.
- `viewportScale = clamp(min(scaleX, scaleY), minUsableScale, maxUsableScale)`.
- `densityScale = clamp(scaleY, densityMin, 1)`.
- `componentScale` может отличаться для typography, spacing, media и touch targets, но должен выводиться из этих tokens, а не из component-local px.

Важно: адаптивность не означает слепое уменьшение всего до нечитаемого состояния. Пропорциональное масштабирование является исходной моделью, но touch targets, читаемость и primary actions имеют минимальные значения. Если полный reference-набор зон не помещается в landscape при минимально допустимой читаемости, низкоприоритетные декоративные/детальные зоны должны reflow/collapse, а не выталкивать primary action за viewport.

### 3.2 Viewport Profiles

Implementation должен поддерживать минимум следующие profiles. Runtime может отдавать `uiConfig.viewportProfile`; если runtime не отдаёт профиль, application/layout layer вычисляет его локально как presentation concern.

| Profile | Условие | Цель |
| --- | --- | --- |
| `portrait1080` | Portrait, близко к `1080x1920` или выше | Полная reference-композиция. |
| `portraitCompact` | Portrait с меньшей высотой/шириной | Та же иерархия, меньше gaps/media, controlled internal scroll. |
| `landscapeKiosk` | Landscape с высотой около `900-1080px+` | Двухколоночная или широкая композиция без потери primary action. |
| `landscapeCompact` | Landscape с высотой около `720-899px` (`1366x768`, `1280x800`) | Height-compressed kiosk mode: ключевые действия и статус помещаются в первый viewport. |
| `microFallback` | Высота ниже `720px` или нестабильный embedded viewport | Только critical path guaranteed; декоративные зоны collapsed, details may use explicit internal scroll. |

`landscapeCompact` является обязательным для текущей рабочей среды, потому что исходный проектный контекст включает Android tablet `10-13"` landscape.

### 3.3 Adaptive Scaling Rules

- Header, hero, cards, media, spacing, radii, shadows and typography use semantic size tokens with viewport/density multipliers.
- No component may rely on fixed portrait `min-height` if that value can push primary action below the viewport in `landscapeCompact`.
- `min-height: 100dvh` is allowed for stage, but child content must be able to fit/reflow inside the available height.
- `page scroll` is not the adaptive strategy for customer-critical actions. Page scroll is acceptable only for secondary details or explicit internal content lists.
- `overflow:hidden` must not silently hide interactive controls.
- Debug/preview overlays are excluded from customer layout measurements.

Minimum customer guarantees for `landscapeCompact`:

- Start: scan instruction, scanner cue, scan action, manual search fallback, text scale and help access are visible or collapsed into explicit visible controls without page scroll.
- Cart: search, add/scan product, at least one product row or empty state, payable total and `Перейти к оплате` are visible without page scroll.
- Payment setup: order review summary, package access, discount access, final total and `Оплатить` are visible without page scroll; long order details may scroll inside review.
- Payment waiting: payable amount, instruction `Приложите карту к терминалу оплаты`, waiting status and payment visual cue are visible without page scroll.
- Payment error: error message, amount/order context, retry/return actions are visible without page scroll.
- Final success: success mark, thank-you text and countdown reset are visible without page scroll; receipt details may become compact/collapsed.

## 4. Kiosk-First Принципы

- Это терминал самообслуживания, а не web admin и не интернет-магазин.
- Основной пользователь стоит перед экраном; критичные тексты и суммы читаются с расстояния.
- Рабочие элементы нажимаются пальцем: primary touch target не меньше `72px`, secondary не меньше `56px`.
- Кнопки `+`, `-`, quantity field, package cards, CTA и help должны иметь явные normal/pressed/disabled/focus states.
- Один экран = одно доминирующее намерение: сканировать, проверить, оплатить, дождаться, завершить.
- Декоративные эффекты не должны мешать кассовому сценарию.
- Все бизнес-решения приходят из runtime state snapshot; UI только показывает состояние и отправляет typed commands.

## 5. Scan-First Принципы

- Первый экран должен явно просить поднести штрих-код товара к сканеру.
- Касание стартового экрана открывает корзину без добавленного товара.
- После первого scan пользователь попадает в `Ваши покупки`.
- На cart screen сканирование остаётся основным продолжением сценария: scan hint должен быть видим выше списка.
- Поиск является fallback, а не каталогом. Поиск запускается после `4+` символов.
- Выбор search candidate сразу добавляет товар в корзину через runtime command.
- Отдельная карточка товара или модальное описание товара не открываются.
- UI не определяет, является ли код товаром, скидочной картой или картой менеджера. Это делает runtime.

## 6. Общая Композиционная Модель

### 6.1 Stage

- Root stage: светлый фон с лёгкой фактурой или plain fallback.
- Внутренние отступы: `32-48px` по горизонтали на `1080px`.
- Карточки: белая поверхность, мягкая тень, радиус `24-32px` для крупных зон.
- Рабочие экраны спокойнее стартового: меньше промо-изображений, больше структуры.

### 6.2 Header

Есть два header variants:

| Variant | Где используется | Роль | Высота на 1080x1920 |
| --- | --- | --- | --- |
| `brandHeader` | старт, ожидание оплаты, финал | logo БОЛАРС + clock/date, сильный брендовый сигнал | примерно `180-210px` |
| `workHeader` | корзина, подготовка к оплате | title + cancel + text scale + manager badge | примерно `130-160px` |

Header визуально чёрный, с белым текстом и magenta/cyan акцентами. Нижние углы могут быть скруглены, но это должен быть token.

### 6.3 Content

- Start: центральная scan-инструкция занимает верхнюю половину body.
- Cart: search + scan hint + список товаров + sticky summary.
- Payment setup: order review + packages + discount + primary payment CTA.
- Payment waiting: amount card + payment instruction visual + compact order preview.
- Final: success confirmation + receipt visual + countdown reset.

### 6.4 Bottom Zone

- В рабочих экранах нижняя зона содержит primary CTA или help.
- На cart/payment setup CTA визуально доминирует и не конкурирует с cancel/help.
- Help остаётся доступной, но не становится primary action.

## 7. Постоянные Зоны Интерфейса

| Зона | Правило |
| --- | --- |
| Brand zone | На стартовом, ожидании оплаты и финале logo БОЛАРС крупный и узнаваемый. На рабочих экранах можно заменить title + compact controls. |
| Clock/date | Допустимы в brandHeader; не должны оттягивать внимание от сценария. |
| Text scale | Три контрастные буквы `A` разного размера живут в верхней чёрной шапке на всех customer-экранах. Состояние приходит из `state.textScale`. Видимых подписей рядом с буквами нет; доступность обеспечивается `aria-label/title`. |
| Help | Крупная карточка/кнопка помощи внизу или sticky area. Не смешивать с CTA оплаты. |
| Manager badge | Показывать только если `state.manager.status === 'bound'`. UI не привязывает менеджера сам. |
| Scanner hint | Cyan scanner/search/payment hints. Не использовать cyan для основной оплаты или ошибок. |
| Summary/total | Сумма крупная, чаще magenta или cyan profile token. Итог должен читаться быстрее списка товаров. |

## 8. Экранная Анатомия MVP-Экранов

### 8.1 Стартовый Экран

- `brandHeader`: logo слева, clock/date справа.
- Hero instruction: `Добро пожаловать!` в magenta, основной текст `Поднесите штрих-код товара к сканеру` крупным чёрным.
- Scanner visual: cyan corner brackets, magenta barcode, короткий functional scan line.
- Brand/product imagery: строительные смеси по бокам, не перекрывают инструкцию.
- Action cards: `Сканировать товар` и `Найти товар вручную`; scan card идёт первой.
- Text scale control: три `A` разного размера в `brandHeader`, без отдельной нижней карточки.
- Help card: отдельный нижний блок.

### 8.2 Корзина / Ваши Покупки

- `workHeader`: title `Ваши покупки`, cancel purchase, text scale, manager badge.
- Search bar: крупная полоса, hint `Поиск начнется после 4+ символов`.
- Scan continuation hint: напоминание, что можно продолжать сканировать.
- Product rows: большие белые строки с image, name, package, article, quantity controls, line amount, delete.
- Recently changed row: cyan border/background wash only; do not render floating or inline status labels over product content.
- Summary card: count, total, green primary CTA `Перейти к оплате`.
- Help row: внизу, ниже summary.

### 8.3 Подготовка к Оплате

- `workHeader`: title `Оплата`, cancel, text scale, manager badge.
- Order review card: compact список товаров, итог, скидка, сумма к оплате.
- Package card: три package actions, outline magenta.
- Discounts/bonuses card: инструкция сканировать карту или ввести телефон; phone input + keypad action.
- Applied discount status: green success chip/card, не перекрывает поле телефона.
- Final total band: крупная итоговая сумма.
- Bottom CTA: full-width green `Оплатить`.

### 8.4 Ожидание Оплаты

- `brandHeader`: logo + clock.
- Payment title: `Оплата`, order number.
- Amount card: крупная сумма и количество позиций.
- Central instruction: визуал терминала оплаты, карта/телефон, cyan framing.
- Status: `Ожидаем оплату...` или processing state.
- Order preview: несколько товаров + collapsed `ещё N позиций`.
- Secondary actions: retry/return используются для failed/timeout variants; в чистом waiting state они могут быть hidden/disabled по `paymentState`.

### 8.5 Финальный Экран

- `brandHeader`: logo + clock.
- Success mark: крупный green circle/check.
- Main text: `Спасибо за покупку!` крупным чёрным.
- Receipt preview: декоративный, но данные берутся из state snapshot.
- Countdown reset card: `Возврат на стартовый экран через N сек` + progress.
- После timeout UI вызывает только `resetToStart(reason)` или получает automatic runtime state; cart очистку решает runtime.

## 9. Визуальная Иерархия

1. Основная инструкция или текущий статус.
2. Сумма к оплате.
3. Primary CTA.
4. Товары и quantity controls.
5. Search/manual fallback.
6. Help/cancel/secondary actions.
7. Brand decoration.

Magenta активно используется для brand, amount, selected/accent, delete/cancel outline. Green используется только для успешного/оплатного действия. Cyan используется для scanner/search/payment guidance. Black используется для header и primary text.

## 10. Правила Крупных Touch-Элементов

- Primary CTA: высота `96-112px`, full-width или крупный блок справа в summary.
- Cart row quantity controls: кнопки `+`/`-` не меньше `56x56px`, quantity field не меньше `72x56px`.
- Package actions: не меньше `96px` по высоте, понятная зона нажатия.
- Help/cancel cards: не меньше `72px` по высоте.
- Нажатие не должно менять layout. Допустимы короткие `translateY(1-2px)`, shadow reduction, border emphasis.
- Disabled state должен быть визуально явным.

## 11. Правила Читаемости

- Title/header text: `32-44px`.
- Hero instruction: `56-72px`.
- Product name: `26-34px`, максимум 2 строки в row.
- Line price: `32-40px`.
- Main total: `56-76px`.
- Secondary copy: `22-28px`.
- Текст не должен обрезаться в CTA и quantity controls.
- `normal`, `large`, `extraLarge` задаются через `textScale` и tokens, а не CSS override в компонентах.

## 12. Focus, Keyboard и Accessibility

- Все interactive элементы имеют `:focus-visible`.
- Focus ring использует отдельный token, визуально заметный на white/black/magenta/green surfaces.
- Inputs имеют label или aria-label.
- Buttons остаются buttons, поля остаются inputs; не строить интерактив через div без семантики.
- UI должен быть операбелен без мыши: scan/manual input, search, quantity, payment CTA, cancel modal.

## 13. Подсветка Добавленного или Изменённого Товара

- Runtime возвращает `cartLine.lastChange`.
- UI подсвечивает строку через tokenized `recentChange` state: cyan border, pale cyan background, optional status chip.
- Подсветка короткая и функциональная: `1200-1800ms`, без layout shift.
- Для повторного сканирования label может быть `Количество увеличено`.
- Для нового товара label может быть `Только что добавлено`.
- UI не решает, новая это строка или increment; он отображает snapshot.

## 14. Ошибки и Предупреждения

- Ошибка не должна выглядеть как technical crash.
- Barcode not found: понятное сообщение, fallback на scan again/search/help.
- Unknown code: нейтральное предупреждение, runtime решает тип кода.
- Payment failed: cart не очищается, сумма и состав заказа остаются доступны.
- Cancel purchase: destructive action всегда через confirmation modal, если cart не пустая.
- Timeout inactivity: закрывает текущую покупку и возвращает терминал на старт по runtime snapshot; warning modal/card допустим только если сконфигурирован и не ломает оплату.
- Error color используется дозированно; primary CTA не становится красной кроме подтверждения destructive action.

## 15. Финальный Экран

- Успех должен быть однозначным: green check + благодарность.
- Receipt preview не должен обещать реальную фискализацию в mock mode.
- Countdown видим и понятен.
- После завершения runtime возвращает terminal к стартовому экрану.
- UI не очищает cart самостоятельно.

## 16. Технические Fallbacks

- `backdrop-filter`: если недоступен, использовать обычный затемняющий overlay + shadow.
- `blur`: если недоступен, использовать solid surface с opacity.
- Heavy shadow: если performance слабый, заменить на border + light elevation.
- Complex/long animation: заменить на static state или короткий opacity transition.
- `100dvh`: fallback на `100vh`.
- Container queries: fallback на breakpoint tokens.
- Motion: уважать `prefers-reduced-motion: reduce`; оставить только terminal feedback без scale/translate.

## 17. Запреты и Анти-Паттерны

- Не делать интернет-магазин, каталог или product detail modal.
- Не переносить старую showcase-модель "каталог товаров как главный экран" в BOLARS MVP.
- Не делать мелкую табличную кассу.
- Не хардкодить HEX в компонентах.
- Не обращаться из UI-компонентов напрямую к backend, 1C, scanner-router, эквайрингу, поиску.
- Не считать цены, скидки, итоги, тип кода или payment outcome в UI.
- Не смешивать help, cancel и primary CTA в одну визуальную иерархию.
- Не использовать декоративные анимации, мешающие сканированию или оплате.
- Не скрывать search/help fallback.
- Не очищать cart при ошибке оплаты.
- Не расширять рабочий экран на desktop без portrait/stage contract.

## 18. Reference Fidelity Delta Before UI Refactor

Этот раздел фиксирует расхождения между raster reference sketches и текущим prototype MVP. Он является входом для следующего visual refactor, но не меняет RuntimePort, MockAdapter, PreviewAdapter, OneCInterfaceAdapter или scan-first product scope.

### 18.1 Customer screenshots must be clean

Visual acceptance screenshots для customer screens должны сниматься без debug/preview overlays. `debug=1` и `preview=1` полезны для сценариев и диагностики, но финальная визуальная приёмка start/cart/payment/final должна показывать только customer UI. Если preview используется для быстрого выбора state, implementation должен иметь способ снять clean screenshot customer layer без floating debug/preview panels.

### 18.2 Priority map

| Priority | Refactor target | Why |
| --- | --- | --- |
| P0 | Restore reference screen anatomy: black brand header, large scan/payment/final visual zones, bottom summary/CTA zones, product image slots, receipt/countdown on final. | Без этого MVP выглядит как functional wireframe, а не как БОЛАРС kiosk prototype. |
| P0 | Keep RuntimePort boundary while changing visuals. | Визуальный refactor не должен вернуть бизнес-логику в UI. |
| P1 | Add reference-level product/media treatment with fallback. | Референсы используют реальные товарные изображения как key recognition aid; если media contour paused, нужны stable placeholders/image slots. |
| P1 | Align cart/payment spacing, radii, shadows and typography with sketches. | Сейчас отдельные зоны читаются, но не повторяют hierarchy sketches. |
| P2 | Add decorative texture/confetti/payment illustration fallbacks. | Это усиливает бренд, но не должно блокировать первый рабочий refactor. |

### 18.3 Start screen delta

Reference anatomy:

- black `brandHeader` with large BOLARS logo left and clock/date right;
- light textured body, not full magenta gradient body;
- central black scan instruction with magenta welcome line;
- cyan scanner brackets and magenta barcode;
- product/ строительные смеси imagery at left/right edges;
- two large action cards: scan first, manual search second;
- header text scale control with three contrast `A` glyphs in different sizes;
- separate help card at bottom.

Current MVP delta to close:

- start screen must stop being a single full-magenta hero; magenta remains an accent, not the whole customer surface;
- start action buttons should become reference-style cards under the scan visual, not compact generic buttons;
- text scale controls must be present in the black header on start if enabled by `uiConfig`; do not add a separate bottom text-scale card;
- product imagery may use configured assets or fallback silhouettes/placeholders, but the side media zones should be reserved in layout;
- clock/date is allowed from `uiConfig.showClock`; if unavailable, header layout must not collapse.

### 18.4 Cart screen delta

Reference anatomy:

- black `workHeader`: title, cancel outline magenta, manager badge, and the same three-size `A` text-scale control used on start/status screens;
- full-width search field with cyan outline and explicit `4+` hint;
- scan continuation card with barcode/scanner visual;
- product rows have image slot, name, package/size, article, quantity controls, line total and delete;
- recently added row uses pale cyan wash + cyan border without a status chip;
- bottom summary band shows item count, payable total and large green `Перейти к оплате`;
- help card sits below summary.

Current MVP delta to close:

- cart should prefer a bottom summary band on portrait reference, not a persistent desktop-like right rail as the main pattern;
- product image slot is mandatory in row anatomy; if real media is unavailable, use stable fallback image/thumbnail placeholder, not text-only rows;
- product name should not be forced into very narrow multiline columns while there is horizontal room;
- scan/add action should be a reference-style continuation card above the list, not only a side-panel test button;
- help card should be visible in the customer cart flow when `uiConfig.showHelpAction=true`;
- changed row highlight should use cyan reference language; green is reserved for success/pay action.

### 18.5 Payment setup delta

Reference anatomy:

- black `workHeader` with title `Оплата`;
- main order review card with product images, quantities and line totals;
- subtotal/discount/payable total block inside review card;
- package card with three magenta-outline package actions and package prices;
- discount/bonus card with phone input/keypad action and green applied-discount state;
- cyan final-total band;
- full-width green bottom `Оплатить`;
- help card below.

Current MVP delta to close:

- order review should look like a checkout confirmation card, not a plain table/list;
- package actions need prices/amounts when runtime supplies them;
- discount area should visually separate input, apply action and applied/notFound status;
- final payable total must be more dominant and closer to the reference cyan band;
- primary payment CTA should become full-width bottom action in portrait customer view.

### 18.6 Payment waiting/error delta

Reference anatomy:

- black `brandHeader` with logo and clock/date;
- screen title `Оплата` and order number;
- amount/order summary card near top;
- large central payment terminal/card/phone illustration framed by cyan scanner corners;
- instruction `Приложите карту к терминалу оплаты`;
- cyan waiting status line with spinner;
- compact order preview with product thumbnails;
- retry/return action cards only for failed/error state.

Current MVP delta to close:

- waiting screen should not be a generic centered white card on empty gray field;
- amount and order count must sit in a top summary card before the payment instruction;
- central payment visual must become a first-class zone; if bitmap/media is unavailable, use tokenized illustration/fallback, not only a small icon;
- order preview should show representative product thumbnails or stable image placeholders;
- error state should keep the same order context and use the reference recovery card hierarchy.

### 18.7 Final success delta

Reference anatomy:

- black `brandHeader` with logo and clock/date;
- light body, green check, large black `Спасибо за покупку!`;
- receipt preview card with order lines and total;
- countdown reset card with circular timer/progress bar and exact seconds;
- magenta used as accent for total/progress, not as full-screen background.

Current MVP delta to close:

- final screen should not be dominated by solid magenta background;
- receipt preview is mandatory visual structure for prototype, but must remain demo-safe and not claim real fiscal receipt;
- countdown should be concrete and visual: seconds + progress, controlled by `uiConfig.finalAutoResetSeconds`;
- success state uses green mark and light body to match reference hierarchy.

### 18.8 Refactor guardrails

- Refactor should happen screen-by-screen against this delta: start, cart, payment setup, payment waiting/error, final.
- Keep all user actions as typed commands; do not add UI-owned cart/product/payment logic.
- Keep all colors, radii, shadows, dimensions and image-slot rules tokenized.
- If media delivery is not solved, implement visual slots/fallbacks rather than removing image anatomy from the layout.
- Do not make debug/preview panels part of customer screenshots or customer composition.
