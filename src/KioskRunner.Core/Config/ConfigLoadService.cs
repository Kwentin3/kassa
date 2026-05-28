using KioskRunner.Ports.Config;

namespace KioskRunner.Core.Config;

public sealed class ConfigLoadService(IConfigProvider configProvider)
{
    public Task<ConfigProviderResult> LoadAsync(string configPath, CancellationToken cancellationToken = default)
    {
        return configProvider.LoadAsync(configPath, cancellationToken);
    }
}
