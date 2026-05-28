using System.Text.RegularExpressions;

namespace KioskRunner.Contracts.Common;

public static partial class Sha256Shape
{
    public static bool IsValid(string? value)
    {
        return !string.IsNullOrWhiteSpace(value) && Sha256Regex().IsMatch(value);
    }

    [GeneratedRegex("^[a-fA-F0-9]{64}$", RegexOptions.CultureInvariant)]
    private static partial Regex Sha256Regex();
}
