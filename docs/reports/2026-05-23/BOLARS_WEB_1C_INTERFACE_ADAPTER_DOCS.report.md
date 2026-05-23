# BOLARS Web ↔ 1C Interface Adapter Docs Report

Дата: 2026-05-23
Статус: completed
Задача: спроектировать Web ↔ 1С interface adapter contract для BOLARS Self-Checkout MVP.

## 1. Добавленные Документы

- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`

## 2. Обновлённые Документы

- `docs/AGENT_START_HERE.md`
- `docs/README.md`
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`

## 3. Один Interface Adapter

Зафиксирована схема:

```text
HTML UI
  -> SelfCheckoutRuntimePort
  -> MockAdapter / OneCInterfaceAdapter
  -> 1С / РМК / search / scanner-router / loyalty / payment / future KKT
```

Правила:

- UI знает только `SelfCheckoutRuntimePort`;
- `MockAdapter` и `OneCInterfaceAdapter` реализуют один RuntimePort contract;
- UI не имеет отдельного пути для mock и real;
- UI не импортирует 1С/payment/search/scanner/theme adapters;
- Web ↔ 1С delivery details живут в `BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`.

## 4. Публичный URL

Canonical MVP route:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp
```

Debug route:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1
```

Старый showcase остаётся отдельным контуром и не переносится на этот route.

## 5. Web API для 1С

Canonical namespace:

```ts
window.BolarsSelfCheckout
```

Методы:

- `getRuntimeInfo()`;
- `receiveStateSnapshot(snapshotJsonString)`;
- `receiveRuntimeConfig(configJsonString)`;
- `receiveCatalog(catalogJsonString)`;
- `getLastApplyStatusJson()`;
- `getDebugStateJson()`;
- `drainOutboundCommandsJson()`;
- `peekOutboundStatusJson()`.

Отдельно зафиксировано, что эти методы являются методами HTML-страницы, а не штатными методами 1С. 1С вызывает их через `Поле HTML-документа` → `Документ` → `window/defaultView`.

## 6. Command / Snapshot Flow

Workflow описан как:

1. UI dispatches typed command.
2. `OneCInterfaceAdapter` кладёт command в outbound channel.
3. 1С читает command через HTML document/window API.
4. 1С валидирует и применяет бизнес-логику.
5. 1С вызывает `receiveStateSnapshot(snapshotJsonString)`.
6. Web применяет snapshot и re-renders.

State snapshot остаётся source of truth. CommandResult может использоваться для диагностики, но UI не строит бизнес-поведение на ack вместо snapshot.

## 7. Debug=1

`docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md` фиксирует:

- route/build;
- Web API status;
- last outbound command;
- last inbound snapshot;
- validation/apply status;
- adapter status;
- safe raw views.

Debug panel:

- видна только с `debug=1`;
- не customer UI;
- не production admin;
- не manual JSON import;
- не textarea paste;
- не file upload;
- не запускает business operations сама.

## 8. Workflow Mapping

Добавлена таблица:

- start touch -> `startPurchase` -> session/cart snapshot;
- product scan -> `scanCode` -> product add/increment/totals;
- search `4+` -> `searchProducts` -> candidates;
- candidate select -> `selectSearchCandidate` -> cart update;
- plus/minus -> quantity commands -> totals update;
- numpad -> `confirmQuantityInput` -> cart update;
- cancel -> modal/reset;
- discount -> loyalty check -> discount/totals;
- manager -> manager binding;
- payment -> payment waiting/error/final.

## 9. vNext / Deferred

Оставлено за пределами этого contract:

- native 1С event/listener delivery optimization, если конкретный shell подтвердит поддержку;
- real payment adapter internals;
- real scanner-router internals;
- KKT/fiscalization/OFD;
- Честный знак / marked product workflow;
- media delivery;
- production terminal deployment contract.

## 10. Проверки

Проверено:

- canonical route and debug route указаны в handoff/README/PRD/contracts/checklist;
- `window.BolarsSelfCheckout` указан как canonical namespace;
- `window.Showcase` запрещён для нового BOLARS MVP;
- manual JSON import, textarea paste и file upload запрещены;
- старый showcase не является source of truth;
- UI business logic ban сохранён.
