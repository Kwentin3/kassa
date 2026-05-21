# Blueprint: 1C HTML Shell Self-Checkout Showcase

Дата: 2026-05-20
Статус: v0.2 refined technical blueprint
Основание: `PRD_1C_HTML_SHELL_SELF_CHECKOUT_SHOWCASE.md`

## Executive Summary

Blueprint проектирует демонстрационный showcase runtime: HTML-витрину кассы самообслуживания, открываемую из диагностической страницы внутри 1С.

Рекомендуемый route/mode подход для первого среза:

```text
/diagnostics/1c-html-shell?mode=diagnostic
/diagnostics/1c-html-shell?mode=showcase
```

Оба режима должны жить в одном совместимом single-file runtime artifact, чтобы не добавлять риск второго bundle, CDN, ES modules или отдельной загрузки CSS/JS внутри V8WebKit.

Showcase работает только на mock-данных. Он показывает UX и визуальную гипотезу HTML-оболочки, но не является production-кассой и не подключает РМК, оплату, ККТ, чек, фискализацию или маркировку.

Refine v0.2 поднимает landscape/portrait support из open question в обязательное runtime-требование. Layout engine, zones, visual contract, test matrix и smoke checklist должны быть orientation-aware.

## 1. Scope

Этот Blueprint проектирует:

- демонстрационную HTML-витрину кассы самообслуживания;
- открытие из диагностической страницы;
- возврат к диагностике;
- mock-сценарий покупки;
- адаптивную раскладку с обязательной поддержкой `landscape` и `portrait`;
- visual contract;
- темы;
- режим редактирования;
- экранную клавиатуру;
- smoke-checks внутри V8WebKit.

Это не production-касса. Blueprint не проектирует РМК, RMK Adapter, production bridge, реальный чек, оплату, эквайринг, ККТ, фискализацию, маркировку, печать или работу с реальными товарами.

## 2. Source Documents

| Документ | Зачем нужен |
|---|---|
| `PRD_1C_HTML_SHELL_SELF_CHECKOUT_SHOWCASE.md` | Основные требования showcase: экраны, visual contract, mock state machine, первый срез. |
| `runtime-profiles/1C_HTML_SHELL_RUNTIME_CAPABILITY_CONTRACT_V8WEBKIT.md` | Жесткие runtime constraints для V8WebKit: что можно, что нельзя делать обязательной зависимостью. |
| `PRD_1C_HTML_SHELL_DIAGNOSTIC_HARNESS.md` | Продуктовая роль диагностики и предупреждение, что HTML-render не доказывает готовность кассы. |
| `BLUEPRINT_1C_HTML_SHELL_DIAGNOSTIC_HARNESS.md` | Текущий diagnostic route, single-file baseline, query params, freshness/no-cache discipline. |
| `1C_HTML_SHELL_BRIDGE_MANIFEST.md` | Только граница будущего: HTML не источник кассовой истины. Production bridge в этом Blueprint не проектируется. |
| `SELF_CHECKOUT_SHOWCASE_VISUAL_REFERENCES.md` | Secondary visual reference board. Используется только для композиционных паттернов, UX-ориентиров и анти-паттернов. Не является источником scope, не разрешает копировать чужой дизайн и не отменяет PRD / Blueprint / Runtime Capability Contract. |

## 2.1. Visual Reference Synthesis

Этот раздел фиксирует только принятые композиционные выводы из `SELF_CHECKOUT_SHOWCASE_VISUAL_REFERENCES.md`. Он не расширяет scope showcase, не разрешает копирование чужих UI и не отменяет V8WebKit Runtime Capability Contract.

### Landscape Composition

Принятое решение: `landscape_standard = productGrid + right cartPanel`.

- `productGrid` расположен слева или по центру.
- `cartPanel` расположен справа.
- Итог и кнопка **"Оплатить"** находятся рядом с корзиной.
- Помощь / staff action доступна в service/header/action зоне.
- `promoArea` допустима в `idle` и `wide`, но не должна отъедать критичное место в `shopping` state.

### Portrait Composition

Portrait не является сжатым landscape.

Принятое решение: `portrait default cart behavior = collapsed cart bar + bottom sheet`.

- `productGrid` становится основной вертикальной зоной.
- Категории и поиск располагаются ближе к верху.
- `cartPanel` не должен постоянно висеть справа или занимать половину экрана.
- Корзина в первом implementation choice: collapsed cart bar + bottom sheet.
- Drawer и separate cart screen остаются vNext / alternative.
- `actionBar` остается доступным снизу.
- `keyboardArea` занимает нижнюю зону и временно сжимает `productGrid`.
- **"Назад к диагностике"** остается доступной.

### ProductCard Composition

`ProductCard` должен иметь стабильные зоны:

- `image`;
- `title`;
- `price`;
- `badges`;
- `action`.

Правила:

- цена всегда видна;
- кнопка действия всегда видна;
- длинные названия не ломают карточку;
- карточки не имеют произвольной переменной высоты;
- отсутствие изображения показывает placeholder;
- badges не перекрывают цену и кнопку;
- карточки не растягиваются сверх `cardMaxWidth`.

### CartPanel Composition

Landscape:

- `cartPanel` справа;
- items scroll внутри корзины;
- summary/actions зафиксированы внутри панели;
- total и **"Оплатить"** всегда доступны.

Portrait:

- collapsed cart bar показывает краткий итог;
- bottom sheet показывает содержимое корзины;
- bottom sheet bounded and closable;
- **"Оплатить"** не прячется глубоко в scroll;
- **"Назад к диагностике"** не перекрывается корзиной без выхода.

### Payment Screen

Mock payment должен быть явно demo-only.

