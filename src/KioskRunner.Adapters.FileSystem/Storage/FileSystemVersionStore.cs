using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Storage;

namespace KioskRunner.Adapters.FileSystem.Storage;

public sealed class FileSystemVersionStore : IVersionStore
{
    public Task<VersionPublishResult> PublishVersionAsync(
        string rootDir,
        string version,
        string stagingDirectory,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var versionPath = Path.Combine(rootDir, "versions", version);

        try
        {
            if (!IsSafeVersionSegment(version))
            {
                return Task.FromResult(Failure(rootDir, version, versionPath, "Version contains unsafe path characters."));
            }

            if (!Directory.Exists(stagingDirectory))
            {
                return Task.FromResult(Failure(rootDir, version, versionPath, "Staging directory does not exist."));
            }

            Directory.CreateDirectory(Path.GetDirectoryName(versionPath)!);

            if (Directory.Exists(versionPath))
            {
                return Task.FromResult(new VersionPublishResult(rootDir, version, versionPath, true, ContractValidationResult.Success));
            }

            Directory.Move(stagingDirectory, versionPath);
            return Task.FromResult(new VersionPublishResult(rootDir, version, versionPath, false, ContractValidationResult.Success));
        }
        catch (IOException exception)
        {
            return Task.FromResult(Failure(rootDir, version, versionPath, exception.Message));
        }
    }

    public Task CleanupStagingAsync(string rootDir, CancellationToken cancellationToken)
    {
        try
        {
            var stagingRoot = Path.Combine(rootDir, "_staging");
            if (!Directory.Exists(stagingRoot))
            {
                return Task.CompletedTask;
            }

            foreach (var directory in Directory.EnumerateDirectories(stagingRoot))
            {
                cancellationToken.ThrowIfCancellationRequested();
                Directory.Delete(directory, recursive: true);
            }

            if (!Directory.EnumerateFileSystemEntries(stagingRoot).Any())
            {
                Directory.Delete(stagingRoot);
            }

            return Task.CompletedTask;
        }
        catch (IOException exception)
        {
            throw new StorageOperationException(exception.Message, exception);
        }
        catch (UnauthorizedAccessException exception)
        {
            throw new StorageOperationException(exception.Message, exception);
        }
    }

    private static bool IsSafeVersionSegment(string version)
    {
        return !string.IsNullOrWhiteSpace(version) &&
            !version.Contains("..", StringComparison.Ordinal) &&
            version.IndexOfAny(Path.GetInvalidFileNameChars()) < 0 &&
            !version.Contains(Path.DirectorySeparatorChar) &&
            !version.Contains(Path.AltDirectorySeparatorChar);
    }

    private static VersionPublishResult Failure(string rootDir, string version, string versionPath, string message)
    {
        return new VersionPublishResult(
            rootDir,
            version,
            versionPath,
            false,
            ContractValidationResult.FromIssues(
            [
                new ContractValidationIssue(KioskRunnerErrorCodes.VersionPublishFailed, "versions", message)
            ]));
    }
}
