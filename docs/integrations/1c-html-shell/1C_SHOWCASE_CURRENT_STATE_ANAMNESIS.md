# 1C Showcase Current State Anamnesis

Дата: 2026-05-21
Статус: подготовка перехода от mock-каталога к безопасному каталогу 1С; runtime API `window.Showcase.receiveCatalog()` добавлен первым срезом

## Назначение

Этот документ фиксирует, как сейчас устроена тестовая HTML-витрина внутри 1С, какие mock-данные она использует и какую часть можно заменить первым реальным каталогом 1С без подключения РМК, чека, оплаты, ККТ, фискализации и маркировки.

## Non-negotiable Rule

Каталог в runtime передается только нативно из 1С в HTML.
Пользователь не загружает и не вставляет JSON вручную.

## Где находится runtime

Showcase runtime находится в одном HTML-файле:

```text
public/diagnostics/1c-html-shell/index.html
```

Это single-file compatible artifact для диагностики и витрины. Он содержит HTML, CSS, classic JavaScript, mock-данные, state machine, рендеринг карточек, корзину, mock-оплату и служебные экраны.

Публичный путь:

```text
/diagnostics/1c-html-shell
```

Демо-домен:

```text
https://kassa.speechbattle.com/diagnostics/1c-html-shell
```

## Как открывается mode=showcase

Режим выбирается query-параметром `mode`.

```text
/diagnostics/1c-html-shell?mode=diagnostic
/diagnostics/1c-html-shell?mode=showcase
```

Текущая логика:

- `getRuntimeMode()` принимает только `showcase`, иначе открывает `diagnostic`;
- `applyRuntimeMode()` переключает CSS-класс `diagnostic-mode` / `showcase-mode`;
- кнопка **"Открыть витрину"** ведет на `mode=showcase`;
- `buildModeUrl()` сохраняет `runId`, `terminalLabel`, `build`, `v`, `verdictScope`;
- при `mode=showcase` `boot()` вызывает `bootShowcase()`, а не диагностические тесты.

## Где сейчас лежат mock-группы

Mock-группы зашиты в `initShowcaseData()` в массиве `showcaseCategories`.

Текущие группы:

| id | title |
|---|---|
| `popular` | Популярное |
| `bakery` | Выпечка |
| `milk` | Молочное |
| `drinks` | Напитки |
| `fruit` | Фрукты |
| `ready` | Готовая еда |
| `household` | Для дома |

Сейчас у группы реально используются только:

- `id`;
- `title`.

Сортировка идет порядком элементов в массиве. Вложенность групп не поддерживается UI, но ее можно добавить в контракт как безопасное поле `parentId` для vNext.

## Где сейчас лежат mock-товары

Mock-товары зашиты в `initShowcaseData()` в массиве `showcaseProducts`.

Вручную описаны товары `p001`-`p032`. Затем runtime генерирует товары `p033`-`p100` для визуальной проверки большого каталога.

Сейчас товар хранится в виде простого JS-объекта. Пример фактических полей:

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

## Как сейчас устроен CategoryGrid

Отдельного класса `CategoryGrid` нет. Роль компонента выполняет функция `renderCategories()`.

Она:

- читает `showcaseCategories`;
- рисует ряд кнопок `.showcase-category-button`;
- активную категорию определяет по `showcaseState.categoryId`;
- по клику вызывает action `category`;
- action меняет `showcaseState.categoryId` и переводит экран в `catalog`.

В первом переходе к 1С можно заменить источник `showcaseCategories`, не меняя визуальный компонент.

## Как сейчас устроен ProductGrid

Роль `ProductGrid` выполняет функция `renderProductGrid()`.

Она:

- получает список через `getVisibleProducts()`;
- рисует контейнер `.showcase-product-grid`;
- внутри вызывает `renderProductCard(product)` для каждого товара;
- если товаров нет, показывает buyer-safe mock-сообщение **"Товар не найден"**.

CSS для `.showcase-product-grid` уже задает внутренний scroll через `overflow: auto`, grid layout и стабильный minmax для карточек. Это важно сохранить при большом реальном каталоге.

`getVisibleProducts()` сейчас:

- ограничивает вывод 42 товарами в обычном режиме;
- показывает до 100 товаров в режиме visual test;
- скрывает generated-товары в обычном режиме;
- фильтрует по `categoryId`, кроме режима поиска;
- фильтрует поиск по `title` и `shortTitle`.

## Как сейчас устроен ProductCard

Отдельного класса `ProductCard` нет. Роль компонента выполняет функция `renderProductCard(product)`.

Карточка рисует:

- image/placeholder-зону `.showcase-product-image`;
- название `.showcase-product-title`;
- бейджи `.showcase-product-badges`;
- цену `.showcase-product-price`;
- action-кнопку внутри карточки.

Поведение:

- карточка сама является кликабельной поверхностью через `data-action="add-product"`;
- `Enter` и `Space` тоже вызывают action;
- если `paymentStatus === "processing"`, карточка disabled;
- если `requiresStaff` или `ageRestrictedMock`, текст действия становится **"Нужен сотрудник"**;
- если `available === false`, текст действия становится **"Показать ошибку"**;
- если `noImage === true`, показывается placeholder **"Нет фото"**;
- если нет `imageText`, используется `shortTitle` или `?`.

CSS-контракт карточки уже ограничивает высоту title/badges, держит цену видимой и не должен ломаться на длинных названиях.

## Как товар добавляется в mock-корзину

Клик по карточке вызывает `runShowcaseAction("add-product")`, затем `addShowcaseProduct(id)`.

