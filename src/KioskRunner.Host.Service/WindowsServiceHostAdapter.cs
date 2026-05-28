using KioskRunner.Contracts.Validation;
using KioskRunner.Core.Update;
using KioskRunner.Ports.WebServer;

namespace KioskRunner.Host.Service;

public sealed class WindowsServiceHostAdapter : IAsyncDisposable
{
    private readonly IWebServerHost webServerHost;
    private readonly Func<CancellationToken, Task<UpdateOnceResult>> updateOnce;
    private readonly SemaphoreSlim updateLock = new(1, 1);
    private CancellationTokenSource? loopCancellation;
    private Task? loopTask;

    public WindowsServiceHostAdapter(
        IWebServerHost webServerHost,
        Func<CancellationToken, Task<UpdateOnceResult>> updateOnce)
    {
        this.webServerHost = webServerHost;
        this.updateOnce = updateOnce;
    }

    public bool IsRunning { get; private set; }

    public async Task<WindowsServiceHostStartResult> StartAsync(WindowsServiceHostOptions options, CancellationToken cancellationToken)
    {
        var webStart = await webServerHost.StartAsync(options.WebServer, cancellationToken).ConfigureAwait(false);
        if (!webStart.IsValid)
        {
            return new WindowsServiceHostStartResult(webStart.Validation);
        }

        IsRunning = true;
        if (options.AutoUpdate)
        {
            loopCancellation = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            loopTask = Task.Run(() => RunLoopAsync(options.CheckInterval, loopCancellation.Token), CancellationToken.None);
        }

        return new WindowsServiceHostStartResult(ContractValidationResult.Success);
    }

    public async Task<bool> RunUpdateOnceAsync(CancellationToken cancellationToken)
    {
        if (!await updateLock.WaitAsync(0, cancellationToken).ConfigureAwait(false))
        {
            return false;
        }

        try
        {
            await updateOnce(cancellationToken).ConfigureAwait(false);
            return true;
        }
        finally
        {
            updateLock.Release();
        }
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        if (loopCancellation is not null)
        {
            await loopCancellation.CancelAsync().ConfigureAwait(false);
        }

        if (loopTask is not null)
        {
            try
            {
                await loopTask.WaitAsync(cancellationToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                // Shutdown is already in progress.
            }
        }

        await webServerHost.StopAsync(cancellationToken).ConfigureAwait(false);
        loopCancellation?.Dispose();
        loopCancellation = null;
        loopTask = null;
        IsRunning = false;
    }

    public async ValueTask DisposeAsync()
    {
        await StopAsync(CancellationToken.None).ConfigureAwait(false);
        updateLock.Dispose();
        await webServerHost.DisposeAsync().ConfigureAwait(false);
    }

    private async Task RunLoopAsync(TimeSpan interval, CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            await RunUpdateOnceAsync(cancellationToken).ConfigureAwait(false);
            await Task.Delay(interval, cancellationToken).ConfigureAwait(false);
        }
    }
}
