# BOLARS MVP Implementation Roadmap

Статус: implementation roadmap
Дата: 2026-05-23
Продукт: BOLARS Self-Checkout MVP

## 1. Executive Summary

BOLARS MVP реализуется снизу вверх:

1. route/shell;
2. RuntimePort types/state model;
3. RuntimeAdapterFactory;
4. MockAdapter;
5. PreviewAdapter;
6. OneCInterfaceAdapter shell;
7. debug panel;
8. screen rendering from snapshots;
9. theme/tokens;
10. visual smoke/evidence;
11. deploy.
12. documentation/handoff update.

Не начинать с CSS-красоты и экранов без `SelfCheckoutRuntimePort`, typed state model и adapter selection. Screens должны быть потребителями authoritative snapshot, а не владельцами cart/payment/search logic.

Canonical route:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp
```

Debug route:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1
```

Preview route:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1&preview=1
```

## 2. Source Documents

Read before implementation:

1. `docs/AGENT_START_HERE.md`
2. `docs/README.md`
3. `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md`
4. `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`
5. `docs/architecture/BOLARS_LAYERED_ARCHITECTURE_AND_ADAPTERS.md`
6. `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
7. `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md`
8. `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md`
9. `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
10. `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`
11. `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
12. `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
13. `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`
14. `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`

This roadmap is operational guidance. It does not replace TZ, PRD, contracts or visual specs.

## 3. Non-Negotiable Implementation Rules

- UI renders snapshots only.
- UI dispatches typed commands only.
- UI не считает prices, discounts, line totals, payable totals или taxes.
- UI не решает repeated scan.
- UI не определяет тип barcode.
- UI не решает payment outcome.
- UI не импортирует 1C/payment/search/scanner/theme adapters.
- `MockAdapter`, `PreviewAdapter`, `OneCInterfaceAdapter` implement one RuntimePort.
- Preview mode works through `PreviewAdapter` snapshots.
- Debug panel is read-only diagnostic observer; it does not launch business operations.
- No manual JSON import.
- No textarea paste.
- No file upload for runtime data.
- No old showcase as source of truth.
- No media delivery.
- No KKT/fiscalization/OFD.
- No Честный знак implementation.
- No real payment internals.

## 4. Code Ownership Map

Exact paths must be confirmed in Slice 0. Expected ownership:

| Layer | Owns | Expected code area |
| --- | --- | --- |
| Route/Shell | BOLARS route, query parsing, app shell metadata | router/app entry, isolated BOLARS route/module |
| Runtime Types | commands, snapshots, state shape, result metadata | runtime/domain types |
| Adapter Factory | adapter selection by query/environment/build | runtime factory |
| MockAdapter | deterministic prototype flow | runtime adapters/mock |
| PreviewAdapter | deterministic preview scenarios | runtime adapters/preview |
| OneCInterfaceAdapter | `window.BolarsSelfCheckout`, outbound queue, snapshot apply | runtime adapters/onec/web API |
| Debug | read-only diagnostics | debug panel/module |
| Presentation | screens/overlays render snapshots | BOLARS screens/components |
| Theme | BOLARS tokens and text scale | theme/tokens/config |
| Evidence | tests, smokes, screenshots | tests/reports/artifacts |

Do not mix adapter internals into presentation components.

## 5. Delivery Slices

### Slice 0 - Repo / Current State Audit

Goal: understand current code, routes, old showcase, frontend structure, deploy path and safe insertion point for the new BOLARS MVP.

Why: BOLARS MVP must not overwrite the old showcase or diagnostic routes.

Input docs:

- `docs/infra-ops/STICKY_CONTEXT.md`
- `docs/runbooks/DEPLOYMENT_RUNBOOK.md`
- `docs/README.md`
- `docs/AGENT_START_HERE.md`

Implement:

- Find current routes and SPA fallback behavior.
- Find old diagnostics/showcase entry points.
- Identify frontend stack and routing mechanism.
- Identify deploy/build scripts and smoke pattern.
- Decide where `/bolars/self-checkout-mvp` will live.
- Record a short current-state note.

Check:

- Old showcase route remains separate.
- Diagnostic route is not repurposed.
- New route can be added without changing Traefik or unrelated containers.

Acceptance criteria:

- Short implementation note/current-state report exists.
- Found file/directory list is recorded.
- New route insertion point is identified.
- Old showcase separation is confirmed.

Evidence/output:

- Current route/deploy summary.
- List of relevant files/directories.
- Decision for BOLARS module location.

Do not:

- Do not start screen implementation.
- Do not change deploy infra.
- Do not break diagnostics route.

Next gate: proceed only when the new route home is clear.

### Slice 1 - Route + BOLARS Shell Foundation

Goal: create an isolated BOLARS MVP route and shell.

Why: all later runtime/screens/debug work needs a stable route that does not collide with old showcase.

Input docs:

- `docs/AGENT_START_HERE.md`
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`

