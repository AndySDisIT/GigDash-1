# ============================================================================
# GigDash Development Environment Reset Script
# Complete environment reset for fresh start
# ============================================================================

$ErrorActionPreference = "Stop"

# ============================================================================
# FUNCTIONS
# ============================================================================

function Show-Header {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║            ⚠️  DEVELOPMENT ENVIRONMENT RESET ⚠️               ║" -ForegroundColor Red
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
}

# ============================================================================
# MAIN PROCESS
# ============================================================================

Show-Header

Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  • Stop all running services" -ForegroundColor Gray
Write-Host "  • Remove all databases and data" -ForegroundColor Gray
Write-Host "  • Clear node_modules" -ForegroundColor Gray
Write-Host "  • Reinstall all dependencies" -ForegroundColor Gray
Write-Host "  • Reset database with fresh seed data" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  WARNING: All data will be lost!" -ForegroundColor Red
Write-Host ""

if (-not $env:CI -and -not $env:FORCE_RESET) {
    $confirm = Read-Host "Are you sure you want to continue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Reset cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  STOPPING SERVICES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Stop Docker services
try {
    Write-Host "🐳 Stopping Docker containers..." -ForegroundColor Yellow
    docker-compose down -v 2>&1 | Out-Null
    Write-Host "✓ Docker containers stopped and volumes removed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker not running or not available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  CLEANING DEPENDENCIES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Remove node_modules
$directories = @(
    "node_modules",
    "frontend\node_modules",
    "backend\node_modules"
)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "🗑️  Removing $dir..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $dir
        Write-Host "✓ Removed $dir" -ForegroundColor Green
    }
}

# Remove package lock files
$lockFiles = @(
    "package-lock.json",
    "frontend\package-lock.json",
    "backend\package-lock.json"
)

foreach ($file in $lockFiles) {
    if (Test-Path $file) {
        Write-Host "🗑️  Removing $file..." -ForegroundColor Yellow
        Remove-Item -Force $file
        Write-Host "✓ Removed $file" -ForegroundColor Green
    }
}

# Remove build artifacts
$buildDirs = @(
    "frontend\dist",
    "backend\dist",
    "frontend\.vite",
    "backend\.prisma"
)

foreach ($dir in $buildDirs) {
    if (Test-Path $dir) {
        Write-Host "🗑️  Removing $dir..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force $dir
        Write-Host "✓ Removed $dir" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  REINSTALLING DEPENDENCIES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Installing dependencies (this may take a minute)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  RESETTING DATABASE" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if .env files exist
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env not found - creating from example" -ForegroundColor Yellow
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✓ Created backend\.env" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  Please update backend\.env with your configuration!" -ForegroundColor Yellow
        Write-Host "   Then run this script again." -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "❌ backend\.env.example not found" -ForegroundColor Red
        exit 1
    }
}

# Start database
try {
    Write-Host "🐳 Starting PostgreSQL..." -ForegroundColor Yellow
    docker-compose up -d postgres 2>&1 | Out-Null
    Write-Host "✓ PostgreSQL started" -ForegroundColor Green
    Write-Host "⏳ Waiting for database to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 7
} catch {
    Write-Host "⚠️  Could not start Docker PostgreSQL" -ForegroundColor Yellow
    Write-Host "   Make sure PostgreSQL is running locally" -ForegroundColor Yellow
}

# Generate Prisma Client
Write-Host ""
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

# Reset database
Write-Host ""
Write-Host "🗄️  Resetting database..." -ForegroundColor Yellow
$env:FORCE_RESET = "true"
npm run prisma:migrate reset -- --force 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database reset complete" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database reset had issues, trying migration..." -ForegroundColor Yellow
    npm run prisma:migrate 2>&1 | Out-Null
}

# Seed database
Write-Host ""
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
npm run prisma:seed 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database seeded successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "║           ✅ ENVIRONMENT RESET COMPLETE! ✅                   ║" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Start development servers:" -ForegroundColor White
Write-Host "     " -NoNewline
Write-Host "npm run dev" -ForegroundColor Yellow
Write-Host "     " -NoNewline
Write-Host "or .\start-dev.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Open your browser:" -ForegroundColor White
Write-Host "     http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. Register a new account and start fresh!" -ForegroundColor White
Write-Host ""
