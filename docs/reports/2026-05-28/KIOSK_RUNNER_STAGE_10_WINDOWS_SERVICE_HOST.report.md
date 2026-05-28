# KioskRunner Stage 10 Closeout: Windows Service Host

Date: 2026-05-28

## Slice name

Stage 10. Windows Service Host Slice

## Source docs used

- `ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `PRD_KIOSK_RUNNER_NET_v0.3.md`
- `BLUEPRINT_KIOSK_RUNNER_WINDOWS_SERVICE.md`
- `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`
- `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md`
- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`
- `TEST_MATRIX_KIOSK_RUNNER_MVP.md`

## Files changed

- `src/KioskRunner.Contracts/Common/RunnerDefaults.cs`
- `src/KioskRunner.Ports/Logging/IRunnerLogger.cs`
- `src/KioskRunner.Core/Logging/NoopRunnerLogger.cs`
- `src/KioskRunner.Core/Status/HealthStatusProvider.cs`
- `src/KioskRunner.Core/Update/UpdateOnceOptions.cs`
- `src/KioskRunner.Core/Update/UpdateOnceResult.cs`
- `src/KioskRunner.Core/Update/UpdateOnceService.cs`
- `src/KioskRunner.Adapters.FileSystem/Logging/JsonLinesRunnerLogger.cs`
- `src/KioskRunner.Adapters.WebServer/KestrelStaticWebServerAdapter.cs`
- `src/KioskRunner.Host.Service/WindowsServiceHostOptions.cs`
- `src/KioskRunner.Host.Service/WindowsServiceHostStartResult.cs`
- `src/KioskRunner.Host.Service/WindowsServiceHostAdapter.cs`
- `src/KioskRunner.Host.Cli/KioskRunner.Host.Cli.csproj`
- `src/KioskRunner.Host.Cli/CliApplication.cs`
- `src/KioskRunner.Host.Cli/KioskRunnerWorker.cs`
- `tests/KioskRunner.Tests.Unit/UpdateOnceServiceTests.cs`
- `tests/KioskRunner.Tests.Unit/WindowsServiceHostAdapterTests.cs`
- `tests/KioskRunner.Tests.Integration/KestrelStaticWebServerAdapterTests.cs`

## Contracts touched

- Added `RunnerDefaults.Version = 0.3.0`.
- Added structured logging port contract.
- No state/status/business contract fields were added.

## Ports added

- `IRunnerLogger`

## Adapters added

- `JsonLinesRunnerLogger`
- `WindowsServiceHostAdapter`

## Tests added

- `UpdateOnceServiceTests.SuccessfulUpdateInstallsCurrentAndWritesLogs`
- `UpdateOnceServiceTests.SameVersionIsNoopBeforeBundleDownload`
- `UpdateOnceServiceTests.HashMismatchKeepsOldCurrent`
- `WindowsServiceHostAdapterTests.ServiceStartsWebServerRunsUpdateLoopAndStopsGracefully`
- `WindowsServiceHostAdapterTests.ParallelUpdateForSameShowcaseIsSkipped`
- `WindowsServiceHostAdapterTests.PortFailureIsReturnedAsUnhealthyStartResult`
- `KestrelStaticWebServerAdapterTests.StaticVersionHeaderUsesCurrentStatusProviderValue`

## Commands run

- `dotnet add src/KioskRunner.Host.Cli/KioskRunner.Host.Cli.csproj package Microsoft.Extensions.Hosting --version 10.0.0`
- `dotnet add src/KioskRunner.Host.Cli/KioskRunner.Host.Cli.csproj package Microsoft.Extensions.Hosting.WindowsServices --version 10.0.0`
- `dotnet build KioskRunner.slnx`
- `dotnet test tests/KioskRunner.Tests.Unit/KioskRunner.Tests.Unit.csproj --filter "UpdateOnceServiceTests|WindowsServiceHostAdapterTests"`
- `dotnet test KioskRunner.slnx`
- `rg -n "git pull|branch/main|main/dist|manual JSON|0\\.0\\.0\\.0|UseDirectoryBrowser|cart|payment|fiscal|KKT|эквайр" src/KioskRunner.Contracts src/KioskRunner.Ports src/KioskRunner.Core src/KioskRunner.Adapters.FileSystem src/KioskRunner.Adapters.Http src/KioskRunner.Adapters.Zip src/KioskRunner.Adapters.WebServer src/KioskRunner.Host.Cli src/KioskRunner.Host.Service tests/KioskRunner.Tests.Unit tests/KioskRunner.Tests.Integration packaging -S --glob '!**/obj/**' --glob '!**/bin/**'`

## Acceptance gate result

Passed for code-level Stage 10.

- `dotnet build KioskRunner.slnx` passed with 0 warnings and 0 errors.
- Focused Stage 10 tests passed, 6 tests passed.
- `dotnet test KioskRunner.slnx` passed, 84 tests passed.
- `update-once` application service performs manifest, download, hash, unzip, validation, publish and state update through ports/adapters.
- Same-version manifest returns `noop` before bundle download.
- Failed hash keeps old `current`.
- Service host starts web server, runs update loop, stops gracefully and prevents parallel update for the same showcase.
- Logs are written under `rootDir/logs/kiosk-runner.jsonl`.
- Kestrel version header can reflect the current status provider value instead of staying fixed at service start.

## Security checks

- No Git branch lookup, `git pull`, direct `main/dist` download or manual JSON upload path was introduced.
- No backend 1C behavior, business API, cart ownership, payment, fiscal, scanner or marking behavior was introduced.
- Service host is a shell around application services and adapters; it does not own business logic.
- The invariant scan produced expected matches only in negative tests and validator messages.
- Host package references are explicit in `KioskRunner.Host.Cli.csproj`; no workspace-only dependency was introduced.

## PRD/Blueprint deviations

None.

## Open questions

- Real Windows SCM install/start/stop smoke remains pending until Stage 11 packaging scripts exist.

## Next recommended slice

Stage 11. Packaging And First Install Slice.
