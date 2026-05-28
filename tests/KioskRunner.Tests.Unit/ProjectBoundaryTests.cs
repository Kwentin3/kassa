using System.Xml.Linq;

namespace KioskRunner.Tests.Unit;

public sealed class ProjectBoundaryTests
{
    [Fact]
    public void ContractsProjectHasNoProjectReferences()
    {
        var references = ReadProjectReferences("src/KioskRunner.Contracts/KioskRunner.Contracts.csproj");

        Assert.Empty(references);
    }

    [Fact]
    public void PortsProjectReferencesOnlyContracts()
    {
        var references = ReadProjectReferences("src/KioskRunner.Ports/KioskRunner.Ports.csproj");

        Assert.Equal(["KioskRunner.Contracts"], references);
    }

    [Fact]
    public void CoreProjectReferencesOnlyContractsAndPorts()
    {
        var references = ReadProjectReferences("src/KioskRunner.Core/KioskRunner.Core.csproj");

        Assert.Equal(["KioskRunner.Contracts", "KioskRunner.Ports"], references);
    }

    [Fact]
    public void CoreSourceDoesNotUseInfrastructureApisDirectly()
    {
        var coreRoot = Path.Combine(RepositoryRoot.Find(), "src", "KioskRunner.Core");
        var forbiddenTokens = new[]
        {
            "System.IO",
            "Path.",
            "File.",
            "Directory.",
            "IOException",
            "DirectoryNotFoundException",
            "ZipArchive",
            "HttpClient",
            "Kestrel",
            "WindowsService",
            "ProcessStartInfo"
        };

        var violations = Directory
            .EnumerateFiles(coreRoot, "*.cs", SearchOption.AllDirectories)
            .Where(file => !file.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase) &&
                !file.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase))
            .SelectMany(file => forbiddenTokens
                .Where(token => File.ReadAllText(file).Contains(token, StringComparison.Ordinal))
                .Select(token => $"{Path.GetRelativePath(RepositoryRoot.Find(), file)} contains {token}"))
            .ToArray();

        Assert.Empty(violations);
    }

    [Theory]
    [InlineData("src/KioskRunner.Adapters.FileSystem/KioskRunner.Adapters.FileSystem.csproj")]
    [InlineData("src/KioskRunner.Adapters.Http/KioskRunner.Adapters.Http.csproj")]
    [InlineData("src/KioskRunner.Adapters.Zip/KioskRunner.Adapters.Zip.csproj")]
    [InlineData("src/KioskRunner.Adapters.WebServer/KioskRunner.Adapters.WebServer.csproj")]
    public void AdapterProjectsDoNotReferenceCoreOrHostLayers(string projectPath)
    {
        var references = ReadProjectReferences(projectPath);

        Assert.Contains("KioskRunner.Contracts", references);
        Assert.Contains("KioskRunner.Ports", references);
        Assert.DoesNotContain("KioskRunner.Core", references);
        Assert.DoesNotContain(references, reference => reference.StartsWith("KioskRunner.Host.", StringComparison.Ordinal));
    }

    private static string[] ReadProjectReferences(string relativeProjectPath)
    {
        var projectFile = Path.Combine(RepositoryRoot.Find(), relativeProjectPath);
        var document = XDocument.Load(projectFile);

        return document
            .Descendants("ProjectReference")
            .Select(element => Path.GetFileNameWithoutExtension(element.Attribute("Include")?.Value))
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Order(StringComparer.Ordinal)
            .ToArray()!;
    }

}
