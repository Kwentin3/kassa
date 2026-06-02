# Runbook: KioskRunner First Install On Windows

Дата: 2026-05-28  
Статус: draft  
Аудитория: внедренец / системный администратор

## 1. Preconditions

- Windows host near 1С Web / 1С workplace.
- Access to KioskRunner release artifact.
- Production manifest URL from release/operator team.
- Permission to create:

```text
C:\KioskRunner
C:\KioskShowcases\bolars
```

## 2. Download Runner

Download:

```text
KioskRunner-win-x64.zip
```

MVP source: official KioskRunner GitHub Release or approved public release URL:

```text
https://github.com/Kwentin3/kassa/releases/download/kioskrunner-v0.3.0-fieldtrial/KioskRunner-win-x64.zip
```

## 3. Extract

Extract to:

```text
C:\KioskRunner
```

Expected files:

```text
KioskRunner.exe
config.example.json
install-service.ps1
uninstall-service.ps1
README.md
```

## 4. Create Config

Copy:

```text
C:\KioskRunner\config.example.json
-> C:\KioskRunner\config.json
```

Edit managed fields:

- `runnerId`;
- `showcaseId`;
- `channel`;
- `registryUrl`;
- `rootDir`;
- `checkIntervalMinutes`;
- `keepVersions`;
- `webServer.listenHost`;
- `webServer.port`;
- `webServer.basePath`.

Example:

```json
{
  "runnerId": "kiosk-runner-bolars-001",
  "showcaseId": "bolars",
  "channel": "production",
  "registryUrl": "https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json",
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

Do not put secrets into `config.example.json`.

For BOLARS field trial, `registryUrl` must be:

```text
https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json
```

`updates.example.com` is not a real registry for this package.

## 5. First Update

Run:

```powershell
cd C:\KioskRunner
.\KioskRunner.exe update-once --config C:\KioskRunner\config.json
```

Expected:

- manifest fetched;
- bundle downloaded;
- `sha256` verified;
- `versions\<version>` created;
- `current` published;
- `state.json` written.

## 6. Verify Local URL

Open:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

Also check:

```text
http://127.0.0.1:8787/healthz
http://127.0.0.1:8787/runner/status
```

If service is not installed yet, local URL may require running service mode or an approved foreground smoke command. `update-once` only prepares files unless implementation explicitly starts temporary serving.

## 7. Install Service

Preferred:

```powershell
.\install-service.ps1 -ConfigPath C:\KioskRunner\config.json
```

Alternative:

```powershell
.\KioskRunner.exe install --config C:\KioskRunner\config.json
```

Then start service if install script does not start it.

## 8. Verify Service

Check:

```text
http://127.0.0.1:8787/healthz
http://127.0.0.1:8787/runner/status
http://127.0.0.1:8787/kiosk/bolars/
```

Status must not expose secrets or 1С business data.

## 9. Handoff To 1С Programmer

Provide only stable URL:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

1С does not need GitHub, manifest, bundle, `current`, `versions`, `sha256` or rollback details.

## 10. Troubleshooting

| Symptom | Check |
| --- | --- |
| No config | Ensure `config.json` exists, not only example. |
| Manifest error | Verify `registryUrl` points to JSON manifest, not HTML/dist/branch. For BOLARS field trial use `https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json`. |
| DNS/network error for manifest | Verify DNS/HTTPS access to `kwentin3.github.io`; this is a network/publication issue, not a 1С issue. |
| Port conflict | Check process using `8787`. Do not silently change URL. |
| No current | Run `update-once`, inspect logs. |
| 1С cannot open URL | Verify local host, port, service running, firewall/local policy. |
