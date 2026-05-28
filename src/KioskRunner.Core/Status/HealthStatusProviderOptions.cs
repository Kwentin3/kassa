using KioskRunner.Contracts.Config;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Core.Status;

public sealed record HealthStatusProviderOptions(
    RunnerConfig? Config,
    ContractValidationResult ConfigValidation,
    string RunnerVersion,
    WebServerRuntimeSnapshot WebServer);
