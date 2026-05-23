# BOLARS MVP Implementation Report

Дата: 2026-05-23
Статус: local implementation complete, pending commit/deploy at report creation
Scope: BOLARS Self-Checkout MVP route, RuntimePort, adapters, debug, preview, screens, tokens and handoff.

## 1. Что Реализовано

Реализован отдельный BOLARS Self-Checkout MVP внутри текущего React/Vite SPA:

- canonical route: `/bolars/self-checkout-mvp`;
- debug route: `/bolars/self-checkout-mvp?debug=1`;
- preview route: `/bolars/self-checkout-mvp?debug=1&preview=1`;
- isolated route branch in `src/app/App.tsx`;
- BOLARS app shell and screens in `src/bolars/BolarsSelfCheckoutApp.tsx`;
- typed `SelfCheckoutRuntimePort`;
- `RuntimeAdapterFactory`;
- `MockAdapter`;
- `PreviewAdapter`;
- `OneCInterfaceAdapter` shell;
- `window.BolarsSelfCheckout` Web API;
- debug panel;
- preview scenario selector;
- BOLARS token-driven theme.

Старый showcase route не переносился и не использовался как source of truth.

## 2. Delivery Slices

Выполнены slices 0-11 из roadmap:

- Slice 0: repo/current state audit completed. Stack: React + TypeScript + Vite + Tailwind + Zustand. Safe insertion point: SPA branch in `src/app/App.tsx`.
- Slice 1: BOLARS route shell added with debug/preview query recognition.
- Slice 2: RuntimePort types and state model added.
- Slice 3: RuntimeAdapterFactory added with adapter selection safety.
- Slice 4: MockAdapter scan-first flow added.
- Slice 5: PreviewAdapter and scenario registry added.
- Slice 6: OneCInterfaceAdapter shell and `window.BolarsSelfCheckout` API added.
- Slice 7: Debug panel added.
- Slice 8: Customer screens render from snapshots.
- Slice 9: BOLARS theme/tokens and portrait visual target added.
- Slice 10: local integration smoke completed; deployment pending until commit/push.
- Slice 11: documentation handoff updated.

## 3. Gates

- Gate A Foundation: passed locally. Route exists, debug/preview flags recognized, RuntimePort typed, AdapterFactory works.
- Gate B Runtime: passed locally. Mock, Preview and OneC shell work through RuntimePort. Command queue lifecycle, snapshot apply and stale rejection are covered by tests.
- Gate C UI: passed locally. Screens render snapshots, actions dispatch typed commands, preview screenshots cover required states, no direct adapter imports from UI were found.
- Gate D Deployment: pending at report creation.
- Gate E Documentation/Handoff: updated in `docs/AGENT_START_HERE.md` and contract notes; final commit/deploy data must be recorded after deployment.

## 4. Key Files Changed

- `src/app/App.tsx`
- `src/styles/index.css`
- `src/bolars/BolarsSelfCheckoutApp.tsx`
- `src/bolars/runtime/types.ts`
- `src/bolars/runtime/defaults.ts`
- `src/bolars/runtime/baseAdapter.ts`
- `src/bolars/runtime/mockAdapter.ts`
- `src/bolars/runtime/previewAdapter.ts`
- `src/bolars/runtime/previewScenarios.ts`
- `src/bolars/runtime/onecInterfaceAdapter.ts`
- `src/bolars/runtime/adapterFactory.ts`
- `src/bolars/runtime/webApi.ts`
- `src/bolars/runtime/commands.ts`
- `src/bolars/theme/bolarsTheme.ts`
- `src/bolars/runtime/__tests__/bolarsRuntime.test.ts`
- `src/bolars/__tests__/bolarsApp.test.tsx`

## 5. Routes

Implemented and locally smoke-tested:

- `http://127.0.0.1:4173/bolars/self-checkout-mvp`
- `http://127.0.0.1:4173/bolars/self-checkout-mvp?debug=1`
- `http://127.0.0.1:4173/bolars/self-checkout-mvp?debug=1&preview=1`

Public production-like routes to verify after deploy:

- `https://kassa.speechbattle.com/bolars/self-checkout-mvp`
- `https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1`
- `https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1&preview=1`

## 6. `window.BolarsSelfCheckout` Methods

Implemented:

- `getRuntimeInfo()`;
- `getRuntimeInfoJson()`;
- `drainOutboundCommandsJson()`;
- `peekOutboundStatusJson()`;
- `receiveStateSnapshot(snapshotJsonString)`;
- `receiveRuntimeConfig(configJsonString)`;
- `receiveCatalog(catalogJsonString)`;
- `getLastApplyStatusJson()`;
- `getDebugStateJson()`.

No `window.Showcase` namespace is used for BOLARS MVP.

## 7. RuntimeAdapterFactory

Implemented rules:

- customer route defaults to `MockAdapter`;
- `debug=1&preview=1` selects `PreviewAdapter`;
- `debug=1&adapter=onec` selects `OneCInterfaceAdapter`;
- `debug=1&runId=onec-*` selects `OneCInterfaceAdapter` for 1C mini-smoke;
- `preview=1` without `debug=1` is ignored safely;
- customer route has no adapter switcher;
- debug panel shows adapter kind read-only.

## 8. Adapters

`MockAdapter`:

- deterministic scan-first runtime;
- repeated scan increments quantity;
- search starts after 4+ chars;
- search candidate selection adds/increments cart line;
- quantity numpad, cancel modal, packages, discount, manager, payment waiting/success/error and reset states.

`PreviewAdapter`:

- deterministic scenario snapshots;
- preview controls do not render screens directly;
- preview does not enqueue commands to OneC.

`OneCInterfaceAdapter`:

- outbound command queue;
- JSON string helpers for 1C;
- snapshot apply path;
- stale snapshot rejection;
- command/snapshot correlation;
- queue overflow and timeout status.

## 9. Preview Scenarios

Implemented scenarios:

- `startIdle`;
- `cartEmpty`;
- `cartOneItem`;
- `cartManyItems`;
- `cartWithManager`;
- `searchBelowMin`;
- `searchFound`;
- `searchNotFound`;
- `quantityNumpad`;
- `cancelConfirmation`;
- `paymentSetup`;
- `discountApplied`;
- `discountNotFound`;
- `paymentWaiting`;
- `paymentError`;
- `finalSuccess`;
- `inactivityTimeoutWarning`;
- `textScaleLarge`;
- `textScaleExtraLarge`;
- `themeError`.

## 10. Debug Panel

Debug panel is visible only with `debug=1` and shows:

- route/build/runtime info;
- Web API status;
- adapter status;
- outbound queue;
- last outbound command;
- last inbound snapshot;
- apply status;
- command/snapshot correlation;
- preview state when preview is active;
- collapsed masked raw views.

Debug panel is read-only and does not provide manual JSON import, textarea paste, file upload or business operation launchers.

## 11. Command Queue Lifecycle

Implemented lifecycle states:

- `queued`;
- `drainedByOneC`;
- `processing`;
- `snapshotReceived`;
- `acknowledged`;
- `failed`;
- `timeout`;
- `unknown`.

`drainOutboundCommandsJson()` changes queued commands to `drainedByOneC`; it does not mark success. Success comes from a correlated snapshot or future explicit ack.

Max pending commands for first slice: `20`.

## 12. Command/Snapshot Correlation

Correlation uses:

- outbound `commandId`;
- inbound `lastProcessedCommandId`;
- inbound `lastCommandResult`.

Local 1C mini-smoke confirmed that a drained command becomes `snapshotReceived` after `receiveStateSnapshot()` with matching `lastProcessedCommandId`.

## 13. Stale Snapshot Rejection

