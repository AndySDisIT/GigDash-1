import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Clock, DollarSign, MapPin, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Gig } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function AutoScheduler() {
  const [availableHours, setAvailableHours] = useState("8");
  const [schedule, setSchedule] = useState<Gig[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateSchedule = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/schedule/optimize?hours=${availableHours}`);
      if (!response.ok) throw new Error('Failed to generate schedule');
      return response.json();
    },
    onSuccess: (data) => {
      setSchedule(data);
      toast({
        title: "Schedule Generated",
        description: `Found ${data.length} optimal gigs for ${availableHours} hours`,
      });
    },
    onError: () => {
      toast({
        title: "Schedule Generation Failed",
        description: "Unable to generate optimal schedule",
        variant: "destructive",
      });
    },
  });

  const selectAllGigs = useMutation({
    mutationFn: async () => {
      return Promise.all(
        schedule.map(gig =>
          apiRequest(`/api/gigs/${gig.id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'selected' }),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gigs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Gigs Selected",
        description: `${schedule.length} gigs added to your action list`,
      });
      setSchedule([]);
    },
  });

  const totalEarnings = schedule.reduce((sum, gig) => {
    return sum + parseFloat(gig.payBase) + parseFloat(gig.tipExpected || "0") + parseFloat(gig.payBonus || "0");
  }, 0);

  const totalTime = schedule.reduce((sum, gig) => {
    return sum + gig.estimatedDuration + (gig.travelTime || 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Auto-Scheduler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hours">Available Hours</Label>
          <div className="flex gap-2">
            <Input
              id="hours"
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={availableHours}
              onChange={(e) => setAvailableHours(e.target.value)}
              className="flex-1"
              data-testid="input-available-hours"
            />
            <Button
              onClick={() => generateSchedule.mutate()}
              disabled={generateSchedule.isPending}
              data-testid="button-generate-schedule"
            >
              {generateSchedule.isPending ? 'Generating...' : 'Generate Schedule'}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Find the best gigs that fit your available time
          </p>
        </div>

        {schedule.length > 0 && (
          <>
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Optimal Schedule</h3>
                <Button
                  size="sm"
                  onClick={() => selectAllGigs.mutate()}
                  disabled={selectAllGigs.isPending}
                  data-testid="button-select-all-schedule"
                >
                  {selectAllGigs.isPending ? 'Adding...' : 'Select All'}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-xs text-slate-500">Total Earnings</div>
                  <div className="text-lg font-semibold text-green-600" data-testid="text-schedule-earnings">
                    ${totalEarnings.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Total Time</div>
                  <div className="text-lg font-semibold" data-testid="text-schedule-time">
                    {(totalTime / 60).toFixed(1)}h
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Hourly Rate</div>
                  <div className="text-lg font-semibold" data-testid="text-schedule-rate">
                    ${totalTime > 0 ? (totalEarnings / (totalTime / 60)).toFixed(2) : '0.00'}/hr
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {schedule.map((gig, index) => {
                  const gigTotal = parseFloat(gig.payBase) + parseFloat(gig.tipExpected || "0") + parseFloat(gig.payBonus || "0");
                  
                  return (
                    <div 
                      key={gig.id} 
                      className="p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                      data-testid={`schedule-gig-${index}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <h4 className="font-medium">{gig.title}</h4>
                          </div>
                          <div className="flex gap-4 mt-2 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${gigTotal.toFixed(2)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {gig.estimatedDuration}min
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {gig.travelDistance || '0'}mi
                            </span>
                          </div>
                        </div>
                        <Badge 
                          variant={gig.priority === 'high' ? 'destructive' : 
                                  gig.priority === 'medium' ? 'default' : 'secondary'}
                        >
                          {gig.priority}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
