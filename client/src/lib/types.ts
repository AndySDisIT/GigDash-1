import type { Gig } from "@shared/schema";

export interface DashboardStats {
  availableGigs: number;
  totalValue: string;
  estimatedHours: string;
  routeEfficiency: string;
}

export interface WalletSummary {
  totalEarnings: string;
  totalExpenses: string;
  netIncome: string;
  hoursWorked: number;
  averageHourlyRate: string;
  jobsCompleted: number;
}

export interface GigWithSource extends Gig {
  sourceName?: string;
}

export interface RouteStop {
  gigId: string;
  order: number;
  eta: string;
  driveTime: number;
  workTime: number;
}
