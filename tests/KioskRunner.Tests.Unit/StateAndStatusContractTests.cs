using System.Text.Json;
using KioskRunner.Contracts.State;
using KioskRunner.Contracts.Status;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Tests.Unit;

public sealed class StateAndStatusContractTests
{
    [Fact]
    public void ValidStatePasses()
    {
        var state = new KioskRunnerState
        {
            CurrentVersion = "2026.05.28.1",
            PreviousVersion = "2026.05.27.1",
            CurrentSha256 = new string('b', 64),
            LastUpdateStatus = UpdateStatusValues.Updated,
            WebServerStatus = WebServerStatusValues.Listening
        };

        var result = KioskRunnerStateValidator.Validate(state);

        Assert.True(result.IsValid);
    }

    [Fact]
    public void InvalidStateStatusIsRejected()
    {
        var state = new KioskRunnerState
        {
            LastUpdateStatus = "done"
        };

        var result = KioskRunnerStateValidator.Validate(state);

        Assert.False(result.IsValid);
        Assert.Contains(result.Issues, issue => issue.Code == KioskRunnerErrorCodes.InvalidUpdateStatus);
    }

    [Fact]
    public void KnownHealthValuesMatchContract()
    {
        Assert.Contains(HealthValues.Ok, HealthValues.All);
        Assert.Contains(HealthValues.DegradedNoConfig, HealthValues.All);
        Assert.Contains(HealthValues.DegradedNoCurrent, HealthValues.All);
        Assert.Contains(HealthValues.UnhealthyPortInUse, HealthValues.All);
    }

    [Fact]
    public void StatusPayloadDoesNotExposeSecretsOrBusinessDataFields()
    {
        var status = new RunnerStatusPayload
        {
            RunnerId = "kiosk-runner-bolars-001",
            ShowcaseId = "bolars",
            Health = HealthValues.Ok,
            RunnerVersion = "0.3.0",
            CurrentVersion = "2026.05.28.1",
            ServedVersion = "2026.05.28.1",
            WebServer = new WebServerStatusPayload
            {
                Listening = true,
                ListenHost = "127.0.0.1",
                Port = 8787,
                BasePath = "/kiosk/bolars/"
            }
        };

        var json = JsonSerializer.Serialize(status);

        Assert.DoesNotContain("registryUrl", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("token", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("password", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("cart", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("payment", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("fiscal", json, StringComparison.OrdinalIgnoreCase);
    }
}
