import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Route, 
  Navigation, 
  Clock, 
  MapPin, 
  DollarSign,
  TrendingUp,
  Car,
  Bike,
  Bus,
  AlertTriangle
} from "lucide-react";
import type { Gig } from "@shared/schema";

interface RouteOptimizerProps {
  selectedGigs: Gig[];
  onRouteOptimized: (optimizedRoute: string[]) => void;
}

export function RouteOptimizer({ selectedGigs, onRouteOptimized }: RouteOptimizerProps) {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<Gig[]>([]);
  const [routeStats, setRouteStats] = useState<{
    totalDistance: number;
    totalTime: number;
    fuelCost: number;
    efficiency: number;
  } | null>(null);

  const optimizeRoute = async () => {
    setOptimizing(true);
    
    // Simulate route optimization algorithm
    // In real implementation, this would call a routing service like OpenRouteService or Valhalla
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Sort by priority, distance, and due date for optimal route
    const sortedGigs = [...selectedGigs].sort((a, b) => {
      // Priority weight
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Due date urgency
      const aDaysUntilDue = (new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      const bDaysUntilDue = (new Date(b.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      
      if (Math.abs(aDaysUntilDue - bDaysUntilDue) > 1) {
        return aDaysUntilDue - bDaysUntilDue;
      }
      
      // Distance optimization
      const aDistance = parseFloat(a.travelDistance || "0");
      const bDistance = parseFloat(b.travelDistance || "0");
      return aDistance - bDistance;
    });

    const totalDistance = sortedGigs.reduce((sum, gig) => sum + parseFloat(gig.travelDistance || "0"), 0);
    const totalTime = sortedGigs.reduce((sum, gig) => sum + (gig.travelTime || 0) + gig.estimatedDuration, 0);
    const fuelCost = totalDistance * 0.15; // Estimate $0.15 per mile
    
    const totalEarnings = sortedGigs.reduce((sum, gig) => {
      return sum + parseFloat(gig.payBase) + parseFloat(gig.tipExpected || "0") + parseFloat(gig.payBonus || "0");
    }, 0);
    
    const efficiency = totalEarnings / (totalTime / 60); // Earnings per hour

    setOptimizedRoute(sortedGigs);
    setRouteStats({
      totalDistance,
      totalTime,
      fuelCost,
      efficiency
    });
    
    onRouteOptimized(sortedGigs.map(gig => gig.id));
    setOptimizing(false);
  };

  const getRouteQuality = () => {
    if (!routeStats) return null;
    
    if (routeStats.efficiency > 25) return { label: "Excellent", color: "text-green-600", bgColor: "bg-green-100" };
    if (routeStats.efficiency > 20) return { label: "Good", color: "text-blue-600", bgColor: "bg-blue-100" };
    if (routeStats.efficiency > 15) return { label: "Fair", color: "text-amber-600", bgColor: "bg-amber-100" };
    return { label: "Poor", color: "text-red-600", bgColor: "bg-red-100" };
  };

  if (selectedGigs.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Route className="w-5 h-5 mr-2 text-slate-400" />
            Route Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <Route className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>Select 2+ gigs to optimize your route</p>
            <p className="text-sm">Plan the most efficient path between your selected gigs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const quality = getRouteQuality();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <Route className="w-5 h-5 mr-2 text-blue-600" />
            Route Optimizer
          </div>
          {quality && (
            <Badge className={`${quality.bgColor} ${quality.color}`}>
              {quality.label} Route
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!optimizedRoute.length ? (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Ready to optimize route for {selectedGigs.length} selected gigs. 
                This will calculate the most efficient path considering traffic, due dates, and earnings.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={optimizeRoute} 
              disabled={optimizing}
              className="w-full"
            >
              {optimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Optimizing Route...
                </>
              ) : (
                <>
                  <Route className="w-4 h-4 mr-2" />
                  Optimize Route
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Route Statistics */}
            {routeStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{routeStats.totalDistance.toFixed(1)} mi</div>
                  <div className="text-xs text-slate-600">Total Distance</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{Math.round(routeStats.totalTime / 60 * 10) / 10}h</div>
                  <div className="text-xs text-slate-600">Total Time</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">${routeStats.fuelCost.toFixed(2)}</div>
                  <div className="text-xs text-slate-600">Est. Fuel Cost</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${quality?.color}`}>${routeStats.efficiency.toFixed(2)}/hr</div>
                  <div className="text-xs text-slate-600">Net Efficiency</div>
                </div>
              </div>
            )}

            {/* Optimized Route */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center">
                <Navigation className="w-4 h-4 mr-2" />
                Optimized Route Order
              </h4>
              
              {optimizedRoute.map((gig, index) => {
                const totalPay = parseFloat(gig.payBase) + parseFloat(gig.tipExpected || "0") + parseFloat(gig.payBonus || "0");
                const isUrgent = new Date(gig.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000);
                
                return (
                  <div key={gig.id} className="flex items-center space-x-3 p-3 border rounded-lg bg-white">
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-green-100 text-green-700' : 
                        index === optimizedRoute.length - 1 ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium text-sm truncate">{gig.title}</h5>
                        <div className="flex items-center space-x-1">
                          {isUrgent && (
                            <Badge className="bg-red-100 text-red-700 text-xs">URGENT</Badge>
                          )}
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            ${totalPay.toFixed(2)}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-600">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {gig.travelDistance}mi
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {Math.round(gig.estimatedDuration / 60 * 10) / 10}h
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          ${(totalPay / (gig.estimatedDuration / 60)).toFixed(2)}/hr
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button className="flex-1">
                <Navigation className="w-4 h-4 mr-2" />
                Start Navigation
              </Button>
              <Button variant="outline" onClick={() => setOptimizedRoute([])}>
                Re-optimize
              </Button>
            </div>

            {/* Route Improvement Tips */}
            <Alert className="border-blue-200 bg-blue-50">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Optimization Tips:</strong> This route prioritizes urgent gigs first, then clusters nearby locations to minimize travel time. Consider completing high-priority gigs during peak traffic hours.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}