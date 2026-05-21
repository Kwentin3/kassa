# 1C To HTML Direct Catalog Delivery Research

Дата: 2026-05-21
Статус: research draft для spike с 1С-программистом; HTML runtime API первого среза реализован, проверка в реальной 1С ещё нужна

## Executive Summary

Рекомендуемый основной путь для передачи каталога:

```text
1С -> direct JS call -> window.Showcase.receiveCatalog(catalogJson)
```

1С остается владельцем каталога: собирает безопасный JSON по контракту `1C_SHOWCASE_CATALOG_DATA_CONTRACT.md` и передает его в уже загруженную HTML-витрину. HTML не ходит в базу 1С, не ходит в OData и не становится владельцем кассовых данных.

Fallback:

```text
1С -> DOM mailbox -> HTML polling/read -> receiveCatalog()
```

Last-resort native fallback:

```text
1С -> HTML/string/maket with embedded catalog -> Поле HTML-документа
```

Запрещено:

```text
human-operated JSON upload/paste/import UI
```

Не основной путь:

```text
HTML -> HTTP/OData -> 1С
```

Причина: direct JS call лучше соответствует текущей архитектуре `1С owns data, HTML renders safe DTO`. Но работоспособность прямого вызова нельзя обещать для всех версий 1С, клиентов и режимов совместимости. Официальная документация подтверждает HTML-поле, загрузку из URL/строки/макета, DOM-доступ и события HTML-документа. Конкретный вызов `window.Showcase.receiveCatalog(...)` через `defaultView` подтверждается практическими материалами и должен быть проверен spike-ом на целевой платформе.

## Non-negotiable Rule

Каталог в runtime передается только нативно из 1С в HTML.
Пользователь не загружает и не вставляет JSON вручную.

## Source Reliability

Уровни уверенности:

- `official`: документация 1С / 1Ci / стандарт 1С;
- `community`: практическая статья или справочник сообщества;
- `inference`: вывод для нашей архитектуры, требует spike.

Источники:

| Источник | Уровень | Что подтверждает |
|---|---|---|
| 1С, HTML-документы: https://v8.1c.ru/platforma/html-dokumenty/ | official | `Поле HTML-документа`, программное формирование, загрузка по URL, загрузка из макета, DOM-модель, события HTML-документа |
| 1Ci Developer Guide 8.3.23, HTML document fields: https://kb.1ci.com/1C_Enterprise_Platform/Guides/Developer_Guides/1C_Enterprise_8.3.23_Developer_Guide/Chapter_7._Forms/7.7._Form_items/7.7.4._Field/ | official | значение поля может быть URL или HTML text; WebKit с 8.3.14; `HTMLDocumentField.Document`; ограничения HTML, `parentWindow` не поддерживается, X-Frame-Options risk |
| 1С, JSON: https://v8.1c.ru/platforma/json/ | official | JSON как формат обмена, чтение/запись JSON, сериализация примитивов/коллекций |
| Стандарт 1С #730: https://v8std.ru/std/730/ | official mirror / standard | HTML-поле не использовать вместо штатных элементов без причины; разработчик сам отвечает за корректное отображение во всех клиентах/браузерах |
| Yellow ERP `HTMLDocumentField`: https://yellow-erp.com/help/sh/objects/catalog56/catalog86/HTMLDocumentField.html/?lang=ru | community/reference | свойства `Документ`, методы `Перейти`, `УстановитьТекст`, событие `ДокументСформирован`; также предупреждения про `parentWindow` и SVG |
| Infostart, mobile HTML/defaultView: https://infostart.ru/1c/articles/1353200/ | community / needs spike | `defaultView` как аналог `window`, доступен после `ДокументСформирован`, прямой вызов JS, параметры/результат лучше держать примитивами |
| Infostart, JavaScript и 1С: https://infostart.ru/1c/tools/398366/ | community / needs spike | практический паттерн `parentWindow` для IE и `defaultView` для других браузеров |
| Existing local guide: `docs/integrations/1c-html-shell/1C_HTML_SHELL_DIAGNOSTIC_GUIDE_FOR_1C_SPECIALIST.md` | project evidence | текущая стратегия Slice 2: проверить `diag.*`, direct JS call, DOM mailbox и payload limits на целевой 1С |

Ограничение: community-источники не доказывают универсальную работоспособность на всех версиях 1С. Они дают рабочие гипотезы для spike.

## Current Target

Целевой сценарий:

```text
1. 1С открывает:
   https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=showcase

2. HTML-витрина загружается и объявляет:
   window.Showcase.receiveCatalog(catalogJson)

3. 1С собирает безопасный JSON каталога.

4. 1С вызывает JS-функцию внутри HTML:
   window.Showcase.receiveCatalog(catalogJson)

5. HTML валидирует JSON, заменяет группы/товары, очищает demo-корзину и перерисовывает витрину.
```

Что не меняется:

- РМК не подключается;
- чек не подключается;
- оплата не подключается;
- ККТ не подключается;
- фискализация и маркировка не подключаются;
- HTML не делает прямые запросы в базу 1С;
- HTML не хранит кассовую истину.

## 1. Можно ли из 1С нативно вызвать JavaScript-функцию внутри Поля HTML-документа?

Короткий ответ: вероятно да для целевого WebKit-like runtime, но только после проверки на конкретной версии 1С и типе клиента.

Что подтверждено официально:

- у формы есть `Поле HTML-документа`;
- HTML можно загрузить программно, по URL или из макета;
- платформа дает DOM-доступ через объект HTML-документа;
- доступны события HTML-документа;
- при работе через `HTMLDocumentField.Document` нужно использовать DOM-свойства и методы, доступные в поддерживаемых браузерах 1С;
- `parentWindow` не должен быть baseline, потому что в официальной документации для современных HTML fields он указан как unsupported.

Что подтверждено практикой community:

- после `ДокументСформирован` можно получить window-like контекст через `Документ.defaultView`;
- в legacy IE-режимах использовали `Документ.parentWindow`, но для нашего baseline это только legacy fallback;
- через window-like объект можно вызвать JS-функцию;
- для параметров и результата надежнее использовать примитивы: строка, число, boolean.

Практический целевой вызов:

```text
ОкноHTML = Элементы.HTMLДокумент.Документ.defaultView
Результат = ОкноHTML.Showcase.receiveCatalog(JSONСтрокаКаталога)
```

Это псевдокод. Реальные имена формы, элемента и доступные свойства должен проверить 1С-программист в целевой базе.

### Как получить объект HTML-документа

Ожидаемый путь:

```text
Элементы.<ИмяПоляHTML>.Документ
```

Где `<ИмяПоляHTML>` - элемент формы с видом `Поле HTML-документа`.

Для URL-страницы `Документ` должен быть доступен после завершения загрузки/формирования документа. Если он `Неопределено`, нужно дождаться события готовности.

### Как получить window / JS-контекст

Предпочтительная гипотеза для WebKit:

```text
Документ.defaultView
```

Legacy fallback только для старых IE-like контуров:

```text
Документ.parentWindow
```

`parentWindow` нельзя закладывать как основной путь, потому что официальная документация предупреждает, что это свойство не поддерживается в современном HTML document field baseline.

### Как вызвать функцию JS

Предпочтительно не строить строку JavaScript, а вызвать метод объекта напрямую:

```text
ОкноHTML.Showcase.receiveCatalog(JSONСтрокаКаталога)
```

Если конкретная версия 1С не позволяет вызвать метод объекта напрямую, fallback:

- вызвать заранее объявленную wrapper-функцию, которая принимает строку;
- записать строку в DOM mailbox;
- перезагрузить HTML с embedded catalog.

Не использовать `eval` как обязательный путь.

### Как передать строку JSON

Лучший первый вариант:

```text
Передавать JSON как обычную строку-параметр метода.
HTML внутри receiveCatalog делает JSON.parse(), если получил строку.
```

Так 1С не должна вручную экранировать кавычки внутри JS-кода. Экранирование остается задачей вызова метода/COM/DOM bridge.

Если приходится формировать JS-код строкой, JSON нужно вложить как JS string literal, а не склеивать руками:

```js
window.Showcase.receiveCatalog("<escaped-json-string>")
```

Но этот путь более рискованный. Для него нужно отдельное escaping helper на стороне 1С.

### Можно ли получить результат выполнения функции

Вероятно можно получить примитивный результат, но сложный JS object не считать надежным API.

Для первого среза безопаснее:

- `receiveCatalog()` возвращает result object для обычного браузерного debug;
- дополнительно пишет результат в `window.Showcase.lastCatalogResult`;
- дополнительно пишет JSON-строку в `window.Showcase.lastCatalogResultJson`;
- `getCatalogStatus()` или `getCatalogStatusJson()` возвращает простой результат, который 1С может прочитать после вызова.

Если return value из direct JS call в конкретной 1С не доступен, 1С читает результат отдельным вызовом или через DOM mailbox.

### Как понять, что функция уже существует

Нужны два уровня готовности:

1. `ДокументСформирован` / `DocumentComplete` на стороне 1С.
2. Runtime-ready flag на стороне HTML:

