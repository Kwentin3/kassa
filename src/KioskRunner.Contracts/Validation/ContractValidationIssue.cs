namespace KioskRunner.Contracts.Validation;

public sealed record ContractValidationIssue(string Code, string Path, string Message);
