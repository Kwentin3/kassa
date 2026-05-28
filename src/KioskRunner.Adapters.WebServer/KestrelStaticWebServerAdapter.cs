using System.Net;
using System.Net.Sockets;
using KioskRunner.Contracts.Status;
using KioskRunner.Contracts.Validation;
using KioskRunner.Ports.WebServer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Hosting;

namespace KioskRunner.Adapters.WebServer;

public sealed class KestrelStaticWebServerAdapter : IWebServerHost
{
    public const string VersionHeaderName = "X-Kiosk-Showcase-Version";

    private readonly FileExtensionContentTypeProvider contentTypeProvider = new();
    private IHost? host;

    public async Task<WebServerStartResult> StartAsync(WebServerStartOptions options, CancellationToken cancellationToken)
    {
        if (!IPAddress.TryParse(options.ListenHost, out var listenAddress) || !IPAddress.IsLoopback(listenAddress))
        {
            return Failure(options, KioskRunnerErrorCodes.UnsafeListenHost, "listenHost must be loopback.");
        }

        try
        {
            var builder = WebApplication.CreateBuilder(new WebApplicationOptions());
            builder.WebHost.ConfigureKestrel(kestrel => kestrel.Listen(listenAddress, options.Port));

            var app = builder.Build();
            app.Use(async (context, next) =>
            {
                if (PathEquals(context.Request.Path, options.HealthPath))
                {
                    await WriteHealthAsync(context, options, context.RequestAborted).ConfigureAwait(false);
                    return;
                }

                if (PathEquals(context.Request.Path, options.StatusPath))
                {
                    await WriteStatusAsync(context, options, context.RequestAborted).ConfigureAwait(false);
                    return;
                }

                if (IsForbiddenPath(context.Request.Path, options.BasePath))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return;
                }

                if (ContainsTraversal(context))
                {
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    return;
                }

                await next(context).ConfigureAwait(false);
            });
            app.Run(async context => await ServeStaticAsync(context, options).ConfigureAwait(false));

            host = app;
            await host.StartAsync(cancellationToken).ConfigureAwait(false);
            return new WebServerStartResult(options.ListenHost, options.Port, ContractValidationResult.Success);
        }
        catch (IOException exception)
        {
            return Failure(options, KioskRunnerErrorCodes.PortInUse, exception.Message);
        }
        catch (SocketException exception)
        {
            return Failure(options, KioskRunnerErrorCodes.PortInUse, exception.Message);
        }
        catch (InvalidOperationException exception)
        {
            return Failure(options, KioskRunnerErrorCodes.WebServerFailed, exception.Message);
        }
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        if (host is not null)
        {
            await host.StopAsync(cancellationToken).ConfigureAwait(false);
            host.Dispose();
            host = null;
        }
    }

    public async ValueTask DisposeAsync()
    {
        await StopAsync(CancellationToken.None).ConfigureAwait(false);
    }

    private async Task ServeStaticAsync(HttpContext context, WebServerStartOptions options)
    {
        if (!context.Request.Path.StartsWithSegments(NormalizeBasePath(options.BasePath), out var remainder))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        var relativePath = remainder.Value?.TrimStart('/') ?? string.Empty;
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            relativePath = "index.html";
        }

        var root = EnsureTrailingSeparator(Path.GetFullPath(options.StaticRootPath));
        var candidate = Path.GetFullPath(Path.Combine(options.StaticRootPath, relativePath.Replace('/', Path.DirectorySeparatorChar)));

        if (!candidate.StartsWith(root, StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return;
        }

        if (Directory.Exists(candidate))
        {
            var directoryIndex = Path.Combine(candidate, "index.html");
            if (!File.Exists(directoryIndex))
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            candidate = directoryIndex;
        }

        if (!File.Exists(candidate))
        {
            var fallback = Path.Combine(options.StaticRootPath, "index.html");
            if (!File.Exists(fallback))
            {
                context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
                await context.Response.WriteAsync("no_current").ConfigureAwait(false);
                return;
            }

            candidate = fallback;
        }

        context.Response.Headers[VersionHeaderName] = await ResolveServedVersionAsync(options, context.RequestAborted).ConfigureAwait(false) ?? string.Empty;
        ApplyCachePolicy(context, candidate);
        context.Response.ContentType = ResolveContentType(candidate);
        await context.Response.SendFileAsync(candidate).ConfigureAwait(false);
    }

    private static async Task WriteHealthAsync(HttpContext context, WebServerStartOptions options, CancellationToken cancellationToken)
    {
        var payload = options.HealthStatusProvider is null
            ? new HealthPayload { Health = HealthValues.Ok }
            : await options.HealthStatusProvider.GetHealthAsync(cancellationToken).ConfigureAwait(false);
        var statusCode = string.Equals(payload.Health, HealthValues.Ok, StringComparison.Ordinal)
            ? StatusCodes.Status200OK
            : StatusCodes.Status503ServiceUnavailable;

        context.Response.StatusCode = statusCode;
        context.Response.Headers.CacheControl = "no-store";
        await context.Response.WriteAsJsonAsync(payload, cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    private static async Task WriteStatusAsync(HttpContext context, WebServerStartOptions options, CancellationToken cancellationToken)
    {
        var payload = options.HealthStatusProvider is null
            ? new RunnerStatusPayload { CurrentVersion = options.ServedVersion, ServedVersion = options.ServedVersion }
            : await options.HealthStatusProvider.GetStatusAsync(cancellationToken).ConfigureAwait(false);

        context.Response.Headers.CacheControl = "no-store";
        await context.Response.WriteAsJsonAsync(payload, cancellationToken: cancellationToken).ConfigureAwait(false);
    }

    private static async Task<string?> ResolveServedVersionAsync(WebServerStartOptions options, CancellationToken cancellationToken)
    {
        if (options.HealthStatusProvider is null)
        {
            return options.ServedVersion;
        }

        var status = await options.HealthStatusProvider.GetStatusAsync(cancellationToken).ConfigureAwait(false);
        return status.ServedVersion ?? options.ServedVersion;
    }

    private string ResolveContentType(string filePath)
    {
        return contentTypeProvider.TryGetContentType(filePath, out var contentType)
            ? contentType
            : "application/octet-stream";
    }

    private static void ApplyCachePolicy(HttpContext context, string filePath)
    {
        if (string.Equals(Path.GetFileName(filePath), "index.html", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.Headers.CacheControl = "no-store";
            return;
        }

        context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
    }

    private static bool IsForbiddenPath(PathString path, string basePath)
    {
        var value = path.Value ?? string.Empty;
        if (IsForbiddenRelativePath(value))
        {
            return true;
        }

        if (path.StartsWithSegments(NormalizeBasePath(basePath), out var remainder))
        {
            return IsForbiddenRelativePath(remainder.Value ?? string.Empty);
        }

        return false;
    }

    private static bool IsForbiddenRelativePath(string value)
    {
        return IsForbiddenDirectory(value, "/downloads") ||
            IsForbiddenDirectory(value, "/versions") ||
            IsForbiddenDirectory(value, "/logs") ||
            value.Equals("/state.json", StringComparison.OrdinalIgnoreCase) ||
            value.Equals("/config.json", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsForbiddenDirectory(string value, string directory)
    {
        return value.Equals(directory, StringComparison.OrdinalIgnoreCase) ||
            value.StartsWith($"{directory}/", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsTraversal(HttpContext context)
    {
        var path = Uri.UnescapeDataString(context.Request.Path.Value ?? string.Empty);
        var rawTarget = context.Features.Get<IHttpRequestFeature>()?.RawTarget ?? string.Empty;
        var decodedRawTarget = Uri.UnescapeDataString(rawTarget);

        return path.Contains("..", StringComparison.Ordinal) ||
            decodedRawTarget.Contains("..", StringComparison.Ordinal);
    }

    private static bool PathEquals(PathString requestPath, string configuredPath)
    {
        return requestPath.Equals(new PathString(configuredPath), StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeBasePath(string basePath)
    {
        if (basePath.Length > 1 && basePath.EndsWith("/", StringComparison.Ordinal))
        {
            return basePath.TrimEnd('/');
        }

        return basePath;
    }

    private static string EnsureTrailingSeparator(string path)
    {
        return path.EndsWith(Path.DirectorySeparatorChar)
            ? path
            : $"{path}{Path.DirectorySeparatorChar}";
    }

    private static WebServerStartResult Failure(WebServerStartOptions options, string code, string message)
    {
        return new WebServerStartResult(
            options.ListenHost,
            options.Port,
            ContractValidationResult.FromIssues(
            [
                new ContractValidationIssue(code, "webServer", message)
            ]));
    }
}
