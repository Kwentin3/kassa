using KioskRunner.Contracts.State;
using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Storage;
using KioskRunner.Ports.Time;

namespace KioskRunner.Core.Update;

public sealed class VersionPublishService(
    IVersionStore versionStore,
    ICurrentPublisher currentPublisher,
    IStateStore stateStore,
    IClock clock)
{
    public async Task<PublishVersionResult> PublishAsync(PublishVersionRequest request, CancellationToken cancellationToken = default)
    {
        var stateLoad = await stateStore.LoadAsync(request.RootDir, cancellationToken).ConfigureAwait(false);
        if (!stateLoad.IsValid)
        {
            return new PublishVersionResult(UpdateStatusValues.InvalidState, false, stateLoad.Validation);
        }

        var oldState = stateLoad.State ?? new KioskRunnerState();
        if (string.Equals(oldState.CurrentVersion, request.Version, StringComparison.Ordinal))
        {
            var noopState = oldState with
            {
                LastCheckAt = clock.UtcNow,
                LastUpdateStatus = UpdateStatusValues.Noop,
                LastError = null
            };

            var saveNoop = await stateStore.SaveAsync(request.RootDir, noopState, cancellationToken).ConfigureAwait(false);
            return new PublishVersionResult(UpdateStatusValues.Noop, true, saveNoop.Validation);
        }

        var versionPublish = await versionStore
            .PublishVersionAsync(request.RootDir, request.Version, request.StagingDirectory, cancellationToken)
            .ConfigureAwait(false);
        if (!versionPublish.IsValid)
        {
            return new PublishVersionResult(UpdateStatusValues.Failed, false, versionPublish.Validation);
        }

        var currentPublish = await currentPublisher.PublishAsync(request.RootDir, request.Version, cancellationToken).ConfigureAwait(false);
        if (!currentPublish.IsValid)
        {
            return new PublishVersionResult(UpdateStatusValues.Failed, false, currentPublish.Validation);
        }

        var newState = oldState with
        {
            PreviousVersion = oldState.CurrentVersion,
            CurrentVersion = request.Version,
            CurrentSha256 = request.CurrentSha256,
            LastCheckAt = clock.UtcNow,
            LastUpdateStatus = UpdateStatusValues.Updated,
            LastError = null,
            LastSuccessfulUpdateAt = clock.UtcNow,
            WebServerStatus = WebServerStatusValues.Degraded
        };

        var save = await stateStore.SaveAsync(request.RootDir, newState, cancellationToken).ConfigureAwait(false);
        return new PublishVersionResult(save.IsValid ? UpdateStatusValues.Updated : UpdateStatusValues.Failed, false, save.Validation);
    }
}
