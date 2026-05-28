using System.Text.Json;
using KioskRunner.Adapters.FileSystem.Hash;
using KioskRunner.Adapters.FileSystem.Logging;
using KioskRunner.Adapters.FileSystem.Bundles;
using KioskRunner.Adapters.FileSystem.Config;
using KioskRunner.Adapters.FileSystem.Storage;
using KioskRunner.Adapters.FileSystem.Time;
using KioskRunner.Adapters.Http.Bundles;
using KioskRunner.Adapters.Http.Manifest;
using KioskRunner.Adapters.WebServer;
using KioskRunner.Adapters.Zip;
using KioskRunner.Contracts.Common;
using KioskRunner.Contracts.Config;
using KioskRunner.Contracts.State;
using KioskRunner.Contracts.Status;
using KioskRunner.Contracts.Validation;
using KioskRunner.Core.Config;
using KioskRunner.Core.Rollback;
using KioskRunner.Core.Status;
using KioskRunner.Core.Update;
using KioskRunner.Host.Service;
using KioskRunner.Ports.WebServer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace KioskRunner.Host.Cli;

public static class CliApplication
{
    public static async Task<int> RunAsync(string[] args, TextWriter stdout, TextWriter stderr, CancellationToken cancellationToken)
    {
        if (args.Length == 0 || args.Contains("--help", StringComparer.OrdinalIgnoreCase) || args.Contains("-h", StringComparer.OrdinalIgnoreCase))
        {
            await stdout.WriteLineAsync(CliCommandCatalog.BuildHelpText()).ConfigureAwait(false);
            return 0;
        }

        var command = args[0];
        if (!CliCommandCatalog.IsKnownCommand(command))
        {
            await stderr.WriteLineAsync($"Unknown command: {command}").ConfigureAwait(false);
            await stderr.WriteLineAsync("Run KioskRunner --help for the command list.").ConfigureAwait(false);
            return 2;
        }

        if (string.Equals(command, "rollback", StringComparison.OrdinalIgnoreCase))
        {
            return await RunRollbackAsync(args[1..], stdout, stderr, cancellationToken).ConfigureAwait(false);
        }

        if (string.Equals(command, "update-once", StringComparison.OrdinalIgnoreCase))
        {
            return await RunUpdateOnceAsync(args[1..], stdout, stderr, cancellationToken).ConfigureAwait(false);
        }

        if (string.Equals(command, "status", StringComparison.OrdinalIgnoreCase))
        {
            return await RunStatusAsync(args[1..], stdout, stderr, cancellationToken).ConfigureAwait(false);
        }

        if (string.Equals(command, "service", StringComparison.OrdinalIgnoreCase))
        {
            return await RunServiceAsync(args[1..], stderr, cancellationToken).ConfigureAwait(false);
        }

        await stderr.WriteLineAsync($"Command '{command}' is declared but not implemented in the current slice.").ConfigureAwait(false);
        return 3;
    }

    private static async Task<int> RunRollbackAsync(string[] args, TextWriter stdout, TextWriter stderr, CancellationToken cancellationToken)
    {
        var configPath = ParseConfigPath(args);
        var configLoad = await LoadConfigAsync(configPath, cancellationToken).ConfigureAwait(false);
        if (!configLoad.IsValid || configLoad.Config is null)
        {
            await WriteIssuesAsync(stderr, configLoad.Validation).ConfigureAwait(false);
            return 1;
        }

        var service = new RollbackService(
            new JsonStateStore(),
            new StaticBundleValidator(),
            new JunctionCurrentPublisher(),
            new WindowsLocalStorageLayout(),
            new SystemClock());

        var result = await service
            .RollbackAsync(new RollbackRequest(configLoad.Config.RootDir!), cancellationToken)
            .ConfigureAwait(false);
        if (!result.IsValid)
        {
            await WriteIssuesAsync(stderr, result.Validation).ConfigureAwait(false);
            return 1;
        }

        await stdout.WriteLineAsync($"Rolled back to {result.RestoredVersion}.").ConfigureAwait(false);
        return 0;
    }

