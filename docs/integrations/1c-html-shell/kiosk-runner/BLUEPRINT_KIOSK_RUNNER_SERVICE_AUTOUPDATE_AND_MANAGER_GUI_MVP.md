# Blueprint: KioskRunner Service Autoupdate And Manager GUI MVP

Дата: 2026-05-28  
Статус: draft blueprint  
Source of truth:

- `../PRD_KIOSK_RUNNER_NET_v0.3.md`
- `BLUEPRINT_KIOSK_RUNNER_WINDOWS_SERVICE.md`
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`
- `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md`
- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`
- `RUNBOOK_SHOWCASE_GITHUB_PUBLICATION_FIELD_TRIAL.md`
- `docs/reports/2026-05-28/SHOWCASE_GITHUB_REMOTE_FIELD_TRIAL_CLOSEOUT.report.md`
- `RUNBOOK_KIOSK_RUNNER_POWERSHELL_MANAGER_MVP.md`
- `docs/reports/2026-05-28/KIOSK_RUNNER_POWERSHELL_MANAGER_MVP_CLOSEOUT.report.md`
- `docs/reports/2026-05-28/KIOSK_RUNNER_POWERSHELL_MANAGER_MVP_DETAILED.report.md`

## 0. Current Decision Status

This document is kept as the future .NET Manager GUI blueprint.

Current field-trial operations use the budget PowerShell Manager layer:

- `packaging/manage-kioskrunner.ps1`;
- `packaging/kioskrunner-status.ps1`;
- `packaging/check-registry.ps1`;
- `packaging/open-showcase.ps1`;
- `packaging/post-reboot-smoke.ps1`;
- `packaging/install-service.ps1`;
- `packaging/uninstall-service.ps1`.

The .NET GUI Manager is deferred. It may be implemented later after field-trial feedback confirms that a desktop GUI is worth the additional packaging, UX and maintenance cost.

Until that decision is reopened, the accepted ops path is:

```text
KioskRunner Windows Service
+ PowerShell Manager scripts
+ local /healthz and /runner/status diagnostics
```

The delivery canon stays unchanged: runner reads only `registryUrl`, manifest points to immutable `bundle.zip`, bundle is verified by `sha256`, and local web serving remains `127.0.0.1` by default.

## 1. Purpose

This blueprint defines the next ops/UX layer after the successful remote GitHub Pages field trial.

Target outcome:

```text
Windows reboot
-> KioskRunner Windows Service starts automatically
-> embedded web server serves current showcase
-> service periodically checks production manifest on GitHub Pages
-> new production bundle is downloaded, sha256-verified and published
-> old current stays available when GitHub/manifest/bundle is unavailable
-> PowerShell Manager scripts show status and control service/update operations
-> future Manager GUI may replace the scripts as a friendlier desktop shell
```

This is still only the delivery/runtime contour. It does not involve 1C business logic, cart, payment, receipt, KKT, marking, fiscalization, scanner or acquiring.

## 2. Non-Negotiable Rules

KioskRunner must keep the proven delivery canon:

- no `git pull`;
- no branch/main/dist lookup;
- no direct HTML download from source repo;
- runner reads only `registryUrl`;
- `registryUrl` points to production manifest;
- manifest points to immutable `bundle.zip`;
- `bundle.zip` is verified through `sha256`;
- embedded web server serves only local `current`;
- default listener remains `127.0.0.1`;
- Apache/Nginx are optional only.

This MVP must not add:

- update-server;
- fleet dashboard;
- telemetry;
- auth/private registry;
- signed manifest or signed bundle;
- tenant/license binding;
- 1C dependency;
- business API;
- cart/payment/fiscal state ownership.

## 3. Target Architecture

### Install Package

One install package:

```text
KioskRunner-win-x64.zip
  KioskRunner.exe
  config.example.json
  install-service.ps1
  uninstall-service.ps1
  manage-kioskrunner.ps1
  kioskrunner-status.ps1
  check-registry.ps1
  open-showcase.ps1
  post-reboot-smoke.ps1
  README.md
```

