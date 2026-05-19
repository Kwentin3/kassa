# PRD: 1C HTML Shell Diagnostic Harness

Дата: 2026-05-19
Статус: v0.2 refined PRD
Версия документа: v0.2
Область: диагностика runtime-среды для будущей 1C HTML FrontShell

## 1. Название

Рабочее название: **1C HTML Shell Diagnostic Harness**
Русское название: **Диагностическая страница 1C HTML Shell**

## 2. Контекст

Мы проектируем направление 1C HTML Shell / FrontShell для кассы самообслуживания. Гипотеза: использовать 1С / РМК как backend/runtime/controller, а HTML/JS/CSS внутри `Поле HTML-документа` как современную покупательскую HTML-оболочку.

Ключевой принцип остается неизменным:

```text
HTML не является источником кассовой истины.
Источник истины - 1С / РМК / текущий чек / кассовая логика / оборудование.
```

HTML только отображает состояние, принимает действия пользователя, отправляет intent-команды, получает state snapshot и перерисовывает экран.

1С / РМК владеет чеком, корзиной, ценами, скидками, маркировкой, сканером, эквайрингом, ККТ, фискализацией, печатью, кассовой сессией и финальным статусом продажи.

## 3. Проблема

У команды нет собственной 1С-среды и реального кассового рабочего места. Есть коллаборация с 1С-программистом, который может открыть URL внутри формы 1С через `Поле HTML-документа`.

Нужно понять, сможет ли конкретное рабочее место 1С:

- открыть внешний URL;
- стабильно отрисовать HTML/CSS/SVG;
- выполнить нужный минимум JavaScript;
- выдержать touch/scroll/focus/input сценарии;
- отдать нам фактический профиль среды запуска для архитектурного решения;
- при наличии 1С Diagnostic Loader проверить базовый диагностический обмен HTML <-> 1С.

Нельзя заранее считать HTML-render 1С современным Chrome. Официальная документация 1С подтверждает сам механизм HTML-документов, загрузку программно/через URL/из макета и события HTML-документа, но стандарт 1С отдельно требует самостоятельно обеспечить корректное отображение во всех клиентских приложениях и поддерживаемых браузерах. Значит, нужен не спор по документации, а диагностический стенд на реальном терминале.

## 4. Цель страницы

Дать URL, который можно открыть:

- в обычном браузере человека;
- внутри 1С через `Поле HTML-документа`.

Страница должна собрать профиль среды запуска конкретной среды и показать:

- что поддерживает HTML-render;
- какие CSS/JS/SVG/touch/scroll/focus/input возможности доступны;
- работает ли basic network/report;
- подключен ли диагностический обмен HTML <-> 1С;
- что не проверено;
- какие рекомендации применить к будущей FrontShell;
- какой JSON-контекст передать команде проекта.

## 5. Не-цели

Диагностическая страница не проверяет и не обещает готовность production-кассы.

Она не проверяет:

- РМК;
- текущий чек;
- добавление товара;
- удаление товара;
- оплату;
- эквайринг;
- ККТ;
- фискализацию;
- печать;
- маркировку;
- кассовые права;
- реальные процедуры конфигурации.

Эти проверки требуют отдельного 1С Diagnostic Loader / Bridge Probe / RMK Adapter spike.

## 6. Пользователи

| Пользователь | Задача |
|---|---|
| Команда проекта | Получить JSON-профиль среды запуска и принять архитектурное решение по baseline будущей покупательской HTML-оболочки. |
| 1С-программист | Открыть URL в `Поле HTML-документа`, при необходимости подключить минимальный Diagnostic Loader и вернуть отчет. |
| Клиент / технический специалист | Увидеть понятный визуальный отчет, легенду, ограничения и следующий шаг. |

## 7. Human-Facing Legend

На странице должна быть понятная человеку легенда:

- что это за инструмент;
- какую боль он решает;
- почему проверяется HTML внутри 1С;
- что такое FrontShell;
- почему HTML не является кассовым backend;
- что инструмент проверяет сам;
- что инструмент проверяет только с 1С Diagnostic Loader;
- что инструмент не проверяет;
- как читать статусы;
- что делать с JSON-отчетом;
- почему успешный HTML-render не означает готовность РМК, оплаты и ККТ.

### 7.1. Русскоязычный интерфейс

Весь текст, который видит человек на странице диагностики, должен быть на русском языке.

