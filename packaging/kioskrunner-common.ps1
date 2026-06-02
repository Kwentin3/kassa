$ErrorActionPreference = "Stop"

function Resolve-KioskRunnerConfigPath {
    param([string]$ConfigPath = (Join-Path $PSScriptRoot "config.json"))

    if ([System.IO.Path]::IsPathRooted($ConfigPath)) {
        return $ConfigPath
    }

    return [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $ConfigPath))
}

function Resolve-KioskRunnerExePath {
    param([string]$ExePath = (Join-Path $PSScriptRoot "KioskRunner.exe"))

    if ([System.IO.Path]::IsPathRooted($ExePath)) {
        return $ExePath
    }

    return [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $ExePath))
}

function Read-KioskRunnerConfig {
    param([string]$ConfigPath)

    if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
        return $null
    }

    return Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
}

function Get-KioskRunnerServiceName {
    param(
        [string]$ServiceName = "",
        $Config = $null
    )

    if (-not [string]::IsNullOrWhiteSpace($ServiceName)) {
        return $ServiceName
    }

    if ($Config -and -not [string]::IsNullOrWhiteSpace($Config.showcaseId)) {
        return "KioskRunner-$($Config.showcaseId)"
    }

    return "KioskRunner-bolars"
}

function Get-KioskRunnerServiceInfo {
    param([string]$ServiceName)

    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    $cim = Get-CimInstance -ClassName Win32_Service -Filter "Name='$ServiceName'" -ErrorAction SilentlyContinue

    [pscustomobject]@{
        Name = $ServiceName
        Installed = [bool]$service
        State = if ($service) { [string]$service.Status } else { "NotInstalled" }
        StartType = if ($service) { [string]$service.StartType } elseif ($cim) { [string]$cim.StartMode } else { $null }
        PathName = if ($cim) { $cim.PathName } else { $null }
        DisplayName = if ($service) { $service.DisplayName } else { $null }
    }
}

function Get-KioskRunnerConfigPathFromServicePath {
    param([string]$PathName)

    if ([string]::IsNullOrWhiteSpace($PathName)) {
        return $null
    }

    $match = [regex]::Match($PathName, '--config\s+(?:"(?<quoted>[^"]+)"|(?<plain>\S+))', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if (-not $match.Success) {
        return $null
    }

    if ($match.Groups["quoted"].Success) {
        return $match.Groups["quoted"].Value
    }

    return $match.Groups["plain"].Value
}

function Get-KioskRunnerLocalUrl {
    param($Config)

    if (-not $Config -or -not $Config.webServer) {
        return $null
    }

    $hostName = if ([string]::IsNullOrWhiteSpace($Config.webServer.listenHost)) { "127.0.0.1" } else { [string]$Config.webServer.listenHost }
    $port = if ($Config.webServer.port) { [int]$Config.webServer.port } else { 8787 }
    $basePath = if ([string]::IsNullOrWhiteSpace($Config.webServer.basePath)) { "/kiosk/$($Config.showcaseId)/" } else { [string]$Config.webServer.basePath }

    if (-not $basePath.StartsWith("/")) {
        $basePath = "/$basePath"
    }

    if (-not $basePath.EndsWith("/")) {
        $basePath = "$basePath/"
    }

    return "http://$hostName`:$port$basePath"
}

function Get-KioskRunnerHealthUrl {
    param($Config)

    if (-not $Config -or -not $Config.webServer) {
        return $null
    }

    $hostName = if ([string]::IsNullOrWhiteSpace($Config.webServer.listenHost)) { "127.0.0.1" } else { [string]$Config.webServer.listenHost }
    $port = if ($Config.webServer.port) { [int]$Config.webServer.port } else { 8787 }
    $path = if ([string]::IsNullOrWhiteSpace($Config.webServer.healthPath)) { "/healthz" } else { [string]$Config.webServer.healthPath }
    if (-not $path.StartsWith("/")) {
        $path = "/$path"
    }

    return "http://$hostName`:$port$path"
}

function Get-KioskRunnerStatusUrl {
    param($Config)

    if (-not $Config -or -not $Config.webServer) {
        return $null
    }

    $hostName = if ([string]::IsNullOrWhiteSpace($Config.webServer.listenHost)) { "127.0.0.1" } else { [string]$Config.webServer.listenHost }
    $port = if ($Config.webServer.port) { [int]$Config.webServer.port } else { 8787 }
    $path = if ([string]::IsNullOrWhiteSpace($Config.webServer.statusPath)) { "/runner/status" } else { [string]$Config.webServer.statusPath }
    if (-not $path.StartsWith("/")) {
        $path = "/$path"
    }

    return "http://$hostName`:$port$path"
}

function Invoke-KioskRunnerHttpJson {
    param(
        [string]$Url,
        [int]$TimeoutSec = 5
    )

    if ([string]::IsNullOrWhiteSpace($Url)) {
        return [pscustomobject]@{
            Url = $Url
            Ok = $false
            StatusCode = $null
            Body = $null
            Json = $null
            Error = "URL is empty."
        }
    }

    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
        $json = $null
        try {
            $json = $response.Content | ConvertFrom-Json
        }
        catch {
            $json = $null
        }

        return [pscustomobject]@{
            Url = $Url
            Ok = $true
            StatusCode = $response.StatusCode
            Body = $response.Content
            Json = $json
            Error = $null
        }
    }
    catch {
        $statusCode = $null
        if ($_.Exception.Response) {
            try { $statusCode = [int]$_.Exception.Response.StatusCode } catch { $statusCode = $null }
        }

        return [pscustomobject]@{
            Url = $Url
            Ok = $false
            StatusCode = $statusCode
            Body = $null
            Json = $null
            Error = $_.Exception.Message
        }
    }
}

