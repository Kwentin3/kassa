# 1C Direct Catalog Delivery Refine Report

Дата: 2026-05-21
Статус: completed

## Что изменено

- Убран `manual JSON import` как fallback из `1C_TO_HTML_DIRECT_CATALOG_DELIVERY_RESEARCH.md`.
- Переписан этап A в `1C_SHOWCASE_CATALOG_ADAPTATION_PLAN.md`: теперь это только dev fixture / contract smoke, без пользовательского импорта.
- В `1C_SHOWCASE_CATALOG_DATA_CONTRACT.md` добавлены delivery constraints.
- В `1C_SHOWCASE_CURRENT_STATE_ANAMNESIS.md` уточнено, что fixture допустим только для dev/test.
- Во все релевантные документы добавлено правило: runtime delivery только native 1С -> HTML.

## Закрепленные native paths

- Primary: 1С вызывает `window.Showcase.receiveCatalog(catalogJson)` через direct JS call.
- Native fallback: 1С пишет catalog JSON в DOM mailbox, HTML читает и вызывает `receiveCatalog()`.
- Last resort: 1С формирует HTML/макет/строку с embedded catalog и загружает это в `Поле HTML-документа`.

## Dev/test only

Sample JSON fixture разрешен только для разработки, автотестов, smoke и объяснения формата 1С-программисту.

Fixture не является runtime fallback, пользовательским сценарием или способом ручной загрузки JSON в HTML.

## Остаточные риски

- Direct JS call зависит от версии платформы 1С, клиента, режима совместимости и HTML engine.
- Нужно проверить доступ к `Document.defaultView`, return value и `getCatalogStatus()` на реальном терминале.
- Нужно измерить safe payload limit для 20-50, 100 и больших каталогов.
- DOM mailbox и embedded catalog тоже требуют spike на целевой 1С-среде.
