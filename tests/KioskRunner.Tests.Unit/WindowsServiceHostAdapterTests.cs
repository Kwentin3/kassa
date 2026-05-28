using KioskRunner.Contracts.Validation;
using KioskRunner.Core.Update;
using KioskRunner.Host.Service;
using KioskRunner.Ports.WebServer;

namespace KioskRunner.Tests.Unit;

public sealed class WindowsServiceHostAdapterTests
{
    [Fact]
    public async Task ServiceStartsWebServerRunsUpdateLoopAndStopsGracefully()
    {
        var web = new StubWebServerHost(ContractValidationResult.Success);
        var updateStarted = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        await using var service = new WindowsServiceHostAdapter(web, _ =>
        {
            updateStarted.TrySetResult();
            return Task.FromResult(new UpdateOnceResult("noop", "v1", ContractValidationResult.Success));
        });

        var result = await service.StartAsync(
            new WindowsServiceHostOptions(Options(), AutoUpdate: true, TimeSpan.FromMinutes(10)),
            CancellationToken.None);
        await updateStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await service.StopAsync(CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.True(web.Started);
        Assert.True(web.Stopped);
        Assert.False(service.IsRunning);
    }

    [Fact]
    public async Task ParallelUpdateForSameShowcaseIsSkipped()
    {
        var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        await using var service = new WindowsServiceHostAdapter(new StubWebServerHost(ContractValidationResult.Success), async _ =>
        {
            entered.TrySetResult();
            await release.Task;
            return new UpdateOnceResult("noop", "v1", ContractValidationResult.Success);
        });

        var first = service.RunUpdateOnceAsync(CancellationToken.None);
        await entered.Task.WaitAsync(TimeSpan.FromSeconds(5));
        var second = await service.RunUpdateOnceAsync(CancellationToken.None);
        release.SetResult();

        Assert.False(second);
        Assert.True(await first);
    }

    [Fact]
    public async Task PortFailureIsReturnedAsUnhealthyStartResult()
    {
        var validation = ContractValidationResult.FromIssues(
        [
            new ContractValidationIssue(KioskRunnerErrorCodes.PortInUse, "webServer", "Port is already in use.")
        ]);
        await using var service = new WindowsServiceHostAdapter(
            new StubWebServerHost(validation),
            _ => Task.FromResult(new UpdateOnceResult("noop", null, ContractValidationResult.Success)));

        var result = await service.StartAsync(
            new WindowsServiceHostOptions(Options(), AutoUpdate: true, TimeSpan.FromMinutes(10)),
            CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.Contains(result.Validation.Issues, issue => issue.Code == KioskRunnerErrorCodes.PortInUse);
        Assert.False(service.IsRunning);
    }

    private static WebServerStartOptions Options()
    {
        return new WebServerStartOptions(
            "127.0.0.1",
            8787,
            "/kiosk/bolars/",
            "current",
            "/healthz",
            "/runner/status",
            "v1");
    }

    private sealed class StubWebServerHost : IWebServerHost
    {
        private readonly ContractValidationResult validation;

        public StubWebServerHost(ContractValidationResult validation)
        {
            this.validation = validation;
        }

        public bool Started { get; private set; }

        public bool Stopped { get; private set; }

        public Task<WebServerStartResult> StartAsync(WebServerStartOptions options, CancellationToken cancellationToken)
        {
            Started = true;
            return Task.FromResult(new WebServerStartResult(options.ListenHost, options.Port, validation));
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            Stopped = true;
            return Task.CompletedTask;
        }

        public ValueTask DisposeAsync()
        {
            return ValueTask.CompletedTask;
        }
    }
}
