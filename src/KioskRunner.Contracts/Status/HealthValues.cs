namespace KioskRunner.Contracts.Status;

public static class HealthValues
{
    public const string Ok = "ok";
    public const string DegradedNoConfig = "degraded/no_config";
    public const string DegradedNoCurrent = "degraded/no_current";
    public const string UnhealthyPortInUse = "unhealthy/port_in_use";
    public const string UnhealthyWebServerFailed = "unhealthy/web_server_failed";
    public const string UnhealthyStorage = "unhealthy/storage";
    public const string UnhealthyInvalidState = "unhealthy/invalid_state";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Ok,
        DegradedNoConfig,
        DegradedNoCurrent,
        UnhealthyPortInUse,
        UnhealthyWebServerFailed,
        UnhealthyStorage,
        UnhealthyInvalidState
    };
}
