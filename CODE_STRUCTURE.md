# GigConnect Dashboard - Code Structure & Key Files

## 📚 Core Files Overview

This document provides the essential code snippets and structure of the GigConnect Dashboard application.

---

## 🗂️ Shared Schema (`shared/schema.ts`)

**Purpose**: Single source of truth for database schema and TypeScript types.

```typescript
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLES ===

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sources = pgTable("sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'app', 'email', 'csv', 'manual'
  isActive: boolean("is_active").notNull().default(true),
});

export const gigs = pgTable("gigs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  sourceId: varchar("source_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  payBase: decimal("pay_base", { precision: 10, scale: 2 }).notNull(),
  tipExpected: decimal("tip_expected", { precision: 10, scale: 2 }).default("0.00"),
  payBonus: decimal("pay_bonus", { precision: 10, scale: 2 }).default("0.00"),
  location: text("location").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  estimatedDuration: integer("estimated_duration").notNull(),
  travelDistance: decimal("travel_distance", { precision: 8, scale: 2 }),
  travelTime: integer("travel_time"),
  dueDate: timestamp("due_date").notNull(),
  priority: text("priority").notNull().default("medium"),
  score: decimal("score", { precision: 5, scale: 2 }),
  status: text("status").notNull().default("available"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// === ZOD SCHEMAS (for validation) ===

export const insertGigSchema = createInsertSchema(gigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  score: true,
});

// === TYPESCRIPT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Source = typeof sources.$inferSelect;
export type InsertSource = z.infer<typeof insertSourceSchema>;

export type Gig = typeof gigs.$inferSelect;
export type InsertGig = z.infer<typeof insertGigSchema>;
```

**Key Concepts**:
- Drizzle ORM for type-safe database operations
- Zod schemas auto-generated from Drizzle schema
- TypeScript types inferred automatically
- Single schema shared between frontend/backend

---

## 🔧 Database Connection (`server/db.ts`)

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

**Configuration** (`drizzle.config.ts`):
```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

---

## 💾 Storage Layer (`server/storage.ts`)

**Interface Definition**:
```typescript
import { Gig, InsertGig, Source, InsertSource } from "@shared/schema";

export interface IStorage {
  // Gigs
  getGigs(userId: string): Promise<Gig[]>;
  getGig(id: string): Promise<Gig | undefined>;
  createGig(gig: InsertGig): Promise<Gig>;
  updateGigStatus(id: string, status: string): Promise<Gig>;
  deleteGig(id: string): Promise<void>;
  
  // Sources
  getSources(): Promise<Source[]>;
  createSource(source: InsertSource): Promise<Source>;
  
  // Routes, Wallet, Mileage, Expenses...
  // (similar patterns)
}
```

**Database Implementation**:
```typescript
import { db } from "./db";
import { gigs, sources } from "@shared/schema";
import { eq } from "drizzle-orm";

export class DbStorage implements IStorage {
  async getGigs(userId: string): Promise<Gig[]> {
    return db.select().from(gigs).where(eq(gigs.userId, userId));
  }

  async getGig(id: string): Promise<Gig | undefined> {
    const results = await db.select().from(gigs).where(eq(gigs.id, id));
    return results[0];
  }

  async createGig(gig: InsertGig): Promise<Gig> {
    const [created] = await db.insert(gigs).values(gig).returning();
    return created;
  }

  async updateGigStatus(id: string, status: string): Promise<Gig> {
    const [updated] = await db
      .update(gigs)
      .set({ status, updatedAt: new Date() })
      .where(eq(gigs.id, id))
      .returning();
    return updated;
  }

  async deleteGig(id: string): Promise<void> {
    await db.delete(gigs).where(eq(gigs.id, id));
  }
}

export const storage = new DbStorage();
```

**Why This Pattern?**
- Thin controllers: Routes just validate and delegate
- Easy to test: Can swap DbStorage for MemStorage in tests
- Type-safe: All operations fully typed
- Centralized: All database logic in one place

---

## 🛤️ API Routes (`server/routes.ts`)

```typescript
import express, { type Request, Response } from "express";
import { storage } from "./storage";
import { insertGigSchema } from "@shared/schema";
import multer from "multer";
import { parse } from "csv-parse/sync";

const router = express.Router();
const MOCK_USER_ID = "user-123";