Current package does not include `KioskRunner.Manager.exe`.

Future package, when the GUI decision is reopened, may add:

```text
KioskRunner.Manager.exe
```

KioskRunner delivery contracts, manifest contract and bundle contract stay unchanged in both paths.

### Windows Service

MVP has one installed KioskRunner service for the current showcase instance.

Recommended service name for BOLARS:

```text
KioskRunner-bolars
```

User-facing label can be:

```text
KioskRunner Service
```

Do not create a second service for GUI, updater, or web server. The single service owns:

- embedded web server;
- scheduled update loop;
- state/logs;
- rollback lifecycle;
- health/status diagnostics.

### Current PowerShell Manager

Current field-trial Manager layer is a set of local PowerShell scripts.

It controls:

- Windows Service Control Manager;
- KioskRunner CLI commands;
- local `/healthz`;
- local `/runner/status`;
- config/state/log files.

It must not contain update lifecycle logic. It must not implement manifest validation, bundle download, sha256 verification, extraction or current switching itself.

### Future Manager GUI

`KioskRunner.Manager.exe` remains a future separate .NET desktop app.

It must not run inside the Windows Service process. It must not contain update lifecycle logic. It is a thin manager over:

- Windows Service Control Manager;
- KioskRunner CLI commands;
- local `/healthz`;
- local `/runner/status`;
- config/state/log files;
- optional future runner diagnostic command for registry checks.

## 4. Service Autostart

Requirements:

- install script sets service startup type to `Automatic`;
- after Windows reboot, the service starts without manual action;
- embedded web server starts automatically;
- if `current` already exists, showcase opens without internet;
- if GitHub Pages is unavailable, service keeps running;
- if manifest/bundle check fails, old `current` remains available;
- update errors are written to state/logs and visible in Manager GUI;
- service recovery policy should restart service after process failure when install permissions allow it.

Current implementation note:

- `packaging/install-service.ps1` already uses `New-Service ... -StartupType Automatic`;
- it also configures `sc.exe failure ... restart/60000/restart/60000/...`;
- reboot behavior should still be explicitly smoke-tested on a real Windows workstation.

## 5. Automatic Update Loop

Service mode must run two responsibilities concurrently:

1. Serve local static showcase through embedded web server.
2. Periodically execute the same validated update lifecycle as `update-once`.

Loop requirements:

- read `checkIntervalMinutes` from `config.json`;
- honor `autoUpdate`;
- on service start, perform an initial update check immediately or after a short delay;
- periodically fetch `registryUrl`;
- validate production manifest:
  - `showcaseId`;
  - `channel`;
  - `status`;
  - `minRunnerVersion`;
  - `bridgeContractVersion`;
  - `bundleUrl`;
  - `sha256`;
- compare manifest version with `state.currentVersion`;
- if same version, write `noop`;
- if new version:
  - download `bundle.zip`;
  - verify `sha256`;
  - extract to staging;
  - validate bundle;
  - publish `versions/<version>`;
  - switch `current`;
  - update `state.json`;
  - let web server serve new version without manual restart;
- if any error:
  - do not break current;
  - write sanitized `lastError`;
  - show error in Manager GUI;
  - retry on next interval.

Current implementation note:

- `KioskRunnerWorker` starts `WindowsServiceHostAdapter` with `AutoUpdate=config.AutoUpdate` and `CheckInterval=checkIntervalMinutes`.
- `WindowsServiceHostAdapter.RunLoopAsync` currently runs update immediately, then waits for the interval.
- `WindowsServiceHostAdapter` has an in-process `SemaphoreSlim` update lock.

Required hardening before Manager `Update now`:

- add an inter-process update/rollback lock, or expose update-now through the service process;
- a separate Manager-triggered `KioskRunner.exe update-once` must not race the scheduled service update;
- rollback and update must share the same lock.

Recommended MVP default:

```text
Use a rootDir-scoped named mutex or lock file around update and rollback operations.
```

This keeps GUI implementation simple: Manager may call CLI `update-once`/`rollback`, while scheduled update loop and manual actions cannot run concurrently.

## 6. Local Web Server Behavior

Canonical BOLARS URL:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

Diagnostics:

```text
http://127.0.0.1:8787/healthz
http://127.0.0.1:8787/runner/status
```

Requirements:

- service serves only `rootDir/current`;
- `servedVersion` must match `currentVersion` after a successful update;
- after current switch, web server starts serving the new version without service restart;
- if `current` is missing, health/status show `degraded/no_current`;
- if port is occupied, health/status and Manager show `port_in_use` or service start failure;
- status must expose no secrets and no 1C business data.

Current implementation note:

- field trial confirmed `service` serves `/kiosk/bolars/`, `/healthz`, `/runner/status`;
- `X-Kiosk-Showcase-Version` is present;
- service can be run foreground or as Windows Service.

## 7. Manager GUI Future MVP

Status:

```text
Deferred. Current MVP uses PowerShell Manager scripts.
```

Recommended stack:

```text
WinForms on .NET 10
```

Rationale:

- operational utility, not complex product UI;
- low ceremony for forms, buttons, labels, file dialogs and process launching;
- easy packaging as `KioskRunner.Manager.exe`;
- less implementation overhead than WPF for MVP.

WPF can be reconsidered only if UX requires richer layout, theming or MVVM complexity.

Manager GUI must be a thin shell. It must not implement manifest validation, bundle download, sha256 verification, extraction or current switching itself.

### Main Screen Sections

Service:

- installed / not installed;
- running / stopped;
- startup type;
- service name;
- service account if available;
- last service control error.

Registry / GitHub Pages:

- `registryUrl`;
- manifest reachable / unreachable;
- manifest `showcaseId`;
- manifest `channel`;
- manifest `status`;
- manifest `version`;
- `bundleUrl`;
- last registry check;
- last update result.

Showcase:

- local URL;
- `currentVersion`;
- `servedVersion`;
- `previousVersion`;
- `currentSha256`;
- `lastSuccessfulUpdateAt`;
- `lastError`.

Web server:

- health: OK / degraded / unhealthy;
- host;
- port;
- basePath;
- `/healthz` HTTP status;
- `/runner/status` HTTP status.

## 8. Future Manager GUI Actions

Service actions:

- Install service;
- Start service;
- Stop service;
- Restart service;
- Uninstall service.

Update actions:

- Check registry now;
- Update now;
- Rollback;
- Refresh status.

Showcase actions:

- Open showcase;
- Copy showcase URL;
- Open status JSON;
- Open health URL;
- Open logs folder;
- Open config file.

Safety requirements:

- Stop service requires confirmation;
- Uninstall service requires confirmation;
- uninstall must not delete `config.json`, `current`, `versions`, `downloads`, `state.json` or `logs` by default;
- install/uninstall/start/stop should trigger UAC/elevation when required or show "Run as administrator";
- Manager must not silently install, uninstall, start, stop or rollback without explicit user action.

Recommended command strategy:

| Action | MVP mechanism |
| --- | --- |
| Install service | Run `install-service.ps1` elevated. |
| Uninstall service | Run `uninstall-service.ps1` elevated. |
| Start/Stop/Restart | Use `ServiceController` or `Start-Service`/`Stop-Service` elevated when needed. |
| Refresh status | Read SCM + HTTP `/runner/status`; fallback to CLI `status` if stopped. |
| Update now | Call runner update lifecycle through service-side action or CLI guarded by inter-process lock. |
| Rollback | Call `KioskRunner.exe rollback` guarded by inter-process lock. |
| Check registry now | Prefer new non-mutating runner command; fallback only if clearly marked unavailable. |

## 9. First-Run UX

Current PowerShell Manager field-trial flow:

1. User downloads `KioskRunner-win-x64.zip`.
2. User extracts package, for example to `C:\KioskRunner`.
3. User copies `config.example.json` to `config.json`.
4. User edits `registryUrl`, `rootDir`, `port` and `basePath`.
5. User runs `manage-kioskrunner.ps1`.
6. User checks status and registry.
7. User selects Install service.
8. User selects Start service.
9. User selects Update now or waits for auto-update.
10. User opens showcase from the menu.
11. Browser opens `http://127.0.0.1:8787/kiosk/bolars/`.

Future GUI flow:

1. User downloads `KioskRunner-win-x64.zip`.
2. User extracts package, for example to `C:\KioskRunner`.
3. User runs `KioskRunner.Manager.exe`.
4. Manager checks `config.json`.
5. If missing, Manager offers to create it from `config.example.json`.
6. Minimal config wizard fields:
   - `registryUrl`;
   - `rootDir`;
   - `port`;
   - `basePath`.
7. Manager validates that no secret is being added to `config.example.json`.
8. Manager shows "Service not installed".
9. User clicks "Install service".
10. User clicks "Start service".
11. Manager shows Service Running.
12. Manager checks `/healthz` and `/runner/status`.
13. User clicks "Update now" or waits for auto-update.
14. Manager shows `currentVersion` and `servedVersion`.
15. User clicks "Open showcase".
16. Browser opens `http://127.0.0.1:8787/kiosk/bolars/`.

## 10. Status Model For GUI

Manager should build a combined local status model:

```json
{
  "service": {
    "installed": true,
    "running": true,
    "startupType": "Automatic",
    "serviceName": "KioskRunner-bolars",
    "lastControlError": null
  },
  "runner": {
    "runnerVersion": "0.3.0",
    "configPath": "C:\\KioskRunner\\config.json",
    "rootDir": "C:\\KioskShowcases\\bolars"
  },
  "registry": {
    "registryUrl": "https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json",
    "reachable": true,
    "manifestVersion": "2026.05.28.github-fieldtrial-1",
    "channel": "production",
    "status": "production",
    "bundleUrl": "https://.../bundle.zip",
    "lastCheckedAt": "2026-05-28T12:00:00Z",
    "lastError": null
  },
  "showcase": {
    "localUrl": "http://127.0.0.1:8787/kiosk/bolars/",
    "currentVersion": "2026.05.28.github-fieldtrial-1",
    "servedVersion": "2026.05.28.github-fieldtrial-1",
    "previousVersion": null,
    "currentSha256": "64-char-sha256",
    "lastSuccessfulUpdateAt": "2026-05-28T12:00:00Z",
    "lastError": null
  },
  "webServer": {
    "health": "ok",
    "listenHost": "127.0.0.1",
    "port": 8787,
    "basePath": "/kiosk/bolars/",
    "healthStatusCode": 200,
    "statusStatusCode": 200
  }
}
```

Current `/runner/status` is enough for installed/served version and web health, but not enough for full Registry/GitHub Pages details.

Recommended MVP addition:

```text
KioskRunner.exe check-registry --config config.json --json
```

This command should:

- read config;
- fetch and validate manifest only;
- not download bundle;
- not switch current;
- not require service to be running;
- return sanitized JSON for Manager.

Alternative future option:

```text
GET /runner/registry-status
```

This should remain localhost-only and operational-only. It must not become a business API.

## 11. Handoff Update For 1C Implementer

`HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md` has a current PowerShell Manager handoff path.

Current 1C implementer message:

- run `manage-kioskrunner.ps1`;
- verify Service Installed and Running;
- verify Registry/Manifest OK through `check-registry.ps1` or the manager menu;
- verify `CurrentVersion` and `ServedVersion` are filled;
- select "Open showcase";
- pass this stable URL to 1C:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

Future GUI message, when GUI is implemented:

- run `KioskRunner.Manager.exe`;
- verify Service Installed and Running;
- verify Registry/Manifest OK;
- verify `CurrentVersion` and `ServedVersion` are filled;
- click "Open showcase";
- pass this stable URL to 1C:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

