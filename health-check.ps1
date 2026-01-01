# ============================================================================
# GigDash Health Check & Monitoring Script
# Comprehensive service monitoring with intelligent diagnostics
# ============================================================================

$ErrorActionPreference = "Continue"

# Configuration
$FRONTEND_PORT = 3000
$BACKEND_PORT = 5000
$POSTGRES_PORT = 5432
$TIMEOUT_SECONDS = 5

# Status tracking
$allHealthy = $true

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Show-Header {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║          🏥 GIGDASH HEALTH CHECK & MONITORING 🏥             ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host ""
}

function Test-HttpEndpoint {
    param(
        [string]$Url,
        [int]$Timeout = $TIMEOUT_SECONDS
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $Timeout -UseBasicParsing -ErrorAction Stop
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            ResponseTime = $response.Headers.'X-Response-Time'
        }
    } catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

function Test-TcpPort {
    param(
        [string]$Host,
        [int]$Port,
        [int]$Timeout = $TIMEOUT_SECONDS
    )
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $asyncResult = $tcpClient.BeginConnect($Host, $Port, $null, $null)
        $wait = $asyncResult.AsyncWaitHandle.WaitOne($Timeout * 1000)
        
        if ($wait) {
            $tcpClient.EndConnect($asyncResult)
            $tcpClient.Close()
            return $true
        } else {
            $tcpClient.Close()
            return $false
        }
    } catch {
        return $false
    }
}

function Get-ServiceStatus {
    param(
        [string]$Name,
        [bool]$IsHealthy,
        [string]$Details = ""
    )
    
    $icon = if ($IsHealthy) { "✓" } else { "✗" }
    $color = if ($IsHealthy) { "Green" } else { "Red" }
    
    Write-Host "  $icon " -NoNewline -ForegroundColor $color
    Write-Host "$Name" -NoNewline -ForegroundColor White
    
    if ($Details) {
        Write-Host " - $Details" -ForegroundColor Gray
    } else {
        Write-Host ""
    }
    
    if (-not $IsHealthy) {
        $script:allHealthy = $false
    }
}

function Get-DiskSpace {
    $drive = Get-PSDrive -Name C
    $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
    $totalSpaceGB = [math]::Round(($drive.Used + $drive.Free) / 1GB, 2)
    $percentFree = [math]::Round(($drive.Free / ($drive.Used + $drive.Free)) * 100, 1)
    
    return @{
        FreeGB = $freeSpaceGB
        TotalGB = $totalSpaceGB
        PercentFree = $percentFree
    }
}

function Get-MemoryUsage {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $totalMemoryGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
    $freeMemoryGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
    $usedMemoryGB = [math]::Round($totalMemoryGB - $freeMemoryGB, 2)
    $percentUsed = [math]::Round(($usedMemoryGB / $totalMemoryGB) * 100, 1)
    
    return @{
        TotalGB = $totalMemoryGB
        UsedGB = $usedMemoryGB
        FreeGB = $freeMemoryGB
        PercentUsed = $percentUsed
    }
}

# ============================================================================
# MAIN HEALTH CHECKS
# ============================================================================

Show-Header

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  SERVICE STATUS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check Frontend
Write-Host "🌐 Frontend (React)" -ForegroundColor Yellow
$frontendUrl = "http://localhost:$FRONTEND_PORT"
$frontendHealth = Test-HttpEndpoint -Url $frontendUrl

if ($frontendHealth.Success) {
    Get-ServiceStatus -Name "Frontend Server" -IsHealthy $true -Details "Running on port $FRONTEND_PORT"
    Get-ServiceStatus -Name "HTTP Response" -IsHealthy $true -Details "Status $($frontendHealth.StatusCode)"
} else {
    Get-ServiceStatus -Name "Frontend Server" -IsHealthy $false -Details "Not responding on port $FRONTEND_PORT"
    Write-Host "     Error: $($frontendHealth.Error)" -ForegroundColor Red
}
Write-Host ""

