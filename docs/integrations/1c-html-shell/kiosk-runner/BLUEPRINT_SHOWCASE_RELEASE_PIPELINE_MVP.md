# Blueprint: Showcase Release Pipeline MVP

Дата: 2026-05-28  
Статус: draft for field trial  
Связанные документы:

- `../PRD_KIOSK_RUNNER_NET_v0.3.md`
- `CONTRACT_KIOSK_RUNNER_MANIFEST.md`
- `CONTRACT_KIOSK_RUNNER_BUNDLE.md`
- `RUNBOOK_KIOSK_RUNNER_RELEASE_PUBLISHING.md`
- `SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`

## 1. Назначение

Showcase Release Pipeline MVP нужен, чтобы подготовить HTML-витрину как проверяемый static bundle для KioskRunner field trial.

Pipeline решает четыре задачи:

- делает repeatable build витрины;
- валидирует static output до публикации;
- создаёт `bundle.zip`, `sha256` и production `manifest.json`;
- публикует manifest/bundle в простом HTTP-доступном месте, откуда KioskRunner может выполнить `update-once`.

Целевой поток:

```text
source showcase
-> build
-> dist-1c/bolars
-> validate
-> bundle.zip
-> sha256
-> manifest.json
-> static/public location
-> KioskRunner update-once
-> KioskRunner service mode
-> http://127.0.0.1:8787/kiosk/bolars/
```

## 2. MVP Boundaries

### In scope

- showcase build descriptor;
- build command;
- output directory;
- bundle validation;
- `bundle.zip`;
- SHA-256 calculation;
- `manifest.json`;
- candidate/production status at a simple file level;
- local or public static publication of manifest/bundle;
- field trial runbook;
- KioskRunner `update-once` smoke.

### Out of scope

- central update-server;
- download telemetry;
- auth/private registry;
- signed manifest or signed bundle;
- fleet management;
- dashboard;
- tenant/license binding;
- KioskRunner self-update;
- automatic remote management of client kiosks.

This MVP domain must not become a registry platform or fleet management system.

## 3. Ownership

| Component | Owns | Does not own |
| --- | --- | --- |
| Showcase source repo | HTML source, build scripts, UI assets, bridge-compatible shell | Kiosk runtime state, 1С business logic |
| Release pipeline script | Build, validation, packaging, manifest generation | Runner install, runner update loop |
| Static publication location | Public files over HTTP | Auth, telemetry, tenant tracking |
| KioskRunner | Reads production manifest, downloads bundle, verifies SHA-256, installs current | Build descriptor, source branch, fleet management |
| 1С / РМК | Business process and HTML bridge interaction | GitHub, manifest, bundle, versions/current |

## 4. Build Descriptor

Recommended descriptor path:

```text
showcases/bolars/showcase.config.json
```

Example:

```json
{
  "showcaseId": "bolars",
  "title": "BOLARS Self-Checkout Showcase",
  "buildCommand": "npm run build:1c:bolars",
  "outputDir": "dist-1c/bolars",
  "bundleName": "bundle.zip",
  "bridgeContractVersion": "bolars-web-1c-v0.1",
  "runtimeProfile": "1c-html-shell-v8webkit-mvp",
  "minRunnerVersion": "0.3.0",
  "requiredFiles": [
    "index.html"
  ],
  "forbiddenFiles": [
    ".env",
    ".env.local",
    ".env.deploy",
    "*.pem",
    "*.pfx",
    "*.key",
    "config.json",
    "state.json"
  ]
}
```

The build descriptor is for the build/publish script only.

KioskRunner must not read this descriptor. KioskRunner reads only local `config.json`, then the production release manifest referenced by `registryUrl`.

## 5. Build / Publish Script

Recommended script:

```text
scripts/publish-showcase-bundle.ps1
```

MVP responsibilities:

1. Read `showcases/bolars/showcase.config.json`.
2. Resolve target showcase version from explicit argument, for example `-Version 2026.05.28.1`.
3. Run `buildCommand`.
4. Verify `outputDir` exists.
5. Verify required files, especially root `index.html`.
6. Reject forbidden files:
   - `.env`;
   - `.env.local`;
   - `.env.deploy`;
   - private keys and certificates;
   - token/password files;
   - runner `config.json`, `state.json`, logs or update metadata.
7. Package contents of `outputDir` into `bundle.zip`.
8. Compute SHA-256 of `bundle.zip`.
9. Create `manifest.json`.
10. Write artifacts to:

```text
artifacts/showcases/bolars/<version>/
  bundle.zip
  manifest.json
  sha256.txt
```

11. Optional promotion copy:

```text
artifacts/showcases/bolars/production/manifest.json
```

The script must not modify KioskRunner code or KioskRunner config.

`bundle.zip` must contain `index.html` in the archive root.

Right:

```text
bundle.zip
  index.html
  assets/
```

Wrong:

```text
bundle.zip
  bolars/
    index.html
    assets/
```

The publish script must archive the contents of `outputDir`, not the `outputDir` folder itself.

## 6. Release Manifest

The release manifest is the contract KioskRunner reads.

It is not the build descriptor. It is not a source branch, not `main`, not `dist`, and not a folder listing.

Example:

```json
{
  "showcaseId": "bolars",
  "channel": "production",
  "version": "2026.05.28.1",
  "status": "production",
  "bundleUrl": "https://<public-static-host>/showcases/bolars/versions/2026.05.28.1/bundle.zip",
  "sha256": "64-char-lowercase-hex-sha256",
  "bridgeContractVersion": "bolars-web-1c-v0.1",
  "minRunnerVersion": "0.3.0",
  "publishedAt": "2026-05-28T12:00:00Z",
  "buildCommit": "abcdef1234567890",
  "rollbackVersion": "2026.05.27.1"
}
```

Rules:

- `showcaseId` must match runner `config.json`.
- `channel` must be `production` for field trial install.
- `status` must be `production` for KioskRunner to install it.
- `bundleUrl` must point to immutable `bundle.zip`.
- `sha256` must match the exact published zip.
- `bridgeContractVersion` must match the HTML ↔ 1С bridge contract expected by the bundle.
- `minRunnerVersion` must not exceed installed KioskRunner version unless the operator intentionally updates runner first.

Candidate manifest may exist during checks, but the field-trial `registryUrl` must point to the production manifest only.

## 7. Static Publication For MVP

Allowed options:

| Option | Use | Notes |
| --- | --- | --- |
| A. Local static folder / simple HTTP server | Lab and first field smoke | Fastest for local validation, not ideal as shared registry. |
| B. GitHub Release assets | Versioned immutable bundle storage | Good for archived release artifacts, less convenient for stable production manifest URL. |
| C. Existing public static deployment host | Recommended first field-trial option if ops approves | Reuses the already available public web host; no new update-server. |
| D. GitHub Pages / static hosting | Recommended fallback default | Stable production manifest URL plus immutable versioned bundle path. |

Recommended MVP default:

```text
Existing public static deployment host if available and approved; otherwise GitHub Pages-style static hosting or any equivalent dumb static HTTPS hosting.
```

Suggested layout:

```text
showcases/bolars/
  production/
    manifest.json
  versions/
    2026.05.28.1/
      bundle.zip
      manifest.json
      sha256.txt
```

Example runner `registryUrl`:

```text
https://<public-static-host>/showcases/bolars/production/manifest.json
```

Example immutable bundle URL inside manifest:

```text
https://<public-static-host>/showcases/bolars/versions/2026.05.28.1/bundle.zip
```

Important distinction:

- static hosting may be backed by GitHub Pages, object storage, a simple web server, or another static host;
- KioskRunner treats it only as an HTTP URL to production `manifest.json`;
- KioskRunner must not infer source repo, branch, `main`, `dist`, or build output paths.

Cache policy:

- `production/manifest.json` should update predictably and must not stick in cache for a long time;
- if the static host supports cache headers, serve `production/manifest.json` with `no-cache` or a short TTL;
- versioned `bundle.zip` may use long cache because its path is immutable;
- if the static host cannot control cache headers, field-trial runbook must account for possible manifest update delay.

## 8. Candidate To Production

MVP promotion is file-level and manual or semi-manual.

Suggested flow:

1. Build version `2026.05.28.1`.
2. Write versioned artifacts under `artifacts/showcases/bolars/2026.05.28.1/`.
3. Generate candidate manifest with:

```json
{
  "channel": "candidate",
  "status": "candidate"
}
```

4. Run bundle validation and smoke.
5. Publish immutable `versions/2026.05.28.1/bundle.zip`.
6. Write production manifest with:

```json
{
  "channel": "production",
  "status": "production"
}
```

7. Copy or upload production manifest to:

```text
showcases/bolars/production/manifest.json
```

Only the production manifest is used by field-trial KioskRunner config.

## 9. Field Trial Runbook

1. Build bundle:

```powershell
scripts/publish-showcase-bundle.ps1 -Showcase bolars -Version 2026.05.28.1
```

2. Verify generated files:

```text
artifacts/showcases/bolars/2026.05.28.1/bundle.zip
artifacts/showcases/bolars/2026.05.28.1/manifest.json
artifacts/showcases/bolars/2026.05.28.1/sha256.txt
```

3. Publish bundle and manifest to the chosen static location.
4. Confirm production manifest is available over HTTP.
5. Download or take the audited `KioskRunner-win-x64.zip`.
6. Extract runner to a local folder, for example:

```text
C:\KioskRunner
```

7. Copy:

```text
config.example.json -> config.json
```

8. Set `registryUrl` to production manifest:

```json
"registryUrl": "https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json"
```

