# BOLARS MVP Debug Panel Contract

Статус: draft 0.1
Дата: 2026-05-23
Назначение: контракт debug=1 режима для BOLARS Self-Checkout MVP.

## 1. Назначение

Debug panel помогает implementation team, 1С-специалисту и интегратору проверить Web ↔ 1С boundary без ручного JSON import и без вмешательства в customer UI.

Debug route:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1
```

Preview debug route:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1&preview=1
```

`debug=1` не является customer mode, production admin или способом выполнять бизнес-операции вручную.

## 2. Related Documents

- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md` - Web ↔ 1С adapter contract.
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md` - runtime commands/snapshots.
- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md` - adapter selection.
- `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md` - preview mode.
- `docs/AGENT_START_HERE.md` - implementation handoff.
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md` - acceptance evidence.

## 3. Visibility Rules

- Debug panel visible only with `debug=1`.
- Without `debug=1`, debug methods return only safe minimal status.
- Debug panel must not replace customer UI.
- Debug panel must not create a catalog/admin/workflow editor.
- Debug panel must not expose secrets, personal data, internal 1С references or customer commercial data.

## 4. Panel Sections

### 4.1 Route / Build

Must show:

- current URL;
- debug flag;
- `runId`;
- `terminalLabel`;
- `buildId`;
- viewport size/profile;
- route match status for `/bolars/self-checkout-mvp`.

### 4.2 Web API

Must show:

- `window.BolarsSelfCheckout` exists;
- `getRuntimeInfo` exists;
- `receiveStateSnapshot` exists;
- `receiveRuntimeConfig` exists or is explicitly reserved;
- `receiveCatalog` exists or is explicitly reserved;
- `getLastApplyStatusJson` exists;
- `getDebugStateJson` exists;
- `drainOutboundCommandsJson` exists;
- outbound command channel status.
- link to `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md` on GitHub for concise 1С programmer handoff.

### 4.3 Last Outbound Command

Must show:

- command `type`;
- `commandId`;
- `issuedAt`;
- payload summary;
- delivery status: `queued`, `drainedByOneC`, `processing`, `snapshotReceived`, `acknowledged`, `failed`, `timeout`, `unknown`;
- roundtrip ms if known.

Payload summary must mask barcode/phone/card values where needed.

### 4.4 Outbound Queue

Must show:

- pending count;
- queued count;
- drained count;
- processing count;
- failed count;
- timeout count;
- last unacked `commandId`;
- oldest pending age;
- queue overflow status;
- last drain time;
- last snapshot correlation `commandId`.

Rules:

- `drainedByOneC` means 1С read the command, not that command succeeded.
- `snapshotReceived` or `acknowledged` means the command has terminal positive evidence.
- `failed`, `timeout` or `unknown` must remain visible until reset/cleanup.
- Debug panel must not allow manual command creation.

### 4.5 Last Inbound Snapshot

Must show:

- `snapshotVersion`;
- `lastProcessedCommandId` if present;
- `lastCommandResult` if present;
- `currentScreen`;
- cart line count;
- totals summary;
- `searchState.status`;
- `paymentState.status`;
- `manager.status`;
- alerts count;
- `updatedAt`.

### 4.6 Validation / Apply Status

Must show:

- `ok`;
- kind: `snapshot`, `config`, `catalog`, `command`, `runtimeInfo`;
- errors;
- warnings;
- rendered screen;
- updatedAt.
- rejected reason, for example `staleSnapshotRejected`, `sessionMismatch`, `unsupportedScreen`, `invalidSnapshotShape`.
- last valid `snapshotVersion`.

This section mirrors `window.BolarsSelfCheckout.getLastApplyStatusJson()`.

### 4.7 Adapter Status

Must show:

- `adapterKind`: `mock`, `preview`, `onec`, `unknown`;
- `previewMode`: `true|false`;
- selected preview screen;
- selected preview scenario;
- preview snapshot version;
- outbound commands mode: `disabled`, `local`, `queued`;
- warning when preview is active: `Preview mode does not call 1С and does not perform business operations.`
- runtime port status;
- last 1С response time if known;
- command roundtrip ms if known;
- pending outbound command count;
- last drained command id.

### 4.8 Safe Raw Views

Allowed:

- collapsed last command JSON;
- collapsed last snapshot JSON;
- copy safe status JSON.

Required:

- mask secrets;
- mask personal data;
- do not show internal 1С references;
- do not expose commercial customer data.

Forbidden:

- manual JSON paste;
- manual JSON upload;
- textarea import;
- file import;
- executing business commands directly from debug panel.

### 4.9 Preview Panel Controls

Visible only when `debug=1&preview=1`.

Allowed controls:

- screen selector;
- scenario selector;
- text scale selector;
- theme profile selector if safe;
- reset preview;
- next/previous scenario optional.

Rules:

- preview controls must not execute real business commands;
- preview controls must not send commands to `OneCInterfaceAdapter`;
- preview controls must not become production admin;
- no manual JSON paste/upload.

## 5. Debug State JSON

`window.BolarsSelfCheckout.getDebugStateJson()` returns JSON string:

```json
{
  "ok": true,
  "route": "/bolars/self-checkout-mvp",
  "debug": true,
  "ready": true,
  "runId": "safe-run-id",
  "terminalLabel": "terminal-01",
  "buildId": "2026-05-23-local",
  "viewport": {
    "width": 1080,
    "height": 1920,
    "profile": "portrait1080"
  },
  "api": {
    "namespaceExists": true,
    "receiveStateSnapshotExists": true,
    "outboundChannelStatus": "ready"
  },
  "adapter": {
    "adapterKind": "preview",
    "previewMode": true,
    "selectedPreviewScreen": "paymentError",
    "selectedPreviewScenario": "paymentFailed",
    "previewSnapshotVersion": 101,
    "outboundCommandsMode": "local",
    "previewWarning": "Preview mode does not call 1С and does not perform business operations.",
    "runtimePortStatus": "ready",
    "pendingOutboundCount": 0,
    "lastRoundtripMs": 180
  },
  "outboundQueue": {
    "pendingCount": 1,
    "queuedCount": 0,
    "drainedCount": 1,
    "processingCount": 0,
    "failedCount": 0,
    "timeoutCount": 0,
    "lastUnackedCommandId": "cmd-001",
    "oldestPendingAgeMs": 240,
    "queueOverflow": false,
    "lastDrainAt": "2026-05-23T12:00:01.000Z",
    "lastSnapshotCorrelationCommandId": null
  },
  "lastOutboundCommand": {
    "type": "scanCode",
    "commandId": "cmd-001",
    "issuedAt": "2026-05-23T12:00:00.000Z",
    "payloadSummary": "masked",
    "deliveryStatus": "drainedByOneC"
  },
  "lastInboundSnapshot": {
    "snapshotVersion": 12,
    "lastProcessedCommandId": "cmd-001",
    "lastCommandResult": {
      "ok": true,
      "commandId": "cmd-001"
    },
    "currentScreen": "cart",
    "cartLineCount": 2,
    "paymentStatus": "idle",
    "managerStatus": "none",
    "alertsCount": 0
  },
  "lastApplyStatus": {
    "ok": true,
    "kind": "snapshot",
    "errors": [],
    "warnings": [],
    "renderedScreen": "cart",
    "updatedAt": "2026-05-23T12:00:01.000Z"
  }
}
```

## 6. Debug Panel Acceptance Criteria

- `?debug=1` opens BOLARS MVP with debug panel visible.
- Route/build section shows canonical MVP route and safe query params.
- Web API section confirms `window.BolarsSelfCheckout` and required methods.
- Last outbound command updates after user actions.
- After user action, command appears in outbound queue.
- After `drainOutboundCommandsJson()`, command status changes to `drainedByOneC`, not success.
- After `receiveStateSnapshot`, correlated command status changes to `snapshotReceived`/`acknowledged`.
- If snapshot does not arrive, command remains pending, then `timeout`/`unknown` is visible.
- Queue overflow/timeout is visible in debug.
- CommandId correlation is visible between last outbound command and last inbound snapshot.
- Last inbound snapshot updates after `receiveStateSnapshot`.
- Stale snapshot rejection is visible in apply status.
- Apply status shows parse/validation/render errors without crashing customer UI.
- Adapter status distinguishes `mock`, `preview`, `onec`, `unknown`.
- Debug panel shows `previewMode`, selected preview screen/scenario, preview snapshot version and outbound command mode.
- Preview panel controls appear only with `debug=1&preview=1`.
- Preview controls do not send commands to `OneCInterfaceAdapter`.
- Preview controls do not execute real business operations.
- Safe raw views are collapsed by default.
- No manual JSON import, textarea paste or file upload exists.
- Debug panel does not trigger business operations by itself.
- Debug panel does not expose secrets, personal data, internal 1С references or commercial data.
