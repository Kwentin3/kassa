using KioskRunner.Contracts.State;

namespace KioskRunner.Ports.Storage;

public interface IStateStore
{
    Task<StateLoadResult> LoadAsync(string rootDir, CancellationToken cancellationToken);

    Task<StateSaveResult> SaveAsync(string rootDir, KioskRunnerState state, CancellationToken cancellationToken);
}
