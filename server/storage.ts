import { 
  users, gigs, sources, routes, walletEntries, mileage, expenses,
  type User, type InsertUser, type Gig, type InsertGig, type Source, 
  type InsertSource, type Route, type InsertRoute, type WalletEntry, 
  type InsertWalletEntry, type Mileage, type InsertMileage, 
  type Expense, type InsertExpense
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sum, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Gigs
  getGigs(userId: string, filters?: { status?: string; priority?: string; source?: string }): Promise<Gig[]>;
  getGig(id: string): Promise<Gig | undefined>;
  createGig(gig: InsertGig): Promise<Gig>;
  updateGig(id: string, updates: Partial<Gig>): Promise<Gig>;
  deleteGig(id: string): Promise<void>;
  
  // Sources
  getSources(): Promise<Source[]>;
  createSource(source: InsertSource): Promise<Source>;
  
  // Routes
  getRoutes(userId: string): Promise<Route[]>;
  createRoute(route: InsertRoute): Promise<Route>;
  
  // Wallet
  getWalletEntries(userId: string, dateRange?: { start: Date; end: Date }): Promise<WalletEntry[]>;
  createWalletEntry(entry: InsertWalletEntry): Promise<WalletEntry>;
  getWalletSummary(userId: string, dateRange?: { start: Date; end: Date }): Promise<{
    totalEarnings: string;
    totalExpenses: string;
    netIncome: string;
    hoursWorked: number;
    averageHourlyRate: string;
    jobsCompleted: number;
  }>;
  
  // Mileage
  getMileage(userId: string, dateRange?: { start: Date; end: Date }): Promise<Mileage[]>;
  createMileage(mileage: InsertMileage): Promise<Mileage>;
  
  // Expenses
  getExpenses(userId: string, dateRange?: { start: Date; end: Date }): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Gigs
  async getGigs(userId: string, filters?: { status?: string; priority?: string; source?: string }): Promise<Gig[]> {
    const conditions = [eq(gigs.userId, userId)];
    
    if (filters?.status) {
      conditions.push(eq(gigs.status, filters.status));
    }
    if (filters?.priority) {
      conditions.push(eq(gigs.priority, filters.priority));
    }
    if (filters?.source) {
      conditions.push(eq(gigs.sourceId, filters.source));
    }
    
    return await db.select().from(gigs)
      .where(and(...conditions))
      .orderBy(desc(gigs.createdAt));
  }

  async getGig(id: string): Promise<Gig | undefined> {
    const [gig] = await db.select().from(gigs).where(eq(gigs.id, id));
    return gig || undefined;
  }

  async createGig(insertGig: InsertGig): Promise<Gig> {
    // Calculate score based on handoff document formula
    const payBase = parseFloat(insertGig.payBase);
    const tipExpected = parseFloat(insertGig.tipExpected || "0");
    const payBonus = parseFloat(insertGig.payBonus || "0");
    const travelTime = insertGig.travelTime || 0;
    const estimatedDuration = insertGig.estimatedDuration;
    
    // Basic scoring algorithm weights
    const w1 = 0.4, w2 = 0.2, w3 = 0.2, w4 = 0.1, w5 = 0.1;
    
    const totalPay = payBase + tipExpected + payBonus;
    const score = w1 * totalPay - w2 * (travelTime / 60) - w3 * (estimatedDuration / 60) + w4 * 0.8 + w5 * 0.5;
    
    // Determine priority based on score
    let priority = "low";
    if (score >= 80) priority = "high";
    else if (score >= 50) priority = "medium";
    
    const [gig] = await db
      .insert(gigs)
      .values({
        ...insertGig,
        score: score.toFixed(2),
        priority
      })
      .returning();
    return gig;
  }

  async updateGig(id: string, updates: Partial<Gig>): Promise<Gig> {
    const [gig] = await db
      .update(gigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gigs.id, id))
      .returning();
    return gig;
  }

  async deleteGig(id: string): Promise<void> {
    await db.delete(gigs).where(eq(gigs.id, id));
  }

  // Sources
  async getSources(): Promise<Source[]> {
    return await db.select().from(sources).where(eq(sources.isActive, true));
  }

  async createSource(insertSource: InsertSource): Promise<Source> {
    const [source] = await db
      .insert(sources)
      .values(insertSource)
      .returning();
    return source;
  }

  // Routes
  async getRoutes(userId: string): Promise<Route[]> {
    return await db.select().from(routes).where(eq(routes.userId, userId)).orderBy(desc(routes.createdAt));
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const [route] = await db
      .insert(routes)
      .values(insertRoute)
      .returning();
    return route;
  }

  // Wallet
  async getWalletEntries(userId: string, dateRange?: { start: Date; end: Date }): Promise<WalletEntry[]> {
    const conditions = [eq(walletEntries.userId, userId)];
    
    if (dateRange) {
      conditions.push(
        gte(walletEntries.transactionDate, dateRange.start),
        lte(walletEntries.transactionDate, dateRange.end)
      );
    }
    
    return await db.select().from(walletEntries)
      .where(and(...conditions))
      .orderBy(desc(walletEntries.transactionDate));
  }

  async createWalletEntry(insertWalletEntry: InsertWalletEntry): Promise<WalletEntry> {
    const [entry] = await db
      .insert(walletEntries)
      .values(insertWalletEntry)
      .returning();
    return entry;
  }

  async getWalletSummary(userId: string, dateRange?: { start: Date; end: Date }): Promise<{
    totalEarnings: string;
    totalExpenses: string;
    netIncome: string;
    hoursWorked: number;
    averageHourlyRate: string;
    jobsCompleted: number;
  }> {
    const walletConditions = [eq(walletEntries.userId, userId)];
    const gigsConditions = [eq(gigs.userId, userId), eq(gigs.status, "completed")];
    
    if (dateRange) {
      walletConditions.push(
        gte(walletEntries.transactionDate, dateRange.start),
        lte(walletEntries.transactionDate, dateRange.end)
      );
      gigsConditions.push(
        gte(gigs.updatedAt, dateRange.start),
        lte(gigs.updatedAt, dateRange.end)
      );
    }
    
    const entries = await db.select().from(walletEntries).where(and(...walletConditions));
    const completedGigs = await db.select().from(gigs).where(and(...gigsConditions));
    
    const earnings = entries.filter(e => e.type === "earning");
    const expenses = entries.filter(e => e.type === "expense");
    
    const totalEarnings = earnings.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const netIncome = totalEarnings - totalExpenses;
    
    const hoursWorked = completedGigs.reduce((sum, g) => sum + (g.estimatedDuration / 60), 0);
    const averageHourlyRate = hoursWorked > 0 ? totalEarnings / hoursWorked : 0;
    
    return {
      totalEarnings: totalEarnings.toFixed(2),
      totalExpenses: totalExpenses.toFixed(2),
      netIncome: netIncome.toFixed(2),
      hoursWorked: Math.round(hoursWorked * 10) / 10,
      averageHourlyRate: averageHourlyRate.toFixed(2),
      jobsCompleted: completedGigs.length,
    };
  }

  // Mileage
  async getMileage(userId: string, dateRange?: { start: Date; end: Date }): Promise<Mileage[]> {
    const conditions = [eq(mileage.userId, userId)];
    
    if (dateRange) {
      conditions.push(
        gte(mileage.date, dateRange.start),
        lte(mileage.date, dateRange.end)
      );
    }
    
    return await db.select().from(mileage)
      .where(and(...conditions))
      .orderBy(desc(mileage.date));
  }

  async createMileage(insertMileage: InsertMileage): Promise<Mileage> {
    const [mileageRecord] = await db
      .insert(mileage)
      .values(insertMileage)
      .returning();
    return mileageRecord;
  }

  // Expenses
  async getExpenses(userId: string, dateRange?: { start: Date; end: Date }): Promise<Expense[]> {
    const conditions = [eq(expenses.userId, userId)];
    
    if (dateRange) {
      conditions.push(
        gte(expenses.date, dateRange.start),
        lte(expenses.date, dateRange.end)
      );
    }
    
    return await db.select().from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.date));
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }
}

export const storage = new DatabaseStorage();
