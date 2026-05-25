# BOLARS Web ↔ 1C Interface Adapter Contract

Статус: draft 0.1
Дата: 2026-05-23
Назначение: главный контракт реального взаимодействия Web ↔ 1С для BOLARS Self-Checkout MVP.

## 1. Назначение

Документ фиксирует один интерфейсный контур между HTML UI и 1С для BOLARS Self-Checkout MVP.

Главное правило: UI не общается напрямую с 1С, РМК, search, scanner-router, payment, loyalty, ККТ, fiscalization или theme source. UI отправляет typed user-intent commands в `SelfCheckoutRuntimePort` и отображает authoritative state snapshot.

`MockAdapter` и `OneCInterfaceAdapter` реализуют один и тот же `SelfCheckoutRuntimePort` contract.

## 2. Related Documents

- `docs/AGENT_START_HERE.md` - implementation handoff.
- `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md` - canonical upstream ТЗ.
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md` - product frame MVP.
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md` - typed commands и state snapshot.
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md` - debug=1 panel contract.
- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md` - adapter selection.
- `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md` - preview mode via snapshots.
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md` - acceptance criteria.
- `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md` - короткий handoff для 1С-разработчика с псевдокодом обмена commands/snapshots.

## 3. Route Contract

Canonical production-like MVP route:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp
```

Debug route:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1
```

1C specialist mini-smoke route:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp-1c.html?debug=1&adapter=onec&runId=onec-smoke-001&terminalLabel=kiosk-01
```

Optional safe query params:

- `debug=1`
- `adapter=onec`
- `runId=<safe id>`
- `terminalLabel=<safe label>`
- `build=<build id>`

Rules:

- Старый showcase не переносится на этот route.
- Diagnostic routes старого контура не должны ломаться.
- Route не должен требовать ручной загрузки JSON.
- `debug=1` не является customer mode.
- `debug=1` предназначен для 1С-специалиста, интегратора и implementation team.
- `runId=onec-smoke-001` is a safe documented mini-smoke id and must not contain secrets.
- URL не должен содержать секреты, токены, внутренние ссылки 1С, ФИО, телефоны, e-mail или коммерческие данные клиента.
- Старый showcase остаётся отдельным контуром и не является source of truth для BOLARS MVP.

## 4. Adapter Topology

Canonical scheme:

```text
HTML UI
  ↓
SelfCheckoutRuntimePort
  ↓
MockAdapter / PreviewAdapter / OneCInterfaceAdapter
  ↓
1С / РМК / search / scanner-router / loyalty / payment / future KKT
```

Rules:

- UI знает только `SelfCheckoutRuntimePort`.
- UI dispatches typed commands.
- UI renders authoritative snapshot.
- `OneCInterfaceAdapter` является real implementation RuntimePort для 1С.
- `MockAdapter` является test/prototype implementation RuntimePort.
- `PreviewAdapter` является service/dev/acceptance implementation RuntimePort and is not a Web ↔ 1С path.
- All runtime adapters use one contract.
- UI не имеет отдельного пути для mock, preview или real.
- UI не импортирует `OneCInterfaceAdapter`, 1С-specific bridge internals, payment, search, scanner или theme adapters напрямую.

## 5. 1C HTML Shell Assumptions

Контракт учитывает ранее принятый контекст 1C HTML Shell:

- 1С открывает HTML страницу в `Поле HTML-документа`.
- Штатный вызов в сторону HTML: `Поле HTML-документа` → `Документ` → `window/defaultView` → `window.BolarsSelfCheckout`.
- Методы `window.BolarsSelfCheckout` не являются штатными методами 1С. Это методы HTML-страницы.
- HTML methods are not native 1С methods.
- Не закладывается ручной JSON import, textarea JSON paste или file upload.
- Media delivery paused: изображения/медиа не входят в этот interface adapter contract.

## 6. Web API Namespace

Canonical namespace:

```ts
window.BolarsSelfCheckout
```

Не использовать `window.Showcase` для нового BOLARS MVP, чтобы не смешивать его со старым showcase.

1С вызывает методы через HTML-документ:

```text
Поле HTML-документа
  → Документ
  → window/defaultView
  → window.BolarsSelfCheckout
  → method(...)
```

## 7. Web API Methods Guaranteed to 1C

### 7.0 JSON String Return Helpers

1С-интеграция должна предпочитать JSON string helpers, если object return нестабилен в конкретной версии платформы.

Recommended read helpers:

- `getRuntimeInfoJson()`
- `getLastApplyStatusJson()`
- `getDebugStateJson()`
- `drainOutboundCommandsJson()`
- `peekOutboundStatusJson()`

