/**
 * Analytics Service
 * Provides earnings analytics, projections, and insights
 */

import { storage } from "./storage";
import type { Gig, WalletEntry } from "@shared/schema";

export interface EarningsAnalytics {
  totalEarnings: number;
  totalExpenses: number;
  netIncome: number;
  averageHourlyRate: number;
  totalHoursWorked: number;
  totalMiles: number;
  earningsPerMile: number;
  topPlatforms: Array<{ platform: string; earnings: number; count: number }>;
  dailyAverage: number;
  weeklyProjection: number;
  monthlyProjection: number;
}

export interface EarningsProjection {
  currentPace: number;
  projectedDaily: number;
  projectedWeekly: number;
  projectedMonthly: number;
  variance: number;
  confidence: 'high' | 'medium' | 'low';
}

export class AnalyticsService {
  /**
   * Calculate comprehensive earnings analytics for a date range
   */
  async calculateEarnings(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EarningsAnalytics> {
    // Get completed gigs in date range
    const gigs = await storage.getGigs(userId, { status: "completed" });
    const filteredGigs = gigs.filter(g => {
      const completedDate = new Date(g.updatedAt);
      return completedDate >= startDate && completedDate <= endDate;
    });

    // Get wallet entries
    const walletEntries = await storage.getWalletEntries(userId);
    const filteredWallet = walletEntries.filter(w => {
      const transactionDate = new Date(w.transactionDate);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Calculate totals
    let totalEarnings = 0;
    let totalExpenses = 0;
    let totalHoursWorked = 0;
    let totalMiles = 0;
    const platformEarnings = new Map<string, { earnings: number; count: number }>();

    for (const gig of filteredGigs) {
      const earnings = parseFloat(gig.payBase) + 
                      parseFloat(gig.tipExpected || "0") + 
                      parseFloat(gig.payBonus || "0");
      
      totalEarnings += earnings;
      totalHoursWorked += gig.estimatedDuration / 60;
      totalMiles += parseFloat(gig.travelDistance || "0");

      // Track by source
      const current = platformEarnings.get(gig.sourceId) || { earnings: 0, count: 0 };
      platformEarnings.set(gig.sourceId, {
        earnings: current.earnings + earnings,
        count: current.count + 1
      });
    }

    // Add wallet expenses
    for (const entry of filteredWallet) {
      if (entry.type === "expense") {
        totalExpenses += parseFloat(entry.amount);
      } else if (entry.type === "earning") {
        totalEarnings += parseFloat(entry.amount);
      }
    }

    const netIncome = totalEarnings - totalExpenses;
    const averageHourlyRate = totalHoursWorked > 0 ? netIncome / totalHoursWorked : 0;
    const earningsPerMile = totalMiles > 0 ? totalEarnings / totalMiles : 0;

    // Calculate daily average
    const daysDiff = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyAverage = netIncome / daysDiff;

    // Top platforms
    const topPlatforms = Array.from(platformEarnings.entries())
      .map(([platform, data]) => ({ platform, ...data }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);

    return {
      totalEarnings,
      totalExpenses,
      netIncome,
      averageHourlyRate,
      totalHoursWorked,
      totalMiles,
      earningsPerMile,
      topPlatforms,
      dailyAverage,
      weeklyProjection: dailyAverage * 7,
      monthlyProjection: dailyAverage * 30
    };
  }

  /**
   * Project future earnings based on historical data
   */
  async projectEarnings(userId: string): Promise<EarningsProjection> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get recent analytics
    const monthlyData = await this.calculateEarnings(userId, thirtyDaysAgo, now);
    const weeklyData = await this.calculateEarnings(userId, sevenDaysAgo, now);

    // Calculate trends
    const currentPace = weeklyData.dailyAverage;
    const historicalPace = monthlyData.dailyAverage;
    const variance = ((currentPace - historicalPace) / historicalPace) * 100;

    // Determine confidence based on data availability
    const completedGigs = await storage.getGigs(userId, { status: "completed" });
    const confidence = completedGigs.length > 50 ? 'high' :
                      completedGigs.length > 20 ? 'medium' : 'low';

    return {
      currentPace,
      projectedDaily: currentPace,
      projectedWeekly: currentPace * 7,
      projectedMonthly: currentPace * 30,
      variance,
      confidence
    };
  }

  /**
   * Get earnings breakdown by time period
   */
  async getEarningsBreakdown(
    userId: string,
    groupBy: 'day' | 'week' | 'month'
  ): Promise<Array<{ period: string; earnings: number; gigs: number }>> {
    const gigs = await storage.getGigs(userId, { status: "completed" });
    const breakdown = new Map<string, { earnings: number; gigs: number }>();

    for (const gig of gigs) {
      const date = new Date(gig.updatedAt);
      let periodKey: string;

      if (groupBy === 'day') {
        periodKey = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      const earnings = parseFloat(gig.payBase) + 
                      parseFloat(gig.tipExpected || "0") + 
                      parseFloat(gig.payBonus || "0");

      const current = breakdown.get(periodKey) || { earnings: 0, gigs: 0 };
      breakdown.set(periodKey, {
        earnings: current.earnings + earnings,
        gigs: current.gigs + 1
      });
    }

    return Array.from(breakdown.entries())
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }
}

export const analyticsService = new AnalyticsService();
