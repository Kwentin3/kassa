using System.Text.Json;
using KioskRunner.Contracts.Config;
using KioskRunner.Contracts.State;
using KioskRunner.Contracts.Status;
using KioskRunner.Contracts.Validation;
using KioskRunner.Core.Status;
using KioskRunner.Ports.Storage;

namespace KioskRunner.Tests.Unit;

public sealed class HealthStatusProviderTests
{
    [Fact]
    public async Task CurrentVersionAndListeningServerProduceOkStatus()
    {
        var provider = Provider(
            new KioskRunnerState
            {
                CurrentVersion = "2026.05.28.1",
                PreviousVersion = "2026.05.27.1",
                LastUpdateStatus = UpdateStatusValues.Updated
            },
            Web(listening: true, servedVersion: "2026.05.28.1"));

        var status = await provider.GetStatusAsync(CancellationToken.None);

        Assert.Equal(HealthValues.Ok, status.Health);
        Assert.Equal("2026.05.28.1", status.CurrentVersion);
        Assert.Equal("2026.05.28.1", status.ServedVersion);
        Assert.True(status.WebServer?.Listening);
    }

    [Fact]
    public async Task MissingCurrentIsDegradedNoCurrent()
    {
        var provider = Provider((KioskRunnerState?)null, Web(listening: true));

        var health = await provider.GetHealthAsync(CancellationToken.None);

        Assert.Equal(HealthValues.DegradedNoCurrent, health.Health);
    }

    [Fact]
    public async Task PortFailureIsUnhealthyPortInUse()
    {
        var provider = Provider(
            new KioskRunnerState { CurrentVersion = "2026.05.28.1" },
            Web(listening: false, failureCode: KioskRunnerErrorCodes.PortInUse));

        var status = await provider.GetStatusAsync(CancellationToken.None);

        Assert.Equal(HealthValues.UnhealthyPortInUse, status.Health);
    }

    [Fact]
    public async Task InvalidStateIsUnhealthyInvalidState()
    {
        var stateStore = new StubStateStore(
            null,
            ContractValidationResult.FromIssues(
            [
                new ContractValidationIssue(KioskRunnerErrorCodes.InvalidState, "state.json", "Invalid state.")
            ]));
        var provider = Provider(stateStore, Web(listening: true));

        var status = await provider.GetStatusAsync(CancellationToken.None);

        Assert.Equal(HealthValues.UnhealthyInvalidState, status.Health);
    }

    [Fact]
    public async Task MissingConfigIsDegradedNoConfig()
    {
        var provider = new HealthStatusProvider(
            new HealthStatusProviderOptions(
                null,
                ContractValidationResult.FromIssues(
                [
                    new ContractValidationIssue(KioskRunnerErrorCodes.NoConfig, "config.json", "Missing config.")
                ]),
                "0.3.0",
                Web(listening: false)),
            new StubStateStore(null, ContractValidationResult.Success));

        var status = await provider.GetStatusAsync(CancellationToken.None);

        Assert.Equal(HealthValues.DegradedNoConfig, status.Health);
        Assert.Null(status.RunnerId);
        Assert.Null(status.CurrentVersion);
    }

    [Fact]
    public async Task StatusPayloadRedactsLastErrorSecretsAndHasNoBusinessFields()
    {
        var provider = Provider(
            new KioskRunnerState
            {
                CurrentVersion = "2026.05.28.1",
                LastError = "download failed with token=abc123"
            },
            Web(listening: true, servedVersion: "2026.05.28.1"));

        var status = await provider.GetStatusAsync(CancellationToken.None);
        var json = JsonSerializer.Serialize(status);

        Assert.Equal("[redacted]", status.LastError);
        Assert.DoesNotContain("abc123", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("registryUrl", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("cart", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("payment", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("fiscal", json, StringComparison.OrdinalIgnoreCase);
    }

    private static HealthStatusProvider Provider(KioskRunnerState? state, WebServerRuntimeSnapshot web)
    {
        return Provider(new StubStateStore(state, ContractValidationResult.Success), web);
    }

    private static HealthStatusProvider Provider(IStateStore stateStore, WebServerRuntimeSnapshot web)
    {
        return new HealthStatusProvider(
            new HealthStatusProviderOptions(
                ValidConfig(),
                ContractValidationResult.Success,
                "0.3.0",
                web),
            stateStore);
    }

    private static RunnerConfig ValidConfig()
    {
        return new RunnerConfig
        {
            RunnerId = "kiosk-runner-bolars-001",
            ShowcaseId = "bolars",
            Channel = "production",
            RegistryUrl = "https://updates.example.test/bolars/production/manifest.json",
            RootDir = "C:\\KioskShowcases\\bolars",
            CheckIntervalMinutes = 15,
            KeepVersions = 5,
            AutoUpdate = true
        };
    }

    private static WebServerRuntimeSnapshot Web(bool listening, string? servedVersion = null, string? failureCode = null)
    {
        return new WebServerRuntimeSnapshot
        {
            Listening = listening,
            ListenHost = "127.0.0.1",
            Port = 8787,
            BasePath = "/kiosk/bolars/",
            ServedVersion = servedVersion,
            FailureCode = failureCode
        };
    }

    private sealed class StubStateStore : IStateStore
    {
        private readonly KioskRunnerState? state;
        private readonly ContractValidationResult validation;

        public StubStateStore(KioskRunnerState? state, ContractValidationResult validation)
        {
            this.state = state;
            this.validation = validation;
        }

        public Task<StateLoadResult> LoadAsync(string rootDir, CancellationToken cancellationToken)
        {
            return Task.FromResult(new StateLoadResult(state, validation));
        }

        public Task<StateSaveResult> SaveAsync(string rootDir, KioskRunnerState state, CancellationToken cancellationToken)
        {
            throw new NotSupportedException();
        }
    }
}
