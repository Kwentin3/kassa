using KioskRunner.Contracts.Validation;

namespace KioskRunner.Ports.Bundles;

public sealed record BundleValidationResult(string ExtractedRoot, ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
