# 1C Diagnostic Loader README

Дата: 2026-05-19
Статус: Slice 2 handoff

## Что подготовлено

Подготовлен source-пакет минимального 1С Diagnostic Loader для проверки обмена HTML ↔ 1С:

```text
tools/1c-diagnostic-loader/
```

Это не готовый `.epf`. Это исходники внешней обработки и инструкция для 1С-программиста.

## Почему выбран формат исходников внешней обработки

Предпочтительный формат для запуска у 1С-программиста - внешняя обработка `.epf`. Но в текущей среде нет целевой базы, EDT-проекта и проверенного сценария сборки. Поэтому безопасный результат - исходники и form structure, которые 1С-специалист собирает в своей тестовой среде.

Выбран именно этот способ, потому что он:

- не требует изменения типовой конфигурации;
- подходит для тестовой базы;
- проще передается 1С-программисту;
- честно отделяет source draft от реально собранного `.epf`.

## Что внутри

```text
tools/1c-diagnostic-loader/
  README.md
  src/
    DiagnosticLoaderFormModule.bsl
    DiagnosticLoaderObjectModule.bsl
    DiagnosticProtocol.md
    form-structure.md
  examples/
    command-envelope.json
    response-envelope.json
  dist/
    README.md
```

## Как использовать

1. Передать папку `tools/1c-diagnostic-loader/` 1С-программисту.
2. В тестовой базе создать внешнюю обработку.
3. Собрать форму по `src/form-structure.md`.
4. Вставить BSL-код из `src/`.
5. Открыть диагностический URL внутри `Поле HTML-документа`.
6. Проверить `diag.ping`, metadata и доступные транспорты.
7. Вернуть JSON-отчет страницы, журнал обработки и комментарий по результатам.

## Что важно проверить на целевой базе

- загрузку URL в HTML-поле;
- событие клика/перехода для href transport;
- чтение DOM mailbox;
- direct JS call в `window.DiagnosticHarness.receiveBridgeAck(...)`;
- DOM response fallback;
- поведение в толстом, тонком и web-клиенте;
- что JSON-отчет страницы фиксирует bridge status.

## Чего loader не делает

Loader не трогает РМК, чек, оплату, эквайринг, ККТ, фискализацию, печать и маркировку. Он обрабатывает только `diag.*`.

## Связанные документы

- `1C_HTML_SHELL_DIAGNOSTIC_GUIDE_FOR_1C_SPECIALIST.md`
- `PRD_1C_HTML_SHELL_DIAGNOSTIC_HARNESS.md`
- `BLUEPRINT_1C_HTML_SHELL_DIAGNOSTIC_HARNESS.md`
- `1C_HTML_SHELL_BRIDGE_MANIFEST.md`
- `1C_HTML_SHELL_RMK_ADAPTER_MAP.md`
