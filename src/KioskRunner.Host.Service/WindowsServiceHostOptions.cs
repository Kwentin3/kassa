using KioskRunner.Ports.WebServer;

namespace KioskRunner.Host.Service;

public sealed record WindowsServiceHostOptions(
    WebServerStartOptions WebServer,
    bool AutoUpdate,
    TimeSpan CheckInterval);