- Использовать текст **"Демо-оплата"** или аналогичный buyer-safe текст.
- Показывать demo banner.
- Не использовать реальные банковские логотипы.
- Не использовать формулировки, которые создают ощущение реальной транзакции.
- Payment flow bounded: choose method -> mock processing -> success/error.
- Всегда есть безопасный выход назад.

### Staff / Help

Помощь сотрудника должна быть доступна в обеих ориентациях.

- **"Позвать сотрудника"** видно или легко доступно.
- `staff_required` показывается buyer-safe языком.
- Не показывать внутренние ошибки, JSON, stack trace.
- Mock age/staff-required не является реальной проверкой прав.

### On-screen Keyboard

Собственная экранная клавиатура остается правильным подходом.

- HTML-кнопки.
- `click` handlers.
- JS buffer.
- Backspace / clear / apply / hide.
- Не зависеть от OS keyboard.
- Не зависеть от touch/pointer events.
- В portrait клавиатура занимает bottom `keyboardArea`.
- В landscape может быть lower zone / overlay.
- Клавиатура не должна блокировать critical actions без кнопки закрытия.

### Edit Mode

Edit mode показывает кастомизируемость, но не ломает visual contract.

- Перемещение только между разрешенными зонами.
- No arbitrary positioning.
- Drag-and-drop optional.
- Fallback movement controls mandatory.
- Нельзя скрыть **"Назад к диагностике"**.
- Нельзя скрыть **"Помощь"**.
- Нельзя сломать `productGrid` / `cartPanel` / `actionBar`.

### Visual Reference Anti-patterns

- Не копировать внешний бренд, цвета, иконки, тексты или exact layout.
- Не делать portrait как сжатый landscape.
- Не делать mock payment похожим на real payment.
- Не растягивать `ProductCard` сверх `cardMaxWidth`.
- Не делать карточки переменной высоты без контроля.
- Не скрывать цену и кнопку действия.
- Не прятать **"Назад к диагностике"**.
- Не делать `cartPanel`, который растягивает всю страницу.
- Не перекрывать `actionBar` клавиатурой без кнопки закрытия.
- Не использовать CDN, React/Vite runtime, `fetch`, sticky, touch/pointer как обязательные зависимости.
- Не полагаться на OS virtual keyboard.

## 3. Runtime Delivery Model

Рекомендуемая модель первого showcase-среза: один совместимый single-file runtime artifact, который обслуживает диагностику и showcase через mode routing.

Основной вариант:

```text
/diagnostics/1c-html-shell?mode=diagnostic
/diagnostics/1c-html-shell?mode=showcase
```

Почему это предпочтительно:

- меньше риск для 1С WebView / V8WebKit;
- не нужно загружать второй внешний bundle;
- проще сохранить `runId` и `terminalLabel`;
- проще реализовать возврат назад;
- соответствует single-file baseline;
- проще сохранить no-cache/freshness стратегию диагностической страницы.

Допустимый альтернативный вариант:

```text
/diagnostics/1c-html-shell/showcase
```

Условие для отдельного пути: он не должен требовать внешних CSS/JS как обязательной зависимости и должен проходить те же V8WebKit constraints. В первом срезе отдельный путь менее предпочтителен.

Требования:

- сохранять `runId`;
- сохранять `terminalLabel`;
- сохранять `build` или `v`, если параметр есть;
- не ломать кнопку **"Назад к диагностике"**;
- не зависеть от backend;
- не использовать React/Vite runtime внутри HTML-поля 1С.

## 4. Single-file Runtime Artifact Structure

Будущий runtime-файл должен быть self-contained.

Структура:

- HTML shell;
- inline CSS;
- inline classic JavaScript;
- mock data;
- theme tokens;
- layout rules;
- state machine;
- component registry;
- edit mode config;
- keyboard config;
- visual contract test hooks.

Запрещено как обязательная зависимость:

- ES modules;
- CDN;
- React/Vite runtime;
- service worker / PWA;
- external CSS/JS bundles.

Допустимо vNext: split-assets variant после отдельного same-origin resource smoke внутри целевой 1С-среды. Успех `data:` resource checks из диагностики для этого недостаточен.

## 5. Mode Router

Runtime modes:

| Mode | Назначение |
|---|---|
| `diagnostic` | Показывает диагностическую страницу. Default mode. |
| `showcase` | Показывает демонстрационную витрину кассы. |
| `visual-test` | Optional dev-only режим для визуальной матрицы, без production смысла. |
| `debug` | Optional local/dev-only режим; не должен быть нужен демонстратору. |

Минимальная логика:

- если `mode` отсутствует, открывать `diagnostic`;
- кнопка **"Открыть витрину"** ставит `mode=showcase`;
- кнопка **"Назад к диагностике"** ставит `mode=diagnostic`;
- `runId`, `terminalLabel`, `build` и `v` не теряются;
- возврат не зависит от History API как единственного механизма;
- fallback: обычное изменение `location.href`.

Mode router не является bridge и не отправляет кассовые команды в 1С.

## 6. Mock State Machine

Showcase state machine работает только в памяти HTML runtime и только на mock-данных.

