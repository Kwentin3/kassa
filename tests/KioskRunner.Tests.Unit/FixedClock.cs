using KioskRunner.Ports.Time;

namespace KioskRunner.Tests.Unit;

internal sealed class FixedClock(DateTimeOffset utcNow) : IClock
{
    public DateTimeOffset UtcNow { get; } = utcNow;
}
