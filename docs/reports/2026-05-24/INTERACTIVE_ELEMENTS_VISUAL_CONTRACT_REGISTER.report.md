# Реестр интерактивных элементов и визуального контракта

Дата: 2026-05-24

## Статус

`pass after refactor` для BOLARS customer-facing button surface contract. Часть legacy showcase/catalog элементов уже имела корректный touch elevation contract; BOLARS-контур получил централизованный CSS-layer для контрастной заливки, тени, hover/lift, pressed depression, disabled и reduced-motion states.

Runtime-код не менялся. Рефакторинг выполнен CSS-only в `src/styles/index.css`, contract-test добавлен в `src/tests/visual-contract.test.ts`.

## Границы

- Основной customer-контур: `src/bolars/BolarsSelfCheckoutApp.tsx`.
- Legacy showcase/catalog-контур: `src/screens/*`, `src/components/*`.
- Основной CSS: `src/styles/index.css`.
- Реальный backend, 1C, payment, SBP, KKT, fiscalization, CMS не затрагиваются.

## Реестр

| Контур | Элемент | Где | Текущий контракт | Разрыв | Приоритет |
|---|---|---|---|---|---|
| BOLARS start | Карточки "сканировать" и "ручной поиск" | `src/bolars/BolarsSelfCheckoutApp.tsx:209`, `src/bolars/BolarsSelfCheckoutApp.tsx:215`; CSS `src/styles/index.css:780` | Есть фон, крупный размер, тень, border-bottom | Нет общего `transition`, `:active`, hover/lift, reduced-motion для этих кнопок | P0 |
| BOLARS header | "Отменить покупку" | `src/bolars/BolarsSelfCheckoutApp.tsx:187`; CSS `src/styles/index.css:879`, `src/styles/index.css:910` | Семантически `button`, видимая secondary action | `box-shadow: none`; выглядит более плоско, чем остальные действия | P1 |
| BOLARS cart | "Добавить товар" scan action | `src/bolars/BolarsSelfCheckoutApp.tsx:251`; CSS `src/styles/index.css:1055` | Есть карточная форма, фон, border, тень | Нет press/lift state | P0 |
| BOLARS cart | "Перейти к оплате" sticky CTA | `src/bolars/BolarsSelfCheckoutApp.tsx:282`; CSS `src/styles/index.css:879`, `src/styles/index.css:1392` | Хорошая primary surface, disabled state есть | Нет press/lift state; disabled не снимает shadow/transform через общий контракт | P0 |
| BOLARS cart | Search candidates | `src/bolars/BolarsSelfCheckoutApp.tsx:305`; CSS `src/styles/index.css:1128` | Семантически кнопки, есть фон и размер | Нет тени, press/lift, active acknowledgement только через изменение корзины | P0 |
| BOLARS cart line | +/- количество, значение количества, delete | `src/bolars/BolarsSelfCheckoutApp.tsx:325`, `src/bolars/BolarsSelfCheckoutApp.tsx:328`, `src/bolars/BolarsSelfCheckoutApp.tsx:331`, `src/bolars/BolarsSelfCheckoutApp.tsx:336`; CSS `src/styles/index.css:1272` | Кнопки компактные, disabled есть для decrement | Поверхности плоские: нет тени, press/lift; delete имеет только цвет | P0 |
| BOLARS payment setup | Package buttons | `src/bolars/BolarsSelfCheckoutApp.tsx:384`; CSS `src/styles/index.css:1128`, `src/styles/index.css:1504` | Хороший размер, branded border | Нет press/lift; визуально больше похожи на selectable tiles, чем на buttons | P1 |
| BOLARS payment setup | Discount phone input + apply | `src/bolars/BolarsSelfCheckoutApp.tsx:400`, `src/bolars/BolarsSelfCheckoutApp.tsx:401`; CSS `src/styles/index.css:1532`, `src/styles/index.css:1539` | Поле и action сгруппированы | Apply-кнопка без общего elevation/press; cursor явно не задан | P1 |
| BOLARS payment setup/error/modal | Primary/info/danger actions | `src/bolars/BolarsSelfCheckoutApp.tsx:412`, `src/bolars/BolarsSelfCheckoutApp.tsx:415`, `src/bolars/BolarsSelfCheckoutApp.tsx:468`, `src/bolars/BolarsSelfCheckoutApp.tsx:471`, `src/bolars/BolarsSelfCheckoutApp.tsx:508`, `src/bolars/BolarsSelfCheckoutApp.tsx:511`, `src/bolars/BolarsSelfCheckoutApp.tsx:530`; CSS `src/styles/index.css:879` | Базовая action-группа уже выделена | Нет transition/press/lift; danger не входит в disabled selector | P0 |
| BOLARS modal | Numpad buttons | `src/bolars/BolarsSelfCheckoutApp.tsx:551`, `src/bolars/BolarsSelfCheckoutApp.tsx:553`, `src/bolars/BolarsSelfCheckoutApp.tsx:554`; CSS `src/styles/index.css:1272`, `src/styles/index.css:2093` | Семантически кнопки, крупный target | Нет тени, press/lift; OK/Clear не различаются по иерархии | P1 |
| BOLARS header | Text scale segmented control | `src/bolars/BolarsSelfCheckoutApp.tsx:87`; CSS `src/styles/index.css:976`, `src/styles/index.css:988` | Есть `aria-pressed`, active state | Это скорее segmented control; нужен мягкий press/focus, но не heavy elevation | P2 |
| BOLARS preview/debug | Selects, debug link, details | `src/bolars/BolarsSelfCheckoutApp.tsx:629`, `src/bolars/BolarsSelfCheckoutApp.tsx:634`, `src/bolars/BolarsSelfCheckoutApp.tsx:639`, `src/bolars/BolarsSelfCheckoutApp.tsx:669` | Developer-only controls | Не customer surface; не надо смешивать с кассовым визуальным контрактом | P3 |
| Legacy generic | Shared `Button` | `src/components/ui.tsx:6`; CSS `src/styles/index.css:40` | Есть variants, min-height, active scale | Нет единого shadow depression; ghost flat по смыслу, но primary/secondary можно усилить | P1 |
| Legacy catalog | Category buttons | `src/screens/CatalogScreen.tsx:28`; CSS `src/styles/index.css:157`, `src/styles/index.css:209`, `src/styles/index.css:311` | Лучший текущий пример: shadow, active, hover, reduced-motion | Можно использовать как эталон для BOLARS | Done |
| Legacy product | Product cards + add CTA | `src/components/ProductCard.tsx:10`, `src/components/ProductCard.tsx:21`; CSS `src/styles/index.css:253`, `src/styles/index.css:298`, `src/styles/index.css:311` | Лучший текущий пример карточного press feedback | Контракт есть, покрыт visual smoke | Done |
| Legacy search | On-screen keyboard | `src/screens/ProductSearchScreen.tsx:27`, `src/screens/ProductSearchScreen.tsx:31`, `src/screens/ProductSearchScreen.tsx:34`, `src/screens/ProductSearchScreen.tsx:37` | Крупные кнопки | Плоский `bg-slate-100`, нет тени/press; на touch выглядит как клавиатура, но feedback слабый | P1 |
| Legacy cart | Remove, +/- quantity | `src/components/CartPanel.tsx:29`, `src/components/CartPanel.tsx:35`, `src/components/CartPanel.tsx:39` | Quantity имеет `shadow-sm`, remove только hover background | Нет единого press/lift; delete выглядит как icon action без поверхности | P1 |
| Legacy promo | Full-screen promo touch target | `src/screens/IdlePromotionScreen.tsx:16` | Внутри есть CTA-like карточка с `shadow-xl` | Вся область кликабельна, но не вся выглядит как кнопка; допустимо для attract screen, но CTA должен оставаться главным сигналом | P2 |
| Legacy branding/demo | Brand swatches, selects, toggles | `src/screens/BrandingDemoScreen.tsx:45`, `src/screens/BrandingDemoScreen.tsx:79`, `src/screens/BrandingDemoScreen.tsx:83`, `src/screens/BrandingDemoScreen.tsx:88`, `src/screens/BrandingDemoScreen.tsx:106` | Admin/demo controls, disabled при lock | Нужно не переусердствовать: это служебная панель, не customer CTA | P3 |

