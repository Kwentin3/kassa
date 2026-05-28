namespace KioskRunner.Ports.Config;

public interface IConfigProvider
{
    Task<ConfigProviderResult> LoadAsync(string configPath, CancellationToken cancellationToken);
}