# Check Backend
Write-Host "🔧 Backend (Node.js/Express)" -ForegroundColor Yellow
$backendUrl = "http://localhost:$BACKEND_PORT/api/health"
$backendHealth = Test-HttpEndpoint -Url $backendUrl

if ($backendHealth.Success) {
    Get-ServiceStatus -Name "Backend API" -IsHealthy $true -Details "Running on port $BACKEND_PORT"
    Get-ServiceStatus -Name "Health Endpoint" -IsHealthy $true -Details "Status $($backendHealth.StatusCode)"
} else {
    # Try basic port check
    $portOpen = Test-TcpPort -Host "localhost" -Port $BACKEND_PORT
    if ($portOpen) {
        Get-ServiceStatus -Name "Backend API" -IsHealthy $true -Details "Running on port $BACKEND_PORT"
        Get-ServiceStatus -Name "Health Endpoint" -IsHealthy $false -Details "Endpoint not available"
    } else {
        Get-ServiceStatus -Name "Backend API" -IsHealthy $false -Details "Not responding on port $BACKEND_PORT"
    }
}
Write-Host ""

# Check Database
Write-Host "🗄️  Database (PostgreSQL)" -ForegroundColor Yellow
$dbConnected = Test-TcpPort -Host "localhost" -Port $POSTGRES_PORT

if ($dbConnected) {
    Get-ServiceStatus -Name "PostgreSQL" -IsHealthy $true -Details "Accepting connections on port $POSTGRES_PORT"
} else {
    Get-ServiceStatus -Name "PostgreSQL" -IsHealthy $false -Details "Not responding on port $POSTGRES_PORT"
}
Write-Host ""

# Check Docker Containers
Write-Host "🐳 Docker Containers" -ForegroundColor Yellow
try {
    docker ps --format "table {{.Names}}\t{{.Status}}" | Out-Null
    $containers = docker ps --filter "name=gigdash" --format "{{.Names}}:{{.Status}}"
    
    if ($containers) {
        foreach ($container in $containers) {
            $parts = $container -split ':'
            $name = $parts[0]
            $status = $parts[1]
            $isHealthy = $status -match "Up"
            Get-ServiceStatus -Name $name -IsHealthy $isHealthy -Details $status
        }
    } else {
        Get-ServiceStatus -Name "Docker Containers" -IsHealthy $true -Details "No GigDash containers running (may be using local services)"
    }
} catch {
    Get-ServiceStatus -Name "Docker" -IsHealthy $false -Details "Docker not available or not running"
}
Write-Host ""

# ============================================================================
# SYSTEM RESOURCES
# ============================================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  SYSTEM RESOURCES" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Disk Space
$disk = Get-DiskSpace
Write-Host "💾 Disk Space" -ForegroundColor Yellow
Write-Host "  Free: $($disk.FreeGB) GB / $($disk.TotalGB) GB ($($disk.PercentFree)% available)" -ForegroundColor Gray

if ($disk.PercentFree -lt 10) {
    Write-Host "  ⚠️  WARNING: Low disk space!" -ForegroundColor Red
    $script:allHealthy = $false
} elseif ($disk.PercentFree -lt 20) {
    Write-Host "  ⚠️  Disk space getting low" -ForegroundColor Yellow
}
Write-Host ""

# Memory Usage
$memory = Get-MemoryUsage
Write-Host "🧠 Memory Usage" -ForegroundColor Yellow
Write-Host "  Used: $($memory.UsedGB) GB / $($memory.TotalGB) GB ($($memory.PercentUsed)% used)" -ForegroundColor Gray

