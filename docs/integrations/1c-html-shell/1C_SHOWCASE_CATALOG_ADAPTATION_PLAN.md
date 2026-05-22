# 1C Showcase Catalog Adaptation Plan

Дата: 2026-05-22
Статус: план Slice 1, runtime API уже реализован в `public/diagnostics/1c-html-shell/index.html`

## Цель

Заменить mock-группы и mock-товары HTML-витрины безопасным каталогом из 1С.

Не меняем кассовый scope:

- корзина остаётся HTML/mock;
- оплата остаётся HTML/mock;
- чек остаётся HTML/mock;
- РМК, ККТ, фискализация и маркировка не подключаются;
- production bridge не проектируется.

## Короткая схема

```text
1С safe catalog JSON
-> window.Showcase.receiveCatalog(jsonString)
-> HTML validate/normalize
-> showcaseCategories/showcaseProducts
-> renderShowcase()
```

Запрещённая схема:

```text
HTML -> база 1С / OData / РМК / чек / оплата / ККТ
```

## Кто за что отвечает

| Область | Ответственный |
|---|---|
| Подготовить безопасный JSON каталога | 1С |
| Подготовить safe `id` и `groupId` | 1С |
| Открыть URL в `Поле HTML-документа` | 1С |
| Вызвать `window.Showcase.receiveCatalog(jsonString)` | 1С |
| Проверить `getCatalogStatusJson()` | 1С |
| Создать `window.Showcase` | HTML |
| Проверить JSON | HTML |
| Показать группы и товары | HTML |
| Показать placeholder для `image=null` | HTML |
| Demo-корзина и demo-оплата | HTML/mock |
| РМК, чек, ККТ, фискализация | Не входит |

`window.Showcase.*` - это JavaScript-методы HTML-страницы, не методы платформы 1С.

## Что уже есть в runtime

В `public/diagnostics/1c-html-shell/index.html` уже есть:

- `mode=diagnostic` и `mode=showcase`;
- `window.Showcase`;
- `getRuntimeInfo()`;
- `receiveCatalog(catalogJson)`;
- `getCatalogStatusJson()`;
- `getCatalogStatus()`;
- `clearCatalog()`;
- direct JS call path;
- DOM mailbox fallback;
- embedded initial catalog hook;
- валидация и нормализация каталога;
- placeholder для товара без картинки;
- запрет manual catalog import UI в showcase.

## Runtime delivery

Каталог в runtime передаётся только нативно из 1С в HTML.

Primary:

```text
1С -> direct JS call -> window.Showcase.receiveCatalog(catalogJsonString)
```

Fallback:

```text
1С -> DOM mailbox -> HTML читает mailbox -> receiveCatalog()
```

Last resort:

```text
1С формирует HTML/макет/строку с embedded catalog и загружает это в Поле HTML-документа
```

Не делать:

- ручной импорт JSON;
- вставку JSON в `textarea`;
- загрузку JSON-файла пользователем;
- service panel для ручной вставки каталога;
- HTML-запрос в базу 1С;
- HTML-запрос в OData как основной путь.

Developer fixture разрешён только для dev/test/autotest.

## Контракт данных

Основной документ:

```text
docs/integrations/1c-html-shell/1C_SHOWCASE_CATALOG_DATA_CONTRACT.md
```

Минимально:

- root: `contractVersion`, `source`, `generatedAt`, `catalogId`, `currency`, `groups`, `products`;
- group: `id`, `title`, `sortOrder`, `visible`;
- product: `id`, `groupId`, `title`, `price`, `currency`, `available`, `visible`, `sortOrder`;
- `id` и `groupId` - safe display ids, не внутренние ссылки 1С;
- `image=null` допустимо.

## Медиа и картинки

Пауза до отдельного разговора с 1С-специалистами.

- `image=null` - нормальное состояние;
- HTML показывает placeholder;
- внутренние ссылки 1С на картинки не передавать;
- обязательный media delivery path не добавлять;
- подробный media contract сейчас не развивать.

## Slice 1

Входит:

- диагностическая страница;
- `mode=diagnostic` / `mode=showcase`;
- mock-витрина;
- visual contract;
- `window.Showcase.receiveCatalog()`;
- отображение групп и товаров из безопасного каталога 1С;
- status через `getCatalogStatusJson()`;
- DOM mailbox fallback;
- demo-корзина HTML/mock;
- demo-оплата HTML/mock.

Не входит:

- production bridge;
- `cart.addProduct`;
- `payment.startCard`;
- `receipt.getStatus`;
- РМК;
- чек;
- оплата;
- ККТ;
- фискализация;
- маркировка;
- media delivery.

## Slice 2

Slice 2 - будущий отдельный этап:

- Diagnostic Loader;
- bridge probe;
- полноценная проверка HTML ↔ 1С;
- позже production bridge.

`receiveCatalog()` не является Slice 2 production bridge. Это inbound catalog update для витринного UI в Slice 1.

## Проверки для 1С-специалиста

Минимальный набор:

- маленький каталог: 2 группы / 5 товаров;
- 20-50 товаров;
- 100 товаров;
- кириллица;
- длинные названия;
- `image=null`;
- `visible=false`;
- `available=false`;
- invalid JSON;
- товар с неизвестным `groupId`;
- товар без `price`;
- payload size;
- direct return value;
- `getCatalogStatusJson()`;
- DOM mailbox fallback.

Зафиксировать:

- direct JS call работает или нет;
- return value доступен или нет;
- какой максимальный payload прошёл стабильно;
- понадобился ли DOM mailbox fallback;
- вернулся ли `ok=true`;
- сколько групп и товаров принято;
- какие ошибки вернулись;
- скриншот витрины после применения каталога.

## Acceptance

Готово, если:

- 1С открывает URL `mode=showcase`;
- `window.Showcase.getRuntimeInfo()` возвращает `ready=true`;
- 1С вызывает `receiveCatalog(jsonString)`;
- HTML заменяет группы и товары без перезагрузки;
- `getCatalogStatusJson()` возвращает статус;
- manual JSON import отсутствует;
- картинок может не быть, placeholder работает;
- РМК, чек, оплата, ККТ и фискализация не подключены.
