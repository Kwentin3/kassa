# BOLARS TZ Docs Alignment Closure

Дата: 2026-05-23

Основание:

- опорное ТЗ, переданное пользователем 2026-05-23;
- `docs/reports/2026-05-23/BOLARS_TZ_DOCS_DIVERGENCE_AUDIT.report.md`.

## Что Исправлено

### Canonical TZ

- `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md` приведён ближе к опорному ТЗ.
- `mock-only` убран из определения продукта.
- Добавлены общие элементы рабочих экранов: header, cancel, text scale, manager badge.
- Добавлены полные правила цветов, цветовых профилей и применения цветов по экранам.
- Добавлен scanner-router как единая логика обработки товара, скидки, менеджера, unknown code и Честного знака.
- Добавлено поведение стартового экрана по касанию: переход в корзину.
- Добавлены детали корзины: номер позиции, сумма по строке, integer quantity для MVP.
- Добавлены детали поиска: 1С/runtime adapter, поля поиска, candidate fields.
- Добавлены детали скидки, SMS-code non-use, default copy.
- Добавлены timeout default `5 минут`, activity list и payment guard.
- Добавлены управляемые параметры interface/theme/search/scanner/payment/discount.
- Добавлены системные состояния из опорного ТЗ.

### PRD

- PRD теперь описывает этап prototype MVP, где `MockAdapter` допустим как способ воспроизведения внешних контуров.
- Product contract больше не подменяется mock-only трактовкой.
- Добавлены `startPurchase`, source search fields, integer quantity, timeout semantics, theme load states.
- Добавлена default RU copy table.

### Runtime Contract

- Добавлена команда `startPurchase`.
- Добавлен `terminalStatus`.
- Добавлены `positionNumber` и `quantityMode` в `CartLine`.
- Расширен `SearchState` и `SearchCandidate` под поля из ТЗ.
- Расширен `UiConfig` под search config, package buttons, timeout config и payment wait config.
- `ThemeProfileState` приведён к `bolars-light-default`, `bolars-light-contrast`, `custom`, optional dark.
- Добавлен `Inactivity Timeout Contract`.
- MVP subset обновлён под tap start screen и timeout guard.

### Theme / Screen / Checklist / Index

- Theme profiles приведены к опорному ТЗ: Light required, Contrast/Custom reserved, dark optional.
- Screen spec получил start tap, cart ordinal, integer quantity, search fields, cancel labels, payment timeout guard.
- Acceptance checklist обновлён под prototype MVP, timeout default, theme states и source search requirements.
- `docs/README.md` уточняет, что 1С/search, лояльность и эквайринг являются runtime/adapter контурами, а UI не вызывает их напрямую.

## Оставшиеся Открытые Вопросы

- Маркированные товары / Честный знак.
- Официальный брендбук БОЛАРС.
- Финальная integration architecture с 1С.
- Реальный платёжный адаптер.
- ККТ, фискализация, ОФД и legal receipt flow.
- Production theme/admin tooling.

## Статус

Documentation pack приведён к этапу prototype MVP и опорному ТЗ. Следующий implementation agent должен начинать чтение с `docs/README.md`, затем `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md` и `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`.
