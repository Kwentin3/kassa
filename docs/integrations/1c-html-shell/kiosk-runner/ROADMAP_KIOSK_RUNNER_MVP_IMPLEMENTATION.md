# Roadmap: KioskRunner MVP Implementation

Дата: 2026-05-28  
Статус: executable implementation roadmap  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## 1. Mission

KioskRunner MVP должен уметь:

```text
local config.json
  -> registryUrl
  -> production manifest
  -> immutable bundle.zip + sha256
  -> download
  -> sha256 verification
  -> extract
  -> validate bundle
  -> publish versions/<version>
  -> switch current
  -> serve current on localhost
  -> health/status
  -> rollback
  -> Windows Service install/run
```

Canonical URL:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

The roadmap is executable by an implementation agent slice by slice. Each slice must finish with tests, acceptance gate and closeout report before the next slice starts.

## 2. Non-Negotiable Architecture Rules

- No `git pull`.
- No branch/main/dist lookup.
- No direct HTML download from GitHub source branch.
- No backend 1С behavior.
- No business API.
- No cart ownership.
- No sale/payment/fiscal state in runner.
- No manual JSON upload/import.
- No secrets in bundle, manifest or `config.example.json`.
- `registryUrl` points to production manifest only.
- Manifest points to immutable `bundle.zip` and `sha256`.
- Bundle is static UI shell only.
- Embedded web server serves only `current`.
- Default listener is `127.0.0.1`.
- Apache/Nginx are optional only, never required for MVP.
- Auth/private registry/self-update are future hardening, not MVP requirements.
- Contracts first.
- Ports before adapters.
- Core depends on ports/contracts, not infrastructure.
- Small slices only.
- Tests before next slice.
- Closeout after each slice.

## 3. Source Of Truth Map

| Document | Role | Read when | Controls |
| --- | --- | --- | --- |
| `../PRD_KIOSK_RUNNER_NET_v0.3.md` | Product source of truth. | Before every slice. | Product boundaries, MVP scope, non-goals. |
| `README.md` | Blueprint domain index. | Before planning or onboarding. | Document map, development order, canon decisions. |
| `IMPLEMENTATION_READINESS_KIOSK_RUNNER_MVP.md` | MVP defaults and slices. | Before implementation starts and before roadmap changes. | .NET version, packaging, current switch, implementation order. |
| `BLUEPRINT_KIOSK_RUNNER_ARCHITECTURE.md` | Technical architecture. | Slice 0 and architecture reviews. | Process topology, domain map, boundaries. |
| `CONTRACT_KIOSK_RUNNER_CONFIG.md` | Config schema and validation. | Slices 1, 7, 9, 10. | `config.json`, `config.example.json`, validation errors. |
| `CONTRACT_KIOSK_RUNNER_MANIFEST.md` | Manifest schema and validation. | Slice 2. | Production manifest rules, branch/dist prohibition. |
| `CONTRACT_KIOSK_RUNNER_BUNDLE.md` | Bundle requirements. | Slices 3, 4, 6. | Zip structure, forbidden files, static runtime constraints. |
| `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md` | State/status contract. | Slices 5, 7, 8. | `state.json`, health/status values, no secret fields. |
| `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md` | Update lifecycle. | Slices 2-5, 9. | Manifest-to-current flow, staging, idempotency. |
| `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md` | Embedded web server. | Slices 6-7. | Kestrel, static serving, cache, traversal, forbidden paths. |
| `BLUEPRINT_KIOSK_RUNNER_WINDOWS_SERVICE.md` | CLI/service lifecycle. | Slices 0, 9, 10. | Commands, install scripts, service behavior. |
| `BLUEPRINT_KIOSK_RUNNER_ROLLBACK_AND_RECOVERY.md` | Rollback/recovery. | Slice 8 and failure work. | Rollback, damaged state, missing current, playbooks. |
| `RUNBOOK_KIOSK_RUNNER_FIRST_INSTALL_WINDOWS.md` | First install operations. | Slice 10 and smoke. | Zip install, config, update-once, service install. |
| `RUNBOOK_KIOSK_RUNNER_RELEASE_PUBLISHING.md` | Release publishing. | Slice 10 and release automation. | Runner artifact vs showcase artifact. |
| `SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md` | Security model. | Every network/static/status slice. | Public MVP, localhost-only, sha256 vs signatures. |
| `TEST_MATRIX_KIOSK_RUNNER_MVP.md` | Final acceptance matrix. | Slice 11 and regression checks. | MVP test coverage. |
| `HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md` | 1С handoff. | Slice 10 and docs closeout. | Stable URL, no backend, bridge boundary. |

