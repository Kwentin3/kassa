using KioskRunner.Contracts.Validation;

namespace KioskRunner.Ports.Storage;

public sealed record VersionPublishResult(
    string RootDir,
    string Version,
    string VersionPath,
    bool AlreadyExists,
    ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