if ($memory.PercentUsed -gt 90) {
    Write-Host "  ⚠️  WARNING: High memory usage!" -ForegroundColor Red
    $script:allHealthy = $false
} elseif ($memory.PercentUsed -gt 80) {
    Write-Host "  ⚠️  Memory usage is high" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================================
# LOG FILE ANALYSIS
# ============================================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  LOG ANALYSIS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check for common error patterns
$logPatterns = @{
    "ECONNREFUSED" = "Database connection refused"
    "EADDRINUSE" = "Port already in use"
    "ENOTFOUND" = "DNS/hostname resolution failed"
    "Error:" = "General error occurred"
    "Warning:" = "Warning issued"
}

# Try to find recent logs
$logChecked = $false
if (Test-Path "backend/logs") {
    $recentLog = Get-ChildItem "backend/logs" -Filter "*.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($recentLog) {
        $logContent = Get-Content $recentLog.FullName -Tail 50 -ErrorAction SilentlyContinue
        $errorCount = 0
        $warningCount = 0
        
        foreach ($pattern in $logPatterns.Keys) {
            $matches = $logContent | Select-String -Pattern $pattern
            if ($matches.Count -gt 0) {
                if ($pattern -match "Error") {
                    $errorCount += $matches.Count
                } else {
                    $warningCount += $matches.Count
                }
            }
        }
        
        Write-Host "📋 Recent Logs ($($recentLog.Name))" -ForegroundColor Yellow
        if ($errorCount -gt 0) {
            Write-Host "  ✗ $errorCount error(s) found in recent logs" -ForegroundColor Red
            $script:allHealthy = $false
        }
        if ($warningCount -gt 0) {
            Write-Host "  ⚠️  $warningCount warning(s) found in recent logs" -ForegroundColor Yellow
        }
        if ($errorCount -eq 0 -and $warningCount -eq 0) {
            Write-Host "  ✓ No recent errors or warnings" -ForegroundColor Green
        }
        $logChecked = $true
    }
}

if (-not $logChecked) {
    Write-Host "📋 Logs" -ForegroundColor Yellow
    Write-Host "  No log files found" -ForegroundColor Gray
}
Write-Host ""

# ============================================================================
# RECOMMENDATIONS
# ============================================================================

if (-not $allHealthy) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  💡 RECOMMENDATIONS" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $frontendHealth.Success) {
        Write-Host "  Frontend Issue:" -ForegroundColor Yellow
        Write-Host "    • Check if frontend is running: npm run dev:frontend" -ForegroundColor Gray
        Write-Host "    • Check port $FRONTEND_PORT is not in use" -ForegroundColor Gray
        Write-Host ""
    }
    
    if (-not $backendHealth.Success) {
        Write-Host "  Backend Issue:" -ForegroundColor Yellow
        Write-Host "    • Check if backend is running: npm run dev:backend" -ForegroundColor Gray
        Write-Host "    • Verify backend/.env file exists and is configured" -ForegroundColor Gray
        Write-Host "    • Check port $BACKEND_PORT is not in use" -ForegroundColor Gray
        Write-Host ""
    }
    
    if (-not $dbConnected) {
        Write-Host "  Database Issue:" -ForegroundColor Yellow
        Write-Host "    • Start PostgreSQL: docker-compose up -d postgres" -ForegroundColor Gray
        Write-Host "    • Check Docker is running: docker ps" -ForegroundColor Gray
        Write-Host "    • Verify port $POSTGRES_PORT is not in use" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "  Quick Fix Commands:" -ForegroundColor Yellow
    Write-Host "    • Restart all services: docker-compose restart" -ForegroundColor Gray
    Write-Host "    • View logs: docker-compose logs -f" -ForegroundColor Gray
    Write-Host "    • Reset environment: .\reset-dev.ps1" -ForegroundColor Gray
    Write-Host ""
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  OVERALL STATUS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($allHealthy) {
    Write-Host "  ✅ All systems operational!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  🌐 Frontend:  http://localhost:$FRONTEND_PORT" -ForegroundColor Cyan
    Write-Host "  🔧 Backend:   http://localhost:$BACKEND_PORT" -ForegroundColor Cyan
    Write-Host "  🗄️  Database:  localhost:$POSTGRES_PORT" -ForegroundColor Cyan
} else {
    Write-Host "  ⚠️  Some issues detected - see recommendations above" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Run this script again after applying fixes" -ForegroundColor Gray
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Exit code indicates health status
if ($allHealthy) {
    exit 0
} else {
    exit 1
}
