namespace KioskRunner.Ports.Storage;

public interface ICurrentPublisher
{
    Task<CurrentPublishResult> PublishAsync(string rootDir, string version, CancellationToken cancellationToken);
}
