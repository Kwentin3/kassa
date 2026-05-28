using KioskRunner.Contracts.Validation;

namespace KioskRunner.Ports.Storage;

public sealed record CurrentPublishResult(
    string RootDir,
    string Version,
    string CurrentPath,
    string VersionPath,
    string Mode,
    ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
