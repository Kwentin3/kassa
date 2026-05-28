using KioskRunner.Adapters.FileSystem.Config;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Tests.Unit;

public sealed class JsonFileConfigProviderTests
{
    [Fact]
    public async Task MissingConfigReturnsNoConfig()
    {
        var provider = new JsonFileConfigProvider();
        var missingPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"), "config.json");

        var result = await provider.LoadAsync(missingPath, CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Null(result.Config);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.NoConfig);
    }

    [Fact]
    public async Task InvalidJsonReturnsInvalidJson()
    {
        using var temp = TempDirectory.Create();
        var configPath = temp.WriteFile("config.json", "{ invalid json");
        var provider = new JsonFileConfigProvider();

        var result = await provider.LoadAsync(configPath, CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Null(result.Config);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.InvalidJson);
    }

    [Fact]
    public async Task MissingRegistryUrlReturnsValidationIssue()
    {
        using var temp = TempDirectory.Create();
        var configPath = temp.WriteFile("config.json", ValidConfigJson("\"registryUrl\": \"\""));
        var provider = new JsonFileConfigProvider();

        var result = await provider.LoadAsync(configPath, CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.NotNull(result.Config);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.RegistryUrlMissing);
    }

    [Fact]
    public async Task UnsafeListenHostReturnsValidationIssue()
    {
        using var temp = TempDirectory.Create();
        var configPath = temp.WriteFile("config.json", ValidConfigJson("\"listenHost\": \"0.0.0.0\""));
        var provider = new JsonFileConfigProvider();

        var result = await provider.LoadAsync(configPath, CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.UnsafeListenHost);
    }

    [Fact]
    public async Task ValidConfigIsAccepted()
    {
        using var temp = TempDirectory.Create();
        var configPath = temp.WriteFile("config.json", ValidConfigJson());
        var provider = new JsonFileConfigProvider();

        var result = await provider.LoadAsync(configPath, CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.Equal("bolars", result.Config?.ShowcaseId);
        Assert.Empty(result.Validation.Issues);
    }

    [Fact]
    public async Task ConfigExampleContainsNoSecretsAndIsValid()
    {
        var repoRoot = RepositoryRoot.Find();
        var examplePath = Path.Combine(repoRoot, "packaging", "config.example.json");
        var text = await File.ReadAllTextAsync(examplePath, CancellationToken.None);
        var provider = new JsonFileConfigProvider();

        var result = await provider.LoadAsync(examplePath, CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.DoesNotContain("token", text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("password", text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("secret", text, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("@", text, StringComparison.OrdinalIgnoreCase);
    }

    private static string ValidConfigJson(string? overrideLine = null)
    {
        var registryUrlLine = overrideLine?.Contains("registryUrl", StringComparison.Ordinal) == true
            ? overrideLine
            : "\"registryUrl\": \"https://updates.example.com/showcases/bolars/production/manifest.json\"";
        var listenHostLine = overrideLine?.Contains("listenHost", StringComparison.Ordinal) == true
            ? overrideLine
            : "\"listenHost\": \"127.0.0.1\"";

        return $$"""
        {
          "runnerId": "kiosk-runner-bolars-001",
          "showcaseId": "bolars",
          "channel": "production",
          {{registryUrlLine}},
          "rootDir": "C:\\KioskShowcases\\bolars",
          "checkIntervalMinutes": 15,
          "keepVersions": 5,
          "autoUpdate": true,
          "webServer": {
            "enabled": true,
            {{listenHostLine}},
            "port": 8787,
            "basePath": "/kiosk/bolars/",
            "staticRoot": "current",
            "enableDirectoryListing": false,
            "healthPath": "/healthz",
            "statusPath": "/runner/status"
          }
        }
        """;
    }

    private sealed class TempDirectory : IDisposable
    {
        private TempDirectory(string path)
        {
            Path = path;
            Directory.CreateDirectory(path);
        }

        public string Path { get; }

        public static TempDirectory Create()
        {
            return new TempDirectory(System.IO.Path.Combine(System.IO.Path.GetTempPath(), $"kiosk-runner-tests-{Guid.NewGuid():N}"));
        }

        public string WriteFile(string fileName, string text)
        {
            var path = System.IO.Path.Combine(Path, fileName);
            File.WriteAllText(path, text);
            return path;
        }

        public void Dispose()
        {
            if (Directory.Exists(Path))
            {
                Directory.Delete(Path, recursive: true);
            }
        }
    }
}

