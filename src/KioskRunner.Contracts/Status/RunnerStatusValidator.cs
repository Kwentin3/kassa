using KioskRunner.Contracts.Validation;

namespace KioskRunner.Contracts.Status;

public static class RunnerStatusValidator
{
    public static ContractValidationResult Validate(RunnerStatusPayload? payload)
    {
        if (payload is null)
        {
            return ContractValidationResult.FromIssues(
            [
                new ContractValidationIssue(KioskRunnerErrorCodes.InvalidHealth, "$", "Status payload is required.")
            ]);
        }

        if (!HealthValues.All.Contains(payload.Health))
        {
            return ContractValidationResult.FromIssues(
            [
                new ContractValidationIssue(KioskRunnerErrorCodes.InvalidHealth, "$.health", "health is not a known value.")
            ]);
        }

        return ContractValidationResult.Success;
    }
}
