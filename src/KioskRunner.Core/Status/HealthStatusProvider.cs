using KioskRunner.Contracts.State;
using KioskRunner.Contracts.Status;
using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.Status;
using KioskRunner.Ports.Storage;

namespace KioskRunner.Core.Status;

public sealed class HealthStatusProvider : IHealthStatusProvider
{
    private static readonly string[] SensitiveTokens =
    [
        "authorization",
        "password",
        "registryurl",
        "secret",
        "token"
    ];

    private readonly HealthStatusProviderOptions options;
    private readonly IStateStore stateStore;

    public HealthStatusProvider(HealthStatusProviderOptions options, IStateStore stateStore)
    {
        this.options = options;
        this.stateStore = stateStore;
    }

    public async Task<HealthPayload> GetHealthAsync(CancellationToken cancellationToken)
    {
        var status = await GetStatusAsync(cancellationToken).ConfigureAwait(false);
        return new HealthPayload { Health = status.Health };
    }

    public async Task<RunnerStatusPayload> GetStatusAsync(CancellationToken cancellationToken)
    {
        var stateLoad = await LoadStateAsync(cancellationToken).ConfigureAwait(false);
        var state = stateLoad.State;
        var health = DetermineHealth(stateLoad);

        return new RunnerStatusPayload
        {
            RunnerId = options.Config?.RunnerId,
            ShowcaseId = options.Config?.ShowcaseId,
            Health = health,
            RunnerVersion = options.RunnerVersion,
            WebServer = new WebServerStatusPayload
            {
                Listening = options.WebServer.Listening,
                ListenHost = options.WebServer.ListenHost,
                Port = options.WebServer.Port,
                BasePath = options.WebServer.BasePath
            },
            CurrentVersion = state?.CurrentVersion,
            PreviousVersion = state?.PreviousVersion,
            ServedVersion = options.WebServer.ServedVersion ?? state?.CurrentVersion,
            LastCheckAt = state?.LastCheckAt,
            LastUpdateStatus = state?.LastUpdateStatus,
            LastSuccessfulUpdateAt = state?.LastSuccessfulUpdateAt,
            LastError = SanitizeLastError(state?.LastError)
        };
    }

    private async Task<StateLoadResult> LoadStateAsync(CancellationToken cancellationToken)
    {
        if (options.Config is null ||
            !options.ConfigValidation.IsValid ||
            string.IsNullOrWhiteSpace(options.Config.RootDir))
        {
            return new StateLoadResult(null, ContractValidationResult.Success);
        }

        return await stateStore.LoadAsync(options.Config.RootDir, cancellationToken).ConfigureAwait(false);
    }

    private string DetermineHealth(StateLoadResult stateLoad)
    {
        if (options.Config is null || !options.ConfigValidation.IsValid)
        {
            return HealthValues.DegradedNoConfig;
        }

        if (!stateLoad.Validation.IsValid)
        {
            return HealthValues.UnhealthyInvalidState;
        }

        if (string.Equals(options.WebServer.FailureCode, KioskRunnerErrorCodes.PortInUse, StringComparison.Ordinal))
        {
            return HealthValues.UnhealthyPortInUse;
        }

        if (!string.IsNullOrWhiteSpace(options.WebServer.FailureCode) || !options.WebServer.Listening)
        {
            return HealthValues.UnhealthyWebServerFailed;
        }

        if (string.IsNullOrWhiteSpace(stateLoad.State?.CurrentVersion))
        {
            return HealthValues.DegradedNoCurrent;
        }

        return HealthValues.Ok;
    }

    private static string? SanitizeLastError(string? lastError)
    {
        if (string.IsNullOrWhiteSpace(lastError))
        {
            return null;
        }

        var compact = lastError.Replace('\r', ' ').Replace('\n', ' ');
        foreach (var token in SensitiveTokens)
        {
            if (compact.Contains(token, StringComparison.OrdinalIgnoreCase))
            {
                return "[redacted]";
            }
        }

        return compact.Length <= 512 ? compact : compact[..512];
    }
}
