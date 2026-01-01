# PowerShell Automation Guide

## Overview

GigDash includes a comprehensive suite of PowerShell automation scripts designed to streamline development, deployment, and maintenance workflows. These scripts provide zero-configuration setup, intelligent monitoring, and production-grade deployment capabilities.

## 📜 Available Scripts

### 1. `setup-godtier.ps1` - Automated Setup

**Purpose**: Complete zero-configuration setup of the entire GigDash environment.

**Features**:
- ✨ ASCII art banner with branding
- 🔄 Animated progress indicators with spinner animations
- 🔍 Automatic prerequisite detection (Node.js, npm, Docker, PostgreSQL)
- 🔐 Auto-generated secure credentials (JWT secrets, database passwords)
- 🔌 Smart port detection and auto-assignment
- ⚙️ Automatic environment file generation
- 🐳 Intelligent Docker PostgreSQL setup with local fallback
- 🗄️ Automatic Prisma migrations and database seeding
- 🚀 Developer launcher script creation
- 📊 Configuration summary display
- 💾 Secure credentials storage

**Usage**:
```powershell
.\setup-godtier.ps1
```

**What It Does**:
1. Checks Node.js version (requires 18+)
2. Verifies npm installation
3. Detects Docker availability
4. Generates cryptographically secure JWT secret
5. Generates strong database password
6. Checks for port conflicts (5000, 3000, 5432)
7. Installs all dependencies
8. Creates `backend/.env` with secure defaults
9. Creates root `.env` for Docker Compose
10. Starts PostgreSQL via Docker (if available)
11. Generates Prisma Client
12. Runs database migrations
13. Seeds database with gig platforms
14. Creates `start-dev.ps1` launcher
15. Saves credentials to `SETUP-CREDENTIALS.txt`
16. Optionally launches development servers

**Generated Files**:
- `backend/.env` - Backend environment configuration
- `.env` - Docker Compose environment variables
- `start-dev.ps1` - Quick launcher for dev servers
- `SETUP-CREDENTIALS.txt` - Secure credentials reference

---

### 2. `health-check.ps1` - System Monitoring

**Purpose**: Comprehensive health monitoring for all GigDash services.

**Features**:
- 🌐 Frontend health check (HTTP endpoint testing)
- 🔧 Backend API health check
- 🗄️ PostgreSQL database connectivity check
- 🐳 Docker container status monitoring
- 💾 Disk space warnings
- 🧠 Memory usage monitoring
- 📋 Log file analysis for errors
- 🔍 Performance metrics (response times)
- 💡 Automatic restart suggestions

**Usage**:
```powershell
.\health-check.ps1
```

**Health Checks Performed**:

| Check | What It Tests | Healthy If |
|-------|---------------|------------|
| Frontend | HTTP response on port 3000 | Status 200 OK |
| Backend | HTTP response on port 5000 | Status 200 OK |
| Database | TCP connection on port 5432 | Connection succeeds |
| Docker | Container status | Containers running |
| Disk | Free disk space | > 10% available |
| Memory | RAM usage | < 90% used |
| Logs | Recent error patterns | No critical errors |

**Output**:
- ✅ Green checkmarks for healthy services
- ❌ Red X for unhealthy services
- ⚠️ Yellow warnings for potential issues
- 💡 Actionable recommendations

**Exit Codes**:
- `0` - All systems healthy
- `1` - Issues detected

---

### 3. `backup-db.ps1` - Database Backup

**Purpose**: Automated PostgreSQL database backup with compression.

**Features**:
- 📦 Automated `pg_dump` execution
- 🕐 Timestamped backup files
- 🗜️ Automatic ZIP compression
- 🔄 Docker and local PostgreSQL support
- 🧹 Automatic cleanup (keeps last 10 backups)
- 📊 Backup size reporting

**Usage**:
```powershell
.\backup-db.ps1
```

**Backup Location**:
```
/backups/gigdash_backup_YYYYMMDD_HHMMSS.zip
```

**Backup Process**:
1. Reads database password from `.env` files
2. Creates `backups/` directory if needed
3. Executes `pg_dump` (via Docker or local)
4. Compresses SQL dump to ZIP
5. Removes uncompressed file
6. Lists recent backups
7. Cleans up old backups (keeps 10 most recent)

