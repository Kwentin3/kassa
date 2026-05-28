namespace KioskRunner.Ports.Bundles;

public interface IZipExtractor
{
    Task<ZipExtractionResult> ExtractAsync(string zipPath, string stagingDirectory, CancellationToken cancellationToken);
}
