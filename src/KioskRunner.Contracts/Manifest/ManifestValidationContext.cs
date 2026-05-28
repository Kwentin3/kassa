namespace KioskRunner.Contracts.Manifest;

public sealed record ManifestValidationContext(
    string ShowcaseId,
    string Channel,
    string RunnerVersion,
    IReadOnlySet<string> CompatibleBridgeContractVersions);
