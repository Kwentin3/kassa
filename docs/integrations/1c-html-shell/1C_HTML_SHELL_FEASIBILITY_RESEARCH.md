# 1C HTML Shell Feasibility Research

Дата: 2026-05-19  
Статус: research draft for spike planning  
Область: покупательская HTML FrontShell-оболочка внутри 1С 8.3 / РМК

## Executive Summary

Гипотеза жизнеспособна как архитектурное направление, но только при жестком ограничении роли HTML: HTML является `view_layer_only`, а не кассовым runtime. Официальная платформа 1С поддерживает поле формы вида `Поле HTML-документа`, загрузку HTML программно, через URL и из HTML-макета, работу с DOM/HTML-документами и обработку событий HTML-документа. Платформа также имеет штатные средства чтения и записи JSON.

Риск не в самой идее HTML-поля, а в трех местах:

- фактический HTML-render не обязан совпадать с текущим Chrome;
- канал событий HTML -> 1С и вызов JS из 1С отличаются по версиям платформы, клиентам и WebKit/IE-истории;
- реальные точки управления РМК, текущим чеком, оплатой, ККТ и маркировкой зависят от конкретной конфигурации, расширяемости и доработок.

Практический вывод: начинать надо с минимального spike на реальной базе и терминале. До spike нельзя обещать CSS Grid, современные JS modules, сложные SVG-анимации, стабильную touch-клавиатуру, React/Vite runtime внутри поля HTML или прямой доступ FrontShell к кассовому оборудованию.

## Source Reliability

В этом документе есть три уровня уверенности:

- `official`: подтверждено страницами 1С или документацией платформы;
- `community`: подтверждено практическими статьями 1С-разработчиков, требует локальной проверки;
- `inference`: архитектурный вывод из ограничений платформы, требует spike.

Ключевые official-источники:

- 1С, HTML-документы: https://v8.1c.ru/platforma/html-dokumenty/
- 1С, JSON: https://v8.1c.ru/platforma/json/
- Стандарт 1С, ограничение использования HTML-поля: https://v8std.ru/std/730/
- 1С:РМК, кассы самообслуживания: https://v8.1c.ru/rmk/kassy-samoobsluzhivaniya/
- 1С:Розница, РМК: https://v8.1c.ru/retail/rabochee-mesto-kassira/

Community / reference-источники:

- Yellow ERP quick reference, `HTMLDocumentField`: https://yellow-erp.com/help/sh/objects/catalog56/catalog86/HTMLDocumentField.html/
- Habr, практическое использование поля HTML-документа: https://habr.com/ru/companies/lad_/articles/813177/
- 1Ci Knowledge Base, external data processors/reports: https://kb.1ci.com/1C_Enterprise_Platform/Guides/Developer_Guides/1C_Enterprise_8.3.23_Developer_Guide/Chapter_5._Configuration_objects/5.10._Reports_and_data_processors/5.10.2._External_data_processors_and_reports/

## What Is `Поле HTML-документа`

`Поле HTML-документа` - это вид элемента формы 1С, предназначенный для отображения HTML-документа внутри формы. В терминах проектируемой FrontShell-модели это контейнер для локальной или удаленной HTML-страницы, которая может отображать покупательский UI.

Официально подтверждено:

- HTML-документ может быть сформирован программно;
- HTML-документ может быть загружен из ресурса по URL;
- HTML-документ может быть загружен из макета типа `HTML-документ`;
- платформа предоставляет объекты для работы с HTML-документами последовательно и через DOM;
- возможно обрабатывать события от элемента управления, включая события HTML-документа.

Важно: стандарт 1С прямо ограничивает применение HTML-поля. Если задачу можно решить штатными элементами платформы, рекомендуется использовать штатные элементы. Допустимый штатный сценарий в стандарте - справка, инструкции, путеводители, картинки для просмотра. Наш сценарий выходит за этот conservative baseline, поэтому должен проходить отдельный technical spike и acceptance на целевой платформе.

## HTML Loading Options

