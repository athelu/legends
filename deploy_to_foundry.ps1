# PowerShell Deployment Script for Legends System to Foundry VTT Server
# This script uses SCP to copy files to a remote Foundry server

param(
    [string]$ServerUser = "azureuser",
    [string]$ServerHost = "foundryvtt.eastus.cloudapp.azure.com",
    [string]$ServerPath = "/home/azureuser/foundrydata/Data/systems/legends"
)

$ErrorActionPreference = "Stop"

Write-Host "=" * 60
Write-Host "Deploying Legends System to Foundry VTT"
Write-Host "=" * 60
Write-Host "Server: $ServerUser@$ServerHost"
Write-Host "Path: $ServerPath"
Write-Host ""

$SourceDir = "foundryvtt"

# Check if source directory exists
if (!(Test-Path $SourceDir)) {
    Write-Host "ERROR: Source directory 'foundryvtt' not found!" -ForegroundColor Red
    exit 1
}

# Directories and files to deploy
$deployDirectories = @(
    "module",
    "styles",
    "templates",
    "lang",
    "images",
    "ui"
)

$deployFiles = @(
    "system.json",
    "template.json",
    "README.md",
    "LICENSE.txt"
)

Write-Host "Deploying runtime directories..." -ForegroundColor Cyan

foreach ($dir in $deployDirectories) {
    $localPath = Join-Path $SourceDir $dir
    if (Test-Path $localPath) {
        Write-Host "  Syncing $dir/..."
        ssh "${ServerUser}@${ServerHost}" "mkdir -p ${ServerPath}/${dir}"
        scp -r "$localPath/*" "${ServerUser}@${ServerHost}:${ServerPath}/${dir}/"

        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ERROR: Failed to sync $dir" -ForegroundColor Red
        }
    } else {
        Write-Host "  WARNING: Directory not found - $dir" -ForegroundColor Yellow
    }
}

Write-Host "Deploying root files..." -ForegroundColor Cyan

foreach ($file in $deployFiles) {
    $localPath = Join-Path $SourceDir $file
    if (Test-Path $localPath) {
        Write-Host "  Copying $file..."
        scp $localPath "${ServerUser}@${ServerHost}:${ServerPath}/"

        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ERROR: Failed to copy $file" -ForegroundColor Red
        }
    } else {
        Write-Host "  WARNING: File not found - $file" -ForegroundColor Yellow
    }
}

# Deploy pack .db files
Write-Host ""
Write-Host "Deploying pack databases..." -ForegroundColor Cyan

$packDirs = Get-ChildItem -Path "$SourceDir/packs" -Directory

foreach ($packDir in $packDirs) {
    $packName = $packDir.Name
    $dbFile = Join-Path $packDir.FullName "$packName.db"

    if (Test-Path $dbFile) {
        Write-Host "  Copying $packName.db..."

        # Create remote directory if needed (via SSH)
        ssh "${ServerUser}@${ServerHost}" "mkdir -p ${ServerPath}/packs/${packName}"

        # Copy the .db file
        scp $dbFile "${ServerUser}@${ServerHost}:${ServerPath}/packs/${packName}/"

        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ERROR: Failed to copy $packName.db" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=" * 60
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "=" * 60
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your Foundry VTT server"
Write-Host "2. Hard refresh your browser (Ctrl+Shift+R)"
Write-Host "3. Verify compendiums are loading correctly"
Write-Host ""
Write-Host "To restart Foundry via SSH:"
Write-Host "  ssh $ServerUser@$ServerHost"
Write-Host "  sudo systemctl restart foundryvtt"
Write-Host ""
