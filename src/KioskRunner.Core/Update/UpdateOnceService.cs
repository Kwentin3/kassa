using KioskRunner.Contracts.Manifest;
using KioskRunner.Contracts.State;
using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Bundles;
using KioskRunner.Ports.Logging;
using KioskRunner.Ports.Manifest;
using KioskRunner.Ports.Storage;
using KioskRunner.Ports.Time;

namespace KioskRunner.Core.Update;

public sealed class UpdateOnceService(
    IManifestClient manifestClient,
    IBundleDownloader bundleDownloader,
    IHashVerifier hashVerifier,
    IZipExtractor zipExtractor,
    IBundleValidator bundleValidator,
    IVersionStore versionStore,
    ICurrentPublisher currentPublisher,
    IStateStore stateStore,
    ILocalStorageLayout storageLayout,
    IClock clock,
    IRunnerLogger logger)
{
    public async Task<UpdateOnceResult> RunAsync(UpdateOnceOptions options, CancellationToken cancellationToken = default)
    {
        var rootDir = options.Config.RootDir!;
        await logger.WriteAsync(rootDir, "update.started", "info", null, null, cancellationToken).ConfigureAwait(false);
        await versionStore.CleanupStagingAsync(rootDir, cancellationToken).ConfigureAwait(false);

        var stateLoad = await stateStore.LoadAsync(rootDir, cancellationToken).ConfigureAwait(false);
        if (!stateLoad.IsValid)
        {
            await logger.WriteAsync(rootDir, "update.failed", "error", KioskRunnerErrorCodes.InvalidState, "state.json invalid", cancellationToken).ConfigureAwait(false);
            return new UpdateOnceResult(UpdateStatusValues.InvalidState, null, stateLoad.Validation);
        }

        var state = stateLoad.State ?? new KioskRunnerState();
        var registryUrl = new Uri(options.Config.RegistryUrl!);
        var manifestContext = new ManifestValidationContext(
            options.Config.ShowcaseId!,
            options.Config.Channel!,
            options.RunnerVersion,
            options.CompatibleBridgeContractVersions);
        var manifestResult = await manifestClient.FetchAsync(registryUrl, manifestContext, cancellationToken).ConfigureAwait(false);
        if (!manifestResult.IsValid || manifestResult.Manifest is null)
        {
            var status = IsBlockedManifest(manifestResult.Validation) ? UpdateStatusValues.Blocked : UpdateStatusValues.Failed;
            await SaveFailureAsync(rootDir, state, status, manifestResult.Validation, cancellationToken).ConfigureAwait(false);
            await logger.WriteAsync(rootDir, "manifest.rejected", "warn", FirstCode(manifestResult.Validation), "manifest rejected", cancellationToken).ConfigureAwait(false);
            return new UpdateOnceResult(status, null, manifestResult.Validation);
        }

        var manifest = manifestResult.Manifest;
        await logger.WriteAsync(rootDir, "manifest.fetched", "info", null, manifest.Version, cancellationToken).ConfigureAwait(false);

        if (string.Equals(state.CurrentVersion, manifest.Version, StringComparison.Ordinal))
        {
            var noopState = state with
            {
                LastCheckAt = clock.UtcNow,
                LastUpdateStatus = UpdateStatusValues.Noop,
                LastError = null
            };
            var save = await stateStore.SaveAsync(rootDir, noopState, cancellationToken).ConfigureAwait(false);
            await logger.WriteAsync(rootDir, "update.noop", "info", null, manifest.Version, cancellationToken).ConfigureAwait(false);
            return new UpdateOnceResult(UpdateStatusValues.Noop, manifest.Version, save.Validation);
        }

        var downloadPath = storageLayout.DownloadBundlePath(rootDir, manifest.Version!);
        var download = await bundleDownloader.DownloadAsync(new Uri(manifest.BundleUrl!), downloadPath, cancellationToken).ConfigureAwait(false);
        if (!download.IsValid)
        {
            await SaveFailureAsync(rootDir, state, UpdateStatusValues.Failed, download.Validation, cancellationToken).ConfigureAwait(false);
            await logger.WriteAsync(rootDir, "update.failed", "error", FirstCode(download.Validation), "bundle download failed", cancellationToken).ConfigureAwait(false);
            return new UpdateOnceResult(UpdateStatusValues.Failed, manifest.Version, download.Validation);
        }

        await logger.WriteAsync(rootDir, "bundle.downloaded", "info", null, manifest.Version, cancellationToken).ConfigureAwait(false);

        var hash = await hashVerifier.VerifyFileAsync(download.DestinationPath, manifest.Sha256!, cancellationToken).ConfigureAwait(false);
        if (!hash.IsValid)
        {
            await SaveFailureAsync(rootDir, state, UpdateStatusValues.Failed, hash.Validation, cancellationToken).ConfigureAwait(false);
            await logger.WriteAsync(rootDir, "bundle.hash_failed", "error", FirstCode(hash.Validation), "sha256 mismatch", cancellationToken).ConfigureAwait(false);
            return new UpdateOnceResult(UpdateStatusValues.Failed, manifest.Version, hash.Validation);
        }

        var staging = storageLayout.StagingDirectory(rootDir, manifest.Version!, Guid.NewGuid().ToString("N"));
        var extract = await zipExtractor.ExtractAsync(download.DestinationPath, staging, cancellationToken).ConfigureAwait(false);
        if (!extract.IsValid)
        {
            await SaveFailureAsync(rootDir, state, UpdateStatusValues.Failed, extract.Validation, cancellationToken).ConfigureAwait(false);
            await logger.WriteAsync(rootDir, "update.failed", "error", FirstCode(extract.Validation), "zip extraction failed", cancellationToken).ConfigureAwait(false);
            return new UpdateOnceResult(UpdateStatusValues.Failed, manifest.Version, extract.Validation);
        }

        var bundle = await bundleValidator.ValidateAsync(extract.StagingDirectory, cancellationToken).ConfigureAwait(false);
        if (!bundle.IsValid)
        {
            await SaveFailureAsync(rootDir, state, UpdateStatusValues.Failed, bundle.Validation, cancellationToken).ConfigureAwait(false);
            await logger.WriteAsync(rootDir, "update.failed", "error", FirstCode(bundle.Validation), "bundle validation failed", cancellationToken).ConfigureAwait(false);
            return new UpdateOnceResult(UpdateStatusValues.Failed, manifest.Version, bundle.Validation);
        }

        await logger.WriteAsync(rootDir, "bundle.validated", "info", null, manifest.Version, cancellationToken).ConfigureAwait(false);

        var publisher = new VersionPublishService(versionStore, currentPublisher, stateStore, clock);
        var publish = await publisher.PublishAsync(
            new PublishVersionRequest(rootDir, manifest.Version!, manifest.Sha256!, extract.StagingDirectory),
            cancellationToken).ConfigureAwait(false);
        var finalStatus = publish.IsValid ? publish.UpdateStatus : UpdateStatusValues.Failed;
        await logger.WriteAsync(
            rootDir,
            publish.IsValid ? "update.completed" : "update.failed",
            publish.IsValid ? "info" : "error",
            FirstCode(publish.Validation),
            manifest.Version,
            cancellationToken).ConfigureAwait(false);
        return new UpdateOnceResult(finalStatus, manifest.Version, publish.Validation);
    }

    private async Task SaveFailureAsync(
        string rootDir,
        KioskRunnerState oldState,
        string status,
        ContractValidationResult validation,
        CancellationToken cancellationToken)
    {
        var failureState = oldState with
        {
            LastCheckAt = clock.UtcNow,
            LastUpdateStatus = status,
            LastError = FirstCode(validation)
        };
        await stateStore.SaveAsync(rootDir, failureState, cancellationToken).ConfigureAwait(false);
    }

    private static bool IsBlockedManifest(ContractValidationResult validation)
    {
        return validation.Issues.Any(issue =>
            issue.Code is KioskRunnerErrorCodes.ManifestShowcaseIdMismatch or
                KioskRunnerErrorCodes.ManifestChannelMismatch or
                KioskRunnerErrorCodes.ManifestStatusNotProduction or
                KioskRunnerErrorCodes.RunnerUpdateRequired or
                KioskRunnerErrorCodes.BridgeContractIncompatible or
                KioskRunnerErrorCodes.BundleUrlInvalid or
                KioskRunnerErrorCodes.Sha256Invalid);
    }

    private static string? FirstCode(ContractValidationResult validation)
    {
        return validation.Issues.FirstOrDefault()?.Code;
    }
}
