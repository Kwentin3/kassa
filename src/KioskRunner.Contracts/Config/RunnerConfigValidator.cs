using KioskRunner.Contracts.Common;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Contracts.Config;

public static class RunnerConfigValidator
{
    public static ContractValidationResult Validate(RunnerConfig? config)
    {
        if (config is null)
        {
            return ContractValidationResult.FromIssues(
            [
                Issue(KioskRunnerErrorCodes.NoConfig, "$", "Config is required.")
            ]);
        }

        var issues = new List<ContractValidationIssue>();

        Require(config.RunnerId, "$.runnerId", KioskRunnerErrorCodes.ManifestRequiredFieldMissing, "runnerId is required.", issues);
        Require(config.ShowcaseId, "$.showcaseId", KioskRunnerErrorCodes.ShowcaseIdMissing, "showcaseId is required.", issues);
        Require(config.RootDir, "$.rootDir", KioskRunnerErrorCodes.ManifestRequiredFieldMissing, "rootDir is required.", issues);

        if (!string.Equals(config.Channel, RunnerDefaults.Channel, StringComparison.OrdinalIgnoreCase))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.InvalidChannel, "$.channel", "channel must be production for MVP."));
        }

        ValidateRegistryUrl(config.RegistryUrl, issues);

        if (config.CheckIntervalMinutes <= 0)
        {
            issues.Add(Issue(KioskRunnerErrorCodes.InvalidCheckInterval, "$.checkIntervalMinutes", "checkIntervalMinutes must be positive."));
        }

        if (config.KeepVersions < 2)
        {
            issues.Add(Issue(KioskRunnerErrorCodes.InvalidRetention, "$.keepVersions", "keepVersions must be at least 2."));
        }

        ValidateWebServer(config.WebServer, issues);

        return ContractValidationResult.FromIssues(issues);
    }

    private static void ValidateRegistryUrl(string? registryUrl, ICollection<ContractValidationIssue> issues)
    {
        if (string.IsNullOrWhiteSpace(registryUrl))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.RegistryUrlMissing, "$.registryUrl", "registryUrl is required."));
            return;
        }

        if (!Uri.TryCreate(registryUrl, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.InvalidRegistryUrl, "$.registryUrl", "registryUrl must be an absolute HTTP(S) production manifest URL."));
            return;
        }

        var path = uri.AbsolutePath;
        var lowerUrl = registryUrl.ToLowerInvariant();

        if (path.Contains("/main/", StringComparison.OrdinalIgnoreCase) ||
            path.Contains("/tree/", StringComparison.OrdinalIgnoreCase) ||
            path.Contains("/branches/", StringComparison.OrdinalIgnoreCase) ||
            lowerUrl.Contains("/dist/") ||
            lowerUrl.EndsWith("/dist", StringComparison.Ordinal))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.InvalidRegistryUrl, "$.registryUrl", "registryUrl must point to a production manifest, not branch/main/dist/source layout."));
        }
    }

    private static void ValidateWebServer(WebServerConfig? webServer, ICollection<ContractValidationIssue> issues)
    {
        if (webServer is null)
        {
            issues.Add(Issue(KioskRunnerErrorCodes.WebServerMissing, "$.webServer", "webServer config is required."));
            return;
        }

        if (!IsLoopbackHost(webServer.ListenHost))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.UnsafeListenHost, "$.webServer.listenHost", "listenHost must be local-only in MVP."));
        }

        if (webServer.Port is < 1 or > 65535)
        {
            issues.Add(Issue(KioskRunnerErrorCodes.InvalidPort, "$.webServer.port", "port must be between 1 and 65535."));
        }

        if (string.IsNullOrWhiteSpace(webServer.BasePath) ||
            !webServer.BasePath.StartsWith("/", StringComparison.Ordinal) ||
            !webServer.BasePath.EndsWith("/", StringComparison.Ordinal))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.InvalidBasePath, "$.webServer.basePath", "basePath must start and end with '/'."));
        }

        var staticRoot = webServer.StaticRoot;
        if (string.IsNullOrWhiteSpace(staticRoot) ||
            !string.Equals(staticRoot, RunnerDefaults.StaticRoot, StringComparison.Ordinal) ||
            staticRoot.Contains("..", StringComparison.Ordinal) ||
            IsRootedPath(staticRoot))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.StaticRootEscape, "$.webServer.staticRoot", "staticRoot must be the local current directory."));
        }

        if (webServer.EnableDirectoryListing)
        {
            issues.Add(Issue(KioskRunnerErrorCodes.DirectoryListingEnabled, "$.webServer.enableDirectoryListing", "directory listing must be disabled."));
        }

        ValidateAbsolutePath(webServer.HealthPath, "$.webServer.healthPath", issues);
        ValidateAbsolutePath(webServer.StatusPath, "$.webServer.statusPath", issues);
    }

    private static bool IsLoopbackHost(string? listenHost)
    {
        if (string.IsNullOrWhiteSpace(listenHost))
        {
            return false;
        }

        return string.Equals(listenHost, "127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(listenHost, "localhost", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(listenHost, "::1", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsRootedPath(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return value.StartsWith("/", StringComparison.Ordinal) ||
            value.StartsWith("\\", StringComparison.Ordinal) ||
            (value.Length >= 2 && char.IsAsciiLetter(value[0]) && value[1] == ':');
    }

    private static void ValidateAbsolutePath(string? value, string path, ICollection<ContractValidationIssue> issues)
    {
        if (string.IsNullOrWhiteSpace(value) || !value.StartsWith("/", StringComparison.Ordinal))
        {
            issues.Add(Issue(KioskRunnerErrorCodes.InvalidBasePath, path, "endpoint path must be absolute."));
        }
    }

    private static void Require(string? value, string path, string code, string message, ICollection<ContractValidationIssue> issues)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            issues.Add(Issue(code, path, message));
        }
    }

    private static ContractValidationIssue Issue(string code, string path, string message)
    {
        return new ContractValidationIssue(code, path, message);
    }
}