If `getRuntimeInfo()` returns an object, `getRuntimeInfoJson()` should return the same payload as JSON string for 1С compatibility.

### 7.1 `getRuntimeInfo()`

Назначение: 1С проверяет, что HTML загружен и готов.

Return: JSON-compatible object. Для 1С-совместимости должен быть доступен `getRuntimeInfoJson()` или эквивалентный string-return helper.

Minimum result:

```json
{
  "apiVersion": "0.1",
  "ready": true,
  "mode": "bolars-self-checkout-mvp",
  "debug": true,
  "route": "/bolars/self-checkout-mvp",
  "buildId": "2026-05-23-local",
  "runtimePortStatus": "ready",
  "adapterKind": "mock",
  "lastSnapshotVersion": 1
}
```

`adapterKind` values:

- `mock`
- `preview`
- `onec`
- `unknown`

### 7.2 `receiveStateSnapshot(snapshotJsonString)`

Назначение: 1С/runtime передаёт HTML авторитетное состояние кассы.

Input: JSON string с `SelfCheckoutStateSnapshot` из `SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`.

HTML behavior:

- parse JSON;
- validate basic shape;
- apply snapshot only if it passes ordering/session/screen validation;
- render screen;
- save apply status;
- do not compute business logic;
- do not silently repair business fields.

Basic validation:

- `snapshotVersion` exists and is number;
- `currentScreen` is known;
- `cart`, `cartLines`, `totals`, `paymentState`, `searchState`, `scannerState`, `uiConfig`, `themeProfile` exist;
- `updatedAt` exists or is filled as apply metadata, not business time.

Snapshot ordering and safety:

- If `snapshotVersion` is lower than the currently applied `snapshotVersion`, HTML must reject it and write `staleSnapshotRejected` to apply status.
- If `snapshotVersion` equals the current version, HTML may treat it as idempotent repeat; it must not break UI.
- If `sessionId`, `runId` or `terminalLabel` are available and do not match the active session/route context, HTML must reject the snapshot or mark it suspicious/rejected; different sessions must not be mixed.
- If `currentScreen` is unsupported, HTML must reject the snapshot, keep the last valid snapshot and show safe apply/debug status instead of a customer crash.
- If snapshot is partially invalid, HTML must not silently fix business fields. For the first slice, reject the whole snapshot and keep the last valid snapshot.
- Apply status must include errors/warnings, rejected reason and last valid `snapshotVersion`.

Command correlation:

- Preferred snapshot metadata: `lastProcessedCommandId` and `lastCommandResult`.
- If these fields are absent, correlation may come through `RuntimeEvent` or command/snapshot metadata.
- Debug and adapter must still show whether the last outbound command was read by 1С, processed, correlated with a snapshot, timed out or failed.

Preview mode note:

- When `adapterKind='preview'`, `receiveStateSnapshot` may be disabled or reserved for dev/test.
- Preview mode must not be treated as the 1С runtime path.
- Preview snapshots should be produced by `PreviewAdapter`, not by manual inbound JSON.

### 7.3 `receiveRuntimeConfig(configJsonString)`

Назначение: 1С/runtime передаёт UI config.

Config may include:

- texts/dictionary;
- package buttons;
- timeout config;
- feature flags;
- active theme profile;
- payment labels;
- search settings;
- final countdown;
- terminal labels.

First slice rule: config may live inside `SelfCheckoutStateSnapshot.uiConfig` and `themeProfile`. This method remains contract-reserved for a separate config update path.

### 7.4 `receiveCatalog(catalogJsonString)`

Назначение: reserved метод для передачи справочника витрины / search candidates base, если отдельный catalog payload понадобится для mock/search.

Rules:

- Для scan-first MVP каталог не является главным экраном.
- Catalog payload не создаёт product catalog UX.
- Catalog может быть data source для search/mock, но бизнес-истина остаётся за RuntimePort/snapshot.
- `receiveCatalog` не является основным путём управления корзиной.
- `receiveCatalog` не добавляет товары в cart.
- `receiveCatalog` не заменяет `searchProducts` или `selectSearchCandidate`.
- Корзина, поиск, скидки, оплата и итоги идут только через commands/snapshots.
- Для BOLARS scan-first MVP `receiveCatalog` остаётся optional/reserved data preload path.
- Если первый MVP получает товары только через snapshot/search results, `receiveCatalog` остаётся optional/reserved.

### 7.5 `getLastApplyStatusJson()`

Назначение: 1С получает статус последнего применения authoritative snapshot.

