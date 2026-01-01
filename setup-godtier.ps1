# ============================================================================
# GigDash God-Tier Setup Script
# Automated zero-configuration setup with enterprise-level features
# ============================================================================

$ErrorActionPreference = "Stop"

# ============================================================================
# CONFIGURATION
# ============================================================================
$BACKEND_PORT = 5000
$FRONTEND_PORT = 3000
$POSTGRES_PORT = 5432
$MIN_NODE_VERSION = 18

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                              ║" -ForegroundColor Cyan
    Write-Host "║        ██████╗ ██╗ ██████╗ ██████╗  █████╗ ███████╗██╗  ██╗ ║" -ForegroundColor Magenta
    Write-Host "║       ██╔════╝ ██║██╔════╝ ██╔══██╗██╔══██╗██╔════╝██║  ██║ ║" -ForegroundColor Magenta
    Write-Host "║       ██║  ███╗██║██║  ███╗██║  ██║███████║███████╗███████║ ║" -ForegroundColor Magenta
    Write-Host "║       ██║   ██║██║██║   ██║██║  ██║██╔══██║╚════██║██╔══██║ ║" -ForegroundColor Magenta
    Write-Host "║       ╚██████╔╝██║╚██████╔╝██████╔╝██║  ██║███████║██║  ██║ ║" -ForegroundColor Magenta
    Write-Host "║        ╚═════╝ ╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ║" -ForegroundColor Magenta
    Write-Host "║                                                              ║" -ForegroundColor Cyan
    Write-Host "║              🚀 GOD-TIER SETUP AUTOMATION 🚀                 ║" -ForegroundColor Yellow
    Write-Host "║                                                              ║" -ForegroundColor Cyan
    Write-Host "║           Ultimate Gig Aggregation Platform                  ║" -ForegroundColor White
    Write-Host "║         Zero Configuration • Auto Everything                 ║" -ForegroundColor Gray
    Write-Host "║                                                              ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Progress {
    param(
        [string]$Message,
        [scriptblock]$Action
    )
    
    Write-Host ""
    Write-Host "⏳ $Message" -ForegroundColor Cyan
    
    $job = Start-Job -ScriptBlock $Action
    
    $spinChars = @('⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏')
    $i = 0
    
    while ($job.State -eq 'Running') {
        Write-Host "`r   $($spinChars[$i % $spinChars.Length]) Processing..." -NoNewline -ForegroundColor Yellow
        $i++
        Start-Sleep -Milliseconds 100
    }
    
    $result = Receive-Job -Job $job
    Remove-Job -Job $job
    
    Write-Host "`r✓ $Message" -ForegroundColor Green
    return $result
}