## 4. Layered Target Architecture

### 4.1 Contracts

Purpose:

- DTOs;
- contract validation rules;
- error codes;
- health/status values.

Allowed:

- pure data models;
- validation results;
- deterministic validators.

Forbidden:

- HTTP client;
- filesystem;
- zip APIs;
- Kestrel;
- Windows Service APIs.

Dependencies:

- may depend only on base runtime/shared primitives.

### 4.2 Ports

Purpose:

- interfaces for external dependencies.

Allowed:

- `IConfigProvider`;
- `IManifestClient`;
- `IBundleDownloader`;
- `IHashVerifier`;
- `IZipExtractor`;
- `IFileSystem`;
- `IVersionStore`;
- `ICurrentPublisher`;
- `IStateStore`;
- `IRunnerLogger`;
- `IClock`;
- `IWebServerHost`;
- `IHealthStatusProvider`.

Forbidden:

- implementation logic tied to Windows/Kestrel/System.IO.

Dependencies:

- contracts only.

### 4.3 Core / Application

Purpose:

- orchestrate scenarios:
  - load config;
  - validate config;
  - fetch manifest;
  - validate manifest;
  - download bundle;
  - verify sha256;
  - extract bundle;
  - validate bundle;
  - publish version;
  - switch current;
  - rollback;
  - produce status.

Allowed:

- application services;
- use case orchestration;
- policy decisions from contracts.

Forbidden:

- direct GitHub calls;
- direct `HttpClient`;
- direct `System.IO`;
- direct `ZipArchive`;
- Kestrel;
- Windows Service;
- PowerShell;
- 1С business logic.

Dependencies:

- contracts and ports.

### 4.4 Adapters

Purpose:

- implement ports using infrastructure.

Allowed:

- `JsonFileConfigProvider`;
- `HttpManifestClient`;
- `HttpBundleDownloader`;
- `Sha256HashVerifier`;
- `SystemIoFileSystem`;
- `ZipArchiveExtractor`;
- `FileSystemVersionStore`;
- `JunctionCurrentPublisher`;
- `JsonStateStore`;
- `KestrelStaticWebServerAdapter`;
- `WindowsServiceHostAdapter`;
- logging adapter;
- clock adapter.

Forbidden:

- product policy not expressed in core/contracts;
- 1С business API.

Dependencies:

- ports, contracts, infrastructure libraries.

### 4.5 Hosts

Purpose:

- CLI and Windows Service shells.

Allowed:

- parse command line;
- wire dependency injection;
- start use cases;
- map exit codes;
- start service host.

Forbidden:

- manual manifest validation;
- manual bundle download;
- direct update lifecycle implementation;
- business logic.

Dependencies:

- core/application, adapters, contracts.

### 4.6 Tests

Purpose:

- prove contracts, core and adapters.

Allowed:

- unit tests;
- adapter tests;
- integration tests;
- Windows smoke tests;
- final matrix execution evidence.

Forbidden:

- fake tests that only snapshot text without terminal outcome.

### 4.7 Packaging

Purpose:

- produce `KioskRunner-win-x64.zip`.

Allowed:

- self-contained publish;
- include `config.example.json`, scripts, README.

