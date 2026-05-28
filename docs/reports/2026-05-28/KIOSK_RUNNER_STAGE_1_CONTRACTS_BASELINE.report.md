# KioskRunner Stage 1 Closeout: Contracts Baseline

Date: 2026-05-28

## Slice name

Stage 1. Contracts Baseline.

## Source docs used

- `docs/integrations/1c-html-shell/kiosk-runner/ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_CONFIG.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_MANIFEST.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`

## Files changed

- `src/KioskRunner.Contracts/`
- `tests/KioskRunner.Tests.Unit/`

## Contracts touched

Added baseline contract models and validators:

- `RunnerConfig`
- `WebServerConfig`
- `ProductionManifest`
- `ManifestValidationContext`
- `KioskRunnerState`
- `RunnerStatusPayload`
- `HealthPayload`
- status/health/update/web-server value constants
- structured `ContractValidationResult`
- structured `ContractValidationIssue`
- `KioskRunnerErrorCodes`

## Ports added

None.

## Adapters added

None.

## Tests added

- Config contract validation tests.
- Manifest contract validation tests.
- State/status contract validation tests.
- Existing Stage 0 boundary tests still run.

## Commands run

```powershell
dotnet build KioskRunner.slnx
rg -n "HttpClient|File\.|Directory\.|ZipArchive|Kestrel|WindowsService|ServiceBase" src/KioskRunner.Contracts -S --glob "!**/obj/**" --glob "!**/bin/**"
dotnet test KioskRunner.slnx
```

## Acceptance gate result

Passed.

Evidence:

- `dotnet build KioskRunner.slnx` passed with 0 warnings and 0 errors.
- `dotnet test KioskRunner.slnx` passed: 28 tests passed, 0 failed, 0 skipped.
- Infrastructure-reference scan in `KioskRunner.Contracts` returned no source matches.

## Security checks

- Config validation rejects obvious branch/main/dist registry URLs.
- Config validation rejects non-loopback listener host, including `0.0.0.0`.
- Directory listing is rejected.
- Static root escape is rejected.
- Manifest validation requires production status, `bundle.zip` URL shape, SHA-256 shape and compatible bridge contract.
- Status payload model does not include registry URL, secrets, cart, payment or fiscal fields.

## PRD/Blueprint deviations

No deviation.

Stage 1 stayed inside contracts and unit tests. It did not add file IO, HTTP, zip extraction, Kestrel, Windows Service APIs or update lifecycle implementation.

## Open questions

None for Stage 1.

## Next recommended slice

Stage 2. Config Provider Slice.
