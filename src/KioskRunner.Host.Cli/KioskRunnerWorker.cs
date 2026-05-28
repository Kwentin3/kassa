using KioskRunner.Contracts.Config;
using KioskRunner.Core.Update;
using KioskRunner.Host.Service;
using KioskRunner.Ports.WebServer;
using Microsoft.Extensions.Hosting;

namespace KioskRunner.Host.Cli;

public sealed class KioskRunnerWorker : BackgroundService
{
    private readonly RunnerConfig config;
    private readonly Func<UpdateOnceService> updateServiceFactory;
    private readonly Func<IWebServerHost> webServerFactory;
    private readonly Func<IWebServerHost, UpdateOnceService, WindowsServiceHostAdapter> hostFactory;
    private WindowsServiceHostAdapter? serviceHost;

    public KioskRunnerWorker(
        RunnerConfig config,
        Func<UpdateOnceService> updateServiceFactory,
        Func<IWebServerHost> webServerFactory,
        Func<IWebServerHost, UpdateOnceService, WindowsServiceHostAdapter> hostFactory)
    {
        this.config = config;
        this.updateServiceFactory = updateServiceFactory;
        this.webServerFactory = webServerFactory;
        this.hostFactory = hostFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var updateService = updateServiceFactory();
        var webServer = webServerFactory();
        serviceHost = hostFactory(webServer, updateService);
        var options = new WindowsServiceHostOptions(
            CliApplication.BuildWebServerOptions(config, listening: true),
            config.AutoUpdate,
            TimeSpan.FromMinutes(config.CheckIntervalMinutes));
        var start = await serviceHost.StartAsync(options, stoppingToken).ConfigureAwait(false);
        if (!start.IsValid)
        {
            var first = start.Validation.Issues.FirstOrDefault();
            throw new InvalidOperationException(first?.Message ?? "KioskRunner service failed to start.");
        }

        await Task.Delay(Timeout.InfiniteTimeSpan, stoppingToken).ConfigureAwait(false);
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (serviceHost is not null)
        {
            await serviceHost.StopAsync(cancellationToken).ConfigureAwait(false);
        }

        await base.StopAsync(cancellationToken).ConfigureAwait(false);
    }
}
