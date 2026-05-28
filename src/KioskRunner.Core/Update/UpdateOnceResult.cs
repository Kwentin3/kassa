using KioskRunner.Contracts.Validation;

namespace KioskRunner.Core.Update;

public sealed record UpdateOnceResult(
    string UpdateStatus,
    string? Version,
    ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
