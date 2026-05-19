# 1C HTML Shell Bridge Manifest

Дата: 2026-05-19  
Статус: protocol draft  
Protocol name: `1C_HTML_SHELL_BRIDGE`  
Protocol version: `0.1`

## Purpose

Этот документ задает контракт взаимодействия между HTML FrontShell и 1С/РМК. Контракт специально устроен так, чтобы HTML не становился источником кассовой истины и не обходил 1С.

Главное правило:

```text
HTML sends intent.
1C validates and executes through RMK/controller.
1C returns full state snapshot.
HTML renders state.
```

Основной механизм обновления интерфейса - полный snapshot через `window.FrontShell.updateState(state)`, а не набор мелких UI-мутаций.

## Roles

| Side | Role | Responsibility |
|---|---|---|
| HTML | `FrontShell / view_layer_only` | Отобразить state, принять buyer intent, отправить command envelope, показать busy/error/staff states. |
| 1С | `RMK_controller / source_of_truth` | Владеть сессией, чеком, корзиной, ценами, скидками, маркировкой, оплатой, ККТ, фискализацией, оборудованием и финальным статусом продажи. |

Source of truth: `1С / РМК / текущий чек / кассовая логика / оборудование`.

HTML is not source of truth.

## Non-Negotiable Boundaries

HTML must not:

- store the real cart;
- calculate the final sale total;
- decide whether sale can be completed;
- manage acquiring directly;
- access KKT directly;
- print or fiscalize receipt;
- access the 1C database directly;
- call payment/SBP/KKT/scanner/fiscalization devices directly;
- become backend;
- bypass РМК with an external REST API.

HTML may store only volatile view state:

- current selected visual tab/screen;
- short-lived input buffer before sending command;
- animation state;
- non-cashier UI preferences if approved.

Any cart-like data inside HTML is a rendered copy of the latest state snapshot and must be discarded/replaced on every `updateState`.

## Transport Model

The manifest is transport-neutral because actual 1C HTML field behavior depends on platform version and client. The spike must choose the concrete transport.

Approved transport candidates:

| Direction | Candidate | Notes |
|---|---|---|
| HTML -> 1C | custom `href` / navigation event | Example: encoded command in `oneshell://command?...`; 1С catches click/navigation and cancels standard action. |
| HTML -> 1C | hidden DOM mailbox + click event | JS writes JSON to hidden node; 1С reads DOM during `ПриНажатии`/event handler. |
| HTML -> 1C | supported direct event API if available | Only after spike confirms version/client behavior. |
| 1C -> HTML | direct JS function call | Preferred when reliable: call `window.FrontShell.updateState(state)`. |
| 1C -> HTML | DOM mailbox update | Fallback: 1С writes state JSON to hidden node; HTML reads via polling/timer or supported DOM event. |
| 1C -> HTML | full HTML reload | Emergency fallback only; breaks focus/animation and should not be normal operation. |

Transport requirements:

- commands are UTF-8 JSON;
- payload length limit must be measured in spike;
- every command has `requestId`;
- 1С validates protocolVersion, command name and payload schema;
- invalid payload never reaches RMK adapter.

## Command Envelope

```json
{
  "protocolVersion": "0.1",
  "requestId": "uuid-or-sequence",
  "command": "cart.addByBarcode",
  "payload": {
    "barcode": "4600000000000"
  },
  "clientTimestamp": "optional"
}
```

Field rules:

| Field | Required | Rule |
|---|---:|---|
| `protocolVersion` | yes | Must equal a version supported by 1С bridge router. |
| `requestId` | yes | Unique per HTML command. Used for idempotency and response correlation. |
| `command` | yes | Dot-separated command name from approved registry. |
| `payload` | yes | Object; may be `{}`. Primitive root payloads are not allowed. |
| `clientTimestamp` | no | UI diagnostic only; never used for cashier truth. |

## State Envelope

```json
{
  "protocolVersion": "0.1",
  "requestId": "same-request-id-or-null",
  "screen": "cart",
  "sessionId": "string-or-null",
  "cartItems": [],
  "cartTotal": 0,
  "currency": "RUB",
  "paymentStatus": "idle",
  "receiptStatus": "idle",
  "errorMessage": null,
  "staffRequired": false,
  "terminalStatus": "ready"
}
```

State envelope baseline fields:

| Field | Type | Notes |
|---|---|---|
| `protocolVersion` | string | Bridge state version. |
| `requestId` | string/null | Request that caused this state, or null for push/initial. |
| `screen` | enum | Target screen selected by 1С. |
| `sessionId` | string/null | Opaque session id. HTML must not infer business meaning. |
| `cartItems` | array | Render-only DTO list. |
| `cartTotal` | number | Final display amount from 1С/RMK only. |
| `currency` | string | Usually `RUB`. |
| `paymentStatus` | enum | Payment state from 1С/RMK/acquiring layer. |
| `receiptStatus` | enum | Receipt/fiscalization/print state from 1С/RMK/KKT layer. |
| `errorMessage` | string/null | Buyer-safe message. |
| `staffRequired` | boolean | Locks buyer flow until staff action. |
| `terminalStatus` | enum | `ready`, `busy`, `offline`, `blocked`, `error`, etc. |

