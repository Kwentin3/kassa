# Implementation Readiness: KioskRunner MVP

Дата: 2026-05-28  
Статус: pre-code readiness pack  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## 1. Purpose

Этот документ фиксирует readiness перед реализацией KioskRunner MVP. Он не пишет код, не меняет PRD, не меняет HTML ↔ 1С bridge и не меняет 1С-контракты.

Документ отвечает:

- какие решения уже зафиксированы PRD/Blueprint;
- какие canon decisions нужно принять перед кодом;
- какие recommended MVP defaults принимаются сейчас;
- что остаётся future hardening;
- как разбить реализацию на безопасные slices;
- какие acceptance gates нужны после каждого slice;
- какие документы являются source of truth для каждого slice.

## 2. Already Fixed By PRD / Blueprint

| Area | Fixed decision |
| --- | --- |
| Product boundary | Runner не является backend 1С, не владеет корзиной, не принимает бизнес-команды, не хранит продажи. |
| Update source | Runner читает только `registryUrl -> production manifest -> bundle.zip + sha256`. |
| Git behavior | Runner не делает `git pull`, не смотрит branch/main/dist, не скачивает HTML напрямую из ветки. |
| Static serving | Embedded web server отдаёт только `current`. |
| Default URL | `http://127.0.0.1:8787/kiosk/bolars/`. |
| Apache/Nginx | Optional external reverse/static profile, не обязательная зависимость. |
| Public MVP | Public/no-auth допустим при no secrets, no business data, localhost-only. |
| Artifact separation | Runner artifact и showcase artifact разделены. |
| Bootstrap | `KioskRunner-win-x64.zip`, `config.example.json`, local `config.json`, `update-once`, service install. |
| Rollback | Rollback работает от локального `previousVersion` без GitHub. |

Primary docs:

- `README.md`;
- `BLUEPRINT_KIOSK_RUNNER_ARCHITECTURE.md`;
- `CONTRACT_KIOSK_RUNNER_CONFIG.md`;
- `CONTRACT_KIOSK_RUNNER_MANIFEST.md`;
- `CONTRACT_KIOSK_RUNNER_BUNDLE.md`;
- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`;
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`;
- `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md`;
- `BLUEPRINT_KIOSK_RUNNER_WINDOWS_SERVICE.md`;
- `BLUEPRINT_KIOSK_RUNNER_ROLLBACK_AND_RECOVERY.md`;
- `SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`;
- `TEST_MATRIX_KIOSK_RUNNER_MVP.md`.

## 3. Canon Decisions Before Code

### 3.1 .NET Version

Recommended MVP default: **.NET 10 LTS**.

Rationale:

- current LTS on 2026-05-28;
- official Microsoft support policy lists .NET 10 as LTS, active, with end of support on 2028-11-14;
- good fit for Windows Service / Worker Service;
- Kestrel and ASP.NET Core hosting are first-class;
- supports self-contained publish for Windows x64 runner artifact;
- gives enough lifecycle runway beyond .NET 8 LTS, which is closer to end of support.

Source:

- Microsoft official .NET support policy: https://dotnet.microsoft.com/en-us/platform/support/policy

Implementation note:

- publish as self-contained `win-x64` unless ops explicitly decides framework-dependent deployment;
- pin patch updates through release pipeline, not kiosk-local SDK installation.

### 3.2 Runner Release Location

Recommended MVP default: **GitHub Releases from a dedicated runner repo**.

Acceptable fallback: dedicated release area in a monorepo if repository ownership requires it.

Decision:

- runner artifact and showcase artifact remain separate;
- runner release is `KioskRunner-win-x64.zip`;
- showcase release is `bundle.zip + manifest.json + sha256`;
- self-update runner is not part of MVP.

Rationale:

- clearer ownership and release cadence;
- avoids confusing runner binary with HTML showcase releases;
- keeps future signing/installer pipeline simpler.

### 3.3 Installer Format

Recommended MVP default: **zip + PowerShell scripts**.

Package:

```text
KioskRunner-win-x64.zip
  KioskRunner.exe
  config.example.json
  install-service.ps1
  uninstall-service.ps1
  README.md
  LICENSE / NOTICE
```

Future path:

- MSI installer;
- exe installer;
- install wizard;
- enterprise deployment package.

Rationale:

- fastest MVP path;
- transparent for implementer/admin;
- no installer framework decision needed before core behavior is proven;
- service install can be scripted and reviewed.

### 3.4 Windows `current` Switch Mechanism

Options:

