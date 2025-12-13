#!/bin/bash
# GigDash Setup Verification Script
# Checks if the installation was successful

set -e

echo "🔍 GigDash Setup Verification"
echo "=============================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check if dependencies are installed
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check backend/.env
echo -n "Checking backend/.env... "
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ Exists${NC}"
    
    # Check DATABASE_URL
    if grep -q "DATABASE_URL=" backend/.env; then
        DB_URL=$(grep "DATABASE_URL=" backend/.env | cut -d'=' -f2 | tr -d '"')
        if [[ $DB_URL == *"user:password"* ]]; then
            echo -e "${YELLOW}  ⚠️  DATABASE_URL still contains example values${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
    
    # Check JWT_SECRET
    if grep -q "JWT_SECRET=" backend/.env; then
        JWT=$(grep "JWT_SECRET=" backend/.env | cut -d'=' -f2)
        if [[ $JWT == *"change"* ]] || [[ $JWT == *"example"* ]]; then
            echo -e "${YELLOW}  ⚠️  JWT_SECRET should be changed for production${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
else
    echo -e "${RED}✗ Not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check PostgreSQL connection
echo -n "Checking PostgreSQL... "
if command -v docker &> /dev/null; then
    if docker ps | grep -q postgres; then
        echo -e "${GREEN}✓ Running (Docker)${NC}"
    else
        if command -v psql &> /dev/null; then
            echo -e "${YELLOW}⚠️  Docker container not running, checking local PostgreSQL...${NC}"
            WARNINGS=$((WARNINGS + 1))
        else
            echo -e "${RED}✗ Not running${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Docker not available${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check Prisma Client
echo -n "Checking Prisma Client... "
if [ -d "node_modules/.prisma/client" ] || [ -d "backend/node_modules/.prisma/client" ]; then
    echo -e "${GREEN}✓ Generated${NC}"
else
    echo -e "${RED}✗ Not generated${NC}"
    echo -e "  Run: ${YELLOW}npm run prisma:generate${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check if database is migrated
echo -n "Checking database migrations... "
if [ -d "backend/prisma/migrations" ]; then
    MIGRATION_COUNT=$(ls -1 backend/prisma/migrations | wc -l)
    if [ $MIGRATION_COUNT -gt 0 ]; then
        echo -e "${GREEN}✓ $MIGRATION_COUNT migration(s) found${NC}"
    else
        echo -e "${YELLOW}⚠️  No migrations found${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Migrations directory not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "=============================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Setup verification passed!${NC}"
    echo ""
    echo "You're ready to start developing:"
    echo "  npm run dev"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Setup verification passed with warnings ($WARNINGS)${NC}"
    echo ""
    echo "Your setup should work, but consider addressing the warnings above."
else
    echo -e "${RED}❌ Setup verification failed with $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "Please fix the errors above before continuing."
    echo "For help, see the Troubleshooting section in README.md"
    exit 1
fi
