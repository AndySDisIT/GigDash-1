# GigDash - Ultimate Gig Aggregator Platform

A production-ready, full-stack gig aggregator platform that brings together opportunities from multiple platforms (DoorDash, Amazon Flex, Mystery Shopping, ShiftSmart, and more) into one unified dashboard. Built with modern technologies and best practices for scalability, security, and maintainability.

## 🚀 Features

### Job Marketplace & Aggregation
- **Multi-Platform Integration**: Connect to 12+ gig platforms including DoorDash, Amazon Flex, Instacart, Mystery Shopping, Secret Shop, ivueit, ShiftSmart, TaskRabbit, and more
- **Unified Job Feed**: Browse all available opportunities in one place with advanced filtering
- **Smart Filtering**: Filter by category, location, pay rate, effort level, and platform
- **Application Tracking**: Manage all your job applications across platforms

### Payment Management
- **Payment Tracking**: Track expected and received payments from each platform
- **Payment Calendar**: See when payments are due and track payment history
- **Earnings Dashboard**: View total pending, processing, and paid amounts
- **Platform-Specific Tracking**: Organize payments by platform and job

### Route Optimization
- **Smart Route Planning**: Create efficient routes for multiple jobs
- **Distance & Time Estimates**: Calculate total distance and time for routes
- **Job Sequencing**: Optimize stop order to maximize efficiency
- **Route Status Tracking**: Track in-progress and completed routes

### Platform Management
- **Account Linking**: Connect your accounts from multiple platforms
- **Status Monitoring**: Track connection status for each platform
- **Onboarding Support**: Get started with new platforms easily

### Core Features
- **Authentication System**: Secure JWT-based authentication with bcrypt password hashing
- **Personal Gig Management**: Track your own scheduled performances and events
- **Real-time Filtering**: Filter and search across all your gigs and opportunities
- **Responsive UI**: Beautiful, mobile-friendly interface built with React and TailwindCSS
- **Type Safety**: Full TypeScript implementation across frontend and backend
- **Database**: PostgreSQL with Prisma ORM for type-safe database access
- **REST API**: Well-structured Express.js API with validation and error handling
- **Docker Ready**: Complete Docker setup for easy deployment
- **Testing**: Jest and Vitest configured for backend and frontend testing

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast builds
- **TailwindCSS** for styling
- **React Router** for navigation
- **Zustand** for state management
- **React Hook Form** for form handling
- **Axios** for API calls
- **Vitest** for testing

### Backend
- **Node.js** with TypeScript
- **Express.js** framework
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **bcrypt** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers
- **Morgan** for logging
- **Jest** for testing

### DevOps
- **Docker & Docker Compose** for containerization
- **ESLint** for code linting
- **Prettier** for code formatting
- **npm workspaces** for monorepo management

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+ (or use Docker)
- Docker and Docker Compose (optional, for containerized deployment)

## 🚀 Quick Start

### Automated Setup (Recommended)

The easiest way to get started is using our automated setup scripts:

**For Windows (PowerShell):**
```powershell
git clone https://github.com/AndySDisIT/GigDash-1.git
cd GigDash-1
.\setup.ps1
```

**For macOS/Linux:**
```bash
git clone https://github.com/AndySDisIT/GigDash-1.git
cd GigDash-1
chmod +x setup.sh
./setup.sh
```

The setup script will:
- ✅ Install all dependencies
- ✅ Create environment files
- ✅ Start PostgreSQL (with Docker if available)
- ✅ Run database migrations
- ✅ Seed the database with 12 gig platforms
- ✅ Verify everything is working

### Manual Setup

If you prefer to set things up manually:

#### 1. Clone and Install

```bash
git clone https://github.com/AndySDisIT/GigDash-1.git
cd GigDash-1
npm install
```

#### 2. Configure Environment Variables

**Backend:**
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://gigdash:your-password@localhost:5432/gigdash?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

**Important:** 
- Change `JWT_SECRET` to a secure random string (generate with: `openssl rand -base64 32`)
- Update `DATABASE_URL` with your PostgreSQL credentials

#### 3. Start Database

**Option A: Using Docker (Recommended)**
```bash
# Copy Docker environment file
cp .env.example .env

# Start PostgreSQL
docker-compose up -d postgres

# Wait 5 seconds for initialization
```

**Option B: Using Local PostgreSQL**
```bash
# Create database
createdb gigdash

# Make sure PostgreSQL is running on localhost:5432
```

#### 4. Initialize Database

Run these commands from the root directory:

```bash
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed with gig platforms
```

