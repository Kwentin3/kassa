using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Bundles;

namespace KioskRunner.Adapters.Http.Bundles;

public sealed class HttpBundleDownloader(HttpClient httpClient) : IBundleDownloader
{
    public async Task<BundleDownloadResult> DownloadAsync(Uri bundleUrl, string destinationPath, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await httpClient.GetAsync(bundleUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                return Failure(bundleUrl, destinationPath, $"Bundle request failed with HTTP {(int)response.StatusCode}.");
            }

            var directory = Path.GetDirectoryName(destinationPath);
            if (!string.IsNullOrWhiteSpace(directory))
            {
                Directory.CreateDirectory(directory);
            }

            var partialPath = $"{destinationPath}.partial";
            await using (var source = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false))
            await using (var target = new FileStream(partialPath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await source.CopyToAsync(target, cancellationToken).ConfigureAwait(false);
            }

            File.Move(partialPath, destinationPath, overwrite: true);
            return new BundleDownloadResult(bundleUrl, destinationPath, ContractValidationResult.Success);
        }
        catch (HttpRequestException exception)
        {
            return Failure(bundleUrl, destinationPath, $"Bundle request failed: {exception.Message}");
        }
        catch (IOException exception)
        {
            return Failure(bundleUrl, destinationPath, $"Bundle file write failed: {exception.Message}");
        }
    }

    private static BundleDownloadResult Failure(Uri bundleUrl, string destinationPath, string message)
    {
        return new BundleDownloadResult(
            bundleUrl,
            destinationPath,
            ContractValidationResult.FromIssues(
            [
                new ContractValidationIssue(KioskRunnerErrorCodes.BundleDownloadFailed, "$.bundleUrl", message)
            ]));
    }
}