function Invoke-KioskRunnerProcess {
    param(
        [string]$ExePath,
        [string[]]$Arguments
    )

    if (-not (Test-Path -LiteralPath $ExePath -PathType Leaf)) {
        return [pscustomobject]@{
            ExitCode = 1
            Output = ""
            Error = "KioskRunner.exe was not found: $ExePath"
        }
    }

    $outFile = [System.IO.Path]::GetTempFileName()
    try {
        $oldErrorActionPreference = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        & $ExePath @Arguments *> $outFile
        $exitCode = $LASTEXITCODE
        $ErrorActionPreference = $oldErrorActionPreference
        return [pscustomobject]@{
            ExitCode = $exitCode
            Output = (Get-Content -LiteralPath $outFile -Raw -ErrorAction SilentlyContinue).Trim()
            Error = ""
        }
    }
    finally {
        $ErrorActionPreference = "Stop"
        Remove-Item -LiteralPath $outFile -Force -ErrorAction SilentlyContinue
    }
}

function Write-KioskRunnerStatusSummary {
    param([pscustomobject]$Status)

    Write-Host "Service name:       $($Status.serviceName)"
    Write-Host "Service installed:  $($Status.serviceInstalled)"
    Write-Host "Service state:      $($Status.serviceState)"
    Write-Host "Startup type:       $($Status.startupType)"
    Write-Host "Service PathName:   $($Status.servicePathName)"
    Write-Host "Config path:        $($Status.configPath)"
    Write-Host "Registry URL:       $($Status.registryUrl)"
    Write-Host "Root dir:           $($Status.rootDir)"
    Write-Host "Local URL:          $($Status.localShowcaseUrl)"
    Write-Host "Health URL status:  $($Status.healthStatus)"
    Write-Host "Runner status HTTP: $($Status.runnerStatusHttp)"
    Write-Host "Current version:    $($Status.currentVersion)"
    Write-Host "Served version:     $($Status.servedVersion)"
    Write-Host "Last update status: $($Status.lastUpdateStatus)"
    Write-Host "Last error:         $($Status.lastError)"
    Write-Host "Last success:       $($Status.lastSuccessfulUpdateAt)"
}

