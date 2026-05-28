namespace KioskRunner.Host.Cli;

public static class CliCommandCatalog
{
    private static readonly string[] KnownCommands =
    [
        "update-once",
        "status",
        "rollback",
        "install",
        "uninstall",
        "start",
        "stop",
        "service"
    ];

    public static IReadOnlyList<string> Commands => KnownCommands;

    public static bool IsKnownCommand(string command)
    {
        return KnownCommands.Contains(command, StringComparer.OrdinalIgnoreCase);
    }

    public static string BuildHelpText()
    {
        return string.Join(
            Environment.NewLine,
            [
                "KioskRunner MVP",
                "",
                "Usage:",
                "  KioskRunner <command> [options]",
                "",
                "Commands:",
                .. KnownCommands.Select(command => $"  {command}")
            ]);
    }
}