Current first-slice note: `receiveRuntimeConfig()` and `receiveCatalog()` are reserved helpers. They return their own warning result and do not update cart/search/payment state. 1С should treat `getLastApplyStatusJson()` as the status of the last `receiveStateSnapshot()` apply attempt.

Returns JSON string:

```json
{
  "ok": true,
  "kind": "snapshot",
  "snapshotVersion": 12,
  "errors": [],
  "warnings": [],
  "renderedScreen": "cart",
  "updatedAt": "2026-05-23T12:00:00.000Z"
}
```

`kind` values:

- `snapshot`
- `config`
- `catalog`
- `command`
- `runtimeInfo`

### 7.6 `getDebugStateJson()`

Назначение: debug-only метод для `debug=1`.

Returns JSON string with:

- route;
- ready;
- last outbound command sent by Web;
- last inbound snapshot received from 1С;
- last validation errors;
- current screen;
- cart line count;
- payment status;
- adapter kind.

If `debug=1` is absent, method may return safe minimal status:

```json
{
  "ok": false,
  "reason": "debugDisabled"
}
```

### 7.7 `drainOutboundCommandsJson()`

Назначение: базовый канал Web → 1С для 1C HTML Shell, где 1С инициирует вызовы к HTML.

Returns JSON string:

```json
{
  "ok": true,
  "commands": [
    {
      "type": "scanCode",
      "commandId": "cmd-001",
      "issuedAt": "2026-05-23T12:00:00.000Z",
      "source": "scanner",
      "payload": {
        "code": "4601234567890"
      }
    }
  ],
  "drainedAt": "2026-05-23T12:00:01.000Z"
}
```

This is not manual JSON export/import. It is a programmatic mailbox for 1С to read typed commands from HTML.

Drain semantics:

- `drainOutboundCommandsJson()` means 1С has read commands from the Web queue.
- Drain does not mean the command is completed, acknowledged or successfully applied.
- After drain, command status becomes `drainedByOneC` until snapshot correlation, explicit ack/fail or timeout.
- If snapshot does not arrive, debug must show the command as `drainedByOneC` / pending acknowledgement, not successful.

### 7.8 `peekOutboundStatusJson()`

Назначение: debug/integration helper for 1С to inspect command channel status without draining commands.

Returns JSON string:

```json
{
  "ok": true,
  "pendingCount": 1,
  "queuedCount": 0,
  "drainedCount": 1,
  "processingCount": 0,
  "failedCount": 0,
  "timeoutCount": 0,
  "lastCommandId": "cmd-001",
  "lastDeliveryStatus": "drainedByOneC",
  "lastUnackedCommandId": "cmd-001",
  "oldestPendingAgeMs": 240,
  "queueOverflow": false,
  "lastDrainAt": "2026-05-23T12:00:01.000Z",
  "lastSnapshotCorrelationCommandId": null,
  "updatedAt": "2026-05-23T12:00:00.000Z"
}
```

### 7.9 Optional Reserved Ack/Fail Helpers

Optional/reserved helpers for future tighter 1С acknowledgement:

- `ackOutboundCommandsJson(commandIdsJsonString)`
- `failOutboundCommandsJson(resultJsonString)`

These helpers are not exposed by the current implementation. First-slice completion/failure is represented by `receiveStateSnapshot(snapshotJsonString)` with `lastProcessedCommandId` and `lastCommandResult`. If ack/fail helpers are implemented later, they must not replace snapshot as source of truth. They only update delivery/debug status.

### 7.10 Current First-Slice API Surface

The current BOLARS MVP implementation exposes:

- `getRuntimeInfo()`;
- `getRuntimeInfoJson()`;
- `drainOutboundCommandsJson()`;
- `peekOutboundStatusJson()`;
- `receiveStateSnapshot(snapshotJsonString)`;
- `receiveRuntimeConfig(configJsonString)`;
- `receiveCatalog(catalogJsonString)`;
- `getLastApplyStatusJson()`;
- `getDebugStateJson()`.

Reserved methods `receiveRuntimeConfig` and `receiveCatalog` return safe apply/status results. `receiveCatalog` remains a preload/reserved path and is not a cart/runtime path.

For the documented 1C mini-smoke route, use the standalone 1C HTML artifact with `debug=1&adapter=onec`. The `runId` prefix `onec-*` remains a safe smoke hint, but the canonical integration URL is `/bolars/self-checkout-mvp-1c.html`.

Current production-mode boundary: customer route without `debug=1` defaults to the mock/demo adapter and ignores `adapter=`. A production 1С launch mode must be agreed separately before using the customer URL as a live 1С bridge without debug controls.

## 8. Outbound Command Queue Lifecycle, Polling and Backpressure

Command delivery states:

- `queued`
- `drainedByOneC`
- `processing`
- `snapshotReceived`
- `acknowledged`
- `failed`
- `timeout`
- `unknown`

Completion rule:

Команда считается окончательно завершённой только когда:

- пришёл snapshot, связанный с `commandId`;
- or explicit ack/fail arrived;
- or timeout expired and command moved to `failed`/`unknown`.

`drainOutboundCommandsJson()` only moves commands from `queued` to `drainedByOneC`. It must not delete the command from debug/accounting state until completion, failure or timeout.

Command correlation:

- Preferred path: inbound snapshot contains `lastProcessedCommandId` and `lastCommandResult`.
- Alternative path: correlation arrives through `RuntimeEvent` or adapter metadata.
- Debug must show command sent, command read by 1С, command processed, snapshot received for command, or no snapshot/timeout.

Polling cadence for first slice:

- 1С should read outbound queue by timer or by available native shell event.
- Active purchase recommended cadence: `100-300 ms`, if platform/load allows.
- Inactive start screen may use slower cadence, for example `500-1000 ms`.
- This is an MVP operational rule, not a final production performance SLA.

Backpressure:

- First slice max pending commands: `20`.
- If queue is full, Web/adapter must not accumulate commands indefinitely.
- New commands should fail with `runtimeBusy`/`queueOverflow` or UI should temporarily block repeat action from snapshot/busy state.
- Debug must show `queueOverflow`.
- Repeated scan can generate commands quickly; adapter must preserve order and prevent silent drops.
- `startPayment` must be protected from double tap, duplicate `commandId` and busy-state duplicate submission.

Preview mode:

- If `adapterKind='preview'`, outbound commands to 1С are disabled.
- Preview controls may trigger local scenario transitions inside `PreviewAdapter`.
- 1С must not treat preview commands as real business commands.

## 9. Outbound Command Contract: Web → 1C

Web отправляет только typed user-intent commands из `SelfCheckoutRuntimePort`.

Commands already live in `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`. This document describes how those commands cross the Web ↔ 1С boundary.

### Examples

`scanCode`:

```json
{
  "type": "scanCode",
  "commandId": "cmd-001",
  "issuedAt": "2026-05-23T12:00:00.000Z",
  "source": "scanner",
  "payload": {
    "code": "4601234567890"
  }
}
```

`startPurchase`:

```json
{
  "type": "startPurchase",
  "commandId": "cmd-002",
  "issuedAt": "2026-05-23T12:00:01.000Z",
  "source": "touch"
}
```

`searchProducts`:

```json
{
  "type": "searchProducts",
  "commandId": "cmd-003",
  "issuedAt": "2026-05-23T12:00:02.000Z",
  "source": "keyboard",
  "payload": {
    "query": "дрель"
  }
}
```

`incrementQuantity`:

```json
{
  "type": "incrementQuantity",
  "commandId": "cmd-004",
  "issuedAt": "2026-05-23T12:00:03.000Z",
  "source": "touch",
  "payload": {
    "lineId": "line-001"
  }
}
```

`startPayment`:

```json
{
  "type": "startPayment",
  "commandId": "cmd-010",
  "issuedAt": "2026-05-23T12:00:10.000Z",
  "source": "touch"
}
```

## 10. Command Delivery Scheme

Target scheme for first implementation planning:

```text
HTML UI dispatches typed command
  → SelfCheckoutRuntimePort
  → OneCInterfaceAdapter
  → window.BolarsSelfCheckout outbound command queue
  → 1С reads queue through Поле HTML-документа / window.defaultView / drainOutboundCommandsJson()
  → 1С applies command
  → 1С calls receiveStateSnapshot(snapshotJsonString)
```

Rationale: accepted 1C HTML Shell context gives a stable 1С → HTML call path through `Поле HTML-документа`. Therefore the first reliable Web → 1С bridge is a programmatic command mailbox that 1С reads. This is not a manual JSON paste/upload workflow.

This scheme applies only when `adapterKind='onec'`. Preview mode does not write to the OneC outbound queue.

Optional future optimization:

- HTML may also emit a native listener/event if a concrete 1С shell supports it.
- The event payload must be the same command envelope.
- UI must not depend on a separate event-only API.

## 11. Inbound Snapshot Contract: 1C → Web

After each command, 1С/runtime returns:

- optional immediate `CommandResult`/ack;
- new `SelfCheckoutStateSnapshot`.

Recommended order:

1. Web dispatches command to `OneCInterfaceAdapter`.
2. `OneCInterfaceAdapter` queues command for 1С.
3. 1С reads command from the HTML command channel.
4. 1С validates command.
5. 1С applies business logic.
6. 1С calls `window.BolarsSelfCheckout.receiveStateSnapshot(snapshotJsonString)`.
7. Web validates and applies snapshot.
8. Web re-renders from snapshot.

