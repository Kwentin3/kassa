using KioskRunner.Contracts.Validation;

namespace KioskRunner.Core.Rollback;

public sealed record RecoveryResult(ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