Extended optional state fields:

| Field | Type | Notes |
|---|---|---|
| `busy` | boolean | Whether HTML should lock command UI. |
| `busyMessage` | string/null | Buyer-safe progress text. |
| `lastScannedProduct` | object/null | Short confirmation DTO. |
| `catalog` | object/null | Category/product DTO if catalog screen is active. |
| `paymentMethods` | array | Allowed methods for current state. |
| `staffReason` | string/null | Reason code for staff requirement. |
| `allowedCommands` | array | Optional server-side command allowlist for UI enablement. |
| `theme` | object/null | Safe branding tokens, not arbitrary CSS. |
| `terminalNumber` | string/null | Display-only terminal id. |

## Error Envelope

Errors are state, not uncontrolled alerts.

```json
{
  "protocolVersion": "0.1",
  "requestId": "same-request-id-or-null",
  "code": "cart.product_not_found",
  "message": "Товар не найден. Попробуйте снова или позовите сотрудника.",
  "severity": "recoverable",
  "staffRequired": false,
  "retryAllowed": true
}
```

Rules:

- `message` is buyer-safe and contains no stack traces/internal object names;
- internal diagnostic details stay in 1С logs;
- payment and receipt errors default to locked or staff-required if sale consistency is uncertain;
- HTML shows error state but never resolves cashier inconsistency by itself.

## JS API Required From HTML

HTML must expose these functions before sending `ui.ready`:

```js
window.FrontShell = {
  init(config) {},
  updateState(state) {},
  setBusy(flag, message) {},
  showError(error) {},
  navigate(screen) {},
  reset() {},
  applyTheme(theme) {},
  showStaffRequired(reason) {}
};
```

Function rules:

| Function | Called by 1С | Expected behavior |
|---|---|---|
| `init(config)` | once after document is ready | Apply non-secret config, validate protocol version, render initial shell. |
| `updateState(state)` | primary update path | Replace rendered state with full snapshot. |
| `setBusy(flag, message)` | during command processing | Disable touch actions and show progress. |
| `showError(error)` | recoverable/fatal error | Render safe error view or overlay. |
| `navigate(screen)` | exceptional navigation | Change visible screen without claiming state ownership. |
| `reset()` | session reset | Clear volatile view state and return to idle rendering. |
| `applyTheme(theme)` | branding update | Apply approved theme tokens only. |
| `showStaffRequired(reason)` | staff lock | Render staff-required state and block buyer actions. |

`updateState(state)` supersedes previous state. HTML must not merge old cart/payment/receipt data unless the state schema explicitly marks a field as patchable.

## Command Registry

### UI / Terminal

| Command | Payload | Meaning |
|---|---|---|
| `ui.ready` | `{ capabilities }` | HTML loaded and bridge is ready. |
| `ui.error` | `{ code, message, detail? }` | HTML reports render/runtime issue to 1С. |
| `terminal.ping` | `{}` | Liveness check. |
| `terminal.getStatus` | `{}` | Request current terminal state snapshot. |

### Session / Idle

| Command | Payload | Meaning |
|---|---|---|
| `session.start` | `{}` | Buyer starts purchase. |
| `session.cancel` | `{ reason? }` | Buyer/staff requests cancellation. |
| `session.finish` | `{}` | Buyer acknowledges final state after successful receipt. |
| `session.timeout` | `{ screen, idleMs? }` | HTML reports UI inactivity. 1С decides reset. |
| `idle.enter` | `{}` | HTML entered idle/promo screen. |
| `idle.exit` | `{ reason }` | Buyer touched/scanned/started from idle. |

### Cart

| Command | Payload | Meaning |
|---|---|---|
| `cart.getState` | `{}` | Request current cart state snapshot. |
| `cart.addByBarcode` | `{ barcode }` | Buyer/scanner intent to add barcode. |
| `cart.addProduct` | `{ productId?, code?, quantity? }` | Buyer selects known catalog product. |
| `cart.removeItem` | `{ lineId }` | Buyer requests item removal. |
| `cart.changeQuantity` | `{ lineId, quantity }` | Buyer requests quantity change. |
| `cart.clear` | `{ reason? }` | Buyer/staff requests cart clear. |

### Catalog

| Command | Payload | Meaning |
|---|---|---|
| `catalog.search` | `{ query }` | Search product/catalog. |
| `catalog.openCategory` | `{ categoryId }` | Open category. |
| `catalog.openProduct` | `{ productId }` | Open product details/confirmation. |
| `catalog.back` | `{}` | Navigate back within 1С-approved catalog state. |

### Payment / Receipt

