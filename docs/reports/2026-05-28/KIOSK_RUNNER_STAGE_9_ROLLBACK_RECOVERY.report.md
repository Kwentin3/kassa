# KioskRunner Stage 9 Closeout: Rollback And Recovery

Date: 2026-05-28

## Slice name

Stage 9. Rollback And Recovery Slice

## Source docs used

- `ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `PRD_KIOSK_RUNNER_NET_v0.3.md`
- `BLUEPRINT_KIOSK_RUNNER_ROLLBACK_AND_RECOVERY.md`
- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`
- `TEST_MATRIX_KIOSK_RUNNER_MVP.md`

## Files changed

- `src/KioskRunner.Contracts/Validation/KioskRunnerErrorCodes.cs`
- `src/KioskRunner.Core/Rollback/RollbackRequest.cs`
- `src/KioskRunner.Core/Rollback/RollbackResult.cs`
- `src/KioskRunner.Core/Rollback/RollbackService.cs`
- `src/KioskRunner.Core/Rollback/RecoveryResult.cs`
- `src/KioskRunner.Core/Rollback/RecoveryService.cs`
- `src/KioskRunner.Host.Cli/CliApplication.cs`
- `src/KioskRunner.Host.Cli/Program.cs`
- `tests/KioskRunner.Tests.Unit/RollbackAndRecoveryTests.cs`

## Contracts touched

- Added rollback/recovery error codes:
  - `rollback_previous_missing`
  - `rollback_previous_invalid`
  - `recovery_cleanup_failed`

## Ports added

None.

Rollback reuses `IStateStore`, `IBundleValidator`, `ICurrentPublisher`, `IClock`; recovery reuses `IVersionStore`.

## Adapters added

None.

The CLI wires existing file-system adapters for the `rollback` command.

## Tests added

- `RollbackAndRecoveryTests.RollbackRestoresPreviousVersionWithoutNetwork`
- `RollbackAndRecoveryTests.MissingPreviousVersionFailsClearlyAndKeepsCurrent`
- `RollbackAndRecoveryTests.DamagedStateIsHandledWithoutSwitchingCurrent`
- `RollbackAndRecoveryTests.InvalidPreviousBundleFailsBeforeCurrentSwitch`
- `RollbackAndRecoveryTests.PartialStagingRecoveryDoesNotDeleteCurrentOrVersions`
- `RollbackAndRecoveryTests.RollbackCliCommandUsesLocalConfigAndRestoresPreviousVersion`

## Commands run

- `dotnet build KioskRunner.slnx`
- `dotnet test tests/KioskRunner.Tests.Unit/KioskRunner.Tests.Unit.csproj --filter RollbackAndRecoveryTests`
- `dotnet test KioskRunner.slnx`
- `rg -n "HttpClient|IManifestClient|IBundleDownloader|registryUrl|git pull|main/dist|branch/main|payment|fiscal|cart" src/KioskRunner.Core/Rollback src/KioskRunner.Host.Cli tests/KioskRunner.Tests.Unit/RollbackAndRecoveryTests.cs -S --glob '!**/obj/**' --glob '!**/bin/**'`

## Acceptance gate result

Passed.

- `dotnet build KioskRunner.slnx` passed with 0 warnings and 0 errors.
- Focused rollback/recovery tests passed, 6 tests passed.
- `dotnet test KioskRunner.slnx` passed, 77 tests passed.
- Rollback restores `previousVersion` from local `versions/<version>` without network dependencies.
- Missing `previousVersion` fails clearly and keeps current intact.
- Damaged `state.json` returns `invalidState` and does not switch current.
- Invalid previous bundle fails before current switch.
- Partial staging cleanup does not delete valid `current` or `versions`.
- CLI `rollback --config <path>` works through local config.

## Security checks

- Rollback does not use GitHub, registry, manifest client or bundle downloader.
- Rollback does not add 1C backend, business API, cart, sale, payment, fiscal, scanner or marking behavior.
- Recovery cleanup only delegates `_staging` cleanup through `IVersionStore`; it does not delete `current` or valid `versions`.
- The invariant scan found one expected `registryUrl` occurrence in a config fixture for CLI rollback; no runtime rollback HTTP dependency was introduced.

## PRD/Blueprint deviations

None.

## Open questions

`currentSha256` after rollback is set to `null` because MVP state does not persist per-version SHA history. This keeps state honest and can be improved later with a local version metadata contract.

## Next recommended slice

Stage 10. Windows Service Host Slice.
