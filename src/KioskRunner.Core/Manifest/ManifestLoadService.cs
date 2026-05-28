using KioskRunner.Contracts.Manifest;
using KioskRunner.Ports.Manifest;

namespace KioskRunner.Core.Manifest;

public sealed class ManifestLoadService(IManifestClient manifestClient)
{
    public Task<ManifestClientResult> FetchAsync(
        Uri registryUrl,
        ManifestValidationContext validationContext,
        CancellationToken cancellationToken = default)
    {
        return manifestClient.FetchAsync(registryUrl, validationContext, cancellationToken);
    }
}
