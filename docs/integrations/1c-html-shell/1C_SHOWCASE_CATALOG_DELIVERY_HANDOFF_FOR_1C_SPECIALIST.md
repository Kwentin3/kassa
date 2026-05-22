# Handoff: передача каталога из 1С в HTML-витрину

Дата: 2026-05-22
Статус: рабочая памятка Slice 1

## Коротко

1С:

- открывает URL витрины в `Поле HTML-документа`;
- ждёт загрузки страницы;
- получает доступ к HTML `window`;
- формирует безопасную JSON-строку каталога;
- вызывает `window.Showcase.receiveCatalog(jsonString)`;
- проверяет результат через `window.Showcase.getCatalogStatusJson()`.

HTML:

- создаёт `window.Showcase`;
- объявляет `getRuntimeInfo()`, `receiveCatalog()`, `getCatalogStatusJson()`;
- принимает JSON-строку;
- проверяет каталог;
- заменяет группы и товары;
- перерисовывает витрину;
- сохраняет статус последней загрузки.

Самая короткая версия:

```text
Открыть URL - делает 1С.
window.Showcase - создаёт HTML.
receiveCatalog(jsonString) - вызывает 1С, но метод живёт в HTML.
JSON каталога - формирует 1С.
Отрисовку карточек - делает HTML.
РМК, чек, оплата, ККТ - не участвуют.
```

## Важное уточнение терминов

`window.Showcase.*` - это **не нативные методы 1С**.

Это JavaScript-методы, которые живут внутри HTML-страницы.

Правильная цепочка:

```text
Поле HTML-документа
-> Документ
-> window / defaultView
-> window.Showcase
-> getRuntimeInfo()
-> receiveCatalog()
-> getCatalogStatusJson()
```

Правильная формулировка:

> 1С нативно открывает HTML-страницу и получает доступ к объекту `window` этой страницы. Методы `window.Showcase.*` создаются нашей HTML-витриной и вызываются из 1С через `Поле HTML-документа`.

Не пишем и не говорим так, будто `Showcase` - штатный API платформы 1С.

## URL

Открывать:

```text
https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=showcase&runId=<safe-run-id>&terminalLabel=<safe-terminal-label>
```

`runId` и `terminalLabel` - только безопасные метки для связи скриншота, статуса и журнала. Это не авторизация и не секрет.

Не передавайте в URL токены, пароли, строки подключения, ФИО, телефоны, e-mail, внутренние ссылки 1С или коммерческие данные клиента.

## Псевдокод 1С

Это структура действий, не универсальный готовый BSL. Имена формы, события загрузки и доступность `defaultView` проверяет 1С-специалист на целевой версии платформы.

```text
HTMLПоле.ОткрытьURL(
  "https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=showcase"
)

ДокументHTML = HTMLПоле.Документ
ОкноHTML = ДокументHTML.defaultView

Инфо = ОкноHTML.Showcase.getRuntimeInfo()

Если Инфо.ready = Истина Тогда
    JSONКаталога = СформироватьКаталогJSON()
    ОкноHTML.Showcase.receiveCatalog(JSONКаталога)
    СтатусJSON = ОкноHTML.Showcase.getCatalogStatusJson()
КонецЕсли
```

Если `defaultView` или прямой вызов метода недоступны, используйте DOM mailbox fallback ниже. `parentWindow` может быть только legacy fallback, не основной путь.

## Псевдокод HTML

```js
window.Showcase = {
  ready: false,

  getRuntimeInfo: function () {
    return {
      ready: true,
      mode: "showcase"
    };
  },

  receiveCatalog: function (catalogJsonString) {
    var catalog = JSON.parse(catalogJsonString);
    validateCatalog(catalog);
    applyCatalog(catalog);
    renderShowcase();

    this.lastCatalogStatus = {
      ok: true,
      groupsAccepted: catalog.groups.length,
      productsAccepted: catalog.products.length
    };
  },

  getCatalogStatusJson: function () {
    return JSON.stringify(this.lastCatalogStatus);
  }
};
```

Фактическая реализация уже находится в:

```text
public/diagnostics/1c-html-shell/index.html
```

## Runtime delivery

Каталог в runtime передаётся только нативно из 1С в HTML.

Разрешено:

```text
Primary:
1С -> direct JS call -> window.Showcase.receiveCatalog(catalogJsonString)

Fallback:
1С -> DOM mailbox -> HTML читает mailbox -> receiveCatalog()

Last resort:
1С формирует HTML/макет/строку с embedded catalog и загружает это в Поле HTML-документа
```

Запрещено:

- ручная вставка JSON в `textarea`;
- ручная загрузка JSON-файла пользователем;
- service panel для ручной вставки JSON;
- пользовательский manual JSON import;
- HTML-запрос напрямую в базу 1С;
- HTML-запрос напрямую в OData как основной путь.

Sample fixture допустим только для dev/test/autotest и как пример формата. Это не пользовательский сценарий и не runtime fallback.

## DOM mailbox fallback

Если direct JS call не работает, 1С может записать JSON в скрытый DOM-узел:

```text
#showcase-catalog-mailbox
```

Затем 1С меняет атрибут:

```text
data-updated-at
```

HTML считывает mailbox, вызывает тот же `receiveCatalog()` и пишет результат в:

```text
#showcase-catalog-result-mailbox
```

Это всё ещё native 1С -> HTML delivery. Пользователь JSON руками не вставляет.

## Что передать в receiveCatalog()

Root:

```json
{
  "contractVersion": "0.1",
  "source": "1c",
  "generatedAt": "2026-05-21T12:00:00",
  "catalogId": "showcase-default",
  "currency": "RUB",
  "groups": [],
  "products": []
}
```

Group:

```json
{
  "id": "group-drinks",
  "title": "Напитки",
  "sortOrder": 10,
  "visible": true,
  "image": null,
  "icon": null
}
```

Для корневой группы `parentId` можно не передавать. Это нормальный вариант для 1С, если JSON-писатель неудобно пишет `null`. HTML воспримет отсутствие поля как `null`. Не передавайте строку `"null"`.

Product:

```json
{
  "id": "product-001",
  "groupId": "group-drinks",
  "title": "Вода питьевая 0,5 л",
  "shortTitle": "Вода 0,5 л",
  "price": 45,
  "currency": "RUB",
  "image": null,
  "badges": [],
  "available": true,
  "visible": true,
  "requiresStaff": false,
  "ageRestrictedMock": false,
  "sortOrder": 10
}
```

`id` и `groupId` - безопасные витринные идентификаторы. Не внутренние ссылки 1С.

Подробный контракт: [`1C_SHOWCASE_CATALOG_DATA_CONTRACT.md`](1C_SHOWCASE_CATALOG_DATA_CONTRACT.md).

## Что вернёт HTML

Проверять:

```text
window.Showcase.getCatalogStatusJson()
```

Пример:

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

Если JSON невалидный, `ok=false`, а последний валидный каталог не должен ломаться.

## Slice 1 и Slice 2

Slice 1:

- диагностическая страница;
- проверка HTML-render/V8WebKit;
- showcase runtime;
- `mode=diagnostic` / `mode=showcase`;
- mock-витрина;
- visual contract;
- приём каталога через `window.Showcase.receiveCatalog()`;
- отображение групп и товаров из безопасного каталога 1С;
- demo-корзина остаётся HTML/mock;
- demo-оплата остаётся HTML/mock;
- РМК не подключён.

Slice 2:

- отдельный будущий этап;
- проверка полноценного обмена HTML ↔ 1С;
- Diagnostic Loader / bridge probe;
- production bridge позже.

Не путать:

- `receiveCatalog()` - inbound catalog update для витринного UI;
- это не production bridge;
- это не `cart.addProduct`;
- это не `payment.startCard`;
- это не `receipt.getStatus`.

## Медиа и картинки

Тему публикации картинок пока не развиваем.

- `image=null` допустимо;
- HTML показывает placeholder;
- реальные картинки / media delivery - отдельный будущий вопрос;
- внутренние ссылки 1С на картинки передавать нельзя;
- обязательный media delivery path сейчас не добавляется.

## Что нельзя передавать

Не передавайте в каталог:

- внутренние ссылки 1С;
- GUID/UUID, если раскрывают структуру базы;
- себестоимость;
- закупочные цены;
- остатки без отдельного решения;
- персональные данные;
- чеки;
- оплаты;
- фискальные данные;
- токены;
- строки подключения;
- технические имена регистров/документов;
- служебные комментарии сотрудников;
- коммерческие внутренние данные клиента.

## Минимальный чек-лист

- [ ] Открыт URL `mode=showcase` в `Поле HTML-документа`.
- [ ] `window.Showcase` существует.
- [ ] `getRuntimeInfo()` возвращает `ready=true` и `mode=showcase`.
- [ ] 1С сформировала JSON-строку по контракту `0.1`.
- [ ] Вызван `receiveCatalog(jsonString)`.
- [ ] Группы и товары на экране заменились.
- [ ] `getCatalogStatusJson()` вернул `ok=true`.
- [ ] В статусе есть число принятых групп и товаров.
- [ ] Товар без картинки показывает placeholder.
- [ ] Нет ручной вставки JSON пользователем.
- [ ] РМК, чек, оплата, ККТ и фискализация не затронуты.
