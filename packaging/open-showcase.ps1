param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot "config.json"),
    [switch]$PrintOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "kioskrunner-common.ps1")

$resolvedConfig = Resolve-KioskRunnerConfigPath -ConfigPath $ConfigPath
$config = Read-KioskRunnerConfig -ConfigPath $resolvedConfig
if (-not $config) {
    throw "config.json was not found: $resolvedConfig"
}

$url = Get-KioskRunnerLocalUrl -Config $config
if ([string]::IsNullOrWhiteSpace($url)) {
    throw "Could not build local showcase URL from config.json."
}

Write-Host $url
if (-not $PrintOnly) {
    Start-Process $url
}
