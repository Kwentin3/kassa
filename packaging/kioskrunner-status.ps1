param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot "config.json"),
    [string]$ServiceName = "",
    [switch]$Json
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "kioskrunner-common.ps1")

$status = Get-KioskRunnerManagerStatus -ConfigPath $ConfigPath -ServiceName $ServiceName

if ($Json) {
    $status | ConvertTo-Json -Depth 8
    exit 0
}

Write-KioskRunnerStatusSummary -Status $status

if (-not $status.configExists) {
    Write-Warning "config.json was not found. Copy config.example.json to config.json, then verify registryUrl/rootDir/webServer settings."
}

if (-not $status.serviceInstalled) {
    Write-Warning "Service is not installed. Use manage-kioskrunner.ps1 or install-service.ps1."
}