`addShowcaseProduct()`:

- ищет товар через `findProduct(id)`;
- если товар не найден, открывает buyer-safe mock-ошибку;
- если `requiresStaff`, открывает mock-сценарий сотрудника;
- если `ageRestrictedMock`, открывает mock-сценарий сотрудника;
- если `available === false`, открывает mock-ошибку недоступности;
- если товар уже есть в корзине, увеличивает `qty`;
- если товара нет в корзине, добавляет line item в `showcaseState.cart`.

В строку mock-корзины копируются:

- `productId`;
- `title`;
- `qty`;
- `price`;
- `flags.quantityError`;
- `flags.requiresStaff`.

Итог корзины считается локально в HTML через `cartTotal()`. Это demo-итог, не кассовая истина.

## Какие поля mock-товара реально используются UI

| Поле | Где используется | Нужно ли в 1С-контракте |
|---|---|---|
| `id` | add-product, cart line lookup | Да |
| `categoryId` | фильтр категории | Да, как `groupId` |
| `title` | карточка, поиск, строка корзины | Да |
| `shortTitle` | поиск, fallback image text | Optional |
| `price` | карточка, корзина, demo total | Да |
| `badges` | бейджи карточки | Optional |
| `imageText` | placeholder текущей реализации | Нет, заменить на `image` или локальный placeholder |
| `noImage` | принудительный placeholder | Нет, выводится из `image === null` |
| `available` | блокирует добавление, mock-ошибка | Да |
| `requiresStaff` | mock-сценарий сотрудника | Optional |
| `ageRestrictedMock` | mock-сценарий сотрудника | Optional |
| `quantityError` | mock-ошибка изменения qty | Оставить mock-only |
| `generated` | visual test на 100 товаров | Оставить mock-only |
| `tone` | сейчас не используется рендером | Не включать в контракт |

## Какие edge-case товары уже есть

Текущий mock-набор уже проверяет:

- товар без изображения;
- длинное название;
- очень длинное название;
- короткое название;
- длинную цену;
- бейдж **"Акция"**;
- бейдж **"Новинка"**;
- бейдж **"Хит"**;
- товар **"нужен сотрудник"**;
- mock возрастное ограничение;
- товар `available=false`;
- строку корзины с очень длинным названием;
- mock-ошибку изменения количества;
- 10+ строк корзины;
- 100-card visual set.

Эти edge cases нужно сохранить как developer fixture для локальных dev/test проверок, чтобы проверять layout на данных, которые 1С обычно не даст в первом минимальном наборе. Такой fixture не является runtime fallback и не должен требовать ручной загрузки JSON пользователем в HTML.

## Что можно заменить на real catalog data

В первом срезе можно заменить только источник каталога:

- `showcaseCategories` -> группы из JSON 1С;
- `showcaseProducts` -> товары из JSON 1С;
- `categoryId` товара -> `groupId` из контракта;
- `imageText/noImage` -> `image` или placeholder;
- порядок массивов -> `sortOrder`;
- `badges`, `requiresStaff`, `ageRestrictedMock`, `available`, `visible` -> поля контракта;
- `getVisibleProducts()` -> фильтрация по валидированным real catalog data.

Можно добавить thin adapter:

```text
1C JSON -> validate -> normalize -> showcaseCategories/showcaseProducts -> render
```

Runtime-доставка real catalog data должна идти только нативно со стороны 1С: direct JS call `window.Showcase.receiveCatalog(catalogJson)`, DOM mailbox fallback или embedded catalog, сформированный 1С.

Важно: адаптер должен менять только витринный каталог, а не корзину, оплату или чек.

## Что пока должно остаться mock

Оставить mock-only:

- корзина;
- итог корзины;
- изменение количества;
- удаление строки;
- 10+ строк;
- оплата;
- СБП;
- чек;
- ошибки оплаты/чека;
- вызов сотрудника;
- `requiresStaff` как demo-состояние;
- `ageRestrictedMock` как demo-состояние;
- mock-ошибка изменения количества;
- режим редактирования;
- темы;
- экранная клавиатура;
- диагностический `diag.*` контур.

Не подключать на этом этапе:

- РМК;
- production bridge команд `cart.*`, `payment.*`, `receipt.*`;
- реальный чек;
- оплату;
- ККТ;
- фискализацию;
- маркировку;
- прямые запросы HTML в базу 1С;
- прямые запросы HTML в OData без отдельного решения.

## Риски при замене данных

Основные риски:

- 1С передаст внутренние ссылки объектов вместо opaque ids.
- Товар придет с `groupId`, которого нет среди групп.
- Придут пустые названия, отсутствующие цены или цены строкой с форматированием.
- Придут очень длинные названия и бейджи, которые сломают карточку.
- Придет слишком много товаров, и фильтр/сетка начнут тормозить в V8WebKit.
- В JSON случайно попадут закупочные цены, остатки, персональные данные, чеки, токены или технические имена регистров.
- `available=false` будет трактоваться как товар, который можно добавить в demo-корзину.
- HTML-итог mock-корзины будет ошибочно прочитан как production-расчет.
- Изображения будут недоступны внутри HTML-поля 1С или нарушат same-origin/сетевые ограничения.
- Переход к `receiveCatalog()` смешают с боевыми кассовыми командами.

Практическое правило для первого перехода: если каталог не прошел базовую валидацию, витрина должна сохранить последний валидный каталог или показать buyer-safe состояние пустого каталога. Нельзя пытаться чинить кассовые операции в HTML.
