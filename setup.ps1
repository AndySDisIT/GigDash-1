# GigDash Setup Script for Windows (PowerShell)
# This script automates the entire setup process

$ErrorActionPreference = "Stop"

Write-Host "🚀 GigDash Setup Script" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✓ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check Node version
$nodeVersionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($nodeVersionNumber -lt 18) {
    Write-Host "❌ Node.js version 18 or higher is required. Current version: $nodeVersion" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm -v
    Write-Host "✓ npm $npmVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 1: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Set up environment variables
Write-Host "⚙️  Setting up environment variables..." -ForegroundColor Cyan
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✓ Created backend\.env from backend\.env.example" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANT: Please update backend\.env with your configuration!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Current backend\.env contents:" -ForegroundColor Cyan
    Get-Content "backend\.env"
    Write-Host ""
    Write-Host "Required changes:" -ForegroundColor Yellow
    Write-Host "  1. DATABASE_URL - Update with your PostgreSQL connection string" -ForegroundColor Yellow
    Write-Host "  2. JWT_SECRET - Change to a secure random string" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Press Enter to continue after updating backend\.env, or Ctrl+C to exit"
} else {
    Write-Host "⚠️  backend\.env already exists, skipping..." -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Check if Docker is available
$useDocker = $false
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
    Write-Host "✓ Docker detected" -ForegroundColor Green
    $response = Read-Host "Would you like to use Docker for PostgreSQL? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        $useDocker = $true
    }
} catch {
    Write-Host "⚠️  Docker not detected" -ForegroundColor Yellow
}

# Step 4: Start database
if ($useDocker) {
    Write-Host "🐳 Starting PostgreSQL with Docker..." -ForegroundColor Cyan
    
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ Created .env from .env.example" -ForegroundColor Green
        Write-Host "⚠️  Please edit .env for Docker configuration" -ForegroundColor Yellow
    }
    
    docker-compose up -d postgres
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to start PostgreSQL container" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ PostgreSQL container started" -ForegroundColor Green
    Write-Host "⏳ Waiting 5 seconds for PostgreSQL to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
} else {
    Write-Host "⚠️  Skipping Docker setup. Make sure PostgreSQL is running locally." -ForegroundColor Yellow
    Write-Host "   You can start PostgreSQL manually or install Docker and run:" -ForegroundColor Yellow
    Write-Host "   docker-compose up -d postgres" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Generate Prisma Client
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Cyan
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    Write-Host "   Make sure DATABASE_URL in backend\.env is correct" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Prisma Client generated" -ForegroundColor Green
Write-Host ""

# Step 6: Run database migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
npm run prisma:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to run database migrations" -ForegroundColor Red
    Write-Host "   Make sure PostgreSQL is running and DATABASE_URL is correct" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Database migrations completed" -ForegroundColor Green
Write-Host ""

# Step 7: Seed the database
Write-Host "🌱 Seeding database with gig platforms..." -ForegroundColor Cyan
npm run prisma:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to seed database" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database seeded successfully" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "============================================" -ForegroundColor Green
Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Start the development servers:" -ForegroundColor White
Write-Host "      npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "   2. Open your browser:" -ForegroundColor White
Write-Host "      Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "      Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "   3. Register a new account and start using GigDash!" -ForegroundColor White
Write-Host ""
Write-Host "💡 Useful commands:" -ForegroundColor Cyan
Write-Host "   npm run dev          - Start both frontend and backend" -ForegroundColor White
Write-Host "   npm run dev:backend  - Start backend only" -ForegroundColor White
Write-Host "   npm run dev:frontend - Start frontend only" -ForegroundColor White
Write-Host "   npm run prisma:studio - Open Prisma Studio (database GUI)" -ForegroundColor White
Write-Host "   docker-compose up -d  - Start all services with Docker" -ForegroundColor White
Write-Host ""
