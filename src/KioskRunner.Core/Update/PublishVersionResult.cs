using KioskRunner.Contracts.Validation;

namespace KioskRunner.Core.Update;

public sealed record PublishVersionResult(
    string UpdateStatus,
    bool IsNoop,
    ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