    private static async Task<int> RunUpdateOnceAsync(string[] args, TextWriter stdout, TextWriter stderr, CancellationToken cancellationToken)
    {
        var configPath = ParseConfigPath(args);
        var configLoad = await LoadConfigAsync(configPath, cancellationToken).ConfigureAwait(false);
        if (!configLoad.IsValid || configLoad.Config is null)
        {
            await WriteIssuesAsync(stderr, configLoad.Validation).ConfigureAwait(false);
            return 1;
        }

        var service = CreateUpdateOnceService();
        var result = await service.RunAsync(ToUpdateOptions(configLoad.Config), cancellationToken).ConfigureAwait(false);
        await stdout.WriteLineAsync($"Update status: {result.UpdateStatus}; version: {result.Version ?? "-"}").ConfigureAwait(false);
        if (!result.IsValid)
        {
            await WriteIssuesAsync(stderr, result.Validation).ConfigureAwait(false);
            return 1;
        }

        return 0;
    }

    private static async Task<int> RunStatusAsync(string[] args, TextWriter stdout, TextWriter stderr, CancellationToken cancellationToken)
    {
        var configPath = ParseConfigPath(args);
        var configLoad = await LoadConfigAsync(configPath, cancellationToken).ConfigureAwait(false);
        if (!configLoad.IsValid || configLoad.Config is null)
        {
            await WriteIssuesAsync(stderr, configLoad.Validation).ConfigureAwait(false);
            return 1;
        }

        var stateLoad = await new JsonStateStore().LoadAsync(configLoad.Config.RootDir!, cancellationToken).ConfigureAwait(false);
        var state = stateLoad.State;
        var health = !stateLoad.IsValid
            ? HealthValues.UnhealthyInvalidState
            : string.IsNullOrWhiteSpace(state?.CurrentVersion)
                ? HealthValues.DegradedNoCurrent
                : HealthValues.Ok;
        var payload = new RunnerStatusPayload
        {
            RunnerId = configLoad.Config.RunnerId,
            ShowcaseId = configLoad.Config.ShowcaseId,
            Health = health,
            RunnerVersion = RunnerDefaults.Version,
            WebServer = new WebServerStatusPayload
            {
                Listening = false,
                ListenHost = configLoad.Config.WebServer?.ListenHost,
                Port = configLoad.Config.WebServer?.Port ?? 0,
                BasePath = configLoad.Config.WebServer?.BasePath
            },
            CurrentVersion = state?.CurrentVersion,
            PreviousVersion = state?.PreviousVersion,
            ServedVersion = state?.CurrentVersion,
            LastCheckAt = state?.LastCheckAt,
            LastUpdateStatus = state?.LastUpdateStatus,
            LastSuccessfulUpdateAt = state?.LastSuccessfulUpdateAt,
            LastError = SanitizeStatusError(state?.LastError)
        };

        await stdout.WriteLineAsync(JsonSerializer.Serialize(payload, new JsonSerializerOptions(JsonSerializerDefaults.Web) { WriteIndented = true })).ConfigureAwait(false);
        return stateLoad.IsValid ? 0 : 1;
    }

