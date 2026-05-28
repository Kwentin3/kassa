using System.Net.Mime;
using System.Text.Json;
using KioskRunner.Contracts.Manifest;
using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Manifest;

namespace KioskRunner.Adapters.Http.Manifest;

public sealed class HttpManifestClient(HttpClient httpClient) : IManifestClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true
    };

    public async Task<ManifestClientResult> FetchAsync(
        Uri registryUrl,
        ManifestValidationContext validationContext,
        CancellationToken cancellationToken)
    {
        try
        {
            using var response = await httpClient.GetAsync(registryUrl, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                return Failure(registryUrl, KioskRunnerErrorCodes.ManifestUnavailable, "$", $"Manifest request failed with HTTP {(int)response.StatusCode}.");
            }

            var mediaType = response.Content.Headers.ContentType?.MediaType;
            var payload = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

            if (LooksLikeHtml(mediaType, payload))
            {
                return Failure(registryUrl, KioskRunnerErrorCodes.ManifestResponseNotJson, "$", "Manifest response is HTML, not JSON.");
            }

            ProductionManifest? manifest;
            try
            {
                manifest = JsonSerializer.Deserialize<ProductionManifest>(payload, SerializerOptions);
            }
            catch (JsonException exception)
            {
                return Failure(registryUrl, KioskRunnerErrorCodes.InvalidManifestJson, "$", $"Manifest JSON is invalid: {exception.Message}");
            }

            var validation = ProductionManifestValidator.Validate(manifest, validationContext);
            return new ManifestClientResult(manifest, validation, registryUrl);
        }
        catch (HttpRequestException exception)
        {
            return Failure(registryUrl, KioskRunnerErrorCodes.ManifestUnavailable, "$", $"Manifest request failed: {exception.Message}");
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            return Failure(registryUrl, KioskRunnerErrorCodes.ManifestUnavailable, "$", $"Manifest request timed out: {exception.Message}");
        }
    }

    private static bool LooksLikeHtml(string? mediaType, string payload)
    {
        if (string.Equals(mediaType, MediaTypeNames.Text.Html, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var trimmed = payload.TrimStart();
        return trimmed.StartsWith("<!doctype html", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("<html", StringComparison.OrdinalIgnoreCase);
    }

    private static ManifestClientResult Failure(Uri registryUrl, string code, string path, string message)
    {
        return new ManifestClientResult(
            null,
            ContractValidationResult.FromIssues(
            [
                new ContractValidationIssue(code, path, message)
            ]),
            registryUrl);
    }
}
