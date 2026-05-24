# Runtime Capability Contract: 1C HTML Shell / V8WebKit

Дата: 2026-05-24
Статус: refined runtime capability contract after diagnostic build `1c-html-shell-diagnostic-showcase-2026-05-24-03`
Область: браузерные возможности HTML-оболочки внутри 1С / V8WebKit

## 0. Источник фактов и границы достоверности

Этот документ фиксирует не общие предположения о браузере 1С, а фактически наблюдаемый runtime-профиль из диагностического отчёта.

Источник последнего уточнения:

- автор наблюдения: Андрей Тарлыч;
- `diagnosticVersion`: `0.1`;
- `reportSchemaVersion`: `0.2`;
- `testPackVersion`: `0.3`;
- `diagnosticBuildId`: `1c-html-shell-diagnostic-showcase-2026-05-24-03`;
- `runId`: `diag-1779632187733-747199`;
- timestamp запуска: `2026-05-24T14:16:27.733Z`;
- pageUrl: `https://kassa.speechbattle.com/diagnostics/1c-html-shell`;
- mode: `browser_only`;
- verdictScope: `browser_only`.

Важное ограничение: этот прогон подтверждает только браузерный/rendering-профиль. Он не подтверждает готовность обмена HTML ↔ 1С, РМК, оплату, ККТ, фискализацию, маркировку или готовность кассы как продукта.

Bridge в этом прогоне имеет статус `not_connected`: `Slice 2 Diagnostic Loader не подключён`.

RMK Adapter имеет статус `not_tested`: `РМК проверяется только отдельным adapter spike`.

Raw JSON-отчёт пока не хранится рядом с этим контрактом как отдельный fixture. Если команда решит сохранять исходники прогонов, класть их в `docs/integrations/1c-html-shell/runtime-profiles/` или в соседний `fixtures/diagnostic-runs/`, а в этом документе оставлять только нормализованный вывод.

## 1. Назначение

Это контракт возможностей HTML-рендера 1С для будущих агентов и разработчиков. Он отвечает на практический вопрос: какие браузерные возможности можно закладывать в покупательскую HTML-оболочку после фактического запуска в среде с user agent `V8WebKit`.

Документ не является PRD кассы, не является контрактом РМК и не переносит кассовую бизнес-логику в HTML.

Архитектурная граница остаётся прежней:

- HTML — визуальная оболочка и слой пользовательского взаимодействия;
- 1С / РМК — владелец состояния чека, оборудования, оплаты, ККТ, фискализации и маркировки;
- bridge HTML ↔ 1С — отдельный слой, подтверждаемый отдельным диагностическим loader/spike;
- RMK Adapter — отдельный spike и отдельная зона доказательств.

## 2. Наблюдаемый профиль среды

Фактический профиль последнего прогона:

- userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/605.1 (KHTML, like Gecko) V8WebKit`;
- ОС по userAgent: Windows 10 x64;
- language: `ru-RU`;
- timezone: `Europe/Moscow`;
- viewport: `1628 x 823`;
- screen: `1920 x 1080`;
- `devicePixelRatio = 1`;
- `ontouchstart = false`;
- `maxTouchPoints = 0`;
- `PointerEvent = false`.

Следствие: этот прогон похож на настольный V8WebKit-профиль, а не на доказанный touch-терминал. Touch-first UX можно проектировать, но касания, pointer events, физический терминал и системная экранная клавиатура должны подтверждаться отдельным ручным прогоном.

## 3. Итоговый вердикт

Короткий практический вывод:

- лёгкая HTML/CSS-оболочка жизнеспособна;
- canonical delivery для 1С — самодостаточный HTML, inline CSS и classic JavaScript;
- современный untranspiled web bundle нельзя считать безопасным;
- `fetch` отсутствует, использовать XHR;
- Clipboard API отсутствует, оставлять manual copy fallback;
- `?.` и `??` не парсятся, в 1С-артефакте их быть не должно;
- React/Vite runtime нельзя запускать внутри HTML-поля 1С как есть;
- React/Vite допустим как dev/source layer только если экспорт даёт legacy-safe single-file classic script без обязательного `fetch`, ES2020-синтаксиса и внешних runtime-зависимостей;
- bridge HTML ↔ 1С пока не доказан;
- RMK Adapter пока не доказан;
- ручные UX-действия в этом прогоне не завершены и требуют отдельного теста на целевом терминале.

## 4. Baseline: можно использовать

Допустим лёгкий самодостаточный HTML runtime, доставляемый по URL или позже встраиваемый как макет 1С.

Single-file HTML — это формат runtime-артефакта, а не обязательный способ доставки. Он может доставляться:

- по URL;
- как скачанный HTML-файл;
- как HTML-макет внутри 1С;
- как часть будущего экспортного пакета.

Ключевое требование: первичный запуск не должен зависеть от отдельных внешних CSS/JS-файлов.

Подтверждённый baseline boot/runtime:

- статический HTML;
- classic script;
- создание harness-объекта в `window`;
- `try/catch`;
- базовая запись в DOM;
- `Date`;
- простые строки, массивы и объекты;
- `window` / DOM API базового уровня.

Подтверждённый JavaScript baseline:

- `const` / `let`;
- arrow functions;
- template literals;
- `class`;
- spread/rest syntax;
- `async/await`;
- `Promise`;
- `Symbol`;
- `Object.assign`;
- `MutationObserver`;
- `URL`;
- `URLSearchParams`.

Важно: наличие этих возможностей не разрешает автоматически использовать современный production bundle без транспиляции. В финальном 1С-артефакте запрещены уже выявленные несовместимые конструкции `?.` и `??`.

Подтверждённый HTML/CSS baseline:

- inline CSS;
- flex;
- CSS Grid;
- CSS variables;
- transitions;
- transforms;
- `box-shadow`;
- `border-radius`;
- media queries;
- `overflow` / scroll container;
- `position: fixed`;
- inline SVG;
- простая SVG animation;
- простая CSS animation.

Подтверждённый отчётно-сетевой baseline:

- `XMLHttpRequest`;
- `Blob`;
- ручное копирование JSON-отчёта.

Подтверждённый визуальный baseline:

- крупная кнопка отрисовалась геометрически корректно: примерно `197 x 46`;
- синтетическая отрисовка 50 карточек прошла быстро;
- синтетическая отрисовка 100 карточек прошла быстро.

Для touch-first витрины можно использовать базовый lift/press отклик активных элементов: мягкая тень в обычном состоянии, короткий `transform` при нажатии, уменьшенная тень в pressed-state. Это допустимо как baseline, потому что `box-shadow`, transitions и transforms подтверждены.

## 5. Можно использовать осторожно

Эти возможности допустимы, но не должны быть единственным способом работы критичного экрана:

- CSS Grid: поддержался, но для критичных layout-зон нужен простой fallback или проверенный layout без хрупких зависимостей.
- CSS variables: поддержались, но критичные брендовые значения лучше уметь собрать в статический CSS при 1С-экспорте.
- SVG и SVG animation: использовать как улучшение, не как обязательную обратную связь.
- CSS animations/transitions: только короткие, дешёвые, без тяжёлых эффектов.
- Pressed-state: использовать коротко и дёшево; он не должен менять layout, размеры карточек или scroll-зоны.
- Shadows и rounded cards: допустимы, но не перегружать экран.
- Карточные сетки: 50/100 карточек отрисовались в синтетическом тесте, но реальные карточки с изображениями, ценниками, длинными названиями и брендовыми стилями проверять отдельно.
- Загрузка CSS/JS из `data:`-ресурса: подтверждает только встроенный resource path, не внешние файлы по URL, TLS, cache policy или загрузку отдельных bundle-файлов.
- ES module script из `data:`-ресурса в этом прогоне выполнился, но module-based delivery не становится canonical для 1С. Базовая стратегия остаётся classic script.
- `async/await`: допустим только если финальный bundle гарантированно совместим с целевым V8WebKit и не тащит неподдержанные конструкции.
- `dynamic import`: parse-проба прошла, но использовать dynamic import как runtime-механику оболочки нельзя без отдельного доказательства загрузки модулей.
- `position: fixed`: подтверждён, но применять аккуратно, особенно в полноэкранной кассовой разметке.
- Anchor download: статус unknown; всегда оставлять ручное копирование.

## 6. Не использовать как обязательную зависимость

Не делать фундаментом будущей оболочки:

- `fetch`;
- Clipboard API / `navigator.clipboard`;
- optional chaining `?.`;
- nullish coalescing `??`;
- untranspiled ES2020+ JavaScript;
- React/Vite runtime внутри HTML-поля 1С как есть;
- Vite bundle, если он требует `fetch`, module runtime или современный синтаксис, не подтверждённый V8WebKit;
- `position: sticky`;
- touch events;
- pointer events;
- hover-only визуальный отклик;
- CDN;
- внешние CSS/JS bundles без отдельной проверки загрузки в 1С;
- service worker;
- PWA;
- complex SVG animation;
- `backdrop-filter` и filter-heavy effects;
- системную экранную клавиатуру;
- автоматическое скачивание отчёта через anchor download как единственный путь.

### 6.1 Практические визуальные следствия для BOLARS MVP

Для покупательской витрины `/bolars/self-checkout-mvp-1c.html` этот runtime contract означает:

- 1C HTML field считать host container, а не обычным desktop browser viewport.
- Не наследовать centered desktop/tablet stage max-width, если host container шире stage и появляются белые поля.
- Не строить critical CTA/help/summary на `position: sticky`; использовать явную grid/flex-зону или другой проверенный layout.
- Не полагаться на `100dvh` как единственную высоту screen/body; нужен fallback через host/container height и `100vh`.
- CSS Grid допустим, но cart/payment critical zones должны иметь простой, проверенный layout без хрупких fixed columns.
- Heavy shadows, glow, gradients и `color-mix` считать enhancement; в 1C profile должны быть статические цвета, border и лёгкая elevation.
- Debug overlay не должен быть частью customer acceptance и не должен перекрывать critical zones.

## 7. UX-статусы последнего прогона

В последнем JSON-отчёте ручные UX-проверки не закрыты:

- `ux.click_manual`: `unknown`, ожидается действие пользователя;
- `ux.double_click_manual`: `unknown`, ожидается действие пользователя;
- `ux.focus_input`: `unknown`, ожидается действие пользователя;
- `ux.input_change`: `unknown`, ожидается действие пользователя;
- `ux.scroll_container`: `unknown`, ожидается действие пользователя.

Также зафиксировано:

- `ux.pointer_events`: `not_applicable`, значение `false`;
- `ux.touch_events`: `not_applicable`, значение `false`;
- `ux.large_button`: `supported`, размер около `197 x 46`.

Ручное наблюдение `visibleLag = partially` не является достаточным измерением производительности. Для продуктового вывода нужен отдельный ручной сценарий на целевом терминале с видео/скриншотами и фиксированными действиями.

## 8. Экранная клавиатура

Системная экранная клавиатура терминала не является обязательной зависимостью.

Допустимый подход:

- сделать собственную лёгкую HTML-клавиатуру внутри оболочки;
- использовать обычные HTML-кнопки;
- основной обработчик — `click`;
- ввод вести в управляемый JS-buffer;
- не зависеть от touch events;
- не зависеть от OS virtual keyboard;
- не использовать CDN;
- не использовать тяжёлую библиотеку без проверки;
- если нужна библиотека, она должна быть bundled/local/single-file compatible;
- для первого варианта предпочтительнее custom lightweight keyboard, а не внешняя библиотека.

## 9. Сетевой и отчётный контракт

Каноничные правила:

- для отправки отчётов использовать XHR fallback;
- `fetch` не использовать в 1С/V8WebKit runtime как обязательный API;
- Clipboard API не использовать как обязательный API;
- Blob можно использовать, но скачивание через ссылку не считать подтверждённым;
- manual copy JSON должен оставаться доступным всегда;
- автоматическая отправка отчёта не должна блокировать ручное получение отчёта.

## 10. Bridge и RMK: что не доказано

Не подтверждено:

- HTML → 1С;
- 1С → HTML;
- `diag.ping`;
- href/navigation transport;
- DOM mailbox;
- direct JS call;
- requestId echo;
- round-trip latency;
- payload size;
- RMK Adapter;
- получение текущего чека;
- добавление товара;
- изменение количества;
- применение скидки/карты лояльности;
- оплата;
- ККТ;
- фискализация;
- маркированная продукция / Честный Знак.

Эти зоны не должны выводиться из браузерного профиля. Для них нужны отдельные acceptance gates.

## 11. Acceptance gates для следующих этапов

### Gate A. Browser-only runtime

Цель: подтвердить, что оболочка открывается и визуально работает в V8WebKit.

Минимум:

- статический HTML виден;
- classic JS выполняется;
- DOM обновляется;
- базовая разметка не ломается;
- нет белого экрана;
- нет обязательной зависимости от `fetch`, Clipboard API, `?.`, `??` и external bundles.

Текущий статус: в основном подтверждено, но с запретом на неподдержанные API/синтаксис.

### Gate B. Manual UX on target terminal

Цель: подтвердить реальный покупательский ввод.

Минимум:

- click;
- повторное нажатие / double click, если сценарий его использует;
- фокус input;
- изменение input;
- прокрутка контейнера;
- работа собственной экранной клавиатуры;
- отсутствие критичного лага;
- скриншот или видеофиксация.

Текущий статус: не закрыто.

### Gate C. 1C Diagnostic Loader / Bridge

Цель: доказать обмен HTML ↔ 1С.

Минимум:

- 1С открывает диагностическую страницу в Поле HTML-документа;
- 1С может передать JSON/state в HTML только нативным прямым механизмом;
- HTML может передать событие/команду в 1С через согласованный bridge;
- есть requestId echo;
- есть latency/payload observations;
- нет ручной загрузки JSON пользователем.

Текущий статус: не закрыто.

### Gate D. RMK Adapter spike

Цель: доказать, что 1С/РМК остаётся владельцем бизнес-логики, а HTML является оболочкой.

Минимум:

- чтение текущего состояния чека;
- добавление товара;
- изменение количества;
- удаление позиции;
- применение скидки/карты лояльности;
- переход к оплате;
- обработка ошибок РМК;
- запрет на перенос фискальной логики в HTML.

Текущий статус: не закрыто.

## 12. Запрещённые архитектурные выводы

Нельзя делать выводы:

- этот профиль не доказывает готовность кассы;
- этот профиль не доказывает доступность РМК;
- этот профиль не разрешает переносить кассовую логику в HTML;
- HTML не должен управлять оплатой, ККТ, чеком, фискализацией или маркировкой;
- HTML остаётся только оболочкой;
- источник истины остаётся 1С / РМК;
- `browser_only`-прогон не заменяет 1С Diagnostic Loader;
- синтетическая скорость отрисовки карточек не заменяет тест реальной витрины с изображениями и touch-вводом.

## 13. Правила для будущего агента

Агент обязан:

- читать этот документ перед проектированием HTML-оболочки;
- использовать classic JavaScript в финальном 1С-артефакте;
- исключать `?.` и `??` из 1С-артефакта;
- использовать XHR вместо `fetch`;
- оставлять manual copy fallback;
- не делать Clipboard API обязательным;
- не строить интерфейс на `sticky`;
- не полагаться на touch/pointer events до отдельной проверки;
- использовать `:active`/click-compatible pressed feedback для активных элементов и не делать hover обязательным;
- проектировать экранную клавиатуру как собственный HTML-компонент, если она нужна;
- считать SVG/animation улучшением, а не фундаментом;
- отделять visual shell от bridge;
- не проектировать обмен HTML ↔ 1С как подтверждённый до Slice 2 Diagnostic Loader;
- не проектировать кассовые операции как подтверждённые до RMK Adapter spike;
- если используется React/Vite как исходный frontend, обязательно проверять итоговый 1С export: single-file, inline CSS, classic script, no external bundle, no required `fetch`, no `?.`, no `??`.

## 14. Связь с PRD/Blueprint

Этот contract должен быть связан из:

- `PRD_1C_HTML_SHELL_DIAGNOSTIC_HARNESS.md`;
- `BLUEPRINT_1C_HTML_SHELL_DIAGNOSTIC_HARNESS.md`;
- `PRD_1C_HTML_SHELL_SELF_CHECKOUT_SHOWCASE.md`;
- `BLUEPRINT_1C_HTML_SHELL_SELF_CHECKOUT_SHOWCASE.md`;
- документов по BOLARS 1C handoff;
- будущих документов по HTML Shell.

Новые документы по HTML Shell должны ссылаться на этот файл в разделе runtime constraints.