| State | Вход | Видимые зоны | Действия | Выход | Mock-данные | Запрещено |
|---|---|---|---|---|---|---|
| `idle` | initial / reset / new purchase | `header`, `promoArea`, `actionBar`, service banner | Начать покупку, назад к диагностике | `shopping`, diagnostic | mock-бренд, mock-промо | Реальные кассовые операции |
| `shopping` | start purchase | `header`, `categoryArea`, `productGrid`, `cartPanel`, `actionBar`, `helpArea` | Каталог, поиск, помощь, оплатить | `catalog`, `search`, `cart`, `payment_select`, `staff_required` | категории, товары, корзина | Настоящий чек/суммы |
| `catalog` | category select | `categoryArea`, `productGrid`, `cartPanel` | Добавить товар, сменить категорию | `shopping`, `cart`, `staff_required`, `error` | mock-товары, edge cases | Добавление в РМК |
| `search` | search action | `productGrid`, `keyboardArea`, `cartPanel` | Ввод, очистить, применить, выбрать товар | `shopping`, `cart`, `error` | mock search index | OS keyboard dependency |
| `cart` | cart focus / cart panel open | `cartPanel`, `actionBar` | Плюс, минус, удалить, оплатить | `shopping`, `payment_select`, `staff_required`, `error` | mock cart items | Изменение реального чека |
| `payment_select` | pay from non-empty cart | `PaymentPanel`, `modalLayer`, `cartPanel` | Карта, СБП, отмена | `payment_processing`, `cart` | mock methods | Эквайринг |
| `payment_processing` | mock method selected | `PaymentPanel`, `modalLayer` | Дождаться, отменить demo | `payment_success`, `payment_error`, `cart` | delay/status | Терминал оплаты |
| `payment_success` | mock success | `SuccessScreen`, `modalLayer` | Новая покупка, назад к диагностике | `idle`, diagnostic | mock receipt | Печать/фискализация |
| `payment_error` | mock failure | `ErrorOverlay`, `PaymentPanel` | Повторить, помощь, корзина | `payment_select`, `cart`, `staff_required` | buyer-safe error | Технические stack/JSON |
| `staff_required` | product flag / help / error | `HelpPanel`, `modalLayer` | Позвать сотрудника, закрыть demo | previous safe state, `shopping` | mock reason | Реальные права сотрудника |
| `error` | invalid mock action | `ErrorOverlay` | Закрыть, помощь, назад | previous safe state, `staff_required` | mock error | Внутренние ошибки |
| `edit_mode` | checkbox on | `editPanel`, zone frames over current state | Тема, плотность, перемещение, сброс | current state | mock layout config | Production admin settings |

`edit_mode` - overlay поверх текущего state, а не отдельная production-админка. Он не меняет demo-покупку и не сохраняет production-настройки.

## 7. Mock Data Schema

```text
Category
- id
- title
- icon
- sortOrder

Product
- id
- categoryId
- title
- shortTitle
- price
- image
- badges
- flags
- requiresStaff
- ageRestrictedMock
- available
- description

CartItem
- lineId
- productId
- title
- qty
- price
- sum
- flags

PaymentMock
- method
- status
- message
- delayMs

ReceiptMock
- number
- total
- items
- timestamp
```

Required edge cases:

- товар без изображения;
- длинное название;
- очень длинное название;
- короткое название;
- длинная цена;
- бейдж **"Акция"**;
- бейдж **"Новинка"**;
- товар **"нужен сотрудник"**;
- mock возрастное ограничение;
- товар **"не найден"**;
- пустая корзина;
- корзина с 10+ товарами;
- ошибка изменения количества.

Mock-данные не должны быть похожи на реальные клиентские данные.

## 8. Layout Engine

Расчет адаптивной раскладки делается от фактической рабочей области внутри HTML-render, а не от физического экрана.

Ориентация определяется не по типу устройства, а по runtime viewport внутри 1С. Физический экран терминала может быть landscape, но HTML-поле 1С может иметь другую форму и размер.

Входные параметры:

- viewport width;
- viewport height;
- `devicePixelRatio`;
- orientation;
- aspect ratio;
- availableWidth;
- availableHeight;
- reserved header height;
- reserved actionBar height;
- cartPanel width;
- keyboardArea height;
- portraitHeaderHeight;
- portraitActionBarHeight;
- portraitCartCollapsedHeight;
- portraitKeyboardHeight;
- landscapeCartWidth;
- landscapeCartMinWidth;
- cardMinWidth;
- cardMaxWidth;
- cardMinHeight;
- productGridMinColumns;
- productGridMaxColumns;
- cartMode: `rightPanel | bottomSheet | drawer | separateScreen`;
- keyboardMode: `hidden | bottom | overlay`;
- promoMode: `full | compact | hidden`;
- gap;
- safe padding.

Модель двухуровневая:

```text
orientation: landscape | portrait
density/profile: compact | standard | wide
```

Итоговые layout profiles:

| Profile | Алгоритмические правила |
|---|---|
| `landscape_compact` | Меньше колонок; cartPanel уже или collapsible; promoArea минимальна; productGrid сохраняет controlled scroll. |
| `landscape_standard` | Основной рабочий режим; productGrid слева/по центру; cartPanel справа; actionBar доступен. |
| `landscape_wide` | Больше колонок; cartPanel шире; promoArea может быть видимой; больше spacing; карточки не растягивать сверх `cardMaxWidth`. |
| `portrait_compact` | 1-2 колонки товаров; корзина collapsed/bottom sheet; promo скрыт или минимален; keyboardArea снизу; actionBar компактный; editPanel отдельной панелью/режимом. |
| `portrait_standard` | 2-3 колонки, если ширина позволяет; cart bottom sheet; категории горизонтальной лентой или компактной сеткой; actionBar снизу через safe fixed/fallback; keyboardArea может сжимать productGrid. |

Blueprint не задает финальные пиксели. Реализация должна оформить значения как tokens и проверить их в V8WebKit.

### 8.1. Landscape Layout Rules

- Header сверху.
- Service/demo banner под header или внутри header/service area.
- `productGrid` в основной левой/центральной зоне.
- `cartPanel` справа.
- `actionBar` снизу или внутри `cartPanel`.
- `promoArea` допустима в `idle` и `landscape_wide`.
- `keyboardArea` появляется снизу или поверх нижней части `productGrid`.
- Back-to-diagnostic control доступен в header/service area.
- `editPanel` не перекрывает `cartPanel` и back-to-diagnostic.

