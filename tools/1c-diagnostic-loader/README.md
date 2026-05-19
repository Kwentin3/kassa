# 1C HTML Shell Diagnostic Loader

Дата: 2026-05-19
Статус: Slice 2 source draft

## Что это

Это исходники минимального 1С Diagnostic Loader для проверки обмена HTML ↔ 1С.

Loader нужен, чтобы открыть диагностическую страницу:

```text
https://kassa.speechbattle.com/diagnostics/1c-html-shell
```

внутри `Поле HTML-документа` 1С и проверить, может ли HTML-страница обмениваться диагностическими сообщениями с 1С.

## Что это НЕ делает

Эта обработка не является кассой и не является РМК-адаптером.

Она не должна:

- обращаться к РМК;
- создавать или изменять чек;
- запускать оплату;
- работать с эквайрингом;
- обращаться к ККТ;
- фискализировать чек;
- печатать чек;
- работать с маркировкой;
- читать реальные товары, чеки или суммы;
- выполнять production-команды `cart.*`, `payment.*`, `receipt.*`, `session.*`.

Она обрабатывает только диагностические команды `diag.*`.

## Почему нет готового `.epf`

Предпочтительный формат для передачи 1С-программисту - внешняя обработка `.epf`.

В текущей среде обнаружен runtime 1С, но нет целевой тестовой базы, EDT-проекта и проверенного сценария сборки внешней обработки. Поэтому бинарный `.epf` не собирался.

Не нужно имитировать `.epf`. Этот пакет содержит исходники и структуру формы для ручной сборки 1С-программистом в Designer/EDT.

## Структура пакета

```text
tools/1c-diagnostic-loader/
  README.md
  src/
    DiagnosticLoaderFormModule.bsl
    DiagnosticLoaderObjectModule.bsl
    DiagnosticProtocol.md
    form-structure.md
  examples/
    command-envelope.json
    response-envelope.json
  dist/
    README.md
```

## Как собрать внешнюю обработку

1. Открыть тестовую базу 1С в Designer/EDT.
2. Создать внешнюю обработку `1C_HTML_SHELL_DIAGNOSTIC_LOADER.epf`.
3. Создать управляемую форму.
4. Создать реквизиты и элементы формы по `src/form-structure.md`.
5. Вставить код из `src/DiagnosticLoaderObjectModule.bsl` в модуль объекта обработки.
6. Вставить код из `src/DiagnosticLoaderFormModule.bsl` в модуль формы.
7. Подключить доступные события `Поле HTML-документа`:
   - `ПриНажатии` → `ПолеHTMLДокументаПриНажатии`;
   - событие перехода/навигации, если есть → `ПолеHTMLДокументаПриПереходе`;
   - событие готовности/формирования документа, если есть → `ПолеHTMLДокументаДокументСформирован`.
8. Проверить компиляцию в конкретной версии платформы.
9. Открыть обработку в тестовой базе, не в боевом кассовом контуре.

## Минимальный сценарий проверки

1. Открыть обработку.
2. Указать URL:

```text
https://kassa.speechbattle.com/diagnostics/1c-html-shell
```

3. Заполнить `runId` и `terminalLabel`.
4. Нажать `Открыть диагностику`.
5. Убедиться, что страница открылась и сформировала JSON.
6. Скопировать JSON без loader как baseline.
7. Нажать `Передать сведения о 1С`.
8. Нажать `Проверить diag.ping`.
9. Если страница/сборка поддерживает активные bridge-probes, проверить HTML → 1С:
   - href/navigation transport;
   - DOM mailbox transport.
10. Скопировать итоговый JSON со страницы и журнал обработки.

## Реализованные части

В исходниках есть:

- загрузка diagnostic URL с `runId`, `terminalLabel`, `verdictScope`;
- обработчик события HTML-поля для href/navigation и DOM mailbox;
- разбор command envelope;
- allowlist только для `diag.*`;
- запрет production-команд через safety boundary;
- ответы `diag.ready`, `diag.ping`, `diag.hrefTransport`, `diag.domMailbox`, `diag.directJsCall`, `diag.payloadSize`, `diag.roundTrip`, `diag.getEnvironmentFrom1C`;
- direct JS call draft через `window.DiagnosticHarness.receiveBridgeAck(...)`;
- `receiveStateFrom1C(...)` для безопасных metadata;
- DOM mailbox fallback для ответа;
- журнал событий на форме;
- безопасные metadata без пользователей, чеков, товаров, сумм и секретов.

## Транспорты

