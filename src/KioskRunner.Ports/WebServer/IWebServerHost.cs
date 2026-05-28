namespace KioskRunner.Ports.WebServer;

public interface IWebServerHost : IAsyncDisposable
{
    Task<WebServerStartResult> StartAsync(WebServerStartOptions options, CancellationToken cancellationToken);

    Task StopAsync(CancellationToken cancellationToken);
}
