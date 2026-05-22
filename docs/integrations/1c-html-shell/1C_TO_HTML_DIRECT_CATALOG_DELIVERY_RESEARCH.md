# 1C To HTML Direct Catalog Delivery Research

Дата: 2026-05-22
Статус: краткое решение для spike с 1С-специалистом

## Решение

Основной путь передачи каталога:

```text
1С -> direct JS call -> window.Showcase.receiveCatalog(catalogJsonString)
```

Fallback:

```text
1С -> DOM mailbox -> HTML читает mailbox -> receiveCatalog()
```

Last-resort native fallback:

```text
1С -> HTML/string/maket with embedded catalog -> Поле HTML-документа
```

Не основной путь:

```text
HTML -> HTTP/OData -> 1С
```

Запрещено:

```text
human-operated JSON upload/paste/import UI
```

## Почему direct JS call

Direct JS call лучше всего сохраняет границу:

- 1С владеет каталогом;
- 1С формирует safe DTO;
- HTML только отображает;
- HTML не получает доступ к базе 1С;
- HTML не знает внутренние ссылки объектов;
- каталог можно заменить без production bridge;
- кассовые операции не затрагиваются.

Уверенность:

```text
Architecture recommendation: high.
Platform guarantee: medium/unknown until spike on target 1C.
```

Работоспособность нужно проверить на целевой версии платформы 1С, типе клиента, ОС и режиме совместимости.

## Источники уверенности

| Источник | Что даёт |
|---|---|
| Документация 1С по HTML-документам | `Поле HTML-документа`, загрузка URL/HTML/макета, DOM-доступ, события HTML-документа |
| 1Ci Developer Guide HTML document fields | `HTMLDocumentField.Document`, WebKit baseline, ограничения HTML-поля |
| Документация 1С по JSON | 1С умеет формировать/читать JSON |
| Community-практика по `defaultView` | Гипотеза прямого вызова JS-функций через window-like объект |
| Текущий runtime | `window.Showcase.receiveCatalog()`, `getRuntimeInfo()`, `getCatalogStatusJson()` уже реализованы |

Community-паттерны не являются гарантией для всех версий 1С. Они задают spike, а не заменяют проверку.

## Главное терминологическое уточнение

`window.Showcase.*` - не нативные методы 1С.

Это JavaScript-методы HTML-страницы. 1С вызывает их через native-доступ к HTML-документу:

```text
Поле HTML-документа
-> Документ
-> defaultView / window
-> window.Showcase
```

## Минимальный сценарий

```text
1. 1С открывает:
   https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=showcase

2. HTML создаёт:
   window.Showcase

3. 1С ждёт ready:
   window.Showcase.getRuntimeInfo()

4. 1С формирует безопасный JSON каталога.

5. 1С вызывает:
   window.Showcase.receiveCatalog(catalogJsonString)

6. HTML валидирует JSON, заменяет группы/товары и перерисовывает витрину.

7. 1С проверяет:
   window.Showcase.getCatalogStatusJson()
```

## Псевдокод 1С

```text
HTMLПоле.ОткрытьURL(
  "https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=showcase"
)

ДокументHTML = HTMLПоле.Документ
ОкноHTML = ДокументHTML.defaultView

Инфо = ОкноHTML.Showcase.getRuntimeInfo()

Если Инфо.ready = Истина Тогда
    JSONКаталога = СформироватьБезопасныйJSONКаталога()
    Результат = ОкноHTML.Showcase.receiveCatalog(JSONКаталога)
    СтатусJSON = ОкноHTML.Showcase.getCatalogStatusJson()
КонецЕсли
```

Это псевдокод. Реальные имена формы, события загрузки и свойства HTML-поля проверяет 1С-специалист.

## Почему JSON string, а не object

Для первого среза 1С передаёт строку:

```text
catalogJsonString
```

Причины:

- строка - простой тип для межсредового вызова;
- 1С уже умеет формировать JSON;
- HTML делает `JSON.parse()`;
- меньше риска получить COM/DOM-wrapper вместо обычного JS object;
- проще логировать payload size и ошибки валидации.

HTML может принимать object для браузерных dev-тестов, но контракт для 1С - строка JSON.

## Fallback: DOM mailbox

Если direct call не работает:

```text
1С записывает JSON в #showcase-catalog-mailbox
1С меняет data-updated-at
HTML читает node
HTML вызывает receiveCatalog()
HTML пишет статус в #showcase-catalog-result-mailbox
1С читает статус
```

Это fallback транспорта, не новый контракт каталога и не ручной импорт.

## Last resort: embedded catalog

Если direct call и mailbox не работают:

```text
1С формирует HTML text / макет / строку с embedded catalog
1С загружает это в Поле HTML-документа
HTML применяет initial catalog при boot
```

Минусы:

- полная перезагрузка;
- сброс состояния витрины;
- более сложное экранирование;
- хуже для частых обновлений.

Использовать только как last resort. Каталог встраивает 1С автоматически, пользователь JSON не вставляет.

## Что не делать

- не добавлять manual JSON import UI;
- не добавлять file picker для каталога;
- не просить пользователя вставлять JSON;
- не делать HTML -> OData основным способом;
- не делать HTML -> база 1С;
- не передавать внутренние ссылки 1С;
- не вызывать `cart.addProduct`;
- не вызывать `payment.startCard`;
- не вызывать `receipt.getStatus`;
- не подключать РМК, чек, оплату, ККТ, фискализацию и маркировку.

## Slice 1 / Slice 2

`receiveCatalog()` относится к Slice 1: это входящее обновление каталога для витринного UI.

Slice 2 - другой будущий этап: Diagnostic Loader / bridge probe для полноценного обмена HTML ↔ 1С.

`receiveCatalog()` не доказывает production bridge и не является кассовой командой.

## Медиа и картинки

Не развивать сейчас.

- `image=null` допустимо;
- HTML показывает placeholder;
- внутренние ссылки 1С на картинки не передавать;
- реальную публикацию картинок обсудить отдельно с 1С-специалистами;
- новый media contract не добавлять без принятого решения.

## Минимальный spike

Проверить:

- URL page direct call работает / не работает;
- `window.Showcase` существует;
- `getRuntimeInfo().ready === true`;
- `receiveCatalog(jsonString)` вызывается из 1С;
- return value доступен / не доступен;
- `getCatalogStatusJson()` доступен;
- DOM mailbox fallback работает / не работает;
- кириллица проходит;
- payload 5, 50, 100 товаров проходит;
- invalid JSON не ломает экран;
- `image=null` показывает placeholder.

Итог spike:

```text
direct JS call: works / fails
URL page direct call: works / fails
return value: works / fails / primitive-only
DOM mailbox: works / fails
embedded catalog by 1С: works / fails
max safe payload: <value>
recommended next step: <direct/mailbox/embedded>
```
