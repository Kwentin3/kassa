using System.Text.Json;
using KioskRunner.Contracts.Config;
using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Config;

namespace KioskRunner.Adapters.FileSystem.Config;

public sealed class JsonFileConfigProvider : IConfigProvider
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        AllowTrailingCommas = true
    };

    public async Task<ConfigProviderResult> LoadAsync(string configPath, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(configPath) || !File.Exists(configPath))
        {
            return Failure(KioskRunnerErrorCodes.NoConfig, "$", "config.json was not found.");
        }

        try
        {
            var json = await File.ReadAllTextAsync(configPath, cancellationToken).ConfigureAwait(false);
            var config = JsonSerializer.Deserialize<RunnerConfig>(json, SerializerOptions);

            var validation = RunnerConfigValidator.Validate(config);
            return new ConfigProviderResult(config, validation);
        }
        catch (JsonException exception)
        {
            return Failure(KioskRunnerErrorCodes.InvalidJson, "$", $"config.json is not valid JSON: {exception.Message}");
        }
    }

    private static ConfigProviderResult Failure(string code, string path, string message)
    {
        return new ConfigProviderResult(
            null,
            ContractValidationResult.FromIssues(
            [
                new ContractValidationIssue(code, path, message)
            ]));
    }
}