Implement:

- `/bolars/self-checkout-mvp`
- `/bolars/self-checkout-mvp?debug=1`
- `/bolars/self-checkout-mvp?debug=1&preview=1`
- Basic HTML/app shell for BOLARS.
- Safe route/build metadata.
- Root stage layout placeholder.
- Query parsing for debug/preview flags.
- Explicit separation from old showcase.

Check:

- Route opens in local dev.
- Debug and preview query params are recognized.
- Customer route does not show debug/preview controls.
- No manual JSON import UI appears.

Acceptance criteria:

- Normal route opens.
- Debug route opens.
- Preview route opens or safely waits for PreviewAdapter.
- Old showcase still works separately.

Evidence/output:

- Screenshots for normal/debug/preview route placeholders.
- Route smoke result.

Do not:

- Do not add catalog as main screen.
- Do not add textarea/file import.
- Do not call 1C/payment/scanner directly.

Next gate: proceed when BOLARS route exists and old route separation is proven.

### Slice 2 - RuntimePort Types + State Model

Goal: create typed foundation before screens.

Why: screens must render authoritative snapshots and dispatch typed commands, not own business rules.

Input docs:

- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md`
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`

Implement:

- `SelfCheckoutRuntimePort` interface.
- Discriminated `SelfCheckoutCommand` types.
- `SelfCheckoutStateSnapshot` type.
- `Money`, `Cart`, `CartLine`, `Totals`.
- `SearchState`, `ScannerState`, `PaymentState`.
- `DiscountState`, `ManagerState`, `ModalState`.
- `UiConfig`, `ThemeProfile`, `FeatureFlags`.
- `SnapshotCommandResult`, `lastProcessedCommandId`, `lastCommandResult`.
- `adapterKind: mock | preview | onec | unknown`.
- Default empty/start snapshot.
- Basic shape validation/guards if feasible.

Check:

- Type model covers all MVP screens and states.
- Commands are typed, not generic free-form `any`.
- Snapshot contains payment/search/discount/manager/modal states.
- UI can read snapshot without deriving business values.

Acceptance criteria:

- Typecheck passes.
- Runtime can return a default start snapshot.
- Command union includes first-slice commands.
- No generic one-method command bag without typed payloads.

Evidence/output:

- Type files.
- Typecheck result.
- Basic state construction test.

Do not:

- Do not implement screens first.
- Do not put price/totals math in UI.
- Do not omit command correlation metadata.

Next gate: proceed when RuntimePort/state model is usable by adapters and screens.

### Slice 3 - RuntimeAdapterFactory

Goal: centralize adapter selection.

Why: UI must not know whether runtime source is mock, preview or 1C.

Input docs:

- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md`
- `docs/architecture/BOLARS_LAYERED_ARCHITECTURE_AND_ADAPTERS.md`
- `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md`

Implement:

- `RuntimeAdapterFactory`.
- `adapterKind: mock | preview | onec | unknown`.
- Selection by query/environment/build config.
- Rule: `preview=1` requires `debug=1`.
- Rule: `preview=1` selects `PreviewAdapter`.
- Rule: default local/dev can use `MockAdapter`.
- Rule: allowed 1C shell/context selects `OneCInterfaceAdapter`.
- Rule: customer route has no adapter switcher.
- Safe debug metadata for selected adapter.

Check:

- UI imports RuntimePort/factory result, not concrete adapters.
- Preview without debug is rejected/ignored safely.
- Adapter choice is visible in debug state.
- Adapter selection cannot be changed from customer UI.

Adapter selection safety:

- Customer route must not show adapter switcher.
- `adapter=mock|preview|onec` query may be allowed only in dev/debug context, if implemented at all.
- `preview=1` requires `debug=1`.
- Production/customer route must not let buyer switch adapter.
- Debug panel may show `adapterKind`, but must not switch production adapter.
- Adapter selection is centralized in `RuntimeAdapterFactory`.
- UI components must not import concrete adapters.

Acceptance criteria:

- Adapter selection is centralized.
- Factory tests cover normal/debug/preview/onec selection.
- No screen/component imports concrete adapters.
- Customer route has no adapter switcher.
- Adapter selection is available only through factory/build/debug-safe rules.
- Attempting `preview=1` without `debug=1` is rejected or ignored safely.
- Debug shows `adapterKind` read-only.

Evidence/output:

- Adapter factory tests.
- Route query selection smoke.
- Static import scan for direct adapter usage in UI.
- Screenshot/check: customer route without adapter switcher.
- Screenshot/check: debug route with read-only adapter status.

Do not:

- Do not let debug panel switch production adapter for customer route.
- Do not expose adapter selection as customer UI.
- Do not create mock-only UI path.

Next gate: proceed when RuntimePort implementation is selected only through factory.

### Slice 4 - MockAdapter Core Flow

Goal: obtain working runtime without 1C, through the same RuntimePort.

Why: first customer flow can be developed and tested before real 1C integration.

Input docs:

- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`

Implement:

- `MockAdapter implements SelfCheckoutRuntimePort`.
- Deterministic snapshots.
- Commands:
  - `startPurchase`;
  - `scanCode` product;
  - repeated scan increment;
  - `searchProducts` after 4+ chars;
  - `selectSearchCandidate`;
  - `incrementQuantity`;
  - `decrementQuantity`;
  - `openQuantityNumpad`;
  - `confirmQuantityInput`;
  - `removeCartLine`;
  - `cancelPurchaseRequest`;
  - `confirmCancelPurchase`;
  - `returnToPurchase`;
  - `goToPaymentSetup`;
  - `addPackage`;
  - `applyDiscountByPhone`;
  - `startPayment`;
  - `retryPayment`;
  - `returnToPaymentSetup`;
  - `setTextScale`;
  - `resetToStart`.
- Default RU copy through config/dictionary.
- Inactivity timeout default 5 minutes in mock runtime.

Check:

- Scan-first flow works through commands/snapshots.
- Repeated scan is resolved by adapter, not UI.
- Search under 4 chars does not request candidates.
- Payment outcome comes from adapter/snapshot.

Acceptance criteria:

- Mock mode covers main user journey.
- Cart, totals, discounts and payment states come from snapshots.
- Runtime/mock transition tests pass.
- No UI business logic is introduced.

Evidence/output:

- Runtime transition tests.
- Command -> snapshot examples.
- Mock scenario list.

Do not:

- Do not make mock a separate UI architecture.
- Do not make search a catalog flow.
- Do not add product detail modal.

Next gate: proceed when mock covers the main scan-first flow and edge states needed by screens.

### Slice 5 - PreviewAdapter + Preview Scenario Registry

Goal: open screens/states quickly for development and acceptance.

Why: strict customer workflow makes states like payment error, final success, many items and timeout warning slow to reach manually.

Input docs:

- `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md`
- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`

Implement:

- `PreviewAdapter implements SelfCheckoutRuntimePort`.
- `PreviewScenarioRegistry`.
- `preview=1` panel/selector.
- Preview scenario selection via query/UI:
  - `screen`;
  - `scenario`;
  - `textScale`;
  - optional theme profile if safe.
- Scenarios:
  - start idle;
  - cart empty;
  - cart 1 item;
  - cart many items;
  - cart with manager;
  - search below min length;
  - search found;
  - search not found;
  - quantity numpad open;
  - cancel confirmation;
  - payment setup with packages;
  - discount applied;
  - discount not found;
  - payment waiting;
  - payment error;
  - final success countdown;
  - inactivity timeout warning;
  - text scale normal/large/extraLarge;
  - theme loaded/default/error if supported by current snapshot.

Check:

- Preview renders through RuntimePort snapshot.
- Preview does not directly render screen components.
- Preview does not enqueue commands to `OneCInterfaceAdapter`.
- Preview controls appear only with `debug=1&preview=1`.

Acceptance criteria:

- `adapterKind=preview` appears in debug state.
- Selected preview screen/scenario appears in debug state.
- Visual screenshots can be produced from preview scenarios.
- Preview route does not affect customer route behavior.

Evidence/output:

- Preview scenario registry/list.
- Screenshots for main scenarios.
- Debug screenshot with `adapterKind=preview`.

Do not:

- Do not spread scenario data across UI components.
- Do not add manual JSON paste/upload.
- Do not call 1C/payment/KKT/Честный знак from preview.

Next gate: proceed when preview scenarios can drive all required screen states.

### Slice 6 - OneCInterfaceAdapter Shell + Web API

Goal: prepare real Web ↔ 1C contour without full production hardening.

Why: 1C specialists need a stable HTML API and command/snapshot diagnostics early.

Input docs:

- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`

Implement:

- `window.BolarsSelfCheckout` namespace.
- `getRuntimeInfoJson()`.
- `getRuntimeInfo()`.
- `drainOutboundCommandsJson()`.
- `peekOutboundStatusJson()`.
- `receiveStateSnapshot(snapshotJsonString)`.
- `getLastApplyStatusJson()`.
- `getDebugStateJson()`.
- Outbound command queue.
- Command lifecycle:
  - `queued`;
  - `drainedByOneC`;
  - `processing`;
  - `snapshotReceived`;
  - `acknowledged`;
  - `failed`;
  - `timeout`;
  - `unknown`.
- `commandId` ↔ snapshot correlation.
- Stale snapshot rejection.
- `sessionId` / `runId` / `terminalLabel` safety if fields are available.
- Queue overflow rule with first-slice max pending commands: 20.
- `startPayment` double-tap/duplicate guard.

Check:

- 1C can read commands programmatically through JSON string helpers.
- `drainOutboundCommandsJson()` does not mean command success.
- Valid `receiveStateSnapshot()` applies snapshot.
- Stale snapshot is rejected and visible in apply status.
- No `window.Showcase` is used for BOLARS MVP.

Acceptance criteria:

- Web API methods exist under `window.BolarsSelfCheckout`.
- Outbound command queue lifecycle is debug-visible.
- Command correlation works through `lastProcessedCommandId` / `lastCommandResult` or equivalent metadata.
- Queue overflow/timeout are visible in debug.
- Manual JSON import is absent.

Evidence/output:

- Dev console smoke for `window.BolarsSelfCheckout`.
- Command queue tests.
- Stale snapshot test.
- Queue overflow test.
- Sample JSON string helper outputs.

1C Specialist Mini Smoke:

Goal: give the 1C specialist a minimal HTML API check without full production integration.

Scenario:

1. Open:

   ```text
   https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1&runId=onec-smoke-001&terminalLabel=kiosk-01
   ```

2. Access the HTML page through:

   ```text
   Поле HTML-документа
   -> Документ
   -> window/defaultView
   -> window.BolarsSelfCheckout
   ```

