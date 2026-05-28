param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot "config.json"),
    [string]$ExePath = (Join-Path $PSScriptRoot "KioskRunner.exe"),
    [string]$ServiceName = "",
    [string]$DisplayName = "",
    [switch]$Start
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "kioskrunner-common.ps1")

$ConfigPath = Resolve-KioskRunnerConfigPath -ConfigPath $ConfigPath
$ExePath = Resolve-KioskRunnerExePath -ExePath $ExePath

if (-not (Test-Path -LiteralPath $ExePath)) {
    throw "KioskRunner.exe was not found: $ExePath"
}

if (-not (Test-Path -LiteralPath $ConfigPath)) {
    throw "config.json was not found: $ConfigPath"
}

$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($config.showcaseId)) {
    throw "showcaseId is required in config.json."
}

if ([string]::IsNullOrWhiteSpace($ServiceName)) {
    $ServiceName = Get-KioskRunnerServiceName -Config $config
}

if ([string]::IsNullOrWhiteSpace($DisplayName)) {
    $DisplayName = "KioskRunner Service ($($config.showcaseId))"
}

$resolvedExe = (Resolve-Path -LiteralPath $ExePath).Path
$resolvedConfig = (Resolve-Path -LiteralPath $ConfigPath).Path
$binaryPath = "`"$resolvedExe`" service --config `"$resolvedConfig`""

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
    throw "Service already exists: $ServiceName"
}

New-Service -Name $ServiceName -DisplayName $DisplayName -BinaryPathName $binaryPath -StartupType Automatic -Description "KioskRunner static showcase delivery/runtime service"
sc.exe failure $ServiceName reset= 86400 actions= restart/60000/restart/60000/""/60000 | Out-Null

Write-Host "Installed service: $ServiceName"
Write-Host "Display name:      $DisplayName"
Write-Host "Startup type:      Automatic"
Write-Host "Binary path:       $binaryPath"
Write-Host "Start it with: Start-Service -Name $ServiceName"

if ($Start) {
    Start-Service -Name $ServiceName
    Write-Host "Started service: $ServiceName"
}
