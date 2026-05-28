# KioskRunner Stage 8 Closeout: Health / Status

Date: 2026-05-28

## Slice name

Stage 8. Health / Status Slice

## Source docs used

- `ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `PRD_KIOSK_RUNNER_NET_v0.3.md`
- `IMPLEMENTATION_READINESS_KIOSK_RUNNER_MVP.md`
- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`
- `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md`
- `SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`
- `TEST_MATRIX_KIOSK_RUNNER_MVP.md`

## Files changed

- `src/KioskRunner.Ports/Status/IHealthStatusProvider.cs`
- `src/KioskRunner.Ports/WebServer/WebServerStartOptions.cs`
- `src/KioskRunner.Core/Status/WebServerRuntimeSnapshot.cs`
- `src/KioskRunner.Core/Status/HealthStatusProviderOptions.cs`
- `src/KioskRunner.Core/Status/HealthStatusProvider.cs`
- `src/KioskRunner.Adapters.WebServer/KestrelStaticWebServerAdapter.cs`
- `tests/KioskRunner.Tests.Unit/HealthStatusProviderTests.cs`
- `tests/KioskRunner.Tests.Integration/KestrelStaticWebServerAdapterTests.cs`

## Contracts touched

- State/status contract model was reused without adding business fields.
- `WebServerStartOptions` now accepts optional `IHealthStatusProvider` so Kestrel can serve dynamic diagnostics through a port.

## Ports added

- `IHealthStatusProvider`

## Adapters added

None.

The existing `KestrelStaticWebServerAdapter` now consumes the health/status port for `/healthz` and `/runner/status`.

## Tests added

- `HealthStatusProviderTests.CurrentVersionAndListeningServerProduceOkStatus`
- `HealthStatusProviderTests.MissingCurrentIsDegradedNoCurrent`
- `HealthStatusProviderTests.PortFailureIsUnhealthyPortInUse`
- `HealthStatusProviderTests.InvalidStateIsUnhealthyInvalidState`
- `HealthStatusProviderTests.MissingConfigIsDegradedNoConfig`
- `HealthStatusProviderTests.StatusPayloadRedactsLastErrorSecretsAndHasNoBusinessFields`
- `KestrelStaticWebServerAdapterTests.StatusEndpointUsesProviderAndExposesNoSecretsOrBusinessData`
- `KestrelStaticWebServerAdapterTests.HealthEndpointReturnsServiceUnavailableForDegradedState`

## Commands run

- `dotnet build KioskRunner.slnx`
- `dotnet test tests/KioskRunner.Tests.Unit/KioskRunner.Tests.Unit.csproj --filter HealthStatusProviderTests`
- `dotnet test tests/KioskRunner.Tests.Integration/KioskRunner.Tests.Integration.csproj --filter KestrelStaticWebServerAdapterTests`
- `dotnet test KioskRunner.slnx`
- `rg -n "git pull|branch/main|main/dist|manual JSON|0\\.0\\.0\\.0|UseDirectoryBrowser" src/KioskRunner.Contracts src/KioskRunner.Ports src/KioskRunner.Core src/KioskRunner.Adapters.FileSystem src/KioskRunner.Adapters.Http src/KioskRunner.Adapters.Zip src/KioskRunner.Adapters.WebServer src/KioskRunner.Host.Cli src/KioskRunner.Host.Service tests/KioskRunner.Tests.Unit tests/KioskRunner.Tests.Integration packaging -S --glob '!**/obj/**' --glob '!**/bin/**'`
- `rg -n "registryUrl|token|password|secret|cart|payment|fiscal" src/KioskRunner.Core src/KioskRunner.Adapters.WebServer tests/KioskRunner.Tests.Unit tests/KioskRunner.Tests.Integration packaging -S --glob '!**/obj/**' --glob '!**/bin/**'`

## Acceptance gate result

Passed.

- `dotnet build KioskRunner.slnx` passed with 0 warnings and 0 errors.
- Focused health/status unit tests passed, 6 tests passed.
- Focused Kestrel integration tests passed, 8 tests passed.
- `dotnet test KioskRunner.slnx` passed, 71 tests passed.
- `/healthz` returns `200` for `ok` and `503` for degraded health.
- `/runner/status` includes `currentVersion` and `servedVersion`.
- Status payload exposes no registry URL, tokens, cart, payment or fiscal data.
- `lastError` is sanitized before status exposure.

## Security checks

- No 1C business API, cart ownership, payment, fiscal, scanner or marking behavior was introduced.
- `/runner/status` is diagnostic only and does not expose secrets or business data.
- Health/status endpoints use `Cache-Control: no-store`.
- The invariant scan found only expected matches in negative tests, config examples, validator messages and sanitizer code.

## PRD/Blueprint deviations

None.

## Open questions

None opened in this slice.

## Next recommended slice

Stage 9. Rollback And Recovery Slice.
