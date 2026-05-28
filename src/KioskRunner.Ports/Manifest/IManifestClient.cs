using KioskRunner.Contracts.Manifest;

namespace KioskRunner.Ports.Manifest;

public interface IManifestClient
{
    Task<ManifestClientResult> FetchAsync(
        Uri registryUrl,
        ManifestValidationContext validationContext,
        CancellationToken cancellationToken);
}
