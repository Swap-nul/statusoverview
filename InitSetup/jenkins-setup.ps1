# Jenkins Setup Script for Status Overview (PowerShell)
# This script helps set up and manage Jenkins for bulk deployment

param(
    [Parameter(Position=0)]
    [string]$Command = "setup",
    
    [Parameter(Position=1)]
    [string]$BackupFile = ""
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

function Test-Docker {
    Write-Status "Checking Docker..."
    try {
        $null = docker info 2>$null
        Write-Success "Docker is running"
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker and try again."
        return $false
    }
}

function Test-Port {
    param([int]$Port)
    
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        return $connection.TcpTestSucceeded
    }
    catch {
        return $false
    }
}

function Test-Ports {
    Write-Status "Checking if required ports are available..."
    
    if (Test-Port -Port 8082) {
        Write-Warning "Port 8082 is already in use. Jenkins might already be running or another service is using this port."
        $response = Read-Host "Do you want to continue anyway? (y/n)"
        if ($response -notmatch "^[Yy]$") {
            exit 1
        }
    }
    else {
        Write-Success "Port 8082 is available"
    }
}

function Setup-Jenkins {
    Write-Status "Setting up Jenkins..."
    
    # Create jenkins directory if it doesn't exist
    if (-not (Test-Path "jenkins")) {
        New-Item -ItemType Directory -Path "jenkins\init.groovy.d" -Force | Out-Null
        Write-Status "Created jenkins directory structure"
    }
    
    # Start Jenkins
    Write-Status "Starting Jenkins with Docker Compose..."
    docker compose up -d jenkins
    
    Write-Status "Waiting for Jenkins to start..."
    
    # Wait for Jenkins to be ready
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8082/login" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                break
            }
        }
        catch {
            # Continue waiting
        }
        
        Write-Status "Attempt $attempt/$maxAttempts : Waiting for Jenkins to be ready..."
        Start-Sleep -Seconds 10
        $attempt++
    }
    
    if ($attempt -gt $maxAttempts) {
        Write-Error "Jenkins failed to start within the expected time"
        Write-Status "Checking Jenkins logs..."
        docker compose logs --tail=20 jenkins
        exit 1
    }
    
    Write-Success "Jenkins is running at http://localhost:8082"
}

function Test-Jenkins {
    Write-Status "Verifying Jenkins setup..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8082/api/json" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -ne 200) {
            Write-Error "Jenkins API is not responding"
            return $false
        }
    }
    catch {
        Write-Error "Jenkins API is not responding"
        return $false
    }
    
    # Check if bulk deployment job exists
    try {
        $credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin123"))
        $headers = @{ Authorization = "Basic $credentials" }
        
        $jobResponse = Invoke-WebRequest -Uri "http://localhost:8082/job/bulk-deployment-job/api/json" -Headers $headers -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        
        if ($jobResponse.Content -match "bulk-deployment-job") {
            Write-Success "Bulk deployment job is configured"
        }
        else {
            Write-Warning "Bulk deployment job response unexpected"
        }
    }
    catch {
        Write-Warning "Bulk deployment job not found. It should be created automatically during startup."
    }
    
    Write-Success "Jenkins verification completed"
    return $true
}

function Show-Info {
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor $Colors.Cyan
    Write-Host "           JENKINS SETUP COMPLETE" -ForegroundColor $Colors.Cyan
    Write-Host "===============================================" -ForegroundColor $Colors.Cyan
    Write-Host ""
    Write-Host "Jenkins URL: http://localhost:8082"
    Write-Host "Username: admin"
    Write-Host "Password: admin123"
    Write-Host ""
    Write-Host "Job: bulk-deployment-job"
    Write-Host "API Endpoint: http://localhost:8082/job/bulk-deployment-job"
    Write-Host ""
    Write-Host "To test the setup:"
    Write-Host "1. Open http://localhost:8082 in your browser"
    Write-Host "2. Login with admin/admin123"
    Write-Host "3. Navigate to 'bulk-deployment-job'"
    Write-Host "4. Click 'Build with Parameters' to test"
    Write-Host ""
    Write-Host "To view logs:"
    Write-Host "  docker compose logs -f jenkins"
    Write-Host ""
    Write-Host "To stop Jenkins:"
    Write-Host "  docker compose stop jenkins"
    Write-Host ""
    Write-Host "To restart Jenkins:"
    Write-Host "  docker compose restart jenkins"
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor $Colors.Cyan
}

function Test-JenkinsAPI {
    Write-Status "Testing Jenkins API..."
    
    try {
        $credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin123"))
        $headers = @{ Authorization = "Basic $credentials" }
        
        $response = Invoke-WebRequest -Uri "http://localhost:8082/api/json" -Headers $headers -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.Content -match "Jenkins") {
            Write-Success "Jenkins API is working"
        }
        else {
            Write-Error "Jenkins API test failed"
            return $false
        }
        
        # Test job API
        $jobResponse = Invoke-WebRequest -Uri "http://localhost:8082/job/bulk-deployment-job/api/json" -Headers $headers -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        
        if ($jobResponse.Content -match "bulk-deployment-job") {
            Write-Success "Bulk deployment job API is working"
        }
        else {
            Write-Warning "Bulk deployment job API test failed - job might not be created yet"
        }
        
        return $true
    }
    catch {
        Write-Error "Jenkins API test failed: $($_.Exception.Message)"
        return $false
    }
}

