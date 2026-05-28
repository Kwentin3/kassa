namespace KioskRunner.Contracts.Common;

public static class RunnerDefaults
{
    public const string Version = "0.3.0";
    public const string Channel = "production";
    public const string ManifestStatus = "production";
    public const string ListenHost = "127.0.0.1";
    public const int Port = 8787;
    public const string StaticRoot = "current";
    public const string HealthPath = "/healthz";
    public const string StatusPath = "/runner/status";
}
