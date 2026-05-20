# Self-Checkout Showcase Visual References

Дата: 2026-05-20
Статус: visual reference board
Область: 1C HTML Shell Self-Checkout Showcase

## 1. Executive Summary

Этот документ собирает визуальные и UX-паттерны для демонстрационной HTML-витрины кассы самообслуживания внутри 1С. Это не коллекция дизайнов для копирования. Референсы используются только для анализа композиции, поведения корзины, карточек, оплаты, ошибок, помощи и экранной клавиатуры.

Главный вывод:

- Для `landscape` наиболее устойчивый паттерн: каталог/товары в основной зоне, корзина справа, действия оплаты рядом с итогом, помощь и возврат в служебной зоне.
- Для `portrait` нельзя просто сжать landscape. Корзина должна стать bottom sheet, drawer, collapsed cart bar или отдельным экраном.
- Карточки товаров должны иметь стабильные зоны: image, title, price, action, badges.
- Клавиатура должна быть собственным HTML-компонентом с кнопками `click`, а не зависимостью от OS keyboard.
- Витрина обязана показывать служебный demo banner: **"Демо-режим. Данные тестовые. РМК, оплата и ККТ не подключены."**

Документ сверяется с:

- `PRD_1C_HTML_SHELL_SELF_CHECKOUT_SHOWCASE.md`;
- `BLUEPRINT_1C_HTML_SHELL_SELF_CHECKOUT_SHOWCASE.md`;
- `runtime-profiles/1C_HTML_SHELL_RUNTIME_CAPABILITY_CONTRACT_V8WEBKIT.md`.

Нельзя закладывать обязательные зависимости от React/Vite runtime внутри 1С, CDN, `fetch`, Clipboard API, `position: sticky`, touch/pointer events, тяжелых анимаций, реальной оплаты, РМК, ККТ или фискализации.

## Reference Inventory

