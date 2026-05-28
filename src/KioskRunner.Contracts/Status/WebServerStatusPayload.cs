namespace KioskRunner.Contracts.Status;

public sealed record WebServerStatusPayload
{
    public bool Listening { get; init; }

    public string? ListenHost { get; init; }

    public int Port { get; init; }

    public string? BasePath { get; init; }
}