9. Confirm default local serving config:

```json
"webServer": {
  "listenHost": "127.0.0.1",
  "port": 8787,
  "basePath": "/kiosk/bolars/"
}
```

10. Run:

```powershell
KioskRunner.exe update-once --config config.json
```

`update-once` only downloads manifest, downloads bundle, verifies SHA-256, extracts the bundle, switches `current`, writes state/logs, and exits. It does not keep the localhost web server running.

11. Check:

```powershell
KioskRunner.exe status --config config.json
```

12. Start serving mode.

Foreground option:

```powershell
KioskRunner.exe service --config config.json
```

Windows Service option:

```powershell
.\install-service.ps1 -ConfigPath .\config.json
Start-Service -Name KioskRunner-bolars
```

13. Open:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

14. Check diagnostics:

```text
http://127.0.0.1:8787/healthz
http://127.0.0.1:8787/runner/status
```

15. Pass only the stable showcase URL to the 1С implementer:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

1С does not need GitHub, manifest, bundle, versions, `current`, or pipeline details.

## 10. Smoke Tests

Minimum field-trial smoke:

| Check | Expected result |
| --- | --- |
| `bundle.zip` contains root `index.html` | Pass |
| Forbidden files are absent | Pass |
| SHA-256 in manifest matches `bundle.zip` | Pass |
| Manifest JSON is valid | Pass |
| Manifest `showcaseId=bolars` | Pass |
| Manifest `channel=production` | Pass |
| Manifest `status=production` | Pass |
| `bundleUrl` is HTTP-accessible | Pass |
| KioskRunner accepts manifest | Pass |
| KioskRunner downloads bundle | Pass |
| KioskRunner verifies SHA-256 | Pass |
| KioskRunner publishes `current` | Pass |
| Localhost URL opens showcase | Pass |
| `/healthz` responds | Pass |
| `/runner/status` shows installed version | Pass |
| Wrong SHA-256 blocks update | Pass |
| Failed update keeps old `current` | Pass |

Smoke does not require real 1С, scanner, acquiring, KKT, fiscalization, marking or live catalog backend.

## 11. Anti-Combiner Rule

This MVP domain must stay small.

Do not add:

- update-server;
- central registry platform;
- fleet dashboard;
- download telemetry;
- tenant/license binding;
- auth/private registry;
- signatures;
- remote kiosk orchestration.

If the project needs to know who downloaded what, when, from which kiosk, and which version is installed across many machines, that is a separate future domain:

```text
KioskRunner Update Server / Fleet Management
```

Current MVP observability is limited to:

- local KioskRunner logs;
- `/runner/status` on the specific kiosk machine;
- manual field-trial report.

## 12. Security Rules

- No secrets in build descriptor.
- No secrets in `manifest.json`.
- No secrets in `bundle.zip`.
- No `.env` files in bundle.
- No private keys, tokens or certificates in bundle.
- No 1С business data in bundle.
- No cart/payment/receipt/fiscal/marking state in bundle.
- No public/no-auth mode for transferring 1С data.
- `sha256` verifies bundle integrity relative to manifest; it does not replace signed manifest.
- MVP trust is based on trusted `registryUrl`.

## 13. Future Work

Future domains or phases may add:

- private registry;
- token-based download;
- signed manifest;
- signed bundle;
- signed runner release;
- tenant/license binding;
- central update server;
- fleet dashboard;
- per-kiosk version inventory;
- automated promotion pipeline with approvals.

These are intentionally out of MVP field trial scope.

## 14. Open Questions

- Which exact static host will be used for the first field trial: GitHub Pages, object storage, existing public web server, or temporary lab server?
- What version naming convention should be canonical after field trial: calendar version, semantic version, or build-number suffix?
- Should production promotion be a manual copy, GitHub Action, or release operator script for the first trial?
- Is a candidate manifest needed for field trial, or is local smoke enough before writing production manifest?
- Which visual/runtime smoke is mandatory before promoting BOLARS bundle to production?

## 15. Acceptance Criteria

- Document defines a minimal pipeline from source showcase to `bundle.zip` and `manifest.json`.
- Document keeps KioskRunner as consumer of production manifest only.
- Document does not introduce update-server, auth, telemetry, dashboard or fleet management.
- Document defines build descriptor and states that KioskRunner does not read it.
- Document defines release manifest as the KioskRunner contract.
- Document chooses a simple static publication default.
- Document includes field-trial runbook.
- Document includes smoke tests.
- Document preserves the rule that HTML bundle is static UI shell without secrets or 1С business data.

## Changelog

- Clarified `update-once` vs service serving lifecycle.
- Clarified `bundle.zip` root structure and required archive behavior.
- Added production manifest cache note.
- Clarified first field-trial publication mode: existing public static deployment host if approved, otherwise dumb static hosting/GitHub Pages-style fallback.
- Preserved anti-combiner MVP scope.