The seed command populates the database with 12 popular gig platforms:
- **Delivery:** DoorDash, Amazon Flex, Uber Eats, Instacart
- **Mystery Shopping:** Mystery Shopping, Secret Shop
- **Inventory:** ivueit, Field Agent
- **Shift Work:** ShiftSmart
- **Task-Based:** TaskRabbit, Gigwalk
- **Merchandising:** Merchandiser

#### 5. Start Development Servers

```bash
npm run dev
```

This starts both servers:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

Or start them separately:
```bash
npm run dev:backend   # Backend only
npm run dev:frontend  # Frontend only
```

**Note:** All npm scripts work cross-platform (Windows, Mac, Linux) thanks to `cross-env`.

### Verify Your Setup

After setup, verify everything is working correctly:

**Windows:**
```powershell
.\verify-setup.ps1
```

**macOS/Linux:**
```bash
./verify-setup.sh
```

The verification script checks:
- ✅ Node.js and npm installation
- ✅ Dependencies are installed
- ✅ Environment files exist
- ✅ Database is running
- ✅ Prisma Client is generated
- ✅ Migrations are applied

## 🐳 Docker Deployment

### Full Stack with Docker Compose

1. **Set up environment variables:**
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and set your own values, especially:
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - POSTGRES_PASSWORD
```

2. **Start all services:**
```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop all services
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- PostgreSQL: localhost:5432

### Run Migrations in Docker

```bash
docker-compose exec backend npm run prisma:migrate
```

## 📚 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Gig Endpoints (Authenticated)

All gig endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### Create Gig
```http
POST /api/gigs
Content-Type: application/json

{
  "title": "Rock Concert",
  "venue": "Madison Square Garden",
  "date": "2024-12-31T20:00:00Z",
  "description": "New Year's Eve concert",
  "payment": 5000,
  "status": "UPCOMING"
}
```

#### Get All Gigs
```http
GET /api/gigs?status=UPCOMING&startDate=2024-01-01&endDate=2024-12-31
```

#### Get Single Gig
```http
GET /api/gigs/:id
```

#### Update Gig
```http
PUT /api/gigs/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "COMPLETED"
}
```

#### Delete Gig
```http
DELETE /api/gigs/:id
```

### Job Opportunities Endpoints (Authenticated)

#### Browse Opportunities
```http
GET /api/opportunities?category=DELIVERY&location=New York&minPay=15&maxPay=30&effortLevel=MEDIUM&platformId=<uuid>
```

#### Get Single Opportunity
```http
GET /api/opportunities/:id
```

#### Apply to Opportunity
```http
POST /api/opportunities/:id/apply
Content-Type: application/json

{
  "notes": "Available immediately"
}
```

#### Get My Applications
```http
GET /api/opportunities/applications?status=PENDING
```

#### Update Application
```http
PATCH /api/opportunities/applications/:id
Content-Type: application/json

{
  "status": "COMPLETED",
  "notes": "Job completed successfully"
}
```

### Platform Endpoints (Authenticated)

#### Get All Platforms
```http
GET /api/platforms?category=DELIVERY
```

#### Get My Connected Platforms
```http
GET /api/platforms/my
```

#### Connect Platform
```http
POST /api/platforms/connect
Content-Type: application/json

{
  "platformId": "<uuid>",
  "username": "myusername"
}
```

#### Disconnect Platform
```http
DELETE /api/platforms/disconnect/:id
```

### Payment Endpoints (Authenticated)

#### Create Payment Record
```http
POST /api/payments
Content-Type: application/json

{
  "applicationId": "<uuid>",
  "amount": 150.00,
  "expectedDate": "2024-12-31",
  "paymentMethod": "Direct Deposit"
}
```

#### Get My Payments
```http
GET /api/payments?status=PENDING&startDate=2024-01-01&endDate=2024-12-31
```

#### Update Payment Status
```http
PATCH /api/payments/:id
Content-Type: application/json

{
  "status": "PAID",
  "paidDate": "2024-12-25"
}
```

#### Get Payment Stats
```http
GET /api/payments/stats
```

### Route Endpoints (Authenticated)

#### Create Route
```http
POST /api/routes
Content-Type: application/json

{
  "name": "Morning Route",
  "date": "2024-12-25T08:00:00Z",
  "startLocation": "123 Main St",
  "stops": [
    {
      "opportunityId": "<uuid>",
      "location": "456 Oak Ave",
      "estimatedTime": 30
    }
  ]
}
```

#### Get My Routes
```http
GET /api/routes?status=PLANNED&startDate=2024-01-01
```

#### Optimize Route
```http
POST /api/routes/optimize
Content-Type: application/json

{
  "opportunityIds": ["<uuid1>", "<uuid2>"],
  "startLocation": "123 Main St"
}
```

