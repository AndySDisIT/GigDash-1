import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sources = pgTable("sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'app', 'email', 'csv', etc.
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
  estimatedDuration: integer("estimated_duration").notNull(), // minutes
  travelDistance: decimal("travel_distance", { precision: 8, scale: 2 }), // miles
  travelTime: integer("travel_time"), // minutes
  dueDate: timestamp("due_date").notNull(),
  priority: text("priority").notNull().default("medium"), // high, medium, low
  score: decimal("score", { precision: 5, scale: 2 }),
  status: text("status").notNull().default("available"), // available, selected, completed, expired
  emailMessageId: text("email_message_id"), // For email import deduplication
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const routes = pgTable("routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name"),
  gigIds: text("gig_ids").array().notNull(),
  totalDistance: decimal("total_distance", { precision: 8, scale: 2 }),
  totalTime: integer("total_time"), // minutes
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const walletEntries = pgTable("wallet_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gigId: varchar("gig_id"),
  type: text("type").notNull(), // earning, expense
  category: text("category").notNull(), // payment, fuel, mileage, etc.
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  transactionDate: timestamp("transaction_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, paid
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const mileage = pgTable("mileage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gigId: varchar("gig_id"),
  distance: decimal("distance", { precision: 8, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  purpose: text("purpose").notNull().default("business"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gigId: varchar("gig_id"),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSourceSchema = createInsertSchema(sources).omit({
  id: true,
});

export const insertGigSchema = createInsertSchema(gigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  score: true,
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
});

export const insertWalletEntrySchema = createInsertSchema(walletEntries).omit({
  id: true,
  createdAt: true,
});

export const insertMileageSchema = createInsertSchema(mileage).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Source = typeof sources.$inferSelect;
export type InsertGig = z.infer<typeof insertGigSchema>;
export type Gig = typeof gigs.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;
export type InsertWalletEntry = z.infer<typeof insertWalletEntrySchema>;
export type WalletEntry = typeof walletEntries.$inferSelect;
export type InsertMileage = z.infer<typeof insertMileageSchema>;
export type Mileage = typeof mileage.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