Landscape profiles:

- `landscape_compact`: меньше колонок; cartPanel уже/collapsible; promoArea минимальна; productGrid scroll controlled.
- `landscape_standard`: основной режим; productGrid слева/по центру; cartPanel справа; actionBar доступен.
- `landscape_wide`: больше колонок; cartPanel шире; promoArea видима; больше spacing; карточки не растягиваются сверх `cardMaxWidth`.

### 8.2. Portrait Layout Rules

- Header сверху.
- Service/demo banner компактнее.
- Категории и поиск ближе к верху.
- `productGrid` занимает основную вертикальную область.
- `cartPanel` не должен постоянно занимать половину экрана.
- `cartPanel` в portrait работает как `bottomSheet`, `drawer`, `collapsed cart bar` или `separate cart screen`.
- `actionBar` доступен снизу.
- `keyboardArea` занимает нижнюю часть экрана и временно сжимает `productGrid`.
- `promoArea` после старта покупки минимизируется или скрывается.
- Кнопка **"Назад к диагностике"** остается доступной.
- Кнопка **"Помощь"** остается доступной.
- `productGrid` не создает горизонтальную прокрутку всей страницы.
- Карточки не становятся слишком узкими.
- Mock payment открывается как modal/screen, не ломая back-to-diagnostic.
- Edit mode в portrait использует упрощенный control panel, а не большие плавающие панели.

Portrait profiles:

- `portrait_compact`: 1-2 колонки; корзина collapsed/bottom sheet; promo скрыт/минимален; keyboardArea снизу; actionBar компактный; editPanel отдельной панелью/режимом.
- `portrait_standard`: 2-3 колонки, если ширина позволяет; cart bottom sheet; категории горизонтальной лентой или компактной сеткой; actionBar закреплен снизу через safe fixed/fallback; keyboardArea может вытеснять нижнюю часть `productGrid`.

`wide` применим в основном к landscape или очень крупной рабочей области. Для portrait wide обычно не нужен.

## 9. Layout Zones

| Zone | Назначение | Landscape behavior | Portrait behavior | Scroll | Скрытие | Edit mode | Критичность |
|---|---|---|---|---|---|---|---|
| `header` | Бренд, статус, служебные действия | Широкая шапка с темами и **"Назад к диагностике"** | Компактная шапка; часть service actions может уйти в меню, но back доступен | no | no | no arbitrary move | critical |
| `promoArea` | Промо/idle content | Hero/promo допустимы в idle/wide | Компактно или скрыто после начала покупки | optional internal | yes | movable | non-critical |
| `categoryArea` | Категории | Chips/grid above productGrid | Горизонтальная лента или компактная строка | internal if needed | no in shopping | movable within allowed zones | important |
| `productGrid` | Товары | Основная сетка рядом с cartPanel | Основная вертикальная зона, scroll внутри productGrid | yes internal | no | cannot break | critical |
| `cartPanel` | Корзина | Right panel | Bottom sheet / drawer / separate cart screen | items internal | no if cart active | movable/collapsible by profile | critical |
| `actionBar` | Основные действия | Снизу или внутри cartPanel | Bottom action bar, не теряется при открытой корзине/клавиатуре | no | no | no arbitrary move | critical |
| `helpArea` | Помощь | Service button / panel | Компактная service action, всегда доступна | no / modal | no | no hide | critical |
| `modalLayer` | Overlay | Не должен безвыходно перекрывать back-to-diagnostic | То же; modal/screen должен закрываться | no global scroll | n/a | n/a | critical when open |
| `keyboardArea` | Экранная клавиатура | Lower zone / overlay | Bottom zone, временно сжимает productGrid | no / internal rows | yes when closed | profile-managed | important |
| `editPanel` | Demo customization | Side/service panel или overlay | Compact panel / drawer, не закрывает всю витрину | internal | yes when off | fixed/service | service critical |

Critical zones: `header/service controls`, `cartPanel/actionBar`, `helpArea`, back-to-diagnostic control.

## 10. Visual Contract Blueprint

### 10.1. Root Viewport Contract

- Корневая область не создает горизонтальный scroll.
- Вся витрина живет внутри viewport.
- Критичные кнопки доступны.
- Global overflow hidden/controlled, scroll только в разрешенных зонах.

### 10.2. Grid Contract

- Количество колонок вычисляется от available width.
- Карточки не меньше `cardMinWidth`.
- Overflow только внутри `productGrid`.
- Gap token.
- `productGrid` не ломает `cartPanel`.

### 10.3. ProductCard Contract

- image area;
- title area;
- price area;
- action area;
- badge area;
- fallback image;
- max title lines;
- stable height или controlled height;
- no overlap.

Цена и кнопка действия всегда видны. Изображение не выходит из карточки.

### 10.4. CartPanel Contract

- Internal scroll для items.
- Summary/actions fixed внутри панели.
- Long title handling.
- Qty controls.
- Total always visible.
- Empty cart state с понятным next step.

### 10.5. Text Contract

- Min font sizes через tokens.
- Max lines для названий.
- Ellipsis/fade fallback.
- Buyer-safe messages.
- Технические термины только в service banner.

### 10.6. Image Contract

- Local/inline placeholders.
- No CDN requirement.
- `object-fit` rules.
- Broken/empty image не ломает карточку.
- Тяжелые изображения не использовать в первом baseline.

### 10.7. Overflow Contract

- Allowed scroll zones: `productGrid`, cart items area, edit panel internals.
- Forbidden: global horizontal scroll.
- Modal не должен безвыходно перекрывать back-to-diagnostic.
- Keyboard overlay не перекрывает critical actions без кнопки закрытия.

### 10.8. Edit Mode Contract

- No arbitrary absolute placement.
- Only allowed zones.
- Critical controls cannot be hidden.
- Drag-and-drop optional.
- Fallback controls mandatory.

