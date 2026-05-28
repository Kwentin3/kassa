using KioskRunner.Contracts.State;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Ports.Storage;

public sealed record StateLoadResult(KioskRunnerState? State, ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