## Нарушения UI-инвариантов

1. Interactive elements must be unambiguous: нарушено частично. BOLARS quantity/delete/search/package/numpad элементы семантически кнопки, но визуально часто плоские.
2. Focus state must be explicit: в целом выполнено через `button:focus-visible` и `.bolars-root button:focus-visible`.
3. Disabled state must be explicit: выполнено частично. `disabled` есть у payment CTA и decrement, но общий disabled selector не покрывает `danger-action`; визуальный disabled не всегда снимает ощущение нажимаемой поверхности.
4. Every action must produce feedback: терминальный feedback в state есть, но immediate tactile feedback отсутствует у многих BOLARS controls.
5. Reduced motion: выполнено для legacy product/catalog, но не для будущего BOLARS elevation contract.

## Рекомендуемый контракт

Выполненный консервативный вариант без изменения business logic:

1. Ввести централизованный contract кнопочных поверхностей: normal bg, fg, border, rest shadow, optional texture, hover shadow, pressed shadow, hover translate, pressed translate/scale, focus, disabled.
2. Normal state кнопок должен иметь заливку темнее, плотнее или контрастнее родительской поверхности. Один только border не считается достаточным визуальным признаком кнопки.
3. Применить contract к существующим BOLARS классам группой ролей: primary, secondary, danger, icon, quantity, keypad, package, search result, header secondary.
4. Для `.bolars-secondary-action` сделать отдельный restrained contract: на тёмной шапке оставить читаемую собственную поверхность, но не конкурировать с primary CTA.
5. Для `.bolars-scale-control button` не делать тяжёлую карточную тень; оставить segmented-control вид, добавить только contrast state, transition и pressed micro-feedback.
6. В `@media (hover: hover) and (pointer: fine)` добавить lift только для pointer devices.
7. В `:active:not(:disabled)` добавить короткое утапливание: `translateY(2px) scale(0.985)` и меньшую тень.
8. В `@media (prefers-reduced-motion: reduce)` отключить transform/transition для нового BOLARS набора, сохранив контрастную заливку/focus/disabled.
9. Не менять размеры, grid, scroll, stage width и адаптивные layout tokens.

