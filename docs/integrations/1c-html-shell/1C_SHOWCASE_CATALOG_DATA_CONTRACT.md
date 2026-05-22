# 1C Showcase Catalog Data Contract

Дата: 2026-05-22
Статус: draft v0.1 для Slice 1

## Назначение

Этот контракт описывает безопасный JSON-каталог, который 1С передаёт HTML-витрине.

HTML-витрина:

- принимает JSON-строку через `window.Showcase.receiveCatalog(jsonString)`;
- проверяет базовую структуру;
- показывает группы и товары;
- показывает placeholder, если `image=null`;
- не ходит в базу 1С;
- не читает OData как основной путь;
- не получает внутренние ссылки объектов 1С;
- не выполняет РМК, чек, оплату, ККТ, фискализацию и маркировку.

## Delivery rule

Каталог в runtime передаётся только нативно из 1С в HTML.

Разрешено:

- primary: 1С вызывает `window.Showcase.receiveCatalog(catalogJsonString)`;
- fallback: 1С пишет JSON в DOM mailbox, HTML читает mailbox и вызывает `receiveCatalog()`;
- last resort: 1С формирует HTML/макет/строку с embedded catalog и загружает это в `Поле HTML-документа`.

Запрещено:

- ручная вставка JSON в `textarea`;
- ручная загрузка JSON-файла пользователем;
- service panel для ручной вставки JSON;
- пользовательский manual JSON import;
- HTML-запрос напрямую в базу 1С;
- HTML-запрос напрямую в OData как основной runtime path.

Sample fixture допустим только для dev/test/autotest и как пример формата.

## Root

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

Обязательные поля:

| Поле | Тип | Правило |
|---|---|---|
| `contractVersion` | string | Сейчас `"0.1"` |
| `source` | string | Сейчас `"1c"` |
| `generatedAt` | string | ISO 8601 datetime |
| `catalogId` | string | Безопасный id витринного каталога |
| `currency` | string | Сейчас `"RUB"` |
| `groups` | array | Массив групп |
| `products` | array | Массив товаров |

## Group

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

Обязательные поля группы:

- `id`;
- `title`;
- `sortOrder`;
- `visible`.

Правила:

- `id` - безопасный витринный идентификатор, не внутренняя ссылка 1С;
- `title` - публичное название группы;
- `sortOrder` - число, чем меньше, тем раньше группа;
- `visible=false` означает не показывать группу;
- `parentId`, `image`, `icon` optional;
- для корневой группы `parentId` можно не передавать; HTML трактует отсутствующий `parentId` как `null`;
- не передавайте строку `"null"` вместо `null`;
- вложенность групп в текущем UI не является обязательной.

## Product

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

Обязательные поля товара:

- `id`;
- `groupId`;
- `title`;
- `price`;
- `currency`;
- `available`;
- `visible`;
- `sortOrder`.

Правила:

- `id` - безопасный витринный идентификатор, не внутренняя ссылка 1С;
- `groupId` должен указывать на существующую visible-группу;
- `title` - публичное название товара;
- `price` - число в основных единицах валюты, например `45` или `45.5`;
- `currency` сейчас должна совпадать с root `currency`;
- `available=false` в первом срезе не показывается в production-like каталоге;
- `visible=false` не показывается;
- `sortOrder` - число, чем меньше, тем раньше товар;
- `badges` - короткие публичные строки, без внутренних кодов;
- `requiresStaff` и `ageRestrictedMock` - demo-флаги, не реальная авторизация.

Optional поля:

- `shortTitle`;
- `image`;
- `badges`;
- `requiresStaff`;
- `ageRestrictedMock`;
- `description`;
- `barcode`;
- `unit`;
- `quantityStep`.

## Медиа и картинки

Пока не развиваем отдельный media contract.

- `image=null` допустимо;
- HTML показывает placeholder;
- реальная публикация картинок - отдельный будущий вопрос;
- внутренние ссылки 1С на картинки передавать нельзя;
- обязательный media delivery path сейчас не добавляется.

Если где-то понадобится подробный media contract, его нужно пометить как `paused / needs 1C media contour clarification`, пока 1С-специалисты не подтвердят источник, хранение и допустимый контур доставки.

## Что нельзя передавать

Нельзя передавать в каталог:

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

Если 1С нужен стабильный идентификатор, подготовьте отдельный безопасный витринный `id`.

## Минимальная валидация HTML

HTML должен проверить:

- `contractVersion === "0.1"`;
- `source === "1c"`;
- `currency === "RUB"`;
- `groups` и `products` являются массивами;
- обязательные поля групп и товаров присутствуют;
- `id` и `groupId` не пустые;
- `price` и `sortOrder` являются числами;
- товар с неизвестным `groupId` не показывается;
- `visible=false` не показывается;
- `available=false` не показывается в первом production-like каталоге;
- `image=null` показывает placeholder;
- технический JSON, stack trace и внутренние ошибки не показываются покупателю.

## Сортировка

Группы:

```text
visible groups -> sortOrder asc -> title asc
```

Товары:

```text
visible + available products -> groupId match -> sortOrder asc -> title asc
```

`sortOrder` задаёт порядок, а не позицию в массиве. 1С может выгружать массивы в любом порядке.

## Пример минимального каталога

```json
{
  "contractVersion": "0.1",
  "source": "1c",
  "generatedAt": "2026-05-21T12:00:00",
  "catalogId": "showcase-default",
  "currency": "RUB",
  "groups": [
    {
      "id": "group-drinks",
      "title": "Напитки",
      "sortOrder": 10,
      "visible": true,
      "image": null,
      "icon": null
    }
  ],
  "products": [
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
  ]
}
```

## Статус применения

1С проверяет результат через:

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
  "groupsAccepted": 1,
  "productsAccepted": 1,
  "productsSkipped": 0,
  "errors": []
}
```

## Versioning

`contractVersion: "0.1"` - первый безопасный витринный каталог.

Совместимые изменения:

- добавление optional полей;
- добавление новых публичных badge values;
- увеличение числа групп/товаров в разумных пределах.

Несовместимые изменения:

- переименование обязательных полей;
- смена типа `price`;
- добавление кассовых команд в каталог;
- превращение catalog contract в production bridge.

Чек, оплата, РМК и production bridge должны иметь отдельные контракты, не расширение этого каталога.
