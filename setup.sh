#!/bin/bash
# GigDash Setup Script for macOS/Linux
# This script automates the entire setup process

set -e  # Exit on any error

echo "🚀 GigDash Setup Script"
echo "======================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18 or higher is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Set up environment variables
echo "⚙️  Setting up environment variables..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓ Created backend/.env from backend/.env.example${NC}"
    echo -e "${YELLOW}⚠️  Please edit backend/.env and update DATABASE_URL and JWT_SECRET${NC}"
    echo ""
    echo "Current backend/.env contents:"
    cat backend/.env
    echo ""
    if [ -z "$CI" ] && [ -z "$NON_INTERACTIVE" ]; then
        read -p "Press Enter to continue after updating backend/.env, or Ctrl+C to exit and update manually..."
    else
        echo "Running in non-interactive mode, continuing..."
    fi
else
    echo -e "${YELLOW}⚠️  backend/.env already exists, skipping...${NC}"
fi
echo ""

# Step 3: Check if Docker is available
USE_DOCKER=false
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓ Docker detected${NC}"
    read -p "Would you like to use Docker for PostgreSQL? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        USE_DOCKER=true
    fi
fi

# Step 4: Start database
if [ "$USE_DOCKER" = true ]; then
    echo "🐳 Starting PostgreSQL with Docker..."
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env for Docker configuration${NC}"
    fi
    
    docker-compose up -d postgres
    echo -e "${GREEN}✓ PostgreSQL container started${NC}"
    echo "⏳ Waiting 5 seconds for PostgreSQL to initialize..."
    sleep 5
else
    echo -e "${YELLOW}⚠️  Skipping Docker setup. Make sure PostgreSQL is running locally.${NC}"
    echo "   You can start PostgreSQL manually or install Docker and run:"
    echo "   docker-compose up -d postgres"
fi
echo ""

# Step 5: Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"
echo ""

# Step 6: Run database migrations
echo "🗄️  Running database migrations..."
npm run prisma:migrate
echo -e "${GREEN}✓ Database migrations completed${NC}"
echo ""

# Step 7: Seed the database
echo "🌱 Seeding database with gig platforms..."
npm run prisma:seed
echo -e "${GREEN}✓ Database seeded successfully${NC}"
echo ""

# Summary
echo "============================================"
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo "============================================"
echo ""
echo "📝 Next steps:"
echo "   1. Start the development servers:"
echo "      npm run dev"
echo ""
echo "   2. Open your browser:"
echo "      Frontend: http://localhost:3000"
echo "      Backend:  http://localhost:5000"
echo ""
echo "   3. Register a new account and start using GigDash!"
echo ""
echo "💡 Useful commands:"
echo "   npm run dev          - Start both frontend and backend"
echo "   npm run dev:backend  - Start backend only"
echo "   npm run dev:frontend - Start frontend only"
echo "   npm run prisma:studio - Open Prisma Studio (database GUI)"
echo "   docker-compose up -d  - Start all services with Docker"
echo ""
