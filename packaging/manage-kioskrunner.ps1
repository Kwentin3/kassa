param(
    [string]$ConfigPath = (Join-Path $PSScriptRoot "config.json"),
    [string]$ExePath = (Join-Path $PSScriptRoot "KioskRunner.exe"),
    [string]$ServiceName = ""
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "kioskrunner-common.ps1")

$ConfigPath = Resolve-KioskRunnerConfigPath -ConfigPath $ConfigPath
$ExePath = Resolve-KioskRunnerExePath -ExePath $ExePath

function Get-CurrentStatus {
    return Get-KioskRunnerManagerStatus -ConfigPath $ConfigPath -ServiceName $ServiceName
}

function Wait-ServiceState {
    param(
        [string]$Name,
        [string]$State,
        [int]$TimeoutSec = 30
    )

    $service = Get-Service -Name $Name -ErrorAction Stop
    $service.WaitForStatus($State, [TimeSpan]::FromSeconds($TimeoutSec))
}

function Show-Status {
    $status = Get-CurrentStatus
    Write-Host ""
    Write-KioskRunnerStatusSummary -Status $status
    Write-Host ""
}

function Install-KioskRunnerService {
    & (Join-Path $PSScriptRoot "install-service.ps1") -ConfigPath $ConfigPath -ExePath $ExePath -ServiceName $ServiceName
}

function Start-KioskRunnerService {
    $status = Get-CurrentStatus
    if (-not $status.serviceInstalled) {
        Write-Warning "Service is not installed."
        return
    }

    if ($status.serviceState -eq "Running") {
        Write-Host "Service is already running."
    }
    else {
        Start-Service -Name $status.serviceName
        Wait-ServiceState -Name $status.serviceName -State "Running"
        Write-Host "Service started: $($status.serviceName)"
    }

    Start-Sleep -Seconds 2
    Show-Status
}

function Stop-KioskRunnerService {
    param([switch]$NoConfirm)

    $status = Get-CurrentStatus
    if (-not $status.serviceInstalled) {
        Write-Warning "Service is not installed."
        return
    }

    if (-not $NoConfirm) {
        $answer = Read-Host "Stop service '$($status.serviceName)'? Local showcase may become unavailable. Type STOP"
        if ($answer -ne "STOP") {
            Write-Host "Stop cancelled."
            return
        }
    }

    if ($status.serviceState -eq "Stopped") {
        Write-Host "Service is already stopped."
        return
    }

    Stop-Service -Name $status.serviceName -Force
    Wait-ServiceState -Name $status.serviceName -State "Stopped"
    Write-Host "Service stopped: $($status.serviceName)"
}

function Restart-KioskRunnerService {
    $status = Get-CurrentStatus
    if (-not $status.serviceInstalled) {
        Write-Warning "Service is not installed."
        return
    }

    if ($status.serviceState -eq "Running") {
        Stop-Service -Name $status.serviceName -Force
        Wait-ServiceState -Name $status.serviceName -State "Stopped"
    }

    Start-Service -Name $status.serviceName
    Wait-ServiceState -Name $status.serviceName -State "Running"
    Start-Sleep -Seconds 2
    Write-Host "Service restarted: $($status.serviceName)"
    Show-Status
}

function Update-NowSafe {
    $status = Get-CurrentStatus
    $wasRunning = $status.serviceInstalled -and $status.serviceState -eq "Running"

    if ($wasRunning) {
        Write-Warning "Manual update runs as a separate process. Safe mode will stop the service first to avoid racing the scheduled update loop."
        $answer = Read-Host "Use safe update mode: stop service -> update-once -> start service? Type UPDATE"
        if ($answer -ne "UPDATE") {
            Write-Host "Update cancelled."
            return
        }

        Stop-Service -Name $status.serviceName -Force
        Wait-ServiceState -Name $status.serviceName -State "Stopped"
    }

    try {
        $result = Invoke-KioskRunnerProcess -ExePath $ExePath -Arguments @("update-once", "--config", $ConfigPath)
        if (-not [string]::IsNullOrWhiteSpace($result.Output)) { Write-Host $result.Output }
        if (-not [string]::IsNullOrWhiteSpace($result.Error)) { Write-Warning $result.Error }
        if ($result.ExitCode -ne 0) {
            Write-Warning "update-once failed with exit code $($result.ExitCode)."
        }
    }
    finally {
        if ($wasRunning) {
            Start-Service -Name $status.serviceName
            Wait-ServiceState -Name $status.serviceName -State "Running"
            Start-Sleep -Seconds 2
        }
    }

    Show-Status
}

