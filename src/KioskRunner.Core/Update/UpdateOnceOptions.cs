using KioskRunner.Contracts.Config;

namespace KioskRunner.Core.Update;

public sealed record UpdateOnceOptions(
    RunnerConfig Config,
    string RunnerVersion,
    IReadOnlySet<string> CompatibleBridgeContractVersions);