3. Call:

   ```js
   window.BolarsSelfCheckout.getRuntimeInfoJson()
   ```

   `getRuntimeInfo()` is acceptable only if object return is stable in the specific 1C platform version.

4. Generate a user action in UI, for example tap start or mock scan.
5. Call:

   ```js
   window.BolarsSelfCheckout.peekOutboundStatusJson()
   ```

6. Call:

   ```js
   window.BolarsSelfCheckout.drainOutboundCommandsJson()
   ```

7. Verify the command moved to `drainedByOneC`; this is not success yet.
8. Call:

   ```js
   window.BolarsSelfCheckout.receiveStateSnapshot(snapshotJsonString)
   ```

   with a valid dev/test snapshot.

9. Call:

   ```js
   window.BolarsSelfCheckout.getLastApplyStatusJson()
   ```

10. Verify debug panel:
   - command appeared;
   - command was drained;
   - snapshot was applied;
   - correlation is visible;
   - no stale/error status is present.

Mini-smoke acceptance:

- 1C can get runtime info.
- 1C can read outbound commands.
- 1C can pass a snapshot to Web.
- Web applies the snapshot.
- Debug shows the full lifecycle.
- Manual JSON import, textarea and file upload are absent.

Mini-smoke evidence:

- 1C mini-smoke checklist/result in implementation or deployment report.
- Safe sample snapshot as dev/test artifact, if useful.
- Screenshot of debug panel after mini-smoke.
- `getLastApplyStatusJson()` result.

Sample snapshot is allowed only as dev/test artifact. It must not become manual runtime import.

Do not:

- Do not implement KKT/fiscalization/OFD.
- Do not implement real payment internals.
- Do not add media delivery contract.
- Do not make preview commands real 1C commands.

Next gate: proceed when 1C shell handshake and queue diagnostics are demonstrable.

### Slice 7 - Debug Panel

Goal: provide read-only diagnostics for implementation team and 1C specialist.

Why: Web ↔ 1C integration needs visibility into route/build, adapter selection, command queue, snapshots and apply status.

Input docs:

- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md`

Implement:

- Visible only with `debug=1`.
- Route/build section.
- Web API section.
- Adapter status.
- Outbound queue section.
- Last outbound command.
- Last inbound snapshot.
- Validation/apply status.
- Command/snapshot correlation.
- Preview section if `preview=1`.
- Safe collapsed raw views.
- No business operation launcher.

Check:

- Debug panel is hidden on customer route.
- Debug panel cannot create real commands manually.
- Raw views do not expose secrets or personal data.
- Pending queue lifecycle is visible.
- Sensitive payload summaries and raw views are masked.

Sensitive Data Masking Smoke:

Debug raw views and payload summaries must mask:

- barcode, if it is treated as sensitive in the specific contour;
- phone;
- card / discount card;
- manager card code;
- internal 1C references;
- tokens/secrets;
- e-mail / ФИО / phone, if accidentally received.

Acceptance criteria:

- Debug panel is read-only.
- No manual JSON paste/upload.
- Shows `adapterKind: mock | preview | onec | unknown`.
- Shows stale snapshot errors.
- Shows queue overflow/timeout.
- Masks sensitive data.
- Collapsed raw views are collapsed by default.
- Payload summary is safe.
- No secrets appear in debug raw views.
- Internal 1C references are not visible.
- URL query params do not contain secrets.

Evidence/output:

- Screenshot: debug normal.
- Screenshot: debug preview.
- Screenshot: failed/stale state.
- Sensitive data masking smoke result.
- Screenshot: debug with masked payload.
- Test or manual check for payload masking.
- Grep/check for known secret-like patterns, if feasible.

Do not:

- Do not turn debug into admin UI.
- Do not trigger business operations from debug controls.
- Do not expose internal 1C references.
- Do not log raw sensitive payloads to console.
- Do not store sensitive raw snapshots in `localStorage`.
- Do not add copy raw JSON without masking.

Next gate: proceed when debug proves adapter/runtime health without mutating business state.

### Slice 8 - UI Screens Rendering From Snapshots

Goal: build customer screens on top of runtime snapshots.

Why: after runtime/adapters are stable, screens can stay thin and predictable.

Input docs:

- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`