### 10.9. Landscape Contract

- `cartPanel` справа не растягивает страницу.
- `productGrid` не перекрывает `cartPanel`.
- `actionBar` виден.
- Карточки не растягиваются сверх `cardMaxWidth`.
- `promoArea` не отъедает критичное место в shopping state.
- `keyboardArea` не блокирует оплату, помощь и возврат к диагностике.
- `editPanel` не закрывает `cartPanel` и service controls.

### 10.10. Portrait Contract

- Карточки не становятся меньше `cardMinWidth`.
- Если колонок мало, карточки не растягиваются неестественно сверх `cardMaxWidth`.
- `productGrid` не создает global horizontal scroll.
- Cart bottom sheet не перекрывает `actionBar` без возможности закрытия.
- `keyboardArea` не делает интерфейс непригодным.
- Итог корзины и кнопка оплаты доступны через bottom sheet или cart screen.
- Back-to-diagnostic не уходит в scroll.
- Edit mode не закрывает критичные действия.
- Modal можно закрыть и вернуться к безопасному state.

### 10.11. Touchable Elevation Contract

Showcase работает на сенсорном экране, поэтому все активные элементы должны иметь одинаковый визуальный отклик на нажатие.

Состояния:

- `default`: элемент приподнят над холстом через мягкую тень;
- `pressed`: элемент визуально опускается через `translateY(1-3px)` и легкий `scale`, тень становится короче;
- `active`: выбранная категория, тема или способ mock-оплаты имеет отдельный selected style и не теряет pressed-state;
- `disabled`: элемент приглушен, плоский, без lift/press ощущения;
- `busy`: действие принято, повторное нажатие визуально ограничено;
- `focus`: видимый фокус для клавиатурной проверки и accessibility.

Применяется к `ProductCard`, `showcase-button`, категориям, элементам корзины, mock-оплате, помощи, экранной клавиатуре, переключателю тем, edit fallback controls и back-to-diagnostic control.

Implementation rules:

- baseline uses CSS `box-shadow`, `transform`, `transition` and `:active`;
- optional JS class is allowed only as enhancement, not as required runtime foundation;
- do not require `hover`, touch events or pointer events;
- press transition target: 100-160ms;
- pressed-state must not change element size, grid columns, scroll zones or critical action availability;
- effect confirms the physical tap only; state machine still owns success/error/busy feedback.

## 11. Visual Contract Test Matrix

| Test | Setup | Expected layout behavior | Pass/fail rule |
|---|---|---|---|
| 20 products | 20 mock products | Grid fills normal view, no overlap | Pass if cards stay in `productGrid` and cart/actions visible. |
| 50 products | 50 mock products | Internal productGrid scroll | Pass if no page horizontal scroll. |
| 100 products | 100 mock products | ProductGrid remains scroll zone | Pass if cart/actionBar unaffected. |
| Missing image | Product image null/error | Placeholder shown | Pass if card height stable. |
| Long title | 2-3 line product title | Title clipped/limited | Pass if price/action visible. |
| Very long title | Extreme text | Safe truncation | Pass if no card expansion breaks grid. |
| Long price | Large formatted price | Price readable | Pass if action remains visible. |
| Badges | Акция/Новинка | Badge area stable | Pass if title/price not covered. |
| Empty cart | No items | Empty state | Pass if pay disabled/hidden clearly. |
| Cart 1 item | One line | Summary visible | Pass if qty controls readable. |
| Cart 10+ items | Many lines | Items internal scroll | Pass if total/pay fixed. |
| Long cart name | Long item title | Safe truncation | Pass if qty/price readable. |
| Compact viewport | Small working area | compact profile | Pass if critical controls visible. |
| Standard viewport | Typical V8WebKit area | standard profile | Pass if grid + right cart work. |
| Wide viewport | Wide area | wide profile | Pass if no uncontrolled stretching. |
| Theme switch | Switch every theme | Tokens apply | Pass if contrast and layout survive. |
| Keyboard open | Search keyboard visible | Uses keyboardArea | Pass if close/apply and critical actions accessible. |
| Edit mode on | Enable edit | Zone frames visible | Pass if critical controls not hidden. |
| Payment modal | Mock payment | Modal contained | Pass if demo banner/back path accessible. |
| Error modal | Mock error | Buyer-safe message | Pass if no JSON/stack visible. |
| Success screen | Mock success | Receipt summary visible | Pass if new purchase/back visible. |
| Back to diagnostic | Any state | Return to diagnostic mode | Pass if `runId`/`terminalLabel` preserved. |
| Touchable elevation | ProductCard, category, pay, qty, keyboard key, back button | Default state is lifted; pressed state visually lowers surface | Pass if transform/shadow change without layout shift. |
| Disabled/busy touch state | Empty cart pay or payment processing | Element is visually muted and not lifted like enabled controls | Pass if disabled/busy cannot be confused with tappable control. |
| Portrait small viewport | `portrait_compact` test size | 1-2 columns, no global horizontal scroll | Pass if cards >= min width and back/action visible. |
| Portrait standard viewport | `portrait_standard` test size | 2-3 columns if width allows | Pass if productGrid scroll is internal. |
| Portrait 20 products | Portrait + 20 products | ProductGrid is primary vertical zone | Pass if cart/action controls remain reachable. |
| Portrait 50 products | Portrait + 50 products | Internal productGrid scroll | Pass if no page horizontal scroll. |
| Portrait cart collapsed | Portrait + cart items | Collapsed cart bar/bottom entry visible | Pass if total/action path is reachable. |
| Portrait cart bottom sheet | Open cart sheet | Sheet bounded and closable | Pass if actionBar/back not trapped. |
| Portrait cart separate screen | Open cart screen mode | Cart takes screen safely | Pass if back to shopping and diagnostic available. |
| Portrait keyboard opened | Search keyboard open | Keyboard uses bottom zone | Pass if close/apply visible and productGrid not broken. |
| Portrait long product names | Long titles in portrait | Titles truncated safely | Pass if price/action visible. |
| Portrait missing images | Missing images in portrait | Placeholder shown | Pass if cards stable. |
| Portrait edit mode | Edit mode enabled | Compact edit panel/drawer | Pass if critical controls visible. |
| Portrait theme switch | Switch all themes in portrait | Tokens apply | Pass if contrast and layout survive. |
| Portrait mock payment | Payment flow in portrait | Modal/screen bounded | Pass if demo banner/back path accessible. |
| Portrait success screen | Success in portrait | Summary readable | Pass if new purchase/back visible. |
| Portrait error/staff screen | Error/help in portrait | Buyer-safe message | Pass if modal closes and no critical trap. |
| Portrait back to diagnostic | Any portrait state | Return to diagnostic mode | Pass if query params preserved. |