Forbidden:

- embedding production secrets;
- embedding client-specific config as default.

## 5. Proposed Project Structure

Recommended MVP structure:

```text
src/
  KioskRunner.Contracts/
  KioskRunner.Ports/
  KioskRunner.Core/
  KioskRunner.Adapters.FileSystem/
  KioskRunner.Adapters.Http/
  KioskRunner.Adapters.Zip/
  KioskRunner.Adapters.WebServer/
  KioskRunner.Host.Cli/
  KioskRunner.Host.Service/
tests/
  KioskRunner.Tests.Unit/
  KioskRunner.Tests.Integration/
  KioskRunner.Tests.WindowsSmoke/
packaging/
  config.example.json
  install-service.ps1
  uninstall-service.ps1
docs/
  integrations/1c-html-shell/kiosk-runner/
```

Compact MVP alternative:

```text
src/
  KioskRunner.Contracts/
  KioskRunner.Core/
  KioskRunner.Infrastructure/
  KioskRunner.Host/
tests/
  KioskRunner.Tests.Unit/
  KioskRunner.Tests.Integration/
```

If compact structure is chosen, namespaces/folders must still preserve contracts, ports, core, adapters and hosts. Core must not directly depend on infrastructure.

## 6. Slice Protocol

Every slice must define:

- goal;
- scope;
- out of scope;
- source docs;
- contracts touched;
- ports introduced;
- adapters introduced;
- files allowed to change;
- tests required;
- manual checks required;
- acceptance gate;
- closeout report;
- stop conditions.

General protocol:

1. Read source docs for slice.
2. Verify previous slice closeout.
3. Implement only current slice scope.
4. Add/update tests for current slice.
5. Run relevant tests.
6. Run broader regression if shared contracts changed.
7. Write closeout.
8. Move to next slice only if gate passes.

Stop conditions:

- tests do not pass;
- PRD invariant is violated;
- backend behavior appears;
- business API appears;
- manual JSON upload appears;
- contract change is required without explicit decision;
- architecture fork appears;
- implementation needs scope outside current slice;
- Apache/Nginx becomes required;
- auth/private registry/self-update becomes required for MVP;
- core starts depending on concrete infrastructure.

## 7. Implementation Slices

### Stage 0. Architecture Skeleton And Project Boundaries

Goal:

- create solution skeleton and layer boundaries without business logic.

Scope:

- .NET solution;
- projects;
- dependency rules;
- empty ports/contracts;
- basic CLI entrypoint;
- basic test project.

Out of scope:

- config parsing;
- network;
- filesystem update;
- web server;
- Windows Service install.

Source docs:

- `BLUEPRINT_KIOSK_RUNNER_ARCHITECTURE.md`;
- `BLUEPRINT_KIOSK_RUNNER_WINDOWS_SERVICE.md`;
- `IMPLEMENTATION_READINESS_KIOSK_RUNNER_MVP.md`.

Contracts touched:

- none beyond empty marker/types if needed.

Ports introduced:

- empty port project or initial interface placeholders.

Adapters introduced:

- none.

Files allowed:

- solution/project files;
- host CLI shell;
- test skeleton;
- packaging placeholders only if needed.

Tests required:

- solution builds;
- test project runs empty/basic test.

Manual checks:

- inspect project references: core must not reference adapters/hosts.

Acceptance gate:

- layers compile;
- dependencies point inward;
- no network/filesystem/webserver implementation in core.

### Stage 1. Contracts Baseline

Goal:

- define contract models and validation result model.

Scope:

- config contract;
- manifest contract;
- state contract;
- status contract;
- health contract;
- error codes.

Out of scope:

- reading files;
- downloading manifest;
- writing state.

Source docs:

