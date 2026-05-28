using KioskRunner.Contracts.Validation;

namespace KioskRunner.Ports.WebServer;

public sealed record WebServerStartResult(string ListenHost, int Port, ContractValidationResult Validation)
{
    public bool IsValid => Validation.IsValid;
}