`receiveStateSnapshot()` rejects snapshots with lower `snapshotVersion`, keeps the last valid snapshot and records `staleSnapshotRejected` in apply status/debug.

Unsupported screens and invalid shape are rejected rather than silently fixed.

## 14. Queue Overflow / Timeout

Queue overflow test covers max pending command limit. Debug status exposes overflow and pending queue data.

Timeout status is represented in lifecycle/debug model for commands that do not receive snapshot/ack in time.

## 15. Masking

Debug payload summaries and raw views mask sensitive-like values:

- barcode-like codes;
- phone;
- discount/card-like values;
- manager codes;
- token/secret-like fields;
- e-mail-like values;
- internal reference-like fields.

Masking smoke used phone input and confirmed debug payload did not show the raw phone.

## 16. Screenshots / Evidence

Visual smoke screenshots are stored in:

`docs/reports/2026-05-23/bolars-implementation-evidence/`

Files:

- `start.png`;
- `cart.png`;
- `payment-setup.png`;
- `payment-waiting.png`;
- `payment-error.png`;
- `final-success.png`;
- `debug-preview.png`;
- `debug-masked-payload.png`.

Local visual smoke checked 1080x1920 viewport and no horizontal overflow for the main BOLARS screens.

## 17. Tests / Checks Run

Passed:

- `npm run typecheck`;
- `npm run test:run`;
- `npm run build`.

Static checks:

- no BOLARS hardcoded HEX outside `src/bolars/theme`;
- no manual JSON import / textarea / file upload in `src/bolars`;
- no `window.Showcase` in BOLARS code;
- no direct UI import of `OneCInterfaceAdapter` outside factory/tests.

Local route smoke:

- `/` returns 200 and old app remains available;
- `/demo/smoke` returns 200;
- `/bolars/self-checkout-mvp` returns 200 without debug panel;
- `/bolars/self-checkout-mvp?debug=1` returns 200 with debug panel;
- `/bolars/self-checkout-mvp?debug=1&preview=1` returns 200 with debug and preview panels.

## 18. 1C Specialist Mini-Smoke

Local mini-smoke route:

`/bolars/self-checkout-mvp?debug=1&runId=onec-smoke-001&terminalLabel=kiosk-01`

Checked:

- `window.BolarsSelfCheckout.getRuntimeInfoJson()` returned `adapterKind=onec`;
- user action created outbound command;
- `peekOutboundStatusJson()` showed queued command;
- `drainOutboundCommandsJson()` returned command and moved it to `drainedByOneC`;
- valid dev/test snapshot was applied through `receiveStateSnapshot(snapshotJsonString)`;
- `getLastApplyStatusJson()` returned `ok=true`;
- debug panel showed command, drain, snapshot apply and correlation.

Sample snapshot is used only as dev/test artifact, not as customer/manual runtime import.

## 19. Server Verification

Pending until deploy.

## 20. Documentation Updated

Updated:

- `docs/AGENT_START_HERE.md`;
- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md`;
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`;
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`;
- this report.

## 21. Sticky Comments / TODO

No vague TODOs were added. Comments were limited to adapter lifecycle, snapshot validation and debug masking where they clarify maintenance.

## 22. vNext

Not implemented by design:

- media delivery;
- Честный знак / marked product workflow;
- KKT/fiscalization/OFD;
- real payment internals;
- production 1C/RMK hardening beyond interface handshake;
- production terminal hardening;
- production theme admin;
- official brandbook update.

## 23. Risks / Known Limits

- Public deployment and remote smoke are still pending at report creation.
- Mock payment uses deterministic local transitions and is not a real acquiring integration.
- OneC adapter shell is ready for handshake but not full production hardening.
- Debug raw masking is defensive, but upstream 1C/runtime should still avoid sending secrets.

## 24. Commit / Push / Deployment

To be recorded after commit, push and deploy:

- commit hash: pending;
- push status: pending;
- deployment status: pending;
