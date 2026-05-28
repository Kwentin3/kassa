namespace KioskRunner.Core.Rollback;

public sealed record RollbackRequest(string RootDir, string? Reason = null);
