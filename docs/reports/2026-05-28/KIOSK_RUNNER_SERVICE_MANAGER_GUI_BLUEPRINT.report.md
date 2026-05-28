# KioskRunner Service Manager GUI Blueprint Report

Date: 2026-05-28

Status: BLUEPRINT_CREATED

## Scope

Created the blueprint for the next KioskRunner ops/UX layer:

```text
Windows Service autostart
-> embedded local web server
-> periodic production manifest update loop
-> safe current switching
-> separate .NET Manager GUI
```

No code was written. KioskRunner, GUI, package scripts and 1C bridge were not changed.

## Document Created

```text
docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_KIOSK_RUNNER_SERVICE_AUTOUPDATE_AND_MANAGER_GUI_MVP.md
```

The filename uses `AUTOUPDATE` spelling instead of the typo-style `AUTUPDATE`.

## Source Material Used

- `BLUEPRINT_KIOSK_RUNNER_WINDOWS_SERVICE.md`
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`
- `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md`
- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`
- `RUNBOOK_SHOWCASE_GITHUB_PUBLICATION_FIELD_TRIAL.md`
- `SHOWCASE_GITHUB_REMOTE_FIELD_TRIAL_CLOSEOUT.report.md`
- current source inspection of:
  - `src/KioskRunner.Host.Cli/KioskRunnerWorker.cs`
  - `src/KioskRunner.Host.Service/WindowsServiceHostAdapter.cs`
  - `src/KioskRunner.Host.Cli/CliApplication.cs`
  - `packaging/install-service.ps1`
  - `packaging/README.md`

## Key Decisions Fixed

- One installed KioskRunner Windows Service for the showcase instance, not separate updater/web services.
- BOLARS default service name remains `KioskRunner-bolars`; user-facing label can be `KioskRunner Service`.
- Service owns both embedded web server and scheduled update loop.
- Service must autostart after reboot via `StartupType Automatic`.
- Manager GUI is a separate process: `KioskRunner.Manager.exe`.
- Manager GUI recommended MVP stack: WinForms on .NET 10.
- Manager GUI must be thin: SCM + CLI + local health/status/config/logs.
- Package target adds `KioskRunner.Manager.exe` to `KioskRunner-win-x64.zip`.

## Current Implementation Findings

Already present:

- `service` command exists.
- `KioskRunnerWorker` starts web server and update loop.
- `WindowsServiceHostAdapter` runs immediate update, then waits `checkIntervalMinutes`.
- `autoUpdate` controls whether update loop starts.
- Service host has an in-process update lock.
- `install-service.ps1` uses `StartupType Automatic`.
- install script configures SCM restart-on-failure policy.
- `/healthz`, `/runner/status`, `update-once`, `status`, `rollback` exist.

Important gap:

- current update lock is in-process only. Manager-triggered `update-once` as a separate process could race the scheduled service update.

Recommended MVP hardening:

- add rootDir-scoped inter-process update/rollback lock, or expose update-now through the service process.

## New Risks Captured

- manual update-now racing scheduled update;
- rollback racing update;
- GUI requiring elevation for service actions;
- Manager needing registry details that current `/runner/status` does not expose;
- reboot behavior still requiring real Windows smoke;
- GitHub unavailable while service must keep serving old current.

## Planned Implementation Slices

1. Audit current service update loop.
2. Manager GUI PRD/UX sketch.
3. Manager GUI contracts.
4. Runner support for Manager actions: inter-process lock and registry check.
5. WinForms Manager implementation.
6. Packaging Manager into zip.
7. Handoff docs update.
8. Smoke tests: service restart/reboot, auto-update, Manager actions, no 1C.

## Deferred Work

- multi-showcase Manager;
- central config;
- fleet dashboard;
- update-server;
- telemetry;
- auth/private registry;
- signatures;
- tenant/license binding;
- MSI/exe installer;
- external listener;
- HTTPS localhost.

## Invariants Preserved

- no git pull;
- no branch/main/dist runner lookup;
- no update-server;
- no fleet dashboard;
- no telemetry;
- no auth/private registry;
- no signatures;
- no tenant/license binding;
- no 1C dependency;
- no business API;
- no cart/payment/fiscal ownership;
- runner still reads only production manifest through `registryUrl`.

## Open Questions

- Should Manager `Update now` call a future service-side local action or a CLI command protected by an inter-process lock?
- Should registry status be a new CLI command (`check-registry --json`) or a local endpoint (`/runner/registry-status`)?
- Should Manager be single-showcase only for MVP, with multi-showcase explicitly future?
- What exact elevation UX should be used for install/start/stop on target Windows machines?
- Is real reboot smoke mandatory before packaging Manager MVP?

## Result

Blueprint is ready for review and can be used as the source document for the next implementation-readiness step.
