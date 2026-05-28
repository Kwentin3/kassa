using KioskRunner.Contracts.Validation;

namespace KioskRunner.Ports.Storage;

public sealed record StateSaveResult(string StatePath, ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