State snapshot is source of truth. `CommandResult` is useful for diagnostics, but UI behavior must be driven by snapshot.

Correlation requirement:

- 1С/runtime should include `lastProcessedCommandId` and `lastCommandResult` in the next snapshot when the snapshot is a result of a command.
- If command was rejected before business state changed, 1С/runtime should return snapshot with `lastCommandResult.ok=false` and a user-readable alert if needed.
- If a snapshot is periodic and not tied to a command, `lastProcessedCommandId` may be omitted.

## 12. Workflow Mapping

| User workflow | Command | 1С/runtime responsibility | Snapshot result |
| --- | --- | --- | --- |
| Покупатель коснулся стартового экрана | `startPurchase` | Создать/открыть сессию покупки | `currentScreen=cart`, `cart.isEmpty=true` |
| Скан товара | `scanCode(code)` | Определить тип кода, найти товар, добавить/увеличить строку | `currentScreen=cart`, `cartLines` updated, `totals` updated, `lastChange` |
| Ввод поиска `4+` | `searchProducts(query)` | Искать по `name`, `article`, `barcodeDigits`; вернуть тот же `searchState.query` | `searchState.status=found|notFound`, `candidates` |
| Выбор кандидата | `selectSearchCandidate(candidateId)` | Добавить/увеличить товар по ранее выданному `candidateId` | `cartLines` updated, `totals` updated |
| Плюс/минус | `incrementQuantity` / `decrementQuantity` | Изменить количество, пересчитать totals | updated `cartLines` / `totals` |
| Нумпад | `confirmQuantityInput(lineId, quantity)` | Валидировать количество, применить, пересчитать | updated `cart` |
| Удаление строки | `removeCartLine(lineId)` | Удалить любую removable строку чека: товар, пакет или service line; пересчитать totals | updated `cartLines`, `cart`, `totals`; `paymentSetup` remains if lines remain |
| Назад из подготовки оплаты | `returnToPurchase` | Вернуть editable flow из `paymentSetup` в `cart` без очистки чека; если открыта модалка, только закрыть модалку | `currentScreen=cart` или same screen with `modalState=none` |
| Отмена покупки | `cancelPurchaseRequest` / `confirmCancelPurchase` | Решить modal/reset | `modalState` или `currentScreen=start` |
| Скидка по телефону | `applyDiscountByPhone(phone)` | Проверить loyalty; телефон приходит строкой в формате `+7 900 123 45 67` | `discount` / `totals` updated |
| Скидочная карта | `scanCode(discount code)` | Классифицировать код и проверить loyalty | `discount` / `totals` updated |
| Менеджер | `bindManager(code)` или `scanCode(manager code)` | Проверить менеджера | `manager.status=bound|rejected` |
| Оплата | `startPayment` | Запустить эквайринг | `paymentWaiting`, `paymentError` или `finalSuccess` |

## 13. Security and Privacy Rules

- Commands and snapshots must not expose secrets.
- URL must not contain tokens, internal 1С references, ФИО, phones, e-mails or customer commercial data.
- Debug raw views must mask barcode/phone/card data where possible.
- Internal 1С object references must not leak into UI state.
- HTML must not persist cart/payment source of truth in localStorage.

## 14. Non-Negotiable Prohibitions

- No manual JSON import.
- No textarea paste for inbound data.
- No user file upload for runtime data.
- No direct UI calls to 1С.
- No direct UI calls to payment.
- No direct UI price/totals math.
- No local cart source of truth.
- No product catalog as main screen.
- No product detail modal.
- No real KKT/fiscalization in this contract.
- No Честный знак implementation in first slice.
- No media delivery contract until media contour is clarified with 1С team.
- No `window.Showcase` namespace for BOLARS MVP.
- No preview commands sent to `OneCInterfaceAdapter`.
- No treating preview scenarios as real 1С/RMK operations.

## 15. vNext

- Native 1С event/listener delivery if the concrete HTML shell supports it reliably.
- Optional `ackOutboundCommandsJson` / `failOutboundCommandsJson` helpers if explicit acknowledgement is needed. They are not part of the current exposed API.
- Full production hardening of 1C/RMK rollout beyond first interface adapter handshake.
- Real payment adapter details behind 1С/runtime.
- Real search adapter tuning.
- Real scanner-router implementation details.
- ККТ/fiscalization/OFD.
- Честный знак / marked product workflow.
- Media delivery with 1С team.
- Production terminal deployment contract.
