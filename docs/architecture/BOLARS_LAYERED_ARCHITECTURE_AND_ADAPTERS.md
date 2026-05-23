# BOLARS Layered Architecture and Adapters

Статус: draft 0.1
Дата: 2026-05-23
Назначение: архитектурная карта слоёв BOLARS Self-Checkout MVP, adapters, debug и preview.

## 1. Purpose

Документ изолирует UI, application orchestration, RuntimePort, adapter selection, adapters, debug и preview.

Цель: не смешать screens/components, mock, preview, 1С, debug и бизнес-логику в один слой.

## 2. Related Documents

- `docs/AGENT_START_HERE.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md`
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`

## 3. Layer Map

```text
Presentation Layer / UI Screens
  ↓
Application Layer / user intent orchestration
  ↓
SelfCheckoutRuntimePort
  ↓
RuntimeAdapterFactory
  ↓
MockAdapter / PreviewAdapter / OneCInterfaceAdapter
  ↓
1С / РМК / search / scanner-router / loyalty / payment / future KKT
```

## 4. Layers

### 4.1 Presentation Layer

Owns:

- screens;
- components;
- layout;
- theme tokens;
- visual states;
- accessibility and touch interactions.

Rules:

- render only from authoritative snapshot;
- no price/totals/discount/payment calculations;
- no adapter imports;
- no direct 1С/payment/search/scanner calls.

### 4.2 Application Layer

Owns:

- user intent orchestration;
- command creation;
- command ids;
- local draft inputs;
- focus/open/close UI details that do not decide business state.

Rules:

- dispatch typed commands;
- keep draft input state only;
- no business decisions;
- no adapter-specific branching.

### 4.3 Runtime Port

Owns:

- `dispatch`;
- `getState`;
- `subscribe`;
- typed commands;
- authoritative `SelfCheckoutStateSnapshot`.

`SelfCheckoutRuntimePort` is the only dependency visible to UI/application code.

### 4.4 Adapter Factory

Owns adapter selection.

Selection inputs:

- query params;
- runtime mode;
- environment;
- 1С shell availability;
- build config;
- feature flags.

Adapter choice must be visible in debug, but customer UI must not expose adapter switching.

### 4.5 Adapters

Supported adapters:

- `MockAdapter`;
- `PreviewAdapter`;
- `OneCInterfaceAdapter`.

Rules:

- all implement `SelfCheckoutRuntimePort`;
- all return authoritative snapshots for their mode;
- none create a second UI API;
- adapter internals remain hidden from Presentation Layer.

### 4.6 External Systems

External systems may include:

- 1С / РМК;
- search;
- scanner-router;
- loyalty;
- payment;
- future KKT.

First slice does not design KKT/fiscalization/OFD, Честный знак, media delivery or real payment internals.

## 5. Dependency Rules

Allowed:

- Presentation -> RuntimePort types;
- Application -> RuntimePort;
- Factory -> adapters;
- Adapters -> external systems;
- DebugObserver -> runtime/adapter status;
- Preview controls -> PreviewAdapter scenarios through RuntimePort.

Forbidden:

- Presentation -> `OneCInterfaceAdapter`;
- Presentation -> `PaymentAdapter`;
- Presentation -> `ScannerRouterAdapter`;
- Presentation -> direct 1С;
- Presentation -> direct cart/totals mutation;
- Preview controls -> direct screen render;
- Debug panel -> business command execution;
- Debug panel -> production admin behavior.

## 6. Debug

`DebugObserver` reads runtime/adapter status and displays diagnostics:

- adapter kind;
- route/build;
- outbound queue;
- last command;
- last snapshot;
- command/snapshot correlation;
- apply status.

Debug does not mutate business state and does not become an admin surface.

## 7. Preview

Preview mode uses `PreviewAdapter`.

```text
Preview control
  -> PreviewAdapter
  -> SelfCheckoutRuntimePort
  -> authoritative preview snapshot
  -> UI renders snapshot
```

Preview does not bypass render pipeline and does not directly render screens/components.

## 8. Why

- Preview Mode can open rare states without forcing the full customer journey.
- Snapshot-based preview keeps UI honest: the same screens render the same state contract as mock and 1С.
- Adapter Factory lets UI stay independent of mock/preview/1С runtime source.
- Debug becomes more useful because it can show adapter kind, queue status, preview status and snapshot apply status.
- Layer isolation reduces the risk that UI starts calculating prices, mutating cart or calling 1С directly.
- 1С specialists can diagnose handshake and state transfer without understanding React internals.

## 9. Deferred Work

- Full production hardening of 1C/RMK rollout beyond first interface adapter handshake.
- Real payment adapter hardening.
- KKT/fiscalization/OFD.
- Честный знак / marked product workflow.
- Media delivery.
- Production theme admin.
