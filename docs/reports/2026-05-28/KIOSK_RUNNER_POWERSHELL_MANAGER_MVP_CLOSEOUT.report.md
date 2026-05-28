# KioskRunner PowerShell Manager MVP Closeout

Date: 2026-05-28

Status: READY_WITH_NOTES

## Scope

Implemented a budget PowerShell Manager layer for KioskRunner MVP instead of a .NET GUI Manager.

The layer manages the existing single Windows Service and KioskRunner CLI. It does not change KioskRunner core, does not add a GUI, does not add a second service, and does not introduce update-server, fleet telemetry, auth/private registry, 1C dependency, or bridge changes.

## Files Created Or Changed

Created:

- `packaging/kioskrunner-common.ps1`
- `packaging/kioskrunner-status.ps1`
- `packaging/check-registry.ps1`
- `packaging/open-showcase.ps1`
- `packaging/post-reboot-smoke.ps1`
- `packaging/manage-kioskrunner.ps1`
- `docs/integrations/1c-html-shell/kiosk-runner/RUNBOOK_KIOSK_RUNNER_POWERSHELL_MANAGER_MVP.md`

Changed:

- `packaging/install-service.ps1`
- `packaging/uninstall-service.ps1`
- `packaging/README.md`
- `docs/integrations/1c-html-shell/kiosk-runner/HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md`
- `artifacts/kiosk-runner/KioskRunner-win-x64.zip`

## KioskRunner Core

KioskRunner core was not changed.

The scripts call existing capabilities:

- `KioskRunner.exe service --config <config.json>`
- `KioskRunner.exe update-once --config <config.json>`
- `KioskRunner.exe status --config <config.json>`
- `KioskRunner.exe rollback --config <config.json>`
- `/healthz`
- `/runner/status`

## Manager Commands

Interactive manager:

- `packaging/manage-kioskrunner.ps1`

Menu actions implemented:

- Show status
- Install service
- Start service
- Stop service
- Restart service
- Update now
- Rollback
- Check registry
- Open showcase
- Open health
- Open runner status
- Open logs folder
- Open config file
- Uninstall service
- Post-reboot smoke check

Standalone helpers:

- `packaging/kioskrunner-status.ps1`
- `packaging/check-registry.ps1`
- `packaging/open-showcase.ps1`
- `packaging/post-reboot-smoke.ps1`

## Service Defaults

Smoke service name:

- `KioskRunner-bolars`

Service registration:

- Startup type: `Automatic`
- Binary path: `KioskRunner.exe service --config <config.json>`
- Display name: `KioskRunner Service (bolars)`
- Recovery policy: restart on failure via `sc.exe failure`

Uninstall behavior:

- Removes only Windows Service.
- Does not delete `config.json`.
- Does not delete `rootDir`.
- Does not delete `current`.
- Does not delete `versions`.
- Does not delete `logs`.
- Requires confirmation unless `-Force` is passed.

## Smoke Environment

Smoke install folder:

- `artifacts/kioskrunner-powershell-manager-smoke/runner`

Smoke config:

- `artifacts/kioskrunner-powershell-manager-smoke/runner/config.json`

Registry URL:

- `https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json`

Local showcase URL:

- `http://127.0.0.1:8787/kiosk/bolars/`

Installed version:

- `2026.05.28.github-fieldtrial-1`

Served version:

- `2026.05.28.github-fieldtrial-1`

## Commands Run

PowerShell parse check:

```powershell
[System.Management.Automation.Language.Parser]::ParseFile(...)
```

Status before install:

```powershell
packaging/kioskrunner-status.ps1 -ConfigPath <config.json> -Json
```

Registry check:

```powershell
packaging/check-registry.ps1 -ConfigPath <config.json> -Json
```

Install service:

```powershell
packaging/install-service.ps1 -ConfigPath <config.json>
```

Start service:

```powershell
Start-Service -Name KioskRunner-bolars
```

Safe update-now sequence:

```powershell
Stop-Service -Name KioskRunner-bolars -Force
KioskRunner.exe update-once --config <config.json>
Start-Service -Name KioskRunner-bolars
```

Restart smoke:

```powershell
Restart-Service -Name KioskRunner-bolars -Force
```

Rollback check:

```powershell
Stop-Service -Name KioskRunner-bolars -Force
KioskRunner.exe rollback --config <config.json>
Start-Service -Name KioskRunner-bolars
```

Post-reboot smoke helper:

```powershell
packaging/post-reboot-smoke.ps1 -ConfigPath <config.json> -Json
```

Uninstall service:

```powershell
packaging/uninstall-service.ps1 -ConfigPath <config.json> -Force
```

## Results

PowerShell parse check:

- PASS for all `packaging/*.ps1`.

Service not installed state:

- PASS.
- Status script reported `serviceInstalled=false`, `serviceState=NotInstalled`.

Registry check:

- PASS.
- Manifest reachable over HTTPS.
- Manifest parsed as JSON, not HTML.
- `showcaseId=bolars`.
- `channel=production`.
- `status=production`.
- `bundleUrl` reachable.

Install service:

- PASS.
- `Get-Service KioskRunner-bolars` found the service.
- `StartMode=Auto`.
- Service `PathName` contains `service --config <config.json>`.

Start service:

- PASS.
- `/healthz` returned HTTP 200.
- `/runner/status` returned HTTP 200.
- `http://127.0.0.1:8787/kiosk/bolars/` returned HTTP 200.
- `X-Kiosk-Showcase-Version=2026.05.28.github-fieldtrial-1`.

Status:

- PASS.
- `currentVersion=2026.05.28.github-fieldtrial-1`.
- `servedVersion=2026.05.28.github-fieldtrial-1`.
- `lastUpdateStatus=updated` after first service start.

Safe update now:

- PASS.
- Service stopped before manual update.
- `update-once` returned exit code `0`.
- Result: `Update status: noop; version: 2026.05.28.github-fieldtrial-1`.
- Service restarted.
- Health/status stayed OK.

Restart:

- PASS.
- Service restarted.
- `/healthz`, `/runner/status`, and showcase URL returned HTTP 200.

Rollback:

- PASS with expected no-previous-version outcome.
- `rollback` returned exit code `1`.
- Message: `rollback_previous_missing: $.previousVersion previousVersion is missing or unsafe.`
- Existing current stayed working after service restart.

Open showcase helper:

- PASS.
- `open-showcase.ps1 -PrintOnly` returned `http://127.0.0.1:8787/kiosk/bolars/`.

Open logs:

- PASS.
- Logs folder exists.
- `kiosk-runner.jsonl` exists under `rootDir/logs`.

Post-reboot smoke helper:

- PASS for service/startup/health/status/current checks.
- Real machine reboot was not executed in the agent session.

Uninstall:

- PASS.
- Service removed.
- `config.json`, `rootDir`, `current`, `versions`, and `logs` remained on disk.

## Package Artifact

Updated package:

- `artifacts/kiosk-runner/KioskRunner-win-x64.zip`

Package SHA-256:

- `DD6E6F54340A09EA2B848673F5FC33F056D4A8F1FFCA74D6874DE754F3EB0705`

Package contents:

- `KioskRunner.exe`
- `config.example.json`
- `install-service.ps1`
- `uninstall-service.ps1`
- `kioskrunner-common.ps1`
- `kioskrunner-status.ps1`
- `check-registry.ps1`
- `open-showcase.ps1`
- `post-reboot-smoke.ps1`
- `manage-kioskrunner.ps1`
- `README.md`

Package secret check:

- PASS.
- No `config.json`.
- No `.env`.
- No `.env.local`.
- No `.env.deploy`.
- No `.pem`, `.pfx`, or `.key`.

## Security And Architecture Checks

Confirmed:

- No KioskRunner core changes.
- No .NET GUI added.
- No second Windows Service added.
- No Task Scheduler primary path added.
- No update-server added.
- No fleet dashboard added.
- No telemetry added.
- No auth/private registry added.
- No 1C dependency added.
- No HTML bridge changes.
- No `git pull`.
- No branch/main/dist lookup by runner.
- Scripts do not implement update lifecycle themselves.
- Scripts call existing runner CLI and local endpoints.

## Known Limitations

- Real reboot was not performed. Stop/start/restart and `post-reboot-smoke.ps1` passed; physical reboot check remains a manual field-trial step.
- Manual update uses safe budget mode: stop service, run `update-once`, start service. This avoids the possible race with scheduled update without adding an inter-process update lock.
- Rollback success path was not exercised because the smoke install had no `previousVersion`. No-previous rollback failure was clear and non-destructive.
- `check-registry.ps1` is diagnostics only. It does not replace KioskRunner manifest validation.

## Future Work

- .NET GUI Manager.
- RootDir-scoped inter-process lock for update/rollback.
- Dedicated `check-registry --json` runner command.
- Richer registry diagnostics in `/runner/status`.
- Real reboot field smoke on target kiosk hardware.

## Recommendation

READY_WITH_NOTES.

PowerShell Manager MVP is usable for field-trial operations. The only remaining note is a real reboot verification on the target Windows host.
