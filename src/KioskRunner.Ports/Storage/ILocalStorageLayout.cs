namespace KioskRunner.Ports.Storage;

public interface ILocalStorageLayout
{
    string DownloadBundlePath(string rootDir, string version);

    string StagingDirectory(string rootDir, string version, string operationId);

    string VersionDirectory(string rootDir, string version);

    bool IsSafeVersionSegment(string version);
}