| Option | Feasibility | Notes | FrontShell recommendation |
|---|---:|---|---|
| HTML string | supported | Строка HTML может быть сформирована в 1С и назначена реквизиту/полю. | Хорошо для PoC и маленького shell. Для большого UI неудобно поддерживать. |
| 1C макет | supported | Официально упоминается макет типа `HTML-документ`; на практике часто используют текстовые макеты для HTML-строки. | Хороший baseline: хранить single-file HTML/CSS/JS в макете или текстовом ресурсе. |
| Local HTML file | partially_supported | Платформа и community-примеры допускают путь к локальному файлу, но безопасность, права и asset paths зависят от клиента/ОС. | Возможен для spike. Для production предпочтительнее управляемый packaged asset, а не произвольный файл на диске. |
| External URL | supported | Официально поддержана загрузка из URL. | Удобно для разработки и демо, но production зависит от сети, TLS, кэша, политики безопасности и обновлений. |

Для кассы самообслуживания предпочтительный порядок проверки:

1. single-file HTML из макета/строки;
2. local packaged shell + локальные assets;
3. URL только если сеть, TLS, кэш и rollback уже управляются.

## HTML -> 1C Events

Релевантные механизмы:

- событие поля HTML-документа `ПриНажатии` / click-like event;
- событие завершения формирования/загрузки HTML-документа, часто называемое `ДокументСформирован` / `DocumentComplete` в reference-материалах;
- перехват перехода по ссылке через `href`;
- чтение данных из DOM-узлов HTML-документа;
- custom bridge через `href`, `data-*`, скрытый DOM-node или изменение `location/hash`.

Практический паттерн для FrontShell:

```text
HTML button tap
-> JS формирует command envelope
-> JS записывает envelope в bridge node или custom href
-> HTML инициирует событие, которое ловит 1С
-> 1С отменяет стандартную навигацию, валидирует JSON и маршрутизирует command
```

Не надо полагаться на произвольные browser APIs без проверки. Надежнее сначала проверить два транспорта:

- `href` command transport: `oneshell://command/<encoded-json>`;
- DOM mailbox transport: hidden textarea/div with JSON + synthetic click/link event.

## 1C -> HTML JavaScript Calls

Возможные механизмы:

- прямой доступ к объекту HTML-документа через свойство `Документ` поля HTML;
- вызов функции, определенной в HTML, через DOM/window object, если текущий render и версия платформы это позволяют;
- изменение DOM-узла с JSON state, после чего HTML сам читает snapshot;
- перезагрузка HTML-строки с новым embedded state, только как fallback, потому что это тяжелее и может ломать фокус/анимации.

Recommended bridge rule:

```text
1C never mutates UI widgets directly.
1C sends full state snapshot.
HTML calls window.FrontShell.updateState(state).
HTML renders the snapshot.
```

Минимальный API, который HTML обязан предоставить:

- `window.FrontShell.init(config)`;
- `window.FrontShell.updateState(state)`;
- `window.FrontShell.setBusy(flag, message)`;
- `window.FrontShell.showError(error)`;
- `window.FrontShell.navigate(screen)`;
- `window.FrontShell.reset()`.

Если прямой вызов JS-функций не работает на конкретной платформе, fallback: 1С пишет JSON в bridge-node, а HTML читает его по polling/timer. Это хуже, но для кассового UI может быть достаточно, если latency стабильна.

## JSON Exchange

JSON как формат обмена поддержан платформой 1С на уровне интеграционных возможностей. Официально описаны:

- потоковая запись и чтение JSON;
- сериализация примитивных типов и коллекций 1С;
- использование JSON в HTTP/REST/HTTP-сервисах.

Для FrontShell важно не использовать XDTO-прикладные типы 1С как публичный state. State должен быть очищенным DTO:

- только строки, числа, boolean, null, массивы и объекты;
- без ссылок на объекты 1С;
- без внутренних имен регистров, документов, пользователей и прав;
- без персональных и платежных данных сверх нужного UI-минимума.

## Dependency Factors

