import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Navigation, 
  Car, 
  Bike, 
  Bus, 
  Footprints,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Info,
  Map
} from "lucide-react";
import { RouteMap } from "./route-map";

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  travelMode: string;
  transitDetails?: {
    line: string;
    vehicle: string;
    departure: string;
    arrival: string;
    stops: number;
  };
}

interface RouteResult {
  mode: string;
  distance: string;
  duration: string;
  steps: RouteStep[];
  polyline?: string;
  transitInfo?: {
    localSystem: string;
    totalFare?: string;
  };
}

interface RouteOptionsProps {
  destinationLat: number;
  destinationLng: number;
  onModeSelected?: (mode: string) => void;
}

export function RouteOptions({ destinationLat, destinationLng, onModeSelected }: RouteOptionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routes, setRoutes] = useState<Record<string, RouteResult> | null>(null);
  const [expandedMode, setExpandedMode] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>('driving');
  const [viewTab, setViewTab] = useState<'map' | 'list'>('map');

  // Get user's GPS location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error('Error getting location:', err);
          setError('Could not get your location. Please enable GPS.');
        }
      );
    } else {
      setError('GPS not supported by your browser');
    }
  }, []);

  // Calculate routes when location is available
  const calculateRoutes = async () => {
    if (!userLocation) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/routes/calculate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: userLocation,
          destination: { lat: destinationLat, lng: destinationLng },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to calculate routes');
      }

      const data = await response.json();
      setRoutes(data);

      // Set selectedMode to first available route
      const availableModes = Object.keys(data).filter(mode => 
        data[mode].steps && data[mode].steps.length > 0
      );
      if (availableModes.length > 0) {
        // Use current selectedMode if it exists, otherwise use first available
        if (!availableModes.includes(selectedMode)) {
          setSelectedMode(availableModes[0]);
        }
      }
    } catch (err) {
      console.error('Error calculating routes:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate routes');
    } finally {
      setLoading(false);
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'driving':
        return <Car className="w-5 h-5" />;
      case 'bicycling':
        return <Bike className="w-5 h-5" />;
      case 'walking':
        return <Footprints className="w-5 h-5" />;
      case 'transit':
        return <Bus className="w-5 h-5" />;
      default:
        return <Navigation className="w-5 h-5" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'driving':
        return 'text-blue-600';
      case 'bicycling':
        return 'text-green-600';
      case 'walking':
        return 'text-purple-600';
      case 'transit':
        return 'text-orange-600';
      default:
        return 'text-slate-600';
    }
  };

  const getModeName = (mode: string) => {
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  if (!userLocation && !error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-slate-300 animate-pulse" />
          <p className="text-slate-600">Getting your location...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Route Options
          </div>
          {!routes && userLocation && (
            <Button 
              onClick={calculateRoutes} 
              disabled={loading}
              data-testid="button-calculate-routes"
            >
              {loading ? 'Calculating...' : 'Get Directions'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <Info className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {routes && (
          <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as 'map' | 'list')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="map" data-testid="tab-map">
                <Map className="w-4 h-4 mr-2" />
                Map View
              </TabsTrigger>
              <TabsTrigger value="list" data-testid="tab-list">
                <Navigation className="w-4 h-4 mr-2" />
                Route Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="space-y-4">
              {/* Interactive Map */}
              {userLocation && (
                <RouteMap
                  polyline={routes[selectedMode]?.polyline}
                  originLat={userLocation.lat}
                  originLng={userLocation.lng}
                  destinationLat={destinationLat}
                  destinationLng={destinationLng}
                  mode={selectedMode}
                />
              )}

              {/* Mode Selector for Map */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(routes).map(([mode, route]) => {
                  const hasValidRoute = route.steps && route.steps.length > 0;
                  if (!hasValidRoute) return null;

                  return (
                    <Button
                      key={mode}
                      variant={selectedMode === mode ? 'default' : 'outline'}
                      onClick={() => setSelectedMode(mode)}
                      className="flex flex-col h-auto p-3"
                      data-testid={`button-map-mode-${mode}`}
                    >
                      <div className={getModeColor(mode)}>
                        {getModeIcon(mode)}
                      </div>
                      <span className="text-xs font-semibold mt-1">
                        {getModeName(mode)}
                      </span>
                      <span className="text-xs text-slate-600 mt-1">
                        {route.duration}
                      </span>
                    </Button>
                  );
                })}
              </div>

              {/* Selected Route Summary */}
              {routes[selectedMode] && routes[selectedMode].steps?.length > 0 && (
                <Card className="bg-slate-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">
                          {getModeName(selectedMode)}
                          {routes[selectedMode].transitInfo && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {routes[selectedMode].transitInfo!.localSystem}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-slate-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {routes[selectedMode].duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {routes[selectedMode].distance}
                          </span>
                          {routes[selectedMode].transitInfo?.totalFare && (
                            <span>Fare: {routes[selectedMode].transitInfo!.totalFare}</span>
                          )}
                        </div>
                      </div>
                      {onModeSelected && (
                        <Button
                          size="sm"
                          onClick={() => onModeSelected(selectedMode)}
                          data-testid={`button-select-map-${selectedMode}`}
                        >
                          Select Route
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="list" className="space-y-3">
              {Object.entries(routes).map(([mode, route]) => {
              const isExpanded = expandedMode === mode;
              const hasValidRoute = route.steps && route.steps.length > 0;
              
              return (
                <div key={mode} className="border rounded-lg overflow-hidden">
                  <div 
                    className="p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => setExpandedMode(isExpanded ? null : mode)}
                    data-testid={`route-${mode}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={getModeColor(mode)}>
                          {getModeIcon(mode)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {getModeName(mode)}
                            {route.transitInfo && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {route.transitInfo.localSystem}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {route.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {route.distance}
                            </span>
                            {route.transitInfo?.totalFare && (
                              <span>Fare: {route.transitInfo.totalFare}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasValidRoute && onModeSelected && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onModeSelected(mode);
                            }}
                            data-testid={`button-select-${mode}`}
                          >
                            Select
                          </Button>
                        )}
                        {hasValidRoute && (
                          isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && hasValidRoute && (
                    <div className="p-4 bg-white">
                      <h4 className="font-medium text-sm text-slate-700 mb-3">Turn-by-turn Directions</h4>
                      <div className="space-y-3">
                        {route.steps.map((step, index) => (
                          <div key={index} className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-semibold text-slate-600">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-800">{step.instruction}</p>
                              {step.transitDetails && (
                                <div className="mt-1 p-2 bg-orange-50 rounded text-xs text-orange-900">
                                  <div className="font-medium">
                                    {step.transitDetails.vehicle} - {step.transitDetails.line}
                                  </div>
                                  <div className="text-orange-700">
                                    {step.transitDetails.departure} → {step.transitDetails.arrival} ({step.transitDetails.stops} stops)
                                  </div>
                                </div>
                              )}
                              <div className="flex gap-3 mt-1 text-xs text-slate-500">
                                <span>{step.distance}</span>
                                <span>{step.duration}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </TabsContent>
          </Tabs>
        )}

        {routes && (
          <>
            <Separator className="my-4" />
            <Button 
              variant="outline" 
              className="w-full"
              onClick={calculateRoutes}
              disabled={loading}
            >
              Recalculate Routes
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
