# Contract: KioskRunner Config

Дата: 2026-05-28  
Статус: draft  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## 1. Purpose

This document defines `config.json` and `config.example.json` for KioskRunner.

`config.json` is local operational configuration created by the implementer/admin. `config.example.json` is a safe template distributed with `KioskRunner-win-x64.zip`.

## 2. Example

```json
{
  "runnerId": "kiosk-runner-bolars-001",
  "showcaseId": "bolars",
  "channel": "production",
  "registryUrl": "https://updates.example.com/showcases/bolars/production/manifest.json",
  "rootDir": "C:\\KioskShowcases\\bolars",
  "checkIntervalMinutes": 15,
  "keepVersions": 5,
  "autoUpdate": true,
  "webServer": {
    "enabled": true,
    "listenHost": "127.0.0.1",
    "port": 8787,
    "basePath": "/kiosk/bolars/",
    "staticRoot": "current",
    "enableDirectoryListing": false,
    "healthPath": "/healthz",
    "statusPath": "/runner/status"
  }
}
```

## 3. Field Contract

| Field | Required | Type | Rule |
| --- | --- | --- | --- |
| `runnerId` | yes | string | Local diagnostic id, not a secret. |
| `showcaseId` | yes | string | Must match manifest `showcaseId`. Recommended lowercase slug. |
| `channel` | yes | string | MVP canonical value: `production`. |
| `registryUrl` | yes | string URL | URL to production manifest or registry endpoint. Not branch, `main`, `dist`, or source repo. |
| `rootDir` | yes | string path | Root directory for this showcase. |
| `checkIntervalMinutes` | yes | integer | Positive value. Recommended MVP default: `15`. |
| `keepVersions` | yes | integer | Minimum `2`; must keep current and previous. |
| `autoUpdate` | yes | boolean | Enables service update loop application. |
| `webServer` | yes | object | Embedded static server config. |
| `webServer.enabled` | yes | boolean | Canonical MVP: `true`. |
| `webServer.listenHost` | yes | string | Default `127.0.0.1`; `0.0.0.0` requires explicit ops decision. |
| `webServer.port` | yes | integer | Default `8787`; must be 1-65535. |
| `webServer.basePath` | yes | string | Must start and end with `/`, e.g. `/kiosk/bolars/`. |
| `webServer.staticRoot` | yes | string | MVP value: `current`. Must not be absolute path outside `rootDir`. |
| `webServer.enableDirectoryListing` | optional | boolean | Must be `false` if present. |
| `webServer.healthPath` | yes | string | Default `/healthz`. |
| `webServer.statusPath` | yes | string | Default `/runner/status`. |

## 4. `registryUrl` Rule

`registryUrl` points to a production manifest. It is not:

- GitHub branch URL;
- raw `main` file used as development source;
- `dist` folder URL;
- arbitrary HTML URL;
- source repo URL.

Allowed MVP sources include GitHub Pages, GitHub Release asset, raw static hosting or a simple update server, if the URL is treated as a production manifest endpoint.

## 5. Validation Errors

| Error | Condition | Expected behavior |
| --- | --- | --- |
| `no_config` | `config.json` absent. | Health degraded, no update. |
| `invalid_json` | Config cannot parse. | Health degraded, no update. |
| `registry_url_missing` | Empty or absent `registryUrl`. | No network update. |
| `invalid_registry_url` | Not URL or points to invalid manifest. | Fail validation. |
| `showcase_id_missing` | Empty `showcaseId`. | Fail validation. |
| `unsafe_listen_host` | `0.0.0.0` without ops override. | Fail or require explicit config flag in future. |
| `directory_listing_enabled` | `enableDirectoryListing=true`. | Fail validation. |
| `static_root_escape` | `staticRoot` escapes `rootDir`. | Fail validation. |

## 6. Example vs Production Config

`config.example.json`:

- ships with runner artifact;
- contains safe placeholders;
- must not contain tokens, passwords, client data or private URLs with credentials;
- must not be used as production config implicitly.

`config.json`:

- created locally by implementer/admin;
- contains actual `registryUrl`, `rootDir`, port and basePath;
- may later reference protected secret storage, but MVP public/no-auth mode should not require secrets.

## 7. Security

Do not put secrets in config examples. If future private registry needs credentials, use protected ops/secret contour, not committed config templates.
