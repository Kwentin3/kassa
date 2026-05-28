param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot "config.json"),
    [switch]$Json,
    [switch]$SkipBundleProbe
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "kioskrunner-common.ps1")

$resolvedConfig = Resolve-KioskRunnerConfigPath -ConfigPath $ConfigPath
$config = Read-KioskRunnerConfig -ConfigPath $resolvedConfig
if (-not $config) {
    throw "config.json was not found: $resolvedConfig"
}

if ([string]::IsNullOrWhiteSpace($config.registryUrl)) {
    throw "registryUrl is missing in config.json."
}

$registryUrl = [string]$config.registryUrl
try {
    $manifestResponse = Invoke-WebRequest -Uri $registryUrl -UseBasicParsing -TimeoutSec 30
}
catch {
    $result = [pscustomobject]@{
        configPath = $resolvedConfig
        registryUrl = $registryUrl
        reachable = $false
        error = $_.Exception.Message
    }

    if ($Json) { $result | ConvertTo-Json -Depth 8 }
    else {
        Write-Host "Registry URL: $registryUrl"
        Write-Host "Reachable:    no"
        Write-Host "Error:        $($result.error)"
    }

    exit 1
}

$body = $manifestResponse.Content
if ($body.TrimStart().StartsWith("<")) {
    $result = [pscustomobject]@{
        configPath = $resolvedConfig
        registryUrl = $registryUrl
        reachable = $true
        statusCode = $manifestResponse.StatusCode
        isJson = $false
        error = "Registry URL returned HTML, not JSON manifest."
    }

    if ($Json) { $result | ConvertTo-Json -Depth 8 }
    else {
        Write-Host "Registry URL: $registryUrl"
        Write-Host "Reachable:    yes"
        Write-Host "Status code:  $($manifestResponse.StatusCode)"
        Write-Host "Manifest:     invalid, HTML response"
    }

    exit 1
}

try {
    $manifest = $body | ConvertFrom-Json
}
catch {
    $result = [pscustomobject]@{
        configPath = $resolvedConfig
        registryUrl = $registryUrl
        reachable = $true
        statusCode = $manifestResponse.StatusCode
        isJson = $false
        error = $_.Exception.Message
    }

    if ($Json) { $result | ConvertTo-Json -Depth 8 }
    else {
        Write-Host "Registry URL: $registryUrl"
        Write-Host "Reachable:    yes"
        Write-Host "Status code:  $($manifestResponse.StatusCode)"
        Write-Host "Manifest:     invalid JSON"
        Write-Host "Error:        $($result.error)"
    }

    exit 1
}

$bundleReachable = $null
$bundleStatusCode = $null
$bundleError = $null
if (-not $SkipBundleProbe -and -not [string]::IsNullOrWhiteSpace($manifest.bundleUrl)) {
    try {
        $bundleRequest = [System.Net.WebRequest]::Create([string]$manifest.bundleUrl)
        $bundleRequest.Method = "HEAD"
        $bundleRequest.Timeout = 15000
        $bundleResponse = $bundleRequest.GetResponse()
        try {
            $bundleReachable = $true
            $bundleStatusCode = [int]$bundleResponse.StatusCode
        }
        finally {
            $bundleResponse.Dispose()
        }
    }
    catch {
        try {
            $request = [System.Net.WebRequest]::Create([string]$manifest.bundleUrl)
            $request.Method = "GET"
            $request.Timeout = 15000
            $request.AddRange(0, 0)
            $response = $request.GetResponse()
            try {
                $bundleReachable = $true
                $bundleStatusCode = [int]$response.StatusCode
            }
            finally {
                $response.Dispose()
            }
        }
        catch {
            $bundleReachable = $false
            $bundleError = $_.Exception.Message
        }
    }
}

$result = [pscustomobject]@{
    configPath = $resolvedConfig
    registryUrl = $registryUrl
    reachable = $true
    statusCode = $manifestResponse.StatusCode
    isJson = $true
    showcaseId = $manifest.showcaseId
    channel = $manifest.channel
    status = $manifest.status
    version = $manifest.version
    bundleUrl = $manifest.bundleUrl
    sha256 = $manifest.sha256
    minRunnerVersion = $manifest.minRunnerVersion
    bridgeContractVersion = $manifest.bridgeContractVersion
    buildCommit = $manifest.buildCommit
    bundleReachable = $bundleReachable
    bundleStatusCode = $bundleStatusCode
    bundleError = $bundleError
}

if ($Json) {
    $result | ConvertTo-Json -Depth 8
    exit 0
}

Write-Host "Registry URL:        $($result.registryUrl)"
Write-Host "Reachable:           yes"
Write-Host "HTTP status:         $($result.statusCode)"
Write-Host "Manifest JSON:       yes"
Write-Host "showcaseId:          $($result.showcaseId)"
Write-Host "channel:             $($result.channel)"
Write-Host "status:              $($result.status)"
Write-Host "version:             $($result.version)"
Write-Host "bundleUrl:           $($result.bundleUrl)"
Write-Host "sha256:              $($result.sha256)"
Write-Host "minRunnerVersion:    $($result.minRunnerVersion)"
Write-Host "bridgeContract:      $($result.bridgeContractVersion)"
Write-Host "buildCommit:         $($result.buildCommit)"
Write-Host "bundle reachable:    $($result.bundleReachable)"
Write-Host "bundle status/error: $($result.bundleStatusCode)$($result.bundleError)"

if ($result.channel -ne "production" -or $result.status -ne "production") {
    Write-Warning "Manifest is not production/production. Production runner will reject it."
}
