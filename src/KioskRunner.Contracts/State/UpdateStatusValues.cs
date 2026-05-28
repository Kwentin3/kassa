namespace KioskRunner.Contracts.State;

public static class UpdateStatusValues
{
    public const string Noop = "noop";
    public const string Updated = "updated";
    public const string Failed = "failed";
    public const string Blocked = "blocked";
    public const string RolledBack = "rolledBack";
    public const string InvalidState = "invalidState";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.Ordinal)
    {
        Noop,
        Updated,
        Failed,
        Blocked,
        RolledBack,
        InvalidState
    };
}
