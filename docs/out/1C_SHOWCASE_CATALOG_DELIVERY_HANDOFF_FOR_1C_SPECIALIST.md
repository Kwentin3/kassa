# Handoff: передача каталога 1С в HTML-витрину

## 1. Что мы хотим

Нужно, чтобы 1С передала HTML-витрине список групп и товаров для отображения на экране самообслуживания.

HTML-витрина:

- не ходит в базу 1С;
- не читает OData;
- не получает внутренние ссылки объектов 1С;
- принимает только безопасный JSON витрины;
- рисует группы и карточки товаров;
- не выполняет РМК, оплату, ККТ, чек, фискализацию и маркировку.

Каталог в runtime передаётся только нативно из 1С в HTML. Пользователь не загружает и не вставляет JSON вручную.

## 2. Общая схема

1С открывает HTML-витрину:

```text
https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=showcase&runId=<id>&terminalLabel=<label>
```

1С ждёт готовности страницы.

1С формирует JSON каталога.

1С вызывает:

```javascript
window.Showcase.receiveCatalog(catalogJsonString)
```

HTML проверяет каталог, применяет его и перерисовывает витрину.

1С получает статус:

```javascript
window.Showcase.getCatalogStatusJson()
```

## 3. Что открыть

URL:

```text
https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=showcase&runId=<id>&terminalLabel=<label>
```

`runId` - безопасный идентификатор теста или запуска.

`terminalLabel` - безопасная метка терминала, например номер тестового рабочего места.

Не передавайте секреты, токены, строки подключения или внутренние ссылки 1С в URL.

## 4. Когда передавать каталог

Сначала дождитесь события формирования/загрузки HTML-документа в Поле HTML-документа.

Затем проверьте публичный API:

```javascript
window.Showcase.getRuntimeInfo()
```

Каталог передавайте только когда:

```json
{
  "ready": true,
  "mode": "showcase"
}
```

Если `ready=false`, подождите и проверьте ещё раз. Витрина создаёт ранний `window.Showcase` stub, но применять каталог нужно после готовности runtime.

## 5. Как передать каталог

Основной способ:

```javascript
window.Showcase.receiveCatalog(catalogJsonString)
```

`catalogJsonString` - строка JSON, которую сформировала 1С. Для 1С-контракта передаём именно строку, не HTML-файл и не ввод пользователя.

После вызова можно сразу запросить статус:

```javascript
window.Showcase.getCatalogStatusJson()
```

## 6. В каком виде отдавать данные

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
  "parentId": null,
  "title": "Напитки",
  "sortOrder": 10,
  "visible": true,
  "image": null,
  "icon": null
}
```

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

`id` и `groupId` должны быть opaque string. HTML не должен знать внутренние ссылки объектов 1С.

## 7. Какие поля обязательны

Группа:

- `id`;
- `title`;
- `sortOrder`;
- `visible`.

Товар:

- `id`;
- `groupId`;
- `title`;
- `price`;
- `currency`;
- `available`;
- `visible`;
- `sortOrder`.

Optional поля товара:

- `shortTitle`;
- `image`;
- `badges`;
- `requiresStaff`;
- `ageRestrictedMock`;
- `description`;
- `barcode`;
- `unit`;
- `quantityStep`.

## 8. Что запрещено передавать

Не передавайте в HTML:

- внутренние ссылки объектов 1С;
- GUID/UUID, если они раскрывают структуру базы;
- себестоимость;
- закупочные цены;
- остатки без отдельного решения;
- персональные данные;
- данные чеков;
- данные оплат;
- фискальные данные;
- токены;
- строки подключения;
- технические имена регистров/документов;
- служебные комментарии сотрудников;
- коммерческие внутренние данные клиента.

## 9. Что HTML вернёт

После передачи каталога вызовите:

```javascript
window.Showcase.getCatalogStatusJson()
```

Пример ответа:

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

Если JSON невалидный, `ok=false`, а текущий валидный каталог на экране не ломается.

## 10. Что считается успехом

Успех:

- витрина открылась;
- `window.Showcase` существует;
- `getRuntimeInfo()` возвращает `ready=true`;
- `mode=showcase`;
- `receiveCatalog()` вызван без ошибки;
- группы на экране заменились на группы из 1С;
- товары на экране заменились на товары из 1С;
- `getCatalogStatusJson()` показывает `ok=true`;
- РМК, оплата, чек, ККТ и фискализация не затронуты.

## 11. Что делать, если прямой вызов не работает

Fallback: DOM mailbox.

1С записывает JSON в скрытый DOM-узел:

```text
#showcase-catalog-mailbox
```

Затем 1С меняет атрибут:

```text
data-updated-at
```

HTML сам считывает содержимое узла и вызывает тот же `receiveCatalog()`.

Результат HTML пишет в:

```text
#showcase-catalog-result-mailbox
```

Это тоже нативная передача 1С -> HTML. Пользователь не вставляет JSON вручную.

## 12. Что не делать

Не делать:

- ручной импорт JSON;
- вставку JSON в textarea;
- загрузку JSON-файла пользователем;
- service panel для ручной вставки каталога;
- HTML-запрос в базу 1С;
- HTML-запрос в OData как основной путь;
- передачу внутренних ссылок 1С;
- вызов `cart.*`, `payment.*`, `receipt.*`;
- РМК;
- оплату;
- ККТ;
- чек;
- фискализацию;
- маркировку.

## 13. Минимальный spike

Проверьте на целевой версии платформы 1С и на целевом клиенте:

- маленький каталог: 2 группы / 5 товаров;
- каталог 20-50 товаров;
- каталог 100 товаров;
- кириллицу;
- длинные названия;
- товар без картинки;
- `visible=false`;
- `available=false`;
- invalid catalog;
- payload size;
- доступность return value от `receiveCatalog()`;
- чтение `getCatalogStatusJson()`;
- DOM mailbox fallback.

Зафиксируйте:

- direct JS call работает или нет;
- return value доступен или нет;
- какой максимальный payload прошёл стабильно;
- понадобился ли DOM mailbox fallback;
- вернулся ли `ok=true`;
- сколько групп и товаров принято;
- какие ошибки вернулись;
- скриншот витрины после применения каталога.

## 14. Краткая памятка в 7 шагов

1. Откройте URL витрины в Поле HTML-документа.
2. Дождитесь загрузки документа.
3. Проверьте `window.Showcase.getRuntimeInfo()`.
4. Сформируйте JSON каталога по контракту `0.1`.
5. Вызовите `window.Showcase.receiveCatalog(jsonString)`.
6. Проверьте `window.Showcase.getCatalogStatusJson()`.
7. Верните команде статус, ошибки, размер JSON и скриншот витрины.
