using System.Text.Json;
using KioskRunner.Contracts.State;
using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Storage;

namespace KioskRunner.Adapters.FileSystem.Storage;

public sealed class JsonStateStore : IStateStore
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    public async Task<StateLoadResult> LoadAsync(string rootDir, CancellationToken cancellationToken)
    {
        var statePath = StatePath(rootDir);
        if (!File.Exists(statePath))
        {
            return new StateLoadResult(null, ContractValidationResult.Success);
        }

        try
        {
            var json = await File.ReadAllTextAsync(statePath, cancellationToken).ConfigureAwait(false);
            var state = JsonSerializer.Deserialize<KioskRunnerState>(json, SerializerOptions);
            var validation = KioskRunnerStateValidator.Validate(state);
            return new StateLoadResult(state, validation);
        }
        catch (JsonException exception)
        {
            return new StateLoadResult(null, Failure(KioskRunnerErrorCodes.InvalidState, "state.json", exception.Message));
        }
        catch (IOException exception)
        {
            return new StateLoadResult(null, Failure(KioskRunnerErrorCodes.StateReadFailed, "state.json", exception.Message));
        }
    }

    public async Task<StateSaveResult> SaveAsync(string rootDir, KioskRunnerState state, CancellationToken cancellationToken)
    {
        var validation = KioskRunnerStateValidator.Validate(state);
        var statePath = StatePath(rootDir);
        if (!validation.IsValid)
        {
            return new StateSaveResult(statePath, validation);
        }

        try
        {
            Directory.CreateDirectory(rootDir);
            var tempPath = $"{statePath}.tmp";
            var json = JsonSerializer.Serialize(state, SerializerOptions);
            await File.WriteAllTextAsync(tempPath, json, cancellationToken).ConfigureAwait(false);
            File.Move(tempPath, statePath, overwrite: true);
            return new StateSaveResult(statePath, ContractValidationResult.Success);
        }
        catch (IOException exception)
        {
            return new StateSaveResult(statePath, Failure(KioskRunnerErrorCodes.StateWriteFailed, "state.json", exception.Message));
        }
    }

    private static string StatePath(string rootDir)
    {
        return Path.Combine(rootDir, "state.json");
    }

    private static ContractValidationResult Failure(string code, string path, string message)
    {
        return ContractValidationResult.FromIssues(
        [
            new ContractValidationIssue(code, path, message)
        ]);
    }
}
