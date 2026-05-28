using System.Diagnostics;
using System.Runtime.InteropServices;
using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Storage;

namespace KioskRunner.Adapters.FileSystem.Storage;

public sealed class JunctionCurrentPublisher : ICurrentPublisher
{
    public async Task<CurrentPublishResult> PublishAsync(string rootDir, string version, CancellationToken cancellationToken)
    {
        var versionPath = Path.Combine(rootDir, "versions", version);
        var currentPath = Path.Combine(rootDir, "current");
        var nextPath = Path.Combine(rootDir, "current.next");

        if (!Directory.Exists(versionPath))
        {
            return Failure(rootDir, version, currentPath, versionPath, "Target version directory does not exist.");
        }

        CleanupPath(nextPath);

        var junctionCreated = RuntimeInformation.IsOSPlatform(OSPlatform.Windows) &&
            await TryCreateJunctionAsync(nextPath, versionPath, cancellationToken).ConfigureAwait(false);
        var mode = junctionCreated ? "junction" : "copyFallback";

        if (!junctionCreated)
        {
            CopyDirectory(versionPath, nextPath);
        }

        try
        {
            if (Directory.Exists(currentPath))
            {
                Directory.Delete(currentPath, recursive: true);
            }

            Directory.Move(nextPath, currentPath);
            return new CurrentPublishResult(rootDir, version, currentPath, versionPath, mode, ContractValidationResult.Success);
        }
        catch (IOException exception)
        {
            CleanupPath(nextPath);
            return Failure(rootDir, version, currentPath, versionPath, exception.Message);
        }
    }

    private static async Task<bool> TryCreateJunctionAsync(string junctionPath, string targetPath, CancellationToken cancellationToken)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = $"/c mklink /J \"{junctionPath}\" \"{targetPath}\"",
            CreateNoWindow = true,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };

        using var process = Process.Start(startInfo);
        if (process is null)
        {
            return false;
        }

        await process.WaitForExitAsync(cancellationToken).ConfigureAwait(false);
        return process.ExitCode == 0 && Directory.Exists(junctionPath);
    }

    private static void CopyDirectory(string source, string destination)
    {
        Directory.CreateDirectory(destination);

        foreach (var directory in Directory.EnumerateDirectories(source, "*", SearchOption.AllDirectories))
        {
            Directory.CreateDirectory(directory.Replace(source, destination, StringComparison.OrdinalIgnoreCase));
        }

        foreach (var file in Directory.EnumerateFiles(source, "*", SearchOption.AllDirectories))
        {
            var target = file.Replace(source, destination, StringComparison.OrdinalIgnoreCase);
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.Copy(file, target, overwrite: true);
        }
    }

    private static void CleanupPath(string path)
    {
        if (Directory.Exists(path))
        {
            var attributes = File.GetAttributes(path);
            var isReparsePoint = attributes.HasFlag(FileAttributes.ReparsePoint);
            Directory.Delete(path, recursive: !isReparsePoint);
        }
    }

    private static CurrentPublishResult Failure(string rootDir, string version, string currentPath, string versionPath, string message)
    {
        return new CurrentPublishResult(
            rootDir,
            version,
            currentPath,
            versionPath,
            "failed",
            ContractValidationResult.FromIssues(
            [
                new ContractValidationIssue(KioskRunnerErrorCodes.CurrentSwitchFailed, "current", message)
            ]));
    }
}
