namespace KioskRunner.Core.Status;

public sealed record WebServerRuntimeSnapshot
{
    public bool Listening { get; init; }

    public string? ListenHost { get; init; }

    public int Port { get; init; }

    public string? BasePath { get; init; }

    public string? ServedVersion { get; init; }

    public string? FailureCode { get; init; }
}
