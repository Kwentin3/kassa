# KioskRunner Stage 12 Closeout: Full MVP Test Matrix

Date: 2026-05-28

## Slice name

Stage 12. Full MVP Test Matrix And Closeout

## Source docs used

- `ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `PRD_KIOSK_RUNNER_NET_v0.3.md`
- `TEST_MATRIX_KIOSK_RUNNER_MVP.md`
- all KioskRunner contracts, blueprints, runbooks and security docs

## Files changed

- `docs/reports/2026-05-28/KIOSK_RUNNER_STAGE_12_FULL_MVP_TEST_MATRIX.report.md`
- `docs/reports/2026-05-28/KIOSK_RUNNER_MVP_PROGRESS.md`

## Contracts touched

None.

## Ports added

None.

## Adapters added

None.

## Tests added

None. This slice executed and closed the existing test matrix.

## Commands run

- `dotnet --list-sdks`
- `dotnet --info`
- `dotnet test KioskRunner.slnx`
- package smoke from `artifacts/kiosk-runner/KioskRunner-win-x64.zip`
- foreground `KioskRunner.exe service --config <smoke config>` smoke
- Windows SCM install/start/serve/uninstall smoke with `KioskRunnerSmokeTest`
- `rg -n "git pull|branch/main|main/dist|manual JSON|UseDirectoryBrowser|0\\.0\\.0\\.0" ...`
- `rg -n "cart|payment|fiscal|KKT|ККТ|эквайр|sale|receipt|scanner|marking" ...`
- `rg -n "token|password|secret|\\.env|\\.pem|\\.key" artifacts/kiosk-runner/package packaging -S`

## Acceptance gate result

Passed.

- `.NET SDK 10.0.300` is installed and selected by `global.json`.
- `dotnet test KioskRunner.slnx` passed, 84 tests passed.
- `KioskRunner-win-x64.zip` exists and was validated by clean install smoke.
- `update-once` works against a local production manifest and immutable bundle zip.
- Foreground `service` mode serves the canonical localhost URL.
- Windows SCM install/start/serve/uninstall smoke passed.
- `/healthz`, `/runner/status`, static serving, rollback and failure-preserving-current behavior are covered.
- No PRD invariant violation was found in source scans.

## Test matrix result

| ID | Result | Evidence |
| --- | --- | --- |
| T01 No `config.json` | Pass | `JsonFileConfigProviderTests.MissingConfigReturnsNoConfig`; health contract covers `degraded/no_config`. |
| T02 Invalid config JSON | Pass | `JsonFileConfigProviderTests.InvalidJsonReturnsStructuredError`. |
| T03 Missing `registryUrl` | Pass | `JsonFileConfigProviderTests.MissingRegistryUrlIsValidationError`; no manifest client invoked. |
| T04 Manifest unavailable | Pass | `HttpManifestClientTests` unavailable/HTTP failure path; update lifecycle saves failed state and keeps current. |
| T05 Invalid manifest JSON | Pass | `HttpManifestClientTests` invalid JSON rejection. |
| T06 HTML instead of manifest | Pass | `HttpManifestClientTests.HtmlResponseIsRejected`. |
| T07 Wrong `showcaseId` | Pass | `HttpManifestClientTests.WrongShowcaseIdRejected`; manifest contract tests. |
| T08 Non-production status/channel | Pass | `HttpManifestClientTests.NonProductionRejected`; contract validator. |
| T09 `minRunnerVersion` too high | Pass | `HttpManifestClientTests.MinRunnerVersionTooHighReturnsRunnerUpdateRequired`. |
| T10 Bundle unavailable | Pass | `BundleDownloadAndHashTests.DownloadFailureReturnsStructuredError`; update lifecycle failure handling. |
| T11 SHA-256 mismatch | Pass | `BundleDownloadAndHashTests.WrongHashRejected`; `UpdateOnceServiceTests.HashMismatchKeepsOldCurrent`. |
| T12 Broken zip | Pass | `BundleExtractionAndValidationTests.BrokenZipRejectedAndStagingCleaned`. |
| T13 Missing root `index.html` | Pass | `BundleExtractionAndValidationTests.MissingIndexHtmlRejected`. |
| T14 Successful first install | Pass | `UpdateOnceServiceTests.SuccessfulUpdateInstallsCurrentAndWritesLogs`; package smoke. |
| T15 No-op same version | Pass | `UpdateOnceServiceTests.SameVersionIsNoopBeforeBundleDownload`; version publish no-op tests. |
| T16 Successful update | Pass | `UpdateOnceServiceTests.SuccessfulUpdateInstallsCurrentAndWritesLogs`; state previous/current behavior covered by version publish tests. |
| T17 Failed update keeps old current | Pass | `UpdateOnceServiceTests.HashMismatchKeepsOldCurrent`; `VersionStoreAndCurrentPublisherTests.FailedSwitchKeepsOldCurrent`. |
| T18 Rollback | Pass | `RollbackAndRecoveryTests.RollbackRestoresPreviousVersionWithoutNetwork`; CLI rollback smoke test. |
| T19 Port in use | Pass | `KestrelStaticWebServerAdapterTests.PortConflictReturnsPortInUse`; service start failure test. |
| T20 Path traversal attempt | Pass | `KestrelStaticWebServerAdapterTests.PathTraversalIsBlocked`. |
| T21 Forbidden `/downloads` | Pass | `KestrelStaticWebServerAdapterTests.ForbiddenPathsAreBlocked`; forbidden static paths implementation. |
| T22 Forbidden `/versions` | Pass | Forbidden path implementation and invariant scan. |
| T23 Forbidden `/logs` | Pass | Forbidden path implementation and invariant scan. |
| T24 Forbidden `/state.json` | Pass | Forbidden path implementation and invariant scan. |
| T25 Forbidden `/config.json` | Pass | Forbidden path implementation and invariant scan. |
| T26 `index.html` cache | Pass | `KestrelStaticWebServerAdapterTests.CanonicalBasePathServesIndexWithVersionHeaderAndNoStore`. |
| T27 Asset cache | Pass | `KestrelStaticWebServerAdapterTests.AssetGetsMimeTypeCachePolicyAndVersionHeader`. |
| T28 Status endpoint no secrets | Pass | `StatusPayloadDoesNotExposeSecretsOrBusinessDataFields`; Kestrel status endpoint integration test. |
| T29 Public/no-auth artifacts | Pass | package/public manifest smoke; secrets scan found only explanatory README text. |
| T30 Runner without 1C | Pass | package foreground service smoke served static page; source scans found no backend/business API behavior. |

## Security checks

- No `git pull`, branch/main/dist source lookup, direct source HTML download or manual JSON upload behavior was introduced.
- Runner downloads only configured production manifest and manifest-declared bundle URL.
- Static serving remains localhost by default and blocks path traversal and service folders.
- Status payload and package contain no secrets, no 1C business data, no payment/fiscal data.
- Apache/Nginx were not added as required dependencies.
- Auth/private registry/signing/self-update remain future hardening only.

## PRD/Blueprint deviations

None.

## Open questions

- MSI/exe installer, signed runner, signed manifest/bundle, private registry/auth, tenant binding, central config and self-update remain future decisions.

## MVP Definition of Done

Done.

- All roadmap stages completed.
- All critical test matrix items passed.
- Package artifact created.
- First install runbook validated by smoke.
- Canonical URL works.
- `/healthz` and `/runner/status` work.
- Rollback works without network.
- Failed update keeps old current.
- Windows service lifecycle works on the current Windows environment.
