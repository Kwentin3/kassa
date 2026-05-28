namespace KioskRunner.Contracts.Validation;

public sealed class ContractValidationResult
{
    private ContractValidationResult(IReadOnlyList<ContractValidationIssue> issues)
    {
        Issues = issues;
    }

    public bool IsValid => Issues.Count == 0;

    public IReadOnlyList<ContractValidationIssue> Issues { get; }

    public static ContractValidationResult Success { get; } = new([]);

    public static ContractValidationResult FromIssues(IEnumerable<ContractValidationIssue> issues)
    {
        var issueList = issues.ToArray();

        return issueList.Length == 0
            ? Success
            : new ContractValidationResult(issueList);
    }
}