// === GIGS ===

router.get("/gigs", async (req: Request, res: Response) => {
  try {
    const gigs = await storage.getGigs(MOCK_USER_ID);
    res.json({ gigs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch gigs" });
  }
});

router.post("/gigs", async (req: Request, res: Response) => {
  try {
    const gigData = insertGigSchema.parse({
      ...req.body,
      userId: MOCK_USER_ID,
    });
    const gig = await storage.createGig(gigData);
    res.status(201).json({ gig });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch("/gigs/:id/status", async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const gig = await storage.updateGigStatus(req.params.id, status);
    res.json({ gig });
  } catch (error) {
    res.status(500).json({ error: "Failed to update gig" });
  }
});

// === CSV IMPORT ===

const upload = multer({ storage: multer.memoryStorage() });

router.post("/import/csv", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const csvContent = req.file.buffer.toString("utf-8");
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    // Helper to convert empty strings to undefined
    const sanitizeValue = (value: any) => {
      if (typeof value === "string" && value.trim() === "") return undefined;
      return value;
    };

    const importedGigs = [];
    const errors = [];

    for (const record of records) {
      try {
        // Parse numeric values explicitly to preserve zeros
        const parsedDuration = parseInt(record.estimatedDuration);
        const parsedTravelTime = sanitizeValue(record.travelTime) 
          ? parseInt(record.travelTime) 
          : undefined;

        const gigData = insertGigSchema.parse({
          userId: MOCK_USER_ID,
          sourceId: sanitizeValue(record.sourceId) || "csv-import",
          title: record.title,
          description: sanitizeValue(record.description),
          payBase: record.payBase || "0.00",
          tipExpected: sanitizeValue(record.tipExpected) || "0.00",
          payBonus: sanitizeValue(record.payBonus) || "0.00",
          location: record.location,
          latitude: sanitizeValue(record.latitude),
          longitude: sanitizeValue(record.longitude),
          estimatedDuration: Number.isNaN(parsedDuration) ? 60 : parsedDuration,
          travelDistance: sanitizeValue(record.travelDistance),
          travelTime: parsedTravelTime !== undefined && Number.isNaN(parsedTravelTime) 
            ? undefined 
            : parsedTravelTime,
          dueDate: new Date(record.dueDate),
          status: record.status || "available",
        });

        const gig = await storage.createGig(gigData);
        importedGigs.push(gig);
      } catch (error) {
        errors.push(`Row ${importedGigs.length + errors.length + 1}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      imported: importedGigs.length,
      total: records.length,
      errors,
    });
  } catch (error) {
    res.status(500).json({ error: "Import failed" });
  }
});

export default router;
```

**Key Features**:
- Zod validation on all inputs
- Detailed error messages
- Graceful error handling (continues on row failures)
- Proper NaN checks to preserve zero values

---

## 🎨 Frontend Architecture

### Main App (`client/src/App.tsx`)

```typescript
import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}
```

### Query Client Setup (`client/src/lib/queryClient.ts`)

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey[0] as string);
        if (!res.ok) throw new Error("Network error");
        return res.json();
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}
```

### Dashboard Page (`client/src/pages/dashboard.tsx`)

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobCard } from "@/components/dashboard/job-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { MapView } from "@/components/map/map-view";
import { ImportOptions } from "@/components/import/import-options";
import type { Gig } from "@shared/schema";

export default function Dashboard() {
  // Fetch gigs
  const { data, isLoading } = useQuery<{ gigs: Gig[] }>({
    queryKey: ["/api/gigs"],
  });

  const gigs = data?.gigs || [];

  // Calculate stats
  const availableGigs = gigs.filter(g => g.status === "available");
  const totalValue = availableGigs.reduce((sum, g) => 
    sum + parseFloat(g.payBase) + parseFloat(g.tipExpected || "0"), 0
  );

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/gigs/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">GigConnect Dashboard</h1>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="map">Map & Routes</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatsCard
              title="Available Gigs"
              value={availableGigs.length}
              data-testid="stat-available"
            />
            <StatsCard
              title="Total Value"
              value={`$${totalValue.toFixed(2)}`}
              data-testid="stat-total-value"
            />
          </div>

          <div className="grid gap-4">
            {availableGigs.map((gig) => (
              <JobCard
                key={gig.id}
                gig={gig}
                onStatusChange={(status) =>
                  updateStatusMutation.mutate({ id: gig.id, status })
                }
                data-testid={`card-gig-${gig.id}`}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="map">
          <MapView gigs={gigs} />
        </TabsContent>

        <TabsContent value="import">
          <ImportOptions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**React Query Patterns**:
- `useQuery` for GET requests (auto-caches, auto-refetches)
- `useMutation` for POST/PATCH/DELETE
- Always invalidate cache after mutations
- Show loading states with `isLoading`
- Use hierarchical queryKeys: `['/api/gigs', id]`

### Job Card Component (`client/src/components/dashboard/job-card.tsx`)

```typescript
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign } from "lucide-react";
import type { Gig } from "@shared/schema";

interface JobCardProps {
  gig: Gig;
  onStatusChange: (status: string) => void;
}

export function JobCard({ gig, onStatusChange }: JobCardProps) {
  const totalPay = (
    parseFloat(gig.payBase) +
    parseFloat(gig.tipExpected || "0") +
    parseFloat(gig.payBonus || "0")
  ).toFixed(2);

  return (
    <Card data-testid={`card-gig-${gig.id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{gig.title}</CardTitle>
          <Badge variant={gig.priority === "high" ? "destructive" : "secondary"}>
            {gig.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="font-semibold">${totalPay}</span>
            <span className="text-sm text-muted-foreground">
              (${gig.payBase} base + ${gig.tipExpected || "0"} tip)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{gig.location}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{gig.estimatedDuration} min</span>
          </div>

          {gig.description && (
            <p className="text-sm text-muted-foreground">{gig.description}</p>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            onClick={() => onStatusChange("selected")}
            disabled={gig.status === "selected"}
            data-testid={`button-select-${gig.id}`}
          >
            Select
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStatusChange("completed")}
            data-testid={`button-complete-${gig.id}`}
          >
            Complete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### CSV Import Component (`client/src/components/import/import-options.tsx`)

```typescript
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function ImportOptions() {
  const { toast } = useToast();

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/import/csv", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Import successful",
          description: `Imported ${result.imported} gigs from CSV.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    window.location.href = "/api/import/template";
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>CSV Import</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={downloadTemplate} className="mb-4">
            Download Template
          </Button>

          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="block w-full"
            data-testid="input-csv-upload"
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 📦 Package.json Scripts

```json
{
  "scripts": {
    "dev": "tsx server/index.ts",
    "build": "tsc && vite build",
    "db:push": "drizzle-kit push",
    "db:seed": "tsx server/seed.ts"
  }
}
```

---

## 🔑 Key Patterns Summary

### 1. **Type Safety Flow**
```
Drizzle Schema → Zod Validation → TypeScript Types
     ↓               ↓                   ↓
  Database      API Validation      Frontend/Backend
```

### 2. **Data Flow**
```
Frontend (React Query)
    ↓ HTTP Request
API Routes (Express)
    ↓ Validation (Zod)
Storage Layer (Interface)
    ↓ Implementation
Database (Drizzle ORM)
    ↓
PostgreSQL
```

### 3. **Naming Conventions**
- Tables: lowercase plural (`gigs`, `sources`)
- Types: PascalCase (`Gig`, `InsertGig`)
- Components: PascalCase (`JobCard`, `Dashboard`)
- Files: kebab-case (`job-card.tsx`, `query-client.ts`)
- Database columns: snake_case (`pay_base`, `created_at`)
- TypeScript props: camelCase (`onStatusChange`, `gigId`)

### 4. **Import Aliases**
```typescript
@/components/ui/*     → client/src/components/ui/*
@/lib/*               → client/src/lib/*
@/hooks/*             → client/src/hooks/*
@shared/*             → shared/*
@assets/*             → attached_assets/*
```

---

## 🎯 Best Practices

1. **Always validate with Zod** before database operations
2. **Use storage interface** (never raw Drizzle in routes)
3. **Invalidate React Query cache** after mutations
4. **Add data-testid** to all interactive elements
5. **Handle errors gracefully** with try/catch
6. **Use TypeScript types** from schema
7. **Keep routes thin** (logic in storage layer)
8. **Use proper HTTP status codes** (200, 201, 400, 404, 500)

---

**Last Updated**: October 22, 2025