    private static async Task<int> RunServiceAsync(string[] args, TextWriter stderr, CancellationToken cancellationToken)
    {
        var configPath = ParseConfigPath(args);
        var configLoad = await LoadConfigAsync(configPath, cancellationToken).ConfigureAwait(false);
        if (!configLoad.IsValid || configLoad.Config is null)
        {
            await WriteIssuesAsync(stderr, configLoad.Validation).ConfigureAwait(false);
            return 1;
        }

        var builder = global::Microsoft.Extensions.Hosting.Host.CreateDefaultBuilder(args)
            .UseWindowsService(options => options.ServiceName = $"KioskRunner-{configLoad.Config.ShowcaseId}")
            .ConfigureServices(services =>
            {
                services.AddHostedService(_ => new KioskRunnerWorker(
                    configLoad.Config,
                    CreateUpdateOnceService,
                    static () => new KestrelStaticWebServerAdapter(),
                    (webServer, updateService) => new WindowsServiceHostAdapter(
                        webServer,
                        token => updateService.RunAsync(ToUpdateOptions(configLoad.Config), token))));
            });

        await builder.Build().RunAsync(cancellationToken).ConfigureAwait(false);
        return 0;
    }

    public static WebServerStartOptions BuildWebServerOptions(RunnerConfig config, bool listening)
    {
        var rootDir = config.RootDir!;
        var healthProvider = new HealthStatusProvider(
            new HealthStatusProviderOptions(
                config,
                ContractValidationResult.Success,
                RunnerDefaults.Version,
                new WebServerRuntimeSnapshot
                {
                    Listening = listening,
                    ListenHost = config.WebServer!.ListenHost,
                    Port = config.WebServer.Port,
                    BasePath = config.WebServer.BasePath,
                    ServedVersion = null
                }),
            new JsonStateStore());

        return new WebServerStartOptions(
            config.WebServer!.ListenHost!,
            config.WebServer.Port,
            config.WebServer.BasePath!,
            Path.Combine(rootDir, config.WebServer.StaticRoot!),
            config.WebServer.HealthPath!,
            config.WebServer.StatusPath!,
            null,
            healthProvider);
    }

    private static UpdateOnceService CreateUpdateOnceService()
    {
        var httpClient = new HttpClient();
        return new UpdateOnceService(
            new HttpManifestClient(httpClient),
            new HttpBundleDownloader(httpClient),
            new Sha256HashVerifier(),
            new ZipArchiveExtractor(),
            new StaticBundleValidator(),
            new FileSystemVersionStore(),
            new JunctionCurrentPublisher(),
            new JsonStateStore(),
            new WindowsLocalStorageLayout(),
            new SystemClock(),
            new JsonLinesRunnerLogger());
    }

    private static UpdateOnceOptions ToUpdateOptions(RunnerConfig config)
    {
        return new UpdateOnceOptions(
            config,
            RunnerDefaults.Version,
            new HashSet<string>(StringComparer.Ordinal)
            {
                "bolars-web-1c-v0.1"
            });
    }

    private static Task<KioskRunner.Ports.Config.ConfigProviderResult> LoadConfigAsync(string configPath, CancellationToken cancellationToken)
    {
        return new ConfigLoadService(new JsonFileConfigProvider()).LoadAsync(configPath, cancellationToken);
    }

    private static string ParseConfigPath(string[] args)
    {
        for (var index = 0; index < args.Length; index++)
        {
            var arg = args[index];
            if (string.Equals(arg, "--config", StringComparison.OrdinalIgnoreCase) && index + 1 < args.Length)
            {
                return args[index + 1];
            }

            if (arg.StartsWith("--config=", StringComparison.OrdinalIgnoreCase))
            {
                return arg["--config=".Length..];
            }
        }

        return "config.json";
    }

    private static string? SanitizeStatusError(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Contains("token", StringComparison.OrdinalIgnoreCase) ||
            value.Contains("password", StringComparison.OrdinalIgnoreCase) ||
            value.Contains("secret", StringComparison.OrdinalIgnoreCase)
            ? "[redacted]"
            : value.Replace('\r', ' ').Replace('\n', ' ');
    }

    private static async Task WriteIssuesAsync(TextWriter writer, ContractValidationResult validation)
    {
        foreach (var issue in validation.Issues)
        {
            await writer.WriteLineAsync($"{issue.Code}: {issue.Path} {issue.Message}").ConfigureAwait(false);
        }
    }
}
