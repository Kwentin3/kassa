# KioskRunner MVP Progress

Date: 2026-05-28

## Current State

Stage 12 is complete. KioskRunner MVP implementation is complete.

The earlier .NET SDK blocker has been resolved. The current machine now has `.NET SDK 10.0.300` installed in `C:\Program Files\dotnet\sdk`.

## Completed Stages

- Preflight: completed, blocker cleared.
- Stage 0. Architecture Skeleton And Project Boundaries: completed.
- Stage 1. Contracts Baseline: completed.
- Stage 2. Config Provider Slice: completed.
- Stage 3. Manifest Client Slice: completed.
- Stage 4. Bundle Download And SHA-256 Slice: completed.
- Stage 5. Bundle Extraction And Validation Slice: completed.
- Stage 6. Version Store And Current Publisher Slice: completed.
- Stage 7. Embedded Web Server Slice: completed.
- Stage 8. Health / Status Slice: completed.
- Stage 9. Rollback And Recovery Slice: completed.
- Stage 10. Windows Service Host Slice: completed.
- Stage 11. Packaging And First Install Slice: completed.
- Stage 12. Full MVP Test Matrix And Closeout: completed.

## Pending Stages

None.

## Failed / Pending Tests

- Stage 0: `dotnet build KioskRunner.slnx` passed.
- Stage 0: `dotnet test KioskRunner.slnx` passed, 9 tests passed.
- Stage 0: CLI help smoke passed.
- Stage 1: `dotnet build KioskRunner.slnx` passed.
- Stage 1: `dotnet test KioskRunner.slnx` passed, 28 tests passed.
- Stage 1: `KioskRunner.Contracts` infrastructure-reference scan returned no source matches.
- Stage 2: `dotnet build KioskRunner.slnx` passed.
- Stage 2: `dotnet test KioskRunner.slnx` passed, 34 tests passed.
- Stage 2: out-of-scope scan returned no source matches for HTTP, Kestrel, Windows Service, `git pull` or manual JSON behavior.
- Stage 3: `dotnet build KioskRunner.slnx` passed.
- Stage 3: `dotnet test KioskRunner.slnx` passed, 42 tests passed.
- Stage 3: out-of-scope scan returned no source matches for bundle download, filesystem update, zip, Kestrel, Windows Service, `git pull` or branch/main/dist behavior.
- Stage 4: `dotnet build KioskRunner.slnx` passed.
- Stage 4: `dotnet test KioskRunner.slnx` passed, 46 tests passed.
- Stage 4: out-of-scope scan returned no source matches for zip extraction or `current` switching in Stage 4 source paths.
- Stage 5: `dotnet build KioskRunner.slnx` passed.
- Stage 5: `dotnet test KioskRunner.slnx` passed, 52 tests passed.
- Stage 5: out-of-scope scan returned no source matches for version publish, `current` switch or junction behavior in Stage 5 source paths.
- Stage 6: `dotnet build KioskRunner.slnx` passed.
- Stage 6: focused storage/current tests passed, 5 tests passed.
- Stage 6: `dotnet test KioskRunner.slnx` passed, 57 tests passed.
- Stage 6: junction/reparse-point cleanup behavior exercised on Windows.
- Stage 7: `dotnet build KioskRunner.slnx` passed.
- Stage 7: `dotnet test tests/KioskRunner.Tests.Integration/KioskRunner.Tests.Integration.csproj` passed, 6 tests passed.
- Stage 7: `dotnet test KioskRunner.slnx` passed, 63 tests passed.
- Stage 7: web-server invariant scan confirmed no directory browser and no `0.0.0.0` listener in Stage 7 source paths.
- Stage 7: traversal, forbidden paths, MIME, cache, version header, and port conflict behaviors were exercised.
- Stage 8: `dotnet build KioskRunner.slnx` passed.
- Stage 8: focused health/status unit tests passed, 6 tests passed.
- Stage 8: focused Kestrel integration tests passed, 8 tests passed.
- Stage 8: `dotnet test KioskRunner.slnx` passed, 71 tests passed.
- Stage 8: status payload no-secret/no-business-data assertions passed.
- Stage 9: `dotnet build KioskRunner.slnx` passed.
- Stage 9: focused rollback/recovery tests passed, 6 tests passed.
- Stage 9: `dotnet test KioskRunner.slnx` passed, 77 tests passed.
- Stage 9: rollback CLI smoke via test passed with local config and no network dependency.
- Stage 10: `dotnet build KioskRunner.slnx` passed.
- Stage 10: focused update/service-host tests passed, 6 tests passed.
- Stage 10: `dotnet test KioskRunner.slnx` passed, 84 tests passed.
- Stage 10: service host start/stop, update loop, parallel update lock, logs and dynamic served-version header were exercised.
- Stage 11: self-contained `KioskRunner-win-x64.zip` created.
- Stage 11: clean install from zip smoke passed.
- Stage 11: `update-once`, `status`, foreground `service`, `/healthz`, and canonical URL smoke passed.
- Stage 11: Windows SCM install/start/serve/uninstall smoke passed with temporary service `KioskRunnerSmokeTest`.
- Stage 11: `dotnet test KioskRunner.slnx` passed, 84 tests passed.
- Stage 12: `dotnet --list-sdks` confirmed `.NET SDK 10.0.300`.
- Stage 12: `dotnet --info` confirmed win-x64 runtime and SDK selection.
- Stage 12: `dotnet test KioskRunner.slnx` passed, 84 tests passed.
- Stage 12: final invariant scans found only expected negative-test, validator-message and README explanatory matches.
- Stage 12: all T01-T30 matrix items marked pass in the closeout report.

## Manual Windows Smoke Pending

- None for the current Windows environment.

## Open Canon Decisions

None opened during preflight.

The existing canon decision remains active:

- target framework: .NET 10 LTS.

## Blockers

None.

## Next Action

No implementation stage remains. Future work requires a new canon decision or follow-up task.