Текст должен быть понятным для:

- владельца бизнеса;
- технического специалиста клиента;
- 1С-программиста;
- человека, который не является web-разработчиком.

Избегать англицизмов, если есть понятная русская формулировка. Внутренние имена JSON-полей, технические имена файлов, route names и protocol names могут оставаться на английском.

Человеко-видимые формулировки:

| Внутренний/технический термин | Текст в интерфейсе |
|---|---|
| Runtime Profile | Профиль среды запуска |
| Safe Bootloader | Безопасный пошаговый запуск |
| Bridge | Обмен HTML <-> 1С / диагностический мост обмена |
| FrontShell / Frontend Shell | Покупательская HTML-оболочка |
| Backend collector | Сохранение отчета на сервере |
| Report | Отчет |
| Status | Статус |

Допустимые технические термины в интерфейсе: 1С, РМК, HTML, CSS, JavaScript, JSON, URL, API при необходимости, браузер, сервер, отчет, диагностика, профиль среды.

## 8. Основные сценарии

### Сценарий A: обычный браузер

Человек открывает `/diagnostics/1c-html-shell` в обычном браузере. Страница показывает описание инструмента, запускает диагностику браузера, отображает визуальный отчет и JSON. Обмен HTML <-> 1С и RMK Adapter отмечаются как `not_connected` / `not_tested`.

Визуальный отчет обязан прямо написать: "Этот отчет получен в обычном браузере. Он не доказывает, что страница так же работает внутри 1С."

### Сценарий B: 1С HTML field без loader

1С-программист открывает URL внутри `Поле HTML-документа`. Страница запускает безопасный пошаговый запуск, собирает профиль среды запуска HTML-render среды, показывает отчет, дает скопировать или скачать JSON. Проверки обмена HTML <-> 1С показывают `not_connected`.

Визуальный отчет обязан прямо написать: "Этот отчет получен внутри Поля HTML-документа 1С, но обмен HTML <-> 1С еще не подключен."

### Сценарий C: 1С Diagnostic Loader подключен

1С-программист подключает минимальный обработчик. Страница дополнительно проверяет диагностический обмен HTML -> 1С и 1С -> HTML: href/navigation, DOM mailbox, direct JS call, requestId echo, round-trip latency, payload size и duplicate command behavior.

Визуальный отчет обязан прямо написать: "Этот отчет получен внутри 1С с подключенным диагностическим обменом HTML <-> 1С."

### Сценарий D: нет отправки отчета

Если `fetch`, XHR или backend collector недоступны, страница все равно показывает JSON и дает manual copy/download fallback. Отчет не должен зависеть от сети после загрузки страницы.

### Сценарий E: сохраненный отчет

Если сохранение отчета на сервере реализовано, человек открывает `/diagnostics/1c-html-shell/report/{runId}` в обычном браузере и видит сохраненный профиль среды запуска, матрицу, рекомендации и JSON.

## 9. Безопасный пошаговый запуск

Страница должна запускаться как безопасный пошаговый запуск, а не как тяжелая SPA.

Фазы:

1. минимальный статический HTML;
2. самый простой classic JS bootstrap;
3. environment probe;
4. CSS capability probe;
5. visual/SVG/performance probe;
6. UX/touch/input probe;
7. network/report probe;
8. bridge probe;
9. RMK status as `not_tested`.

Правила:

- одна сломанная возможность не ломает всю диагностику;
- каждый тест имеет timeout;
- падение теста фиксируется как `failed` или `timeout`;
- если JS частично не работает, должен остаться статический текст;
- если clipboard/fetch не работает, остается ручной JSON copy/download fallback;
- частичный отчет доступен всегда после успешного JS bootstrap.

### 9.1. Single-file baseline для первой версии

Первая версия diagnostic runtime page должна иметь обязательный single-file вариант: один HTML-файл с inline CSS и inline classic JavaScript.

Причина: если 1С загрузит HTML, но не загрузит внешний CSS или JS, команда не должна гадать, где проблема: в HTML-render, путях, кэше, TLS, загрузке ресурсов или политике WebView.

Тест загрузки внешних CSS/JS должен быть отдельной диагностической проверкой, а не предпосылкой запуска самой диагностики.

Первый запуск 1С-программисту следует делать именно через single-file diagnostic URL.

## 10. Что страница проверяет сама