```js
window.Showcase && window.Showcase.ready === true
```

Лучше добавить в HTML ранний stub:

```js
window.Showcase = window.Showcase || {
  apiVersion: "0.1",
  ready: false,
  pendingCatalog: null,
  lastCatalogResult: null,
  receiveCatalog: function (catalogJson) {
    this.pendingCatalog = catalogJson;
    this.lastCatalogResult = { ok: false, pending: true, reason: "showcase-not-ready" };
    return this.lastCatalogResult;
  }
};
```

После инициализации витрина ставит `ready=true` и применяет `pendingCatalog`, если он был передан слишком рано.

## 2. Работает ли прямой вызов JS, если HTML загружен по URL?

Официально HTML document field может получать значение как URL или HTML text. Официальная страница 1С также описывает загрузку из URL, программное формирование и загрузку из HTML-макета.

Для нашего URL:

```text
https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=showcase
```

вывод такой:

- URL-загрузка официально является поддержанным способом показа HTML-документа;
- direct JS call в URL-страницу является рабочей гипотезой, но требует spike;
- в web-клиенте HTML-поле может работать как iframe, и внешний сайт может быть заблокирован политиками браузера или заголовками вроде `X-Frame-Options`;
- thick/thin client с WebKit может вести себя иначе, чем web-client iframe;
- доступ к `Document.defaultView` и return value нужно проверять именно при URL-загрузке, а не только при HTML string/maket.

### Comparison: способы загрузки HTML

| Способ загрузки | Подтверждение | Плюсы | Минусы | Для каталога |
|---|---|---|---|---|
| URL | official | Текущий путь, удобно обновлять, подходит для демо-домена | сеть, TLS, кэш, политики iframe/X-Frame-Options в web-client, доступность `Document` надо проверить | Основной текущий сценарий |
| HTML string | official | Максимальный контроль, можно встроить каталог сразу | тяжелее обновлять большой shell, строка может стать большой | Хороший fallback для embedded catalog |
| HTML-макет | official | Упаковка в конфигурацию/обработку, меньше сетевых рисков | обновление через релиз/обработку, нужно переносить artifact | Сильный production-like fallback |
| Локальный файл | partially supported / community | Можно быстро проверить offline | пути, права, security, подмена файлов, разные ОС | Не основной путь |

Главный интерес остается URL, потому что текущая диагностика и витрина уже открываются по URL. Но первый spike должен отдельно зафиксировать: `direct JS call works with URL page: yes/no`.

## 3. Как дождаться готовности HTML-страницы?

Нужна двухфазная готовность.

### Фаза 1: 1С видит, что документ сформирован

Проверить событие HTML-поля:

```text
ДокументСформирован / DocumentComplete
```

Название и сигнатура зависят от версии платформы, но наличие такого события подтверждается reference-материалами и локальным diagnostic guide.

### Фаза 2: HTML runtime готов принять каталог

Даже после `DocumentComplete` JS runtime витрины может еще не закончить инициализацию. Поэтому HTML должен предоставить:

```js
window.Showcase.getRuntimeInfo()
```

Пример результата:

```json
{
  "apiVersion": "0.1",
  "ready": true,
  "mode": "showcase",
  "buildId": "1c-html-shell-diagnostic-showcase-2026-05-21-01",
  "catalogStatus": {
    "source": "mock",
    "catalogId": "mock-default"
  }
}
```

Минимально можно обойтись ready-флагом:

```js
window.Showcase.ready === true
```

### Что делать, если 1С передала каталог слишком рано

HTML должен быть терпимым:

- ранний `window.Showcase` stub сохраняет `pendingCatalog`;
- после полной инициализации runtime вызывает `applyPendingCatalog()`;
- если stub не успел создаться и вызов упал, 1С повторяет отправку после ready-poll.

Для первого среза проще:

1. 1С ждет `DocumentComplete`.
2. 1С 3-5 секунд polling-ом проверяет `window.Showcase.ready`.
3. Только потом вызывает `receiveCatalog()`.
4. HTML дополнительно держит ранний stub как страховку.

## 4. Как безопасно передавать большой JSON?

### Object или JSON string

Для первого среза выбрать:

```text
1С передает JSON string.
HTML делает JSON.parse().
```

Причины:

- строка является примитивом;
- community-материалы по direct JS call отдельно указывают, что примитивы надежнее для передачи и результата;
- 1С уже умеет формировать JSON;
- HTML может валидировать и логировать исходный payload;
- меньше риска получить COM/DOM-wrapper вместо обычного JS object.

HTML может дополнительно принимать object для браузерных тестов:

```js
receiveCatalog(catalogJsonOrObject)
```