| Command | Payload | Meaning |
|---|---|---|
| `payment.startCard` | `{}` | Start card acquiring through 1С/RMK. |
| `payment.startSbp` | `{}` | Start SBP flow through 1С/RMK, if available. |
| `payment.cancel` | `{ reason? }` | Request cancellation of pending payment. |
| `payment.getStatus` | `{}` | Request current payment status. |
| `receipt.getStatus` | `{}` | Request fiscal/print status. |
| `receipt.requestPrintCopy` | `{}` | Ask 1С/RMK to print a copy if allowed. |

### Staff / Error

| Command | Payload | Meaning |
|---|---|---|
| `staff.requestHelp` | `{ reason?, screen? }` | Buyer requests staff help. |
| `staff.cancelHelpRequest` | `{}` | Cancel help request if still allowed. |
| `error.acknowledge` | `{ code? }` | Buyer acknowledges recoverable error. |

## Busy, Lock And Double-Click Rules

1. HTML must disable the initiating control immediately after sending a command that mutates cashier state.
2. HTML may still allow `staff.requestHelp` unless 1С state forbids it.
3. 1С returns `setBusy(true)` or state with `busy=true` for long operations.
4. 1С returns new state with `busy=false` when command is complete, rejected or escalated.
5. Duplicate commands with the same `requestId` are idempotent and must not mutate cashier state twice.
6. Two different `requestId` values sent by accidental double tap may still arrive. 1С command router must reject or serialize by session lock.
7. HTML must debounce high-risk controls: add item, remove item, pay, cancel payment, finish session.

## Idempotency

`requestId` is required for every command.

1С stores recent request outcomes at least for the active session:

```text
sessionId + requestId -> accepted/rejected/resulting state version
```

If the same request arrives again:

- return the same resulting state if already completed;
- return current busy state if still processing;
- reject if requestId is malformed or belongs to another session.

Commands that must be idempotent:

- `cart.addByBarcode`;
- `cart.addProduct`;
- `cart.removeItem`;
- `cart.changeQuantity`;
- `payment.startCard`;
- `payment.startSbp`;
- `payment.cancel`;
- `session.cancel`;
- `session.finish`.

## Cancellation Rules

Cancellation is always intent, never direct rollback.

| Command | Rule |
|---|---|
| `session.cancel` | 1С decides whether cart can be discarded, whether staff is required and whether any payment/receipt state blocks cancellation. |
| `payment.cancel` | 1С/acquiring layer decides if pending payment can be cancelled. HTML cannot assume cancellation succeeded. |
| `staff.cancelHelpRequest` | Allowed only while no staff lock is active and no critical receipt/payment error exists. |
| `cart.clear` | 1С decides whether current items can be removed by buyer or staff approval is required. |

## Recovery Rules

On HTML reload, crash or form reopen:

1. HTML initializes empty visual state.
2. HTML exposes `window.FrontShell`.
3. HTML sends `ui.ready`.
4. 1С responds with full `updateState(state)`.
5. HTML discards any pre-crash cart/payment/receipt render data.

On bridge error:

- 1С should keep cashier state intact;
- HTML should show a safe blocked/error screen if it cannot receive state;
- staff action is required if sale/payment/receipt consistency is uncertain.

## Security And Validation

1С bridge router must:

- allow only registered commands;
- validate payload fields and types;
- reject oversized payloads;
- reject unknown protocol versions unless compatibility is explicit;
- escape JSON before injecting into JS;
- never expose internal object references or privileged procedures to HTML;
- log command, requestId, sessionId, result and error code;
- keep secrets out of config sent to HTML.

HTML must:

- never use `eval` for bridge payload;
- never execute arbitrary theme CSS from state;
- never load CDN scripts in production shell;
- never store real payment data;
- treat every state as untrusted for DOM injection and render with escaping.

## Visual Layer Contract

FrontShell should be modern, fast, light and compatible:

- touch-first;
- large buttons;
- quick transitions only after render spike;
- simple screen slide/fade if supported;
- static icons or verified SVG;
- restrained shadows and rounded cards after performance check;
- idle promo/branding through safe state/config;
- minimal dependencies;
- fallback mode for weak HTML-render.

Do not choose React/Vite by default for the 1C HTML field. A production-ready baseline can be vanilla HTML/CSS/JS with state-driven render. If a framework is considered later, it must be bundled to a single compatible script, tested inside the target 1C render, and must not require modern browser APIs that the field does not provide.

## Versioning

Protocol version `0.1` is a spike contract. Breaking changes require a new minor/major version and explicit support check during `ui.ready`.

Recommended compatibility handshake:

```json
{
  "protocolVersion": "0.1",
  "requestId": "1",
  "command": "ui.ready",
  "payload": {
    "capabilities": {
      "jsDirectCall": true,
      "domMailbox": true,
      "cssGrid": false,
      "svgAnimation": false
    }
  }
}
```

1С must still be authoritative. HTML-reported capabilities help choose rendering mode; they do not unlock cashier logic.
