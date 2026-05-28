namespace KioskRunner.Contracts.Manifest;

public sealed record ProductionManifest
{
    public string? ShowcaseId { get; init; }

    public string? Channel { get; init; }

    public string? Version { get; init; }

    public string? Status { get; init; }

    public string? BundleUrl { get; init; }

    public string? Sha256 { get; init; }

    public string? BridgeContractVersion { get; init; }

    public string? MinRunnerVersion { get; init; }

    public string? PublishedAt { get; init; }

    public string? BuildCommit { get; init; }

    public string? RollbackVersion { get; init; }
}