## 12. Theme Token Contract

Themes:

- Светлая;
- Темная;
- Графитовая / премиальная;
- Теплая кофейная;
- Яркая retail / промо.

Tokens:

- `background`;
- `surface`;
- `card`;
- `primary`;
- `secondary`;
- `accent`;
- `text`;
- `mutedText`;
- `border`;
- `shadow`;
- `liftShadow`;
- `pressedShadow`;
- `pressTransform`;
- `pressTransitionMs`;
- `radius`;
- `buttonStyle`;
- `fontScale`;
- `cardDensity`;
- `orientation`;
- `layoutProfile`;
- `breakpointCompact`;
- `breakpointStandard`;
- `breakpointWide`;
- `gap`;
- `padding`;
- `safeAreaPadding`;
- `zoneGap`;
- `cardMinWidth`;
- `cardMaxWidth`;
- `cardMinHeight`;
- `productGridMinColumns`;
- `productGridMaxColumns`;
- `cartMinWidth`;
- `portraitHeaderHeight`;
- `portraitActionBarHeight`;
- `portraitCartCollapsedHeight`;
- `portraitKeyboardHeight`;
- `portraitCategoryHeight`;
- `landscapeCartWidth`;
- `landscapeCartMinWidth`;
- `landscapeCartMaxWidth`;
- `headerHeight`;
- `actionBarHeight`.

CSS variables допустимы, но должны иметь fallback/static defaults. Theme switch не должен менять DOM так, чтобы ломалась state machine.

## 13. 1C Shell UI Kit Blueprint

Это внутренний набор runtime-компонентов, не npm-библиотека.

| Component | Назначение | Входные данные | State | Visual contract | Fallback | Запрещенные зависимости |
|---|---|---|---|---|---|---|
| `ShellScreen` | Root shell | mode, app state, layout profile | idle/shopping/etc | root viewport | static layout | React/Vite, modules |
| `HeaderBar` | Бренд и service controls | theme, runId, mode | normal/service | fixed height | text-only controls | sticky |
| `ThemeSwitcher` | Demo theme switch | theme list | active theme | no layout jump | select/buttons | external UI lib |
| `PromoBanner` | Idle/promo | text/image placeholder | visible/hidden | bounded area | text placeholder | CDN images |
| `CategoryGrid` | Категории | categories | selected | internal fit | compact list | hover-only |
| `ProductCard` | Товар | product | normal/pressed/disabled/staff | card + touch elevation contract | placeholder image | real product calls |
| `ProductGrid` | Сетка товаров | products/layout tokens | scroll | grid contract | single column | global scroll |
| `CartPanel` | Корзина | cartItems, totals | empty/filled | cart contract | empty state | real receipt |
| `ActionBar` | Основные действия | available actions | enabled/disabled | visible actions | compact buttons | hidden critical CTA |
| `PaymentPanel` | Mock payment | cart, payment state | select/processing | modal contract | text progress | real acquiring |
| `HelpPanel` | Помощь | reason | requested/idle | service visible | simple modal | real staff auth |
| `ErrorOverlay` | Buyer-safe errors | error message | open/closed | modal contract | text only | stack/JSON |
| `SuccessScreen` | Mock success | receipt mock | done | success contract | summary only | print/fiscalization |
| `EditModeOverlay` | Demo layout controls | layout config | active/inactive | edit contract | buttons only | production admin |
| `LayoutZone` | Allowed zones | zone config | empty/filled | zone bounds | static bounds | arbitrary absolute |
| `OnScreenKeyboard` | Search keyboard | buffer/layout | open/closed | keyboardArea | numeric only | OS keyboard |
| `NumericKeyboard` | Numeric input | buffer | open/closed/pressed | click buttons + touch elevation | native input fallback | touch dependency |
| `Toast` | Short feedback | message | visible/hidden | non-blocking | inline notice | blocking alert only |
| `Modal` | Generic overlay | content/actions | open/closed | no trap | close/back action | unreachable close |

## 14. Edit Mode Blueprint

Controls:

- чекбокс **"Режим редактирования"**;
- рамки зон;
- подсветка блоков;
- controlled movement;
- fallback-кнопки;
- выбор зоны;
- перемещение выше/ниже;
- theme switcher;
- card density;
- card size;
- reset layout;
- optional export layout JSON as vNext.

Rules:

- drag-and-drop не обязательный;
- drag-and-drop не единственный способ;
- no arbitrary positioning;
- нельзя скрыть **"Назад к диагностике"**;
- нельзя скрыть **"Помощь"**;
- нельзя сломать `productGrid`;
- изменения demo-only;
- не сохранять production-настройки.

## 15. On-screen Keyboard Blueprint

Components:

- `NumericKeyboard`;
- `SearchKeyboard`.

Behavior:

- JS buffer;
- click-based input;
- backspace;
- clear;
- apply;
- hide;
- RU/EN optional;
- no OS keyboard dependency;
- no touch dependency;
- no CDN;
- no heavy library.

Layout impact:

- занимает `keyboardArea`;
- в landscape занимает lower zone или overlay нижней части productGrid;
- в portrait занимает bottom zone и временно сжимает productGrid;
- в compact может вытеснять или collapse `cartPanel`;
- не перекрывает critical actions без кнопки закрытия;
- не требует focus/input как единственного пути ввода.

## 16. Effects Blueprint

Allowed:

- fade-in;
- slide/fade;
- pressed state for every active element;
- lift/press effect through shadow + transform;
- transform on press: `translateY(1-3px)` and light `scale`;
- transitions 100-160ms for press feedback, 150-250ms for screen changes;
- simple SVG icons;
- soft shadows;
- rounded cards;
- modal overlay.

Forbidden:

- particle effects;
- WebGL/canvas;
- heavy blur/backdrop/filter;
- hover-only UX;
- touch/pointer-only UX;
- pressed feedback that changes layout size or scroll behavior;
- blocking animations;
- complex SVG animation as required feedback.

## 17. Anti-False-Readiness Banner

Text:

```text
Демо-режим. Данные тестовые. РМК, оплата и ККТ не подключены.
```

Rules:

- виден на `idle`;
- виден в служебной панели;
- виден в edit mode;
- виден в mock payment;
- не доминирует над покупательским интерфейсом;
- не скрывает критичные действия;
- не заменяет buyer-facing error messages.

## 18. Navigation Blueprint

Runtime functions at design level:

- `openShowcase()`;
- `backToDiagnostic()`;
- `preserveQueryParams(runId, terminalLabel, build/v)`.

Rules:

- fallback via `location.href`;
- no dependency on History API only;
- back button not confused with cancel purchase;
- modal must not trap user away from back-to-diagnostic;
- `runId`, `terminalLabel`, `build`, `v` preserved when present;
- navigation does not call 1С bridge or РМК.

## 19. Runtime Constraints

Use:

- classic JS;
- inline CSS;
- DOM write;
- flex;
- CSS Grid with fallback;
- CSS variables with fallback/static defaults;
- controlled scroll;
- `position: fixed`;
- XHR if network is needed;
- SVG only as enhancement.

Do not require:

- `fetch`;
- Clipboard API;
- `position: sticky`;
- touch/pointer events;
- React/Vite runtime;
- CDN;
- external CSS/JS mandatory;
- service worker/PWA;
- real RMK/payment/KKT.

## 20. Implementation Slices

| Slice | Scope | Excluded |
|---|---|---|
| A | mode router; diagnostic/showcase navigation; idle screen; baseline shell; theme switcher; demo banner; baseline orientation detection; landscape/portrait shell foundation; touch elevation tokens | catalog, cart, payment |
| B | `landscape_standard` productGrid + right cartPanel; `portrait_standard` productGrid + collapsed cart bar + bottom sheet; ProductCard stable zones; CartPanel stable total/actions; visual contract baseline; add/remove/qty; ProductCard/category/button pressed-state | real products, РМК |
| C | mock payment visibly demo-only; no real payment logos; bounded payment flow; buyer-safe success/error/staff states; modal behavior in both orientations | acquiring, ККТ, fiscalization |
| D | edit mode with allowed zones; fallback controls; no arbitrary positioning; theme/card density controls; edit mode in landscape and portrait | production admin, backend persistence, free-form design tool |
| E | own on-screen keyboard; search/numeric input through click + JS buffer; portrait keyboardArea behavior; landscape lower zone/overlay behavior; keyboard key pressed-state | OS keyboard dependency, touch/pointer-only input, scanner integration |
| F | visual contract test matrix; V8WebKit smoke checklist; portrait/landscape smoke; documentation update | production bridge, RMK Adapter |

Do not include:

- RMK Adapter;
- production bridge;
- backend persistence;
- real payment.

## 21. Smoke Checklist For V8WebKit

- Открыть diagnostic.
- Нажать **"Открыть витрину"**.
- Вернуться к diagnostic.
- Пройти `idle -> shopping`.
- Добавить товар.
- Удалить товар.
- Изменить qty.
- Переключить тему.
- Открыть keyboard.
- Пройти mock payment.
- Открыть success.
- Открыть error/staff.
- Включить edit mode.
- Переместить блок fallback-кнопкой.
- Проверить `landscape_compact`.
- Проверить `landscape_standard`.
- Проверить `landscape_wide`.
- Проверить `portrait_compact`.
- Проверить `portrait_standard`.
- Проверить переключение/resize между landscape и portrait, если возможно через resize или test class.
- В portrait проверить отсутствие global horizontal scroll.
- В portrait проверить cart collapsed.
- В portrait проверить cart opened.
- В portrait проверить keyboard opened.
- В portrait проверить mock payment.
- В portrait проверить edit mode.
- В portrait проверить back-to-diagnostic.
- В landscape проверить cart right panel.
- В landscape проверить wide product grid.
- В landscape проверить композицию `productGrid + right cartPanel`.
- В portrait проверить collapsed cart bar + bottom sheet.
- Проверить, что portrait не выглядит как сжатый landscape.
- Проверить 20/50/100 products.
- Проверить long names/images missing.
- Проверить missing image placeholder у `ProductCard`.
- Проверить, что цена и кнопка действия в `ProductCard` остаются видимыми.
- Проверить, что cart total/pay always reachable.
- Проверить, что mock payment visibly demo-only и не использует real payment logos.
- Проверить, что help/staff action visible in both orientations.
- Проверить, что keyboard closes and does not block critical actions.
- Проверить lift/press feedback у ProductCard, категорий, кнопок корзины, оплаты, help, keyboard и back-to-diagnostic.
- Проверить, что disabled/busy controls не выглядят нажимаемыми.
- Проверить, что pressed-state не меняет размеры карточек, сетку, scroll-зоны или доступность критичных кнопок.
- Проверить, что нет копирования external brand/look из visual references.
- Проверить отсутствие global horizontal scroll.
- Проверить, что back-to-diagnostic always accessible.

