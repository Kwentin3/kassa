using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Storage;

namespace KioskRunner.Core.Rollback;

public sealed class RecoveryService(IVersionStore versionStore)
{
    public async Task<RecoveryResult> CleanupPartialStagingAsync(string rootDir, CancellationToken cancellationToken = default)
    {
        try
        {
            await versionStore.CleanupStagingAsync(rootDir, cancellationToken).ConfigureAwait(false);
            return new RecoveryResult(ContractValidationResult.Success);
        }
        catch (StorageOperationException exception)
        {
            return Failure(rootDir, exception.Message);
        }
    }

    private static RecoveryResult Failure(string rootDir, string message)
    {
        return new RecoveryResult(
            ContractValidationResult.FromIssues(
            [
                new ContractValidationIssue(KioskRunnerErrorCodes.RecoveryCleanupFailed, rootDir, message)
            ]));
    }
}
