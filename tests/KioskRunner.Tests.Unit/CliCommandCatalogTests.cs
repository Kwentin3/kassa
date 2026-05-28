using KioskRunner.Host.Cli;

namespace KioskRunner.Tests.Unit;

public sealed class CliCommandCatalogTests
{
    [Fact]
    public void HelpTextListsDeclaredMvpCommands()
    {
        var help = CliCommandCatalog.BuildHelpText();

        Assert.Contains("update-once", help);
        Assert.Contains("status", help);
        Assert.Contains("rollback", help);
        Assert.Contains("service", help);
    }

    [Fact]
    public void CommandCatalogDoesNotIntroduceForbiddenBackendCommands()
    {
        var commands = CliCommandCatalog.Commands;

        Assert.DoesNotContain(commands, command => command.Contains("git", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(commands, command => command.Contains("upload", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(commands, command => command.Contains("cart", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(commands, command => command.Contains("payment", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(commands, command => command.Contains("fiscal", StringComparison.OrdinalIgnoreCase));
    }
}
