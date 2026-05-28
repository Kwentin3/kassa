using KioskRunner.Contracts.Config;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Ports.Config;

public sealed record ConfigProviderResult(RunnerConfig? Config, ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
