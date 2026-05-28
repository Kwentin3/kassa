namespace KioskRunner.Ports.Storage;

public interface IVersionStore
{
    Task<VersionPublishResult> PublishVersionAsync(
        string rootDir,
        string version,
        string stagingDirectory,
        CancellationToken cancellationToken);

    Task CleanupStagingAsync(string rootDir, CancellationToken cancellationToken);
}
