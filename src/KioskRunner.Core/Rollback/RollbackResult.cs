using KioskRunner.Contracts.Validation;

namespace KioskRunner.Core.Rollback;

public sealed record RollbackResult(
    string UpdateStatus,
    string? RestoredVersion,
    ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