function Rollback-Safe {
    $status = Get-CurrentStatus
    $answer = Read-Host "Rollback current showcase? Type ROLLBACK"
    if ($answer -ne "ROLLBACK") {
        Write-Host "Rollback cancelled."
        return
    }

    $wasRunning = $status.serviceInstalled -and $status.serviceState -eq "Running"
    if ($wasRunning) {
        Stop-Service -Name $status.serviceName -Force
        Wait-ServiceState -Name $status.serviceName -State "Stopped"
    }

    try {
        $result = Invoke-KioskRunnerProcess -ExePath $ExePath -Arguments @("rollback", "--config", $ConfigPath)
        if (-not [string]::IsNullOrWhiteSpace($result.Output)) { Write-Host $result.Output }
        if (-not [string]::IsNullOrWhiteSpace($result.Error)) { Write-Warning $result.Error }
        if ($result.ExitCode -ne 0) {
            Write-Warning "rollback failed with exit code $($result.ExitCode)."
        }
    }
    finally {
        if ($wasRunning) {
            Start-Service -Name $status.serviceName
            Wait-ServiceState -Name $status.serviceName -State "Running"
            Start-Sleep -Seconds 2
        }
    }

    Show-Status
}

function Open-UrlIfAvailable {
    param([string]$Url, [string]$Label)

    if ([string]::IsNullOrWhiteSpace($Url)) {
        Write-Warning "$Label URL is unavailable. Check config.json."
        return
    }

    Write-Host "$($Label): $Url"
    Start-Process $Url
}

function Open-LogsFolder {
    $status = Get-CurrentStatus
    if ([string]::IsNullOrWhiteSpace($status.rootDir)) {
        Write-Warning "rootDir is unavailable. Check config.json."
        return
    }

    $logs = Join-Path $status.rootDir "logs"
    if (-not (Test-Path -LiteralPath $logs -PathType Container)) {
        Write-Warning "Logs folder does not exist yet: $logs"
        return
    }

    Start-Process $logs
}

function Open-ConfigFile {
    if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
        Write-Warning "config.json does not exist: $ConfigPath"
        return
    }

    Start-Process notepad.exe $ConfigPath
}

function Uninstall-KioskRunnerService {
    & (Join-Path $PSScriptRoot "uninstall-service.ps1") -ConfigPath $ConfigPath -ServiceName $ServiceName
}

function Show-Menu {
    Write-Host ""
    Write-Host "KioskRunner PowerShell Manager"
    Write-Host "Config: $ConfigPath"
    Write-Host ""
    Write-Host "[1]  Show status"
    Write-Host "[2]  Install service"
    Write-Host "[3]  Start service"
    Write-Host "[4]  Stop service"
    Write-Host "[5]  Restart service"
    Write-Host "[6]  Update now"
    Write-Host "[7]  Rollback"
    Write-Host "[8]  Check registry"
    Write-Host "[9]  Open showcase"
    Write-Host "[10] Open health"
    Write-Host "[11] Open runner status"
    Write-Host "[12] Open logs folder"
    Write-Host "[13] Open config file"
    Write-Host "[14] Uninstall service"
    Write-Host "[15] Post-reboot smoke check"
    Write-Host "[0]  Exit"
}

while ($true) {
    Show-Menu
    $choice = Read-Host "Select"
    try {
        switch ($choice) {
            "1" { Show-Status }
            "2" { Install-KioskRunnerService }
            "3" { Start-KioskRunnerService }
            "4" { Stop-KioskRunnerService }
            "5" { Restart-KioskRunnerService }
            "6" { Update-NowSafe }
            "7" { Rollback-Safe }
            "8" { & (Join-Path $PSScriptRoot "check-registry.ps1") -ConfigPath $ConfigPath }
            "9" {
                $status = Get-CurrentStatus
                if ($status.serviceState -ne "Running") { Write-Warning "Service is not running. Showcase may be unavailable." }
                Open-UrlIfAvailable -Url $status.localShowcaseUrl -Label "Showcase"
            }
            "10" { Open-UrlIfAvailable -Url (Get-CurrentStatus).healthUrl -Label "Health" }
            "11" { Open-UrlIfAvailable -Url (Get-CurrentStatus).statusUrl -Label "Runner status" }
            "12" { Open-LogsFolder }
            "13" { Open-ConfigFile }
            "14" { Uninstall-KioskRunnerService }
            "15" { & (Join-Path $PSScriptRoot "post-reboot-smoke.ps1") -ConfigPath $ConfigPath -ServiceName $ServiceName }
            "0" { break }
            default { Write-Warning "Unknown menu item: $choice" }
        }
    }
    catch {
        Write-Warning $_.Exception.Message
    }

    if ($choice -ne "0") {
        [void](Read-Host "Press Enter to continue")
    }
}
