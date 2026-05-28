namespace KioskRunner.Ports.Logging;

public interface IRunnerLogger
{
    Task WriteAsync(
        string rootDir,
        string eventName,
        string level,
        string? code,
        string? message,
        CancellationToken cancellationToken);
}
