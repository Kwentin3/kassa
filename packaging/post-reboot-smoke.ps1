param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot "config.json"),
    [string]$ServiceName = "",
    [switch]$Json
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "kioskrunner-common.ps1")

$status = Get-KioskRunnerManagerStatus -ConfigPath $ConfigPath -ServiceName $ServiceName
$checks = [ordered]@{
    serviceInstalled = [bool]$status.serviceInstalled
    startupTypeAutomatic = ($status.startupType -eq "Automatic")
    serviceRunning = ($status.serviceState -eq "Running")
    healthOk = ($status.healthStatus -like "200*")
    runnerStatusOk = ([string]$status.runnerStatusHttp -eq "200")
    currentVersionPresent = -not [string]::IsNullOrWhiteSpace($status.currentVersion)
    servedVersionMatchesCurrent = (-not [string]::IsNullOrWhiteSpace($status.currentVersion) -and $status.currentVersion -eq $status.servedVersion)
}

$result = [pscustomobject]@{
    serviceName = $status.serviceName
    configPath = $status.configPath
    localShowcaseUrl = $status.localShowcaseUrl
    checks = $checks
    passed = -not ($checks.Values -contains $false)
    status = $status
}

if ($Json) {
    $result | ConvertTo-Json -Depth 10
}
else {
    Write-Host "Post-reboot smoke check"
    Write-Host "Service: $($status.serviceName)"
    Write-Host "Local URL: $($status.localShowcaseUrl)"
    foreach ($key in $checks.Keys) {
        Write-Host ("{0,-28} {1}" -f $key, $checks[$key])
    }

    if (-not $result.passed) {
        Write-Warning "Post-reboot smoke did not pass. Check service state, /healthz, /runner/status and logs."
    }
}

if ($result.passed) { exit 0 } else { exit 1 }
