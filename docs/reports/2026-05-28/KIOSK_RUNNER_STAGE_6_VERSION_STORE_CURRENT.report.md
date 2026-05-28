# KioskRunner Stage 6 Closeout: Version Store And Current Publisher Slice

Date: 2026-05-28

## Slice name

Stage 6. Version Store And Current Publisher Slice.

## Source docs used

- `docs/integrations/1c-html-shell/kiosk-runner/ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`
- `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`
- `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_KIOSK_RUNNER_ROLLBACK_AND_RECOVERY.md`
- `docs/integrations/1c-html-shell/kiosk-runner/IMPLEMENTATION_READINESS_KIOSK_RUNNER_MVP.md`

## Files changed

- `src/KioskRunner.Contracts/Validation/KioskRunnerErrorCodes.cs`
- `src/KioskRunner.Ports/Storage/`
- `src/KioskRunner.Ports/Time/`
- `src/KioskRunner.Core/Update/`
- `src/KioskRunner.Adapters.FileSystem/Storage/`
- `src/KioskRunner.Adapters.FileSystem/Time/`
- `tests/KioskRunner.Tests.Unit/`

## Contracts touched

Added storage/switch/state error codes:

- `version_publish_failed`
- `current_switch_failed`
- `state_read_failed`
- `state_write_failed`

## Ports added

- `IVersionStore`
- `ICurrentPublisher`
- `IStateStore`
- `IClock`
- storage result contracts

## Adapters added

- `FileSystemVersionStore`
- `JunctionCurrentPublisher`
- `JsonStateStore`
- `SystemClock`

## Tests added

- First install publishes `versions/<version>`, switches `current`, and writes `state.json`.
- Same version returns no-op and does not require staging.
- Failed switch keeps old current.
- State store writes with temp + replace and leaves no temp file.
- Partial staging cleanup does not delete `current` or valid versions.

## Commands run

```powershell
dotnet build KioskRunner.slnx
rg -n "Kestrel|WindowsService|HttpClient|git pull|manual JSON|cart|payment|fiscal" src/KioskRunner.Core src/KioskRunner.Adapters.FileSystem src/KioskRunner.Ports -S --glob "!**/obj/**" --glob "!**/bin/**"
dotnet test tests/KioskRunner.Tests.Unit/KioskRunner.Tests.Unit.csproj --filter VersionStoreAndCurrentPublisherTests
dotnet test KioskRunner.slnx
```

## Acceptance gate result

Passed.

Evidence:

- `dotnet build KioskRunner.slnx` passed with 0 warnings and 0 errors.
- Focused Stage 6 tests passed: 5 tests passed, 0 failed.
- Full unit suite passed: 57 tests passed, 0 failed, 0 skipped.
- Out-of-scope scan returned no source matches for Kestrel, Windows Service, HttpClient in core/storage, `git pull`, manual JSON or business-domain terms.

## Security checks

- Version names are constrained to safe path segments.
- `current` switch never exposes `_staging`.
- Failed switch with missing target version leaves old `current` readable.
- Stale `_staging` cleanup does not delete `current` or `versions`.
- `state.json` writes through temp + replace.
- No web server, Windows Service loop, backend behavior, business API or 1С state was introduced.

## Junction behavior

The Windows test environment exercised reparse-point behavior: initial cleanup failed until junction deletion was handled as link deletion instead of recursive directory deletion.

`JunctionCurrentPublisher` now:

- creates `current.next` as a Windows junction when available;
- falls back to copy-to-current only if junction creation fails;
- removes existing reparse-point `current` as a link, not as a normal recursive directory.

## PRD/Blueprint deviations

No deviation.

Fallback copy mode is implemented only as the documented deployment fallback for environments where junction creation is blocked.

## Open questions

None for Stage 6.

## Next recommended slice

Stage 7. Embedded Web Server Slice.
