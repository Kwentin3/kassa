using KioskRunner.Contracts.State;
using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Bundles;
using KioskRunner.Ports.Storage;
using KioskRunner.Ports.Time;

namespace KioskRunner.Core.Rollback;

public sealed class RollbackService(
    IStateStore stateStore,
    IBundleValidator bundleValidator,
    ICurrentPublisher currentPublisher,
    ILocalStorageLayout storageLayout,
    IClock clock)
{
    public async Task<RollbackResult> RollbackAsync(RollbackRequest request, CancellationToken cancellationToken = default)
    {
        var stateLoad = await stateStore.LoadAsync(request.RootDir, cancellationToken).ConfigureAwait(false);
        if (!stateLoad.IsValid)
        {
            return new RollbackResult(UpdateStatusValues.InvalidState, null, stateLoad.Validation);
        }

        var oldState = stateLoad.State ?? new KioskRunnerState();
        if (string.IsNullOrWhiteSpace(oldState.PreviousVersion) || !storageLayout.IsSafeVersionSegment(oldState.PreviousVersion))
        {
            return await SaveFailureAsync(
                request.RootDir,
                oldState,
                KioskRunnerErrorCodes.RollbackPreviousMissing,
                "$.previousVersion",
                "previousVersion is missing or unsafe.",
                cancellationToken).ConfigureAwait(false);
        }

        var previousVersion = oldState.PreviousVersion;
        var previousRoot = storageLayout.VersionDirectory(request.RootDir, previousVersion);
        var bundle = await bundleValidator.ValidateAsync(previousRoot, cancellationToken).ConfigureAwait(false);
        var validation = bundle.Validation;
        if (!validation.IsValid)
        {
            return await SaveFailureAsync(
                request.RootDir,
                oldState,
                KioskRunnerErrorCodes.RollbackPreviousInvalid,
                $"versions/{previousVersion}",
                "previousVersion is not a valid local static bundle.",
                cancellationToken,
                validation.Issues).ConfigureAwait(false);
        }

        var publish = await currentPublisher.PublishAsync(request.RootDir, previousVersion, cancellationToken).ConfigureAwait(false);
        if (!publish.IsValid)
        {
            return await SaveFailureAsync(
                request.RootDir,
                oldState,
                KioskRunnerErrorCodes.CurrentSwitchFailed,
                "current",
                "Rollback current switch failed.",
                cancellationToken,
                publish.Validation.Issues).ConfigureAwait(false);
        }

        var newState = oldState with
        {
            CurrentVersion = previousVersion,
            PreviousVersion = oldState.CurrentVersion,
            CurrentSha256 = null,
            LastCheckAt = clock.UtcNow,
            LastUpdateStatus = UpdateStatusValues.RolledBack,
            LastError = null,
            LastSuccessfulUpdateAt = clock.UtcNow,
            WebServerStatus = WebServerStatusValues.Degraded
        };

        var save = await stateStore.SaveAsync(request.RootDir, newState, cancellationToken).ConfigureAwait(false);
        return new RollbackResult(save.IsValid ? UpdateStatusValues.RolledBack : UpdateStatusValues.Failed, previousVersion, save.Validation);
    }

    private async Task<RollbackResult> SaveFailureAsync(
        string rootDir,
        KioskRunnerState oldState,
        string code,
        string path,
        string message,
        CancellationToken cancellationToken,
        IEnumerable<ContractValidationIssue>? innerIssues = null)
    {
        var issues = new List<ContractValidationIssue>
        {
            new(code, path, message)
        };
        if (innerIssues is not null)
        {
            issues.AddRange(innerIssues);
        }

        var validation = ContractValidationResult.FromIssues(issues);
        var failureState = oldState with
        {
            LastCheckAt = clock.UtcNow,
            LastUpdateStatus = UpdateStatusValues.Failed,
            LastError = code
        };
        var save = await stateStore.SaveAsync(rootDir, failureState, cancellationToken).ConfigureAwait(false);
        return new RollbackResult(UpdateStatusValues.Failed, null, save.IsValid ? validation : save.Validation);
    }

}
