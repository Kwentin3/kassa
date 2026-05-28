# Runbook: Showcase Release Pipeline Field Trial

Дата: 2026-05-28  
Статус: MVP field-trial runbook  
Scope: BOLARS showcase bundle publication for KioskRunner

## 1. Build And Publish Local Artifacts

Run from repository root:

```powershell
.\scripts\publish-showcase-bundle.ps1 `
  -Showcase bolars `
  -Version 2026.05.28.1 `
  -Channel production `
  -Status production `
  -BaseUrl https://updates.example.com
```

The script reads:

```text
showcases/bolars/showcase.config.json
```

Generated files:

```text
artifacts/showcases/bolars/<version>/bundle.zip
artifacts/showcases/bolars/<version>/manifest.json
artifacts/showcases/bolars/<version>/sha256.txt
artifacts/showcases/bolars/production/manifest.json
```

`bundle.zip` must contain `index.html` in the archive root.

## 2. Publish To Static Location

Copy/upload:

```text
artifacts/showcases/bolars/<version>/bundle.zip
artifacts/showcases/bolars/production/manifest.json
```

Suggested public layout:

```text
showcases/bolars/versions/<version>/bundle.zip
showcases/bolars/production/manifest.json
```

`production/manifest.json` should use `no-cache` or a short TTL if the static host supports cache headers. Versioned `bundle.zip` can be cached long-term.

## 3. Configure KioskRunner

Extract audited `KioskRunner-win-x64.zip`.

Copy:

```text
config.example.json -> config.json
```

Set:

```json
{
  "registryUrl": "https://updates.example.com/showcases/bolars/production/manifest.json",
  "webServer": {
    "listenHost": "127.0.0.1",
    "port": 8787,
    "basePath": "/kiosk/bolars/"
  }
}
```

## 4. Install Bundle

Run:

```powershell
.\KioskRunner.exe update-once --config .\config.json
.\KioskRunner.exe status --config .\config.json
```

`update-once` installs/updates `current` and exits. It does not keep the web server running.

## 5. Start Serving

Foreground smoke:

```powershell
.\KioskRunner.exe service --config .\config.json
```

Windows Service option:

```powershell
.\install-service.ps1 -ConfigPath .\config.json
Start-Service -Name KioskRunner-bolars
```

## 6. Verify

Open:

```text
http://127.0.0.1:8787/kiosk/bolars/
http://127.0.0.1:8787/healthz
http://127.0.0.1:8787/runner/status
```

Expected:

- showcase HTML opens;
- `/healthz` is OK;
- `/runner/status` shows current/served version;
- no GitHub branch, source repo, `main`, `dist`, or build descriptor URL is used by KioskRunner.

## 7. Handoff To 1С

Pass only this stable URL to the 1С implementer:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

1С does not need manifest, bundle, GitHub, `versions`, `current`, or release pipeline details.
