using System.Text.Json;
using KioskRunner.Adapters.FileSystem.Bundles;
using KioskRunner.Adapters.FileSystem.Storage;
using KioskRunner.Contracts.State;
using KioskRunner.Contracts.Validation;
using KioskRunner.Core.Rollback;
using KioskRunner.Host.Cli;

namespace KioskRunner.Tests.Unit;

public sealed class RollbackAndRecoveryTests
{
    [Fact]
    public async Task RollbackRestoresPreviousVersionWithoutNetwork()
    {
        using var temp = TempDirectory.Create();
        temp.CreateInstalledVersion("v1", "old");
        temp.CreateInstalledVersion("v2", "new");
        var publisher = new JunctionCurrentPublisher();
        await publisher.PublishAsync(temp.Root, "v2", CancellationToken.None);
        var stateStore = new JsonStateStore();
        await stateStore.SaveAsync(temp.Root, new KioskRunnerState
        {
            CurrentVersion = "v2",
            PreviousVersion = "v1",
            CurrentSha256 = new string('b', 64),
            LastUpdateStatus = UpdateStatusValues.Updated
        }, CancellationToken.None);
        var service = new RollbackService(
            stateStore,
            new StaticBundleValidator(),
            publisher,
            new WindowsLocalStorageLayout(),
            new FixedClock(DateTimeOffset.Parse("2026-05-28T13:00:00Z")));

        var result = await service.RollbackAsync(new RollbackRequest(temp.Root), CancellationToken.None);
        var state = await stateStore.LoadAsync(temp.Root, CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.Equal(UpdateStatusValues.RolledBack, result.UpdateStatus);
        Assert.Equal("v1", result.RestoredVersion);
        Assert.Contains("old", File.ReadAllText(temp.PathOf("current", "index.html")));
        Assert.Equal("v1", state.State?.CurrentVersion);
        Assert.Equal("v2", state.State?.PreviousVersion);
        Assert.Null(state.State?.CurrentSha256);
        Assert.Equal(UpdateStatusValues.RolledBack, state.State?.LastUpdateStatus);
    }

    [Fact]
    public async Task MissingPreviousVersionFailsClearlyAndKeepsCurrent()
    {
        using var temp = TempDirectory.Create();
        temp.CreateInstalledVersion("v2", "new");
        var publisher = new JunctionCurrentPublisher();
        await publisher.PublishAsync(temp.Root, "v2", CancellationToken.None);
        var stateStore = new JsonStateStore();
        await stateStore.SaveAsync(temp.Root, new KioskRunnerState
        {
            CurrentVersion = "v2",
            LastUpdateStatus = UpdateStatusValues.Updated
        }, CancellationToken.None);
        var service = new RollbackService(stateStore, new StaticBundleValidator(), publisher, new WindowsLocalStorageLayout(), new FixedClock(DateTimeOffset.Parse("2026-05-28T13:05:00Z")));

        var result = await service.RollbackAsync(new RollbackRequest(temp.Root), CancellationToken.None);
        var state = await stateStore.LoadAsync(temp.Root, CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.RollbackPreviousMissing);
        Assert.Contains("new", File.ReadAllText(temp.PathOf("current", "index.html")));
        Assert.Equal("v2", state.State?.CurrentVersion);
        Assert.Equal(UpdateStatusValues.Failed, state.State?.LastUpdateStatus);
    }

    [Fact]
    public async Task DamagedStateIsHandledWithoutSwitchingCurrent()
    {
        using var temp = TempDirectory.Create();
        temp.CreateInstalledVersion("v1", "old");
        temp.CreateInstalledVersion("v2", "new");
        var publisher = new JunctionCurrentPublisher();
        await publisher.PublishAsync(temp.Root, "v2", CancellationToken.None);
        File.WriteAllText(temp.PathOf("state.json"), "{");
        var service = new RollbackService(
            new JsonStateStore(),
            new StaticBundleValidator(),
            publisher,
            new WindowsLocalStorageLayout(),
            new FixedClock(DateTimeOffset.Parse("2026-05-28T13:10:00Z")));

        var result = await service.RollbackAsync(new RollbackRequest(temp.Root), CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Equal(UpdateStatusValues.InvalidState, result.UpdateStatus);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.InvalidState);
        Assert.Contains("new", File.ReadAllText(temp.PathOf("current", "index.html")));
    }

    [Fact]
    public async Task InvalidPreviousBundleFailsBeforeCurrentSwitch()
    {
        using var temp = TempDirectory.Create();
        temp.CreateInstalledVersion("v2", "new");
        Directory.CreateDirectory(temp.PathOf("versions", "v1"));
        var publisher = new JunctionCurrentPublisher();
        await publisher.PublishAsync(temp.Root, "v2", CancellationToken.None);
        var stateStore = new JsonStateStore();
        await stateStore.SaveAsync(temp.Root, new KioskRunnerState
        {
            CurrentVersion = "v2",
            PreviousVersion = "v1"
        }, CancellationToken.None);
        var service = new RollbackService(stateStore, new StaticBundleValidator(), publisher, new WindowsLocalStorageLayout(), new FixedClock(DateTimeOffset.Parse("2026-05-28T13:15:00Z")));

        var result = await service.RollbackAsync(new RollbackRequest(temp.Root), CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.RollbackPreviousInvalid);
        Assert.Contains("new", File.ReadAllText(temp.PathOf("current", "index.html")));
    }

    [Fact]
    public async Task PartialStagingRecoveryDoesNotDeleteCurrentOrVersions()
    {
        using var temp = TempDirectory.Create();
        Directory.CreateDirectory(temp.PathOf("_staging", "old"));
        temp.CreateInstalledVersion("v1", "old");
        Directory.CreateDirectory(temp.PathOf("current"));
        var service = new RecoveryService(new FileSystemVersionStore());

        var result = await service.CleanupPartialStagingAsync(temp.Root, CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.False(Directory.Exists(temp.PathOf("_staging")));
        Assert.True(Directory.Exists(temp.PathOf("versions", "v1")));
        Assert.True(Directory.Exists(temp.PathOf("current")));
    }

    [Fact]
    public async Task RollbackCliCommandUsesLocalConfigAndRestoresPreviousVersion()
    {
        using var temp = TempDirectory.Create();
        temp.CreateInstalledVersion("v1", "old");
        temp.CreateInstalledVersion("v2", "new");
        temp.WriteConfig();
        var publisher = new JunctionCurrentPublisher();
        await publisher.PublishAsync(temp.Root, "v2", CancellationToken.None);
        await new JsonStateStore().SaveAsync(temp.Root, new KioskRunnerState
        {
            CurrentVersion = "v2",
            PreviousVersion = "v1"
        }, CancellationToken.None);
        using var stdout = new StringWriter();
        using var stderr = new StringWriter();

        var exitCode = await CliApplication.RunAsync(["rollback", "--config", temp.ConfigPath], stdout, stderr, CancellationToken.None);

        Assert.Equal(0, exitCode);
        Assert.Contains("Rolled back to v1", stdout.ToString());
        Assert.Equal(string.Empty, stderr.ToString());
        Assert.Contains("old", File.ReadAllText(temp.PathOf("current", "index.html")));
    }

    private sealed class TempDirectory : IDisposable
    {
        private TempDirectory(string root)
        {
            Root = root;
            Directory.CreateDirectory(root);
        }

        public string Root { get; }

        public string ConfigPath => Path.Combine(Root, "config.json");

        public static TempDirectory Create()
        {
            return new TempDirectory(Path.Combine(Path.GetTempPath(), $"kiosk-runner-rollback-tests-{Guid.NewGuid():N}"));
        }

        public string PathOf(params string[] segments)
        {
            return Path.Combine([Root, .. segments]);
        }

        public void CreateInstalledVersion(string version, string marker)
        {
            var path = PathOf("versions", version);
            Directory.CreateDirectory(Path.Combine(path, "assets"));
            File.WriteAllText(Path.Combine(path, "index.html"), $"<html>{marker}</html>");
            File.WriteAllText(Path.Combine(path, "assets", "app.js"), "console.log('ok');");
        }

        public void WriteConfig()
        {
            var root = JsonSerializer.Serialize(Root);
            File.WriteAllText(ConfigPath, $$"""
            {
              "runnerId": "kiosk-runner-bolars-001",
              "showcaseId": "bolars",
              "channel": "production",
              "registryUrl": "https://updates.example.com/showcases/bolars/production/manifest.json",
              "rootDir": {{root}},
              "checkIntervalMinutes": 15,
              "keepVersions": 5,
              "autoUpdate": true,
              "webServer": {
                "enabled": true,
                "listenHost": "127.0.0.1",
                "port": 8787,
                "basePath": "/kiosk/bolars/",
                "staticRoot": "current",
                "enableDirectoryListing": false,
                "healthPath": "/healthz",
                "statusPath": "/runner/status"
              }
            }
            """);
        }

        public void Dispose()
        {
            var currentPath = Path.Combine(Root, "current");
            if (Directory.Exists(currentPath))
            {
                var attributes = File.GetAttributes(currentPath);
                if (attributes.HasFlag(FileAttributes.ReparsePoint))
                {
                    Directory.Delete(currentPath, recursive: false);
                }
            }

            if (Directory.Exists(Root))
            {
                Directory.Delete(Root, recursive: true);
            }
        }
    }
}
