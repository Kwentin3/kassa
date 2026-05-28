param(
    [string]$Showcase = "bolars",

    [Parameter(Mandatory = $true)]
    [string]$Version,

    [ValidateSet("production", "candidate")]
    [string]$Channel = "production",

    [ValidateSet("production", "candidate")]
    [string]$Status = "production",

    [string]$BaseUrl = "http://127.0.0.1:51400",

    [string]$PublicationRoot = "artifacts/github-pages-showcase-publication",

    [string]$RollbackVersion
)

$ErrorActionPreference = "Stop"

function Resolve-RepoPath([string]$RelativePath) {
    return [System.IO.Path]::GetFullPath((Join-Path (Join-Path $PSScriptRoot "..") $RelativePath))
}

function Assert-NoForbiddenBundleEntries([string]$BundlePath) {
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    $zip = [System.IO.Compression.ZipFile]::OpenRead($BundlePath)
    try {
        $rootIndex = $zip.Entries | Where-Object { $_.FullName -eq "index.html" } | Select-Object -First 1
        if (-not $rootIndex) {
            throw "bundle.zip must contain index.html in archive root."
        }

        $nestedOutputRoot = $zip.Entries | Where-Object {
            $_.FullName -like "bolars/index.html" -or
            $_.FullName -like "dist-1c/*"
        } | Select-Object -First 1
        if ($nestedOutputRoot) {
            throw "bundle.zip contains output folder instead of output contents: $($nestedOutputRoot.FullName)"
        }

        $forbidden = $zip.Entries | Where-Object {
            $_.Name -in @(".env", ".env.local", ".env.deploy", "config.json", "state.json") -or
            $_.Name -like "*.pem" -or
            $_.Name -like "*.pfx" -or
            $_.Name -like "*.key"
        } | Select-Object -First 1
        if ($forbidden) {
            throw "Forbidden file in bundle.zip: $($forbidden.FullName)"
        }
    }
    finally {
        $zip.Dispose()
    }
}

function Copy-ReleaseToPublicationLayout(
    [string]$ShowcaseId,
    [string]$ReleaseVersion,
    [string]$SourceRoot,
    [string]$ProductionManifest,
    [string]$TargetRoot
) {
    $versionTarget = Join-Path $TargetRoot "showcases/$ShowcaseId/versions/$ReleaseVersion"
    $productionTarget = Join-Path $TargetRoot "showcases/$ShowcaseId/production"

    New-Item -ItemType Directory -Force -Path $versionTarget | Out-Null
    New-Item -ItemType Directory -Force -Path $productionTarget | Out-Null

    Copy-Item -LiteralPath (Join-Path $SourceRoot "bundle.zip") -Destination (Join-Path $versionTarget "bundle.zip") -Force
    Copy-Item -LiteralPath (Join-Path $SourceRoot "manifest.json") -Destination (Join-Path $versionTarget "manifest.json") -Force
    Copy-Item -LiteralPath (Join-Path $SourceRoot "sha256.txt") -Destination (Join-Path $versionTarget "sha256.txt") -Force
    Copy-Item -LiteralPath $ProductionManifest -Destination (Join-Path $productionTarget "manifest.json") -Force
}

$publishParams = @{
    Showcase = $Showcase
    Version = $Version
    Channel = $Channel
    Status = $Status
    BaseUrl = $BaseUrl
}

if (-not [string]::IsNullOrWhiteSpace($RollbackVersion)) {
    $publishParams.RollbackVersion = $RollbackVersion
}

& (Resolve-RepoPath "scripts/publish-showcase-bundle.ps1") @publishParams
if ($LASTEXITCODE -ne 0) {
    throw "publish-showcase-bundle.ps1 failed with exit code $LASTEXITCODE"
}

$releaseRoot = Resolve-RepoPath "artifacts/showcases/$Showcase/$Version"
$productionManifest = Resolve-RepoPath "artifacts/showcases/$Showcase/production/manifest.json"
$publicationRootPath = Resolve-RepoPath $PublicationRoot

if (Test-Path -LiteralPath $publicationRootPath) {
    Remove-Item -LiteralPath $publicationRootPath -Recurse -Force
}

Copy-ReleaseToPublicationLayout `
    -ShowcaseId $Showcase `
    -ReleaseVersion $Version `
    -SourceRoot $releaseRoot `
    -ProductionManifest $productionManifest `
    -TargetRoot $publicationRootPath

$bundlePath = Join-Path $publicationRootPath "showcases/$Showcase/versions/$Version/bundle.zip"
$manifestPath = Join-Path $publicationRootPath "showcases/$Showcase/production/manifest.json"
$shaPath = Join-Path $publicationRootPath "showcases/$Showcase/versions/$Version/sha256.txt"

Assert-NoForbiddenBundleEntries -BundlePath $bundlePath

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$sha = (Get-FileHash -LiteralPath $bundlePath -Algorithm SHA256).Hash.ToLowerInvariant()
$shaText = (Get-Content -LiteralPath $shaPath -Raw).Trim()

if ($sha -ne $shaText) {
    throw "SHA-256 mismatch between bundle.zip and sha256.txt."
}

if ($sha -ne $manifest.sha256) {
    throw "SHA-256 mismatch between bundle.zip and manifest.json."
}

if ($manifest.bundleUrl -match "branch|main|dist|githubusercontent") {
    throw "bundleUrl must not reference branch/main/dist/source repo: $($manifest.bundleUrl)"
}

if ($manifest.bundleUrl -ne "$($BaseUrl.TrimEnd('/'))/showcases/$Showcase/versions/$Version/bundle.zip") {
    throw "Unexpected bundleUrl: $($manifest.bundleUrl)"
}

Write-Host "Showcase release pipeline dry-run passed."
Write-Host "  publicationRoot: $publicationRootPath"
Write-Host "  registryUrl:     $($BaseUrl.TrimEnd('/'))/showcases/$Showcase/production/manifest.json"
Write-Host "  bundleUrl:       $($manifest.bundleUrl)"
Write-Host "  sha256:          $sha"
