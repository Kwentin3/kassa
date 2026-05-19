# 1C HTML Shell RMK Adapter Map

Дата: 2026-05-19  
Статус: architecture draft for 1C specialist review  
Scope: маппинг `1C_HTML_SHELL_BRIDGE` команд на потенциальные точки 1С/РМК

## Purpose

Документ проектирует слой адаптера между HTML FrontShell и реальными возможностями 1С/РМК. Он не утверждает, что у РМК уже есть удобный public API для каждой операции. Напротив, главная задача адаптера - изолировать HTML от внутренностей РМК и вынести все неизвестные места в spike.

## Architecture

```text
FrontShell HTML
↓
Bridge Event Receiver
↓
Command Router
↓
RMK Adapter
↓
1C RMK / чек / оборудование / эквайринг / ККТ
↓
ScreenStateBuilder
↓
FrontShell.updateState(state)
```

Per-command mapping pattern:

```text
HTML command
→ 1C Bridge Router
→ RMK Adapter method
→ real 1C object/procedure/module/form, confirmed by 1C specialist
→ RMK/equipment result
→ ScreenStateBuilder
→ FrontShell.updateState(state)
```

## Adapter Principles

1. HTML sends intent only.
2. Command Router validates protocol, requestId, command and payload before touching РМК.
3. RMK Adapter is the only layer that knows configuration-specific forms, modules, documents and equipment integration.
4. ScreenStateBuilder returns a buyer-safe DTO snapshot.
5. HTML never receives internal 1С references unless they are opaque display ids created for the shell.
6. Default integration path should prefer extension/external processing/safe adapter before modifying a typical configuration.
7. If a standard RMK operation cannot be called safely, do not reimplement cashier logic in HTML.

## Known 1C/RMK Product Context

Official 1С product pages confirm that:

- 1С:РМК has a special self-checkout mode;
- self-checkout based on 1С:РМК works with 1С:Розница and 1С:УНФ;
- buyer scenarios include barcode/manual product selection, loyalty, payment method selection and payment;
- 1С:Розница/RMK context includes rights separation, payment cards, SBP, checks, age-restricted goods and cashier operations.

These product capabilities do not automatically mean an extension can programmatically control each operation through a stable API. Every adapter method below needs confirmation in the target configuration.

Sources:

- https://v8.1c.ru/rmk/kassy-samoobsluzhivaniya/
- https://v8.1c.ru/retail/rabochee-mesto-kassira/
- https://kb.1ci.com/1C_Enterprise_Platform/Guides/Developer_Guides/1C_Enterprise_8.3.23_Developer_Guide/Chapter_5._Configuration_objects/5.10._Reports_and_data_processors/5.10.2._External_data_processors_and_reports/

## Proposed 1C Layers

| Layer | Responsibility |
|---|---|
| `BridgeEventReceiver` | Receives HTML field event, extracts raw envelope, prevents default navigation where needed. |
| `BridgeCommandRouter` | Parses JSON, validates schema, applies idempotency/session lock, dispatches command. |
| `RMKAdapter` | Calls available 1С/RMK mechanisms. One implementation per target config if needed. |
| `EquipmentStateReader` | Reads scanner/payment/KKT/terminal states through 1С/RMK only. |
| `ScreenStateBuilder` | Builds sanitized state envelope for HTML. |
| `BridgeResponseSender` | Sends state to HTML through JS call or DOM mailbox. |
| `BridgeAuditLog` | Logs requestId, command, sessionId, outcome, error codes. |

## Candidate Adapter Interface

Names are illustrative and must be mapped by a 1C specialist:

```text
StartSession()
CancelSession(reason)
FinishSession()
GetCurrentState()
GetCurrentReceipt()
AddByBarcode(barcode)
AddProduct(productId, quantity)
RemoveLine(lineId)
ChangeQuantity(lineId, quantity)
ClearCart(reason)
SearchCatalog(query)
OpenCategory(categoryId)
OpenProduct(productId)
StartCardPayment()
StartSbpPayment()
CancelPayment(reason)
GetPaymentStatus()
GetReceiptStatus()
RequestPrintCopy()
RequestStaffHelp(reason)
CancelStaffHelpRequest()
AcknowledgeError(code)
```