| Factor | Impact |
|---|---|
| Platform version 1C 8.3 | Определяет HTML engine, JS support, DOM API и стабильность bridge. Старые версии могут вести себя как IE-compatible runtime, новые - как WebKit-like runtime. |
| Thick client | Может иметь более прямой доступ к HTML document object, но зависит от платформы и ОС. |
| Thin client | Вероятно основной target для терминала; нужно проверить события, JS calls, touch/focus и fullscreen. |
| Web client | HTML-поле может фактически быть iframe в браузере; появляются browser/CORS/sandbox/cross-origin ограничения. |
| Terminal OS | Windows/Linux/Android/macOS могут отличаться WebKit/IME/touch/font/render behavior. |
| Compatibility mode | Может сохранять старое поведение платформы и ограничивать новые возможности. |
| WebKit/WebView/HTML-render | Главный источник неопределенности по CSS/JS/SVG. Не считать равным Chrome. |
| UT 11 / Retail / UNF / custom config | Определяет доступность РМК, формы, модулей, расширений, external processing и safe adapter. |

## CSS Research Notes

Нельзя считать, что CSS support соответствует современному Chrome. Требуется matrix spike.

| Feature | What is known | Recommendation |
|---|---|---|
| flex | Community-пример на платформе 8.3.23 использует `display:flex`; надо проверить на целевой версии. | Progressive enhancement, с fallback на block/table layout. |
| grid | Нет достаточного подтверждения для целевого 1С render. | needs spike, не использовать в baseline. |
| transitions | Вероятно возможны в WebKit-like runtime, но стабильность и performance неизвестны. | Легкие transitions только после spike. |
| transforms | Вероятно возможны частично; проверить touch pressed states. | Progressive enhancement. |
| shadows | Проверить `box-shadow` performance на терминале. | Progressive enhancement. |
| border-radius | Используется в community-примерах, низкий риск. | Safe baseline после smoke. |
| backdrop/filter effects | Дорогие и зависят от engine. | Not recommended. |
| CSS variables | Не подтверждать без spike. | Use static fallback values; variables only progressive. |
| media queries | Должны быть проверены в конкретном render и клиенте. | Baseline может использовать simple responsive breakpoints только после spike. |
| responsive layout | Требуется из-за терминального экрана, но надо держать simple fixed-stage contract. | Baseline: fixed landscape stage + controlled overflow. |

## SVG Research Notes

Yellow ERP reference по `HTMLDocumentField` отдельно предупреждает, что не рекомендуется использовать SVG markup language в HTML-document field. Это не означает полный запрет на любой SVG во всех современных версиях, но для кассового shell это сильный сигнал риска.

| SVG Feature | Recommendation |
|---|---|
| inline SVG icons | needs spike; держать PNG/icon font/text fallback. |
| external SVG sprite | not recommended for baseline; asset loading and symbol usage may break. |
| SVG animation | not recommended. |
| CSS animation of SVG | not recommended. |

Практический baseline: использовать CSS/HTML primitives, raster icons или static inline SVG только после проверки.

## JS Research Notes

| Feature | What is known | Recommendation |
|---|---|---|
| vanilla JS | supported in principle; exact ECMAScript level depends on platform. | Baseline. |
| modules | unknown. | Avoid in runtime HTML; bundle to one classic script. |
| async/promise | version-dependent. | Transpile or avoid in baseline. |
| fetch | unknown in embedded render and may be blocked by network/CORS. | Do not use for cashier truth; only optional asset/config after spike. |
| localStorage/sessionStorage | unknown in HTML field, URL/file/origin dependent. | Do not rely on for state of sale. |
| timers | likely supported, but throttle/visibility behavior unknown. | Use for UI only; not for sale truth. |
| DOM events | supported partially; event details vary. | Use simple click/tap/change events. |
| custom events | unknown. | Use only after spike; fallback to click/href/mailbox. |

Recommended JS baseline:

- no external runtime dependencies;
- no module loader;
- no CDN;
- one bundled script;
- state-driven render;
- escape all JSON safely;
- command queue with requestId;
- UI lock while 1C handles cashier command.

## Touch UX Research Notes

Touch behavior is not guaranteed by the fact that HTML renders.

Must test:

