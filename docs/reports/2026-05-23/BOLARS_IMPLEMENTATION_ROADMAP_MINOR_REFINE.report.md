# BOLARS Implementation Roadmap Minor Refine Report

Дата: 2026-05-23
Статус: completed

## 1. Что Добавлено

Обновлён документ:

- `docs/implementation/BOLARS_MVP_IMPLEMENTATION_ROADMAP.md`

Добавлены уточнения:

- Slice 11 - Documentation / Handoff Update.
- 1C Specialist Mini Smoke в Slice 6.
- Sensitive Data Masking Smoke в Slice 7.
- Adapter selection safety в Slice 3.
- Gate E - Documentation / Handoff Gate.
- Новые строки в Implementation Evidence Matrix.

## 2. Почему Добавлен Documentation Handoff

Roadmap теперь явно требует после реализации привести документацию к фактическому состоянию.

Причина: во время implementation могут уточниться реальные file paths, route behavior, имена методов `window.BolarsSelfCheckout`, debug panel fields, smoke-команды и deployment steps. Если это не зафиксировать, следующий агент, 1C-специалист и support будут работать по устаревшему контракту.

Slice 11 не заменяет PRD/TZ и не расширяет scope. Он требует фиксировать только фактические расхождения, URLs, commit hash, diff summary и implementation/deployment report.

## 3. Зачем Нужен 1C Mini-Smoke

1C mini-smoke нужен как минимальная проверка HTML API без полной production integration.

Он проверяет:

- 1C может получить runtime info;
- 1C может прочитать outbound commands;
- `drainOutboundCommandsJson()` не считается success;
- 1C может передать valid snapshot через `receiveStateSnapshot`;
- Web применяет snapshot;
- debug panel показывает lifecycle и correlation.

Sample snapshot разрешён только как dev/test artifact. Он не становится manual runtime import.

## 4. Зачем Нужен Masking Smoke

Debug panel показывает raw/payload diagnostic data, поэтому перед реализацией важно закрепить masking как acceptance point.

Roadmap теперь требует маскировать:

- phone;
- card/discount card;
- manager card code;
- internal 1C references;
- tokens/secrets;
- e-mail / ФИО / телефон, если случайно пришли;
- barcode, если он считается чувствительным в конкретном контуре.

Также закреплено:

- collapsed raw views по умолчанию свернуты;
- no raw sensitive console logs;
- no sensitive snapshots in `localStorage`;
- no copy raw JSON without masking.

## 5. Как Усилена Adapter Selection Safety

Slice 3 теперь явно запрещает управление adapter из customer UI.

Зафиксировано:

- customer route не показывает adapter switcher;
- `adapter=mock|preview|onec` query может быть разрешён только в dev/debug context, если вообще используется;
- `preview=1` требует `debug=1`;
- debug panel показывает `adapterKind` read-only;
- adapter selection остаётся в `RuntimeAdapterFactory`;
- UI components не импортируют concrete adapters.

## 6. Какие Gates/Evidence Обновлены

Gates:

- Gate A получил adapter selection safety и customer route no adapter switcher.
- Gate B получил 1C mini-smoke documentation.
- Gate C теперь включает Slice 7 и debug masking smoke.
- Добавлен Gate E - Documentation / Handoff Gate.

Evidence Matrix:

- Adapter selection safety test.
- Customer route no adapter switcher screenshot/check.
- 1C mini-smoke checklist/result.
- Debug masking smoke.
- Documentation/handoff update summary.

## 7. Что Не Менялось

Не менялись:

- product scope;
- TZ/PRD;
- RuntimePort architecture;
- PreviewAdapter rule;
- Debug read-only rule;
- Web ↔ 1C adapter contract substance;
- theme scope;
- route canonicals.

Не добавлялись:

- media delivery;
- Честный знак;
- KKT/fiscalization/OFD;
- real payment internals;
- production terminal hardening;
- production theme admin;
- full 1C/RMK rollout hardening.

## 8. Итог

Roadmap остался операционным delivery-документом, но теперь лучше закрывает implementation handoff, 1C mini-smoke, debug privacy и adapter-selection safety перед стартом реализации.
