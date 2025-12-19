# GigDash Setup Verification Script for Windows
# Checks if the installation was successful

$ErrorActionPreference = "Continue"

Write-Host "🔍 GigDash Setup Verification" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$warnings = 0

# Check Node.js
Write-Host -NoNewline "Checking Node.js... "
try {
    $nodeVersion = node -v
    Write-Host "✓ $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Not found" -ForegroundColor Red
    $errors++
}

# Check npm
Write-Host -NoNewline "Checking npm... "
try {
    $npmVersion = npm -v
    Write-Host "✓ $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Not found" -ForegroundColor Red
    $errors++
}

# Check if dependencies are installed
Write-Host -NoNewline "Checking dependencies... "
if (Test-Path "node_modules") {
    Write-Host "✓ Installed" -ForegroundColor Green
} else {
    Write-Host "✗ Not installed" -ForegroundColor Red
    $errors++
}

# Check backend/.env
Write-Host -NoNewline "Checking backend\.env... "
if (Test-Path "backend\.env") {
    Write-Host "✓ Exists" -ForegroundColor Green
    
    $envContent = Get-Content "backend\.env" -Raw
    
    # Check DATABASE_URL with more specific pattern
    if ($envContent -match 'DATABASE_URL\s*=\s*"?postgresql://user:password@localhost') {
        Write-Host "  ⚠️  DATABASE_URL still contains example values" -ForegroundColor Yellow
        $warnings++
    }
    
    # Check JWT_SECRET with more specific patterns
    if ($envContent -match 'JWT_SECRET\s*=\s*.*?(change-in-production|change-this|example)') {
        Write-Host "  ⚠️  JWT_SECRET should be changed for production" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "✗ Not found" -ForegroundColor Red
    $errors++
}

# Check PostgreSQL connection
Write-Host -NoNewline "Checking PostgreSQL... "
try {
    docker --version | Out-Null
    $dockerContainers = docker ps 2>$null
    if ($dockerContainers -match "postgres") {
        Write-Host "✓ Running (Docker)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Docker container not running" -ForegroundColor Yellow
        $warnings++
    }
} catch {
    Write-Host "⚠️  Docker not available" -ForegroundColor Yellow
    $warnings++
}

# Check Prisma Client
Write-Host -NoNewline "Checking Prisma Client... "
if ((Test-Path "node_modules\.prisma\client") -or (Test-Path "backend\node_modules\.prisma\client")) {
    Write-Host "✓ Generated" -ForegroundColor Green
} else {
    Write-Host "✗ Not generated" -ForegroundColor Red
    Write-Host "  Run: npm run prisma:generate" -ForegroundColor Yellow
    $errors++
}

# Check if database is migrated
Write-Host -NoNewline "Checking database migrations... "
if (Test-Path "backend\prisma\migrations") {
    $migrationCount = (Get-ChildItem "backend\prisma\migrations" -Directory | Measure-Object).Count
    if ($migrationCount -gt 0) {
        Write-Host "✓ $migrationCount migration(s) found" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No migrations found" -ForegroundColor Yellow
        $warnings++
    }
} else {
    Write-Host "⚠️  Migrations directory not found" -ForegroundColor Yellow
    $warnings++
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "✅ Setup verification passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You're ready to start developing:" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor Yellow
} elseif ($errors -eq 0) {
    Write-Host "⚠️  Setup verification passed with warnings ($warnings)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Your setup should work, but consider addressing the warnings above." -ForegroundColor White
} else {
    Write-Host "❌ Setup verification failed with $errors error(s) and $warnings warning(s)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the errors above before continuing." -ForegroundColor White
    Write-Host "For help, see the Troubleshooting section in README.md" -ForegroundColor Yellow
    exit 1
}
