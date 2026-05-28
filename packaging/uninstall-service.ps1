param(
    [string]$ServiceName = "",
    [string]$ConfigPath = (Join-Path $PSScriptRoot "config.json"),
    [switch]$Force
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "kioskrunner-common.ps1")

$ConfigPath = Resolve-KioskRunnerConfigPath -ConfigPath $ConfigPath

if ([string]::IsNullOrWhiteSpace($ServiceName)) {
    if (-not (Test-Path -LiteralPath $ConfigPath)) {
        throw "ConfigPath is required when ServiceName is not provided."
    }

    $config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
    if ([string]::IsNullOrWhiteSpace($config.showcaseId)) {
        throw "showcaseId is required in config.json when ServiceName is not provided."
    }

    $ServiceName = Get-KioskRunnerServiceName -Config $config
}

$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "Service is not installed: $ServiceName"
    return
}

if (-not $Force) {
    Write-Warning "This removes only the Windows Service. It will not delete config.json, rootDir, current, versions or logs."
    $answer = Read-Host "Type UNINSTALL to remove service '$ServiceName'"
    if ($answer -ne "UNINSTALL") {
        Write-Host "Uninstall cancelled."
        return
    }
}

if ($service.Status -ne "Stopped") {
    Stop-Service -Name $ServiceName -Force -ErrorAction Stop
    $service.WaitForStatus("Stopped", [TimeSpan]::FromSeconds(30))
}

sc.exe delete $ServiceName | Out-Null
Write-Host "Uninstalled service: $ServiceName"
Write-Host "Data was not deleted."
