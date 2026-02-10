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

# Files and directories to deploy
$deployItems = @(
    # New module files
    @{src="module/condition-engine.mjs"; dst="module/"},
    @{src="module/feat-effects.mjs"; dst="module/"},

    # Modified module files
    @{src="module/legends.mjs"; dst="module/"},
    @{src="module/combat.mjs"; dst="module/"},
    @{src="module/dice.mjs"; dst="module/"},
    @{src="module/shields.mjs"; dst="module/"},
    @{src="module/documents/actor.mjs"; dst="module/documents/"},
    @{src="module/documents/item.mjs"; dst="module/documents/"},
    @{src="module/sheets/character-sheet.mjs"; dst="module/sheets/"},
    @{src="module/sheets/item-sheet.mjs"; dst="module/sheets/"},
    @{src="module/sheets/npc-sheet.mjs"; dst="module/sheets/"},

    # Styles
    @{src="styles/legends.css"; dst="styles/"},

    # Templates
    @{src="templates/item/item-feat-sheet.hbs"; dst="templates/item/"},

    # System configuration
    @{src="system.json"; dst=""}
)

Write-Host "Deploying core files..." -ForegroundColor Cyan

foreach ($item in $deployItems) {
    $localPath = Join-Path $SourceDir $item.src
    $remotePath = "${ServerUser}@${ServerHost}:${ServerPath}/$($item.dst)"

    if (Test-Path $localPath) {
        Write-Host "  Copying $($item.src)..."
        scp $localPath $remotePath

        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ERROR: Failed to copy $($item.src)" -ForegroundColor Red
        }
    } else {
        Write-Host "  WARNING: File not found - $($item.src)" -ForegroundColor Yellow
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
