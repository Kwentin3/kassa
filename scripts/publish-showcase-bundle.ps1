param(
    [Parameter(Mandatory = $true)]
    [string]$Showcase,

    [Parameter(Mandatory = $true)]
    [string]$Version,

    [ValidateSet("production", "candidate")]
    [string]$Channel = "candidate",

    [ValidateSet("production", "candidate")]
    [string]$Status = "candidate",

    [Parameter(Mandatory = $true)]
    [string]$BaseUrl,

    [string]$RollbackVersion
)

$ErrorActionPreference = "Stop"

function Resolve-RepoPath([string]$RelativePath) {
    return [System.IO.Path]::GetFullPath((Join-Path (Join-Path $PSScriptRoot "..") $RelativePath))
}

function Convert-ToRelativeZipPath([string]$Root, [string]$Path) {
    $rootFull = [System.IO.Path]::GetFullPath($Root)
    if (-not $rootFull.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
        $rootFull = "$rootFull$([System.IO.Path]::DirectorySeparatorChar)"
    }

    $pathFull = [System.IO.Path]::GetFullPath($Path)
    $rootUri = [Uri]::new($rootFull)
    $pathUri = [Uri]::new($pathFull)
    return [Uri]::UnescapeDataString($rootUri.MakeRelativeUri($pathUri).ToString()).Replace('\', '/')
}

function Test-ForbiddenFile([string]$RelativePath, [string]$LeafName, [array]$Patterns) {
    foreach ($pattern in $Patterns) {
        if ([string]::IsNullOrWhiteSpace($pattern)) {
            continue
        }

        if ($LeafName -ieq $pattern -or $RelativePath -ieq $pattern -or $LeafName -like $pattern -or $RelativePath -like $pattern) {
            return $pattern
        }
    }

    return $null
}

function Invoke-BuildCommand([string]$Command) {
    Write-Host "Running buildCommand: $Command"

    if ($env:OS -eq "Windows_NT") {
        & cmd.exe /d /s /c $Command
    }
    else {
        & pwsh -NoProfile -Command $Command
    }

    if ($LASTEXITCODE -ne 0) {
        throw "buildCommand failed with exit code $LASTEXITCODE"
    }
}

function New-ZipFromDirectoryContents([string]$SourceDirectory, [string]$DestinationZip) {
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    if (Test-Path -LiteralPath $DestinationZip) {
        Remove-Item -LiteralPath $DestinationZip -Force
    }

    $zip = [System.IO.Compression.ZipFile]::Open($DestinationZip, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        $files = Get-ChildItem -LiteralPath $SourceDirectory -Recurse -File -Force
        foreach ($file in $files) {
            $entryName = Convert-ToRelativeZipPath -Root $SourceDirectory -Path $file.FullName
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    }
    finally {
        $zip.Dispose()
    }
}

function Write-Utf8NoBomFile([string]$Path, [string]$Content) {
    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

$descriptorPath = Resolve-RepoPath "showcases/$Showcase/showcase.config.json"
if (-not (Test-Path -LiteralPath $descriptorPath)) {
    throw "Showcase descriptor not found: $descriptorPath"
}

$descriptor = Get-Content -LiteralPath $descriptorPath -Raw | ConvertFrom-Json
if ($descriptor.showcaseId -ne $Showcase) {
    throw "Descriptor showcaseId '$($descriptor.showcaseId)' does not match -Showcase '$Showcase'."
}

if (-not $descriptor.requiredFiles -or $descriptor.requiredFiles.Count -eq 0) {
    throw "Descriptor must define requiredFiles."
}

if (-not $descriptor.forbiddenFiles -or $descriptor.forbiddenFiles.Count -eq 0) {
    throw "Descriptor must define forbiddenFiles."
}

Invoke-BuildCommand -Command $descriptor.buildCommand

$outputDir = Resolve-RepoPath $descriptor.outputDir
if (-not (Test-Path -LiteralPath $outputDir -PathType Container)) {
    throw "outputDir does not exist after build: $outputDir"
}

foreach ($requiredFile in $descriptor.requiredFiles) {
    $requiredPath = Join-Path $outputDir $requiredFile
    if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
        throw "Required file is missing from outputDir: $requiredFile"
    }
}

$indexPath = Join-Path $outputDir "index.html"
if (-not (Test-Path -LiteralPath $indexPath -PathType Leaf)) {
    throw "index.html must be in the root of outputDir: $outputDir"
}

$forbiddenPatterns = @($descriptor.forbiddenFiles)
$outputFiles = Get-ChildItem -LiteralPath $outputDir -Recurse -File -Force
foreach ($file in $outputFiles) {
    $relative = Convert-ToRelativeZipPath -Root $outputDir -Path $file.FullName
    $matched = Test-ForbiddenFile -RelativePath $relative -LeafName $file.Name -Patterns $forbiddenPatterns
    if ($matched) {
        throw "Forbidden file '$relative' matched pattern '$matched'."
    }
}

$artifactRoot = Resolve-RepoPath "artifacts/showcases/$Showcase/$Version"
New-Item -ItemType Directory -Force -Path $artifactRoot | Out-Null

$bundleName = if ([string]::IsNullOrWhiteSpace($descriptor.bundleName)) { "bundle.zip" } else { [string]$descriptor.bundleName }
$bundlePath = Join-Path $artifactRoot $bundleName
New-ZipFromDirectoryContents -SourceDirectory $outputDir -DestinationZip $bundlePath

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($bundlePath)
try {
    $hasRootIndex = $zip.Entries | Where-Object { $_.FullName -eq "index.html" } | Select-Object -First 1
    if (-not $hasRootIndex) {
        throw "bundle.zip must contain index.html in archive root."
    }

    $nestedOutputRoot = $zip.Entries | Where-Object { $_.FullName -like "bolars/index.html" -or $_.FullName -like "dist-1c/*" } | Select-Object -First 1
    if ($nestedOutputRoot) {
        throw "bundle.zip appears to contain outputDir itself instead of its contents: $($nestedOutputRoot.FullName)"
    }
}
finally {
    $zip.Dispose()
}

$sha256 = (Get-FileHash -LiteralPath $bundlePath -Algorithm SHA256).Hash.ToLowerInvariant()
$shaPath = Join-Path $artifactRoot "sha256.txt"
Write-Utf8NoBomFile -Path $shaPath -Content "$sha256`n"

$normalizedBaseUrl = $BaseUrl.TrimEnd("/")
$bundleUrl = "$normalizedBaseUrl/showcases/$Showcase/versions/$Version/$bundleName"

$buildCommit = $null
try {
    $commit = (& git rev-parse HEAD 2>$null)
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($commit)) {
        $buildCommit = $commit.Trim()
    }
}
catch {
    $buildCommit = $null
}

$manifest = [ordered]@{
    showcaseId = $descriptor.showcaseId
    channel = $Channel
    version = $Version
    status = $Status
    bundleUrl = $bundleUrl
    sha256 = $sha256
    bridgeContractVersion = $descriptor.bridgeContractVersion
    minRunnerVersion = $descriptor.minRunnerVersion
    publishedAt = [DateTimeOffset]::UtcNow.ToString("o")
    buildCommit = $buildCommit
}

if (-not [string]::IsNullOrWhiteSpace($RollbackVersion)) {
    $manifest.rollbackVersion = $RollbackVersion
}

$manifestPath = Join-Path $artifactRoot "manifest.json"
$manifestJson = $manifest | ConvertTo-Json -Depth 8
Write-Utf8NoBomFile -Path $manifestPath -Content "$manifestJson`n"

if ($Channel -eq "production" -and $Status -eq "production") {
    $productionDir = Resolve-RepoPath "artifacts/showcases/$Showcase/production"
    New-Item -ItemType Directory -Force -Path $productionDir | Out-Null
    Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $productionDir "manifest.json") -Force
}

Write-Host "Showcase bundle published:"
Write-Host "  bundle:   $bundlePath"
Write-Host "  sha256:   $sha256"
Write-Host "  manifest: $manifestPath"
