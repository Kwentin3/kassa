namespace KioskRunner.Ports.Bundles;

public interface IBundleDownloader
{
    Task<BundleDownloadResult> DownloadAsync(Uri bundleUrl, string destinationPath, CancellationToken cancellationToken);
}
