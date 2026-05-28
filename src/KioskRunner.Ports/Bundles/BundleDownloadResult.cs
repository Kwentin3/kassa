using KioskRunner.Contracts.Validation;

namespace KioskRunner.Ports.Bundles;

public sealed record BundleDownloadResult(Uri BundleUrl, string DestinationPath, ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
