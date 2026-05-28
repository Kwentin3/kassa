using System.IO.Compression;
using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Bundles;

namespace KioskRunner.Adapters.Zip;

public sealed class ZipArchiveExtractor : IZipExtractor
{
    public Task<ZipExtractionResult> ExtractAsync(string zipPath, string stagingDirectory, CancellationToken cancellationToken)
    {
        try
        {
            if (Directory.Exists(stagingDirectory))
            {
                Directory.Delete(stagingDirectory, recursive: true);
            }

            Directory.CreateDirectory(stagingDirectory);
            var stagingRoot = EnsureTrailingSeparator(Path.GetFullPath(stagingDirectory));

            using var archive = ZipFile.OpenRead(zipPath);
            foreach (var entry in archive.Entries)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var targetPath = Path.GetFullPath(Path.Combine(stagingDirectory, entry.FullName));
                if (!targetPath.StartsWith(stagingRoot, StringComparison.OrdinalIgnoreCase))
                {
                    Cleanup(stagingDirectory);
                    return Task.FromResult(Failure(zipPath, stagingDirectory, KioskRunnerErrorCodes.ZipSlipBlocked, entry.FullName, "Zip entry escapes staging directory."));
                }

                if (string.IsNullOrEmpty(entry.Name))
                {
                    Directory.CreateDirectory(targetPath);
                    continue;
                }

                Directory.CreateDirectory(Path.GetDirectoryName(targetPath)!);
                entry.ExtractToFile(targetPath, overwrite: true);
            }

            return Task.FromResult(new ZipExtractionResult(zipPath, stagingDirectory, ContractValidationResult.Success));
        }
        catch (InvalidDataException exception)
        {
            Cleanup(stagingDirectory);
            return Task.FromResult(Failure(zipPath, stagingDirectory, KioskRunnerErrorCodes.BrokenZip, "$.bundle", exception.Message));
        }
        catch (IOException exception)
        {
            Cleanup(stagingDirectory);
            return Task.FromResult(Failure(zipPath, stagingDirectory, KioskRunnerErrorCodes.BrokenZip, "$.bundle", exception.Message));
        }
    }

    private static string EnsureTrailingSeparator(string path)
    {
        return path.EndsWith(Path.DirectorySeparatorChar)
            ? path
            : $"{path}{Path.DirectorySeparatorChar}";
    }

    private static void Cleanup(string stagingDirectory)
    {
        if (Directory.Exists(stagingDirectory))
        {
            Directory.Delete(stagingDirectory, recursive: true);
        }
    }

    private static ZipExtractionResult Failure(string zipPath, string stagingDirectory, string code, string path, string message)
    {
        return new ZipExtractionResult(
            zipPath,
            stagingDirectory,
            ContractValidationResult.FromIssues(
            [
                new ContractValidationIssue(code, path, message)
            ]));
    }
}