| Reference | Type | Orientation | Useful pattern | Do not copy |
|---|---|---|---|---|
| [Snabble SCO User Manual](https://docs.snabble.io/docs/pos/sco-user-manual/) | Retail/self-checkout | Landscape + portrait | Welcome, landscape cart, portrait cart, category item selection, age verification, payment success, lock screen. | Exact UI, icons, attendant workflows. |
| [Toshiba Checkout Environment PDF](https://tgcs04.toshibacommerce.com/cs/groups/internet/documents/document/dg9z/njyw/~edisp/prod.tos660092.pdf) | Grocery self-checkout | Landscape-like | Scan/place guidance, Quick Lookup, Finish and Pay, Request Help, clear command grouping. | CHEC branding, exact buttons, hardware-specific flow. |
| [Toshiba System 7 brochure](https://www.bluestarinc.com/hubfs/00_BlueStar%20Microsite%20Files/Toshiba_Retail/pdf/self_checkout_system_7_brochure_english_tcb15043d73d35ef-b.pdf?hsLang=en-us) | Grocery self-checkout | Hardware-dependent | Accessibility mode moves touchpoints lower; interaction points near center of action. | Accessibility implementation claims without real testing. |
| [Diebold Nixdorf Vynamic Self-Service UI](https://www.dieboldnixdorf.com/-/media/diebold/files/retail/dn-vynamic-software/vynamic-self-service-ui-product-card.pdf) | Retail self-service UI | Multiple sizes | On-brand colors, smart workflow configuration, multiple screen sizes/resolutions, tab-oriented navigation. | Gesture/screen mirroring/voice as baseline. |
| [Clover Kiosk](https://www.clover.com/kiosk) | Food ordering kiosk | Portrait kiosk | Large menu images, simple self-ordering, separate payment screen/device. | Payment hardware and Clover visual style. |
| [MyFoodFast Kiosk](https://myfoodfast.com/kiosk) | Food ordering kiosk | Portrait | Browse/customize -> review cart -> pay -> receipt; persistent basket bar; idle timeout; cancel protection. | Backend/POS sync and exact basket copy. |
| [OrderQ Kiosk](https://restaurant.orderq.us/services/kiosk) | Food ordering/tablet kiosk | Portrait/tablet | Category navigation, beautiful imagery, payment method screen, item customization. | Analytics/payment claims. |
| [AST POS Kiosk](https://www.ast-pos.com/ambient-self-ordering-kiosk) | Food ordering kiosk | Portrait/tablet | Categories, item card, add-to-cart, modifier dialog. | Forced modifier logic as production behavior. |
| [SalePoint self-ordering kiosk](https://www.salepoint.com/restaurant-self-ordering-kiosk/) | Food ordering kiosk | Portrait + display examples | Menu items with order total, customization and checkout flow. | POS/KDS/payment integration. |
| [OnePOS Kiosk Setup Guide](https://www.onepos.com/wp-content/uploads/2022/12/KioskSetup-3.pdf) | Food ordering setup | Portrait/flow | Welcome -> fulfillment preference -> menu -> cart -> payment -> thank-you flow. | Edge kiosk implementation details. |
| [Seward Co-op self-checkout how-tos](https://seward.coop/self-checkout-how-tos/) | Grocery self-checkout | Retail screen | Start, item code, item search, discounts, Finish & Pay, staff availability. | Client-specific flows and real checkout behavior. |
| [Accessible kiosk design](https://construkt.eu/accessible-kiosk-design/) | Accessibility | Any | Large touch targets, spacing, readability distance. | Treating exact pixel values as universal without measuring terminal. |
| [Advanced Kiosks keyboard options](https://advancedkiosks.com/products/options-and-peripherals/) | Keyboard/input | Any | On-screen keyboard should appear/hide when input is needed. | Depending on external keyboard software in V8WebKit. |
| [Touch screen kiosk guide](https://www.lookdigitalsignage.com/blog/touch-screen-kiosk-guide) | Kiosk UX guidance | Any | Large targets, readable text, simple navigation, visible touch feedback. | Vendor CMS/editor assumptions. |

## Reference Analysis Notes

| Reference | Screen type / orientation | Composition and overflow | Cards / total / help / payment | Use as idea | Do not transfer |
|---|---|---|---|---|---|
| Snabble SCO User Manual | Retail SCO; landscape and portrait | Landscape separates cart and action areas; portrait changes cart placement instead of squeezing the same layout. Overflow is handled inside cart/catalog areas. | Product selection, cart, age verification, lock, payment success/decline and assistance states are explicit screens. | Orientation-specific cart behavior, clear staff-required states, payment status screens. | Exact Snabble UI, icons, brand, real attendant logic. |
| Toshiba Checkout Environment | Grocery SCO; landscape-like terminal UI | Customer flow is command-driven: scan/place, item lookup, finish/pay, help. Content is utilitarian with clear action grouping. | Total/pay and help are high-priority controls; item lookup is separate from basket review. | Keep help and finish/pay actions prominent; make lookup/search a first-class path. | Hardware-specific CHEC flow, exact button labels, real checkout assumptions. |
| Toshiba System 7 brochure | Grocery SCO hardware; variable screens | Interaction zones are arranged for physical terminal reach and accessibility; lower-half touchpoint idea is relevant. | Focus is less on rich product cards and more on accessible task completion. | Keep critical actions reachable, especially in portrait/compact. | Accessibility claims without testing in our terminal and V8WebKit. |
| Diebold Nixdorf Vynamic UI | Retail self-service UI; multiple resolutions | Uses configurable sections for workflow, promotions and information across screen sizes. | Strong emphasis on brand/theme consistency and tab-like task navigation. | Theme token contract, bounded promo/info zones, multi-resolution mindset. | Voice, mirroring, gestures, advanced platform capabilities as baseline. |
| Clover Kiosk | Food ordering; portrait | Large item imagery and staged order flow in a vertical kiosk frame. | Menu cards are visually strong; payment is a separate step/device. | Image-led cards for demo appeal, simple category-to-item flow. | Clover styling, payment hardware, real payment implications. |
| MyFoodFast Kiosk | Food ordering; portrait | Browse/customize/review/pay flow; basket summary can stay visible while browsing. | Cart review and receipt are separate steps; idle timeout/cancel protection are clear. | Collapsed cart bar in portrait, staged checkout, clear reset/new order flow. | POS sync, exact basket wording, backend promises. |
| OrderQ Kiosk | Food ordering/tablet; portrait | Category navigation and menu browsing feel close to mobile/tablet ordering. | Item cards and payment method screens are visually direct. | Category strip/grid, simple payment-selection mock screen. | Analytics, payment claims and brand treatment. |
| AST POS Kiosk | Food ordering; portrait/tablet | Category list, item detail and modifier dialog patterns. | Product cards feed into add-to-cart and modifier modal. | Use bounded modal pattern for item detail/staff-required mock. | Real modifier/business rules and POS sync. |
| SalePoint Kiosk | Food ordering; portrait/display examples | Menu, customization and checkout are presented as simple task stages. | Order total stays part of checkout flow rather than buried in browsing. | Clear stage transitions: menu -> review -> pay -> done. | KDS/POS/payment integration and exact visual system. |
| OnePOS Kiosk Setup Guide | Food ordering setup; portrait/flow | Welcome, fulfillment choice, menu, cart, payment and thank-you are separate states. | Configuration examples show appearance controls but also platform assumptions. | State-machine clarity and thank-you/success screen structure. | Edge kiosk implementation details, production configuration model. |
| Seward Co-op how-tos | Grocery SCO; retail screens | Actions such as item code, search, continue and finish/pay are explained as customer tasks. | Help is explicitly available; finish/pay is a clear terminal action. | Buyer-safe help language and prominent item-code/search path. | Client-specific discount/member flows and real checkout behavior. |
| Accessible kiosk design | General kiosk accessibility | Emphasizes large targets, spacing and readability from user distance. | Not a checkout UI, but informs button/card sizing discipline. | Large buttons, spacing, readable contrast. | Exact pixel/mm values without measuring our device. |
| Advanced Kiosks keyboard options | Kiosk input; any orientation | Keyboard appears only when input is needed and hides after use. | Focus is input ergonomics rather than cart/payment. | Show keyboard on search/code state, hide/apply/clear/backspace controls. | External keyboard software dependency. |
| Touch screen kiosk guide | General kiosk UX | Simple navigation, clear hierarchy and visible feedback are the repeated pattern. | Reinforces target size and feedback, but not retail-specific. | Pressed states, simple buyer language, visible primary action. | Vendor CMS/editor assumptions, generic marketing claims. |

## 2. Landscape Patterns

Useful composition:

- Header/service zone at top.
- Main product/catalog zone left or center.
- Cart/right panel on the right.
- Total and payment action close to the cart.
- Help/request-staff button visible in service area.
- Payment or error shown as bounded modal/screen, not as uncontrolled overlay.

Relevant references:

- Snabble shows separate cart views for landscape and portrait, proving that orientation-specific composition is a real retail pattern.
- Toshiba CHEC-style screens emphasize a small set of high-priority commands: scan/place, Quick Lookup, Request Help, Finish and Pay.
- Grocery how-to screens like Seward Co-op keep critical actions such as Enter Item Code, Continue, Finish & Pay visually prominent.

Implication for our showcase:

- Use `landscape_standard` as primary composition: `productGrid` left/center, `cartPanel` right.
- Keep `actionBar` close to `cartPanel`.
- Do not let promo occupy critical shopping space after purchase starts.
- Do not use `position: sticky`; use fixed/service zones or normal layout fallback.

Landscape screen coverage:

- Каталог + корзина: `productGrid` слева/по центру, `cartPanel` справа, итог и оплата рядом с корзиной.
- Категории + товары: категории как боковая rail-зона или верхняя строка chips; товары прокручиваются внутри `productGrid`.
- Оплата: bounded mock-screen/modal с выбором способа, прогрессом и явным demo banner.
- Ошибка / помощь: buyer-safe modal/panel, кнопка помощи доступна из service/header зоны.
- Экран ожидания: крупная кнопка старта, бренд/промо, возврат к диагностике в служебной зоне.

## 3. Portrait Patterns

Useful composition:

- Header remains compact at top.
- Category/search controls near the top.
- Product grid becomes vertical primary area.
- Cart becomes bottom sheet, drawer, collapsed cart bar, or separate screen.
- Action bar stays reachable at the bottom.
- Keyboard uses bottom area and temporarily reduces product grid height.

Relevant references:

- Snabble explicitly has a portrait cart view.
- Food ordering kiosks like Clover, MyFoodFast, OrderQ and AST POS commonly use portrait browsing with large product cards and staged checkout.
- MyFoodFast's persistent basket bar is a useful portrait idea: compact cart status at bottom while browsing.

Implication for our showcase:

- Implement `portrait_compact` and `portrait_standard` as first-class profiles.
- Do not implement portrait as squeezed landscape.
- Cart should not take permanent half-screen space during browsing.
- Back-to-diagnostic and Help must remain accessible.

Portrait screen coverage:

- Каталог: вертикальная сетка 1-3 колонки по фактическому viewport, категории сверху компактной строкой.
- Корзина: collapsed cart bar, bottom sheet, drawer или отдельный cart screen; итог и оплата не уходят в глубокий scroll.
- Экранная клавиатура: нижняя `keyboardArea`, обычные HTML-кнопки, кнопки скрыть/применить/очистить.
- Оплата: modal или отдельный экран, не перекрывающий служебный возврат без выхода.
- Ошибки: компактный buyer-safe overlay с понятным следующим действием.

## 4. Product Card Patterns

Observed patterns:

- Food kiosks favor image-led cards with title, price, and a clear add action.
- Category browsing often uses simple chips/grid tabs above product cards.
- Retail self-checkout item selection often prioritizes direct lookup and fast addition over decorative browsing.

Use for our showcase:

- `ProductCard` needs stable zones: image, title, price, badges, action.
- Missing image must show a placeholder.
- Long and very long names need max lines and safe truncation.
- Badges like **"Акция"**, **"Новинка"**, **"Нужен сотрудник"** should not cover price/action.
- Cards must not stretch beyond `cardMaxWidth`, especially in `landscape_wide`.

Do not use:

- Card layouts that depend on hover.
- Full-bleed images as the only way to identify a product.
- Variable-height cards that break grid rows.
- CDN-only product images.

## 5. Cart Patterns

Observed patterns:

- Landscape checkout screens commonly keep the cart/order preview visible beside the catalog.
- Portrait ordering often uses a basket bar or review screen rather than a permanent right panel.
- Review screens show item list, quantity, notes/modifiers, total, and payment action.

Use for our showcase:

- Landscape: right `cartPanel` with internal item scroll and fixed summary/actions.
- Portrait: collapsed cart bar + bottom sheet or separate cart screen.
- Cart with 10+ items must scroll internally.
- Long item names must not push totals or buttons out.
- Total and **"Оплатить"** must always be reachable in cart mode.

Do not use:

- Cart panel that stretches the page vertically.
- Cart overlay that hides **"Назад к диагностике"** with no escape.
- Payment CTA hidden deep in scroll.

## 6. Payment Screen Patterns

Observed patterns:

- Kiosk payment flows typically isolate the final action: choose method, process, show success/receipt/order number.
- MyFoodFast and OnePOS show a staged flow: cart review -> payment -> receipt/thank-you.
- Snabble payment success includes confirmation and receipt/rating concepts.

Use for our showcase:

- Mock payment screen should be clear and bounded.
- Methods can be **"Карта"** and **"СБП"** as mock only.
- Show short progress and deterministic success/error.
- Always show demo banner in payment: **РМК, оплата и ККТ не подключены**.

Do not use:

- Real card terminal language that implies actual payment.
- Real acquiring logos.
- Payment statuses that look production-ready.
- Hidden escape/back path.

## 7. Error / Staff Help Patterns

Observed patterns:

- Retail self-checkout has explicit Request Help actions.
- Snabble has age verification and attendant login patterns.
- Seward Co-op explicitly says staff remains available to assist.
- Lock/error screens should explain the issue and next step.

Use for our showcase:

- Staff-required state should be a buyer-safe modal/panel.
- Use simple reasons: **"Нужен сотрудник"**, **"Товар требует проверки"**, **"Не удалось изменить количество"**.
- Keep **"Помощь"** accessible in both orientations.
- Age restriction can be mock-state only; no real verification.

Do not use:

- Internal exception text.
- JSON payloads.
- Error codes without human explanation.
- Real staff authorization mechanics.

## 8. On-screen Keyboard Patterns

Observed patterns:

- Kiosk keyboards are often shown only when input is needed, then hidden.
- Accessibility sources emphasize large touch targets and spacing.
- OS-level virtual keyboards can be unreliable in kiosk/runtime contexts and may cover content.

Use for our showcase:

- Implement own `OnScreenKeyboard`, `SearchKeyboard`, `NumericKeyboard`.
- Use ordinary HTML buttons and `click` handlers.
- Keep input in JS buffer.
- Backspace, clear, apply, hide are mandatory.
- In portrait, keyboard occupies `keyboardArea` and compresses product grid.
- In landscape, keyboard can be lower zone/overlay but must not block cart/payment/back controls.

Do not use:

- OS virtual keyboard as required path.
- Touch/pointer-specific handling as required path.
- Heavy keyboard library or CDN.

## 9. Layout Lessons For Our Blueprint

Landscape:

- Primary implementation target is `landscape_standard`.
- Use `productGrid + right cartPanel`.
- Keep checkout actions near cart.
- Use promo only in idle/wide, not in active shopping if it steals space.

Portrait:

- Treat portrait as separate layout family.
- Product grid is the main vertical scroll area.
- Cart is collapsed/bottom sheet/drawer/separate screen.
- Keyboard must be designed as part of layout, not an overlay afterthought.

General:

- All important actions remain in service/header/action zones.
- Global horizontal scroll is never acceptable.
- Modals must be bounded and closable.
- Theme switch must not change component sizes unpredictably.
- Edit mode must move components only between allowed zones.

## 10. Anti-patterns: Чего Не Делать

- Не копировать внешний бренд, иконки, цвета, тексты или exact layout.
- Не делать production-кассу под видом showcase.
- Не делать portrait как сжатый landscape.
- Не делать карточки переменной высоты без контроля.
- Не растягивать карточки сверх `cardMaxWidth`.
- Не скрывать цену или кнопку действия.
- Не прятать **"Назад к диагностике"**.
- Не делать cartPanel, который растягивает всю страницу.
- Не перекрывать actionBar экранной клавиатурой без кнопки закрытия.
- Не делать mock payment похожим на реальную оплату.
- Не использовать CDN, React/Vite runtime, `fetch`, sticky, touch/pointer as required.
- Не полагаться на OS virtual keyboard.
- Не использовать heavy blur/backdrop/filter.

## 11. Recommendations For Our First Implementation Slice

Slice A:

- Добавить mode router: `mode=diagnostic` / `mode=showcase`.
- Добавить кнопку **"Открыть витрину"** и **"Назад к диагностике"**.
- Сохранять `runId`, `terminalLabel`, `v/build`.
- Показать idle screen, theme switcher, demo banner.
- Реализовать baseline orientation detection: `landscape` / `portrait`.

Slice B:

- Реализовать `landscape_standard` и `portrait_standard` минимум.
- Сделать `ProductGrid`, `ProductCard`, категории, mock cart.
- Добавить 20/50/100 products и edge-case товары.
- Проверить отсутствие global horizontal scroll.

Slice C:

- Mock payment, success, error/staff required.
- Показывать demo banner в mock payment.
- Не использовать реальные payment labels/logos.

Slice D:

- Минимальный edit mode: zone frames, theme/card density, fallback movement buttons.
- Запретить arbitrary positioning.
- Back/help/payment controls не скрывать.

Slice E:

- Собственная экранная клавиатура.
- Search + numeric input через `click`.
- Portrait keyboardArea проверять отдельно.

Blueprint notes to add/keep:

- Orientation-aware layout is mandatory.
- Cart behavior in portrait should be decided early: bottom sheet vs drawer vs separate screen.
- Visual test matrix must include portrait-specific failures.
- Touch target sizing should be validated on real terminal; external guidance suggests large targets and spacing, but exact px values depend on actual screen density.

## Sources Used

- Snabble SCO documentation: https://docs.snabble.io/docs/pos/sco-user-manual/
- Toshiba Checkout Environment PDF: https://tgcs04.toshibacommerce.com/cs/groups/internet/documents/document/dg9z/njyw/~edisp/prod.tos660092.pdf
- Toshiba System 7 brochure: https://www.bluestarinc.com/hubfs/00_BlueStar%20Microsite%20Files/Toshiba_Retail/pdf/self_checkout_system_7_brochure_english_tcb15043d73d35ef-b.pdf?hsLang=en-us
- Diebold Nixdorf Vynamic Self-Service UI: https://www.dieboldnixdorf.com/-/media/diebold/files/retail/dn-vynamic-software/vynamic-self-service-ui-product-card.pdf
- Clover Kiosk: https://www.clover.com/kiosk
- MyFoodFast Kiosk: https://myfoodfast.com/kiosk
- OrderQ Kiosk: https://restaurant.orderq.us/services/kiosk
- AST POS Kiosk: https://www.ast-pos.com/ambient-self-ordering-kiosk
- SalePoint self-ordering kiosk: https://www.salepoint.com/restaurant-self-ordering-kiosk/
- OnePOS Kiosk Setup Guide: https://www.onepos.com/wp-content/uploads/2022/12/KioskSetup-3.pdf
- Seward Co-op self-checkout how-tos: https://seward.coop/self-checkout-how-tos/
- Accessible kiosk design: https://construkt.eu/accessible-kiosk-design/
- Advanced Kiosks keyboard options: https://advancedkiosks.com/products/options-and-peripherals/
- Touch screen kiosk guide: https://www.lookdigitalsignage.com/blog/touch-screen-kiosk-guide
