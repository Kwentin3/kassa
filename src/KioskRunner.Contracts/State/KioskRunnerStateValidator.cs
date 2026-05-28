using KioskRunner.Contracts.Common;
using KioskRunner.Contracts.Validation;

namespace KioskRunner.Contracts.State;

public static class KioskRunnerStateValidator
{
    public static ContractValidationResult Validate(KioskRunnerState? state)
    {
        if (state is null)
        {
            return ContractValidationResult.FromIssues(
            [
                new ContractValidationIssue(KioskRunnerErrorCodes.InvalidState, "$", "State is required.")
            ]);
        }

        var issues = new List<ContractValidationIssue>();

        if (!string.IsNullOrWhiteSpace(state.CurrentSha256) && !Sha256Shape.IsValid(state.CurrentSha256))
        {
            issues.Add(new ContractValidationIssue(KioskRunnerErrorCodes.Sha256Invalid, "$.currentSha256", "currentSha256 must be 64 hex characters."));
        }

        if (!string.IsNullOrWhiteSpace(state.LastUpdateStatus) && !UpdateStatusValues.All.Contains(state.LastUpdateStatus))
        {
            issues.Add(new ContractValidationIssue(KioskRunnerErrorCodes.InvalidUpdateStatus, "$.lastUpdateStatus", "lastUpdateStatus is not a known value."));
        }

        if (!string.IsNullOrWhiteSpace(state.WebServerStatus) && !WebServerStatusValues.All.Contains(state.WebServerStatus))
        {
            issues.Add(new ContractValidationIssue(KioskRunnerErrorCodes.InvalidWebServerStatus, "$.webServerStatus", "webServerStatus is not a known value."));
        }

        return ContractValidationResult.FromIssues(issues);
    }
}
