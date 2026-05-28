using KioskRunner.Contracts.Common;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Contracts.Manifest;

public static class ProductionManifestValidator
{
    public static ContractValidationResult Validate(ProductionManifest? manifest, ManifestValidationContext context)
    {
        if (manifest is null)
        {
            return ContractValidationResult.FromIssues(
            [
                Issue(KioskRunnerErrorCodes.ManifestRequiredFieldMissing, "$", "Manifest is required.")
            ]);
        }

        var issues = new List<ContractValidationIssue>();

        Require(manifest.ShowcaseId, "$.showcaseId", issues);
        Require(manifest.Channel, "$.channel", issues);
        Require(manifest.Version, "$.version", issues);
        Require(manifest.Status, "$.status", issues);
        Require(manifest.BundleUrl, "$.bundleUrl", issues);
        Require(manifest.Sha256, "$.sha256", issues);
        Require(manifest.BridgeContractVersion, "$.bridgeContractVersion", issues);
        Require(manifest.MinRunnerVersion, "$.minRunnerVersion", issues);
        Require(manifest.PublishedAt, "$.publishedAt", issues);

        if (!string.IsNullOrWhiteSpace(manifest.ShowcaseId) &&
            !string.Equals(manifest.ShowcaseId, context.ShowcaseId, StringComparison.Ordinal))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.ManifestShowcaseIdMismatch, "$.showcaseId", "Manifest showcaseId must match config showcaseId."));
        }

        if (!string.IsNullOrWhiteSpace(manifest.Channel) &&
            !string.Equals(manifest.Channel, context.Channel, StringComparison.OrdinalIgnoreCase))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.ManifestChannelMismatch, "$.channel", "Manifest channel must match config channel."));
        }

        if (!string.IsNullOrWhiteSpace(manifest.Status) &&
            !string.Equals(manifest.Status, RunnerDefaults.ManifestStatus, StringComparison.OrdinalIgnoreCase))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.ManifestStatusNotProduction, "$.status", "Manifest status must be production."));
        }

        ValidateBundleUrl(manifest.BundleUrl, issues);

        if (!Sha256Shape.IsValid(manifest.Sha256))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.Sha256Invalid, "$.sha256", "sha256 must be 64 hex characters."));
        }

        ValidateRunnerVersion(manifest.MinRunnerVersion, context.RunnerVersion, issues);

        if (!string.IsNullOrWhiteSpace(manifest.BridgeContractVersion) &&
            context.CompatibleBridgeContractVersions.Count > 0 &&
            !context.CompatibleBridgeContractVersions.Contains(manifest.BridgeContractVersion))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.BridgeContractIncompatible, "$.bridgeContractVersion", "bridgeContractVersion is not compatible with this runner configuration."));
        }

        if (!string.IsNullOrWhiteSpace(manifest.PublishedAt) &&
            !DateTimeOffset.TryParse(manifest.PublishedAt, out _))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.PublishedAtInvalid, "$.publishedAt", "publishedAt must be an ISO-compatible timestamp."));
        }

        return ContractValidationResult.FromIssues(issues);
    }

    private static void ValidateBundleUrl(string? bundleUrl, ICollection<ContractValidationIssue> issues)
    {
        if (string.IsNullOrWhiteSpace(bundleUrl) ||
            !Uri.TryCreate(bundleUrl, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) ||
            !uri.AbsolutePath.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.BundleUrlInvalid, "$.bundleUrl", "bundleUrl must be an absolute HTTP(S) URL to bundle.zip."));
        }
    }

    private static void ValidateRunnerVersion(string? minRunnerVersion, string runnerVersion, ICollection<ContractValidationIssue> issues)
    {
        if (string.IsNullOrWhiteSpace(minRunnerVersion))
        {
            return;
        }

        if (!Version.TryParse(minRunnerVersion, out var minVersion) ||
            !Version.TryParse(runnerVersion, out var installedVersion))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.MinRunnerVersionInvalid, "$.minRunnerVersion", "minRunnerVersion must be a comparable version."));
            return;
        }

        if (minVersion > installedVersion)
        {
            issues.Add(Issue(KioskRunnerErrorCodes.RunnerUpdateRequired, "$.minRunnerVersion", "Installed runner is older than manifest minRunnerVersion."));
        }
    }

    private static void Require(string? value, string path, ICollection<ContractValidationIssue> issues)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.ManifestRequiredFieldMissing, path, $"{path} is required."));
        }
    }

    private static ContractValidationIssue Issue(string code, string path, string message)
    {
        return new ContractValidationIssue(code, path, message);
    }
}