Implement:

- Start screen.
- Cart / `Ваши покупки`.
- Search candidates as cart state.
- Quantity numpad overlay.
- Cancel confirmation modal.
- Payment setup.
- Discount phone/card state on payment setup.
- Payment waiting.
- Payment error.
- Final success.
- Help placeholders only if already in scope/config.

Check:

- Screens render from snapshot only.
- User actions dispatch typed commands only.
- No product detail modal exists.
- No catalog main screen exists.
- Local state is limited to draft inputs and view affordances.

Acceptance criteria:

- Customer scan-first journey works through runtime.
- UI does not calculate cart/totals/payment outcomes.
- UI does not directly import adapters.
- UI does not call 1C/payment/search/scanner.

Evidence/output:

- Screen/component links.
- Render smoke.
- Runtime transition screenshots.

Do not:

- Do not create full internet-shop/catalog UX.
- Do not move repeated scan/search rules into UI.
- Do not create product card/detail modal.

Next gate: proceed when all MVP screens render authoritative snapshots.

### Slice 9 - Theme / Tokens / Visual Contract

Goal: bring screens to BOLARS visual contract using tokens.

Why: implementation must be brandable without hardcoding HEX or rebuilding components.

Input docs:

- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`

Implement:

- `bolars-light-default`.
- Theme token mapping.
- Semantic color/action/status tokens.
- Text scale: `normal`, `large`, `extraLarge`.
- Portrait `1080x1920` target.
- WebView/HTML-shell responsive fallback.
- Focus/pressed/disabled/busy states.
- Reduced motion fallback.

Check:

- HEX values appear only in theme/profile config.
- No horizontal scroll at `1080x1920`.
- Sticky CTA/help zones remain visible.
- Text scale variants do not break layout.
- Motions are functional and short.

Acceptance criteria:

- Visual matches BOLARS contract closely enough for prototype MVP.
- `bolars-light-default` works.
- `1080x1920` visual smoke passes.
- No hardcoded colors in components/screens.
- Touch targets are large enough for kiosk use.

Evidence/output:

- Screenshots:
  - start;
  - cart;
  - payment setup;
  - payment waiting;
  - payment error;
  - final success.
- Hardcoded HEX check result.
- Text scale screenshot set if feasible.

Do not:

- Do not build production theme admin.
- Do not prioritize dark/custom theme UI.
- Do not pixel-lock layout to screenshots.

Next gate: proceed when visual acceptance has enough evidence for review.

### Slice 10 - Integration Smoke + Deployment

Goal: publish and verify public BOLARS MVP.

Why: the handoff is incomplete until normal/debug/preview routes are reachable and old showcase remains intact.

Input docs:

- `docs/runbooks/DEPLOYMENT_RUNBOOK.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`

Implement:

- Build and test using repo scripts.
- Deploy to `https://kassa.speechbattle.com` using existing runbook.
- Verify:
  - `/bolars/self-checkout-mvp`;
  - `/bolars/self-checkout-mvp?debug=1`;
  - `/bolars/self-checkout-mvp?debug=1&preview=1`.
- Ensure old showcase/diagnostics still works.
- Collect evidence.
- Update docs if implementation differs from contracts.

Check:

- Public route works.
- Debug route works.
- Preview route works.
- Old showcase route is not broken.
- No secrets are printed or committed.
- Existing Traefik and unrelated containers are untouched.

Acceptance criteria:

- Public URL works.
- Debug works.
- Preview works.
- Old showcase intact.
- Smoke tests pass.
- Commit/push done if required by delivery workflow.

Evidence/output:

- URLs.
- Screenshots.
- Smoke results.
- Commit hash.
- Deployment notes.

Do not:

- Do not change Traefik static config.
- Do not read/print real `.env` or `.env.deploy`.
- Do not restart unrelated containers.

Next gate: move to implementation review and acceptance.

### Slice 11 - Documentation / Handoff Update

Goal: align documentation and handoff with the actual implementation.

Why: implementation may reveal factual differences in paths, file names, route details, adapter factory behavior, debug panel fields, smoke commands or deploy steps. These differences must be captured so the next agent, 1C specialist and support team do not work from stale docs.

Input docs:

- `docs/AGENT_START_HERE.md`
- `docs/README.md`
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`
- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md`
- `docs/implementation/BOLARS_MVP_IMPLEMENTATION_ROADMAP.md`
- `docs/runbooks/DEPLOYMENT_RUNBOOK.md`

Implement:

- Update docs only where actual implementation differs from current contracts/roadmap.
- Record actual route behavior.
- Record actual `window.BolarsSelfCheckout` methods.
- Record actual debug/preview behavior.
- Record 1C mini-smoke steps/results.
- Record deployment or route changes in runbook only if they really changed.
- Produce implementation/deployment report.

Check:

- Docs reflect actual route.
- Docs reflect actual HTML API methods.
- `debug=1` and `preview=1` are described as implemented.
- 1C mini-smoke is documented.
- Old showcase remains documented as separate contour.
- Deviations from documentation are either fixed or explicitly listed.

Acceptance criteria:

- Updated document list is recorded.
- Short diff summary is recorded.
- Actual URLs are recorded.
- Commit hash is recorded.
- Implementation/deployment report exists.
- No TODO remains without owner and next step.

Evidence/output:

- List of updated documents.
- Short diff summary.
- Actual URLs.
- Commit hash.
- Implementation/deployment report.

Do not:

- Do not rewrite PRD/TZ without need.
- Do not expand scope.
- Do not replace documentation with only a report.
- Do not leave TODO without owner/next step.

Next gate: proceed to final handoff only after docs and evidence match the delivered implementation.

## 6. Gates

### Gate A - Foundation Gate

After Slice 1-3:

- BOLARS route exists.
- Debug/preview query flags are recognized.
- RuntimePort is typed.
- AdapterFactory works.
- Adapter selection safety is tested.
- Customer route has no adapter switcher.
- Debug route shows read-only `adapterKind`.
- UI screens are not required yet.
- Old showcase separation is confirmed.

### Gate B - Runtime Gate

After Slice 4-6:

- MockAdapter works through RuntimePort.
- PreviewAdapter works through RuntimePort.
- OneCInterfaceAdapter shell works.
- Command queue lifecycle works.
- `receiveStateSnapshot()` applies valid snapshots.
- Stale snapshots cannot roll UI back.
- Command/snapshot correlation is visible.
- 1C mini-smoke checklist/result is documented.

### Gate C - UI Gate

After Slice 7-9:

- Debug masking smoke passed.
- Screens render snapshots.
- User actions dispatch typed commands.
- Visual contract is mostly satisfied.
- Theme tokens work.
- Preview screenshots cover required states.
- No direct adapter imports from UI.

### Gate D - Deployment Gate

After Slice 10:

- Public URL works.
- Debug URL works.
- Preview URL works.
- Evidence is collected.
- Old showcase remains intact.
- Deployment notes are recorded.

### Gate E - Documentation / Handoff Gate

After Slice 11:

- Implementation docs are updated.
- 1C mini-smoke is documented.
- Debug masking check is recorded.
- Final public URLs are recorded.
- Old showcase remains documented and intact.
- Commit hash is recorded if committed.
- All implementation deviations are fixed or explicitly listed.

## 7. Risks / Anti-Errors

