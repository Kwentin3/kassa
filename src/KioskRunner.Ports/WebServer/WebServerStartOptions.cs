using KioskRunner.Ports.Status;

namespace KioskRunner.Ports.WebServer;

public sealed record WebServerStartOptions(
    string ListenHost,
    int Port,
    string BasePath,
    string StaticRootPath,
    string HealthPath,
    string StatusPath,
    string? ServedVersion,
    IHealthStatusProvider? HealthStatusProvider = null);