## Command Mapping

Status values:

- `known_supported`: confirmed in target contour;
- `likely_available`: product supports the business capability, API point not confirmed;
- `unknown_needs_spike`: needs 1C specialist and test base;
- `risky`: likely requires form/module customization or has cashier consistency risk;
- `not_applicable`: no RMK action.

### UI / Terminal Commands

| command | payload | expected RMK action | possible 1C/RMK integration point | known/unknown | risk | needs spike | fallback behavior | resulting state fields |
|---|---|---|---|---|---|---|---|---|
| `ui.ready` | `capabilities` | No cashier mutation; initialize shell state. | Form open handler, HTML document loaded handler, bridge init module. | likely_available | Low. | Confirm 1C can call `FrontShell.init/updateState` after document ready. | Send state through DOM mailbox or reload shell with embedded state. | `screen`, `terminalStatus`, `theme`, `allowedCommands` |
| `ui.error` | `code`, `message`, `detail?` | Log UI problem, maybe block terminal if shell unusable. | Bridge router audit/log module. | likely_available | Medium if error occurs during payment/receipt. | Confirm safe logging and staff escalation. | Show staff-required screen from 1С. | `errorMessage`, `staffRequired`, `terminalStatus` |
| `terminal.ping` | none | Return liveness state. | Bridge router without RMK call, optional equipment status reader. | likely_available | Low. | Confirm round-trip latency. | Return minimal ready/offline state. | `terminalStatus`, `sessionId` |
| `terminal.getStatus` | none | Read terminal/session/equipment state. | RMK state reader, equipment state reader. | unknown_needs_spike | Medium: status APIs may be scattered. | Identify where RMK stores session and equipment statuses. | Return conservative `blocked`/`staffRequired` if unknown. | `terminalStatus`, `paymentStatus`, `receiptStatus`, `staffRequired` |

### Session / Idle Commands

| command | payload | expected RMK action | possible 1C/RMK integration point | known/unknown | risk | needs spike | fallback behavior | resulting state fields |
|---|---|---|---|---|---|---|---|---|
| `session.start` | none | Start buyer sale session / prepare current receipt. | RMK session start handler, sale form command, extension around РМК form. | unknown_needs_spike | High if РМК requires its own active form state. | Can extension start a receipt/session without changing typical config? | Open/activate standard RMK flow and return idle/cart state. | `screen`, `sessionId`, `cartItems`, `cartTotal`, `terminalStatus` |
| `session.cancel` | `reason?` | Cancel active receipt/session if safe. | RMK cancel receipt command, document deletion/cancel flow, staff flow. | unknown_needs_spike | High if payment/receipt already started. | Confirm cancellation states and staff requirements. | Set `staffRequired=true` instead of cancelling automatically. | `screen`, `sessionId`, `cartItems`, `paymentStatus`, `staffRequired` |
| `session.finish` | none | Close completed buyer flow after receipt success. | RMK final sale completion handler/session reset. | unknown_needs_spike | Medium: must not finish before fiscal state final. | Confirm completed sale lifecycle. | Keep receipt screen and request staff if final state uncertain. | `screen`, `sessionId`, `receiptStatus`, `terminalStatus` |
| `session.timeout` | `screen`, `idleMs?` | Decide whether inactive session can be reset/cancelled. | RMK session timeout policy, adapter timer. | unknown_needs_spike | High if cart/payment is active. | Define policy with client/1C specialist. | Show timeout warning; require staff for payment/receipt states. | `screen`, `staffRequired`, `terminalStatus` |
| `idle.enter` | none | No cashier mutation; record idle/promo state. | FrontShell state only, optional terminal monitor. | not_applicable | Low. | Verify no active session. | Ignore if active session exists. | `screen` |
| `idle.exit` | `reason` | Start session or return to welcome/cart depending on state. | Session state reader, session.start route if needed. | unknown_needs_spike | Medium if scanner input exits idle and adds product. | Confirm scanner event ordering. | Return welcome screen, ask user to start. | `screen`, `sessionId`, `terminalStatus` |

### Cart Commands

