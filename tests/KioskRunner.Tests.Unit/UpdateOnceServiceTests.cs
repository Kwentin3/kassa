using System.IO.Compression;
using System.Security.Cryptography;
using KioskRunner.Adapters.FileSystem.Bundles;
using KioskRunner.Adapters.FileSystem.Hash;
using KioskRunner.Adapters.FileSystem.Logging;
using KioskRunner.Adapters.FileSystem.Storage;
using KioskRunner.Adapters.Zip;
using KioskRunner.Contracts.Config;
using KioskRunner.Contracts.Manifest;
using KioskRunner.Contracts.State;
using KioskRunner.Contracts.Validation;
using KioskRunner.Core.Update;
using KioskRunner.Ports.Bundles;
using KioskRunner.Ports.Manifest;

namespace KioskRunner.Tests.Unit;

public sealed class UpdateOnceServiceTests
{
    [Fact]
    public async Task SuccessfulUpdateInstallsCurrentAndWritesLogs()
    {
        using var temp = TempDirectory.Create();
        var bundle = temp.CreateBundleZip("v2");
        var sha = await Sha256Async(bundle);
        var manifest = Manifest("2026.05.28.2", sha);
        var service = Service(temp, manifest, bundle);

        var result = await service.RunAsync(Options(temp), CancellationToken.None);
        var state = await new JsonStateStore().LoadAsync(temp.Root, CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.Equal(UpdateStatusValues.Updated, result.UpdateStatus);
        Assert.True(File.Exists(temp.PathOf("current", "index.html")));
        Assert.Contains("v2", File.ReadAllText(temp.PathOf("current", "index.html")));
        Assert.Equal("2026.05.28.2", state.State?.CurrentVersion);
        Assert.Equal(sha, state.State?.CurrentSha256);
        Assert.True(File.Exists(temp.PathOf("logs", "kiosk-runner.jsonl")));
    }

    [Fact]
    public async Task SameVersionIsNoopBeforeBundleDownload()
    {
        using var temp = TempDirectory.Create();
        var bundle = temp.CreateBundleZip("v1");
        var sha = await Sha256Async(bundle);
        await new JsonStateStore().SaveAsync(temp.Root, new KioskRunnerState
        {
            CurrentVersion = "2026.05.28.1",
            CurrentSha256 = sha
        }, CancellationToken.None);
        var manifest = Manifest("2026.05.28.1", sha);
        var downloader = new CopyBundleDownloader(bundle);
        var service = Service(temp, manifest, downloader);

        var result = await service.RunAsync(Options(temp), CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.Equal(UpdateStatusValues.Noop, result.UpdateStatus);
        Assert.Equal(0, downloader.DownloadCount);
    }

    [Fact]
    public async Task HashMismatchKeepsOldCurrent()
    {
        using var temp = TempDirectory.Create();
        temp.CreateInstalledVersion("2026.05.28.1", "old");
        await new JunctionCurrentPublisher().PublishAsync(temp.Root, "2026.05.28.1", CancellationToken.None);
        await new JsonStateStore().SaveAsync(temp.Root, new KioskRunnerState
        {
            CurrentVersion = "2026.05.28.1",
            CurrentSha256 = new string('a', 64)
        }, CancellationToken.None);
        var bundle = temp.CreateBundleZip("new");
        var manifest = Manifest("2026.05.28.2", new string('b', 64));
        var service = Service(temp, manifest, bundle);

        var result = await service.RunAsync(Options(temp), CancellationToken.None);
        var state = await new JsonStateStore().LoadAsync(temp.Root, CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Equal(UpdateStatusValues.Failed, result.UpdateStatus);
        Assert.Contains("old", File.ReadAllText(temp.PathOf("current", "index.html")));
        Assert.Equal("2026.05.28.1", state.State?.CurrentVersion);
        Assert.Equal(UpdateStatusValues.Failed, state.State?.LastUpdateStatus);
        Assert.Equal(KioskRunnerErrorCodes.Sha256Mismatch, state.State?.LastError);
    }

    private static UpdateOnceService Service(TempDirectory temp, ProductionManifest manifest, string sourceBundle)
    {
        return Service(temp, manifest, new CopyBundleDownloader(sourceBundle));
    }

    private static UpdateOnceService Service(TempDirectory temp, ProductionManifest manifest, IBundleDownloader downloader)
    {
        return new UpdateOnceService(
            new StaticManifestClient(manifest),
            downloader,
            new Sha256HashVerifier(),
            new ZipArchiveExtractor(),
            new StaticBundleValidator(),
            new FileSystemVersionStore(),
            new JunctionCurrentPublisher(),
            new JsonStateStore(),
            new WindowsLocalStorageLayout(),
            new FixedClock(DateTimeOffset.Parse("2026-05-28T14:00:00Z")),
            new JsonLinesRunnerLogger());
    }

    private static UpdateOnceOptions Options(TempDirectory temp)
    {
        return new UpdateOnceOptions(
            new RunnerConfig
            {
                RunnerId = "kiosk-runner-bolars-001",
                ShowcaseId = "bolars",
                Channel = "production",
                RegistryUrl = "https://updates.example.com/showcases/bolars/production/manifest.json",
                RootDir = temp.Root,
                CheckIntervalMinutes = 15,
                KeepVersions = 5,
                AutoUpdate = true
            },
            "0.3.0",
            new HashSet<string>(StringComparer.Ordinal) { "bolars-web-1c-v0.1" });
    }

    private static ProductionManifest Manifest(string version, string sha256)
    {
        return new ProductionManifest
        {
            ShowcaseId = "bolars",
            Channel = "production",
            Version = version,
            Status = "production",
            BundleUrl = "https://updates.example.com/showcases/bolars/bundle.zip",
            Sha256 = sha256,
            BridgeContractVersion = "bolars-web-1c-v0.1",
            MinRunnerVersion = "0.3.0",
            PublishedAt = "2026-05-28T12:00:00Z",
            BuildCommit = "abc123"
        };
    }

    private static async Task<string> Sha256Async(string path)
    {
        await using var stream = File.OpenRead(path);
        var hash = await SHA256.HashDataAsync(stream, CancellationToken.None);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private sealed class StaticManifestClient : IManifestClient
    {
        private readonly ProductionManifest manifest;

        public StaticManifestClient(ProductionManifest manifest)
        {
            this.manifest = manifest;
        }

        public Task<ManifestClientResult> FetchAsync(Uri registryUrl, ManifestValidationContext validationContext, CancellationToken cancellationToken)
        {
            return Task.FromResult(new ManifestClientResult(
                manifest,
                ProductionManifestValidator.Validate(manifest, validationContext),
                registryUrl));
        }
    }

    private sealed class CopyBundleDownloader : IBundleDownloader
    {
        private readonly string sourceBundle;

        public CopyBundleDownloader(string sourceBundle)
        {
            this.sourceBundle = sourceBundle;
        }

        public int DownloadCount { get; private set; }

        public Task<BundleDownloadResult> DownloadAsync(Uri bundleUrl, string destinationPath, CancellationToken cancellationToken)
        {
            DownloadCount++;
            Directory.CreateDirectory(Path.GetDirectoryName(destinationPath)!);
            File.Copy(sourceBundle, destinationPath, overwrite: true);
            return Task.FromResult(new BundleDownloadResult(bundleUrl, destinationPath, ContractValidationResult.Success));
        }
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
            return new TempDirectory(Path.Combine(Path.GetTempPath(), $"kiosk-runner-update-tests-{Guid.NewGuid():N}"));
        }

        public string PathOf(params string[] segments)
        {
            return Path.Combine([Root, .. segments]);
        }

        public string CreateBundleZip(string marker)
        {
            var source = PathOf("bundle-source", Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(Path.Combine(source, "assets"));
            File.WriteAllText(Path.Combine(source, "index.html"), $"<html>{marker}</html>");
            File.WriteAllText(Path.Combine(source, "assets", "app.js"), "console.log('ok');");
            var zipPath = PathOf("bundle.zip");
            if (File.Exists(zipPath))
            {
                File.Delete(zipPath);
            }

            ZipFile.CreateFromDirectory(source, zipPath);
            return zipPath;
        }

        public void CreateInstalledVersion(string version, string marker)
        {
            var path = PathOf("versions", version);
            Directory.CreateDirectory(Path.Combine(path, "assets"));
            File.WriteAllText(Path.Combine(path, "index.html"), $"<html>{marker}</html>");
            File.WriteAllText(Path.Combine(path, "assets", "app.js"), "console.log('ok');");
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
