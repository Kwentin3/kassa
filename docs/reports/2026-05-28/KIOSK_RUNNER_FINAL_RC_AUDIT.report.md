# KioskRunner Final Release Candidate Audit

Date: 2026-05-28

Status: READY_FOR_FIELD_TRIAL

## Audit scope

Final independent RC audit for KioskRunner MVP against:

- `docs/integrations/1c-html-shell/PRD_KIOSK_RUNNER_NET_v0.3.md`
- `docs/integrations/1c-html-shell/kiosk-runner/ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `docs/integrations/1c-html-shell/kiosk-runner/IMPLEMENTATION_READINESS_KIOSK_RUNNER_MVP.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_CONFIG.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_MANIFEST.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_BUNDLE.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`
- `docs/integrations/1c-html-shell/kiosk-runner/TEST_MATRIX_KIOSK_RUNNER_MVP.md`

The audit covered source-of-truth conformity, architecture invariants, layering, clean workspace build/test, clean install from zip, sample manifest/bundle flows, static web server security, packaging, and documentation consistency.

## Working tree reference

- Branch: `mvp/self-checkout-web-ui`
- HEAD: `0258b8403ef4375e7972bd457919d9d739b85abd`
- RC state: working tree contains untracked KioskRunner source/docs/artifacts and audit fixes; no release commit hash exists yet for the RC content.

## Environment

- OS: Windows 10.0.17763, `win-x64`
- .NET SDK: `10.0.300`
- .NET Host: `10.0.8`
- Windows SCM smoke: executed locally and passed.
- Manual Windows smoke pending: none.

## Commands run

- `dotnet --info`
- `dotnet build KioskRunner.slnx`
- `dotnet test KioskRunner.slnx`
- Isolated clean workspace copy under `artifacts/kiosk-runner-rc-audit/clean-workspace-final`
- `dotnet build KioskRunner.slnx` from isolated workspace
- `dotnet test KioskRunner.slnx` from isolated workspace
- `dotnet publish src/KioskRunner.Host.Cli/KioskRunner.Host.Cli.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o artifacts/kiosk-runner/publish`
- `Compress-Archive ... artifacts/kiosk-runner/KioskRunner-win-x64.zip`
- Package smoke: `update-once`, `status`, foreground `service`, `/healthz`, `/runner/status`, canonical URL
- Windows SCM smoke: `install-service.ps1`, `Start-Service`, canonical URL check, `uninstall-service.ps1`
- Source scans for forbidden architecture strings and business/backend behavior
- Package secret scan for `.env`, tokens, private keys, and secret markers

Note: an early clean workspace run omitted `packaging/`, causing `ConfigExampleContainsNoSecretsAndIsValid` to fail because `packaging/config.example.json` was absent from the audit copy. The workspace copy was corrected and the clean test passed.

## Test results

- Main workspace `dotnet build KioskRunner.slnx`: passed, 0 warnings, 0 errors.
- Main workspace `dotnet test KioskRunner.slnx`: passed, 85 tests total.
  - Integration: 9 passed.
  - Unit: 76 passed.
- Clean workspace `dotnet build KioskRunner.slnx`: passed, 0 warnings, 0 errors.
- Clean workspace `dotnet test KioskRunner.slnx`: passed, 85 tests total.
- Sample manifest/bundle audit: passed.
- Static web server security audit: passed.
- Clean install from zip and Windows SCM smoke: passed.

## Package artifact

- Artifact: `artifacts/kiosk-runner/KioskRunner-win-x64.zip`
- Size: 44,658,700 bytes.
- Package contents:
  - `KioskRunner.exe`
  - `config.example.json`
  - `install-service.ps1`
  - `uninstall-service.ps1`
  - `README.md`

Packaging audit found no real `config.json`, `.env`, tokens, private keys, or business data in the zip. Secret scan hits were limited to README guidance explaining that secrets must not be shipped.

## Source-of-truth conformity

Result: passed.

- Runner reads `registryUrl` from local `config.json`.
- `registryUrl` is validated as a production manifest URL, not branch/main/dist/source layout.
- Manifest points to immutable `bundle.zip` and `sha256`.
- Bundle validation requires root `index.html` and blocks forbidden operational/secret-bearing files.
- State/status payloads contain runner/showcase diagnostics and no 1C business data.
- Embedded Kestrel server serves only `current` via localhost by default.
- Rollback works offline from locally stored previous version.
- Apache/Nginx are not required by implementation or package.

## Architecture invariants

Result: passed.

- `no git pull`: confirmed.
- `no branch/main/dist lookup`: confirmed; only negative validation tests/messages mention it.
- `no direct HTML download from source branch`: confirmed.
- `no backend 1C behavior`: confirmed.
- `no business API`: confirmed.
- `no cart ownership`: confirmed.
- `no sale/payment/fiscal state in runner`: confirmed.
- `no manual JSON upload/import`: confirmed.
- `no secrets in bundle/manifest/config.example.json`: confirmed.
- `registryUrl points to production manifest only`: enforced by config validation.
- `embedded web server serves only current`: confirmed after RC fix.
- `default listener is 127.0.0.1`: confirmed.
- `Apache/Nginx are optional only`: confirmed.

## Layering audit

Result: passed after RC fix.

Initial audit found release-blocking direct filesystem path usage in Core:

- `UpdateOnceService` built local download/staging paths with `Path.Combine`.
- `RollbackService` built version paths and validated Windows path characters directly.
- `RecoveryService` caught `IOException` directly.

Minimal fix applied:

- Added `ILocalStorageLayout` port.
- Added `WindowsLocalStorageLayout` adapter.
- Added `StorageOperationException` port-level exception for storage cleanup failures.
- Moved local storage path construction and Windows-safe version segment checks out of Core.
- Added a boundary test preventing Core source from using direct infrastructure APIs.

Post-fix scan found no direct `System.IO`, `Path`, `File`, `Directory`, `HttpClient`, `ZipArchive`, Kestrel, Windows Service, or `ProcessStartInfo` usage in Core source.

## Sample manifest/bundle audit

Result: passed.

Verified against package executable:

- Valid manifest accepted.
- Valid bundle installed.
- Same version returns no-op.
- HTML instead of manifest rejected.
- Wrong `showcaseId` rejected.
- Non-production status rejected.
- Invalid SHA-256 rejected.
- Bundle without `index.html` rejected.
- Bundle with forbidden `.env` rejected.
- Failed update keeps old `current`.
- Successful update installs new version.
- Rollback works offline.

## Static web server security

Result: passed after RC fix.

Initial audit found release-blocking behavior: forbidden operational paths under the configured `basePath` fell through to SPA fallback and returned `index.html` with HTTP 200.

Minimal fix applied:

- Forbidden path checks now evaluate both root paths and paths relative to configured `basePath`.
- Integration test now covers `/downloads`, `/versions`, `/logs`, `/state.json`, and `/config.json` under `/kiosk/bolars/`.

Final verification:

- Canonical URL serves `index.html`.
- `/healthz` returns OK.
- `/runner/status` returns current/served version.
- Directory listing is disabled.
- Path traversal is blocked.
- `downloads`, `versions`, `logs`, `state.json`, and `config.json` are not served.
- `index.html` has no-store cache policy.
- Assets have immutable cache policy.
- `X-Kiosk-Showcase-Version` is present.
- Status exposes no secrets and no business/cart/payment/fiscal data.

## Clean install smoke

Result: passed.

Verified from fresh extraction of `KioskRunner-win-x64.zip`:

- Extract zip.
- Copy `config.example.json` to `config.json`.
- Patch test `registryUrl`, `rootDir`, and `webServer.port`.
- Run `KioskRunner.exe update-once`.
- Run `KioskRunner.exe status`.
- Start foreground `KioskRunner.exe service`.
- Verify canonical URL, `/healthz`, and `/runner/status`.
- Install temporary Windows service `KioskRunnerRcAuditFinal`.
- Start service.
- Verify canonical URL served by Windows SCM service.
- Stop/uninstall service.

## Documentation fixes

- Updated stale preflight wording in `docs/reports/2026-05-28/KIOSK_RUNNER_PREFLIGHT.report.md`: the earlier .NET 10 SDK blocker is now resolved, and Windows checks are possible in this environment.

## RC changelog

- Fixed layering blocker by moving local path layout/version segment validation from Core to `ILocalStorageLayout` and `WindowsLocalStorageLayout`.
- Added `StorageOperationException` as a port-level storage cleanup failure boundary.
- Made `StaticBundleValidator` return structured validation for missing bundle root instead of letting directory enumeration throw.
- Fixed static web server forbidden path handling under configured `basePath`.
- Added tests for Core infrastructure API boundaries and forbidden web paths under `/kiosk/bolars/`.
- Rebuilt `artifacts/kiosk-runner/KioskRunner-win-x64.zip` from the fixed code.

## Known limitations

- RC content is not committed; the audit references HEAD plus current working tree files.
- MSI/exe installer is future work; MVP package is zip plus PowerShell scripts.
- Private registry, auth, signed manifest, signed bundle, signed runner, tenant binding, and self-update remain future hardening.
- `install`, `uninstall`, `start`, and `stop` are listed CLI commands, but MVP operational install/uninstall is delivered through PowerShell scripts. This matches the accepted MVP packaging path and is not release-blocking.

## Release blockers

None remaining.

## Release recommendation

READY_FOR_FIELD_TRIAL

The KioskRunner MVP release candidate is suitable for test field operation with the accepted MVP constraints: trusted public/no-auth registry URL, SHA-256 bundle integrity, no secrets in public artifacts, localhost-only listener by default, and no 1C backend/business ownership inside the runner.
