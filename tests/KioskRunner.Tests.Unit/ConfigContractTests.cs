using KioskRunner.Contracts.Config;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Tests.Unit;

public sealed class ConfigContractTests
{
    [Fact]
    public void ValidProductionConfigPasses()
    {
        var result = RunnerConfigValidator.Validate(ValidConfig());

        Assert.True(result.IsValid);
        Assert.Empty(result.Issues);
    }

    [Fact]
    public void MissingRegistryUrlReturnsStructuredError()
    {
        var config = ValidConfig() with { RegistryUrl = "" };

        var result = RunnerConfigValidator.Validate(config);

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, issue => issue.Code == KioskRunnerErrorCodes.RegistryUrlMissing && issue.Path == "$.registryUrl");
    }

    [Fact]
    public void BranchOrDistRegistryUrlIsRejected()
    {
        var config = ValidConfig() with
        {
            RegistryUrl = "https://raw.githubusercontent.com/acme/showcase/main/dist/manifest.json"
        };

        var result = RunnerConfigValidator.Validate(config);

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, issue => issue.Code == KioskRunnerErrorCodes.InvalidRegistryUrl);
    }

    [Fact]
    public void UnsafeListenHostIsRejected()
    {
        var config = ValidConfig() with
        {
            WebServer = ValidWebServer() with { ListenHost = "0.0.0.0" }
        };

        var result = RunnerConfigValidator.Validate(config);

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, issue => issue.Code == KioskRunnerErrorCodes.UnsafeListenHost);
    }

    [Fact]
    public void DirectoryListingIsRejected()
    {
        var config = ValidConfig() with
        {
            WebServer = ValidWebServer() with { EnableDirectoryListing = true }
        };

        var result = RunnerConfigValidator.Validate(config);

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, issue => issue.Code == KioskRunnerErrorCodes.DirectoryListingEnabled);
    }

    [Theory]
    [InlineData("../current")]
    [InlineData("C:\\KioskShowcases\\bolars\\current")]
    [InlineData("/tmp/current")]
    public void StaticRootEscapeIsRejected(string staticRoot)
    {
        var config = ValidConfig() with
        {
            WebServer = ValidWebServer() with { StaticRoot = staticRoot }
        };

        var result = RunnerConfigValidator.Validate(config);

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, issue => issue.Code == KioskRunnerErrorCodes.StaticRootEscape);
    }

    private static RunnerConfig ValidConfig()
    {
        return new RunnerConfig
        {
            RunnerId = "kiosk-runner-bolars-001",
            ShowcaseId = "bolars",
            Channel = "production",
            RegistryUrl = "https://updates.example.com/showcases/bolars/production/manifest.json",
            RootDir = "C:\\KioskShowcases\\bolars",
            CheckIntervalMinutes = 15,
            KeepVersions = 5,
            AutoUpdate = true,
            WebServer = ValidWebServer()
        };
    }

    private static WebServerConfig ValidWebServer()
    {
        return new WebServerConfig
        {
            Enabled = true,
            ListenHost = "127.0.0.1",
            Port = 8787,
            BasePath = "/kiosk/bolars/",
            StaticRoot = "current",
            EnableDirectoryListing = false,
            HealthPath = "/healthz",
            StatusPath = "/runner/status"
        };
    }
}
