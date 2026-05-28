namespace KioskRunner.Contracts.State;

public static class WebServerStatusValues
{
    public const string Listening = "listening";
    public const string Degraded = "degraded";
    public const string Failed = "failed";
    public const string Disabled = "disabled";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Listening,
        Degraded,
        Failed,
        Disabled
    };
}
