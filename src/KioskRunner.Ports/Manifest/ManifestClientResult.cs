using KioskRunner.Contracts.Manifest;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Ports.Manifest;

public sealed record ManifestClientResult(
    ProductionManifest? Manifest,
    ContractValidationResult Validation,
    Uri RegistryUrl)
{
    public bool IsValid => Validation.IsValid;
}