Но 1С-side contract для первого spike: передавать строку.

### Кириллица

Кириллица безопасна, если:

- 1С хранит JSON как Unicode-строку;
- нет roundtrip через ANSI/Windows-1251 без явного кодирования;
- HTML получает строку напрямую как параметр метода;
- при developer fixture export используется UTF-8.

Не нужно вручную escape-ить кириллицу в `\uXXXX`, если вся цепочка Unicode-safe. Но spike должен проверить русские названия групп/товаров.

### Кавычки, переводы строк, спецсимволы

Если JSON передается параметром метода:

```text
ОкноHTML.Showcase.receiveCatalog(JSONСтрока)
```

кавычки и переводы строк внутри JSON остаются содержимым строки. Это предпочтительно.

Если приходится формировать JS-call как строку:

```text
"window.Showcase.receiveCatalog(" + EscapedJsonStringLiteral + ")"
```

нужен строгий escaping:

- `\` -> `\\`;
- `"` -> `\"`;
- CR/LF -> `\n`;
- U+2028/U+2029 -> escaped;
- не использовать `eval` с сырым JSON.

Более безопасный fallback для script-string:

```js
window.Showcase.receiveCatalog(JSON.parse("<escaped-json-string>"))
```

Но он все равно зависит от корректного string escaping.

### Ограничения длины строки

Точный лимит неизвестен и зависит от:

- версии платформы 1С;
- клиента: толстый / тонкий / web;
- engine: WebKit / legacy IE-like;
- способа вызова: direct method call, script-string, DOM mailbox;
- размера объекта DOM/COM bridge.

Нужен payload spike:

- маленький каталог: 3 группы / 5 товаров;
- обычный каталог: 5-8 групп / 20-50 товаров;
- visual каталог: 100 товаров;
- увеличенные payload sizes: 100 KB, 500 KB, 1 MB, если бизнес ожидает большой каталог.

Для первого реального среза лучше держать каталог компактным: без картинок inline, без остатков, без технических полей.

### Нужен ли chunking

Для первого среза chunking не нужен, если проходит каталог до 100 товаров.

Chunking нужен, если:

- direct call падает на большом JSON;
- UI нужен каталог существенно больше 100-200 товаров;
- 1С или HTML-поле режет строку;
- передаются картинки inline, что сейчас не рекомендуется.

Возможный vNext API:

```js
window.Showcase.beginCatalogTransfer(meta)
window.Showcase.appendCatalogChunk(transferId, chunkText)
window.Showcase.commitCatalogTransfer(transferId)
window.Showcase.cancelCatalogTransfer(transferId)
```

Не добавлять это в первый срез без фактической необходимости.

### Нужен ли base64

Base64 не нужен для первого среза.

Плюсы:

- меньше проблем с кавычками и переводами строк;
- удобно, если канал ломает спецсимволы.

Минусы:

- увеличивает payload примерно на треть;
- нужно корректно кодировать/декодировать Unicode;
- усложняет 1С и HTML;
- скрывает читаемость диагностического JSON.

Рекомендация: начинать с plain JSON string. Base64 оставить только fallback-ом, если spike покажет проблемы escaping/encoding.

## 5. Можно ли получить ответ от HTML обратно в 1С?

Целевой результат:

```json
{
  "ok": true,
  "catalogId": "showcase-default",
  "groupsAccepted": 7,
  "productsAccepted": 120,
  "productsSkipped": 3,
  "errors": []
}
```

### Direct return value

Если direct JS call возвращает значение в конкретной версии 1С, можно использовать return value.

Но надежный минимум:

- считать надежными только примитивы;
- сложный JS object считать browser-debug result, а не обязательным 1С API;
- для 1С возвращать JSON string или читать статус отдельным вызовом.

### Рекомендуемая стратегия result

HTML:

```js
window.Showcase.receiveCatalog = function (catalogJson) {
  var result = applyCatalogSafely(catalogJson);
  window.Showcase.lastCatalogResult = result;
  window.Showcase.lastCatalogResultJson = JSON.stringify(result);
  return result;
};

window.Showcase.getCatalogStatus = function () {
  return window.Showcase.lastCatalogResult || {
    ok: true,
    source: "mock",
    catalogId: "mock-default"
  };
};
```

Если 1С не может читать object:

```js
window.Showcase.getCatalogStatusJson = function () {
  return window.Showcase.lastCatalogResultJson || "{}";
};
```

`getCatalogStatusJson()` не обязателен для browser API, но полезен как low-risk 1С helper.

### DOM mailbox для результата

Fallback:

```html
<div id="showcase-catalog-result-mailbox" hidden></div>
```

