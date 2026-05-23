# BOLARS Web ↔ 1C Interface Adapter Minor Refine Report

Дата: 2026-05-23
Статус: completed
Задача: minor refine Web ↔ 1С interface adapter contract для BOLARS MVP.

## 1. Изменённые Документы

- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`
- `docs/AGENT_START_HERE.md`
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`

## 2. Command Queue Lifecycle

Добавлены lifecycle states:

- `queued`
- `drainedByOneC`
- `processing`
- `snapshotReceived`
- `acknowledged`
- `failed`
- `timeout`
- `unknown`

Главное уточнение: `drainOutboundCommandsJson()` означает только то, что 1С прочитала команду из Web queue. Это не означает успешное выполнение.

Команда считается завершённой только после:

- snapshot, связанного с `commandId`;
- explicit ack/fail;
- timeout с переходом в `failed`/`unknown`.

## 3. Command ↔ Snapshot Correlation

В `SelfCheckoutStateSnapshot` добавлены optional/recommended поля:

- `lastProcessedCommandId`
- `lastCommandResult`

Если snapshot не связан с командой, поля могут отсутствовать. Debug и adapter должны показывать, прочитана ли команда 1С, обработана ли она, пришёл ли связанный snapshot, или команда зависла/упала/истекла по timeout.

## 4. Snapshot Safety Rules

Уточнено для `receiveStateSnapshot(snapshotJsonString)`:

- stale snapshot с меньшим `snapshotVersion` rejected;
- equal `snapshotVersion` допустим как idempotent repeat;
- чужой `sessionId` / `runId` / `terminalLabel` rejected или suspicious;
- unsupported `currentScreen` rejected;
- partially invalid snapshot для первого среза rejected whole;
- последний валидный snapshot сохраняется.

## 5. Polling and Backpressure

Добавлены first-slice operational rules:

- active purchase polling cadence: `100-300 ms`, если позволяет платформа/нагрузка;
- inactive start screen may poll slower, например `500-1000 ms`;
- first-slice max pending commands: `20`;
- queue overflow must be visible in debug;
- repeated scan может быстро генерировать commands;
- `startPayment` должен быть защищён от double tap, duplicate `commandId` и busy duplicate submission.

## 6. Debug Panel

Добавлена секция Outbound Queue:

- pending count;
- queued count;
- drained count;
- processing count;
- failed count;
- timeout count;
- last unacked commandId;
- oldest pending age;
- queue overflow status;
- last drain time;
- last snapshot correlation commandId.

Acceptance уточнён: после drain status меняется на `drainedByOneC`, после snapshot - на `snapshotReceived`/`acknowledged`, при отсутствии snapshot команда остаётся pending/timeout.

## 7. Reserved vNext Helpers

Зарезервированы optional helpers:

- `ackOutboundCommandsJson(commandIdsJsonString)`
- `failOutboundCommandsJson(resultJsonString)`

Они не обязательны для первого среза и не заменяют snapshot as source of truth.

## 8. receiveCatalog

Усилено:

- `receiveCatalog` не является cart/runtime path;
- не добавляет товары в cart;
- не заменяет `searchProducts` / `selectSearchCandidate`;
- не создаёт catalog UX;
- остаётся optional/reserved data preload path.

## 9. 1С JSON String Helpers

Добавлена рекомендация: 1С-интеграция должна предпочитать JSON string helpers, если object return нестабилен в конкретной версии платформы.

Recommended helpers:

- `getRuntimeInfoJson()`
- `getLastApplyStatusJson()`
- `getDebugStateJson()`
- `drainOutboundCommandsJson()`
- `peekOutboundStatusJson()`

## 10. vNext Wording

Формулировка уточнена:

- `full production hardening of 1C/RMK rollout beyond first interface adapter handshake`

Это не отодвигает весь real 1С контур за MVP: первый MVP включает interface adapter handshake и базовый Web ↔ 1С контур.

## 11. Что Не Менялось

- Код не изменялся.
- Product scope не расширялся.
- ККТ, fiscalization/OFD, Честный знак, media delivery и real payment internals не проектировались.
- Старый showcase не стал source of truth.
- Manual JSON import, textarea paste и file upload остаются запрещены.