**Restore a Backup**:
```powershell
# 1. Extract the ZIP file
Expand-Archive -Path "backups\gigdash_backup_YYYYMMDD_HHMMSS.zip" -DestinationPath "backups\temp"

# 2. Restore to database
# Using Docker:
Get-Content "backups\temp\gigdash_backup_YYYYMMDD_HHMMSS.sql" | docker exec -i postgres psql -U gigdash -d gigdash

# Using local PostgreSQL:
psql -U gigdash -d gigdash -f "backups\temp\gigdash_backup_YYYYMMDD_HHMMSS.sql"
```

---

### 4. `reset-dev.ps1` - Development Reset

**Purpose**: Complete environment reset for a fresh development start.

**Features**:
- 🛑 Stop all running services
- 🗑️ Clear all databases
- 📦 Remove node_modules
- 🔄 Reinstall dependencies
- 🗄️ Reset database with fresh migrations
- 🌱 Regenerate seed data

**Usage**:
```powershell
.\reset-dev.ps1
```

**⚠️ WARNING**: This script destroys all data! Use with caution.

**What Gets Removed**:
- All Docker containers and volumes
- `node_modules/` (root, frontend, backend)
- `package-lock.json` files
- `frontend/dist/` and `backend/dist/`
- Prisma client cache
- All database data

**What Gets Recreated**:
- Fresh npm dependencies
- Prisma Client
- Database schema (via migrations)
- Seed data (gig platforms)

**Confirmation**:
- Requires typing "yes" to confirm (unless `$env:FORCE_RESET` is set)
- Safe for CI/CD with `$env:CI` or `$env:FORCE_RESET` flags

---

### 5. `test-runner.ps1` - Test Automation

**Purpose**: Unified test runner for frontend and backend with coverage reports.

**Features**:
- 🧪 Frontend tests (Vitest)
- 🔬 Backend tests (Jest)
- 📊 Code coverage reports
- 🔍 ESLint checks
- ⏱️ Performance timing
- 📈 Test summary with pass/fail counts

**Usage**:
```powershell
# Run all tests
.\test-runner.ps1

# Backend tests only
.\test-runner.ps1 --backend-only

# Frontend tests only
.\test-runner.ps1 --frontend-only

# With coverage reports
.\test-runner.ps1 --coverage

# Watch mode (interactive)
.\test-runner.ps1 --watch
```

**Test Phases**:
1. **Backend Tests** - Jest unit and integration tests
2. **Frontend Tests** - Vitest component and unit tests
3. **Code Quality** - ESLint checks for both

**Coverage Reports**:
- Backend: `backend/coverage/lcov-report/index.html`
- Frontend: `frontend/coverage/index.html`

**Exit Codes**:
- `0` - All tests passed
- `1` - Some tests failed

---

### 6. `deploy-production.ps1` - Production Deployment

**Purpose**: Automated production deployment with validation and rollback.

**Features**:
- ✅ Pre-deployment environment validation
- 📦 Automatic database backup
- 🧪 Pre-deploy test execution
- 🔨 Optimized production builds
- 🐳 Docker image creation with versioning
- 🏥 Post-deployment health checks
- 🔙 Rollback capability
- 📊 Deployment summary

**Usage**:
```powershell
.\deploy-production.ps1
```

**Deployment Phases**:

1. **Environment Validation**
   - Docker installed?
   - Docker Compose available?
   - `.env` files present?
   - Required env variables set?

2. **Pre-Deployment Backup**
   - Runs `backup-db.ps1`
   - Confirmation to continue without backup

3. **Test Execution**
   - Runs full test suite
   - Aborts if tests fail

4. **Build Process**
   - TypeScript compilation
   - Optimized production bundles
   - Asset minification

5. **Docker Build**
   - Build frontend image
   - Build backend image
   - Tag with version and "latest"

6. **Deployment**
   - Stop existing containers
   - Start new containers
   - Wait for services to initialize

7. **Health Checks**
   - Runs `health-check.ps1`
   - Verifies all services operational

**Version Tagging**:
```
v.YYYYMMDD.HHMMSS
```
Example: `v.20240115.143022`

**Rollback**:
If deployment fails, run:
```powershell
docker-compose down
docker-compose up -d
```

---

## 🎯 Common Workflows

### Initial Setup
```powershell
# Clone repository
git clone https://github.com/AndySDisIT/GigDash-1.git
cd GigDash-1

# Run god-tier setup
.\setup-godtier.ps1
```