HTML после применения каталога пишет туда JSON result. 1С читает DOM node value/text.

Плюсы:

- не зависит от return value;
- можно посмотреть результат в debug;
- подходит для polling.

Минусы:

- задержка;
- нужно договориться о DOM id;
- нужно не показывать технический JSON покупателю.

## 6. Fallback-подходы

### Comparison table

| Подход | Как работает | Плюсы | Минусы | Рекомендация |
|---|---|---|---|---|
| A. Direct JS call | 1С вызывает `window.Showcase.receiveCatalog(json)` | Самый простой runtime path, не сбрасывает UI, хорошо соответствует ownership | зависит от версии 1С, клиента, DOM/window access, return value | Основной путь |
| B. DOM mailbox | 1С пишет JSON в скрытый DOM-элемент, HTML читает и применяет | Не нужен direct function call; можно использовать polling | медленнее, больше moving parts, нужен DOM access и agreed ids | Первый fallback |
| C. HTML reload with embedded catalog by 1С | 1С формирует HTML/string/maket с встроенным JSON | Не нужен runtime bridge после загрузки, просто для offline/packaged | сбрасывает состояние, тяжелый payload, сложнее обновлять | Last-resort native fallback |
| D. Developer sample fixture | JSON sample лежит в репозитории для dev/test | Помогает автотестам, smoke и объяснению формата | Не runtime-сценарий, не пользовательский импорт | Dev/test only, not runtime fallback |
| E. HTML -> HTTP/OData -> 1С | HTML сам запрашивает каталог | привычно для web app | CORS/auth/network/security, HTML получает лишнюю ответственность, риск прямого доступа к данным | Не основной путь |

### A. Direct JS call

Целевой путь:

```text
1С -> Document.defaultView -> Showcase.receiveCatalog(JSONСтрока)
```

Когда выбирать:

- URL-страница загрузилась;
- `window.Showcase.ready === true`;
- direct method call работает;
- payload 20-100 товаров проходит;
- return или status-read доступен.

### B. DOM mailbox

Схема:

```text
1С:
  document.getElementById("showcase-catalog-mailbox").textContent = JSONСтрока
  document.getElementById("showcase-catalog-mailbox").setAttribute("data-updated-at", timestamp)

HTML:
  timer/poll/change detection
  read mailbox
  receiveCatalog(mailbox.textContent)
```

Нужные DOM nodes:

```html
<div id="showcase-catalog-mailbox" hidden></div>
<div id="showcase-catalog-result-mailbox" hidden></div>
```

Когда выбирать:

- direct method call не работает;
- direct return value не работает;
- DOM read/write работает стабильно.

### C. HTML reload with embedded catalog by 1С

Схема:

```text
1С формирует HTML text:
  <script>
    window.__SHOWCASE_INITIAL_CATALOG__ = {...};
  </script>

Поле HTML-документа получает готовый HTML text или макет.
```

Плюсы:

- нет runtime call после загрузки;
- можно сделать single-file delivery;
- хорошо для isolated demo.

Минусы:

- полная перезагрузка;
- сброс темы, корзины, search buffer, modal state;
- большой HTML text;
- риск escaping при встраивании JSON в script;
- хуже для будущих обновлений каталога.

Рекомендация: держать как last-resort native fallback, если direct call и mailbox провалились. Каталог встраивает 1С автоматически; пользователь не вставляет JSON.

### D. Developer sample fixture

Схема:

- sample JSON хранится в репозитории;
- агент использует его для локальных тестов, автотестов и smoke;
- 1С-программист смотрит sample только как пример формата;
- runtime delivery все равно идет через direct JS call, DOM mailbox или embedded catalog by 1С.

Плюсы:

- помогает проверить adapter и validation без реальной 1С;
- дает стабильный sample для автотестов;
- помогает согласовать контракт с 1С-программистом.

Минусы:

- не является fallback для runtime;
- не должен требовать действий пользователя в HTML;
- не доказывает работу канала 1С -> HTML.

Рекомендация: разрешить только как dev/test artifact. Не добавлять пользовательский импорт JSON в витрину.

### E. HTML делает HTTP/OData запрос в 1С

Не основной путь.

Почему:

- HTML начинает сам ходить за данными;
- появляются CORS, auth, session, TLS, proxy и network вопросы;
- HTML получает слишком много ответственности;
- можно случайно раскрыть 1С endpoints в покупательском UI;
- сложнее не передать лишние данные;
- хуже соответствует правилу `1С готовит safe DTO, HTML только отображает`.

Допустимо рассматривать позже только как отдельное интеграционное решение с безопасным HTTP-service facade, а не как быстрый путь к первому каталогу.

