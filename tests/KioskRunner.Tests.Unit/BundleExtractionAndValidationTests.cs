using System.IO.Compression;
using KioskRunner.Adapters.FileSystem.Bundles;
using KioskRunner.Adapters.Zip;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Tests.Unit;

public sealed class BundleExtractionAndValidationTests
{
    [Fact]
    public async Task ValidBundleExtractsAndValidates()
    {
        using var temp = TempDirectory.Create();
        var zipPath = temp.CreateZip("bundle.zip", archive =>
        {
            AddEntry(archive, "index.html", "<html><body><script>window.app=true;</script></body></html>");
            AddEntry(archive, "assets/app.js", "console.log('ok');");
        });
        var staging = temp.PathOf("_staging", "2026.05.28.1");
        var extractor = new ZipArchiveExtractor();
        var validator = new StaticBundleValidator();

        var extraction = await extractor.ExtractAsync(zipPath, staging, CancellationToken.None);
        var validation = await validator.ValidateAsync(staging, CancellationToken.None);

        Assert.True(extraction.IsValid);
        Assert.True(validation.IsValid);
        Assert.True(File.Exists(Path.Combine(staging, "index.html")));
    }

    [Fact]
    public async Task ZipSlipIsBlockedAndStagingIsCleaned()
    {
        using var temp = TempDirectory.Create();
        var zipPath = temp.CreateZip("bad.zip", archive =>
        {
            AddEntry(archive, "../escape.txt", "escape");
        });
        var staging = temp.PathOf("_staging", "bad");
        var extractor = new ZipArchiveExtractor();

        var extraction = await extractor.ExtractAsync(zipPath, staging, CancellationToken.None);

        Assert.False(extraction.IsValid);
        Assert.Contains(extraction.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.ZipSlipBlocked);
        Assert.False(Directory.Exists(staging));
        Assert.False(File.Exists(temp.PathOf("escape.txt")));
    }

    [Fact]
    public async Task BrokenZipIsRejectedAndStagingIsCleaned()
    {
        using var temp = TempDirectory.Create();
        var zipPath = temp.WriteFile("broken.zip", "not a zip");
        var staging = temp.PathOf("_staging", "broken");
        var extractor = new ZipArchiveExtractor();

        var extraction = await extractor.ExtractAsync(zipPath, staging, CancellationToken.None);

        Assert.False(extraction.IsValid);
        Assert.Contains(extraction.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.BrokenZip);
        Assert.False(Directory.Exists(staging));
    }

    [Fact]
    public async Task MissingIndexHtmlIsRejected()
    {
        using var temp = TempDirectory.Create();
        var extractedRoot = temp.CreateDirectory("extracted");
        Directory.CreateDirectory(Path.Combine(extractedRoot, "assets"));
        File.WriteAllText(Path.Combine(extractedRoot, "assets", "app.js"), "console.log('ok');");
        var validator = new StaticBundleValidator();

        var validation = await validator.ValidateAsync(extractedRoot, CancellationToken.None);

        Assert.False(validation.IsValid);
        Assert.Contains(validation.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.BundleIndexMissing);
    }

    [Fact]
    public async Task ForbiddenEnvFileIsRejected()
    {
        using var temp = TempDirectory.Create();
        var extractedRoot = temp.CreateDirectory("extracted");
        File.WriteAllText(Path.Combine(extractedRoot, "index.html"), "<html><script>window.app=true;</script></html>");
        File.WriteAllText(Path.Combine(extractedRoot, ".env"), "SECRET=1");
        var validator = new StaticBundleValidator();

        var validation = await validator.ValidateAsync(extractedRoot, CancellationToken.None);

        Assert.False(validation.IsValid);
        Assert.Contains(validation.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.BundleForbiddenFile);
    }

    [Fact]
    public async Task InvalidBundleDoesNotReachVersionsOrCurrent()
    {
        using var temp = TempDirectory.Create();
        var zipPath = temp.WriteFile("broken.zip", "not a zip");
        var staging = temp.PathOf("_staging", "broken");
        var extractor = new ZipArchiveExtractor();

        var extraction = await extractor.ExtractAsync(zipPath, staging, CancellationToken.None);

        Assert.False(extraction.IsValid);
        Assert.False(Directory.Exists(temp.PathOf("versions")));
        Assert.False(Directory.Exists(temp.PathOf("current")));
    }

    private static void AddEntry(ZipArchive archive, string entryName, string content)
    {
        var entry = archive.CreateEntry(entryName);
        using var writer = new StreamWriter(entry.Open());
        writer.Write(content);
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

        public string CreateDirectory(string relativePath)
        {
            var path = Path.Combine(Root, relativePath);
            Directory.CreateDirectory(path);
            return path;
        }

        public string WriteFile(string relativePath, string text)
        {
            var path = Path.Combine(Root, relativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            File.WriteAllText(path, text);
            return path;
        }

        public string CreateZip(string relativePath, Action<ZipArchive> configure)
        {
            var path = Path.Combine(Root, relativePath);
            using var stream = File.Create(path);
            using var archive = new ZipArchive(stream, ZipArchiveMode.Create);
            configure(archive);
            return path;
        }

        public void Dispose()
        {
            if (Directory.Exists(Root))
            {
                Directory.Delete(Root, recursive: true);
            }
        }
    }
}
