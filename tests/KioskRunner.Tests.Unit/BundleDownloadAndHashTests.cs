using System.Net;
using System.Security.Cryptography;
using System.Text;
using KioskRunner.Adapters.FileSystem.Hash;
using KioskRunner.Adapters.Http.Bundles;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Tests.Unit;

public sealed class BundleDownloadAndHashTests
{
    private static readonly Uri BundleUrl = new("https://updates.example.com/showcases/bolars/2026.05.28.1/bundle.zip");

    [Fact]
    public async Task BundleDownloadWritesToDownloadsPathAndHashMatches()
    {
        using var temp = TempDirectory.Create();
        var bundleBytes = Encoding.UTF8.GetBytes("fake zip bytes for stage 4");
        var expectedHash = Sha256(bundleBytes);
        var destinationPath = temp.PathOf("downloads", "2026.05.28.1", "bundle.zip");
        var downloader = new HttpBundleDownloader(new HttpClient(StubHttpMessageHandler.Bytes(bundleBytes)));
        var verifier = new Sha256HashVerifier();

        var download = await downloader.DownloadAsync(BundleUrl, destinationPath, CancellationToken.None);
        var hash = await verifier.VerifyFileAsync(destinationPath, expectedHash, CancellationToken.None);

        Assert.True(download.IsValid);
        Assert.True(hash.IsValid);
        Assert.True(File.Exists(destinationPath));
        Assert.Contains($"{Path.DirectorySeparatorChar}downloads{Path.DirectorySeparatorChar}", destinationPath);
        Assert.DoesNotContain($"{Path.DirectorySeparatorChar}current{Path.DirectorySeparatorChar}", destinationPath);
    }

    [Fact]
    public async Task WrongHashIsRejected()
    {
        using var temp = TempDirectory.Create();
        var destinationPath = temp.WriteFile("downloads\\2026.05.28.1\\bundle.zip", "not expected");
        var verifier = new Sha256HashVerifier();

        var hash = await verifier.VerifyFileAsync(destinationPath, new string('a', 64), CancellationToken.None);

        Assert.False(hash.IsValid);
        Assert.Contains(hash.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.Sha256Mismatch);
    }

    [Fact]
    public async Task DownloadFailureDoesNotCreateFinalBundle()
    {
        using var temp = TempDirectory.Create();
        var destinationPath = temp.PathOf("downloads", "2026.05.28.1", "bundle.zip");
        var downloader = new HttpBundleDownloader(new HttpClient(StubHttpMessageHandler.Status(HttpStatusCode.NotFound)));

        var download = await downloader.DownloadAsync(BundleUrl, destinationPath, CancellationToken.None);

        Assert.False(download.IsValid);
        Assert.False(File.Exists(destinationPath));
        Assert.Contains(download.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.BundleDownloadFailed);
    }

    [Fact]
    public void StageFourDoesNotIntroduceZipExtraction()
    {
        var repoRoot = RepositoryRoot.Find();
        var stageFourSourceFiles = Directory
            .EnumerateFiles(Path.Combine(repoRoot, "src"), "*.cs", SearchOption.AllDirectories)
            .Where(path =>
                path.Contains("KioskRunner.Adapters.Http", StringComparison.Ordinal) ||
                path.Contains("KioskRunner.Adapters.FileSystem", StringComparison.Ordinal) ||
                path.Contains("KioskRunner.Ports", StringComparison.Ordinal));

        foreach (var file in stageFourSourceFiles)
        {
            var text = File.ReadAllText(file);
            Assert.DoesNotContain("ExtractToDirectory", text, StringComparison.Ordinal);
            Assert.DoesNotContain("ZipArchive", text, StringComparison.Ordinal);
        }
    }

    private static string Sha256(byte[] bytes)
    {
        return Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
    }

    private sealed class StubHttpMessageHandler(HttpResponseMessage response) : HttpMessageHandler
    {
        public static StubHttpMessageHandler Bytes(byte[] bytes)
        {
            return new StubHttpMessageHandler(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new ByteArrayContent(bytes)
            });
        }

        public static StubHttpMessageHandler Status(HttpStatusCode statusCode)
        {
            return new StubHttpMessageHandler(new HttpResponseMessage(statusCode));
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(response);
        }
    }

    private sealed class TempDirectory : IDisposable
    {
        private TempDirectory(string path)
        {
            Root = path;
            Directory.CreateDirectory(path);
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

        public string WriteFile(string relativePath, string text)
        {
            var path = Path.Combine(Root, relativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            File.WriteAllText(path, text);
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