function Show-Logs {
    Write-Status "Showing Jenkins logs (Ctrl+C to exit)..."
    docker compose logs -f jenkins
}

function Stop-Jenkins {
    Write-Status "Stopping Jenkins..."
    docker compose stop jenkins
    Write-Success "Jenkins stopped"
}

function Restart-Jenkins {
    Write-Status "Restarting Jenkins..."
    docker compose restart jenkins
    Write-Success "Jenkins restarted"
}

function Reset-Jenkins {
    Write-Warning "This will remove all Jenkins data including jobs, builds, and configuration."
    $response = Read-Host "Are you sure you want to reset Jenkins? (y/n)"
    
    if ($response -notmatch "^[Yy]$") {
        Write-Status "Reset cancelled"
        return
    }
    
    Write-Status "Stopping Jenkins..."
    docker compose stop jenkins
    
    Write-Status "Removing Jenkins volume..."
    docker volume rm statusoverview_jenkins_home 2>$null
    
    Write-Status "Starting fresh Jenkins..."
    docker compose up -d jenkins
    
    Write-Success "Jenkins has been reset"
}

function Backup-Jenkins {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupFile = "jenkins-backup-$timestamp.tar.gz"
    
    Write-Status "Creating Jenkins backup: $backupFile"
    
    docker run --rm -v statusoverview_jenkins_home:/data -v "${PWD}:/backup" alpine tar czf "/backup/$backupFile" -C /data .
    
    Write-Success "Backup created: $backupFile"
}

function Restore-Jenkins {
    param([string]$BackupFile)
    
    if (-not $BackupFile) {
        Write-Error "Please specify backup file: .\jenkins-setup.ps1 restore <backup-file>"
        exit 1
    }
    
    if (-not (Test-Path $BackupFile)) {
        Write-Error "Backup file not found: $BackupFile"
        exit 1
    }
    
    Write-Warning "This will replace all current Jenkins data."
    $response = Read-Host "Are you sure you want to restore from backup? (y/n)"
    
    if ($response -notmatch "^[Yy]$") {
        Write-Status "Restore cancelled"
        return
    }
    
    Write-Status "Stopping Jenkins..."
    docker compose stop jenkins
    
    Write-Status "Restoring from backup: $BackupFile"
    docker run --rm -v statusoverview_jenkins_home:/data -v "${PWD}:/backup" alpine tar xzf "/backup/$BackupFile" -C /data
    
    Write-Status "Starting Jenkins..."
    docker compose up -d jenkins
    
    Write-Success "Jenkins restored from backup"
}

function Show-Help {
    Write-Host "Jenkins Setup Script for Status Overview (PowerShell)"
    Write-Host ""
    Write-Host "Usage: .\jenkins-setup.ps1 [command] [backup-file]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  setup     - Setup and start Jenkins (default)"
    Write-Host "  verify    - Verify Jenkins configuration"
    Write-Host "  logs      - Show Jenkins logs"
    Write-Host "  stop      - Stop Jenkins"
    Write-Host "  restart   - Restart Jenkins"
    Write-Host "  reset     - Reset Jenkins (removes all data)"
    Write-Host "  backup    - Create Jenkins backup"
    Write-Host "  restore   - Restore from backup"
    Write-Host "  info      - Show Jenkins information"
    Write-Host "  test      - Test Jenkins API"
    Write-Host "  help      - Show this help"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\jenkins-setup.ps1                    # Setup Jenkins"
    Write-Host "  .\jenkins-setup.ps1 logs              # View logs"
    Write-Host "  .\jenkins-setup.ps1 backup            # Create backup"
    Write-Host "  .\jenkins-setup.ps1 restore backup.tar.gz  # Restore backup"
}

# Main script logic
switch ($Command.ToLower()) {
    "setup" {
        Write-Status "Starting Jenkins setup for Status Overview..."
        if (-not (Test-Docker)) { exit 1 }
        Test-Ports
        Setup-Jenkins
        Start-Sleep -Seconds 5
        Test-Jenkins | Out-Null
        Test-JenkinsAPI | Out-Null
        Show-Info
    }
    "verify" {
        Test-Jenkins | Out-Null
        Test-JenkinsAPI | Out-Null
    }
    "logs" {
        Show-Logs
    }
    "stop" {
        Stop-Jenkins
    }
    "restart" {
        Restart-Jenkins
    }
    "reset" {
        Reset-Jenkins
    }
    "backup" {
        Backup-Jenkins
    }
    "restore" {
        Restore-Jenkins -BackupFile $BackupFile
    }
    "info" {
        Show-Info
    }
    "test" {
        Test-JenkinsAPI | Out-Null
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
        Write-Status "Use '.\jenkins-setup.ps1 help' for available commands"
        exit 1
    }
}
