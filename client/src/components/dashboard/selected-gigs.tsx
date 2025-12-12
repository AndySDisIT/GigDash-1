import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MapPin, 
  Clock, 
  Calendar, 
  DollarSign, 
  Route, 
  Navigation,
  CheckCircle,
  AlertCircle,
  Car,
  Bike,
  Bus
} from "lucide-react";
import type { Gig } from "@shared/schema";
import { format } from "date-fns";
import { RouteOptions } from "@/components/routing/route-options";

interface SelectedGigsProps {
  selectedGigs: Gig[];
  onOptimizeRoute: () => void;
  onMarkCompleted: (gigId: string) => void;
  onRemoveFromSelected: (gigId: string) => void;
}

export function SelectedGigs({ 
  selectedGigs, 
  onOptimizeRoute, 
  onMarkCompleted, 
  onRemoveFromSelected 
}: SelectedGigsProps) {
  const [transportMode, setTransportMode] = useState<'driving' | 'biking' | 'transit'>('driving');
  const [selectedGigForRoute, setSelectedGigForRoute] = useState<Gig | null>(null);
  
  const totalEarnings = selectedGigs.reduce((sum, gig) => {
    return sum + parseFloat(gig.payBase) + parseFloat(gig.tipExpected || "0") + parseFloat(gig.payBonus || "0");
  }, 0);

  const totalTime = selectedGigs.reduce((sum, gig) => sum + gig.estimatedDuration, 0);
  const totalTravelTime = selectedGigs.reduce((sum, gig) => sum + (gig.travelTime || 0), 0);

  const averageHourlyRate = totalTime > 0 ? (totalEarnings / (totalTime / 60)) : 0;

  // Sort gigs by due date for action list
  const sortedGigs = [...selectedGigs].sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  if (selectedGigs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <CheckCircle className="w-5 h-5 mr-2 text-slate-400" />
            Action List - Selected Gigs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No gigs selected yet</p>
            <p className="text-sm">Select gigs from the available list to create your action plan</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Action List - {selectedGigs.length} Gigs Selected
            </div>
            <Badge className="bg-green-100 text-green-800">
              ${totalEarnings.toFixed(2)} Total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</div>
              <div className="text-sm text-slate-600">Total Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(totalTime / 60 * 10) / 10}h</div>
              <div className="text-sm text-slate-600">Work Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">${averageHourlyRate.toFixed(2)}</div>
              <div className="text-sm text-slate-600">Avg $/Hour</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.round(totalTravelTime)}m</div>
              <div className="text-sm text-slate-600">Travel Time</div>
            </div>
          </div>

          {/* Transport Mode Selection */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium">Transport:</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={transportMode === 'driving' ? 'default' : 'outline'}
                onClick={() => setTransportMode('driving')}
                className="text-xs"
              >
                <Car className="w-3 h-3 mr-1" />
                Drive
              </Button>
              <Button
                size="sm"
                variant={transportMode === 'biking' ? 'default' : 'outline'}
                onClick={() => setTransportMode('biking')}
                className="text-xs"
              >
                <Bike className="w-3 h-3 mr-1" />
                Bike
              </Button>
              <Button
                size="sm"
                variant={transportMode === 'transit' ? 'default' : 'outline'}
                onClick={() => setTransportMode('transit')}
                className="text-xs"
              >
                <Bus className="w-3 h-3 mr-1" />
                Transit
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onOptimizeRoute} className="flex-1">
              <Route className="w-4 h-4 mr-2" />
              Optimize Route
            </Button>
            <Button variant="outline" className="flex-1">
              <Navigation className="w-4 h-4 mr-2" />
              Start Navigation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Priority Alert */}
      {sortedGigs.some(gig => new Date(gig.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000)) && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            You have gigs due within 24 hours. Consider prioritizing these first.
          </AlertDescription>
        </Alert>
      )}

      {/* Action List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Execution Order (By Due Date)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedGigs.map((gig, index) => {
            const totalPay = parseFloat(gig.payBase) + parseFloat(gig.tipExpected || "0") + parseFloat(gig.payBonus || "0");
            const hourlyRate = totalPay / (gig.estimatedDuration / 60);
            const isUrgent = new Date(gig.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000);
            
            return (
              <div key={gig.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-slate-50">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isUrgent ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-slate-800 truncate">{gig.title}</h4>
                    <div className="flex items-center space-x-2">
                      {isUrgent && (
                        <Badge className="bg-red-100 text-red-700 text-xs">URGENT</Badge>
                      )}
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        ${totalPay.toFixed(2)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {gig.travelDistance}mi away
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.round(gig.estimatedDuration / 60 * 10) / 10}h
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Due {format(new Date(gig.dueDate), "MMM d, h:mm a")}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      ${hourlyRate.toFixed(2)}/hr
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 mt-1">
                    {gig.location}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          data-testid={`button-directions-${gig.id}`}
                        >
                          <Navigation className="w-3 h-3 mr-1" />
                          Directions
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Routes to {gig.title}</DialogTitle>
                        </DialogHeader>
                        {gig.latitude && gig.longitude && (
                          <RouteOptions
                            destinationLat={parseFloat(gig.latitude.toString())}
                            destinationLng={parseFloat(gig.longitude.toString())}
                            onModeSelected={(mode) => {
                              console.log(`Selected ${mode} mode for gig ${gig.id}`);
                            }}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      onClick={() => onMarkCompleted(gig.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveFromSelected(gig.id)}
                    className="text-xs w-full"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connected Apps Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "GigSpot", status: "connected", count: selectedGigs.filter(g => g.sourceId.includes('gigspot')).length },
              { name: "iVueit", status: "connected", count: selectedGigs.filter(g => g.sourceId.includes('ivueit')).length },
              { name: "Field Agent", status: "connected", count: selectedGigs.filter(g => g.sourceId.includes('field-agent')).length },
              { name: "Observa", status: "connected", count: selectedGigs.filter(g => g.sourceId.includes('observa')).length }
            ].map((app) => (
              <div key={app.name} className="text-center p-3 border rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    app.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium">{app.name}</span>
                </div>
                <div className="text-lg font-bold text-slate-700">{app.count}</div>
                <div className="text-xs text-slate-500">selected</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}