## 22. Documentation Updates

После реализации обновлять:

- `PRD_1C_HTML_SHELL_SELF_CHECKOUT_SHOWCASE.md`, если меняется scope;
- runtime capability contract только при новом диагностическом отчете;
- diagnostic harness docs, если меняется mode routing;
- implementation report по фактическому срезу и smoke.

## 23. Acceptance Criteria

Blueprint считается готовым, если:

- переводит PRD в техническую схему;
- не пишет production-код;
- не подключает РМК/оплату/ККТ;
- рекомендует route/mode strategy;
- описывает single-file runtime structure;
- учитывает V8WebKit Runtime Capability Contract;
- описывает state machine;
- описывает orientation-aware layout engine;
- описывает landscape и portrait правила;
- описывает visual contract test matrix;
- содержит portrait-тесты;
- содержит portrait/landscape visual contract;
- описывает theme token contract;
- описывает edit mode;
- описывает keyboard;
- описывает mock data schema;
- описывает implementation slices;
- описывает smoke checklist внутри V8WebKit.

## 24. Risks / Anti-errors

- Showcase расползается в production-кассу.
- Visual references превращаются в копирование чужого дизайна вместо анализа паттернов.
- Food ordering references искажают grocery/self-checkout flow.
- Layout проектируется под один экран.
- Карточки вылезают за `productGrid`.
- ProductCard visual contract игнорируется: цена/action скрываются, высота становится неконтролируемой.
- Корзина растягивает страницу.
- Portrait cart behavior остается нерешенным и ломает layout.
- Кнопка back теряется.
- Edit mode ломает критичные зоны.
- Edit mode становится free-form design tool и ломает layout.
- Theme switch ломает contrast.
- Keyboard перекрывает critical actions.
- Mock payment выглядит как real payment.
- Pressed-state реализован только для части элементов, и покупатель не понимает, что нажал.
- Lift/press эффект вызывает layout shift, меняет высоту карточек или создает scroll.
- Disabled/busy элементы выглядят как нажимаемые.
- Агент использует React/Vite/CDN/fetch/sticky как обязательную зависимость.
- Runtime Capability Contract игнорируется.
- Нет проверки в V8WebKit.
- Portrait трактуется как просто "сжатый landscape".
- `cartPanel` в portrait перекрывает `productGrid`.
- `keyboardArea` в portrait блокирует `actionBar`.
- Back-to-diagnostic теряется в portrait.
- `editPanel` в portrait закрывает весь интерфейс.
- Product cards становятся слишком узкими.
- Появляется global horizontal scroll в portrait.
- Theme switch ломает contrast в portrait.

## 25. Open Questions

- Какие реальные терминалы будут использоваться?
- Какие touch-сценарии и размеры целевого терминала нужно проверить вручную?
- Какие конкретные portrait-размеры нужно проверить?
- Какая минимальная ширина portrait viewport допустима?
- Нужно ли поддерживать portrait на реальном терминале или только для демонстрации в окне?
- Какой cart behavior предпочтителен в portrait: bottom sheet, drawer или separate screen?
- Нужно ли показывать `promoArea` в portrait idle?
- Нужно ли включать portrait в первый implementation slice или в Slice B?
- Нужны ли изображения товаров в первом демо?
- Нужен ли звук?
- Нужен ли scanner mock?
- Нужно ли сохранять layout config между перезапусками?
- Какие темы показывать первыми?
- Нужна ли демонстрация конкретного бренда клиента?
- Нужно ли добавлять отдельный visual-test mode в первый срез?

Portrait support обязателен. Открытые вопросы касаются только конкретных размеров, поведения корзины и распределения по implementation slices.

## 26. Refine v0.2 Summary

- Portrait/landscape support поднят из open question в обязательное требование.
- Layout engine стал orientation-aware.
- Добавлены layout profiles `landscape_compact`, `landscape_standard`, `landscape_wide`, `portrait_compact`, `portrait_standard`.
- Добавлены portrait layout rules.
- Layout zones получили поведение по ориентациям.
- Visual contract расширен на portrait.
- Test matrix расширена portrait-сценариями.
- Smoke checklist расширен portrait/landscape проверками.
- Theme/layout tokens расширены orientation-параметрами.
- Implementation slices обновлены с учетом ориентаций.
- Open questions обновлены.
- Visual reference board встроен как secondary source: приняты композиционные решения для landscape, portrait, ProductCard, CartPanel, mock payment, help, keyboard и edit mode без расширения scope.

## 26.1. Touch Elevation Refactor Summary

- Добавлен Touchable Elevation Contract для всех активных элементов showcase.
- Theme tokens расширены `liftShadow`, `pressedShadow`, `pressTransform`, `pressTransitionMs`.
- Effects Blueprint уточнен: pressed-state является baseline, hover/touch/pointer не являются обязательной основой.
- Visual Contract Test Matrix и V8WebKit smoke checklist расширены проверками lift/press, disabled/busy и отсутствия layout shift.

## 27. Final Boundary

Этот Blueprint проектирует демонстрационный showcase runtime. Он не проектирует настоящую кассу.

Разрешенная формулировка:

```text
Демонстрационная HTML-витрина показывает UX и визуальную гипотезу.
```

Запрещенная формулировка:

```text
Касса готова.
```
