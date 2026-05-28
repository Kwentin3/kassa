namespace KioskRunner.Contracts.Config;

public sealed record WebServerConfig
{
    public bool Enabled { get; init; }

    public string? ListenHost { get; init; }

    public int Port { get; init; }

    public string? BasePath { get; init; }

    public string? StaticRoot { get; init; }

    public bool EnableDirectoryListing { get; init; }

    public string? HealthPath { get; init; }

    public string? StatusPath { get; init; }
}
