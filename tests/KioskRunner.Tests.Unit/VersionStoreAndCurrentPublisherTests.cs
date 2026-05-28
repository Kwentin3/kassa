using KioskRunner.Adapters.FileSystem.Storage;
using KioskRunner.Contracts.State;
using KioskRunner.Contracts.Validation;
using KioskRunner.Core.Update;

namespace KioskRunner.Tests.Unit;

public sealed class VersionStoreAndCurrentPublisherTests
{
    [Fact]
    public async Task FirstInstallPublishesVersionSwitchesCurrentAndWritesState()
    {
        using var temp = TempDirectory.Create();
        var staging = temp.CreateBundleStaging("2026.05.28.1", "v1");
        var service = new VersionPublishService(
            new FileSystemVersionStore(),
            new JunctionCurrentPublisher(),
            new JsonStateStore(),
            new FixedClock(DateTimeOffset.Parse("2026-05-28T12:00:00Z")));

        var result = await service.PublishAsync(new PublishVersionRequest(temp.Root, "2026.05.28.1", new string('a', 64), staging), CancellationToken.None);
        var state = await new JsonStateStore().LoadAsync(temp.Root, CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.Equal(UpdateStatusValues.Updated, result.UpdateStatus);
        Assert.True(File.Exists(temp.PathOf("versions", "2026.05.28.1", "index.html")));
        Assert.True(File.Exists(temp.PathOf("current", "index.html")));
        Assert.Equal("2026.05.28.1", state.State?.CurrentVersion);
        Assert.Equal(new string('a', 64), state.State?.CurrentSha256);
    }

    [Fact]
    public async Task SameVersionIsNoopAndDoesNotRequireStaging()
    {
        using var temp = TempDirectory.Create();
        var stateStore = new JsonStateStore();
        await stateStore.SaveAsync(temp.Root, new KioskRunnerState
        {
            CurrentVersion = "2026.05.28.1",
            CurrentSha256 = new string('a', 64)
        }, CancellationToken.None);
        var service = new VersionPublishService(
            new FileSystemVersionStore(),
            new JunctionCurrentPublisher(),
            stateStore,
            new FixedClock(DateTimeOffset.Parse("2026-05-28T12:05:00Z")));

        var result = await service.PublishAsync(new PublishVersionRequest(temp.Root, "2026.05.28.1", new string('a', 64), temp.PathOf("_staging", "missing")), CancellationToken.None);
        var state = await stateStore.LoadAsync(temp.Root, CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.True(result.IsNoop);
        Assert.Equal(UpdateStatusValues.Noop, state.State?.LastUpdateStatus);
    }

    [Fact]
    public async Task FailedSwitchKeepsOldCurrent()
    {
        using var temp = TempDirectory.Create();
        var versionStore = new FileSystemVersionStore();
        var publisher = new JunctionCurrentPublisher();
        var v1 = temp.CreateBundleStaging("v1-staging", "v1");
        await versionStore.PublishVersionAsync(temp.Root, "v1", v1, CancellationToken.None);
        var firstPublish = await publisher.PublishAsync(temp.Root, "v1", CancellationToken.None);

        var failedPublish = await publisher.PublishAsync(temp.Root, "missing-version", CancellationToken.None);

        Assert.True(firstPublish.IsValid);
        Assert.False(failedPublish.IsValid);
        Assert.Contains(failedPublish.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.CurrentSwitchFailed);
        Assert.Contains("v1", File.ReadAllText(temp.PathOf("current", "index.html")));
    }

    [Fact]
    public async Task StateStoreWritesDurably()
    {
        using var temp = TempDirectory.Create();
        var stateStore = new JsonStateStore();

        var save = await stateStore.SaveAsync(temp.Root, new KioskRunnerState
        {
            CurrentVersion = "2026.05.28.1",
            CurrentSha256 = new string('b', 64),
            LastUpdateStatus = UpdateStatusValues.Updated
        }, CancellationToken.None);
        var load = await stateStore.LoadAsync(temp.Root, CancellationToken.None);

        Assert.True(save.IsValid);
        Assert.True(load.IsValid);
        Assert.Equal("2026.05.28.1", load.State?.CurrentVersion);
        Assert.False(File.Exists(temp.PathOf("state.json.tmp")));
    }

    [Fact]
    public async Task PartialStagingCleanupDoesNotDeleteCurrentOrVersions()
    {
        using var temp = TempDirectory.Create();
        Directory.CreateDirectory(temp.PathOf("_staging", "old"));
        Directory.CreateDirectory(temp.PathOf("versions", "v1"));
        Directory.CreateDirectory(temp.PathOf("current"));
        var versionStore = new FileSystemVersionStore();

        await versionStore.CleanupStagingAsync(temp.Root, CancellationToken.None);

        Assert.False(Directory.Exists(temp.PathOf("_staging")));
        Assert.True(Directory.Exists(temp.PathOf("versions", "v1")));
        Assert.True(Directory.Exists(temp.PathOf("current")));
    }

    private sealed class TempDirectory : IDisposable
    {
        private TempDirectory(string root)
        {
            Root = root;
            Directory.CreateDirectory(root);
        }

        public string Root { get; }

        public static TempDirectory Create()
        {
            return new TempDirectory(Path.Combine(Path.GetTempPath(), $"kiosk-runner-tests-{Guid.NewGuid():N}"));
        }

        public string PathOf(params string[] segments)
        {
            return Path.Combine([Root, .. segments]);
        }

        public string CreateBundleStaging(string name, string marker)
        {
            var path = PathOf("_staging", name);
            Directory.CreateDirectory(path);
            File.WriteAllText(Path.Combine(path, "index.html"), $"<html>{marker}</html>");
            Directory.CreateDirectory(Path.Combine(path, "assets"));
            File.WriteAllText(Path.Combine(path, "assets", "app.js"), "console.log('ok');");
            return path;
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
