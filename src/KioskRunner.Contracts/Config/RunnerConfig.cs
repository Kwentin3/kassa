namespace KioskRunner.Contracts.Config;

public sealed record RunnerConfig
{
    public string? RunnerId { get; init; }

    public string? ShowcaseId { get; init; }

    public string? Channel { get; init; }

    public string? RegistryUrl { get; init; }

    public string? RootDir { get; init; }

    public int CheckIntervalMinutes { get; init; }

    public int KeepVersions { get; init; }

    public bool AutoUpdate { get; init; }

    public WebServerConfig? WebServer { get; init; }
}
