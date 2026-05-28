using KioskRunner.Contracts.Validation;

namespace KioskRunner.Ports.Bundles;

public sealed record HashVerificationResult(
    string FilePath,
    string ExpectedSha256,
    string? ActualSha256,
    ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
