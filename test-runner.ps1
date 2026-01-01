# ============================================================================
# GigDash Test Runner Script
# Automated testing with coverage reports and performance benchmarking
# ============================================================================

$ErrorActionPreference = "Continue"

# ============================================================================
# FUNCTIONS
# ============================================================================

function Show-Header {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                🧪 GIGDASH TEST RUNNER 🧪                     ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Show-TestResults {
    param(
        [string]$Name,
        [int]$ExitCode,
        [datetime]$StartTime
    )
    
    $duration = (Get-Date) - $StartTime
    $durationStr = "{0:N2}s" -f $duration.TotalSeconds
    
    if ($ExitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ $Name - PASSED ($durationStr)" -ForegroundColor Green
        return $true
    } else {
        Write-Host ""
        Write-Host "❌ $Name - FAILED ($durationStr)" -ForegroundColor Red
        return $false
    }
}

# ============================================================================
# MAIN PROCESS
# ============================================================================

Show-Header

$testsPassed = @()
$testsFailed = @()
$totalStartTime = Get-Date

Write-Host "Test Configuration:" -ForegroundColor Yellow
Write-Host "  Environment: $($env:NODE_ENV)" -ForegroundColor Gray
Write-Host "  Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Parse command line arguments
$runBackend = $true
$runFrontend = $true
$runCoverage = $false
$runWatch = $false

foreach ($arg in $args) {
    switch ($arg) {
        "--backend-only" { $runFrontend = $false }
        "--frontend-only" { $runBackend = $false }
        "--coverage" { $runCoverage = $true }
        "--watch" { $runWatch = $true }
    }
}

# ============================================================================
# BACKEND TESTS
# ============================================================================

if ($runBackend) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  BACKEND TESTS (Jest)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    $backendStartTime = Get-Date
    
    Push-Location backend
    
    if ($runWatch) {
        Write-Host "🔄 Running backend tests in watch mode..." -ForegroundColor Yellow
        Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""
        npm run test:watch
        $backendExitCode = $LASTEXITCODE
    } elseif ($runCoverage) {
        Write-Host "📊 Running backend tests with coverage..." -ForegroundColor Yellow
        Write-Host ""
        npm run test -- --coverage
        $backendExitCode = $LASTEXITCODE
        
        if ($backendExitCode -eq 0 -and (Test-Path "coverage\lcov-report\index.html")) {
            Write-Host ""
            Write-Host "📈 Coverage report: backend\coverage\lcov-report\index.html" -ForegroundColor Cyan
        }
    } else {
        Write-Host "🧪 Running backend tests..." -ForegroundColor Yellow
        Write-Host ""
        npm run test
        $backendExitCode = $LASTEXITCODE
    }
    
    Pop-Location
    
    if (Show-TestResults -Name "Backend Tests" -ExitCode $backendExitCode -StartTime $backendStartTime) {
        $testsPassed += "Backend"
    } else {
        $testsFailed += "Backend"
    }
}

# ============================================================================
# FRONTEND TESTS
# ============================================================================

if ($runFrontend) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  FRONTEND TESTS (Vitest)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    $frontendStartTime = Get-Date
    
    Push-Location frontend
    
    if ($runWatch) {
        Write-Host "🔄 Running frontend tests in watch mode..." -ForegroundColor Yellow
        Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
        Write-Host ""
        npm run test -- --watch
        $frontendExitCode = $LASTEXITCODE
    } elseif ($runCoverage) {
        Write-Host "📊 Running frontend tests with coverage..." -ForegroundColor Yellow
        Write-Host ""
        npm run test -- --coverage
        $frontendExitCode = $LASTEXITCODE
        
        if ($frontendExitCode -eq 0 -and (Test-Path "coverage\index.html")) {
            Write-Host ""
            Write-Host "📈 Coverage report: frontend\coverage\index.html" -ForegroundColor Cyan
        }
    } else {
        Write-Host "🧪 Running frontend tests..." -ForegroundColor Yellow
        Write-Host ""
        npm run test
        $frontendExitCode = $LASTEXITCODE
    }
    
    Pop-Location
    
    if (Show-TestResults -Name "Frontend Tests" -ExitCode $frontendExitCode -StartTime $frontendStartTime) {
        $testsPassed += "Frontend"
    } else {
        $testsFailed += "Frontend"
    }
}

# ============================================================================
# LINTING
# ============================================================================

if (-not $runWatch) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  CODE QUALITY (ESLint)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    $lintStartTime = Get-Date
    
    Write-Host "🔍 Running linters..." -ForegroundColor Yellow
    Write-Host ""
    
    npm run lint 2>&1 | Out-Null
    $lintExitCode = $LASTEXITCODE
    
    if (Show-TestResults -Name "ESLint" -ExitCode $lintExitCode -StartTime $lintStartTime) {
        $testsPassed += "Linting"
    } else {
        $testsFailed += "Linting"
        Write-Host "💡 Run 'npm run lint:fix' to auto-fix some issues" -ForegroundColor Yellow
    }
}

# ============================================================================
# SUMMARY
# ============================================================================

if (-not $runWatch) {
    $totalDuration = (Get-Date) - $totalStartTime
    $totalDurationStr = "{0:N2}s" -f $totalDuration.TotalSeconds
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Total Duration: $totalDurationStr" -ForegroundColor Gray
    Write-Host ""
    
    if ($testsPassed.Count -gt 0) {
        Write-Host "✅ Passed ($($testsPassed.Count)):" -ForegroundColor Green
        foreach ($test in $testsPassed) {
            Write-Host "   • $test" -ForegroundColor Gray
        }
        Write-Host ""
    }
    
    if ($testsFailed.Count -gt 0) {
        Write-Host "❌ Failed ($($testsFailed.Count)):" -ForegroundColor Red
        foreach ($test in $testsFailed) {
            Write-Host "   • $test" -ForegroundColor Gray
        }
        Write-Host ""
    }
    
    if ($testsFailed.Count -eq 0) {
        Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║                                                              ║" -ForegroundColor Green
        Write-Host "║              ✅ ALL TESTS PASSED! ✅                          ║" -ForegroundColor Green
        Write-Host "║                                                              ║" -ForegroundColor Green
        Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        exit 0
    } else {
        Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Red
        Write-Host "║                                                              ║" -ForegroundColor Red
        Write-Host "║              ❌ SOME TESTS FAILED ❌                          ║" -ForegroundColor Red
        Write-Host "║                                                              ║" -ForegroundColor Red
        Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Red
        Write-Host ""
        exit 1
    }
}

Write-Host ""
Write-Host "💡 Usage:" -ForegroundColor Cyan
Write-Host "  .\test-runner.ps1                Run all tests" -ForegroundColor Gray
Write-Host "  .\test-runner.ps1 --backend-only  Backend tests only" -ForegroundColor Gray
Write-Host "  .\test-runner.ps1 --frontend-only Frontend tests only" -ForegroundColor Gray
Write-Host "  .\test-runner.ps1 --coverage      Run with coverage reports" -ForegroundColor Gray
Write-Host "  .\test-runner.ps1 --watch         Run in watch mode" -ForegroundColor Gray
Write-Host ""
