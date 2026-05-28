using KioskRunner.Ports.Time;

namespace KioskRunner.Adapters.FileSystem.Time;

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
