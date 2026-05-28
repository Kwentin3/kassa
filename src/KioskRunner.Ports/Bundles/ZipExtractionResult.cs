using KioskRunner.Contracts.Validation;

namespace KioskRunner.Ports.Bundles;

public sealed record ZipExtractionResult(string ZipPath, string StagingDirectory, ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
