using KioskRunner.Contracts.Validation;

namespace KioskRunner.Host.Service;

public sealed record WindowsServiceHostStartResult(ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