- tap latency and double tap behavior;
- scroll inertia and overscroll;
- focus handoff between 1C form and HTML input;
- virtual keyboard appearance and layout shift;
- large button hit areas;
- kiosk/fullscreen behavior;
- scanner input focus when hardware scanner emulates keyboard;
- recovery after payment modal/hardware dialogs.

Baseline UX:

- minimum 48dp/px-equivalent touch targets, but validate on actual terminal DPI;
- avoid small text inputs in buyer flow;
- prefer scan/catalog/payment buttons over keyboard;
- keep staff/help entry always reachable;
- no UI action should rely on hover.

## Visual Capability Tiers

### Safe Baseline

- semantic HTML;
- simple CSS block/flex layout after verification;
- fixed landscape stage with controlled scroll;
- large touch buttons;
- static images;
- static text/icons;
- vanilla JS;
- single state snapshot render;
- no business calculations in HTML.

### Progressive Enhancement

- CSS transitions under 150-250ms;
- transform-based pressed states;
- light shadows;
- border-radius;
- CSS variables with static fallback;
- static SVG icons if spike passes;
- idle promo image/video only if asset rendering is stable.

### Needs Spike

- CSS Grid;
- complex flex wrapping;
- CSS variables as primary theme mechanism;
- JS promises/async/fetch;
- localStorage/sessionStorage;
- custom events;
- inline SVG across all screens;
- virtual keyboard and inputs;
- fullscreen/kiosk lock;
- remote URL deployment.

### Not Recommended

- treating HTML render as Chrome;
- React/Vite runtime by default;
- untranspiled modern JS modules;
- CDN dependencies;
- service worker/PWA cache inside 1C shell;
- complex SVG animation;
- backdrop/filter-heavy UI;
- direct HTML calls to acquiring/KKT/scanner/fiscalization;
- direct HTML REST API to bypass РМК.

## Capability Matrix

Statuses:

- `supported`: supported by official docs or safe platform mechanism;
- `partially_supported`: plausible and used in practice, but version/client dependent;
- `unsupported`: contradicted by known platform limitation;
- `unknown_needs_spike`: must be verified;
- `not_applicable`: out of HTML-shell responsibility.

| Category | Status | Safe baseline | Progressive enhancement | Needs spike / risk |
|---|---|---|---|---|
| HTML rendering | supported | Static HTML shell | Rich layout | Version/client differences |
| CSS flex | partially_supported | Simple rows/columns after smoke | Product grids | Exact behavior/performance |
| CSS grid | unknown_needs_spike | Avoid | Optional only | Could fail in embedded engine |
| CSS transitions | unknown_needs_spike | Avoid or minimal | Screen slide/fade | Jank on terminal |
| CSS transforms | unknown_needs_spike | Avoid or simple press | Smooth panels | GPU/compositor unknown |
| CSS shadows | unknown_needs_spike | Minimal/no shadows | Depth tokens | Performance/readability |
| CSS variables | unknown_needs_spike | Static CSS fallback | Theme tokens | Engine support |
| SVG rendering | unknown_needs_spike | PNG/text fallback | Static icons | Reference docs warn against SVG |
| SVG animation | unknown_needs_spike | None; not recommended for baseline | None | High compatibility risk |
| JS events | partially_supported | click/change/input basics | custom event model | Event object differs |
| JS functions from 1C | partially_supported | `updateState` or DOM mailbox | Direct function call | API differs by engine |
| HTML events to 1C | partially_supported | click/href bridge | DOM event envelope | Reliable payload transfer |
| JSON exchange | supported | String JSON DTO | Full state envelope | Escaping/encoding discipline |
| external URL loading | supported | Dev/spike only | Managed hosted shell | TLS/network/cache |
| local asset loading | partially_supported | Packaged макет/assets | Local file bundle | path/security/origin |
| image loading | partially_supported | Local/static images | Idle promo media | formats/cache |
| fonts | unknown_needs_spike | System fonts | Local font files | load/CORS/render |
| touch | unknown_needs_spike | Large buttons | Gesture polish | OS/WebView/device |
| scroll | partially_supported | One controlled scroll area | inertial lists | focus/overscroll |
| focus | unknown_needs_spike | Avoid fragile focus | scanner/input focus routing | 1C vs HTML focus |
| input | unknown_needs_spike | Minimal input | on-screen search | IME/keyboard/scanner |
| idle screen | supported | State-driven idle | promo screen | media stability |
| fullscreen/kiosk behavior | partially_supported | 1C window/fullscreen outside HTML | locked kiosk | OS/client policy |
| offline/local shell | partially_supported | макет/single file | local bundle | asset path/versioning |
| interaction with RMK | unknown_needs_spike | Adapter stub | real commands | extension points |
| scanner via 1C | partially_supported | 1C/RMK owns scanner | scanner event to state | hardware setup |
| acquiring via 1C | partially_supported | 1C/RMK owns payment | payment status UI | API/driver/config |
| KKT via 1C | partially_supported | 1C/RMK owns fiscalization | receipt status UI | legal/hardware state |
| receipt status via 1C | unknown_needs_spike | poll/get state | push update | adapter access |

