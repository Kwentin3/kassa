namespace KioskRunner.Ports.Bundles;

public interface IHashVerifier
{
    Task<HashVerificationResult> VerifyFileAsync(string filePath, string expectedSha256, CancellationToken cancellationToken);
}
