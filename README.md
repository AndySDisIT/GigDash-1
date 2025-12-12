# GigDash - God-Tier Full-Stack Dashboard

A production-ready, full-stack web application for managing gigs and performances. Built with modern technologies and best practices for scalability, security, and maintainability.

## 🚀 Features

- **Authentication System**: Secure JWT-based authentication with bcrypt password hashing
- **Gig Management**: Full CRUD operations for creating, reading, updating, and deleting gigs
- **Real-time Filtering**: Filter gigs by status (Upcoming, Completed, Cancelled)
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

### 1. Clone the repository

```bash
git clone https://github.com/AndySDisIT/GigDash-1.git
cd GigDash-1
```

### 2. Install dependencies

```bash
npm install
```

This will install dependencies for both frontend and backend using npm workspaces.

### 3. Set up environment variables

**Backend:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/gigdash?schema=public"
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

### 4. Set up the database

**Option A: Using Docker (Recommended)**
```bash
# Start PostgreSQL in Docker
docker-compose up postgres -d

# Wait a few seconds for PostgreSQL to initialize, then:
cd backend
npm run prisma:migrate
npm run prisma:generate
```

**Option B: Using local PostgreSQL**
```bash
# Create database
createdb gigdash

# Run migrations
cd backend
npm run prisma:migrate
npm run prisma:generate
```

### 5. Start development servers

From the root directory:
```bash
npm run dev
```

This starts both frontend (http://localhost:3000) and backend (http://localhost:5000) concurrently.

Or start them separately:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

**Note:** All npm scripts work cross-platform (Windows, Mac, Linux) thanks to `cross-env`.

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

# Backend specific
cd backend
npm run dev              # Start dev server with hot reload
npm run build            # Build TypeScript
npm run start            # Start production server
npm run test             # Run tests
npm run lint             # Lint code
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
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
```bash
# Reset database (WARNING: deletes all data)
cd backend
npx prisma migrate reset

# Generate Prisma client
npm run prisma:generate
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