### Environment

- `userAgent`;
- viewport;
- screen size;
- `devicePixelRatio`;
- language;
- timezone;
- touch/pointer признаки;
- URL mode and referrer if available.

### CSS / Visual

- flex;
- grid;
- CSS variables;
- transitions;
- transforms;
- box-shadow;
- border-radius;
- media queries;
- overflow/scroll;
- fixed/sticky if needed;
- SVG render;
- SVG animation;
- 50-100 карточек как простой visual performance probe.

### JavaScript

- classic script;
- `JSON.stringify` / `JSON.parse`;
- timers;
- Promise;
- fetch;
- XMLHttpRequest;
- localStorage/sessionStorage;
- DOM events;
- clipboard if available.

### UX

- click;
- touch/pointer;
- focus;
- input;
- scroll;
- large buttons;
- double tap/click;
- визуальная производительность сетки.

### Network / Report

- fetch POST;
- XHR fallback;
- download JSON;
- manual copy fallback.
- загрузка внешнего CSS как отдельный тест;
- загрузка внешнего JS как отдельный тест.

## 11. Что проверяется только с 1С Diagnostic Loader

- HTML -> 1С через href/navigation;
- HTML -> 1С через DOM mailbox;
- 1С -> HTML через direct JS call;
- 1С -> HTML через DOM mailbox;
- requestId echo;
- round-trip latency;
- payload size;
- basic idempotency / duplicate command behavior;
- получение явно переданных 1С-программистом metadata: версия платформы, клиент, конфигурация, режим совместимости, терминал.

Диагностический протокол `diag.*` не является боевым протоколом будущей кассы. Он нужен только для проверки возможностей обмена HTML <-> 1С. Нельзя смешивать диагностические команды `diag.ready`, `diag.ping`, `diag.hrefTransport`, `diag.domMailbox` с production-командами `cart.addProduct`, `payment.startCard`, `receipt.getStatus` и т.д. Боевой протокол описывается отдельно в `1C_HTML_SHELL_BRIDGE_MANIFEST.md`.

## 12. Результат диагностики

Страница должна показать:

- визуальный отчет;
- матрицу возможностей;
- общий вердикт;
- предупреждения;
- рекомендации;
- полный JSON Report;
- `Copy JSON`;
- `Download JSON`;
- optional `Send Report`;
- optional `reportUrl`.

JSON report нужен как переносимый артефакт для команды проекта. Он должен быть читабельным, версионированным и безопасным для передачи.

Отчет должен сохранять:

- `diagnosticVersion` - версия формата диагностического отчета;
- `reportSchemaVersion` - версия схемы JSON-отчета;
- `testPackVersion` - версия набора тестов;
- `diagnosticBuildId` - идентификатор сборки диагностической страницы;
- `buildTimestamp` - дата/время сборки, если доступно;
- `pageUrl` - фактический URL запуска;
- `verdictScope` - область достоверности вердикта.

### 12.1. Ручные наблюдения

Автоматические тесты не заменяют живое наблюдение на терминале. Интерфейс должен содержать раздел "Ручные наблюдения".

Поля:

- страница визуально открылась корректно: да / нет / частично;
- были ли белый экран, зависание, мерцание, артефакты: свободный текст;
- прокрутка рукой работает: да / нет / частично / не проверялось;
- нажатия пальцем работают: да / нет / частично / не проверялось;
- поле ввода получает фокус: да / нет / частично / не проверялось;
- экранная клавиатура появляется: да / нет / частично / не проверялось;
- есть заметные задержки: да / нет / частично;
- сделан скриншот: да / нет;
- комментарий 1С-специалиста: текст;
- комментарий наблюдателя: текст.

JSON должен включать:

```json
{
  "manualObservations": {
    "visualOpenedCorrectly": "yes|no|partially",
    "blankScreenOrArtifacts": "string",
    "manualScroll": "yes|no|partially|not_tested",
    "manualTouch": "yes|no|partially|not_tested",
    "inputFocus": "yes|no|partially|not_tested",
    "virtualKeyboard": "yes|no|partially|not_tested",
    "visibleLag": "yes|no|partially",
    "screenshotTaken": "yes|no",
    "specialistComment": "string",
    "observerComment": "string"
  }
}
```

## 13. Статусы

Использовать единый набор статусов:

