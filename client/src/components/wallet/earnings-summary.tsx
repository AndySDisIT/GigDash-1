import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Calendar, TrendingUp } from "lucide-react";
import type { WalletSummary } from "@/lib/types";

export function EarningsSummary() {
  const { data: weeklyData } = useQuery<WalletSummary>({
    queryKey: ["/api/wallet/summary", "week"],
  });

  const { data: monthlyData } = useQuery<WalletSummary>({
    queryKey: ["/api/wallet/summary", "month"], 
  });

  const { data: allTimeData } = useQuery<WalletSummary>({
    queryKey: ["/api/wallet/summary"],
  });

  return (
    <>
      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">This Week</h3>
              <CalendarDays className="text-slate-400 w-4 h-4" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-2">
              ${weeklyData?.totalEarnings || "0.00"}
            </div>
            <div className="text-sm text-green-600 font-medium">+23% from last week</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">This Month</h3>
              <Calendar className="text-slate-400 w-4 h-4" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-2">
              ${monthlyData?.totalEarnings || "0.00"}
            </div>
            <div className="text-sm text-green-600 font-medium">+12% from last month</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">All Time</h3>
              <TrendingUp className="text-slate-400 w-4 h-4" />
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-2">
              ${allTimeData?.totalEarnings || "0.00"}
            </div>
            <div className="text-sm text-slate-600">Since January 2024</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Average Hourly Rate</span>
                <span className="font-semibold text-slate-800">
                  ${monthlyData?.averageHourlyRate || "0.00"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Hours Worked</span>
                <span className="font-semibold text-slate-800">
                  {monthlyData?.hoursWorked || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Jobs Completed</span>
                <span className="font-semibold text-slate-800">
                  {monthlyData?.jobsCompleted || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Success Rate</span>
                <span className="font-semibold text-green-600">96.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Tax Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Est. Tax Liability</span>
                <span className="font-semibold text-red-600">$3,114.13</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Business Mileage</span>
                <span className="font-semibold text-slate-800">2,847 mi</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Mileage Deduction</span>
                <span className="font-semibold text-green-600">$1,850.55</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Other Expenses</span>
                <span className="font-semibold text-slate-800">
                  ${monthlyData?.totalExpenses || "0.00"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
