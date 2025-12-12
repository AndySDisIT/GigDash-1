import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, DollarSign, Clock, MapPin, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EarningsAnalytics {
  totalEarnings: number;
  totalExpenses: number;
  netIncome: number;
  averageHourlyRate: number;
  totalHoursWorked: number;
  totalMiles: number;
  earningsPerMile: number;
  dailyAverage: number;
  weeklyProjection: number;
  monthlyProjection: number;
}

interface EarningsProjection {
  currentPace: number;
  projectedDaily: number;
  projectedWeekly: number;
  projectedMonthly: number;
  variance: number;
  confidence: 'high' | 'medium' | 'low';
}

export function EarningsDashboard() {
  const { data: analytics, isLoading: loadingAnalytics } = useQuery<EarningsAnalytics>({
    queryKey: ['/api/analytics/earnings'],
  });

  const { data: projection, isLoading: loadingProjection } = useQuery<EarningsProjection>({
    queryKey: ['/api/analytics/projection'],
  });

  if (loadingAnalytics || loadingProjection) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics || !projection) {
    return null; // Return nothing if data not available (no completed gigs yet)
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-orange-600';
      default: return 'text-slate-600';
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 10) return 'text-green-600';
    if (variance < -10) return 'text-red-600';
    return 'text-slate-600';
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Income (30 days)</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-net-income">
              ${(analytics.netIncome || 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ${(analytics.totalEarnings || 0).toFixed(2)} earned - ${(analytics.totalExpenses || 0).toFixed(2)} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hourly Rate</CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-hourly-rate">
              ${(analytics.averageHourlyRate || 0).toFixed(2)}/hr
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {(analytics.totalHoursWorked || 0).toFixed(1)} hours worked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Earnings Per Mile</CardTitle>
            <MapPin className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-earnings-per-mile">
              ${(analytics.earningsPerMile || 0).toFixed(2)}/mi
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {(analytics.totalMiles || 0).toFixed(1)} miles driven
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Projection</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-monthly-projection">
              ${(projection.projectedMonthly || 0).toFixed(2)}
            </div>
            <p className={`text-xs mt-1 ${getVarianceColor(projection.variance || 0)}`}>
              {projection.variance > 0 ? '+' : ''}{(projection.variance || 0).toFixed(1)}% vs last month
            </p>
            <p className={`text-xs ${getConfidenceColor(projection.confidence || 'low')}`}>
              {projection.confidence || 'low'} confidence
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings Projections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-slate-500">Daily Average</div>
              <div className="text-xl font-semibold mt-1" data-testid="text-daily-projection">
                ${(projection.projectedDaily || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Weekly Projection</div>
              <div className="text-xl font-semibold mt-1" data-testid="text-weekly-projection">
                ${(projection.projectedWeekly || 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Monthly Projection</div>
              <div className="text-xl font-semibold mt-1">
                ${(projection.projectedMonthly || 0).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
