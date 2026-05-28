using System.Net;
using System.Net.Sockets;
using System.Text.Json;
using KioskRunner.Adapters.WebServer;
using KioskRunner.Contracts.Status;
using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Status;
using KioskRunner.Ports.WebServer;

namespace KioskRunner.Tests.Integration;

public sealed class KestrelStaticWebServerAdapterTests
{
    [Fact]
    public async Task CanonicalBasePathServesIndexWithVersionHeaderAndNoStore()
    {
        using var temp = TempDirectory.Create();
        temp.WriteCurrentFile("index.html", "<html>bolars</html>");
        await using var server = new KestrelStaticWebServerAdapter();
        var options = Options(temp.CurrentPath, FreeTcpPort());

        var started = await server.StartAsync(options, CancellationToken.None);
        using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{options.Port}") };

        var response = await client.GetAsync("/kiosk/bolars/");
        var body = await response.Content.ReadAsStringAsync();

        Assert.True(started.IsValid);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("bolars", body);
        Assert.Equal("2026.05.28.1", response.Headers.GetValues(KestrelStaticWebServerAdapter.VersionHeaderName).Single());
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task AssetGetsMimeTypeCachePolicyAndVersionHeader()
    {
        using var temp = TempDirectory.Create();
        temp.WriteCurrentFile("index.html", "<html></html>");
        temp.WriteCurrentFile("assets/app.js", "console.log('ok');");
        await using var server = new KestrelStaticWebServerAdapter();
        var options = Options(temp.CurrentPath, FreeTcpPort());

        await server.StartAsync(options, CancellationToken.None);
        using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{options.Port}") };

        var response = await client.GetAsync("/kiosk/bolars/assets/app.js");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("javascript", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains("max-age", response.Headers.CacheControl?.ToString());
        Assert.Equal("2026.05.28.1", response.Headers.GetValues(KestrelStaticWebServerAdapter.VersionHeaderName).Single());
    }

    [Fact]
    public async Task ForbiddenPathsAreBlocked()
    {
        using var temp = TempDirectory.Create();
        temp.WriteCurrentFile("index.html", "<html></html>");
        await using var server = new KestrelStaticWebServerAdapter();
        var options = Options(temp.CurrentPath, FreeTcpPort());

        await server.StartAsync(options, CancellationToken.None);
        using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{options.Port}") };

        var forbiddenPaths = new[]
        {
            "/downloads/bundle.zip",
            "/kiosk/bolars/downloads/bundle.zip",
            "/kiosk/bolars/versions/2026.05.28.1/index.html",
            "/kiosk/bolars/logs/kiosk-runner.jsonl",
            "/kiosk/bolars/state.json",
            "/kiosk/bolars/config.json"
        };

        foreach (var path in forbiddenPaths)
        {
            var response = await client.GetAsync(path);

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
    }

    [Fact]
    public async Task PathTraversalIsBlocked()
    {
        using var temp = TempDirectory.Create();
        temp.WriteCurrentFile("index.html", "<html></html>");
        await using var server = new KestrelStaticWebServerAdapter();
        var options = Options(temp.CurrentPath, FreeTcpPort());

        await server.StartAsync(options, CancellationToken.None);

        var statusCode = await RawGetStatusCodeAsync(options.Port, "/kiosk/bolars/%2e%2e/state.json");

        Assert.Equal(HttpStatusCode.BadRequest, statusCode);
    }

    [Fact]
    public async Task DirectoryListingIsNotServed()
    {
        using var temp = TempDirectory.Create();
        temp.WriteCurrentFile("index.html", "<html></html>");
        temp.WriteCurrentFile("assets/app.js", "console.log('ok');");
        await using var server = new KestrelStaticWebServerAdapter();
        var options = Options(temp.CurrentPath, FreeTcpPort());

        await server.StartAsync(options, CancellationToken.None);
        using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{options.Port}") };

        var response = await client.GetAsync("/kiosk/bolars/assets/");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PortConflictReturnsPortInUse()
    {
        using var temp = TempDirectory.Create();
        temp.WriteCurrentFile("index.html", "<html></html>");
        var port = FreeTcpPort();
        await using var first = new KestrelStaticWebServerAdapter();
        await using var second = new KestrelStaticWebServerAdapter();

        var firstStart = await first.StartAsync(Options(temp.CurrentPath, port), CancellationToken.None);
        var secondStart = await second.StartAsync(Options(temp.CurrentPath, port), CancellationToken.None);

        Assert.True(firstStart.IsValid);
        Assert.False(secondStart.IsValid);
        Assert.Contains(secondStart.Validation.Issues, issue => issue.Code is KioskRunnerErrorCodes.PortInUse or KioskRunnerErrorCodes.WebServerFailed);
    }

    [Fact]
    public async Task StatusEndpointUsesProviderAndExposesNoSecretsOrBusinessData()
    {
        using var temp = TempDirectory.Create();
        temp.WriteCurrentFile("index.html", "<html></html>");
        await using var server = new KestrelStaticWebServerAdapter();
        var options = Options(
            temp.CurrentPath,
            FreeTcpPort(),
            new StubHealthStatusProvider(
                new HealthPayload { Health = HealthValues.Ok },
                new RunnerStatusPayload
                {
                    RunnerId = "kiosk-runner-bolars-001",
                    ShowcaseId = "bolars",
                    Health = HealthValues.Ok,
                    CurrentVersion = "2026.05.28.1",
                    ServedVersion = "2026.05.28.1",
                    LastError = "[redacted]"
                }));

        await server.StartAsync(options, CancellationToken.None);
        using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{options.Port}") };

        var response = await client.GetAsync("/runner/status");
        var body = await response.Content.ReadAsStringAsync();
        var status = JsonSerializer.Deserialize<RunnerStatusPayload>(body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.Equal("2026.05.28.1", status?.CurrentVersion);
        Assert.Equal("2026.05.28.1", status?.ServedVersion);
        Assert.DoesNotContain("registryUrl", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("token", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("cart", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("payment", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("fiscal", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task HealthEndpointReturnsServiceUnavailableForDegradedState()
    {
        using var temp = TempDirectory.Create();
        temp.WriteCurrentFile("index.html", "<html></html>");
        await using var server = new KestrelStaticWebServerAdapter();
        var options = Options(
            temp.CurrentPath,
            FreeTcpPort(),
            new StubHealthStatusProvider(
                new HealthPayload { Health = HealthValues.DegradedNoCurrent },
                new RunnerStatusPayload { Health = HealthValues.DegradedNoCurrent }));

        await server.StartAsync(options, CancellationToken.None);
        using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{options.Port}") };

        var response = await client.GetAsync("/healthz");
        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
        Assert.Contains(HealthValues.DegradedNoCurrent, body);
    }

    [Fact]
    public async Task StaticVersionHeaderUsesCurrentStatusProviderValue()
    {
        using var temp = TempDirectory.Create();
        temp.WriteCurrentFile("index.html", "<html></html>");
        var provider = new StubHealthStatusProvider(
            new HealthPayload { Health = HealthValues.Ok },
            new RunnerStatusPayload
            {
                Health = HealthValues.Ok,
                CurrentVersion = "v1",
                ServedVersion = "v1"
            });
        await using var server = new KestrelStaticWebServerAdapter();
        var options = Options(temp.CurrentPath, FreeTcpPort(), provider);

        await server.StartAsync(options, CancellationToken.None);
        using var client = new HttpClient { BaseAddress = new Uri($"http://127.0.0.1:{options.Port}") };
        var first = await client.GetAsync("/kiosk/bolars/");
        provider.Status = provider.Status with { CurrentVersion = "v2", ServedVersion = "v2" };
        var second = await client.GetAsync("/kiosk/bolars/");

        Assert.Equal("v1", first.Headers.GetValues(KestrelStaticWebServerAdapter.VersionHeaderName).Single());
        Assert.Equal("v2", second.Headers.GetValues(KestrelStaticWebServerAdapter.VersionHeaderName).Single());
    }


    private static WebServerStartOptions Options(string currentPath, int port, IHealthStatusProvider? provider = null)
    {
        return new WebServerStartOptions(
            "127.0.0.1",
            port,
            "/kiosk/bolars/",
            currentPath,
            "/healthz",
            "/runner/status",
            "2026.05.28.1",
            provider);
    }

    private static int FreeTcpPort()
    {
        var listener = new System.Net.Sockets.TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }

    private static async Task<HttpStatusCode> RawGetStatusCodeAsync(int port, string target)
    {
        using var client = new TcpClient();
        await client.ConnectAsync(IPAddress.Loopback, port, CancellationToken.None);
        await using var stream = client.GetStream();
        await using var writer = new StreamWriter(stream, leaveOpen: true) { NewLine = "\r\n", AutoFlush = true };
        using var reader = new StreamReader(stream, leaveOpen: true);

        await writer.WriteLineAsync($"GET {target} HTTP/1.1");
        await writer.WriteLineAsync("Host: 127.0.0.1");
        await writer.WriteLineAsync("Connection: close");
        await writer.WriteLineAsync();

        var statusLine = await reader.ReadLineAsync();
        Assert.NotNull(statusLine);
        var statusParts = statusLine.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        Assert.True(statusParts.Length >= 2, $"Invalid HTTP status line: {statusLine}");
        return (HttpStatusCode)int.Parse(statusParts[1], System.Globalization.CultureInfo.InvariantCulture);
    }

    private sealed class TempDirectory : IDisposable
    {
        private TempDirectory(string root)
        {
            Root = root;
            CurrentPath = Path.Combine(root, "current");
            Directory.CreateDirectory(CurrentPath);
        }

        public string Root { get; }

        public string CurrentPath { get; }

        public static TempDirectory Create()
        {
            return new TempDirectory(Path.Combine(Path.GetTempPath(), $"kiosk-runner-web-tests-{Guid.NewGuid():N}"));
        }

        public void WriteCurrentFile(string relativePath, string text)
        {
            var path = Path.Combine(CurrentPath, relativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            File.WriteAllText(path, text);
        }

        public void Dispose()
        {
            if (Directory.Exists(Root))
            {
                Directory.Delete(Root, recursive: true);
            }
        }
    }

    private sealed class StubHealthStatusProvider : IHealthStatusProvider
    {
        private readonly HealthPayload health;
        private RunnerStatusPayload status;

        public StubHealthStatusProvider(HealthPayload health, RunnerStatusPayload status)
        {
            this.health = health;
            this.status = status;
        }

        public RunnerStatusPayload Status
        {
            get => status;
            set => status = value;
        }

        public Task<HealthPayload> GetHealthAsync(CancellationToken cancellationToken)
        {
            return Task.FromResult(health);
        }

        public Task<RunnerStatusPayload> GetStatusAsync(CancellationToken cancellationToken)
        {
            return Task.FromResult(status);
        }
    }
}