| Направление | Транспорт | Статус |
|---|---|---|
| HTML → 1С | `oneshell://diag?payload=...` | Реализован draft parser; требует проверки события HTML-поля. |
| HTML → 1С | DOM mailbox `#diagnostic-command-mailbox` | Реализовано чтение DOM; требует HTML hooks и проверки платформы. |
| 1С → HTML | `window.DiagnosticHarness.receiveBridgeAck(...)` | Реализован draft direct JS call; требует проверки `defaultView`/DOM API. |
| 1С → HTML | DOM mailbox `#diagnostic-response-mailbox` | Реализован fallback writer; требует HTML reader на стороне страницы. |

## Важное ограничение текущей web-страницы

Текущая diagnostic page уже содержит `window.DiagnosticHarness` и может принять вызов со стороны 1С. Но активные HTML → 1С проверки (`diag.ping`, href, DOM mailbox) требуют, чтобы текущая сборка страницы имела соответствующие hooks/кнопки/скрипты.

Команда `УстановитьHTMLHooks` в BSL-модуле показывает draft-injection тестовой href-ссылки и mailbox-элементов. Это нужно проверять на целевой версии 1С.

## Что считается успехом

Минимальный успех:

- страница открылась в `Поле HTML-документа`;
- 1С смогла вызвать `window.DiagnosticHarness.receiveBridgeAck(...)`;
- JSON страницы зафиксировал bridge как `supported` или `partially_supported`;
- журнал обработки содержит событие без падения формы.

Хороший результат:

- HTML отправил `diag.ping`;
- 1С получила команду;
- 1С вернула ответ с тем же `requestId`;
- в JSON видно, какой транспорт сработал.

Частичный успех:

- сработал только href;
- сработал только DOM mailbox;
- direct JS call не работает, но DOM fallback работает;
- маленький payload проходит, большой не проходит.

Это все полезные результаты, их нужно записать.

## Что считать провалом

- HTML-страница открывается, но 1С не получает ни одного события;
- 1С получает событие, но не может извлечь JSON;
- 1С получает команду, но не может ответить в HTML;
- форма падает при обмене;
- результат нельзя зафиксировать в JSON или журнале.

Даже провал полезен, если описать платформу, тип клиента, ОС и точку отказа.

## Version-dependent места

Требуют проверки на целевой версии платформы:

- как именно HTML-поле загружает URL из строкового реквизита;
- какие события HTML-поля доступны;
- как выглядит `ДанныеСобытия` для клика/перехода;
- можно ли отменить стандартную навигацию;
- работает ли `Элементы.ПолеHTMLДокумента.Документ`;
- работает ли `defaultView`;
- доступен ли `parentWindow` в старых режимах;
- можно ли передать в JavaScript объект 1С или только JSON-строку;
- работают ли JSON APIs на клиенте или их нужно вынести на сервер;
- поведение в толстом, тонком и web-клиенте.

## Безопасность

HTML считается недоверенным источником. Любой payload нужно валидировать.

Loader должен:

- выполнять только `diag.*`;
- не давать HTML вызывать произвольные процедуры 1С;
- не передавать в HTML внутренние ссылки объектов;
- не собирать секреты;
- не читать товары, чеки, суммы и фискальные данные;
- логировать только техническую диагностику.

## Памятка для 1С-программиста

1. Соберите внешнюю обработку из исходников.
2. Откройте ее в тестовой базе.
3. Загрузите diagnostic URL в `Поле HTML-документа`.
4. Сначала сохраните JSON без loader.
5. Проверьте `diag.ping` и передачу metadata.
6. Скопируйте итоговый JSON и журнал.
7. Напишите, какой транспорт сработал и где был отказ.

## Источники

- 1С, HTML-документы: https://v8.1c.ru/platforma/html-dokumenty/
- 1C:Enterprise 8.3.23 Developer Guide, HTML document fields: https://kb.1ci.com/1C_Enterprise_Platform/Guides/Developer_Guides/1C_Enterprise_8.3.23_Developer_Guide/Chapter_7._Forms/7.7._Form_items/7.7.4._Field/
- 1С, JSON: https://v8.1c.ru/platforma/json/
- Interaction between the 1C Platform and JavaScript: https://1c-dn.com/blog/interaction-between-the-1c-platform-and-javascript/
- Практика работы с Полем HTML-документа: https://habr.com/ru/companies/lad_/articles/813177/
- Вызов JavaScript из 1С через контекст HTML-окна: https://habr.com/ru/companies/lad_/articles/860106/

## Sticky TODO

- TODO: подготовить реальный `.epf` после проверки в 1С Designer/EDT.
- TODO: проверить href/navigation transport на целевой версии 1С.
- TODO: проверить DOM mailbox transport на целевой версии 1С.
- TODO: проверить direct JS call на целевой версии 1С.
- TODO: проверить толстый/тонкий/web-клиент отдельно.
- TODO: после успешного Slice 2 перейти к RMK Adapter spike.
- TODO: не смешивать `diag.*` с production bridge commands.