#### Complete Route Stop
```http
PATCH /api/routes/stops/:stopId/complete
Content-Type: application/json

{
  "notes": "Completed successfully"
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests only
npm test --workspace=backend

# Frontend tests only
npm test --workspace=frontend

# Watch mode
cd backend && npm run test:watch
```

## 🔧 Development Scripts

```bash
# Root level
npm run dev              # Start both frontend and backend
npm run build            # Build both projects
npm run lint             # Lint both projects
npm run format           # Format code with Prettier
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed database with platforms
npm run prisma:studio    # Open Prisma Studio

# Backend specific (if you prefer working in backend directory)
cd backend
npm run dev              # Start dev server with hot reload
npm run build            # Build TypeScript
npm run start            # Start production server
npm run test             # Run tests
npm run lint             # Lint code
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed database with platforms
npm run prisma:studio    # Open Prisma Studio

# Frontend specific
cd frontend
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Run tests
npm run lint             # Lint code
```

## 📁 Project Structure

```
GigDash-1/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Helper functions
│   │   └── index.ts           # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/               # API client functions
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Page components
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Helper functions
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Entry point
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml
├── package.json               # Root package with workspaces
└── README.md
```

## 🔒 Security Features

- JWT-based authentication with secure token generation
- Password hashing with bcrypt (10 rounds)
- SQL injection protection via Prisma ORM
- CORS configuration
- Helmet.js for security headers
- Input validation with express-validator
- Protected API routes with authentication middleware
- Environment variable management

## 🌟 Best Practices

- **Monorepo Structure**: Uses npm workspaces for efficient dependency management
- **Type Safety**: Full TypeScript coverage with strict mode
- **Code Quality**: ESLint and Prettier for consistent code style
- **Error Handling**: Comprehensive error handling in API and UI
- **Validation**: Input validation on both client and server
- **Database Migrations**: Version-controlled database changes with Prisma
- **Docker Ready**: Production-ready containerization
- **RESTful API**: Following REST conventions
- **Component-Based UI**: Modular and reusable React components
- **State Management**: Clean state management with Zustand

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=development|production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### Frontend
The frontend uses Vite's proxy configuration for API calls in development. No additional environment variables needed for basic setup.

## 🚧 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Prisma Issues

**Error: Environment variable not found: DATABASE_URL**

This means your `.env` file is missing or DATABASE_URL is not set.

```bash
# Create the .env file
cp backend/.env.example backend/.env

# Edit backend/.env and update DATABASE_URL
# Example: DATABASE_URL="postgresql://gigdash:password@localhost:5432/gigdash?schema=public"
```

**Database Connection Issues:**

```bash
# Test PostgreSQL connection
psql -h localhost -U gigdash -d gigdash

# If using Docker, check if container is running
docker ps | grep postgres

# Restart PostgreSQL container
docker-compose restart postgres
```

**Reset Database (WARNING: Deletes all data):**

```bash
# From root directory
npm run prisma:migrate reset

# Or from backend directory
cd backend
npx prisma migrate reset
```

**Regenerate Prisma Client:**

```bash
# From root directory
npm run prisma:generate
```

### Missing npm Scripts

If you get "Missing script" errors for Prisma commands:

```bash
# Make sure you're on the correct branch
git checkout copilot/create-god-tier-full-stack

# Pull latest changes
git pull origin copilot/create-god-tier-full-stack

# Reinstall dependencies
npm install

# Verify scripts exist
npm run | grep prisma
```

### Windows-Specific Issues

**NODE_ENV not recognized:**
This is already fixed with `cross-env`. If you still see this error, make sure you've pulled the latest changes and run `npm install`.

**Permission Issues:**
Run PowerShell as Administrator if you encounter permission errors.

**Line Ending Issues:**
```bash
# Configure git to handle line endings
git config --global core.autocrlf true
```

### Docker Issues

**Port Already in Use:**
```bash
# Stop conflicting containers
docker-compose down

# Or stop specific port
# Windows PowerShell:
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5432).OwningProcess -Force

# macOS/Linux:
lsof -ti:5432 | xargs kill -9
```

**Docker Compose Issues:**
```bash
# Rebuild containers
docker-compose up --build

# View logs
docker-compose logs -f postgres

# Clean everything and start fresh
docker-compose down -v
docker-compose up -d
```

### Package Installation Issues

**npm install fails:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lockfile
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json

# Reinstall
npm install
```

**Dependency vulnerabilities:**
The project is configured with secure, up-to-date packages. You can run:
```bash
npm audit
npm audit fix
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Andy's Discord IT

## 🙏 Acknowledgments

- Built with modern best practices for production-ready applications
- Inspired by the need for a robust, scalable gig management solution
- God-tier architecture for full-stack development

---

**Happy Gigging! 🎸🎤🎹**