# KioskRunner MVP

KioskRunner is a local Windows runner for a production 1C HTML showcase bundle.

It downloads only the configured production manifest, downloads the immutable `bundle.zip`, verifies SHA-256, publishes local `current`, serves static files on localhost, exposes health/status, and supports rollback.

It is not a 1C backend, does not own cart/sale/payment/fiscal state, and does not replace the HTML to 1C bridge.

## First Install

Download the field-trial package:

```text
https://github.com/Kwentin3/kassa/releases/download/kioskrunner-v0.3.0-fieldtrial/KioskRunner-win-x64.zip
```

1. Extract `KioskRunner-win-x64.zip` to `C:\KioskRunner`.
2. Copy `config.example.json` to `config.json`.
3. Edit `registryUrl`, `showcaseId`, `rootDir`, `webServer.listenHost`, `webServer.port`, and `webServer.basePath`.
4. Run the PowerShell Manager:

```powershell
.\manage-kioskrunner.ps1
```

5. Use the menu:

```text
[1] Show status
[2] Install service
[3] Start service
[6] Update now
[8] Check registry
[9] Open showcase
[15] Post-reboot smoke check
```

6. Give 1C only the stable showcase URL.

## Quick Start Without .NET GUI

KioskRunner MVP uses PowerShell manager scripts instead of `KioskRunner.Manager.exe`.

Recommended operator flow:

```powershell
Copy-Item .\config.example.json .\config.json
notepad .\config.json
.\manage-kioskrunner.ps1
```

Inside the menu:

1. `Show status`.
2. `Check registry`.
3. `Install service`.
4. `Start service`.
5. `Update now`.
6. `Open showcase`.

The service is installed with `StartupType=Automatic`, so Windows starts it after reboot.

## For 1C Implementer / Quick Local Launch

Use this path when the goal is simply to open the local showcase and pass the stable URL to 1C:

1. Copy `config.example.json` to `config.json`.
2. Edit `registryUrl`, `rootDir`, `webServer.port`, and `webServer.basePath`.
3. Run:

```powershell
.\manage-kioskrunner.ps1
```

4. In the menu, run:

```text
[1] Show status
[8] Check registry
[2] Install service
[3] Start service
[6] Update now
[9] Open showcase
```

5. After reboot, run:

```powershell
.\post-reboot-smoke.ps1 -ConfigPath .\config.json
```

Give 1C only this URL:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

## Direct Script Commands

Show status:

```powershell
.\kioskrunner-status.ps1 -ConfigPath .\config.json
```

Check GitHub/static registry without changing current:

```powershell
.\check-registry.ps1 -ConfigPath .\config.json
```

Install as Windows Service:

```powershell
.\install-service.ps1 -ConfigPath C:\KioskRunner\config.json
```

Start/stop/restart:

```powershell
Start-Service -Name KioskRunner-bolars
Stop-Service -Name KioskRunner-bolars
Restart-Service -Name KioskRunner-bolars
```

Update now safely:

```text
Use menu item [6]. It stops the service, runs update-once, then starts the service again.
```

Rollback safely:

```text
Use menu item [7]. It asks for confirmation, stops service if needed, runs rollback, then starts service again.
```

Open showcase:

```powershell
.\open-showcase.ps1 -ConfigPath .\config.json
```

Post-reboot smoke:

```powershell
.\post-reboot-smoke.ps1 -ConfigPath .\config.json
```

Uninstall service only:

```powershell
.\uninstall-service.ps1 -ConfigPath .\config.json
```

The uninstall script removes only the Windows Service. It does not delete `config.json`, `rootDir`, `current`, `versions` or `logs`.

## Verify

```text
http://127.0.0.1:8787/healthz
http://127.0.0.1:8787/runner/status
http://127.0.0.1:8787/kiosk/bolars/
```

Give 1C only the stable showcase URL:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

## Commands

```text
KioskRunner.exe update-once --config C:\KioskRunner\config.json
KioskRunner.exe status --config C:\KioskRunner\config.json
KioskRunner.exe rollback --config C:\KioskRunner\config.json
KioskRunner.exe service --config C:\KioskRunner\config.json
```

`install`, `uninstall`, `start`, and `stop` are declared CLI commands, but MVP service installation is done by the included PowerShell scripts.

## Security Notes

- Keep real secrets out of `config.example.json`, manifest, and bundle.
- Keep `webServer.listenHost` on `127.0.0.1` unless an explicit ops decision approves otherwise.
- Public/no-auth manifest and bundle are acceptable for MVP only when they contain no secrets and no 1C business data.
- SHA-256 verifies bundle integrity relative to the manifest; it is not a manifest signature.