## 7. Какой подход выбрать как основной

Выбрать:

```text
Primary: Direct JS call
Fallback: DOM mailbox
Last-resort native fallback: HTML reload with embedded catalog by 1С
Dev/test only: Developer sample fixtures
Not primary: HTML -> OData/HTTP
```

Обоснование:

- direct JS call минимально меняет текущую HTML-витрину;
- 1С остается владельцем каталога;
- HTML не получает доступ к базе и OData;
- каталог передается как safe DTO;
- можно заменить mock-группы/товары без кассового bridge;
- если direct call не пройдет на целевой версии, DOM mailbox сохраняет ту же архитектурную границу;
- sample fixtures остаются только dev/test материалом и не становятся пользовательским сценарием.

Статус уверенности:

```text
Architecture recommendation: high.
Platform guarantee: medium/unknown until spike.
```

## 8. Что нужно добавить в HTML-витрину

Нужно добавить публичный JS API:

```js
window.Showcase.receiveCatalog(catalogJson)
window.Showcase.getCatalogStatus()
window.Showcase.clearCatalog()
window.Showcase.getRuntimeInfo()
```

Минимально для первого среза:

```js
window.Showcase.receiveCatalog(catalogJson)
```

### Recommended API shape

```js
window.Showcase = {
  apiVersion: "0.1",
  ready: false,
  lastCatalogResult: null,
  lastCatalogResultJson: "",
  receiveCatalog: function (catalogJson) {},
  getCatalogStatus: function () {},
  clearCatalog: function () {},
  getRuntimeInfo: function () {}
};
```

Optional low-risk helper for 1С:

```js
window.Showcase.getCatalogStatusJson = function () {}
```

### receiveCatalog behavior

`receiveCatalog(catalogJson)`:

- принимает object или JSON string;
- если пришла строка, делает `JSON.parse()`;
- валидирует `contractVersion`;
- валидирует root fields;
- валидирует `groups` и `products`;
- нормализует каталог;
- фильтрует `visible=false`;
- фильтрует `available=false` в первом срезе;
- заменяет `showcaseCategories`;
- заменяет `showcaseProducts`;
- сбрасывает `showcaseState.categoryId` на первую visible-группу;
- очищает demo-корзину при полной замене каталога;
- закрывает payment/mock modal, если он открыт;
- перерисовывает витрину;
- сохраняет result в `window.Showcase.lastCatalogResult`;
- возвращает result object для browser/debug;
- не вызывает РМК;
- не вызывает оплату;
- не отправляет кассовые команды.

### Result object

```json
{
  "ok": true,
  "catalogId": "showcase-default",
  "source": "1c",
  "contractVersion": "0.1",
  "groupsAccepted": 7,
  "productsAccepted": 120,
  "productsSkipped": 3,
  "errors": []
}
```

### getRuntimeInfo behavior

`getRuntimeInfo()`:

- возвращает `apiVersion`;
- возвращает `ready`;
- возвращает текущий `mode`;
- возвращает build id;
- возвращает текущий источник каталога: `mock`, `fixture`, `1c`;
- не возвращает секреты, user data, cookies, tokens.

### clearCatalog behavior

`clearCatalog()`:

- очищает текущий real catalog;
- возвращает mock catalog или пустой safe catalog, это нужно выбрать при реализации;
- очищает demo-корзину;
- перерисовывает витрину;
- не трогает РМК/чек/оплату.

Для первого среза можно не реализовывать `clearCatalog()`, если есть только `receiveCatalog()`.

## 9. Что нужно сделать на стороне 1С

Минимальная задача для 1С-программиста:

1. Создать тестовую форму, обработку или расширение.
2. Разместить `Поле HTML-документа`.
3. Открыть URL:

```text
https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=showcase&runId=<id>&terminalLabel=<label>
```

4. Дождаться `ДокументСформирован` / готовности документа.
5. Проверить, что `window.Showcase` существует.
6. Проверить, что `window.Showcase.ready === true`.
7. Собрать безопасный catalog JSON по контракту `0.1`.
8. Вызвать:

```text
window.Showcase.receiveCatalog(catalogJson)
```

9. Получить return value или прочитать `getCatalogStatus()` / result mailbox.
10. Зафиксировать:
    - сколько групп принято;
    - сколько товаров принято;
    - сколько товаров отброшено;
    - какие ошибки валидации были;
    - какой payload size прошел.

Нельзя передавать:

- внутренние ссылки 1С;
- секреты;
- токены;
- чеки;
- оплаты;
- фискальные данные;
- персональные данные;
- технические имена регистров/документов;
- закупочные цены и себестоимость;
- остатки без отдельного решения.

