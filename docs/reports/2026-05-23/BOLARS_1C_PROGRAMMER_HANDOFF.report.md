# BOLARS 1C Programmer Handoff Report

Дата: 2026-05-23
Статус: implemented

## Что Добавлено

- Создан короткий handoff для 1С-разработчика: `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md`.
- В debug panel добавлена ссылка `1C handoff` на GitHub-документ.
- `docs/README.md`, `docs/AGENT_START_HERE.md`, `BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md` и `BOLARS_MVP_DEBUG_PANEL_CONTRACT.md` связаны с новым handoff.

## Содержание Handoff

Документ объясняет простыми словами:

- какой URL открывать для 1С-smoke;
- как получить `window.BolarsSelfCheckout`;
- как читать команды Web через `peekOutboundStatusJson()` и `drainOutboundCommandsJson()`;
- почему drain не означает success;
- как отдавать данные обратно через `receiveStateSnapshot(snapshotJsonString)`;
- как проверять `getLastApplyStatusJson()` и debug panel;
- какие действия запрещены.

## Что Не Менялось

- Runtime contract не расширялся.
- Business logic не менялась.
- Manual JSON import, textarea paste и file upload не добавлялись.
- Реальные 1С/payment/KKT/fiscalization internals не проектировались.