| Risk | Prevention |
| --- | --- |
| Starting with CSS/screens before RuntimePort | Enforce Slice 2 before Slice 8-9. |
| Preview bypasses RuntimePort | Preview must use `PreviewAdapter` and snapshots. |
| Debug becomes admin | Debug panel is read-only and has no business operation launcher. |
| UI imports `OneCInterfaceAdapter` | Adapter selection only through `RuntimeAdapterFactory`. |
| MockAdapter becomes separate UI path | Mock implements the same RuntimePort contract. |
| Command drained interpreted as success | `drainOutboundCommandsJson()` only moves to `drainedByOneC`. |
| Stale snapshot rolls UI back | Reject lower `snapshotVersion` and keep last valid snapshot. |
| Search becomes catalog | Search remains fallback and selected candidate adds/increments cart line. |
| `receiveCatalog` becomes cart path | Cart/search/payment/totals remain commands/snapshots only. |
| Hardcoded HEX in components | HEX allowed only in theme/profile config. |
| Old showcase route broken | Slice 0 and Slice 10 explicitly verify old route. |
| Real payment/KKT accidentally added | Keep payment internals, KKT/fiscalization/OFD out of first slice. |
| Media delivery accidentally designed | Media delivery remains paused until separate 1C/media decision. |

## 8. Implementation Evidence Matrix

| Evidence item | Slice | Required? | Where to attach/report |
| --- | --- | --- | --- |
| Current route/deploy summary | 0 | Yes | Implementation note/report |
| New route smoke | 1 | Yes | Implementation report |
| Typecheck result | 2 | Yes | Implementation report/CI output |
| Runtime state construction test | 2 | Yes | Test output |
| Adapter factory tests | 3 | Yes | Test output |
| Adapter selection safety test | 3 | Yes | Test output |
| Customer route no adapter switcher screenshot/check | 3, 10 | Yes | Implementation/deployment report |
| Static import scan for UI adapter imports | 3, 8 | Yes | Implementation report |
| Mock transition tests | 4 | Yes | Test output |
| Command -> snapshot examples | 4 | Yes | Implementation report |
| Preview scenario list | 5 | Yes | Implementation report |
| Preview screenshots | 5, 9 | Yes | Visual evidence folder/report |
| `window.BolarsSelfCheckout` console smoke | 6 | Yes | Implementation report |
| 1C mini-smoke checklist/result | 6 | Yes | Implementation/deployment report |
| Command queue lifecycle tests | 6 | Yes | Test output |
| Stale snapshot rejection test | 6 | Yes | Test output |
| Queue overflow/timeout test | 6 | Yes | Test output |
| Debug normal screenshot | 7 | Yes | Visual evidence folder/report |
| Debug preview screenshot | 7 | Yes | Visual evidence folder/report |
| Debug masking smoke | 7 | Yes | Implementation report/test output |
| Customer screen render smoke | 8 | Yes | Test/smoke output |
| Visual smoke screenshots `1080x1920` | 9 | Yes | Visual evidence folder/report |
| Hardcoded HEX check | 9 | Yes | Implementation report |
| Deploy URLs | 10 | Yes | Deployment report |
| Commit hash | 10 | Yes, if committed | Deployment report |
| Documentation/handoff update summary | 11 | Yes | Implementation/deployment report |

## 9. Not In Roadmap

- Media delivery.
- Честный знак / marked product workflow.
- KKT/fiscalization/OFD.
- Real payment internals.
- Production terminal hardening.
- Production theme admin.
- Full 1C/RMK production rollout hardening.
- Official brandbook update.
- Real loyalty integration beyond RuntimePort contract.
- Real scanner-router implementation beyond RuntimePort contract.

## 10. Done Definition

The roadmap is satisfied when an implementation handoff can show:

- normal/debug/preview routes working;
- RuntimePort, AdapterFactory, MockAdapter, PreviewAdapter and OneCInterfaceAdapter shell implemented through one contract;
- screens rendering snapshots only;
- BOLARS theme/tokens applied without hardcoded component HEX;
- debug showing adapter, queue, command/snapshot correlation and apply status;
- preview scenarios covering required MVP screens/states;
- public route deployed without breaking old showcase;
- documentation/handoff updated to match implementation;
- evidence attached for each gate.
