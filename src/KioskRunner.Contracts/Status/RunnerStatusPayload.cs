namespace KioskRunner.Contracts.Status;

public sealed record RunnerStatusPayload
{
    public string? RunnerId { get; init; }

    public string? ShowcaseId { get; init; }

    public string Health { get; init; } = HealthValues.DegradedNoConfig;

    public string? RunnerVersion { get; init; }

    public WebServerStatusPayload? WebServer { get; init; }

    public string? CurrentVersion { get; init; }

    public string? PreviousVersion { get; init; }

    public string? ServedVersion { get; init; }

    public DateTimeOffset? LastCheckAt { get; init; }

    public string? LastUpdateStatus { get; init; }

    public DateTimeOffset? LastSuccessfulUpdateAt { get; init; }

    public string? LastError { get; init; }
}
