using System.Net;
using System.Net.Http.Headers;
using System.Text;
using KioskRunner.Adapters.Http.Manifest;
using KioskRunner.Contracts.Manifest;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Tests.Unit;

public sealed class HttpManifestClientTests
{
    private static readonly Uri RegistryUrl = new("https://updates.example.com/showcases/bolars/production/manifest.json");

    [Fact]
    public async Task ValidManifestIsFetchedAndValidated()
    {
        var handler = StubHttpMessageHandler.Json(ValidManifestJson());
        var client = new HttpManifestClient(new HttpClient(handler));

        var result = await client.FetchAsync(RegistryUrl, ValidContext(), CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.Equal("2026.05.28.1", result.Manifest?.Version);
        Assert.Single(handler.Requests);
        Assert.Equal(RegistryUrl, handler.Requests[0].RequestUri);
    }

    [Fact]
    public async Task HtmlInsteadOfJsonIsRejected()
    {
        var handler = StubHttpMessageHandler.Html("<html><body>not manifest</body></html>");
        var client = new HttpManifestClient(new HttpClient(handler));

        var result = await client.FetchAsync(RegistryUrl, ValidContext(), CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.ManifestResponseNotJson);
    }

    [Fact]
    public async Task WrongShowcaseIdIsRejected()
    {
        var handler = StubHttpMessageHandler.Json(ValidManifestJson("\"showcaseId\": \"other\""));
        var client = new HttpManifestClient(new HttpClient(handler));

        var result = await client.FetchAsync(RegistryUrl, ValidContext(), CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.ManifestShowcaseIdMismatch);
    }

    [Fact]
    public async Task WrongChannelIsRejected()
    {
        var handler = StubHttpMessageHandler.Json(ValidManifestJson("\"channel\": \"candidate\""));
        var client = new HttpManifestClient(new HttpClient(handler));

        var result = await client.FetchAsync(RegistryUrl, ValidContext(), CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.ManifestChannelMismatch);
    }

    [Fact]
    public async Task NonProductionStatusIsRejected()
    {
        var handler = StubHttpMessageHandler.Json(ValidManifestJson("\"status\": \"candidate\""));
        var client = new HttpManifestClient(new HttpClient(handler));

        var result = await client.FetchAsync(RegistryUrl, ValidContext(), CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.ManifestStatusNotProduction);
    }

    [Fact]
    public async Task InvalidSha256IsRejected()
    {
        var handler = StubHttpMessageHandler.Json(ValidManifestJson("\"sha256\": \"bad\""));
        var client = new HttpManifestClient(new HttpClient(handler));

        var result = await client.FetchAsync(RegistryUrl, ValidContext(), CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.Sha256Invalid);
    }

    [Fact]
    public async Task MinRunnerVersionTooHighReturnsRunnerUpdateRequired()
    {
        var handler = StubHttpMessageHandler.Json(ValidManifestJson("\"minRunnerVersion\": \"99.0.0\""));
        var client = new HttpManifestClient(new HttpClient(handler));

        var result = await client.FetchAsync(RegistryUrl, ValidContext(), CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.RunnerUpdateRequired);
    }

    [Fact]
    public async Task ManifestClientDoesNotDownloadBundle()
    {
        var handler = StubHttpMessageHandler.Json(ValidManifestJson());
        var client = new HttpManifestClient(new HttpClient(handler));

        var result = await client.FetchAsync(RegistryUrl, ValidContext(), CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.Single(handler.Requests);
        Assert.DoesNotContain(handler.Requests, request => request.RequestUri?.AbsolutePath.EndsWith("bundle.zip", StringComparison.OrdinalIgnoreCase) == true);
    }

    private static ManifestValidationContext ValidContext()
    {
        return new ManifestValidationContext(
            "bolars",
            "production",
            "0.3.0",
            new HashSet<string>(StringComparer.Ordinal) { "bolars-web-1c-v0.1" });
    }

    private static string ValidManifestJson(string? overrideLine = null)
    {
        var showcaseLine = OverrideOrDefault(overrideLine, "showcaseId", "\"showcaseId\": \"bolars\"");
        var channelLine = OverrideOrDefault(overrideLine, "channel", "\"channel\": \"production\"");
        var statusLine = OverrideOrDefault(overrideLine, "status", "\"status\": \"production\"");
        var shaLine = OverrideOrDefault(overrideLine, "sha256", $"\"sha256\": \"{new string('a', 64)}\"");
        var minRunnerLine = OverrideOrDefault(overrideLine, "minRunnerVersion", "\"minRunnerVersion\": \"0.3.0\"");

        return $$"""
        {
          {{showcaseLine}},
          {{channelLine}},
          "version": "2026.05.28.1",
          {{statusLine}},
          "bundleUrl": "https://updates.example.com/showcases/bolars/2026.05.28.1/bundle.zip",
          {{shaLine}},
          "bridgeContractVersion": "bolars-web-1c-v0.1",
          {{minRunnerLine}},
          "publishedAt": "2026-05-28T12:00:00Z",
          "buildCommit": "abcdef1234567890",
          "rollbackVersion": "2026.05.27.1"
        }
        """;
    }

    private static string OverrideOrDefault(string? overrideLine, string propertyName, string defaultLine)
    {
        return overrideLine?.Contains($"\"{propertyName}\"", StringComparison.Ordinal) == true
            ? overrideLine
            : defaultLine;
    }

    private sealed class StubHttpMessageHandler(HttpResponseMessage response) : HttpMessageHandler
    {
        public List<HttpRequestMessage> Requests { get; } = [];

        public static StubHttpMessageHandler Json(string json)
        {
            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            return new StubHttpMessageHandler(response);
        }

        public static StubHttpMessageHandler Html(string html)
        {
            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(html, Encoding.UTF8)
            };
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");

            return new StubHttpMessageHandler(response);
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request);
            return Task.FromResult(CloneResponse(response));
        }

        private static HttpResponseMessage CloneResponse(HttpResponseMessage source)
        {
            var clone = new HttpResponseMessage(source.StatusCode)
            {
                Content = source.Content,
                ReasonPhrase = source.ReasonPhrase,
                RequestMessage = source.RequestMessage,
                Version = source.Version
            };

            return clone;
        }
    }
}