| command | payload | expected RMK action | possible 1C/RMK integration point | known/unknown | risk | needs spike | fallback behavior | resulting state fields |
|---|---|---|---|---|---|---|---|---|
| `cart.getState` | none | Read current receipt/cart. | Current receipt object, RMK form state, sale document/query. | unknown_needs_spike | Medium: current receipt may be UI-local. | Locate authoritative current check state. | Return empty/blocked state if no active session. | `cartItems`, `cartTotal`, `screen`, `errorMessage` |
| `cart.addByBarcode` | `barcode` | Find product by barcode and add to current receipt. | RMK scanner handler, retail sale module, barcode search service. | unknown_needs_spike | High: штатный scanner flow may be tied to RMK form focus. | Confirm programmatic barcode add without bypassing rules. | Route through standard scanner/add mechanism if callable; otherwise staff-required/not found. | `cartItems`, `cartTotal`, `lastScannedProduct`, `errorMessage`, `staffRequired` |
| `cart.addProduct` | `productId?`, `code?`, `quantity?` | Add known product/catalog item to current receipt. | RMK product selection command, catalog selection handler. | unknown_needs_spike | High: product ids must not bypass pricing/marking restrictions. | Confirm safe product identifier and add API. | Ask staff or show product unavailable if cannot validate. | `cartItems`, `cartTotal`, `lastScannedProduct`, `staffRequired` |
| `cart.removeItem` | `lineId` | Remove receipt line if buyer is allowed. | RMK line deletion command, staff approval flow. | unknown_needs_spike | High for alcohol/marked/paid states. | Confirm line id mapping and permission logic. | Set staff-required or reject with recoverable error. | `cartItems`, `cartTotal`, `errorMessage`, `staffRequired` |
| `cart.changeQuantity` | `lineId`, `quantity` | Change line quantity through RMK rules. | RMK quantity edit command, receipt line operation. | unknown_needs_spike | High for weighted/marked/discounted items. | Confirm quantity rules and rounding. | Reject and offer remove/re-add or staff help. | `cartItems`, `cartTotal`, `errorMessage`, `staffRequired` |
| `cart.clear` | `reason?` | Clear receipt if no blocking state. | RMK cancel/clear receipt command. | unknown_needs_spike | High if payment pending or fiscal state exists. | Confirm safe cart clear state machine. | Require staff or keep cart. | `cartItems`, `cartTotal`, `screen`, `staffRequired` |

### Catalog Commands

| command | payload | expected RMK action | possible 1C/RMK integration point | known/unknown | risk | needs spike | fallback behavior | resulting state fields |
|---|---|---|---|---|---|---|---|---|
| `catalog.search` | `query` | Search product list allowed for self-checkout. | Catalog query, RMK product selection module, price/stock filter. | unknown_needs_spike | Medium: search must respect sale availability. | Confirm query source and returned fields. | Return empty result with scan/help options. | `catalog`, `screen`, `errorMessage` |
| `catalog.openCategory` | `categoryId` | Load category products. | Product group/catalog query, RMK quick goods settings. | unknown_needs_spike | Medium: category taxonomy may be absent/custom. | Confirm category source. | Return root catalog or search screen. | `catalog`, `screen` |
| `catalog.openProduct` | `productId` | Load buyer-safe product details and sale constraints. | Product DTO builder, price/availability check. | unknown_needs_spike | Medium: product may require marking/staff/weight. | Confirm fields and constraints. | Show generic unavailable/staff-required state. | `catalog`, `screen`, `staffRequired` |
| `catalog.back` | none | Navigate within catalog state. | ScreenStateBuilder UI navigation state. | likely_available | Low. | Confirm where catalog navigation stack lives. | Return cart/root catalog. | `screen`, `catalog` |

### Payment / Receipt Commands

