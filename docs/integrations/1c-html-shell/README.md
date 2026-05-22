# 1C HTML Shell: карта документов

Эта папка про два разных направления:

- **Slice 1**: HTML-страница, диагностика V8WebKit, showcase runtime и передача безопасного каталога из 1С в HTML через `window.Showcase.receiveCatalog()`.
- **Slice 2**: будущий отдельный Diagnostic Loader для проверки полноценного обмена HTML ↔ 1С. Это не production bridge и не кассовые операции.

## Куда идти

1. Если вы 1С-специалист и хотите подключить каталог:
   [`1C_SHOWCASE_CATALOG_DELIVERY_HANDOFF_FOR_1C_SPECIALIST.md`](1C_SHOWCASE_CATALOG_DELIVERY_HANDOFF_FOR_1C_SPECIALIST.md)

2. Если нужен JSON-контракт каталога:
   [`1C_SHOWCASE_CATALOG_DATA_CONTRACT.md`](1C_SHOWCASE_CATALOG_DATA_CONTRACT.md)

3. Если нужно понять, как устроена текущая витрина:
   [`1C_SHOWCASE_CURRENT_STATE_ANAMNESIS.md`](1C_SHOWCASE_CURRENT_STATE_ANAMNESIS.md)

4. Если нужно понять, почему выбран direct JS call:
   [`1C_TO_HTML_DIRECT_CATALOG_DELIVERY_RESEARCH.md`](1C_TO_HTML_DIRECT_CATALOG_DELIVERY_RESEARCH.md)

5. Если нужно понять ограничения V8WebKit:
   [`runtime-profiles/1C_HTML_SHELL_RUNTIME_CAPABILITY_CONTRACT_V8WEBKIT.md`](runtime-profiles/1C_HTML_SHELL_RUNTIME_CAPABILITY_CONTRACT_V8WEBKIT.md)

6. Если нужно понять showcase PRD/Blueprint:
   [`PRD_1C_HTML_SHELL_SELF_CHECKOUT_SHOWCASE.md`](PRD_1C_HTML_SHELL_SELF_CHECKOUT_SHOWCASE.md) и [`BLUEPRINT_1C_HTML_SHELL_SELF_CHECKOUT_SHOWCASE.md`](BLUEPRINT_1C_HTML_SHELL_SELF_CHECKOUT_SHOWCASE.md)

7. Если нужен будущий Slice 2 Diagnostic Loader:
   [`1C_HTML_SHELL_DIAGNOSTIC_GUIDE_FOR_1C_SPECIALIST.md`](1C_HTML_SHELL_DIAGNOSTIC_GUIDE_FOR_1C_SPECIALIST.md) и [`1C_DIAGNOSTIC_LOADER_README.md`](1C_DIAGNOSTIC_LOADER_README.md)

## Самая короткая версия

Открыть URL делает 1С.

`window.Showcase` создаёт HTML-страница.

`window.Showcase.*` - это **не нативные методы 1С**. Это JavaScript-методы внутри нашей HTML-витрины. 1С вызывает их через `Поле HTML-документа -> Документ -> window/defaultView`.

Каталог формирует 1С и передаёт строкой:

```text
window.Showcase.receiveCatalog(jsonString)
```

HTML проверяет каталог, показывает группы и товары, а статус отдаёт через:

```text
window.Showcase.getCatalogStatusJson()
```

РМК, чек, оплата, ККТ, фискализация и production bridge здесь не участвуют.

## Что пока не развиваем

Картинки товаров пока на паузе:

- `image=null` допустимо;
- HTML показывает placeholder;
- реальные картинки и media delivery - отдельный будущий вопрос с 1С-специалистами;
- внутренние ссылки 1С на картинки передавать нельзя;
- новый media contract сейчас не добавляется.
