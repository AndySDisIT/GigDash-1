# ============================================================================
# GigDash Database Backup Script
# Automated PostgreSQL database backup with compression
# ============================================================================

$ErrorActionPreference = "Stop"

# Configuration
$BACKUP_DIR = "backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_NAME = "gigdash_backup_$TIMESTAMP"
$DB_NAME = "gigdash"
$DB_USER = "gigdash"
$DB_HOST = "localhost"
$DB_PORT = 5432

# ============================================================================
# FUNCTIONS
# ============================================================================

function Show-Header {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║             💾 GIGDASH DATABASE BACKUP 💾                    ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Get-DatabasePassword {
    # Try to read from .env file
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
        foreach ($line in $envContent) {
            if ($line -match "POSTGRES_PASSWORD=(.+)") {
                return $matches[1]
            }
        }
    }
    
    # Try backend/.env
    if (Test-Path "backend\.env") {
        $envContent = Get-Content "backend\.env"
        foreach ($line in $envContent) {
            if ($line -match "DATABASE_URL=.*:(.+)@") {
                return $matches[1]
            }
        }
    }
    
    return $null
}

# ============================================================================
# MAIN PROCESS
# ============================================================================

Show-Header

Write-Host "Backup Configuration:" -ForegroundColor Yellow
Write-Host "  Database: $DB_NAME" -ForegroundColor Gray
Write-Host "  Host: $DB_HOST:$DB_PORT" -ForegroundColor Gray
Write-Host "  Timestamp: $TIMESTAMP" -ForegroundColor Gray
Write-Host ""

# Create backup directory
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "✓ Created backup directory: $BACKUP_DIR" -ForegroundColor Green
}

# Get database password
$dbPassword = Get-DatabasePassword
if (-not $dbPassword) {
    Write-Host "⚠️  Could not find database password in .env files" -ForegroundColor Yellow
    $dbPassword = Read-Host "Enter database password" -AsSecureString
    $dbPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
}

# Set environment variable for pg_dump
$env:PGPASSWORD = $dbPassword

Write-Host "📦 Creating database backup..." -ForegroundColor Cyan

try {
    # Check if using Docker
    $useDocker = $false
    try {
        docker ps --filter "name=postgres" --format "{{.Names}}" | Out-Null
        $postgresContainer = docker ps --filter "name=postgres" --format "{{.Names}}"
        if ($postgresContainer) {
            $useDocker = $true
        }
    } catch {
        # Docker not available or not running
    }
    
    $backupFile = "$BACKUP_DIR\$BACKUP_NAME.sql"
    
    if ($useDocker) {
        Write-Host "  Using Docker container for backup..." -ForegroundColor Gray
        docker exec $postgresContainer pg_dump -U $DB_USER -d $DB_NAME > $backupFile
    } else {
        Write-Host "  Using local PostgreSQL for backup..." -ForegroundColor Gray
        pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $backupFile
    }
    
    if (Test-Path $backupFile) {
        $fileSize = (Get-Item $backupFile).Length / 1KB
        Write-Host "✓ Backup created: $backupFile ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor Green
        
        # Compress the backup
        Write-Host "🗜️  Compressing backup..." -ForegroundColor Cyan
        Compress-Archive -Path $backupFile -DestinationPath "$BACKUP_DIR\$BACKUP_NAME.zip" -CompressionLevel Optimal
        
        # Remove uncompressed file
        Remove-Item $backupFile
        
        $compressedSize = (Get-Item "$BACKUP_DIR\$BACKUP_NAME.zip").Length / 1KB
        Write-Host "✓ Backup compressed: $BACKUP_NAME.zip ($([math]::Round($compressedSize, 2)) KB)" -ForegroundColor Green
        
        # List recent backups
        Write-Host ""
        Write-Host "📋 Recent backups:" -ForegroundColor Yellow
        Get-ChildItem $BACKUP_DIR -Filter "gigdash_backup_*.zip" | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 5 | 
            ForEach-Object {
                $size = [math]::Round($_.Length / 1KB, 2)
                Write-Host "  $($_.Name) - $size KB - $($_.LastWriteTime)" -ForegroundColor Gray
            }
        
        # Clean old backups (keep last 10)
        $oldBackups = Get-ChildItem $BACKUP_DIR -Filter "gigdash_backup_*.zip" | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -Skip 10
        
        if ($oldBackups) {
            Write-Host ""
            Write-Host "🗑️  Cleaning old backups (keeping 10 most recent)..." -ForegroundColor Yellow
            $oldBackups | ForEach-Object {
                Remove-Item $_.FullName
                Write-Host "  Removed: $($_.Name)" -ForegroundColor Gray
            }
        }
        
        Write-Host ""
        Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
        
    } else {
        Write-Host "❌ Backup failed - file not created" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Backup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    $env:PGPASSWORD = $null
}

Write-Host ""
Write-Host "💡 To restore this backup:" -ForegroundColor Cyan
Write-Host "  1. Extract the zip file" -ForegroundColor Gray
Write-Host "  2. Run: psql -U $DB_USER -d $DB_NAME -f $BACKUP_NAME.sql" -ForegroundColor Gray
Write-Host "     Or: docker exec -i postgres psql -U $DB_USER -d $DB_NAME < $BACKUP_NAME.sql" -ForegroundColor Gray
Write-Host ""
