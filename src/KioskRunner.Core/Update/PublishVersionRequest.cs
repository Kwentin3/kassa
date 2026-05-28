namespace KioskRunner.Core.Update;

public sealed record PublishVersionRequest(
    string RootDir,
    string Version,
    string CurrentSha256,
    string StagingDirectory);
