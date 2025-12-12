# GigConnect Dashboard - Complete Deployment Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [File Structure](#file-structure)
4. [Database Schema](#database-schema)
5. [Setup Instructions](#setup-instructions)
6. [API Documentation](#api-documentation)
7. [Deployment to Production](#deployment-to-production)
8. [Master AI Prompt](#master-ai-prompt)

---

## 🎯 Project Overview

**GigConnect Dashboard** is a comprehensive gig work management platform that aggregates job opportunities from 26+ gig platforms including GigSpot, GigPro, Qwick, Emps, Gracehill, PrestoShip, iVueit, and more.

### Key Features
- **Multi-Platform Aggregation**: Centralized job management from 26 gig platforms
- **CSV Bulk Import**: Upload jobs in bulk from any platform
- **Interactive Map**: Leaflet-based map showing all gig locations
- **Route Optimization**: Plan efficient multi-stop routes
- **Earnings Tracking**: Monitor income, expenses, and mileage
- **Job Scoring**: Algorithmic prioritization based on pay, distance, and time
- **Status Management**: Track jobs from available → selected → completed

### Supported Platforms (26 Total)
**App Platforms (23):**
- GigSpot, GigPro, Qwick, Emps, Gracehill, PrestoShip, iSpos
- Wonolo, Instawork, Shiftsmart, Landed, JobStack, Bluecrew
- Snagajob, iVueit, Observa, Field Agent, Merchandiser
- Gigwalk, TaskRabbit, Steady, Mobee, EasyShift

**Import Methods (3):**
- CSV Import, Email Import (planned), Manual Entry

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: Shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack React Query v5
- **Routing**: Wouter (lightweight client-side routing)
- **Maps**: Leaflet + React Leaflet
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js + Express.js
- **Language**: TypeScript (ES Modules)
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM + Drizzle Kit
- **File Upload**: Multer
- **CSV Parsing**: csv-parse
- **Session**: connect-pg-simple (PostgreSQL sessions)

### Development Tools
- **Build Tool**: Vite with HMR
- **Type Safety**: TypeScript throughout
- **Schema Validation**: Zod + drizzle-zod
- **Database Migrations**: Drizzle Kit (`npm run db:push`)

---

## 📁 File Structure

```
gigconnect-dashboard/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/          # Dashboard-specific components
│   │   │   │   ├── job-card.tsx           # Individual gig card display
│   │   │   │   ├── stats-card.tsx         # Dashboard statistics
│   │   │   │   ├── selected-gigs.tsx      # Selected gigs panel
│   │   │   │   ├── route-optimizer.tsx    # Route planning UI
│   │   │   │   └── app-integrations.tsx   # Platform integration cards
│   │   │   ├── import/             # Import-related components
│   │   │   │   ├── import-options.tsx     # CSV/Email/Manual import UI
│   │   │   │   └── manual-entry.tsx       # Manual gig entry form
│   │   │   ├── map/                # Map components
│   │   │   │   └── map-view.tsx           # Leaflet map integration
│   │   │   ├── wallet/             # Earnings tracking
│   │   │   │   ├── earnings-summary.tsx   # Income overview
│   │   │   │   └── transaction-list.tsx   # Transaction history
│   │   │   └── ui/                 # Shadcn/ui components (50+ components)
│   │   ├── hooks/
│   │   │   ├── use-toast.ts        # Toast notification hook
│   │   │   └── use-mobile.tsx      # Mobile detection hook
│   │   ├── lib/
│   │   │   ├── queryClient.ts      # TanStack Query setup
│   │   │   ├── types.ts            # TypeScript type definitions
│   │   │   └── utils.ts            # Utility functions (cn, etc.)
│   │   ├── pages/
│   │   │   ├── dashboard.tsx       # Main dashboard page
│   │   │   └── not-found.tsx       # 404 page
│   │   ├── App.tsx                 # Root component with routing
│   │   ├── main.tsx                # React entry point
│   │   └── index.css               # Global styles + Tailwind
│   └── index.html                  # HTML entry point
├── server/                          # Backend Express application
│   ├── db.ts                        # Database connection (Drizzle + Neon)
│   ├── storage.ts                   # Storage interface + implementations
│   ├── routes.ts                    # API route handlers
│   ├── seed.ts                      # Database seeding script
│   ├── vite.ts                      # Vite middleware integration
│   └── index.ts                     # Express server entry point
├── shared/                          # Shared between frontend/backend
│   └── schema.ts                    # Drizzle schema + Zod validation
├── attached_assets/                 # User-uploaded files
│   └── sample_gigs_*.csv           # CSV import samples
├── components.json                  # Shadcn/ui configuration
├── drizzle.config.ts               # Drizzle Kit configuration
├── package.json                     # Dependencies and scripts
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite configuration
├── replit.md                       # Project documentation
└── DEPLOYMENT_GUIDE.md             # This file

Total Files: ~80+ files (50+ UI components, 10 custom components, 6 backend files)
```

---

## 🗄️ Database Schema

### Tables

#### `users`
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);
```

#### `sources`
```sql
CREATE TABLE sources (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'app', 'email', 'csv', 'manual'
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(name, type)   -- Prevent duplicate platforms
);
```

**Pre-populated with 26 sources:**
- 23 gig app platforms (GigSpot, GigPro, Qwick, etc.)
- 3 import methods (CSV Import, Email Import, Manual Entry)

#### `gigs`
```sql
CREATE TABLE gigs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  source_id VARCHAR NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  pay_base DECIMAL(10,2) NOT NULL,
  tip_expected DECIMAL(10,2) DEFAULT 0.00,
  pay_bonus DECIMAL(10,2) DEFAULT 0.00,
  location TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  estimated_duration INTEGER NOT NULL,  -- minutes
  travel_distance DECIMAL(8,2),         -- miles
  travel_time INTEGER,                  -- minutes
  due_date TIMESTAMP NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',  -- high, medium, low
  score DECIMAL(5,2),
  status TEXT NOT NULL DEFAULT 'available',  -- available, selected, completed, expired
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

#### `routes`
```sql
CREATE TABLE routes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  name TEXT,
  gig_ids TEXT[] NOT NULL,  -- Array of gig IDs
  total_distance DECIMAL(8,2),
  total_time INTEGER,  -- minutes
  efficiency DECIMAL(5,2),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

#### `wallet_entries`
```sql
CREATE TABLE wallet_entries (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  gig_id VARCHAR,
  type TEXT NOT NULL,  -- 'earning', 'expense'
  category TEXT NOT NULL,  -- 'payment', 'fuel', 'mileage', etc.
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  transaction_date TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, processing, paid
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

#### `mileage`
```sql
CREATE TABLE mileage (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  gig_id VARCHAR,
  distance DECIMAL(8,2) NOT NULL,
  date TIMESTAMP NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'business',
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

#### `expenses`
```sql
CREATE TABLE expenses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL,
  gig_id VARCHAR,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ (preferably 20+)
- PostgreSQL database (or Neon account)
- Git

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd gigconnect-dashboard

# Install dependencies (use Replit's packager tool if on Replit)
npm install
```

### Step 2: Database Setup

#### Option A: Using Replit (Recommended)
1. Replit automatically provisions a PostgreSQL database
2. Environment variables are set automatically:
   - `DATABASE_URL`
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

#### Option B: Using Neon (External)
1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add to `.env`:
```env
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
```

#### Option C: Local PostgreSQL
```bash
# Install PostgreSQL locally
# Create database
createdb gigconnect

# Add to .env
DATABASE_URL=postgresql://localhost/gigconnect
```

### Step 3: Push Database Schema

```bash
# Push schema to database (creates all tables)
npm run db:push

# If you get data-loss warnings, force it:
npm run db:push -- --force
```

### Step 4: Seed Database

```bash
# Seed with 26 gig platforms and sample data
npm run db:seed
```

This creates:
- 26 gig platform sources
- 15 sample gigs across different platforms
- Mock user (user-123)

### Step 5: Start Development Server

```bash
# Start both frontend (Vite) and backend (Express) on port 5000
npm run dev
```

The app will be available at `http://localhost:5000`

### Step 6: Verify Setup

1. Open browser to `http://localhost:5000`
2. You should see the Dashboard with 15 sample gigs
3. Click "Import" tab to verify CSV import UI loads
4. Download CSV template to test import functionality
5. Check "Map & Routes" to see gig locations on map
6. Review "Wallet" to see earnings tracking

---

## 📡 API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-app.replit.app/api`

### Endpoints

#### Gigs

**GET /api/gigs**
- Description: Get all gigs for current user
- Response: `{ gigs: Gig[] }`

**GET /api/gigs/:id**
- Description: Get single gig by ID
- Response: `{ gig: Gig }`

**POST /api/gigs**
- Description: Create new gig (manual entry)
- Body: `InsertGig` (see schema)
- Response: `{ gig: Gig }`

**PATCH /api/gigs/:id/status**
- Description: Update gig status
- Body: `{ status: "available" | "selected" | "completed" | "expired" }`
- Response: `{ gig: Gig }`

**DELETE /api/gigs/:id**
- Description: Delete a gig
- Response: `{ success: true }`

#### Import

**POST /api/import/csv**
- Description: Upload CSV file to import gigs
- Content-Type: `multipart/form-data`
- Body: `{ file: File }`
- Response: `{ success: true, imported: number, total: number, errors: string[] }`

**GET /api/import/template**
- Description: Download CSV template
- Response: CSV file with headers

#### Sources

**GET /api/sources**
- Description: Get all gig platform sources
- Response: `{ sources: Source[] }`

**POST /api/sources**
- Description: Create new source
- Body: `{ name: string, type: string, isActive?: boolean }`
- Response: `{ source: Source }`

#### Routes

**GET /api/routes**
- Description: Get all saved routes
- Response: `{ routes: Route[] }`

**POST /api/routes**
- Description: Create optimized route
- Body: `{ gigIds: string[], name?: string }`
- Response: `{ route: Route }`

#### Wallet

**GET /api/wallet/entries**
- Description: Get all wallet transactions
- Response: `{ entries: WalletEntry[] }`

**POST /api/wallet/entries**
- Description: Add wallet transaction
- Body: `InsertWalletEntry`
- Response: `{ entry: WalletEntry }`

**GET /api/wallet/summary**
- Description: Get earnings summary
- Response: `{ total: string, pending: string, paid: string }`

#### Mileage

**GET /api/mileage**
- Description: Get all mileage records
- Response: `{ records: Mileage[] }`

**POST /api/mileage**
- Description: Add mileage record
- Body: `InsertMileage`
- Response: `{ record: Mileage }`

#### Expenses

**GET /api/expenses**
- Description: Get all expenses
- Response: `{ expenses: Expense[] }`

**POST /api/expenses**
- Description: Add expense
- Body: `InsertExpense`
- Response: `{ expense: Expense }`

### Error Responses

All endpoints return errors in this format:
```json
{
  "error": "Error message here"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🌐 Deployment to Production

### Deploy on Replit (Easiest)

1. **Push Code to Replit**
   - Import GitHub repo or paste code directly
   - Replit auto-detects Node.js project

2. **Configure Secrets**
   - Database is auto-provisioned (no config needed)
   - Add any custom environment variables in Secrets tab

3. **Run Database Migrations**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start Application**
   - Click "Run" button or use shell:
   ```bash
   npm run dev
   ```

5. **Publish to Production**
   - Click "Deploy" button in Replit
   - Choose deployment settings
   - Get public URL: `https://your-app-name.replit.app`

### Deploy on Other Platforms

#### Vercel (Frontend Only - Not Recommended)
*Note: This app requires a Node.js backend, so Vercel isn't ideal*

#### Railway / Render / Fly.io (Full-stack)

1. **Configure Environment**
   ```env
   DATABASE_URL=postgresql://...
   NODE_ENV=production
   PORT=5000
   ```

2. **Build Command**
   ```bash
   npm install && npm run db:push -- --force
   ```

3. **Start Command**
   ```bash
   npm run dev
   ```

4. **Database**
   - Use their PostgreSQL addon or external Neon database

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string

Optional:
- `NODE_ENV` - Set to "production" for production
- `PORT` - Server port (default: 5000)
- `VITE_API_URL` - Frontend API URL override

---

## 🤖 Master AI Prompt

**Use this prompt when asking an AI to work on this project:**

```
You are working on GigConnect Dashboard, a gig work management platform built with:
- Frontend: React 18 + TypeScript + Vite + Shadcn/ui + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL with Drizzle ORM
- State: TanStack React Query v5
- Maps: Leaflet

ARCHITECTURE:
- Shared schema in shared/schema.ts (Drizzle + Zod)
- Backend routes in server/routes.ts (thin controllers)
- Storage interface in server/storage.ts (DbStorage implementation)
- Frontend pages in client/src/pages/
- UI components from Shadcn in client/src/components/ui/
- Custom components in client/src/components/{dashboard,import,map,wallet}/

KEY FEATURES:
1. Multi-platform gig aggregation (26 platforms: GigSpot, GigPro, Qwick, etc.)
2. CSV bulk import with template download
3. Interactive Leaflet map with job markers
4. Route optimization for multi-stop planning
5. Earnings tracking with wallet system
6. Job status management (available → selected → completed)

DATABASE SCHEMA:
- users (id, username, password)
- sources (id, name, type, is_active) - 26 pre-seeded platforms
- gigs (id, userId, sourceId, title, pay*, location, coordinates, duration, dueDate, status)
- routes (id, userId, gigIds[], totalDistance, totalTime, efficiency)
- walletEntries (id, userId, gigId, type, amount, status)
- mileage (id, userId, gigId, distance, date)
- expenses (id, userId, gigId, amount, category)

IMPORTANT CONVENTIONS:
1. Always use storage interface, never raw Drizzle queries in routes
2. Validate request bodies with Zod schemas from drizzle-zod
3. Frontend: Use React Query for data fetching (no custom queryFn)
4. Frontend: Use zodResolver for form validation
5. Frontend: Add data-testid to all interactive elements
6. Use wouter for routing (not react-router)
7. Import UI components from @/components/ui/
8. Never modify vite.config.ts or server/vite.ts
9. Database migrations: use `npm run db:push` (never write SQL migrations)
10. Mock user ID: "user-123" (auth not yet implemented)

CSV IMPORT SPECIFICS:
- Template columns: title, description, payBase, tipExpected, payBonus, location, latitude, longitude, estimatedDuration, travelDistance, travelTime, dueDate, sourceId
- Use Number.isNaN() checks to preserve zero values (not falsy checks)
- Sanitize empty strings to undefined before parsing
- Continue importing valid rows even if some fail
- Return detailed response: { success, imported, total, errors }

CURRENT STATE:
- 26 gig platforms seeded in database
- CSV import fully functional with error handling
- Dashboard shows gig cards with stats
- Map displays gig locations
- Wallet tracking implemented
- Route optimization UI ready (backend TODO)

WHEN MAKING CHANGES:
1. Update schema in shared/schema.ts first
2. Run `npm run db:push` to sync database
3. Update storage interface in server/storage.ts
4. Add API routes in server/routes.ts
5. Update frontend components to use new data
6. Test with React Query DevTools

Ask me what you need help with!
```

---

## 📝 Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server (frontend + backend on :5000)

# Database
npm run db:push          # Push schema changes to database
npm run db:push -- --force  # Force push (ignores data-loss warnings)
npm run db:seed          # Seed database with platforms and sample data

# Build (if needed)
npm run build            # Build for production
npm start                # Start production server

# Other
npm install <package>    # Install new package (or use Replit packager tool)
```

---

## 🎨 Customization Guide

### Adding New Gig Platform

1. **Add to database:**
```typescript
// In server/seed.ts or via API
await storage.createSource({
  name: "NewPlatform",
  type: "app",
  isActive: true
});
```

2. **Add platform guide (optional):**
```typescript
// In client/src/components/import/import-options.tsx
// Add to platformGuides array
{
  name: "NewPlatform",
  logo: "NP",
  steps: [
    "Go to NewPlatform settings",
    "Export job history as CSV",
    "Upload to GigConnect"
  ]
}
```

### Changing Color Scheme

Edit `client/src/index.css`:
```css
:root {
  --primary: 220 90% 56%;    /* Blue */
  --secondary: 210 40% 96%;  /* Light gray */
  /* ... other colors */
}
```

### Adding New Page

1. Create page component:
```typescript
// client/src/pages/analytics.tsx
export default function AnalyticsPage() {
  return <div>Analytics</div>;
}
```

2. Register route:
```typescript
// client/src/App.tsx
import AnalyticsPage from "@/pages/analytics";

<Route path="/analytics" component={AnalyticsPage} />
```

3. Add navigation link (in Dashboard.tsx or create navbar)

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test connection
npm run db:push
```

### CSV Import Not Working
- Check file encoding (should be UTF-8)
- Verify column headers match template exactly
- Check server logs for validation errors
- Ensure dates are in ISO format (YYYY-MM-DDTHH:mm:ss)

### Frontend Not Loading
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

### Type Errors
```bash
# Regenerate TypeScript types
npm run db:push  # This regenerates Drizzle types
```

---

## 📚 Additional Resources

- **Drizzle ORM**: https://orm.drizzle.team/
- **Shadcn/ui**: https://ui.shadcn.com/
- **TanStack Query**: https://tanstack.com/query/latest
- **Leaflet**: https://leafletjs.com/
- **Wouter**: https://github.com/molefrog/wouter
- **Neon Database**: https://neon.tech/docs

---

## 📄 License

[Your License Here]

---

**Last Updated**: October 22, 2025
**Version**: 1.0.0
**Author**: GigConnect Team
