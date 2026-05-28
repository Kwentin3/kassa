using System.Security.Cryptography;
using KioskRunner.Contracts.Common;
using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Bundles;

namespace KioskRunner.Adapters.FileSystem.Hash;

public sealed class Sha256HashVerifier : IHashVerifier
{
    public async Task<HashVerificationResult> VerifyFileAsync(string filePath, string expectedSha256, CancellationToken cancellationToken)
    {
        if (!File.Exists(filePath))
        {
            return Failure(filePath, expectedSha256, null, KioskRunnerErrorCodes.HashFileMissing, "File to hash does not exist.");
        }

        if (!Sha256Shape.IsValid(expectedSha256))
        {
            return Failure(filePath, expectedSha256, null, KioskRunnerErrorCodes.Sha256Invalid, "Expected SHA-256 has invalid shape.");
        }

        await using var stream = File.OpenRead(filePath);
        var hash = await SHA256.HashDataAsync(stream, cancellationToken).ConfigureAwait(false);
        var actualSha256 = Convert.ToHexString(hash).ToLowerInvariant();

        if (!string.Equals(actualSha256, expectedSha256, StringComparison.OrdinalIgnoreCase))
        {
            return Failure(filePath, expectedSha256, actualSha256, KioskRunnerErrorCodes.Sha256Mismatch, "Downloaded bundle SHA-256 does not match manifest.");
        }

        return new HashVerificationResult(filePath, expectedSha256, actualSha256, ContractValidationResult.Success);
    }

    private static HashVerificationResult Failure(
        string filePath,
        string expectedSha256,
        string? actualSha256,
        string code,
        string message)
    {
        return new HashVerificationResult(
            filePath,
            expectedSha256,
            actualSha256,
            ContractValidationResult.FromIssues(
            [
                new ContractValidationIssue(code, "$.sha256", message)
            ]));
    }
}
