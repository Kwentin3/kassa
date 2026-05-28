using System.Text.Json;
using KioskRunner.Ports.Logging;

namespace KioskRunner.Adapters.FileSystem.Logging;

public sealed class JsonLinesRunnerLogger : IRunnerLogger
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public async Task WriteAsync(
        string rootDir,
        string eventName,
        string level,
        string? code,
        string? message,
        CancellationToken cancellationToken)
    {
        var logsDir = Path.Combine(rootDir, "logs");
        Directory.CreateDirectory(logsDir);
        var logPath = Path.Combine(logsDir, "kiosk-runner.jsonl");
        var sanitized = Sanitize(message);
        var line = JsonSerializer.Serialize(new
        {
            timestamp = DateTimeOffset.UtcNow,
            level,
            @event = eventName,
            code,
            message = sanitized
        }, SerializerOptions);

        await File.AppendAllTextAsync(logPath, $"{line}{Environment.NewLine}", cancellationToken).ConfigureAwait(false);
    }

    private static string? Sanitize(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return null;
        }

        var compact = message.Replace('\r', ' ').Replace('\n', ' ');
        return compact.Contains("token", StringComparison.OrdinalIgnoreCase) ||
            compact.Contains("password", StringComparison.OrdinalIgnoreCase) ||
            compact.Contains("secret", StringComparison.OrdinalIgnoreCase)
            ? "[redacted]"
            : compact;
    }
}
