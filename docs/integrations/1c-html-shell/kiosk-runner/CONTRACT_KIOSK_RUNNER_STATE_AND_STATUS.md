# Contract: KioskRunner State And Status

Дата: 2026-05-28  
Статус: draft  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## 1. Purpose

`state.json` is the local durable state for update idempotency, rollback and diagnostics. HTTP status payload is the local diagnostic view of this state plus web server health.

Neither state nor status may contain 1С business data.

## 2. `state.json` Example

```json
{
  "currentVersion": "2026.05.28.1",
  "previousVersion": "2026.05.27.1",
  "currentSha256": "64-char-lowercase-hex-sha256",
  "lastCheckAt": "2026-05-28T12:05:00Z",
  "lastUpdateStatus": "updated",
  "lastError": null,
  "lastSuccessfulUpdateAt": "2026-05-28T12:05:00Z",
  "webServerStatus": "listening"
}
```

## 3. Field Contract

| Field | Required | Meaning |
| --- | --- | --- |
| `currentVersion` | yes after first install | Version currently published through `current`. |
| `previousVersion` | optional | Previous working version for rollback. |
| `currentSha256` | yes after first install | SHA-256 of installed bundle zip. |
| `lastCheckAt` | optional | Last manifest check attempt. |
| `lastUpdateStatus` | optional | Last update outcome. |
| `lastError` | optional | Sanitized last error. |
| `lastSuccessfulUpdateAt` | optional | Last successful current switch. |
| `webServerStatus` | optional | `listening`, `degraded`, `failed`, `disabled`. |

## 4. Update Status Values

| Value | Meaning |
| --- | --- |
| `noop` | Manifest version equals current version. |
| `updated` | New version installed and current switched. |
| `failed` | Update attempt failed without changing current. |
| `blocked` | Manifest rejected by policy or compatibility. |
| `rolledBack` | Current restored from previous local version. |
| `invalidState` | State file damaged or inconsistent. |

## 5. Health Values

| Health | Meaning |
| --- | --- |
| `ok` | Config valid, web server listening, current available. |
| `degraded/no_config` | Config missing or invalid. |
| `degraded/no_current` | Web server can run but no showcase installed yet. |
| `unhealthy/port_in_use` | Configured port cannot bind. |
| `unhealthy/web_server_failed` | Static server failed. |
| `unhealthy/storage` | Storage path unavailable or unsafe. |
| `unhealthy/invalid_state` | State cannot be trusted. |

## 6. HTTP Status Payload

Endpoint: `/runner/status` by default.

```json
{
  "runnerId": "kiosk-runner-bolars-001",
  "showcaseId": "bolars",
  "health": "ok",
  "runnerVersion": "0.3.0",
  "webServer": {
    "listening": true,
    "listenHost": "127.0.0.1",
    "port": 8787,
    "basePath": "/kiosk/bolars/"
  },
  "currentVersion": "2026.05.28.1",
  "previousVersion": "2026.05.27.1",
  "lastCheckAt": "2026-05-28T12:05:00Z",
  "lastUpdateStatus": "updated",
  "lastSuccessfulUpdateAt": "2026-05-28T12:05:00Z",
  "lastError": null
}
```

## 7. Health Endpoint

Endpoint: `/healthz` by default.

MVP may return simple JSON:

```json
{"health":"ok"}
```

or appropriate HTTP status:

- `200` for `ok`;
- `503` for degraded/unhealthy modes.

## 8. Forbidden Status Fields

Status must not expose:

- secrets, tokens, credentials;
- registry credentials;
- raw private URLs with credentials;
- 1С internal object references;
- carts, cart lines, prices, discounts;
- payment, card, fiscal or receipt data;
- phones, names, emails or customer PII;
- stack traces with local secrets.

## 9. State Write Rule

State updates should be durable and replace-based. Partial writes must not corrupt the last known good state. If state is damaged, runner should enter `invalidState` and avoid destructive update until recovery logic resolves it.
