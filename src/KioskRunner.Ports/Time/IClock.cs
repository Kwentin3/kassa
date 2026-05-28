namespace KioskRunner.Ports.Time;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
