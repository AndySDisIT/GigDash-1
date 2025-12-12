/**
 * Job Orchestrator - Unified service for gig lifecycle management
 * Centralizes gig scoring, scheduling, and route optimization
 */

import { storage } from "./storage";
import type { Gig, InsertGig } from "@shared/schema";

export interface ScoringFactors {
  hourlyRate: number;
  travelEfficiency: number;
  timeWindow: number;
  distance: number;
}

export class JobOrchestrator {
  private readonly STANDARD_MILEAGE_RATE = 0.67; // IRS 2024 rate

  /**
   * Calculate priority score for a gig (0-100)
   * Higher score = better opportunity
   */
  calculateGigScore(gig: Gig): number {
    const totalPay = parseFloat(gig.payBase) + 
                     parseFloat(gig.tipExpected || "0") + 
                     parseFloat(gig.payBonus || "0");
    
    const hourlyRate = (totalPay / (gig.estimatedDuration / 60));
    const travelDistance = parseFloat(gig.travelDistance || "0");
    const travelTime = gig.travelTime || 0;
    
    // Factor 1: Hourly rate (40% weight)
    const hourlyScore = Math.min(100, (hourlyRate / 50) * 100) * 0.4;
    
    // Factor 2: Travel efficiency (30% weight)
    const travelCost = travelDistance * this.STANDARD_MILEAGE_RATE;
    const effectivePay = totalPay - travelCost;
    const travelScore = Math.max(0, (effectivePay / totalPay) * 100) * 0.3;
    
    // Factor 3: Time urgency (20% weight)
    const hoursUntilDue = (new Date(gig.dueDate).getTime() - Date.now()) / (1000 * 60 * 60);
    const urgencyScore = hoursUntilDue < 2 ? 100 : 
                        hoursUntilDue < 6 ? 75 :
                        hoursUntilDue < 24 ? 50 : 25;
    const timeScore = urgencyScore * 0.2;
    
    // Factor 4: Quick turnaround bonus (10% weight)
    const quickBonus = gig.estimatedDuration <= 30 ? 100 : 
                       gig.estimatedDuration <= 60 ? 75 : 50;
    const bonusScore = quickBonus * 0.1;
    
    return Math.round(hourlyScore + travelScore + timeScore + bonusScore);
  }

  /**
   * Auto-schedule gigs based on time windows, location, and earnings
   */
  async generateOptimalSchedule(
    userId: string,
    availableHours: number,
    currentLocation?: { lat: number; lng: number }
  ): Promise<Gig[]> {
    const availableGigs = await storage.getGigs(userId, { status: "available" });
    
    // Score all gigs
    const scoredGigs = availableGigs.map(gig => ({
      ...gig,
      calculatedScore: this.calculateGigScore(gig)
    }));
    
    // Sort by score descending
    scoredGigs.sort((a, b) => b.calculatedScore - a.calculatedScore);
    
    // Select gigs that fit within available hours
    const selectedGigs: Gig[] = [];
    let totalTime = 0;
    
    for (const gig of scoredGigs) {
      const gigTotalTime = gig.estimatedDuration + (gig.travelTime || 0);
      
      if (totalTime + gigTotalTime <= availableHours * 60) {
        selectedGigs.push(gig);
        totalTime += gigTotalTime;
      }
      
      if (totalTime >= availableHours * 60) break;
    }
    
    return selectedGigs;
  }

  /**
   * Calculate earnings per hour including travel costs
   */
  calculateEarningsPerHour(gig: Gig): number {
    const totalPay = parseFloat(gig.payBase) + 
                     parseFloat(gig.tipExpected || "0") + 
                     parseFloat(gig.payBonus || "0");
    
    const travelDistance = parseFloat(gig.travelDistance || "0");
    const travelCost = travelDistance * this.STANDARD_MILEAGE_RATE;
    const netPay = totalPay - travelCost;
    
    const totalTime = (gig.estimatedDuration + (gig.travelTime || 0)) / 60;
    
    return totalTime > 0 ? netPay / totalTime : 0;
  }

  /**
   * Calculate earnings per mile
   */
  calculateEarningsPerMile(gig: Gig): number {
    const totalPay = parseFloat(gig.payBase) + 
                     parseFloat(gig.tipExpected || "0") + 
                     parseFloat(gig.payBonus || "0");
    
    const travelDistance = parseFloat(gig.travelDistance || "0");
    
    return travelDistance > 0 ? totalPay / travelDistance : 0;
  }

  /**
   * Batch score update for all gigs
   */
  async updateAllGigScores(userId: string): Promise<void> {
    const gigs = await storage.getGigs(userId);
    
    for (const gig of gigs) {
      const score = this.calculateGigScore(gig);
      await storage.updateGig(gig.id, { score: score.toString() });
    }
  }

  /**
   * Get earnings projection for a set of gigs
   */
  async getEarningsProjection(gigIds: string[]): Promise<{
    totalEarnings: number;
    totalTime: number;
    travelCosts: number;
    netEarnings: number;
    hourlyRate: number;
  }> {
    const gigs = await Promise.all(gigIds.map(id => storage.getGig(id)));
    const validGigs = gigs.filter((g): g is Gig => g !== null);
    
    let totalEarnings = 0;
    let totalTime = 0;
    let totalDistance = 0;
    
    for (const gig of validGigs) {
      const pay = parseFloat(gig.payBase) + 
                  parseFloat(gig.tipExpected || "0") + 
                  parseFloat(gig.payBonus || "0");
      
      totalEarnings += pay;
      totalTime += gig.estimatedDuration + (gig.travelTime || 0);
      totalDistance += parseFloat(gig.travelDistance || "0");
    }
    
    const travelCosts = totalDistance * this.STANDARD_MILEAGE_RATE;
    const netEarnings = totalEarnings - travelCosts;
    const hourlyRate = totalTime > 0 ? (netEarnings / (totalTime / 60)) : 0;
    
    return {
      totalEarnings,
      totalTime,
      travelCosts,
      netEarnings,
      hourlyRate
    };
  }
}

export const jobOrchestrator = new JobOrchestrator();