| command | payload | expected RMK action | possible 1C/RMK integration point | known/unknown | risk | needs spike | fallback behavior | resulting state fields |
|---|---|---|---|---|---|---|---|---|
| `payment.startCard` | none | Start card payment through 1С/RMK acquiring. | RMK payment command, connected equipment/acquiring driver. | unknown_needs_spike | Critical: payment consistency and hardware state. | Confirm callable standard payment flow and status callback. | Block buyer UI and request staff/manual RMK payment. | `paymentStatus`, `screen`, `busy`, `errorMessage`, `staffRequired` |
| `payment.startSbp` | none | Start SBP payment through 1С/RMK if configured. | RMK SBP integration, QR generation/status module. | unknown_needs_spike | Critical: dynamic QR/status lifecycle. | Confirm SBP availability and payment status polling. | Hide SBP method or request staff. | `paymentStatus`, `screen`, `sbpQr`, `busy`, `errorMessage` |
| `payment.cancel` | `reason?` | Cancel pending payment if acquiring/RMK allows. | RMK/acquiring cancel command. | unknown_needs_spike | Critical: late success after cancel request. | Confirm final statuses and race handling. | Keep locked pending/staff-required until status known. | `paymentStatus`, `screen`, `staffRequired`, `errorMessage` |
| `payment.getStatus` | none | Read current payment status. | Payment driver/RMK status reader. | unknown_needs_spike | High if status is async/hardware-owned. | Confirm polling/callback API. | Return `unknown` and staff-required after timeout. | `paymentStatus`, `busy`, `errorMessage`, `staffRequired` |
| `receipt.getStatus` | none | Read fiscalization/print status. | RMK receipt/KKT state reader. | unknown_needs_spike | Critical after payment success. | Confirm receipt final states and error recovery. | Staff-required if unknown after payment. | `receiptStatus`, `screen`, `errorMessage`, `staffRequired` |
| `receipt.requestPrintCopy` | none | Print receipt copy if legally/operationally allowed. | RMK print copy command, KKT/receipt subsystem. | unknown_needs_spike | High: print copy rules and KKT state. | Confirm allowed cases and audit. | Show "staff will help" state. | `receiptStatus`, `errorMessage`, `staffRequired` |

### Staff / Error Commands

| command | payload | expected RMK action | possible 1C/RMK integration point | known/unknown | risk | needs spike | fallback behavior | resulting state fields |
|---|---|---|---|---|---|---|---|---|
| `staff.requestHelp` | `reason?`, `screen?` | Signal staff assistance needed. | RMK attendant mode, service notification, local UI flag. | unknown_needs_spike | Medium: actual staff notification may not exist. | Confirm available staff workflow. | Set local staff-required state and visual call screen. | `staffRequired`, `staffReason`, `screen` |
| `staff.cancelHelpRequest` | none | Cancel pending help if safe. | Staff/help state module. | unknown_needs_spike | Medium if critical lock is active. | Confirm cancelable states. | Ignore or keep staff-required. | `staffRequired`, `screen` |
| `error.acknowledge` | `code?` | Clear recoverable UI error or keep lock. | Router/state machine, RMK error handler. | likely_available | Medium: must not clear fiscal/payment errors. | Define clearable error classes. | Return current state unchanged. | `errorMessage`, `screen`, `staffRequired` |

## Special RMK Operations To Spike

### Create / Start Session

Question: can an extension/external processing start a self-checkout sale session without manually operating the standard RMK form?

Spike outcome must identify:

- session object/source;
- active shift requirements;
- cashier/user rights;
- idle -> cart state transition;
- cleanup after cancellation.

### Get Current Receipt

Question: where is the authoritative current receipt before fiscalization?

Need to identify:

- in-memory RMK form state vs document object;
- line identifiers stable enough for HTML `lineId`;
- total calculation source;
- discounts/loyalty recalculation trigger.

### Add Product By Barcode

Question: can the adapter call the same logic as hardware scanner/RMK?

Must preserve:

- barcode lookup;
- price selection;
- stock/availability;
- marking/age restrictions;
- staff-required conditions;
- duplicate scan behavior.

### Marked / Staff-Required Goods

Question: how does target configuration handle marked goods, age-restricted goods, alcohol/tobacco and goods requiring attendant approval?

FrontShell may only render:

- `staffRequired=true`;
- reason code;
- buyer-safe message;
- disabled payment/add actions if required.

### Payment

Question: can card/SBP payment be started and observed from adapter layer?

Must identify:

- available payment methods;
- command to start payment;
- pending/success/declined/timeout/cancelled statuses;
- race behavior when cancel and success overlap;
- whether UI must hand control to standard RMK payment dialog.

### Receipt / Fiscalization / Print