- `supported`;
- `partially_supported`;
- `failed`;
- `timeout`;
- `unknown`;
- `not_tested`;
- `not_applicable`;
- `not_connected`.

Интерпретация:

| Status | Meaning |
|---|---|
| `supported` | Проверка прошла в текущей среде. |
| `partially_supported` | Работает частично или с fallback/ограничениями. |
| `failed` | Проверка выполнена и завершилась ошибкой. |
| `timeout` | Проверка не дала результата за отведенное время. |
| `unknown` | Невозможно достоверно определить средствами страницы. |
| `not_tested` | Проверка не запускалась в этом режиме. |
| `not_applicable` | Возможность не относится к текущей среде/режиму. |
| `not_connected` | Нужен внешний loader/bridge/backend, но он не подключен. |

Человеко-видимый текст статусов:

| Internal status | Русский текст |
|---|---|
| `supported` | Поддерживается |
| `partially_supported` | Работает частично |
| `failed` | Проверка завершилась ошибкой |
| `timeout` | Нет ответа за отведенное время |
| `unknown` | Не удалось определить |
| `not_tested` | Не проверялось |
| `not_applicable` | Не относится к этому режиму |
| `not_connected` | Не подключено |

В интерфейсе нельзя использовать только цвет. Статус должен быть написан текстом.

## 14. Нефункциональные требования

Diagnostic runtime page должна быть максимально совместимой:

- vanilla HTML;
- vanilla CSS;
- vanilla JS;
- classic script;
- no CDN;
- no mandatory React/Vite runtime;
- no required ES modules;
- no service worker;
- no PWA install/update flow;
- no heavy SVG animation during boot;
- no `eval`;
- no sensitive data storage;
- no dependency on backend collector for local diagnosis.
- first implementation must support a single-file diagnostic HTML baseline.

Если основной сайт остается React/Vite, diagnostic runtime все равно должен иметь standalone legacy-safe bundle.

Загрузочный JavaScript не должен использовать как фундамент: Promise, async/await, fetch, performance.now, CSS.supports, const/let, arrow functions, optional chaining, class syntax, modules, eval, external libraries. Эти возможности можно тестировать после запуска, но нельзя делать их предпосылкой запуска.

Базовый загрузочный JavaScript: `var`, `function`, `try/catch`, `setTimeout`, `Date`, простые объекты и массивы, `document.getElementById`, безопасное `textContent` / ограниченное `innerHTML`, `onclick` fallback.

## 15. Privacy / Security

Не собирать:

- товары;
- чеки;
- суммы реальных покупок;
- персональные данные;
- фискальные данные;
- токены;
- пароли;
- данные карт;
- секреты;
- внутренние ссылки на объекты 1С.

Можно собирать:

- technical capabilities;
- `userAgent`;
- viewport;
- feature support;
- bridge test statuses;
- `runId`;
- `terminalLabel`, если введен вручную;
- версию платформы/конфигурации, если 1С-программист явно передал ее в init.

Серверное сохранение отчетов - optional vNext, не блокер первой реализации. Первая реализация считается успешной без серверного сохранения, если страница открылась, безопасный пошаговый запуск стартовал, локальный JSON сформирован, человек видит отчет, JSON можно скопировать вручную и скачать, если download поддерживается.

Если серверное сохранение включено, оно должно принимать только диагностический JSON, ограничивать payload size и не логировать потенциальные секреты.

Если отчеты сохраняются на сервере:

- `reportId` должен быть трудно угадываемым;
- желательно использовать accessToken или unguessable URL;
- нужен TTL хранения отчетов;
- нельзя хранить отчеты бессрочно без причины;
- нужна возможность удаления отчета;
- raw report не логировать полностью по умолчанию;
- поля, похожие на пароли, токены, cookie, номера карт и секреты, отбрасывать;
- явно писать: отчет содержит технические данные среды, а не кассовые данные.

## 16. Runtime Verdict

Страница должна выдавать общий verdict:

| Verdict | Meaning |
|---|---|
| `frontshell_baseline_possible` | Базовый HTML/JS/CSS render и report работают; можно проектировать conservative FrontShell baseline. |
| `frontshell_possible_with_fallbacks` | Основной render возможен, но нужны fallback по CSS/JS/SVG/network/bridge. |
| `needs_1c_bridge_loader` | HTML runtime проверен, но bridge не подключен; нельзя делать вывод о HTML <-> 1С. |
| `not_ready_for_frontshell` | Критичные HTML/JS/render возможности не прошли. |
| `rmk_not_evaluated` | РМК/оплата/ККТ не проверялись; это нормальный default для этой страницы. |