- `CONTRACT_KIOSK_RUNNER_CONFIG.md`;
- `CONTRACT_KIOSK_RUNNER_MANIFEST.md`;
- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`.

Contracts touched:

- all baseline DTOs and validators.

Ports introduced:

- none.

Adapters introduced:

- none.

Files allowed:

- `KioskRunner.Contracts`;
- unit tests.

Tests required:

- validation success/failure unit tests;
- structured error code tests.

Manual checks:

- verify no infrastructure references in contracts.

Acceptance gate:

- contract unit tests pass;
- validation errors are structured;
- no infrastructure code inside contracts.

### Stage 2. Config Provider Slice

Goal:

- read and validate `config.json`.

Scope:

- `IConfigProvider`;
- `JsonFileConfigProvider`;
- `config.example.json`;
- config error handling.

Out of scope:

- manifest HTTP call;
- update lifecycle;
- web server.

Source docs:

- `CONTRACT_KIOSK_RUNNER_CONFIG.md`;
- `RUNBOOK_KIOSK_RUNNER_FIRST_INSTALL_WINDOWS.md`;
- `SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`.

Contracts touched:

- config contract and error codes only.

Ports introduced:

- `IConfigProvider`;
- optionally `IFileSystem` if file reads are abstracted immediately.

Adapters introduced:

- `JsonFileConfigProvider`;
- `SystemIoFileSystem` only if needed.

Files allowed:

- contracts if validation gap found;
- ports;
- config adapter;
- CLI command that invokes config load;
- tests;
- `config.example.json`.

Tests required:

- `no_config`;
- `invalid_json`;
- `registry_url_missing`;
- unsafe `listenHost`;
- valid config accepted;
- `config.example.json` contains no secrets.

Manual checks:

- inspect example config for placeholders only.

Acceptance gate:

- all config tests pass;
- no network update exists yet.

### Stage 3. Manifest Client Slice

Goal:

- fetch and validate production manifest.

Scope:

- `IManifestClient`;
- `HttpManifestClient`;
- manifest parse/shape validation;
- min runner version policy.

Out of scope:

- bundle download;
- hash;
- unzip.

Source docs:

- `CONTRACT_KIOSK_RUNNER_MANIFEST.md`;
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`.

Contracts touched:

- manifest contract and error codes.

Ports introduced:

- `IManifestClient`;
- `IClock` if timestamp validation/logging uses time.

Adapters introduced:

- `HttpManifestClient`;
- test fake HTTP handler.

Files allowed:

- contracts;
- ports;
- HTTP adapter;
- manifest application service;
- tests.

Tests required:

- HTML instead of JSON rejected;
- wrong `showcaseId` rejected;
- wrong channel rejected;
- non-production rejected;
- invalid `sha256` rejected;
- `minRunnerVersion` too high returns `runner_update_required`;
- no bundle download yet.

Manual checks:

- confirm code path does not use branch/main/dist conventions.

Acceptance gate:

- manifest tests pass;
- invalid manifest prevents next lifecycle step.

### Stage 4. Bundle Download And SHA-256 Slice

Goal:

- download `bundle.zip` and verify `sha256`.

Scope:

- `IBundleDownloader`;
- `IHashVerifier`;
- downloads folder;
- hash mismatch handling.

Out of scope:

- unzip;
- current switch.

Source docs:

- `CONTRACT_KIOSK_RUNNER_MANIFEST.md`;
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`;
- `SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`.

Contracts touched:

- download/hash error codes.

Ports introduced:

- `IBundleDownloader`;
- `IHashVerifier`.

Adapters introduced:

- `HttpBundleDownloader`;
- `Sha256HashVerifier`.

Files allowed:

- ports;
- HTTP/hash adapters;
- update application service partial flow;
- tests.

Tests required:

- valid hash accepted;
- wrong hash rejected;
- download failure keeps current untouched;
- no unzip yet.

Manual checks:

- confirm downloaded files are stored under `downloads`, not `current`.

Acceptance gate:

- hash tests pass;
- failed download/hash cannot publish.

### Stage 5. Bundle Extraction And Validation Slice

Goal:

- extract bundle to staging and validate structure.

Scope:

- `IZipExtractor`;
- `IBundleValidator`;
- staging;
- zip-slip protection;
- root `index.html`;
- forbidden file detection.

Out of scope:

- version store publish;
- current switch.

Source docs:

- `CONTRACT_KIOSK_RUNNER_BUNDLE.md`;
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`.