Question: can adapter reliably know final receipt state?

Must identify:

- payment-success but fiscalization-failed state;
- KKT offline/error state;
- print success/failure;
- receipt copy rules;
- staff recovery flow.

## ScreenStateBuilder Contract

ScreenStateBuilder must return safe DTOs only.

Recommended state groups:

| Group | Fields |
|---|---|
| Terminal | `terminalStatus`, `terminalNumber`, `staffRequired`, `staffReason` |
| Session | `sessionId`, `screen`, `allowedCommands`, `busy`, `busyMessage` |
| Cart | `cartItems`, `cartTotal`, `currency`, `lastScannedProduct` |
| Catalog | `catalog.categories`, `catalog.products`, `catalog.query`, `catalog.breadcrumbs` |
| Payment | `paymentStatus`, `paymentMethods`, `sbpQr`, `paymentMessage` |
| Receipt | `receiptStatus`, `receiptNumber`, `receiptSummary`, `receiptMessage` |
| Error | `errorMessage`, `errorCode`, `retryAllowed` |
| Theme | `theme`, `branding` |

Do not expose:

- raw document references;
- internal module/procedure names;
- cash register driver details;
- acquiring tokens;
- fiscal storage identifiers beyond buyer-safe receipt display;
- staff credentials;
- database connection strings.

## Minimal Proof Of Concept

The first PoC should be intentionally small:

1. Open a 1C form with `Поле HTML-документа`.
2. Load single-file vanilla HTML/CSS/JS from a макет or string.
3. HTML sends `ui.ready`.
4. 1С sends initial `updateState({ screen: "idle" })`.
5. Buyer taps "start"; HTML sends `session.start`.
6. 1С creates/opens a test sale session or returns stub state if RMK point is not found.
7. HTML sends `cart.addByBarcode` with one known barcode.
8. Adapter uses the closest standard RMK mechanism to add product.
9. 1С sends full cart state.
10. HTML sends `payment.startCard`.
11. Adapter either starts real test acquiring in sandbox/test terminal or returns explicit `unknown_needs_spike` state.

Success criteria:

- both bridge directions work repeatedly;
- duplicate tap does not duplicate receipt line;
- state survives HTML reload;
- no cashier truth is stored in HTML;
- 1C specialist can point to exact modules/forms/procedures used or prove they are unavailable.

## Open Questions For 1C Specialist / Client

- Какая версия платформы 1С?
- Какая версия конфигурации?
- Это УТ 11 / Розница / УНФ / кастом?
- Конфигурация типовая или сильно доработанная?
- Включен ли режим совместимости?
- Используется толстый, тонкий или web-клиент?
- Какая ОС терминала?
- Как запускается РМК?
- Это стандартный РМК или доработанная форма?
- Можно ли использовать расширения?
- Можно ли использовать внешние обработки?
- Есть ли тестовая база?
- Есть ли тестовый терминал?
- Как подключены сканер, эквайринг, ККТ, маркировка?
- Можно ли программно управлять текущим чеком?
- Можно ли добавить товар в чек из расширения?
- Можно ли получить состояние текущего чека?
- Можно ли запустить штатную оплату?
- Можно ли получить статус оплаты?
- Можно ли безопасно встроить альтернативную HTML-форму поверх/рядом с РМК?
- Есть ли штатный self-checkout mode 1С:РМК в используемом контуре?
- Какие операции требуют сотрудника в текущей кассовой политике?
- Можно ли использовать отдельного технического пользователя/роль для shell adapter?
- Какие требования к журналу действий покупателя/сотрудника?
- Какие ограничения поставщика/сопровождения по изменению типовой конфигурации?

## Final Adapter Verdict

FrontShell should proceed only behind an RMK Adapter boundary.

Proceed if:

- bridge transport works both directions;
- current receipt can be read safely;
- barcode/product add can reuse standard RMK logic;
- payment and receipt final states can be observed reliably;
- staff-required states are explicit;
- extension/external processing path is acceptable for the client.

Do not proceed by moving cashier logic into HTML if any of these fail. In that case either use standard 1С:РМК self-checkout UI, customize РМК through supported 1С mechanisms, or design a separate backend/payment/KKT architecture as a different project with different risk and compliance scope.