## Implementation

- Central token group added in `src/styles/index.css`: `--bolars-button-surface-fill`, `--bolars-button-card-fill`, `--bolars-button-primary-fill`, pressed/hover/disabled shadow and transform tokens.
- Central selector block added in `src/styles/index.css` under comment `Central BOLARS button-surface contract`.
- Covered BOLARS roles: start action cards, primary/info/secondary/danger actions, scan action card, search candidates, package buttons, quantity controls, delete, discount apply, numpad keys and text-scale micro-feedback.
- Reduced-motion override keeps contrast/focus/disabled states but removes transform transitions.
- `src/tests/visual-contract.test.ts` now asserts the centralized contract tokens and pressed/hover/reduced-motion selectors.

## Verification 2026-05-24

- `npm run typecheck`: passed.
- `npm run test:run`: passed, 11 files / 52 tests.
- `npm run build`: passed.
- Local Playwright BOLARS button surface smoke on production preview: passed for start action card, disabled payment CTA, search candidate, package action, discount apply action and numpad key.
- `npm run smoke:showcase-catalog` on local production preview: passed.
- `npm run visual:cards` on local production preview: passed.

## Evidence

- Проблема: customer должен без догадки отличать нажимаемые элементы от информационных карточек на планшетной кассе.
- Primary user action: начать покупку, добавить товар, изменить количество, перейти к оплате, оплатить, обработать ошибку.
- UI states: start, cart empty/non-empty, search below-min/found/not-found/in-progress, payment setup, payment waiting, payment error, final success, modal cancel, modal quantity, timeout warning.
- Boundary: UI в BOLARS рендерит snapshot и отправляет команды через `send(...)`; бизнес-логика остаётся в runtime adapter/store, CSS-правка не должна менять команды.
- Feedback: терминальный feedback уже приходит через screen/state/messages; не хватает immediate local press feedback для многих touch surfaces.

## Escalation

`none`. Решение можно сделать как CSS-only слой, без изменения state machine и без подключения внешних сервисов.