## Cannot Be Guaranteed Without Spike

Нельзя гарантировать заранее:

- что HTML-render целевой версии 1С поддерживает нужный уровень CSS как современный Chrome;
- что CSS Grid, CSS variables, SVG icons/animation и smooth transitions будут стабильны и быстры;
- что прямой вызов `window.FrontShell.updateState(state)` из 1С работает одинаково в толстом, тонком и web-клиенте;
- что HTML может надежно передавать большой JSON payload через событие поля HTML-документа;
- что touch, scroll, focus и виртуальная клавиатура будут вести себя как в Android Chrome;
- что hardware scanner input попадет в нужный HTML/1С focus path;
- что текущий чек РМК можно безопасно читать и менять из расширения или внешней обработки;
- что штатную оплату картой/СБП можно стартовать программно без стандартной формы РМК;
- что receipt/fiscalization status можно получить в buyer-safe state без гонок и ручного вмешательства;
- что local files/assets/fonts будут одинаково доступны на всех терминалах.

## Minimal Spike Plan

### Spike A: HTML Render Baseline

Run on actual cashier workplace:

- load HTML from string;
- load HTML from макет;
- load local image;
- load URL over HTTPS;
- verify body size, scroll, font rendering and 10-13 inch landscape layout;
- screenshot/render compare manually.

### Spike B: CSS/Visual

Test one page with:

- flex row/column;
- grid;
- border-radius;
- box-shadow;
- transform pressed button;
- transition slide;
- CSS variables with fallback;
- inline SVG icon;
- SVG animation sample;
- 50 product tiles for performance.

### Spike C: JS Runtime

Test:

- classic script execution;
- `JSON.stringify` / `JSON.parse`;
- timers;
- click/touch/input events;
- promise/async if planned;
- fetch only if remote assets/config are needed;
- localStorage/sessionStorage only for non-cashier UI preferences.

### Spike D: Bridge

Test both directions:

- HTML sends `ui.ready`;
- HTML sends `cart.addByBarcode` with JSON payload;
- 1C receives command and requestId;
- 1C calls `window.FrontShell.updateState(state)`;
- fallback DOM mailbox update works;
- double click produces one accepted command;
- invalid JSON returns error state;
- reload/reset restores state from 1C.

### Spike E: РМК Adapter

On test base and test terminal:

- start session;
- get current receipt/cart;
- add product by barcode;
- remove item/change quantity;
- handle marked/age/staff-required product;
- start card payment;
- get payment status;
- fiscalize/print receipt through standard 1C/RMK;
- get receipt final status;
- reset to idle without corrupting shift/session.

## Feasibility Verdict

FrontShell is possible only if all of these pass on the actual contour:

- HTML field renders the required UI stably;
- HTML -> 1C events work with reliable payload delivery;
- 1C -> HTML JS calls or DOM mailbox updates work;
- JSON state exchange is deterministic and safely escaped;
- there are safe 1C/RMK adapter points for cart, payment, receipt and hardware state;
- HTML remains a shell, while 1C/RMK remains the owner of cashier truth.

If the bridge works but CSS is weak, the product can still proceed with a conservative visual baseline. If the bridge or RMK adapter points do not work, the hypothesis fails for production and should not be compensated by moving cashier logic into HTML.