Verdict не должен говорить "касса готова". Максимум: "среда подходит/не подходит для следующего FrontShell spike".

### 16.1. Область достоверности вердикта

Отчет должен включать `verdictScope`.

Возможные значения:

| verdictScope | Meaning |
|---|---|
| `browser_only` | Диагностика выполнена только в обычном браузере. Нельзя делать вывод о 1С. |
| `one_c_html_field_unconnected` | Страница открыта внутри 1С, но диагностический обмен HTML <-> 1С не подключен. |
| `one_c_html_field_with_loader` | Страница открыта внутри 1С, и подключен минимальный 1С Diagnostic Loader. |
| `saved_report` | Пользователь смотрит ранее сохраненный отчет. |
| `unknown` | Среду определить нельзя. |

Обычный запуск в браузере никогда не должен интерпретироваться как пригодность 1С-среды.

### 16.2. Cache / Freshness

В отчете и в интерфейсе должен быть видимый `diagnosticBuildId`.

Diagnostic URL должен поддерживать query-параметры:

- `runId` - человеко-заданный идентификатор запуска;
- `terminalLabel` - безопасная метка терминала;
- `build` или `v` - версия/сборка диагностической страницы.

Пример:

```text
/diagnostics/1c-html-shell?runId=test-001&v=2026-05-19-01
```

При повторной проверке 1С-программисту нужно открывать URL с новым `runId`. Если no-cache headers пока не реализованы, страница должна показывать `diagnosticBuildId`, чтобы человек видел, какая версия диагностики запущена.

### 16.3. Guide для 1С-специалиста

Нужно подготовить короткую инструкцию для 1С-программиста: отдельный документ `1C_HTML_SHELL_DIAGNOSTIC_GUIDE_FOR_1C_SPECIALIST.md` или заметный блок на самой странице.

Инструкция должна объяснять:

- какой URL открыть;
- где открыть URL в 1С;
- какие query-параметры можно передать;
- что такое `runId`;
- что такое `terminalLabel`;
- что скопировать после теста;
- как скачать JSON;
- что значит "обмен HTML <-> 1С не подключен";
- что нужно сделать для проверки диагностического обмена;
- чего нельзя отправлять в отчете;
- почему этот тест не проверяет РМК, оплату и ККТ.

## 17. Критерии успеха

PRD считается выполненным, если страница как продукт отвечает:

- зачем нужна диагностика;
- для кого она;
- какую боль решает;
- какие сценарии закрывает;
- какие границы у диагностики;
- почему нужен safe boot;
- какой результат видит человек;
- какой JSON получает команда;
- какие вещи остаются за пределами страницы.

Acceptance на уровне продукта:

- человек может открыть URL и понять смысл инструмента без объяснений разработчика;
- 1С-программист понимает, как открыть URL и что вернуть команде;
- команда получает Runtime Profile JSON;
- отчет не создает ложного ощущения готовности production-кассы;
- результат прямо показывает `not_connected` / `not_tested` там, где нужен loader или RMK Adapter spike.
- первая реализация не требует серверного сохранения отчетов;
- single-file diagnostic URL является обязательным baseline первой версии.

## 18. Найденные пробелы в текущем пакете

Текущие документы хорошо фиксируют FrontShell feasibility, bridge manifest и RMK adapter boundary, но для диагностической страницы не хватает:

- отдельной продуктовой цели Diagnostic Harness;
- Runtime Profile JSON schema;
- safe boot phase model;
- browser-vs-1C-vs-report viewing modes;
- diagnostic statuses `failed`, `timeout`, `not_connected`;
- bridge diagnostic contract, отделенного от боевого `1C_HTML_SHELL_BRIDGE`;
- privacy/security правил для диагностического JSON;
- human-facing legend требований;
- backend collector как optional, а не обязательный путь;
- явного default `RMK adapter = not_tested`.
- single-file bootstrap baseline;
- `verdictScope`;
- версии схемы отчета и набора тестов;
- ручных наблюдений человека;
- anti-cache / freshness стратегии;
- короткой инструкции для 1С-специалиста;
- политики доступа и хранения сохраненных отчетов.

