namespace KioskRunner.Contracts.State;

public sealed record KioskRunnerState
{
    public string? CurrentVersion { get; init; }

    public string? PreviousVersion { get; init; }

    public string? CurrentSha256 { get; init; }

    public DateTimeOffset? LastCheckAt { get; init; }

    public string? LastUpdateStatus { get; init; }

    public string? LastError { get; init; }

    public DateTimeOffset? LastSuccessfulUpdateAt { get; init; }

    public string? WebServerStatus { get; init; }
}