Contracts touched:

- bundle validation errors.

Ports introduced:

- `IZipExtractor`;
- `IBundleValidator`.

Adapters introduced:

- `ZipArchiveExtractor`;
- filesystem-backed staging adapter if not already present.

Files allowed:

- ports;
- zip adapter;
- bundle validator;
- tests.

Tests required:

- zip-slip blocked;
- broken zip rejected;
- missing `index.html` rejected;
- forbidden `.env` rejected;
- staging cleaned on failure.

Manual checks:

- inspect extracted paths stay under staging.

Acceptance gate:

- invalid bundle never reaches `versions/current`.

### Stage 6. Version Store And Current Publisher Slice

Goal:

- save valid version and switch `current`.

Scope:

- `IVersionStore`;
- `ICurrentPublisher`;
- `IStateStore`;
- `FileSystemVersionStore`;
- `JunctionCurrentPublisher`;
- `JsonStateStore`;
- first install;
- no-op same version;
- partial update recovery.

Out of scope:

- web server;
- Windows Service loop.

Source docs:

- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`;
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`;
- `BLUEPRINT_KIOSK_RUNNER_ROLLBACK_AND_RECOVERY.md`.

Contracts touched:

- state contract;
- update status values.

Ports introduced:

- `IVersionStore`;
- `ICurrentPublisher`;
- `IStateStore`.

Adapters introduced:

- `FileSystemVersionStore`;
- `JunctionCurrentPublisher`;
- `JsonStateStore`.

Files allowed:

- core update use case;
- filesystem adapters;
- state store;
- tests.

Tests required:

- first install works;
- same version no-op;
- failed switch keeps old current;
- state updated durably;
- partial staging recovered.

Manual checks:

- junction behavior tested on Windows or fallback documented.

Acceptance gate:

- `versions/<version>` and `current` behavior matches contract.

### Stage 7. Embedded Web Server Slice

Goal:

- serve `current` through localhost Kestrel.

Scope:

- `IWebServerHost`;
- `KestrelStaticWebServerAdapter`;
- basePath;
- static root current;
- MIME types;
- SPA fallback;
- forbidden paths;
- path traversal protection;
- no directory listing;
- cache policy;
- version header.

Out of scope:

- service install;
- update loop scheduling.

Source docs:

- `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md`;
- `CONTRACT_KIOSK_RUNNER_CONFIG.md`;
- `CONTRACT_KIOSK_RUNNER_BUNDLE.md`.

Contracts touched:

- status only if needed for servedVersion integration.

Ports introduced:

- `IWebServerHost`.

Adapters introduced:

- `KestrelStaticWebServerAdapter`.

Files allowed:

- web server adapter;
- host wiring;
- integration tests.

Tests required:

- canonical URL serves `index.html`;
- forbidden paths blocked;
- path traversal blocked;
- directory listing disabled;
- MIME types correct;
- cache policy applied;
- `X-Kiosk-Showcase-Version` present.

Manual checks:

- browser opens `http://127.0.0.1:8787/kiosk/bolars/` from test bundle.

Acceptance gate:

- static server exposes no internal runner files.

### Stage 8. Health / Status Slice

Goal:

- expose diagnostics without secrets or business data.

Scope:

- `IHealthStatusProvider`;
- `/healthz`;
- `/runner/status`;
- degraded/unhealthy states;
- `servedVersion`.

Out of scope:

- business health;
- 1С bridge status.

Source docs:

- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`;
- `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md`;
- `SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`.

Contracts touched:

- state/status/health contracts.

Ports introduced:

- `IHealthStatusProvider`.

Adapters introduced:

- status adapter or application provider.

Files allowed:

- status provider;
- web server routes;
- tests.

Tests required:

- health ok;
- degraded/no_current;
- unhealthy/port_in_use;
- status has `currentVersion` and `servedVersion`;
- status exposes no secrets, no 1С data, no payment/fiscal data.

Manual checks:

- inspect status payload from local endpoint.

Acceptance gate:

- status is safe to give to admin diagnostics.

### Stage 9. Rollback And Recovery Slice

Goal:

- implement offline rollback and recovery modes.

Scope:

- `RollbackService`;
- `RecoveryService`;
- previous version restore;
- damaged state handling;
- missing previous version;
- partial staging cleanup.

Out of scope:

- downloading rollback from network;
- 1С sale recovery.

Source docs:

- `BLUEPRINT_KIOSK_RUNNER_ROLLBACK_AND_RECOVERY.md`;
- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`.

Contracts touched:

- rollback status/errors.

Ports introduced:

- reuse `IVersionStore`, `ICurrentPublisher`, `IStateStore`.

Adapters introduced:

- none unless recovery needs extra filesystem port methods.

Files allowed:

- core rollback/recovery services;
- CLI command;
- tests.

Tests required:

- rollback works without network;
- previousVersion restored;
- damaged state handled safely;
- missing previousVersion fails clearly;
- partial staging recovered.

Manual checks:

- run rollback after a two-version install in local temp root.

Acceptance gate:

- rollback never needs GitHub/registry.

### Stage 10. Windows Service Host Slice

Goal:

- run update loop and web server as Windows Service.

Scope:

- `WindowsServiceHostAdapter`;
- `service` mode;
- install/uninstall scripts;
- start/stop;
- graceful shutdown;
- update loop;
- no parallel update for same showcase.

Out of scope:

- MSI/exe installer;
- self-update.

Source docs:

- `BLUEPRINT_KIOSK_RUNNER_WINDOWS_SERVICE.md`;
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`;
- `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md`.

Contracts touched:

- none unless service status needs new code already approved.

Ports introduced:

- service host boundary if needed.

Adapters introduced:

- `WindowsServiceHostAdapter`.

Files allowed:

- service host;
- scripts;
- service tests/smoke docs.

Tests required:

- service starts;
- service stops gracefully;
- update loop works;
- parallel update lock works;
- logs under `rootDir/logs`;
- degraded states visible.

Manual checks:

- Windows service install/start/stop smoke.

Acceptance gate:

- service can run without mixing business logic into host shell.

### Stage 11. Packaging And First Install Slice

Goal:

- produce MVP runner artifact.

Scope:

- `KioskRunner-win-x64.zip`;
- `config.example.json`;
- `install-service.ps1`;
- `uninstall-service.ps1`;
- README;
- first install smoke.

Out of scope:

- MSI/exe installer;
- signed release unless future hardening is explicitly pulled in.

Source docs:

- `RUNBOOK_KIOSK_RUNNER_FIRST_INSTALL_WINDOWS.md`;
- `RUNBOOK_KIOSK_RUNNER_RELEASE_PUBLISHING.md`;
- `HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md`.

Contracts touched:

- config example only if contract gap found.

Ports introduced:

- none.

Adapters introduced:

- none.

Files allowed:

- packaging folder;
- scripts;
- README;
- release notes.

Tests required:

- clean install from zip;
- `update-once` works;
- canonical URL opens;
- service install works;
- first install runbook passes.

Manual checks:

- perform first install on Windows test host.

Acceptance gate:

- implementer can follow runbook without source checkout.

### Stage 12. Full MVP Test Matrix And Closeout

Goal:

- execute full MVP acceptance.

Scope:

- run `TEST_MATRIX_KIOSK_RUNNER_MVP.md`;
- produce closeout report;
- list failed/pending cases.

Out of scope:

- new feature work.

Source docs:

- `TEST_MATRIX_KIOSK_RUNNER_MVP.md`;
- all contracts/blueprints;
- PRD v0.3.

Contracts touched:

- none unless a failure exposes an accepted contract correction.

Ports introduced:

- none.

Adapters introduced:

- none.

Files allowed:

- tests;
- closeout report under `docs/reports/YYYY-MM-DD/`;
- narrow docs correction only with explicit note.

Tests required:

- all critical test matrix cases.

Manual checks:

- Windows service smoke;
- first install runbook smoke;
- browser/local URL smoke.

Acceptance gate:

- all critical tests pass;
- failed/pending documented;
- no PRD invariants broken;
- MVP closeout report produced.

## 8. Adapter Strategy

| Adapter | Port | Used by | Error model | Test strategy | Future replaceability |
| --- | --- | --- | --- | --- | --- |
| `JsonFileConfigProvider` | `IConfigProvider` | Config load use case. | `no_config`, `invalid_json`, validation errors. | Unit + temp-file adapter tests. | Replace with central config provider later. |
| `HttpManifestClient` | `IManifestClient` | Manifest fetch use case. | unavailable, non-JSON, invalid manifest, blocked. | Fake HTTP handler tests. | Replace with authenticated/signed registry client. |
| `HttpBundleDownloader` | `IBundleDownloader` | Bundle download use case. | download failed, timeout, invalid response. | Fake HTTP + temp download tests. | Replace with token/private registry downloader. |
| `Sha256HashVerifier` | `IHashVerifier` | Integrity use case. | hash mismatch, read failure. | Known file hash tests. | Replace/extend with signature verifier. |
| `SystemIoFileSystem` | `IFileSystem` | File adapters. | permission, path invalid, disk full where detectable. | Temp directory tests. | Replace with test filesystem/future abstraction. |
| `ZipArchiveExtractor` | `IZipExtractor` | Bundle extraction. | broken zip, zip-slip, extraction failure. | Crafted zip tests. | Replace if streaming extractor needed. |
| `FileSystemVersionStore` | `IVersionStore` | Publish version. | version exists invalid, write failure. | Temp directory integration tests. | Replace if storage layout changes. |
| `JunctionCurrentPublisher` | `ICurrentPublisher` | Current switch. | junction failure, old current restore failure. | Windows smoke + fallback tests. | Replace with pointer/copy strategy. |
| `JsonStateStore` | `IStateStore` | State read/write. | missing, invalid, write failure. | Durable write tests. | Replace with SQLite/registry/fleet state later. |
| `KestrelStaticWebServerAdapter` | `IWebServerHost` | Service/CLI host. | port in use, unsafe host, static serving error. | Web integration tests. | Replace with HttpSys or external proxy profile. |
| `WindowsServiceHostAdapter` | host boundary | Service mode. | install/start/stop/service failure. | Windows smoke tests. | Replace installer/service wrapper. |
| Logging adapter | `IRunnerLogger` | All use cases. | logging failure should not hide primary error. | Log output tests. | Replace with ETW/EventLog/central logs. |
| Clock adapter | `IClock` | Time stamps, intervals. | none/fixed clock in tests. | Deterministic unit tests. | Replace with scheduler/time provider. |

## 9. Testing Strategy

### 9.1 Unit Tests

Cover:

- contract validation;
- manifest validation;
- config validation;
- status sanitization;
- core use case decisions;
- no-op logic.

### 9.2 Adapter Tests

Cover:

- filesystem temp root;
- HTTP fake responses;
- zip-slip and broken zip;
- sha256 known hashes;
- state durable writes.

### 9.3 Integration Tests

Cover:

- manifest -> bundle -> staging -> versions -> current;
- failed update keeps old current;
- no-op same version;
- rollback.

### 9.4 Web Server Tests

Cover:

- canonical URL;
- MIME types;
- SPA fallback;
- forbidden paths;
- path traversal;
- cache headers;
- version header;
- status no secrets.

### 9.5 Windows Smoke Tests

Cover:

- junction current switch;
- service install/start/stop;
- permissions;
- port conflict.

### 9.6 Manual Runbook Tests

Run:

- first install runbook;
- release publishing dry run;
- handoff URL smoke.

### 9.7 Final Matrix

Execute `TEST_MATRIX_KIOSK_RUNNER_MVP.md`.

Rules:

- no transition to next slice without tests for current slice;
- if a test cannot be automated, add manual check and closeout note;
- critical security tests are mandatory: path traversal, forbidden paths, no secrets in status, no branch/main/dist, no business API.

## 10. Agent Autonomy Protocol

1. Take next slice only.
2. Read source docs listed for that slice.
3. Verify previous closeout.
4. Implement only slice scope.
5. Add tests for slice scope.
6. Run tests.
7. If gate passes, write closeout and move to next slice.
8. If gate fails, fix within slice.
9. If fix requires contract change, stop and write proposed canon decision.
10. If scope expands, stop.
11. If documents conflict, do not guess. Write conflict report.
12. Never add backend behavior, auth/private registry/self-update, or Apache requirement to satisfy a slice unless a new PRD/canon decision explicitly requires it.

## 11. Closeout Report Template

```text
Slice name:
Source docs used:
Files changed:
Contracts touched:
Ports added:
Adapters added:
Tests added:
Commands run:
Acceptance gate result:
Security checks:
PRD/Blueprint deviations:
Open questions:
Next recommended slice:
```

Closeout reports should go under:

```text
docs/reports/YYYY-MM-DD/
```

## 12. Canon Decision Log

Accepted for MVP:

- .NET 10 LTS.
- Dedicated runner repo GitHub Releases.
- Zip + PowerShell scripts.
- One Windows Service per showcase.
- Kestrel embedded static server.
- `127.0.0.1:8787`.
- `current` as junction to immutable `versions/<version>`.
- `servedVersion` + `X-Kiosk-Showcase-Version`.
- Local `config.json` per kiosk.
- JSON Lines logs.
- No auth/signing/self-update in MVP.

Future decisions:

- MSI installer.
- Private registry.
- Signed manifest.
- Signed bundle.
- Signed runner.
- Tenant/license binding.
- Central config.
- Multi-showcase service.
- Self-update.
- External listener.
- HTTPS localhost if required by target 1С environment.

## 13. Risk-Controlled Execution

| Risk | Mitigation in roadmap |
| --- | --- |
| Junction risk | Stage 6 requires Windows junction smoke or documented fallback. |
| Port conflict | Stage 7/8 require `port_in_use` unhealthy behavior; no silent port change. |
| Public manifest compromise | Security docs keep MVP trust explicit; signatures deferred but not forgotten. |
| Bundle secrets | Stage 5 and release checklist require forbidden file/secret checks. |
| Cache stale index | Stage 7 requires cache policy and version header. |
| Service account permissions | Stage 10/11 require service/runbook smoke. |
| Path traversal | Stage 7 has mandatory security tests. |
| State corruption | Stage 6/9 require durable writes and invalidState handling. |
| Runner mistaken for backend | Every slice stop conditions forbid business API; handoff reinforces boundary. |

## 14. Definition Of Done For Roadmap

Roadmap is ready when:

- it lets an implementation agent proceed autonomously;
- each slice is small and verifiable;
- each slice has contracts, ports, adapters, tests and gates;
- closeout protocol is defined;
- stop conditions are defined;
- canon decision log is present;
- risk mitigation is explicit;
- it does not contradict PRD v0.3;
- it does not return Apache as required dependency;
- it does not add 1С backend behavior;
- it does not add auth/self-update as MVP requirement;
- it does not start code implementation.