## 10. Псевдокод 1С

Это псевдокод. Он показывает структуру, но не является готовым универсальным BSL-кодом. Имена событий, свойств и доступность `defaultView` зависят от версии платформы, клиента и режима совместимости.

```text
&НаКлиенте
Процедура ПриОткрытии()
    URL = "https://kassa.speechbattle.com/diagnostics/1c-html-shell"
        + "?mode=showcase"
        + "&runId=" + Строка(Новый УникальныйИдентификатор())
        + "&terminalLabel=catalog-spike";

    // Конкретный способ загрузки зависит от формы:
    // 1) значение строкового реквизита, связанного с HTML-полем;
    // 2) Элементы.HTMLДокумент.Перейти(URL);
    // 3) Элементы.HTMLДокумент.УстановитьТекст(HTMLТекст) для fallback.
    ЗагрузитьURLВПолеHTMLДокумента(URL);
КонецПроцедуры

&НаКлиенте
Процедура HTMLДокументДокументСформирован(Элемент)
    // DocumentComplete означает, что документ сформирован,
    // но Showcase runtime может еще не быть ready.
    ПодключитьОбработчикОжидания("ПроверитьГотовностьShowcase", 1);
КонецПроцедуры

&НаКлиенте
Процедура ПроверитьГотовностьShowcase()
    ОкноHTML = ПолучитьОкноHTML();
    Если ОкноHTML = Неопределено Тогда
        Возврат;
    КонецЕсли;

    Попытка
        RuntimeInfo = ОкноHTML.Showcase.getRuntimeInfo();
        Если RuntimeInfo.ready Тогда
            ОтключитьОбработчикОжидания("ПроверитьГотовностьShowcase");
            ПередатьКаталогВHTML();
        КонецЕсли;
    Исключение
        // Showcase еще не создан или direct JS call недоступен.
        // Ждем несколько попыток, затем включаем DOM mailbox fallback.
    КонецПопытки;
КонецПроцедуры

&НаКлиенте
Функция ПолучитьОкноHTML()
    ДокументHTML = Элементы.HTMLДокумент.Документ;
    Если ДокументHTML = Неопределено Тогда
        Возврат Неопределено;
    КонецЕсли;

    Попытка
        // WebKit/defaultView path. Проверить на целевой версии.
        Возврат ДокументHTML.defaultView;
    Исключение
        // parentWindow только legacy fallback, не baseline.
    КонецПопытки;

    Возврат Неопределено;
КонецФункции

&НаКлиенте
Процедура ПередатьКаталогВHTML()
    JSONКаталога = СформироватьБезопасныйJSONКаталога();
    ОкноHTML = ПолучитьОкноHTML();

    Попытка
        Результат = ОкноHTML.Showcase.receiveCatalog(JSONКаталога);
        // Если сложный JS object не читается в 1С, используем отдельный статус.
        Статус = ОкноHTML.Showcase.getCatalogStatus();
        ЗаписатьЖурналКаталога(Результат, Статус);
    Исключение
        // Fallback: записать JSON в DOM mailbox.
        ПередатьКаталогЧерезDOMMailbox(JSONКаталога);
    КонецПопытки;
КонецПроцедуры

&НаКлиенте
Процедура ПередатьКаталогЧерезDOMMailbox(JSONКаталога)
    ДокументHTML = Элементы.HTMLДокумент.Документ;
    Узел = ДокументHTML.getElementById("showcase-catalog-mailbox");
    Если Узел <> Неопределено Тогда
        Узел.value = JSONКаталога;
        Узел.setAttribute("data-updated-at", Строка(ТекущаяДата()));
    КонецЕсли;
КонецПроцедуры
```

Что должен адаптировать 1С-программист:

- способ загрузки URL;
- имя элемента формы;
- событие готовности;
- доступность `Документ`;
- доступность `defaultView`;
- формат return value;
- DOM methods для mailbox;
- безопасное формирование JSON.

## 11. Риски и неизвестности

Обязательные риски:

- версия платформы 1С;
- thick / thin / web client;
- режим совместимости;
- ОС терминала;
- URL vs HTML-макет vs string;
- доступ к `HTMLDocumentField.Document`;
- доступ к `defaultView` / `window`;
- официальный запрет/ограничение `parentWindow` в современном baseline;
- событие готовности HTML;
- момент создания `window.Showcase`;
- return value от JS-функции;
- ограничения размера payload;
- кодировка и кириллица;
- escaping JSON при script-string fallback;
- блокировки безопасности;
- X-Frame-Options / iframe ограничения в web-client;
- CORS/network/TLS/proxy при URL-загрузке;
- поведение при перезагрузке страницы;
- V8WebKit особенности;
- официальное предупреждение, что HTML field может не поддерживать весь HTML functionality;
- официальное предупреждение про stateful scripts в HTML field, которое нужно проверять на нашем runtime;
- необходимость теста на реальном терминале и в реальной 1С-среде.

