using KioskRunner.Ports.Logging;

namespace KioskRunner.Core.Logging;

public sealed class NoopRunnerLogger : IRunnerLogger
{
    public Task WriteAsync(
        string rootDir,
        string eventName,
        string level,
        string? code,
        string? message,
        CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
