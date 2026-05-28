namespace KioskRunner.Ports.Bundles;

public interface IBundleValidator
{
    Task<BundleValidationResult> ValidateAsync(string extractedRoot, CancellationToken cancellationToken);
}