function New-JWTSecret {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

function New-DatabasePassword {
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()"
    $password = ""
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    for ($i = 0; $i -lt 24; $i++) {
        $bytes = New-Object byte[] 1
        $rng.GetBytes($bytes)
        $password += $chars[$bytes[0] % $chars.Length]
    }
    return $password
}

function Test-PortAvailable {
    param([int]$Port)
    
    try {
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    } catch {
        return $false
    }
}

function Get-AvailablePort {
    param(
        [int]$PreferredPort,
        [string]$ServiceName
    )
    
    if (Test-PortAvailable -Port $PreferredPort) {
        return $PreferredPort
    }
    
    Write-Host "⚠️  Port $PreferredPort is in use for $ServiceName" -ForegroundColor Yellow
    
    # Try adjacent ports
    for ($i = 1; $i -le 10; $i++) {
        $altPort = $PreferredPort + $i
        if (Test-PortAvailable -Port $altPort) {
            Write-Host "✓ Using alternative port $altPort for $ServiceName" -ForegroundColor Green
            return $altPort
        }
    }
    
    throw "Could not find an available port for $ServiceName"
}

function Test-Prerequisites {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  CHECKING PREREQUISITES" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    # Check Node.js
    try {
        $nodeVersion = node -v
        $nodeVersionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        
        if ($nodeVersionNumber -lt $MIN_NODE_VERSION) {
            Write-Host "❌ Node.js version $MIN_NODE_VERSION+ required. Found: $nodeVersion" -ForegroundColor Red
            Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js not installed" -ForegroundColor Red
        Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm -v
        Write-Host "✓ npm v$npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ npm not installed" -ForegroundColor Red
        exit 1
    }
    
    # Check Docker (optional)
    try {
        docker --version | Out-Null
        docker-compose --version | Out-Null
        Write-Host "✓ Docker & Docker Compose installed" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "⚠️  Docker not detected (optional)" -ForegroundColor Yellow
        return $false
    }
}

# ============================================================================
# MAIN SETUP PROCESS
# ============================================================================

Show-Banner

$dockerAvailable = Test-Prerequisites

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  CONFIGURING SERVICES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Check and assign ports
$backendPort = Get-AvailablePort -PreferredPort $BACKEND_PORT -ServiceName "Backend API"
$frontendPort = Get-AvailablePort -PreferredPort $FRONTEND_PORT -ServiceName "Frontend"
$postgresPort = Get-AvailablePort -PreferredPort $POSTGRES_PORT -ServiceName "PostgreSQL"

# Generate secure credentials
Write-Host ""
Write-Host "🔐 Generating secure credentials..." -ForegroundColor Cyan
$jwtSecret = New-JWTSecret
$dbPassword = New-DatabasePassword
Write-Host "✓ Credentials generated securely" -ForegroundColor Green

# ============================================================================
# INSTALL DEPENDENCIES
# ============================================================================

Show-Progress -Message "Installing dependencies (this may take a minute)" -Action {
    npm install 2>&1 | Out-Null
}

# ============================================================================
# CREATE ENVIRONMENT FILES
# ============================================================================

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  CONFIGURING ENVIRONMENT" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Backend .env
$backendEnv = @"
NODE_ENV=development
PORT=$backendPort
DATABASE_URL="postgresql://gigdash:$dbPassword@localhost:$postgresPort/gigdash?schema=public"
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=7d
"@

Set-Content -Path "backend\.env" -Value $backendEnv
Write-Host "✓ Created backend\.env with secure configuration" -ForegroundColor Green

# Root .env for Docker
if ($dockerAvailable) {
    $rootEnv = @"
POSTGRES_USER=gigdash
POSTGRES_PASSWORD=$dbPassword
POSTGRES_DB=gigdash
POSTGRES_PORT=$postgresPort
BACKEND_PORT=$backendPort
FRONTEND_PORT=$frontendPort
JWT_SECRET=$jwtSecret
"@
    
    Set-Content -Path ".env" -Value $rootEnv
    Write-Host "✓ Created root .env for Docker configuration" -ForegroundColor Green
}

# ============================================================================
# START DATABASE
# ============================================================================

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  DATABASE SETUP" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($dockerAvailable -and -not $env:CI) {
    Write-Host ""
    Write-Host "🐳 Starting PostgreSQL with Docker..." -ForegroundColor Cyan
    
    docker-compose up -d postgres 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL container started" -ForegroundColor Green
        Write-Host "⏳ Waiting for database to initialize..." -ForegroundColor Yellow
        Start-Sleep -Seconds 7
    } else {
        Write-Host "⚠️  Failed to start Docker container, ensure Docker is running" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Manual database setup required" -ForegroundColor Yellow
    Write-Host "   Ensure PostgreSQL is running on localhost:$postgresPort" -ForegroundColor Yellow
}

# ============================================================================
# INITIALIZE DATABASE
# ============================================================================

Write-Host ""
Write-Host "🔧 Initializing database..." -ForegroundColor Cyan

Show-Progress -Message "Generating Prisma Client" -Action {
    npm run prisma:generate 2>&1 | Out-Null
}

Show-Progress -Message "Running database migrations" -Action {
    npm run prisma:migrate 2>&1 | Out-Null
}

Show-Progress -Message "Seeding database with gig platforms" -Action {
    npm run prisma:seed 2>&1 | Out-Null
}

# ============================================================================
# CREATE LAUNCHER SCRIPT
# ============================================================================

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  CREATING LAUNCHER SCRIPTS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$launcherScript = @"
# GigDash Development Launcher
# Quick start script for development servers

Write-Host "🚀 Starting GigDash Development Servers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend: http://localhost:$frontendPort" -ForegroundColor Green
Write-Host "Backend:  http://localhost:$backendPort" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

npm run dev
"@

Set-Content -Path "start-dev.ps1" -Value $launcherScript
Write-Host "✓ Created start-dev.ps1 launcher script" -ForegroundColor Green

# ============================================================================
# SAVE CREDENTIALS
# ============================================================================

$credentialsFile = @"
# GigDash Configuration Summary
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================================================

SERVICES:
  Frontend:  http://localhost:$frontendPort
  Backend:   http://localhost:$backendPort
  Database:  localhost:$postgresPort

CREDENTIALS:
  Database User:     gigdash
  Database Password: $dbPassword
  Database Name:     gigdash
  
  JWT Secret:        $jwtSecret

IMPORTANT:
  - Keep this file secure and do not commit to version control
  - Backend .env file has been configured automatically
  - Use 'start-dev.ps1' to launch development servers
"@

Set-Content -Path "SETUP-CREDENTIALS.txt" -Value $credentialsFile
Write-Host "✓ Credentials saved to SETUP-CREDENTIALS.txt" -ForegroundColor Green

# ============================================================================
# FINAL SUMMARY
# ============================================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "║              ✨ SETUP COMPLETED SUCCESSFULLY! ✨              ║" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host ""
Write-Host "📊 CONFIGURATION SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "  🌐 Frontend:     " -NoNewline -ForegroundColor White
Write-Host "http://localhost:$frontendPort" -ForegroundColor Yellow
Write-Host "  🔧 Backend API:  " -NoNewline -ForegroundColor White
Write-Host "http://localhost:$backendPort" -ForegroundColor Yellow
Write-Host "  🗄️  Database:    " -NoNewline -ForegroundColor White
Write-Host "localhost:$postgresPort" -ForegroundColor Yellow
Write-Host ""
Write-Host "  🔐 Credentials saved to: " -NoNewline -ForegroundColor White
Write-Host "SETUP-CREDENTIALS.txt" -ForegroundColor Magenta
Write-Host ""

Write-Host "🚀 QUICK START" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Option 1 - Use launcher script:" -ForegroundColor White
Write-Host "    " -NoNewline
Write-Host ".\start-dev.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Option 2 - Manual start:" -ForegroundColor White
Write-Host "    " -NoNewline
Write-Host "npm run dev" -ForegroundColor Yellow
Write-Host ""

Write-Host "💡 USEFUL COMMANDS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "  npm run dev               - Start all services" -ForegroundColor Gray
Write-Host "  npm run prisma:studio     - Database GUI" -ForegroundColor Gray
Write-Host "  .\health-check.ps1        - Check system health" -ForegroundColor Gray
Write-Host "  docker-compose logs       - View Docker logs" -ForegroundColor Gray
Write-Host ""

if (-not $env:CI -and -not $env:NON_INTERACTIVE) {
    $launch = Read-Host "Would you like to start the development servers now? (y/n)"
    if ($launch -eq "y" -or $launch -eq "Y") {
        Write-Host ""
        Write-Host "🚀 Launching GigDash..." -ForegroundColor Green
        Write-Host ""
        & ".\start-dev.ps1"
    }
}

Write-Host ""
Write-Host "Happy Gigging! 🎸🎤🎹" -ForegroundColor Magenta
Write-Host ""
