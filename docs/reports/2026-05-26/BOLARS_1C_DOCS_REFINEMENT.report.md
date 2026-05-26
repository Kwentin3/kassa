# BOLARS 1С Docs Refinement Report

Дата: 2026-05-26
Статус: выполнено

## Задача

Документацию по BOLARS Self-Checkout нужно было привести к контексту реального использования вместе с 1С:

- простая русскоязычная связанная инструкция;
- отдельный внешний JSON-контракт для 1С;
- без подмены JSON payload внутренними TypeScript/runtime-типами;
- без дрейфа относительно `src/bolars/runtime/*`.

## Что Изменено

- Добавлен `docs/contracts/BOLARS_1C_JSON_EXCHANGE_CONTRACT.md`.
- Добавлен `docs/contracts/BOLARS_1C_SMOKE_SNAPSHOTS.md` с готовыми payload JSON для start/cart/search/payment/final/modal smoke-проверок.
- Переписан `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md` как внешний контракт Web ↔ 1С bridge.
- Переписан `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md` как внутренний runtime-port документ для frontend/runtime-команды.
- Обновлён `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md`: ссылки на команды и snapshot теперь ведут в JSON-контракт для 1С.
- Обновлён `docs/README.md`: добавлен порядок чтения для 1С-интегратора и разграничены внешний JSON contract / внутренний runtime-port.
- Обновлены related-docs ссылки в debug panel и adapter factory контрактах.

## Проверка По Коду

Документы сверены с:

- `src/bolars/runtime/types.ts`
- `src/bolars/runtime/commands.ts`
- `src/bolars/runtime/webApi.ts`
- `src/bolars/runtime/baseAdapter.ts`
- `src/bolars/runtime/onecInterfaceAdapter.ts`

Зафиксированные важные детали:

- текущий Web API экспортирует `getRuntimeInfoJson`, `drainOutboundCommandsJson`, `peekOutboundStatusJson`, `receiveStateSnapshot`, `getLastApplyStatusJson`, `getDebugStateJson`;
- `ackOutboundCommandsJson` / `failOutboundCommandsJson` в текущем API нет;
- `uiConfig.texts` есть в runtime type и должен быть объектом в полном snapshot;
- `uiConfig.viewportProfile` включает `embeddedOneC`;
- текущая apply-валидация проверяет только базовую форму snapshot, но UI ожидает полный shape;
- `runId` и `terminalLabel` сверяются только если они есть и в URL, и в snapshot;
- `sessionId` обязателен как string, но текущий код не сравнивает его с URL;
- `OneCInterfaceAdapter` держит максимум 20 незавершённых команд и переводит старые pending-команды в `timeout` после 30 секунд.
- список команд в JSON-контракте покрывает все 22 значения `CommandType`;
- список API-методов в Web ↔ 1С контракте покрывает текущий `BolarsSelfCheckoutApi`.
- 8 JSON-блоков из `BOLARS_1C_SMOKE_SNAPSHOTS.md` проверены через `validateSnapshot` из `src/bolars/runtime/baseAdapter.ts`; дополнительно проверены суммы, `lineCount`, `itemCount` и `paymentState.amount`.

## Проверки

- `git diff --check` по изменённым tracked markdown-файлам: без ошибок.
- Для новых/переписанных русскоязычных документов добавлен UTF-8 BOM, чтобы Windows PowerShell 5.1 не показывал mojibake.

Код приложения не менялся; typecheck/build не запускались.