Практический вывод: direct JS call можно выбрать как целевую архитектуру, но нельзя закрыть задачу без spike evidence.

## 12. 1C_TO_HTML_DIRECT_CATALOG_DELIVERY_SPIKE_PLAN

Минимальный spike:

### 1. Открыть витрину

Открыть в `Поле HTML-документа`:

```text
https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=showcase&runId=catalog-spike-001&terminalLabel=<safe-label>
```

Зафиксировать:

- версия платформы 1С;
- тип клиента: толстый / тонкий / web;
- ОС;
- конфигурация;
- режим совместимости;
- способ загрузки URL.

### 2. Убедиться, что window.Showcase существует

Проверить после `ДокументСформирован`:

```text
window.Showcase exists
window.Showcase.receiveCatalog exists
window.Showcase.ready === true
```

Если `window.Showcase` не существует, зафиксировать:

- не создан API в HTML;
- direct call невозможен до доработки HTML;
- fallback только DOM mailbox или embedded catalog by 1С после добавления agreed hooks.

### 3. Вызвать receiveCatalog()

Из 1С вызвать:

```text
window.Showcase.receiveCatalog(sampleCatalogJson)
```

Где `sampleCatalogJson` - JSON string по контракту `0.1`.

### 4. Проверить UI

Проверить:

- группы заменились;
- товары заменились;
- карточки перерисовались;
- JSON прошел валидацию;
- invalid catalog не ломает UI;
- результат можно увидеть в 1С или в диагностическом статусе HTML;
- demo-корзина очищается при полной замене каталога;
- mock-оплата остается mock-only.

### 5. Повторить наборы данных

Проверить:

- маленький каталог;
- каталог 20-50 товаров;
- каталог 100 товаров;
- кириллица;
- длинные названия;
- товар без картинки;
- товар `visible=false`;
- товар `available=false`;
- invalid JSON;
- товар с неизвестным `groupId`;
- товар без `price`;
- товар с пустым `title`.

### 6. Проверить result path

Зафиксировать:

- доступен ли direct return value;
- можно ли прочитать `window.Showcase.lastCatalogResult`;
- можно ли вызвать `getCatalogStatus()`;
- нужен ли `getCatalogStatusJson()`;
- работает ли DOM result mailbox.

### 7. Проверить payload limits

Зафиксировать:

- direct JS call работает / не работает;
- return value доступен / не доступен;
- максимальный безопасный payload;
- payload с кириллицей проходит / не проходит;
- нужен ли chunking;
- нужен ли base64;
- нужен ли fallback.

Рекомендуемые размеры:

```text
5 товаров
50 товаров
100 товаров
100 KB JSON
500 KB JSON, если бизнес ожидает большой каталог
1 MB JSON, только как stress test
```

### 8. Проверить fallback

Если direct JS call не работает:

1. Проверить DOM mailbox.
2. Проверить HTML reload with embedded catalog by 1С.
3. Зафиксировать, какой native fallback работает на целевой платформе.

### 9. Итог spike

Итоговый ответ 1С-программиста:

```text
direct JS call: works / fails
URL page direct call: works / fails
return value: works / fails / primitive-only
DOM mailbox: works / fails
embedded catalog by 1С: works / fails
max safe payload: <value>
recommended next step: <direct/mailbox/embedded>
```

## Final Recommendation

Сейчас выбрать:

```text
Direct JS call: window.Showcase.receiveCatalog(catalogJson)
```

Добавить в HTML:

- ранний `window.Showcase` stub;
- `receiveCatalog(catalogJson)`;
- `getRuntimeInfo()`;
- `getCatalogStatus()`;
- `lastCatalogResult`;
- DOM mailbox nodes как native fallback;
- optional developer sample fixture tests outside runtime.

Проверить с 1С-программистом:

- `DocumentComplete`;
- доступ к `Document`;
- доступ к `defaultView`;
- вызов `window.Showcase.receiveCatalog`;
- return/status path;
- payload size;
- URL mode именно для `https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=showcase`.

Не делать в этом этапе:

- РМК;
- чек;
- оплату;
- ККТ;
- фискализацию;
- маркировку;
- `cart.*`, `payment.*`, `receipt.*`;
- HTML -> база 1С;
- HTML -> OData как основной путь.