Это не блокеры прежних документов, а новая область, которую закрывает текущий PRD и следующий Blueprint.

## 19. Summary v0.2

Готово к реализации:

- single-file diagnostic page как первый baseline;
- русскоязычная человеко-понятная легенда;
- безопасный пошаговый запуск;
- локальный JSON-отчет;
- ручное копирование JSON;
- скачивание JSON, если поддерживается;
- `verdictScope`;
- `manualObservations`;
- явные `not_connected` для обмена HTML <-> 1С и `not_tested` для RMK Adapter.

Не является блокером первой версии:

- серверное сохранение отчетов;
- reportUrl;
- просмотр сохраненных отчетов;
- 1С Diagnostic Loader;
- RMK Adapter spike.

Первый implementation slice: single-file diagnostic HTML без React/Vite runtime внутри страницы, с русской легендой, фазами 0-6, визуальным отчетом, JSON, Copy JSON, manual copy fallback, Download JSON при поддержке, `bridge = not_connected`, `rmkAdapter = not_tested`.

## 19.1. Фактическая реализация Slice 1

Реализованный static artifact:

```text
public/diagnostics/1c-html-shell/index.html
```

Публичный route после сборки:

```text
/diagnostics/1c-html-shell
```

Фактический Slice 1 соответствует PRD:

- single-file HTML с inline CSS и inline classic JavaScript;
- русскоязычная легенда;
- безопасный пошаговый запуск;
- фазы 0-6;
- визуальный отчет;
- JSON-отчет;
- Copy JSON;
- ручное копирование через textarea;
- Download JSON при поддержке Blob/download;
- `bridge.status = not_connected`;
- `rmkAdapter.status = not_tested`;
- `verdictScope`;
- `manualObservations`;
- `diagnosticBuildId`, `reportSchemaVersion`, `testPackVersion`, `runId`, `pageUrl`;
- инструкция для 1С-специалиста на странице и отдельный guide.

Отдельная инструкция:

```text
docs/integrations/1c-html-shell/1C_HTML_SHELL_DIAGNOSTIC_GUIDE_FOR_1C_SPECIALIST.md
```

Не реализовано в Slice 1 намеренно: backend collector, saved report page, 1С Diagnostic Loader, RMK Adapter, production bridge, оплата, ККТ, фискализация, работа с чеком и маркировка.

## 20. Changelog v0.2

Что изменено:

- усилен русский человеко-понятный интерфейс и словарь терминов;
- single-file HTML с inline CSS/JS зафиксирован как обязательный baseline первой версии;
- добавлен `verdictScope` и человеко-видимые предупреждения по области достоверности отчета;
- добавлены версии `diagnosticVersion`, `reportSchemaVersion`, `testPackVersion`, `diagnosticBuildId`, `buildTimestamp`;
- добавлены anti-cache/freshness требования;
- добавлено требование guide для 1С-специалиста;
- добавлен блок `manualObservations`;
- backend collector переведен в strict optional vNext;
- добавлена политика доступа и хранения сохраненных отчетов;
- диагностический протокол `diag.*` явно отделен от боевого bridge;
- добавлен mapping внутренних статусов на русский текст.

Почему изменено:

- чтобы первый диагностический срез был проще, безопаснее и не зависел от внешних ресурсов;
- чтобы клиент и 1С-специалист понимали отчет без web-разработчика;
- чтобы старые и новые отчеты можно было корректно сравнивать;
- чтобы браузерный запуск не путался с проверкой внутри 1С;
- чтобы диагностика не создавала ложного ощущения готовности кассы.

Optional / vNext:

- серверное сохранение отчетов;
- saved report page;
- reportUrl;
- TTL/delete policy implementation;
- сравнение нескольких отчетов;
- минимальный 1С Diagnostic Loader;
- RMK Adapter spike.

## 21. Sources

- 1С, HTML-документы: https://v8.1c.ru/platforma/html-dokumenty/
- 1С, JSON: https://v8.1c.ru/platforma/json/
- Стандарт 1С по ограничению HTML-поля: https://v8std.ru/std/730/
- Yellow ERP reference, `HTMLDocumentField`: https://yellow-erp.com/help/sh/objects/catalog56/catalog86/HTMLDocumentField.html/
- Habr, практическое использование поля HTML-документа и события `ПриНажатии`: https://habr.com/ru/companies/lad_/articles/813177/
