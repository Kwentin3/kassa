namespace KioskRunner.Contracts.Status;

public sealed record HealthPayload
{
    public string Health { get; init; } = HealthValues.DegradedNoConfig;
}