| Option | Pros | Cons |
| --- | --- | --- |
| Copy-to-current | Simple, no symlink privileges. | Risk of mixed files during copy, slow for large assets, rollback copies again, active file locks can interfere. |
| Directory replace/rename | Fast on same volume, simple mental model. | Can fail if files/dirs are in use; Windows semantics require careful handling. |
| Junction/symlink | Version dirs stay immutable; fast switch; rollback is fast; active file handles can continue reading old version. | Requires Windows reparse point handling and ops validation; symlink may require privileges; junction behavior must be tested. |
| Current pointer file | Very safe for switching; atomic file replace possible. | Web server must resolve pointer dynamically; weakens "static root current" mental model. |
| Staged directory + swap | Good general pattern. | Needs a concrete switch primitive underneath. |

Recommended MVP default: **immutable `versions/<version>` directories + `current` as a directory junction to the active version**.

Switch flow:

1. Extract and validate under staging.
2. Move validated version to `versions/<version>`.
3. Create `current.next` junction to `versions/<version>`.
4. Under publish lock, switch `current` from old junction to new junction.
5. Keep old version directory intact.
6. Update `state.json`.

Fallback if junction is blocked by client policy: copy-to-current with `current.backup` and strict publish lock, but this should be treated as a deployment profile, not the preferred MVP default.

Rationale:

- avoids modifying files currently served;
- rollback is switching junction back;
- version folders remain immutable;
- aligns with `versions/current` model;
- reduces stale mixed-asset risk compared with in-place copy.

Acceptance requirement:

- failed switch keeps old current available or marks service degraded without exposing staging.

### 3.5 Served-Version Marker

Options:

| Option | Pros | Cons |
| --- | --- | --- |
| `version.json` inside current | Easy to fetch through static path. | Modifies bundle unless release pipeline owns it. |
| Runner-served metadata in status endpoint | No bundle mutation; reliable for diagnostics. | Does not prove browser cache loaded new index. |
| `build-info.json` in bundle | Build-owned, useful traceability. | Requires showcase build contract addition. |
| `X-Kiosk-Showcase-Version` header | Useful per-response proof. | Needs header inspection; cache can still return old response if upstream exists. |

Recommended MVP default: **runner status `servedVersion` + `X-Kiosk-Showcase-Version` header on static responses**.

Rules:

- `/runner/status` includes `currentVersion` and `servedVersion`;
- static responses include `X-Kiosk-Showcase-Version: <currentVersion>`;
- `index.html` uses no-store/short cache;
- if bundle provides `build-info.json`, runner may surface it as optional diagnostic, but MVP does not require it.

Rationale:

- no need to mutate bundle;
- works with junction-based current;
- gives both machine-readable status and per-response evidence.

### 3.6 Config Management For Multiple Kiosks

Recommended MVP default: **local `config.json` per kiosk**.

Future:

- central config distribution;
- tenant/license binding;
- signed config;
- fleet management.

Do not block future path:

- keep config loading behind a clear config provider boundary;
- validate config as a contract, not ad hoc settings;
- avoid compile-time constants for `registryUrl`, port, basePath, rootDir;
- keep `runnerId` and `showcaseId` explicit.

### 3.7 Auth / Signatures / Private Registry / Self-Update

MVP decision:

- no mandatory auth;
- no private registry requirement;
- no signed manifest requirement;
- no signed bundle requirement;
- no runner self-update.

MVP security model:

```text
trusted registryUrl
+ sha256 bundle verification
+ no secrets in artifacts
+ no 1С business data in artifacts
+ localhost-only web server
```

Future hardening:

- private registry;
- token auth;
- signed manifest;
- signed bundle;
- signed runner release;
- tenant/license binding;
- central update server;
- runner self-update.

## 4. Implementation Slices

### Slice 0. Repository / Project Skeleton

Scope:

- .NET solution;
- CLI entrypoint;
- command routing skeleton;
- basic logging;
- no network update yet.

Acceptance gate:

- `KioskRunner.exe --help` or equivalent command list works;
- app starts and exits cleanly;
- logs can be written to configured/default local location;
- no 1С/backend code introduced.

Source docs:

- `BLUEPRINT_KIOSK_RUNNER_ARCHITECTURE.md`;
- `BLUEPRINT_KIOSK_RUNNER_WINDOWS_SERVICE.md`.

### Slice 1. Config And Validation

Scope:

- `config.json`;
- `config.example.json`;
- validation errors;
- `no_config`;
- `registry_url_missing`;
- unsafe listener validation.

Acceptance gate:

- missing config returns degraded/no_config;
- invalid JSON is reported clearly;
- `registryUrl` branch/dist/source URL is rejected by shape once fetched or flagged by validation if obvious;
- `0.0.0.0` blocked unless explicit future ops override exists.

Source docs:

- `CONTRACT_KIOSK_RUNNER_CONFIG.md`;
- `RUNBOOK_KIOSK_RUNNER_FIRST_INSTALL_WINDOWS.md`;
- `SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`.

### Slice 2. Manifest Client

Scope:

