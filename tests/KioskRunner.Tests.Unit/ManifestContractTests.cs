using KioskRunner.Contracts.Manifest;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Tests.Unit;

public sealed class ManifestContractTests
{
    [Fact]
    public void ValidProductionManifestPasses()
    {
        var result = ProductionManifestValidator.Validate(ValidManifest(), ValidContext());

        Assert.True(result.IsValid);
        Assert.Empty(result.Issues);
    }

    [Fact]
    public void WrongShowcaseIdIsRejected()
    {
        var manifest = ValidManifest() with { ShowcaseId = "other" };

        var result = ProductionManifestValidator.Validate(manifest, ValidContext());

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, issue => issue.Code == KioskRunnerErrorCodes.ManifestShowcaseIdMismatch);
    }

    [Fact]
    public void NonProductionStatusIsRejected()
    {
        var manifest = ValidManifest() with { Status = "candidate" };

        var result = ProductionManifestValidator.Validate(manifest, ValidContext());

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, issue => issue.Code == KioskRunnerErrorCodes.ManifestStatusNotProduction);
    }

    [Fact]
    public void InvalidSha256IsRejected()
    {
        var manifest = ValidManifest() with { Sha256 = "not-a-sha" };

        var result = ProductionManifestValidator.Validate(manifest, ValidContext());

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, issue => issue.Code == KioskRunnerErrorCodes.Sha256Invalid);
    }

    [Fact]
    public void MinRunnerVersionAboveInstalledReturnsRunnerUpdateRequired()
    {
        var manifest = ValidManifest() with { MinRunnerVersion = "99.0.0" };

        var result = ProductionManifestValidator.Validate(manifest, ValidContext());

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, issue => issue.Code == KioskRunnerErrorCodes.RunnerUpdateRequired);
    }

    [Fact]
    public void IncompatibleBridgeContractIsRejected()
    {
        var manifest = ValidManifest() with { BridgeContractVersion = "unknown-bridge" };

        var result = ProductionManifestValidator.Validate(manifest, ValidContext());

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, issue => issue.Code == KioskRunnerErrorCodes.BridgeContractIncompatible);
    }

    [Fact]
    public void BundleUrlMustPointToZip()
    {
        var manifest = ValidManifest() with { BundleUrl = "https://updates.example.com/showcases/bolars/index.html" };

        var result = ProductionManifestValidator.Validate(manifest, ValidContext());

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, issue => issue.Code == KioskRunnerErrorCodes.BundleUrlInvalid);
    }

    private static ProductionManifest ValidManifest()
    {
        return new ProductionManifest
        {
            ShowcaseId = "bolars",
            Channel = "production",
            Version = "2026.05.28.1",
            Status = "production",
            BundleUrl = "https://updates.example.com/showcases/bolars/2026.05.28.1/bundle.zip",
            Sha256 = new string('a', 64),
            BridgeContractVersion = "bolars-web-1c-v0.1",
            MinRunnerVersion = "0.3.0",
            PublishedAt = "2026-05-28T12:00:00Z",
            BuildCommit = "abcdef1234567890",
            RollbackVersion = "2026.05.27.1"
        };
    }

    private static ManifestValidationContext ValidContext()
    {
        return new ManifestValidationContext(
            "bolars",
            "production",
            "0.3.0",
            new HashSet<string>(StringComparer.Ordinal) { "bolars-web-1c-v0.1" });
    }
}