### Daily Development
```powershell
# Start dev servers
.\start-dev.ps1

# Check system health
.\health-check.ps1

# Run tests before committing
.\test-runner.ps1
```

### Before Pushing Code
```powershell
# Run all tests with coverage
.\test-runner.ps1 --coverage

# Check system health
.\health-check.ps1
```

### Weekly Maintenance
```powershell
# Backup database
.\backup-db.ps1

# Check system health
.\health-check.ps1
```

### Production Deployment
```powershell
# Deploy to production
.\deploy-production.ps1

# Monitor deployment
.\health-check.ps1
```

### Fresh Start (Reset Everything)
```powershell
# Complete reset
.\reset-dev.ps1

# Setup again
.\setup-godtier.ps1
```

---

## 🔧 Environment Variables

### Backend `.env`
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://gigdash:password@localhost:5432/gigdash?schema=public"
JWT_SECRET=<auto-generated>
JWT_EXPIRES_IN=7d
```

### Root `.env` (Docker)
```env
POSTGRES_USER=gigdash
POSTGRES_PASSWORD=<auto-generated>
POSTGRES_DB=gigdash
POSTGRES_PORT=5432
BACKEND_PORT=5000
FRONTEND_PORT=3000
JWT_SECRET=<auto-generated>
```

---

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Find process using port
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

### Docker Not Starting
```powershell
# Check Docker service
Get-Service docker

# Restart Docker
Restart-Service docker
```

### Database Connection Issues
```powershell
# Check PostgreSQL container
docker ps | findstr postgres

# View logs
docker-compose logs postgres

# Restart container
docker-compose restart postgres
```

### Permission Errors
Run PowerShell as Administrator:
```powershell
# Right-click PowerShell
# Select "Run as Administrator"
```

### Execution Policy
```powershell
# Check current policy
Get-ExecutionPolicy

# Set policy (Admin required)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 🎨 Customization

### Changing Default Ports

Edit script constants:
```powershell
$BACKEND_PORT = 5000   # Change to desired port
$FRONTEND_PORT = 3000  # Change to desired port
$POSTGRES_PORT = 5432  # Change to desired port
```

### Skip Interactive Prompts
```powershell
# Set environment variable
$env:CI = "true"
$env:NON_INTERACTIVE = "true"
```

### Custom Docker Registry
Edit `deploy-production.ps1`:
```powershell
$DOCKER_REGISTRY = "your-registry.io/your-org/gigdash"
```

---

## 📊 Script Dependencies

```
setup-godtier.ps1
├── Node.js 18+
├── npm 9+
├── Docker (optional)
└── PostgreSQL (via Docker or local)

health-check.ps1
├── Running services
└── Network connectivity

backup-db.ps1
├── PostgreSQL client tools
└── Write permissions

reset-dev.ps1
├── Docker (optional)
└── Write permissions

test-runner.ps1
├── Node.js dependencies
└── Test frameworks installed

deploy-production.ps1
├── Docker & Docker Compose
├── backup-db.ps1
├── test-runner.ps1
└── health-check.ps1
```

---

## 🔐 Security Considerations

1. **Credentials Storage**
   - `SETUP-CREDENTIALS.txt` contains sensitive data
   - Add to `.gitignore` (already included)
   - Store securely, never commit to version control

2. **JWT Secrets**
   - Auto-generated with 256-bit entropy
   - Cryptographically secure random generation
   - Change in production

3. **Database Passwords**
   - 24-character random passwords
   - Includes special characters
   - Unique per installation

4. **Backup Security**
   - Backups contain sensitive data
   - Store securely
   - Encrypt for off-site storage

---

## 💡 Best Practices

1. **Run setup-godtier.ps1 only once** per environment
2. **Backup before major changes** using `backup-db.ps1`
3. **Check health regularly** with `health-check.ps1`
4. **Test before deploying** using `test-runner.ps1`
5. **Use reset-dev.ps1** only when needed (destructive)
6. **Monitor deployments** with health checks
7. **Keep credentials secure** - never commit `.env` files

---

## 📚 Additional Resources

- [Main README](./README.md) - Project overview
- [UX Design System](./UX-DESIGN-SYSTEM.md) - UI/UX guidelines
- [Contributing Guide](./CONTRIBUTING.md) - Development workflow
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production setup

---

**Happy Automating! 🚀**
