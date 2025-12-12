import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGigSchema, insertSourceSchema, insertWalletEntrySchema, insertMileageSchema, insertExpenseSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import * as csv from "csv-parse/sync";
import { GmailClient, parseGigEmail, type ParsedEmail } from "./email-parser";
import { calculateRoute, calculateAllRoutes, RouteRequestSchema } from "./route-calculator";
import { jobOrchestrator } from "./job-orchestrator";
import { calendarExport } from "./calendar-export";
import { analyticsService } from "./analytics";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock user ID for development - in production this would come from auth
  const MOCK_USER_ID = "user-123";

  // Dashboard endpoints
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const gigs = await storage.getGigs(MOCK_USER_ID, { status: "available" });
      const totalValue = gigs.reduce((sum, gig) => sum + parseFloat(gig.payBase) + parseFloat(gig.tipExpected || "0") + parseFloat(gig.payBonus || "0"), 0);
      const estimatedHours = gigs.reduce((sum, gig) => sum + (gig.estimatedDuration / 60), 0);
      const routeEfficiency = 85; // Mock calculation for now
      
      res.json({
        availableGigs: gigs.length,
        totalValue: totalValue.toFixed(2),
        estimatedHours: estimatedHours.toFixed(1),
        routeEfficiency: `${routeEfficiency}%`
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Gigs endpoints
  app.get("/api/gigs", async (req, res) => {
    try {
      const { status, priority, source } = req.query as { status?: string; priority?: string; source?: string };
      const gigs = await storage.getGigs(MOCK_USER_ID, { status, priority, source });
      res.json(gigs);
    } catch (error) {
      console.error("Error fetching gigs:", error);
      res.status(500).json({ error: "Failed to fetch gigs" });
    }
  });

  app.get("/api/gigs/:id", async (req, res) => {
    try {
      const gig = await storage.getGig(req.params.id);
      if (!gig) {
        return res.status(404).json({ error: "Gig not found" });
      }
      res.json(gig);
    } catch (error) {
      console.error("Error fetching gig:", error);
      res.status(500).json({ error: "Failed to fetch gig" });
    }
  });

  app.post("/api/gigs", async (req, res) => {
    try {
      const gigData = insertGigSchema.parse({
        ...req.body,
        userId: MOCK_USER_ID
      });
      const gig = await storage.createGig(gigData);
      res.json(gig);
    } catch (error) {
      console.error("Error creating gig:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid gig data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create gig" });
    }
  });

  app.put("/api/gigs/:id", async (req, res) => {
    try {
      const gig = await storage.updateGig(req.params.id, req.body);
      res.json(gig);
    } catch (error) {
      console.error("Error updating gig:", error);
      res.status(500).json({ error: "Failed to update gig" });
    }
  });

  app.delete("/api/gigs/:id", async (req, res) => {
    try {
      await storage.deleteGig(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting gig:", error);
      res.status(500).json({ error: "Failed to delete gig" });
    }
  });

  // Helper function to sanitize CSV values
  const sanitizeValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    return value;
  };

  // CSV import endpoint
  app.post("/api/gigs/import/csv", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString();
      const records = csv.parse(csvContent, { 
        columns: true, 
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true
      });

      const importedGigs = [];
      const errors = [];
      
      for (const record of records as any[]) {
        try {
          // Parse numeric values explicitly to avoid treating 0 as falsy
          const parsedDuration = parseInt(record.estimatedDuration);
          const parsedTravelTime = sanitizeValue(record.travelTime) ? parseInt(record.travelTime) : undefined;
          
          // Sanitize and prepare the data
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
            travelTime: parsedTravelTime !== undefined && Number.isNaN(parsedTravelTime) ? undefined : parsedTravelTime,
            dueDate: new Date(record.dueDate),
            status: record.status || "available"
          });
          
          const gig = await storage.createGig(gigData);
          importedGigs.push(gig);
        } catch (error) {
          console.error("Error importing gig record:", error);
          errors.push({ record, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      res.json({ 
        success: true, 
        imported: importedGigs.length,
        total: records.length,
        errors: errors.length,
        gigs: importedGigs 
      });
    } catch (error) {
      console.error("Error importing CSV:", error);
      res.status(500).json({ error: "Failed to import CSV", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Email import endpoints
  app.post("/api/import/email/sync", async (req, res) => {
    try {
      const { clientId, clientSecret, refreshToken, platforms, afterDate } = req.body;

      if (!clientId || !clientSecret || !refreshToken) {
        return res.status(400).json({ 
          error: "Missing Gmail API credentials. Please provide clientId, clientSecret, and refreshToken." 
        });
      }

      // Initialize Gmail client
      const gmail = new GmailClient(clientId, clientSecret, refreshToken);

      // Search for gig platform emails
      const platformList = platforms || ['gigspot', 'qwick', 'wonolo', 'generic'];
      const searchAfter = afterDate ? new Date(afterDate) : undefined;

      const parsedEmails = await gmail.searchGigEmails(platformList, searchAfter);

      // Fetch existing gigs once and build lookup set for O(1) dedup
      const existingGigs = await storage.getGigs(MOCK_USER_ID);
      const existingMessageIds = new Set(
        existingGigs
          .map(g => g.emailMessageId)
          .filter((id): id is string => id !== null && id !== undefined)
      );

      // Import emails as gigs with deduplication
      const importedGigs = [];
      const skipped = [];
      const errors = [];

      for (const email of parsedEmails) {
        try {
          // Skip expired/canceled emails
          if (email.status === 'expired') {
            continue;
          }

          // Check for duplicate using O(1) set lookup
          if (existingMessageIds.has(email.messageId)) {
            skipped.push({ 
              subject: email.subject, 
              reason: 'Already imported' 
            });
            continue;
          }

          // Create gig data from email
          const gigData = insertGigSchema.parse({
            userId: MOCK_USER_ID,
            sourceId: "email-import", // Default source, could be mapped from sender
            title: email.subject,
            description: email.body.substring(0, 500), // Limit description length
            payBase: email.extractedDetails.payBase || "0.00",
            tipExpected: email.extractedDetails.tipExpected || "0.00",
            payBonus: email.extractedDetails.payBonus || "0.00",
            location: email.extractedDetails.location || "Location not specified",
            latitude: email.extractedDetails.latitude,
            longitude: email.extractedDetails.longitude,
            estimatedDuration: email.extractedDetails.estimatedDuration || 120,
            travelDistance: email.extractedDetails.travelDistance,
            travelTime: email.extractedDetails.travelTime,
            dueDate: email.extractedDetails.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: email.status,
            emailMessageId: email.messageId, // Store for future deduplication
          });

          const gig = await storage.createGig(gigData);
          importedGigs.push(gig);
          
          // Add to set to prevent duplicates within this batch
          existingMessageIds.add(email.messageId);
        } catch (error) {
          console.error("Error importing email as gig:", error);
          errors.push({ 
            email: email.subject, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      res.json({
        success: true,
        imported: importedGigs.length,
        skipped: skipped.length,
        total: parsedEmails.length,
        errors: errors.length,
        errorDetails: errors,
        skippedDetails: skipped,
        gigs: importedGigs,
      });

    } catch (error) {
      console.error("Error syncing emails:", error);
      res.status(500).json({ 
        error: "Failed to sync emails", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  app.post("/api/import/email/test", async (req, res) => {
    try {
      const { clientId, clientSecret, refreshToken } = req.body;

      if (!clientId || !clientSecret || !refreshToken) {
        return res.status(400).json({ 
          error: "Missing Gmail API credentials" 
        });
      }

      // Test connection by fetching a few emails
      const gmail = new GmailClient(clientId, clientSecret, refreshToken);
      const messages = await gmail.fetchEmails('', 5);

      res.json({
        success: true,
        message: "Email connection successful",
        emailCount: messages.length,
      });
    } catch (error) {
      console.error("Error testing email connection:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to connect to email", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Sources endpoints
  app.get("/api/sources", async (req, res) => {
    try {
      const sources = await storage.getSources();
      res.json(sources);
    } catch (error) {
      console.error("Error fetching sources:", error);
      res.status(500).json({ error: "Failed to fetch sources" });
    }
  });

  app.post("/api/sources", async (req, res) => {
    try {
      const sourceData = insertSourceSchema.parse(req.body);
      const source = await storage.createSource(sourceData);
      res.json(source);
    } catch (error) {
      console.error("Error creating source:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid source data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create source" });
    }
  });

  // Routes endpoints
  app.get("/api/routes", async (req, res) => {
    try {
      const routes = await storage.getRoutes(MOCK_USER_ID);
      res.json(routes);
    } catch (error) {
      console.error("Error fetching routes:", error);
      res.status(500).json({ error: "Failed to fetch routes" });
    }
  });

  app.post("/api/routes/build", async (req, res) => {
    try {
      const { gigIds } = req.body;
      
      if (!gigIds || !Array.isArray(gigIds)) {
        return res.status(400).json({ error: "Invalid gig IDs" });
      }

      // Simple route optimization - in production this would use a real routing service
      const totalDistance = gigIds.length * 5.2; // Mock calculation
      const totalTime = gigIds.length * 35; // Mock calculation
      const efficiency = Math.max(60, 100 - gigIds.length * 5); // Mock calculation

      const routeData = {
        userId: MOCK_USER_ID,
        name: `Route ${new Date().toLocaleDateString()}`,
        gigIds,
        totalDistance: totalDistance.toString(),
        totalTime,
        efficiency: efficiency.toString()
      };

      const route = await storage.createRoute(routeData);
      res.json(route);
    } catch (error) {
      console.error("Error building route:", error);
      res.status(500).json({ error: "Failed to build route" });
    }
  });

  // Wallet endpoints
  app.get("/api/wallet/summary", async (req, res) => {
    try {
      const { range } = req.query as { range?: string };
      
      let dateRange;
      const now = new Date();
      
      if (range === "week") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        dateRange = { start: weekStart, end: now };
      } else if (range === "month") {
        const monthStart = new Date(now);
        monthStart.setDate(1);
        dateRange = { start: monthStart, end: now };
      }

      const summary = await storage.getWalletSummary(MOCK_USER_ID, dateRange);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching wallet summary:", error);
      res.status(500).json({ error: "Failed to fetch wallet summary" });
    }
  });

  app.get("/api/wallet/entries", async (req, res) => {
    try {
      const { range } = req.query as { range?: string };
      
      let dateRange;
      const now = new Date();
      
      if (range === "week") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        dateRange = { start: weekStart, end: now };
      } else if (range === "month") {
        const monthStart = new Date(now);
        monthStart.setDate(1);
        dateRange = { start: monthStart, end: now };
      }

      const entries = await storage.getWalletEntries(MOCK_USER_ID, dateRange);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching wallet entries:", error);
      res.status(500).json({ error: "Failed to fetch wallet entries" });
    }
  });

  app.post("/api/wallet/entries", async (req, res) => {
    try {
      const entryData = insertWalletEntrySchema.parse({
        ...req.body,
        userId: MOCK_USER_ID
      });
      const entry = await storage.createWalletEntry(entryData);
      res.json(entry);
    } catch (error) {
      console.error("Error creating wallet entry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid wallet entry data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create wallet entry" });
    }
  });

  // Create sample data endpoint for demonstration
  app.post("/api/sample-data", async (req, res) => {
    try {
      // Create some sample gigs in Jacksonville area for demonstration
      const sampleGigs = [
        {
          userId: MOCK_USER_ID,
          sourceId: "gigspot-source",
          title: "Mystery Shop - Target Electronics",
          description: "Visit electronics department, check prices and service quality",
          payBase: "45.00",
          tipExpected: "5.00",
          payBonus: "10.00",
          location: "10300 Southside Blvd, Jacksonville, FL 32256",
          latitude: "30.2672",
          longitude: "-81.6431",
          estimatedDuration: 90, // 1.5 hours in minutes
          travelDistance: "8.5",
          travelTime: 15,
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          status: "available"
        },
        {
          userId: MOCK_USER_ID,
          sourceId: "ivueit-source",
          title: "Product Display Check - Walmart",
          description: "Verify product placement and take photos",
          payBase: "25.00",
          tipExpected: "0.00",
          payBonus: "0.00",
          location: "8808 Beach Blvd, Jacksonville, FL 32216",
          latitude: "30.2880",
          longitude: "-81.4066",
          estimatedDuration: 45,
          travelDistance: "12.3",
          travelTime: 22,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: "available"
        },
        {
          userId: MOCK_USER_ID,
          sourceId: "observa-source",
          title: "Store Audit - Publix",
          description: "Complete store audit checklist and photo documentation",
          payBase: "35.00",
          tipExpected: "0.00",
          payBonus: "5.00",
          location: "4495 Roosevelt Blvd, Jacksonville, FL 32210",
          latitude: "30.3152",
          longitude: "-81.6596",
          estimatedDuration: 75,
          travelDistance: "5.2",
          travelTime: 12,
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          status: "available"
        },
        {
          userId: MOCK_USER_ID,
          sourceId: "field-agent-source",
          title: "Price Check - Best Buy",
          description: "Check prices on specific electronics items",
          payBase: "20.00",
          tipExpected: "0.00",
          payBonus: "0.00",
          location: "10991 San Jose Blvd, Jacksonville, FL 32223",
          latitude: "30.2344",
          longitude: "-81.6431",
          estimatedDuration: 30,
          travelDistance: "15.7",
          travelTime: 28,
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          status: "available"
        }
      ];

      const createdGigs = [];
      for (const gigData of sampleGigs) {
        try {
          const gig = await storage.createGig(gigData);
          createdGigs.push(gig);
        } catch (error) {
          console.error("Error creating sample gig:", error);
        }
      }

      res.json({ 
        success: true, 
        created: createdGigs.length,
        gigs: createdGigs 
      });
    } catch (error) {
      console.error("Error creating sample data:", error);
      res.status(500).json({ error: "Failed to create sample data" });
    }
  });

  // Routing endpoints - Calculate routes with different transportation modes
  app.post("/api/routes/calculate", async (req, res) => {
    try {
      const routeRequest = RouteRequestSchema.parse(req.body);
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ 
          error: "Google Maps API key not configured",
          details: "Please add GOOGLE_MAPS_API_KEY to environment secrets"
        });
      }

      const result = await calculateRoute(routeRequest, apiKey);
      res.json(result);
    } catch (error) {
      console.error("Error calculating route:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid route request", details: error.errors });
      }
      res.status(500).json({ 
        error: "Failed to calculate route",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/routes/calculate-all", async (req, res) => {
    try {
      const { origin, destination } = req.body;
      
      if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
        return res.status(400).json({ 
          error: "Invalid request",
          details: "origin and destination with lat/lng required"
        });
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ 
          error: "Google Maps API key not configured",
          details: "Please add GOOGLE_MAPS_API_KEY to environment secrets"
        });
      }

      const results = await calculateAllRoutes(origin, destination, apiKey);
      res.json(results);
    } catch (error) {
      console.error("Error calculating all routes:", error);
      res.status(500).json({ 
        error: "Failed to calculate routes",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Job Orchestrator endpoints
  app.get("/api/schedule/optimize", async (req, res) => {
    try {
      const { hours } = req.query as { hours?: string };
      const availableHours = hours ? parseFloat(hours) : 8;
      
      const schedule = await jobOrchestrator.generateOptimalSchedule(
        MOCK_USER_ID,
        availableHours
      );
      
      res.json(schedule);
    } catch (error) {
      console.error("Error generating schedule:", error);
      res.status(500).json({ error: "Failed to generate optimal schedule" });
    }
  });

  app.post("/api/gigs/score", async (req, res) => {
    try {
      await jobOrchestrator.updateAllGigScores(MOCK_USER_ID);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating scores:", error);
      res.status(500).json({ error: "Failed to update gig scores" });
    }
  });

  app.post("/api/schedule/projection", async (req, res) => {
    try {
      const { gigIds } = req.body;
      
      if (!gigIds || !Array.isArray(gigIds)) {
        return res.status(400).json({ error: "Invalid gig IDs" });
      }
      
      const projection = await jobOrchestrator.getEarningsProjection(gigIds);
      res.json(projection);
    } catch (error) {
      console.error("Error calculating projection:", error);
      res.status(500).json({ error: "Failed to calculate earnings projection" });
    }
  });

  // Calendar export endpoints
  app.post("/api/calendar/export", async (req, res) => {
    try {
      const { gigIds, calendarName } = req.body;
      
      if (!gigIds || !Array.isArray(gigIds)) {
        return res.status(400).json({ error: "Invalid gig IDs" });
      }
      
      const gigs = await Promise.all(
        gigIds.map(id => storage.getGig(id))
      );
      const validGigs = gigs.filter((g): g is typeof gigs[0] & object => g !== null);
      
      const icsContent = calendarExport.generateICS(validGigs, calendarName);
      const filename = calendarExport.generateFilename();
      
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(icsContent);
    } catch (error) {
      console.error("Error exporting calendar:", error);
      res.status(500).json({ error: "Failed to export calendar" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/earnings", async (req, res) => {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      const analytics = await analyticsService.calculateEarnings(MOCK_USER_ID, start, end);
      res.json(analytics);
    } catch (error) {
      console.error("Error calculating earnings:", error);
      res.status(500).json({ error: "Failed to calculate earnings analytics" });
    }
  });

  app.get("/api/analytics/projection", async (req, res) => {
    try {
      const projection = await analyticsService.projectEarnings(MOCK_USER_ID);
      res.json(projection);
    } catch (error) {
      console.error("Error projecting earnings:", error);
      res.status(500).json({ error: "Failed to project earnings" });
    }
  });

  app.get("/api/analytics/breakdown", async (req, res) => {
    try {
      const { groupBy } = req.query as { groupBy?: 'day' | 'week' | 'month' };
      const breakdown = await analyticsService.getEarningsBreakdown(
        MOCK_USER_ID, 
        groupBy || 'week'
      );
      res.json(breakdown);
    } catch (error) {
      console.error("Error getting earnings breakdown:", error);
      res.status(500).json({ error: "Failed to get earnings breakdown" });
    }
  });

  // Initialize default sources and sample data
  try {
    const defaultSources = [
      { name: "GigSpot", type: "app" },
      { name: "iVueit", type: "app" },
      { name: "Observa", type: "app" },
      { name: "Mobee", type: "app" },
      { name: "Field Agent", type: "app" },
      { name: "EasyShift", type: "app" },
      { name: "CSV Import", type: "csv" },
      { name: "Manual Entry", type: "manual" }
    ];

    for (const source of defaultSources) {
      try {
        await storage.createSource(source);
      } catch (error) {
        // Source may already exist, continue
      }
    }
  } catch (error) {
    console.log("Could not initialize default sources:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}
