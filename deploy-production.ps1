# ============================================================================
# GigDash Production Deployment Script
# Automated production deployment with validation and rollback capability
# ============================================================================

$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURATION
# ============================================================================

$VERSION = Get-Date -Format "v.yyyyMMdd.HHmmss"
$DOCKER_REGISTRY = "ghcr.io/andysdisit/gigdash"
$BACKUP_BEFORE_DEPLOY = $true

# ============================================================================
# FUNCTIONS
# ============================================================================

function Show-Header {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║           🚀 GIGDASH PRODUCTION DEPLOYMENT 🚀                ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Test-ProductionEnvironment {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  ENVIRONMENT VALIDATION" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    $valid = $true
    
    # Check Docker
    try {
        docker --version | Out-Null
        Write-Host "✓ Docker installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Docker not found" -ForegroundColor Red
        $valid = $false
    }
    
    # Check Docker Compose
    try {
        docker-compose --version | Out-Null
        Write-Host "✓ Docker Compose installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Docker Compose not found" -ForegroundColor Red
        $valid = $false
    }
    
    # Check environment files
    if (Test-Path ".env") {
        Write-Host "✓ .env file exists" -ForegroundColor Green
        
        # Validate critical environment variables
        $envContent = Get-Content ".env" -Raw
        $requiredVars = @("POSTGRES_PASSWORD", "JWT_SECRET")
        
        foreach ($var in $requiredVars) {
            if ($envContent -match "$var=.+") {
                Write-Host "  ✓ $var is set" -ForegroundColor Gray
            } else {
                Write-Host "  ❌ $var is missing" -ForegroundColor Red
                $valid = $false
            }
        }
    } else {
        Write-Host "❌ .env file not found" -ForegroundColor Red
        $valid = $false
    }
    
    if (Test-Path "backend\.env") {
        Write-Host "✓ backend\.env file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ backend\.env file not found" -ForegroundColor Red
        $valid = $false
    }
    
    Write-Host ""
    return $valid
}

function Invoke-DatabaseBackup {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  PRE-DEPLOYMENT BACKUP" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📦 Creating database backup before deployment..." -ForegroundColor Yellow
    
    try {
        & ".\backup-db.ps1"
        Write-Host "✓ Backup completed" -ForegroundColor Green
        Write-Host ""
        return $true
    } catch {
        Write-Host "❌ Backup failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

function Invoke-Tests {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  RUNNING TESTS" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🧪 Running test suite..." -ForegroundColor Yellow
    
    npm run test 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ All tests passed" -ForegroundColor Green
        Write-Host ""
        return $true
    } else {
        Write-Host "❌ Tests failed" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

function Invoke-Build {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  BUILDING APPLICATION" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🔨 Building optimized production bundles..." -ForegroundColor Yellow
    
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Build completed successfully" -ForegroundColor Green
        Write-Host ""
        return $true
    } else {
        Write-Host "❌ Build failed" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

function Invoke-DockerBuild {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  BUILDING DOCKER IMAGES" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🐳 Building Docker images with tag: $VERSION..." -ForegroundColor Yellow
    
    docker-compose build --no-cache
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker images built successfully" -ForegroundColor Green
        
        # Tag images
        Write-Host "🏷️  Tagging images..." -ForegroundColor Yellow
        docker tag gigdash-frontend:latest "$DOCKER_REGISTRY-frontend:$VERSION"
        docker tag gigdash-backend:latest "$DOCKER_REGISTRY-backend:$VERSION"
        docker tag gigdash-frontend:latest "$DOCKER_REGISTRY-frontend:latest"
        docker tag gigdash-backend:latest "$DOCKER_REGISTRY-backend:latest"
        
        Write-Host "✓ Images tagged" -ForegroundColor Green
        Write-Host ""
        return $true
    } else {
        Write-Host "❌ Docker build failed" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

function Invoke-Deployment {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  DEPLOYING TO PRODUCTION" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🚀 Starting production services..." -ForegroundColor Yellow
    
    # Stop existing services
    docker-compose down
    
    # Start new services
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Services started" -ForegroundColor Green
        Write-Host ""
        return $true
    } else {
        Write-Host "❌ Deployment failed" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

function Test-DeploymentHealth {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  POST-DEPLOYMENT HEALTH CHECK" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "⏳ Waiting for services to start (30 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    Write-Host "🏥 Running health checks..." -ForegroundColor Yellow
    
    & ".\health-check.ps1"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ All health checks passed" -ForegroundColor Green
        Write-Host ""
        return $true
    } else {
        Write-Host ""
        Write-Host "❌ Health checks failed" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# ============================================================================
# MAIN DEPLOYMENT PROCESS
# ============================================================================

Show-Header

Write-Host "Deployment Version: $VERSION" -ForegroundColor Yellow
Write-Host ""

# Validate environment
if (-not (Test-ProductionEnvironment)) {
    Write-Host "❌ Environment validation failed" -ForegroundColor Red
    Write-Host "Please fix the issues above before deploying" -ForegroundColor Yellow
    exit 1
}

# Confirm deployment
if (-not $env:CI -and -not $env:AUTO_DEPLOY) {
    Write-Host "⚠️  You are about to deploy to PRODUCTION" -ForegroundColor Yellow
    Write-Host ""
    $confirm = Read-Host "Are you sure you want to continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Deployment cancelled" -ForegroundColor Yellow
        exit 0
    }
    Write-Host ""
}

# Backup database
if ($BACKUP_BEFORE_DEPLOY) {
    if (-not (Invoke-DatabaseBackup)) {
        Write-Host "❌ Pre-deployment backup failed" -ForegroundColor Red
        $continue = Read-Host "Continue without backup? (yes/no)"
        if ($continue -ne "yes") {
            exit 1
        }
    }
}

# Run tests
if (-not (Invoke-Tests)) {
    Write-Host "❌ Tests failed - deployment aborted" -ForegroundColor Red
    exit 1
}

# Build application
if (-not (Invoke-Build)) {
    Write-Host "❌ Build failed - deployment aborted" -ForegroundColor Red
    exit 1
}

# Build Docker images
if (-not (Invoke-DockerBuild)) {
    Write-Host "❌ Docker build failed - deployment aborted" -ForegroundColor Red
    exit 1
}

# Deploy
if (-not (Invoke-Deployment)) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Rollback command:" -ForegroundColor Yellow
    Write-Host "   docker-compose down && docker-compose up -d" -ForegroundColor Gray
    exit 1
}

# Health check
if (-not (Test-DeploymentHealth)) {
    Write-Host "⚠️  Deployment completed but health checks failed" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Check logs:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs -f" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Rollback if needed:" -ForegroundColor Yellow
    Write-Host "   docker-compose down && docker-compose up -d" -ForegroundColor Gray
    exit 1
}

# ============================================================================
# SUCCESS
# ============================================================================

Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "║        ✅ DEPLOYMENT COMPLETED SUCCESSFULLY! ✅               ║" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "  Version: $VERSION" -ForegroundColor Gray
Write-Host "  Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

Write-Host "🔍 Monitoring:" -ForegroundColor Cyan
Write-Host "  • View logs: docker-compose logs -f" -ForegroundColor Gray
Write-Host "  • Check health: .\health-check.ps1" -ForegroundColor Gray
Write-Host "  • View containers: docker ps" -ForegroundColor Gray
Write-Host ""

Write-Host "🎉 GigDash is now live in production!" -ForegroundColor Green
Write-Host ""
