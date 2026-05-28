# Blueprint: KioskRunner Architecture

Дата: 2026-05-28  
Статус: draft  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## 1. Purpose

KioskRunner is a .NET Windows Service / Worker Service for delivering and locally publishing production HTML showcases for 1С HTML Shell.

It combines:

- delivery/update layer for production HTML bundle;
- local storage: `downloads`, `versions`, `current`, `state.json`, `logs`;
- embedded static web server;
- health/status diagnostics;
- rollback lifecycle;
- bootstrap/distribution model.

KioskRunner is not a 1С backend, does not own cart/payment/business data, does not replace the HTML ↔ 1С bridge, and does not read GitHub branches.

## 2. Domain Map

| Domain | Owns | Does not own |
| --- | --- | --- |
| Bootstrap | Runner artifact, `config.example.json`, first local `config.json`. | Showcase business data, auto-generated customer config. |
| Config | Local runtime settings and trusted `registryUrl`. | Secrets in example config, GitHub branch discovery. |
| Registry/Manifest Client | Fetching and validating production manifest. | Branch, `main`, `dist`, source repo traversal. |
| Bundle Downloader | Downloading immutable `bundle.zip`. | Executing remote scripts, interpreting HTML as manifest. |
| Integrity | `sha256` check against manifest. | Manifest signature in MVP. |
| Local Storage | `downloads`, `versions`, `current`, `state.json`, `logs`. | 1С sales state. |
| Static Web Server | Localhost static serving from `current`, health/status. | Business API, JSON upload, directory listing. |
| Windows Service | Process lifetime, update loop, web serving, graceful shutdown. | 1С lifecycle. |
| Rollback/Recovery | Previous local version recovery. | Recovery of active 1С sale/session. |

## 3. Process Topology

Canonical service mode runs one process:

```text
KioskRunner.exe service
  -> Config loader
  -> Storage initializer
  -> Web server task
  -> Update loop task
  -> Health/status publisher
  -> Shutdown coordinator
```

MVP decision: one Windows Service per showcase. This keeps rootDir, port, state and rollback isolated. A multi-showcase runner can be designed later as a supervisor over multiple per-showcase instances.

## 4. Update Loop

The update loop:

1. Reads local config.
2. Fetches production manifest from `registryUrl`.
3. Validates manifest shape, channel, status, `showcaseId`, `minRunnerVersion`, `bridgeContractVersion`.
4. Compares manifest `version` with local state.
5. Downloads `bundle.zip` when needed.
6. Checks `sha256`.
7. Extracts into staging.
8. Validates bundle.
9. Publishes to `versions/<version>`.
10. Switches `current`.
11. Updates `state.json`.
12. Writes logs.

No-op is a valid terminal outcome when the same version is already installed.

## 5. Embedded Web Server

Recommended stack: .NET Generic Host / Worker Service with ASP.NET Core Kestrel configured as an embedded local-only HTTP server.

Defaults:

```text
listenHost = 127.0.0.1
port = 8787
basePath = /kiosk/{showcaseId}/
staticRoot = current
```

The server serves only `current`, `/healthz`, and `/runner/status`. It must not expose `downloads`, `versions`, `logs`, `state.json`, `config.json`, staging folders, or directory listings.

## 6. Local Storage Layout

```text
C:\KioskShowcases\
  bolars\
    config.json
    state.json
    downloads\
    versions\
    current\
    logs\
```

`current` is the only static root exposed to HTTP. All other folders are internal runner state.

## 7. State And Logs

`state.json` is the durable operational state for idempotency, status and rollback. It is not a business data store.

Logs should be JSON Lines for MVP:

```json
{"ts":"2026-05-28T12:00:00Z","level":"info","event":"update.started","showcaseId":"bolars"}
```

Logs must not include secrets, raw private URLs with credentials, 1С business data, phones, fiscal data, or internal 1С references.

## 8. Rollback

Rollback uses only local `versions` and `state.previousVersion`. It must not require GitHub, registry or bundle re-download if the previous version exists locally.

Rollback updates `current`, `state.json`, and logs. It does not recover 1С sales state.

## 9. Bootstrap Flow

Runner distribution is separate from showcase distribution:

```text
KioskRunner-win-x64.zip
  -> KioskRunner.exe
  -> config.example.json
  -> install-service.ps1
  -> uninstall-service.ps1
```

The implementer creates local `config.json`, sets `registryUrl`, runs `update-once`, verifies the localhost URL, then installs the Windows Service.

## 10. Public MVP

Public/no-auth download is acceptable for MVP because runner and bundle contain no secrets or business data and the web server listens on localhost by default.

`sha256` verifies bundle integrity relative to manifest. It does not replace signed manifest. Future hardening should add private registry, auth and signatures.

## 11. Boundaries

| External system | Boundary |
| --- | --- |
| 1С | Opens stable URL and uses HTML bridge. Does not know manifest/current/versions. |
| HTML bridge | Lives inside HTML bundle. Runner does not implement bridge commands. |
| GitHub/registry | Publishes production manifest and immutable bundle. Runner reads manifest only. |
| Apache/Nginx | Optional reverse/static profile, never required for canonical MVP. |

## 12. Implementation Slices

1. Config and storage bootstrap.
2. Manifest and bundle contracts.
3. `update-once` happy path and no-op.
4. Failure-safe staging and state writes.
5. Embedded web server and diagnostics.
6. Windows Service lifecycle.
7. Rollback/recovery.
8. Packaging and runbooks.

## 13. Acceptance

- Runner never reads branch/main/dist.
- Runner never does `git pull`.
- Runner serves only `current`.
- Runner listens on `127.0.0.1` by default.
- Runner exposes no business data.
- Failed update keeps old `current`.
- Apache/Nginx remains optional.