- download manifest;
- parse/validate;
- reject HTML instead of JSON;
- reject wrong `showcaseId`, `channel`, `status`;
- `minRunnerVersion` check.

Acceptance gate:

- valid manifest accepted;
- HTML response rejected;
- wrong showcase blocked;
- non-production status blocked;
- high `minRunnerVersion` returns `runner_update_required`;
- no bundle download occurs on invalid manifest.

Source docs:

- `CONTRACT_KIOSK_RUNNER_MANIFEST.md`;
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`;
- `TEST_MATRIX_KIOSK_RUNNER_MVP.md`.

### Slice 3. Bundle Download And Integrity

Scope:

- download `bundle.zip`;
- `downloads` folder;
- sha256 calculation;
- invalid hash handling.

Acceptance gate:

- valid bundle hash passes;
- invalid hash blocks install;
- failed download keeps current unchanged;
- no scripts executed from manifest or bundle.

Source docs:

- `CONTRACT_KIOSK_RUNNER_MANIFEST.md`;
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`;
- `SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`.

### Slice 4. Bundle Extraction And Validation

Scope:

- staging folder;
- unzip;
- zip-slip/path traversal protection;
- root `index.html` check;
- forbidden files check;
- static/V8WebKit compatibility checks where objectively detectable.

Acceptance gate:

- broken zip rejected;
- missing `index.html` rejected;
- forbidden `.env` rejected;
- extraction cannot write outside staging;
- validation failure keeps current unchanged.

Source docs:

- `CONTRACT_KIOSK_RUNNER_BUNDLE.md`;
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`.

### Slice 5. Version Storage And Current Switch

Scope:

- `versions/<version>`;
- junction-based `current` switch;
- `state.json`;
- no-op same version;
- partial update recovery.

Acceptance gate:

- first install creates version and current;
- same version is no-op;
- failed switch does not expose staging;
- old current remains available;
- state updates are durable and sanitized.

Source docs:

- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`;
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`;
- `BLUEPRINT_KIOSK_RUNNER_ROLLBACK_AND_RECOVERY.md`.

### Slice 6. Embedded Static Web Server

Scope:

- Kestrel localhost listener;
- `basePath`;
- static root `current`;
- MIME types;
- SPA fallback;
- no directory listing;
- forbidden paths;
- path traversal protection;
- cache policy.

Acceptance gate:

- canonical URL serves `index.html`;
- `/downloads`, `/versions`, `/logs`, `/state.json`, `/config.json` are blocked;
- path traversal blocked;
- `index.html` cache no-store/short;
- static responses include `X-Kiosk-Showcase-Version`.

Source docs:

- `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md`;
- `CONTRACT_KIOSK_RUNNER_CONFIG.md`;
- `CONTRACT_KIOSK_RUNNER_BUNDLE.md`.

### Slice 7. Health / Status

Scope:

- `/healthz`;
- `/runner/status`;
- degraded states;
- no secrets;
- served-version marker.

Acceptance gate:

- `ok` when current served;
- `degraded/no_current` before first install;
- `unhealthy/port_in_use` on bind conflict;
- status exposes no secrets, tokens, 1С business data, PII, fiscal/payment data;
- status includes `currentVersion` and `servedVersion`.

Source docs:

- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`;
- `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md`;
- `SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`.

### Slice 8. Rollback

Scope:

- `previousVersion`;
- `rollback` command;
- rollback without network;
- damaged current/state scenarios.

Acceptance gate:

- rollback works offline;
- previous version restored;
- state/logs updated;
- missing previous version fails clearly;
- damaged state does not trigger destructive update.

Source docs:

- `BLUEPRINT_KIOSK_RUNNER_ROLLBACK_AND_RECOVERY.md`;
- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`.

### Slice 9. Windows Service Lifecycle

Scope:

- `service` mode;
- install/uninstall scripts;
- start/stop;
- graceful shutdown;
- periodic update loop;
- no parallel update for same showcase.

Acceptance gate:

- service starts web server and update loop;
- shutdown does not corrupt state/current;
- update lock prevents overlapping update;
- service reports degraded states correctly;
- logs are written under `rootDir/logs`.

Source docs:

- `BLUEPRINT_KIOSK_RUNNER_WINDOWS_SERVICE.md`;
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`;
- `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md`.

### Slice 10. Packaging And First Install

Scope:

- `KioskRunner-win-x64.zip`;
- `config.example.json`;
- `install-service.ps1`;
- `uninstall-service.ps1`;
- README;
- first install smoke.

Acceptance gate:

- clean Windows folder can install from zip;
- implementer can copy example config and run `update-once`;
- canonical URL opens;
- service installs and starts;
- 1С handoff URL is stable.

Source docs:

- `RUNBOOK_KIOSK_RUNNER_FIRST_INSTALL_WINDOWS.md`;
- `RUNBOOK_KIOSK_RUNNER_RELEASE_PUBLISHING.md`;
- `HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md`.

### Slice 11. Test Matrix Execution

Scope:

- run MVP test matrix;
- produce closeout report;
- list failed/pending cases.

Acceptance gate:

- `TEST_MATRIX_KIOSK_RUNNER_MVP.md` executed;
- failures are documented with severity;
- no critical invariant broken;
- closeout report identifies remaining manual checks.

Source docs:

- `TEST_MATRIX_KIOSK_RUNNER_MVP.md`;
- all contracts and blueprints.

## 5. Recommended MVP Defaults

| Decision | Recommended default |
| --- | --- |
| .NET version | .NET 10 LTS, self-contained `win-x64` publish. |
| Runner release location | Dedicated runner repo GitHub Releases. |
| Installer | Zip + PowerShell scripts. |
| Service model | One Windows Service per showcase. |
| Web stack | .NET Generic Host / Worker Service + ASP.NET Core Kestrel. |
| Listener | `127.0.0.1:8787`. |
| Current switch | Immutable version dirs + `current` junction to active version. |
| Served version | `/runner/status` `servedVersion` + `X-Kiosk-Showcase-Version` header. |
| Config management | Local `config.json` per kiosk. |
| Logs | JSON Lines. |
| Auth/signing | Not required in MVP; future hardening. |

## 6. Decisions Deferred To Future

- MSI/exe installer;
- install wizard;
- centralized fleet config management;
- private registry;
- token-based download;
- signed manifest;
- signed bundle;
- signed runner release;
- tenant/license binding;
- runner self-update;
- multi-showcase service;
- external listener / non-localhost deployment;
- HTTPS on localhost unless target 1С environment requires it.

## 7. Implementation Order

1. Slice 0 - Project skeleton.
2. Slice 1 - Config and validation.
3. Slice 2 - Manifest client.
4. Slice 3 - Bundle download and integrity.
5. Slice 4 - Bundle extraction and validation.
6. Slice 5 - Version storage and current switch.
7. Slice 6 - Embedded static web server.
8. Slice 7 - Health/status.
9. Slice 8 - Rollback.
10. Slice 9 - Windows Service lifecycle.
11. Slice 10 - Packaging and first install.
12. Slice 11 - Test matrix execution.

## 8. Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Junction switch behavior differs across Windows policies | Current switch fails. | Validate early; keep copy-to-current fallback profile. |
| Port `8787` occupied | 1С URL unavailable. | Fail healthy; do not silently change port. |
| Public manifest compromised | Malicious bundle can match malicious manifest hash. | MVP trusts `registryUrl`; add signed manifest in future. |
| Bundle contains secrets | Secrets exposed publicly/local static. | Bundle validation and release checklist forbid secrets. |
| Cache serves stale `index.html` | 1С sees old UI after update. | no-store/short cache, version header, status servedVersion. |
| Service account lacks filesystem rights | Update fails. | First install validation and runbook permissions. |
| Path traversal bug | Local file exposure. | Canonical path checks, forbidden paths tests. |
| State corruption | Wrong rollback/update behavior. | Durable replace writes, invalidState mode, recovery playbook. |
| Runner mistaken for backend | 1С integration drift. | Handoff and tests assert no business API. |

## 9. Pre-code Checklist

- PRD v0.3 accepted as source of truth.
- Blueprint pack present and reviewed.
- .NET 10 LTS decision accepted.
- Dedicated runner release location accepted or alternative chosen.
- Zip + PowerShell MVP packaging accepted.
- Junction current switch accepted or fallback chosen.
- Served-version marker default accepted.
- Local config per kiosk accepted.
- Public/no-auth MVP accepted with security constraints.
- Test matrix accepted as MVP gate.
- No requirement added for real 1С/payment/KKT/backend integration.

## 10. Definition Of Done For MVP

MVP is done when:

- runner artifact can be installed from zip on Windows;
- `config.example.json` can be copied to valid `config.json`;
- `update-once` installs a valid production bundle from manifest;
- invalid config/manifest/bundle/hash cases fail safely;
- `current` serves through `http://127.0.0.1:8787/kiosk/bolars/`;
- `/healthz` and `/runner/status` work and expose no secrets/business data;
- failed update keeps old current;
- rollback works without network;
- Windows Service runs update loop and web server;
- packaging includes install/uninstall scripts;
- first install runbook passes;
- MVP test matrix is executed and closeout report is produced;
- no code path uses `git pull`, branch/main/dist, manual JSON upload, business API or 1С backend behavior.

## 11. Source Notes

- Official Microsoft .NET support policy, used for .NET 10 LTS decision: https://dotnet.microsoft.com/en-us/platform/support/policy