1C still does not know:

- GitHub;
- GitHub Pages;
- manifest;
- bundle.zip;
- sha256;
- versions/current folders;
- update loop internals.

If page does not open:

1. Open Manager GUI.
2. Check Service Running.
3. Check Web Server OK.
4. Check Registry OK.
5. Open `/healthz`.
6. Open `/runner/status`.
7. Open logs folder.

Runner still does not replace the HTML <-> 1C bridge.

## 12. Implementation Impact Analysis

### Already Exists

Based on current docs and source inspection:

- `service` command exists;
- .NET Generic Host uses Windows Service integration;
- `KioskRunnerWorker` starts embedded web server and update loop;
- update loop uses `checkIntervalMinutes`;
- `autoUpdate` controls scheduled loop;
- loop performs an immediate update attempt, then waits interval;
- embedded Kestrel web server exists;
- `/healthz` and `/runner/status` exist;
- `update-once` exists;
- `status` exists;
- `rollback` exists;
- install/uninstall PowerShell scripts exist;
- `install-service.ps1` installs service with `StartupType Automatic`;
- install script configures SCM failure restart policy;
- state/logs/current/versions lifecycle exists;
- package currently includes `KioskRunner.exe`, scripts, config example and README.

### Must Be Verified

- service starts after actual Windows reboot, not only service restart;
- auto-update loop continues after long-running service uptime;
- scheduled update failure does not degrade local serving when current exists;
- current switch while web server is serving does not create stale served version;
- SCM recovery policy behaves as intended on target Windows build;
- `checkIntervalMinutes` handles invalid/too-small values safely;
- Manager actions requiring elevation behave predictably;
- logs are sufficient for GUI "last error" view;
- current `/runner/status` has enough fields for GUI baseline.

### Gaps To Add

- `KioskRunner.Manager.exe`;
- Manager project/package integration;
- first-run config creation wizard;
- service control UX;
- registry check UX;
- packaging Manager.exe into `KioskRunner-win-x64.zip`;
- README and 1C handoff update;
- inter-process update/rollback lock;
- non-mutating registry check command or endpoint;
- optional richer status payload for registry/manifest details.

### Explicit Non-Gaps

Do not add:

- central server;
- fleet inventory;
- telemetry upload;
- auth/private registry requirement;
- manifest signatures as MVP requirement;
- external listener;
- 1C business operation endpoints.

## 13. Staged Plan

Status:

```text
Deferred until the project explicitly reopens .NET GUI work.
```

Current implemented field-trial path:

- PowerShell Manager scripts are packaged with `KioskRunner-win-x64.zip`;
- install/start/stop/restart/uninstall are handled through scripts;
- safe update uses stop service -> `update-once` -> start service;
- rollback uses stop service -> `rollback` -> start service;
- status is based on SCM + `/healthz` + `/runner/status`;
- post-reboot smoke is handled by `post-reboot-smoke.ps1`.

### Stage 0. Audit Current Service Update Loop

Scope:

- verify service mode runs web server and update loop simultaneously;
- verify `checkIntervalMinutes`;
- verify `autoUpdate`;
- verify logs/status after update failure;
- verify install script startup type and recovery policy;
- perform service restart and reboot-style smoke.

Gate:

- service starts;
- local URL opens;
- update loop performs at least one scheduled check;
- failed registry check keeps current available.

### Stage 1. Manager GUI PRD / UX Sketch

Scope:

- define single-screen MVP layout;
- define status groups;
- define button labels and disabled states;
- define first-run wizard fields;
- define elevation messaging.

Gate:

- UX supports install -> start -> update -> open showcase without knowing CLI commands.

### Stage 2. Manager GUI Contracts

Scope:

- combined manager status DTO;
- service control result DTO;
- registry check result DTO;
- action result/error model;
- no secret fields.

Gate:

- DTOs map to current `/runner/status`, CLI `status`, SCM state and future `check-registry`.