function Get-KioskRunnerManagerStatus {
    param(
        [string]$ConfigPath = (Join-Path $PSScriptRoot "config.json"),
        [string]$ServiceName = ""
    )

    $resolvedConfig = Resolve-KioskRunnerConfigPath -ConfigPath $ConfigPath
    $config = Read-KioskRunnerConfig -ConfigPath $resolvedConfig
    $resolvedServiceName = Get-KioskRunnerServiceName -ServiceName $ServiceName -Config $config
    $service = Get-KioskRunnerServiceInfo -ServiceName $resolvedServiceName
    $serviceConfigPath = Get-KioskRunnerConfigPathFromServicePath -PathName $service.PathName
    if (-not $config -and -not [string]::IsNullOrWhiteSpace($serviceConfigPath) -and (Test-Path -LiteralPath $serviceConfigPath -PathType Leaf)) {
        $resolvedConfig = $serviceConfigPath
        $config = Read-KioskRunnerConfig -ConfigPath $resolvedConfig
    }

    $localUrl = Get-KioskRunnerLocalUrl -Config $config
    $healthUrl = Get-KioskRunnerHealthUrl -Config $config
    $statusUrl = Get-KioskRunnerStatusUrl -Config $config
    $health = Invoke-KioskRunnerHttpJson -Url $healthUrl
    $runnerStatus = Invoke-KioskRunnerHttpJson -Url $statusUrl
    $statusJson = $runnerStatus.Json
    if (-not $statusJson -and $config) {
        $exePath = $null
        if (-not [string]::IsNullOrWhiteSpace($service.PathName)) {
            $exeMatch = [regex]::Match($service.PathName, '^(?:"(?<quoted>[^"]+KioskRunner\.exe)"|(?<plain>\S+KioskRunner\.exe))', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
            if ($exeMatch.Success) {
                $exePath = if ($exeMatch.Groups["quoted"].Success) { $exeMatch.Groups["quoted"].Value } else { $exeMatch.Groups["plain"].Value }
            }
        }

        if ([string]::IsNullOrWhiteSpace($exePath)) {
            $exePath = Join-Path (Split-Path -Parent $resolvedConfig) "KioskRunner.exe"
        }

        if (Test-Path -LiteralPath $exePath -PathType Leaf) {
            $cliStatus = Invoke-KioskRunnerProcess -ExePath $exePath -Arguments @("status", "--config", $resolvedConfig)
            if ($cliStatus.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($cliStatus.Output)) {
                try {
                    $statusJson = $cliStatus.Output | ConvertFrom-Json
                }
                catch {
                    $statusJson = $null
                }
            }
        }
    }

    return [pscustomobject]@{
        serviceName = $resolvedServiceName
        serviceInstalled = $service.Installed
        serviceState = $service.State
        startupType = $service.StartType
        servicePathName = $service.PathName
        serviceDisplayName = $service.DisplayName
        configPath = $resolvedConfig
        configExists = [bool]$config
        registryUrl = if ($config) { $config.registryUrl } else { $null }
        rootDir = if ($config) { $config.rootDir } else { $null }
        localShowcaseUrl = $localUrl
        healthUrl = $healthUrl
        statusUrl = $statusUrl
        healthStatus = if ($health.Ok) { "$($health.StatusCode) $($health.Body)" } else { "unavailable: $($health.Error)" }
        runnerStatusHttp = if ($runnerStatus.Ok) { [string]$runnerStatus.StatusCode } else { "unavailable: $($runnerStatus.Error)" }
        currentVersion = if ($statusJson) { $statusJson.currentVersion } else { $null }
        servedVersion = if ($statusJson) { $statusJson.servedVersion } else { $null }
        previousVersion = if ($statusJson) { $statusJson.previousVersion } else { $null }
        lastUpdateStatus = if ($statusJson) { $statusJson.lastUpdateStatus } else { $null }
        lastError = if ($statusJson) { $statusJson.lastError } else { $null }
        lastSuccessfulUpdateAt = if ($statusJson) { $statusJson.lastSuccessfulUpdateAt } else { $null }
    }
}
