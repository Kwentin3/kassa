using KioskRunner.Contracts.Status;

namespace KioskRunner.Ports.Status;

public interface IHealthStatusProvider
{
    Task<HealthPayload> GetHealthAsync(CancellationToken cancellationToken);

    Task<RunnerStatusPayload> GetStatusAsync(CancellationToken cancellationToken);
}
