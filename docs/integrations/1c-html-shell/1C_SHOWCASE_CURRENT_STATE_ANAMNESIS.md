# 1C Showcase Current State Anamnesis

Дата: 2026-05-22
Статус: краткое описание текущего runtime после добавления `window.Showcase.receiveCatalog()`

## Назначение

Документ фиксирует, как сейчас устроена HTML-витрина и какую часть заменяет безопасный каталог из 1С.

Главная граница:

```text
Каталог можно заменить.
Кассовые операции остаются mock-only.
```

## Где runtime

Файл:

```text
public/diagnostics/1c-html-shell/index.html
```

Публичный URL:

```text
https://kassa.speechbattle.com/diagnostics/1c-html-shell
```

Режимы:

```text
/diagnostics/1c-html-shell?mode=diagnostic
/diagnostics/1c-html-shell?mode=showcase
```

`mode=diagnostic` показывает диагностическую страницу.
`mode=showcase` показывает HTML-витрину.

## Что делает кнопка "Открыть витрину"

Кнопка меняет URL на:

```text
/diagnostics/1c-html-shell?mode=showcase
```

Она не вызывает 1С bridge, РМК, оплату или чек. Это только переход между режимами одной HTML-страницы.

## Текущий публичный API HTML

HTML создаёт:

```text
window.Showcase
```

Доступные методы:

- `getRuntimeInfo()`;
- `receiveCatalog(catalogJson)`;
- `getCatalogStatusJson()`;
- `getCatalogStatus()`;
- `clearCatalog()`.

Важно: `window.Showcase.*` - это JavaScript-методы HTML-страницы. Это не нативные методы 1С. 1С вызывает их через `Поле HTML-документа -> Документ -> defaultView/window`.

## Что сейчас можно заменить каталогом 1С

Можно заменить:

- группы;
- товары;
- порядок групп и товаров;
- видимость групп и товаров;
- доступность товара;
- бейджи;
- demo-флаги `requiresStaff` и `ageRestrictedMock`;
- placeholder для товара без картинки.

Нельзя заменить этим контрактом:

- РМК;
- текущий чек;
- оплату;
- ККТ;
- фискализацию;
- маркировку;
- production bridge;
- остатки без отдельного решения;
- медиа-доставку картинок.

## Mock-группы

В исходном mock-наборе группы создаются в `initShowcaseData()`:

| id | title |
|---|---|
| `popular` | Популярное |
| `bakery` | Выпечка |
| `milk` | Молочное |
| `drinks` | Напитки |
| `fruit` | Фрукты |
| `ready` | Готовая еда |
| `household` | Для дома |

После `receiveCatalog()` источник меняется на группы из JSON 1С.

## Mock-товары

В исходном mock-наборе:

- вручную описаны товары `p001`-`p032`;
- товары `p033`-`p100` генерируются для визуальной проверки большого каталога.

Пример фактического mock-объекта:

```js
{
  id: "p001",
  categoryId: "popular",
  title: "Вода питьевая негазированная 0,5 л",
  shortTitle: "Вода",
  price: 49,
  badges: ["Хит"],
  imageText: "В",
  tone: "blue"
}
```

После `receiveCatalog()` источник меняется на товары из JSON 1С.

## Соответствие полей

| Runtime сейчас | В контракте 1С | Комментарий |
|---|---|---|
| `id` | `id` | Safe display id |
| `categoryId` | `groupId` | Safe display group id |
| `title` | `title` | Публичное название |
| `shortTitle` | `shortTitle` | Optional |
| `price` | `price` | Demo-цена для витрины |
| `badges` | `badges` | Optional public labels |
| `imageText` / `noImage` | `image` | `image=null` -> placeholder |
| `available` | `available` | `false` не показывается в первом production-like каталоге |
| `requiresStaff` | `requiresStaff` | Demo-флаг |
| `ageRestrictedMock` | `ageRestrictedMock` | Demo-флаг |
| `generated` | нет | Только mock visual test |
| `tone` | нет | Не включать в контракт |

## Что происходит при receiveCatalog()

HTML:

1. принимает JSON-строку или object;
2. парсит JSON;
3. проверяет root/group/product;
4. фильтрует скрытые и недоступные позиции;
5. сортирует по `sortOrder`;
6. заменяет `showcaseCategories` и `showcaseProducts`;
7. очищает demo-корзину;
8. перерисовывает витрину;
9. сохраняет статус.

Статус читает 1С:

```text
window.Showcase.getCatalogStatusJson()
```

## Что остаётся mock-only

Остаётся HTML/mock:

- корзина;
- итог корзины;
- добавление товара;
- изменение количества;
- удаление строки;
- 10+ строк в корзине;
- demo-оплата;
- demo-СБП;
- demo-чек;
- ошибки оплаты/чека;
- вызов сотрудника;
- возрастное ограничение;
- ошибка изменения количества;
- экранная клавиатура.

Это не кассовая истина и не РМК.

## Медиа и картинки

Пока на паузе:

- `image=null` допустимо;
- HTML показывает placeholder;
- реальные картинки требуют отдельного решения по источнику, хранению и доставке;
- внутренние ссылки 1С на картинки передавать нельзя;
- новый media contract не добавляется.

## Developer fixture

Файл:

```text
docs/integrations/1c-html-shell/fixtures/showcase-catalog.1c.sample.json
```

Назначение:

- пример формата;
- локальный dev/test;
- автотесты;
- smoke.

Не назначение:

- не runtime fallback;
- не пользовательская загрузка JSON;
- не требование к 1С-специалисту вставлять JSON руками.

## Slice 1 / Slice 2

В текущем runtime `receiveCatalog()` относится к Slice 1.

Slice 2 - будущая отдельная проверка Diagnostic Loader / bridge probe для HTML ↔ 1С. Она не смешивается с каталогом и не делает production bridge.

`receiveCatalog()` не является:

- `cart.addProduct`;
- `payment.startCard`;
- `receipt.getStatus`;
- РМК-командой;
- кассовым bridge.