### Stage 3. Runner Support For Manager Actions

Scope:

- add inter-process update/rollback lock;
- add `check-registry --json` or equivalent local-only operational endpoint;
- ensure CLI outputs machine-readable errors for Manager.

Gate:

- scheduled update and manual update cannot run concurrently;
- registry check does not mutate current;
- rollback cannot race update.

### Stage 4. Manager GUI Implementation

Scope:

- WinForms shell;
- config detection;
- status polling;
- service install/start/stop/restart/uninstall;
- update now;
- rollback;
- open showcase/status/health/logs/config.

Gate:

- Manager works when service is not installed;
- Manager works when service is stopped;
- Manager works when service is running;
- no business logic or manifest parsing lifecycle is duplicated.

### Stage 5. Packaging

Scope:

- publish `KioskRunner.Manager.exe`;
- include Manager in zip;
- update README;
- keep service and Manager as separate processes.

Gate:

- clean zip contains Manager;
- no secrets;
- first-run from zip works.

### Stage 6. Handoff Docs

Scope:

- update `HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md`;
- add Manager quick guide;
- update field-trial runbook if needed.

Gate:

- 1C implementer gets only stable localhost URL and simple troubleshooting steps.

### Stage 7. Smoke Tests

Scope:

- install service;
- start service;
- restart service;
- reboot simulation or real reboot;
- auto-update check;
- failed registry check;
- Manager status;
- Manager service actions;
- Manager open showcase;
- rollback;
- no 1C involved.

Gate:

- after restart/reboot, local URL opens without manual runner command;
- new production manifest is installed automatically;
- failed GitHub check keeps old current.

## 14. Acceptance Criteria

Current PowerShell Manager path is accepted when:

- one Windows Service is used, not two;
- service includes web server and update loop;
- service autostarts after reboot;
- service periodically checks production manifest;
- failed GitHub/manifest/bundle check does not break existing current;
- PowerShell scripts can install/start/stop/restart/uninstall service;
- PowerShell scripts show registry/current/web-server status;
- PowerShell scripts can run safe update now, rollback and open showcase;
- handoff for 1C implementer points to stable localhost URL and script-based troubleshooting;
- no update-server/fleet/auth/telemetry is added;
- runner does not read branch/main/dist;
- 1C is not a dependency.

Future .NET GUI blueprint remains accepted when:

- one Windows Service is defined, not two;
- service includes web server and update loop;
- service autostarts after reboot;
- service periodically checks production manifest;
- failed GitHub/manifest/bundle check does not break existing current;
- GUI is a separate .NET desktop Manager, not part of service process;
- GUI can install/start/stop/restart/uninstall service;
- GUI shows registry/manifest/current/web-server status;
- GUI can update now, rollback and open showcase;
- handoff for 1C implementer is planned for update;
- no update-server/fleet/auth/telemetry is added;
- runner does not read branch/main/dist;
- 1C is not a dependency.

## 15. Stop Conditions

Stop and write a blocker/conflict report if:

- current service mode cannot keep web server and update loop alive together;
- update loop is absent or cannot be safely scheduled;
- Manager requires opening HTTP listener beyond localhost;
- Manager requires business API or 1C dependency;
- GUI implementation starts duplicating update lifecycle logic;
- update-now cannot be made safe against scheduled update;
- rollback cannot share the same lock as update;
- service install/start/stop requires unacceptable privileges;
- automatic startup after reboot is impossible without Task Scheduler;
- design starts creating two services;
- any path points runner to branch/main/dist/source repo.

## 16. Deferred Work

Future-only:

- .NET desktop Manager GUI;
- packaging `KioskRunner.Manager.exe`;
- Manager GUI first-run config wizard;
- multi-showcase Manager;
- central config distribution;
- fleet dashboard;
- update-server;
- telemetry;
- private registry/auth;
- signed manifest;
- signed bundle;
- signed runner;
- tenant/license binding;
- MSI/exe installer;
- external listener;
- HTTPS localhost.
