using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Bundles;

namespace KioskRunner.Adapters.FileSystem.Bundles;

public sealed class StaticBundleValidator : IBundleValidator
{
    private static readonly string[] ForbiddenExactFileNames =
    [
        ".env",
        ".env.deploy",
        ".env.local",
        "config.json",
        "state.json"
    ];

    private static readonly string[] ForbiddenExtensions =
    [
        ".pem",
        ".pfx",
        ".key",
        ".log"
    ];

    public Task<BundleValidationResult> ValidateAsync(string extractedRoot, CancellationToken cancellationToken)
    {
        var issues = new List<ContractValidationIssue>();
        var indexPath = Path.Combine(extractedRoot, "index.html");

        if (!Directory.Exists(extractedRoot))
        {
            issues.Add(new ContractValidationIssue(KioskRunnerErrorCodes.BundleIndexMissing, "index.html", "Bundle root directory does not exist."));
            return Task.FromResult(new BundleValidationResult(extractedRoot, ContractValidationResult.FromIssues(issues)));
        }

        if (!File.Exists(indexPath) || new FileInfo(indexPath).Length == 0)
        {
            issues.Add(new ContractValidationIssue(KioskRunnerErrorCodes.BundleIndexMissing, "index.html", "index.html must exist in bundle root and be non-empty."));
        }

        foreach (var file in Directory.EnumerateFiles(extractedRoot, "*", SearchOption.AllDirectories))
        {
            cancellationToken.ThrowIfCancellationRequested();

            var name = Path.GetFileName(file);
            var extension = Path.GetExtension(file);
            if (ForbiddenExactFileNames.Contains(name, StringComparer.OrdinalIgnoreCase) ||
                ForbiddenExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
            {
                issues.Add(new ContractValidationIssue(KioskRunnerErrorCodes.BundleForbiddenFile, RelativePath(extractedRoot, file), "Bundle contains forbidden operational or secret-bearing file."));
            }
        }

        if (issues.Count == 0 && !Directory.Exists(Path.Combine(extractedRoot, "assets")))
        {
            var index = File.ReadAllText(indexPath);
            if (!LooksSelfContained(index))
            {
                issues.Add(new ContractValidationIssue(KioskRunnerErrorCodes.BundleAssetsMissing, "assets", "Bundle must contain assets directory or self-contained index.html."));
            }
        }

        return Task.FromResult(new BundleValidationResult(extractedRoot, ContractValidationResult.FromIssues(issues)));
    }

    private static bool LooksSelfContained(string index)
    {
        return index.Contains("<script", StringComparison.OrdinalIgnoreCase) ||
            index.Contains("<style", StringComparison.OrdinalIgnoreCase);
    }

    private static string RelativePath(string root, string file)
    {
        return Path.GetRelativePath(root, file).Replace('\\', '/');
    }
}
