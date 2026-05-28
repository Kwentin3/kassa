using KioskRunner.Ports.Storage;

namespace KioskRunner.Adapters.FileSystem.Storage;

public sealed class WindowsLocalStorageLayout : ILocalStorageLayout
{
    public string DownloadBundlePath(string rootDir, string version)
    {
        return Path.Combine(rootDir, "downloads", version, "bundle.zip");
    }

    public string StagingDirectory(string rootDir, string version, string operationId)
    {
        return Path.Combine(rootDir, "_staging", $"{version}-{operationId}");
    }

    public string VersionDirectory(string rootDir, string version)
    {
        return Path.Combine(rootDir, "versions", version);
    }

    public bool IsSafeVersionSegment(string version)
    {
        return !string.IsNullOrWhiteSpace(version) &&
            !version.Contains("..", StringComparison.Ordinal) &&
            version.IndexOfAny(Path.GetInvalidFileNameChars()) < 0 &&
            !version.Contains(Path.DirectorySeparatorChar) &&
            !version.Contains(Path.AltDirectorySeparatorChar);
    }
}
