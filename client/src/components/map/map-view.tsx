import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Route, Settings, Bus, Bike } from "lucide-react";
import type { Gig } from "@shared/schema";

interface MapViewProps {
  gigs: Gig[];
  selectedGigs: Set<string>;
}

type TransitSystem = 'jta' | 'marta';

export function MapView({ gigs, selectedGigs }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [showTransit, setShowTransit] = useState(false);
  const [showBikeRoutes, setShowBikeRoutes] = useState(false);
  const [transitSystem, setTransitSystem] = useState<TransitSystem>('marta');
  const transitLayerRef = useRef<any>(null);
  const bikeLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map
    const L = (window as any).L;
    if (!L) {
      console.error("Leaflet not loaded");
      return;
    }

    // Center on Atlanta, GA (MARTA default)
    const map = L.map(mapRef.current).setView([33.7490, -84.3880], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center when transit system changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const L = (window as any).L;
    const centers: Record<TransitSystem, [number, number]> = {
      jta: [30.3321, -81.6557], // Jacksonville, FL
      marta: [33.7490, -84.3880] // Atlanta, GA
    };
    
    mapInstanceRef.current.setView(centers[transitSystem], 12);
    
    // Clear and reload transit layer
    if (transitLayerRef.current) {
      mapInstanceRef.current.removeLayer(transitLayerRef.current);
      transitLayerRef.current = null;
    }
    
    if (showTransit) {
      loadTransitRoutes();
    }
  }, [transitSystem]);

  // Load transit routes based on selected system
  const loadTransitRoutes = async () => {
    if (!mapInstanceRef.current || transitLayerRef.current) return;

    const L = (window as any).L;
    try {
      let transitRoutes: Array<{ name: string; coords: number[][]; color?: string; type?: string }> = [];
      let systemName = '';
      
      if (transitSystem === 'jta') {
        // Jacksonville Transit Authority routes
        systemName = 'JTA';
        transitRoutes = [
          { name: "Route 1 - University/Southpoint", coords: [[30.3321, -81.6557], [30.2672, -81.6431]] },
          { name: "Route 3 - Beach Boulevard", coords: [[30.3152, -81.6596], [30.2880, -81.4066]] },
          { name: "Route 8 - Cassat/103rd", coords: [[30.3370, -81.6557], [30.2344, -81.7081]] },
          { name: "Route 11 - San Jose", coords: [[30.3152, -81.6596], [30.2344, -81.6431]] },
          { name: "Skyway Monorail", coords: [[30.3297, -81.6614], [30.3370, -81.6557]] },
          { name: "St. Johns River Ferry", coords: [[30.3936, -81.6626], [30.3936, -81.6896]] }
        ];
      } else if (transitSystem === 'marta') {
        // MARTA (Metropolitan Atlanta Rapid Transit Authority) routes
        systemName = 'MARTA';
        transitRoutes = [
          // Rail Lines
          { name: "Red Line (North Springs - Airport)", coords: [[33.9500, -84.3513], [33.6407, -84.4277]], color: '#FF0000', type: 'rail' },
          { name: "Gold Line (Doraville - Airport)", coords: [[33.9026, -84.2806], [33.6407, -84.4277]], color: '#FFD700', type: 'rail' },
          { name: "Blue Line (Hamilton E. Holmes - Indian Creek)", coords: [[33.7550, -84.4700], [33.7700, -84.2286]], color: '#0000FF', type: 'rail' },
          { name: "Green Line (Bankhead - Edgewood/Candler Park)", coords: [[33.7726, -84.4283], [33.7607, -84.3400]], color: '#00FF00', type: 'rail' },
          
          // Major Bus Routes
          { name: "Route 2 - Ponce de Leon", coords: [[33.7850, -84.3880], [33.7700, -84.3400]], color: '#2563eb', type: 'bus' },
          { name: "Route 15 - Peachtree", coords: [[33.8400, -84.3700], [33.7490, -84.3880]], color: '#2563eb', type: 'bus' },
          { name: "Route 26 - Marietta", coords: [[33.9500, -84.5500], [33.7490, -84.3880]], color: '#2563eb', type: 'bus' },
          { name: "Route 39 - Buford Highway", coords: [[33.8800, -84.2700], [33.7490, -84.3880]], color: '#2563eb', type: 'bus' },
          { name: "Route 49 - Memorial Drive", coords: [[33.7490, -84.3880], [33.7500, -84.2500]], color: '#2563eb', type: 'bus' },
          { name: "Route 50 - Decatur", coords: [[33.7746, -84.2963], [33.7490, -84.3880]], color: '#2563eb', type: 'bus' }
        ];
      }

      const transitLayer = L.layerGroup();
      
      transitRoutes.forEach(route => {
        const color = route.color || '#2563eb';
        const weight = route.type === 'rail' ? 5 : 4;
        const label = route.type === 'rail' ? '🚇' : '🚌';
        
        const polyline = L.polyline(route.coords, {
          color: color,
          weight: weight,
          opacity: 0.7
        }).bindPopup(`<strong>${label} ${systemName} ${route.name}</strong><br>${transitSystem.toUpperCase()} Transit`);
        
        transitLayer.addLayer(polyline);
      });

      transitLayerRef.current = transitLayer;
      if (showTransit) {
        transitLayer.addTo(mapInstanceRef.current);
      }
    } catch (error) {
      console.error('Error loading transit routes:', error);
    }
  };

  // Load Jacksonville bike routes
  const loadBikeRoutes = async () => {
    if (!mapInstanceRef.current || bikeLayerRef.current) return;

    const L = (window as any).L;
    try {
      // Using data from Jacksonville bike infrastructure (simplified representation)
      const bikeRoutes = [
        { name: "Jacksonville-Baldwin Rail Trail", coords: [[30.3321, -81.6557], [30.3152, -81.4066]], type: "trail" },
        { name: "S-Line Urban Greenway", coords: [[30.3200, -81.6596], [30.3100, -81.6400]], type: "trail" },
        { name: "Black Creek Trail", coords: [[30.4000, -81.7000], [30.3800, -81.6800]], type: "trail" },
        { name: "Northbank Riverwalk", coords: [[30.3297, -81.6614], [30.3200, -81.6500]], type: "trail" },
        { name: "Beach Boulevard Bike Lane", coords: [[30.3152, -81.6596], [30.2880, -81.4066]], type: "lane" },
        { name: "University Boulevard Bike Lane", coords: [[30.3321, -81.6557], [30.2672, -81.6431]], type: "lane" },
        { name: "San Jose Boulevard Shared Path", coords: [[30.3152, -81.6596], [30.2344, -81.6431]], type: "shared" }
      ];

      const bikeLayer = L.layerGroup();
      
      bikeRoutes.forEach(route => {
        const color = route.type === 'trail' ? '#16a34a' : 
                     route.type === 'lane' ? '#ea580c' : '#8b5cf6';
        
        const polyline = L.polyline(route.coords, {
          color: color,
          weight: 3,
          opacity: 0.8,
          dashArray: route.type === 'shared' ? '5, 5' : null
        }).bindPopup(`<strong>${route.name}</strong><br>Type: ${route.type.charAt(0).toUpperCase() + route.type.slice(1)}`);
        
        bikeLayer.addLayer(polyline);
      });

      bikeLayerRef.current = bikeLayer;
      if (showBikeRoutes) {
        bikeLayer.addTo(mapInstanceRef.current);
      }
    } catch (error) {
      console.error('Error loading bike routes:', error);
    }
  };

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const L = (window as any).L;
    
    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Add gig markers
    gigs.forEach((gig, index) => {
      if (!gig.latitude || !gig.longitude) return;

      const color = gig.priority === 'high' ? 'green' : 
                   gig.priority === 'medium' ? 'orange' : 'red';
      
      const marker = L.circleMarker([parseFloat(gig.latitude), parseFloat(gig.longitude)], {
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        radius: selectedGigs.has(gig.id) ? 12 : 8
      }).addTo(mapInstanceRef.current);
      
      const totalPay = parseFloat(gig.payBase) + parseFloat(gig.tipExpected || "0") + parseFloat(gig.payBonus || "0");
      marker.bindPopup(`<strong>${gig.title}</strong><br>$${totalPay.toFixed(2)}<br>${gig.location}`);
    });

    // Load transit and bike routes on first render
    loadTransitRoutes();
    loadBikeRoutes();
  }, [gigs, selectedGigs]);

  // Handle transit layer toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !transitLayerRef.current) return;

    if (showTransit) {
      transitLayerRef.current.addTo(mapInstanceRef.current);
    } else {
      mapInstanceRef.current.removeLayer(transitLayerRef.current);
    }
  }, [showTransit]);

  // Handle bike routes layer toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !bikeLayerRef.current) return;

    if (showBikeRoutes) {
      bikeLayerRef.current.addTo(mapInstanceRef.current);
    } else {
      mapInstanceRef.current.removeLayer(bikeLayerRef.current);
    }
  }, [showBikeRoutes]);

  const routeStats = {
    totalMiles: "24.7",
    totalTime: "3h 25m", 
    fuelCost: "$8.45",
    efficiency: "92%"
  };

  const selectedGigsArray = gigs.filter(gig => selectedGigs.has(gig.id));

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-4 border-b border-slate-200">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
              <h2 className="text-lg font-semibold text-slate-800">Gig Locations & Routing</h2>
              <div className="flex space-x-2">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <Route className="w-4 h-4 mr-2" />
                  Optimize Route
                </Button>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
            
            {/* Transportation Layer Controls */}
            <div className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bus className="w-4 h-4 text-blue-600" />
                  <Label htmlFor="transit-toggle" className="text-sm font-medium">
                    Transit Routes
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={transitSystem}
                    onValueChange={(value: TransitSystem) => setTransitSystem(value)}
                    disabled={!showTransit}
                  >
                    <SelectTrigger className="h-8 w-[140px]" data-testid="select-transit-system">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marta" data-testid="option-marta">MARTA (Atlanta)</SelectItem>
                      <SelectItem value="jta" data-testid="option-jta">JTA (Jacksonville)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Switch
                    id="transit-toggle"
                    checked={showTransit}
                    onCheckedChange={setShowTransit}
                    data-testid="toggle-transit"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bike className="w-4 h-4 text-green-600" />
                  <Label htmlFor="bike-toggle" className="text-sm font-medium">
                    Bike Routes & Trails
                  </Label>
                </div>
                <Switch
                  id="bike-toggle"
                  checked={showBikeRoutes}
                  onCheckedChange={setShowBikeRoutes}
                  data-testid="toggle-bike"
                />
              </div>
            </div>
            
            {/* Legend */}
            {(showTransit || showBikeRoutes) && (
              <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                {showTransit && transitSystem === 'marta' && (
                  <>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-0.5 bg-red-600"></div>
                      <span>Red Line</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-0.5 bg-yellow-500"></div>
                      <span>Gold Line</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-0.5 bg-blue-600"></div>
                      <span>Blue Line</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-0.5 bg-green-600"></div>
                      <span>Green Line</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-0.5 bg-blue-600"></div>
                      <span>Bus Routes</span>
                    </div>
                  </>
                )}
                {showTransit && transitSystem === 'jta' && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-0.5 bg-blue-600"></div>
                    <span>JTA Routes</span>
                  </div>
                )}
                {showBikeRoutes && (
                  <>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-0.5 bg-green-600"></div>
                      <span>Bike Trails</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-0.5 bg-orange-600"></div>
                      <span>Bike Lanes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-0.5 bg-purple-600 border-dashed border-b-2 border-purple-600"></div>
                      <span>Shared Paths</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div 
          ref={mapRef} 
          className="h-96 md:h-[500px]"
          style={{ minHeight: "400px" }}
        />
        
        <div className="p-4 border-t border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-slate-800">{routeStats.totalMiles}</div>
              <div className="text-slate-600">Total Miles</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-800">{routeStats.totalTime}</div>
              <div className="text-slate-600">Drive Time</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-800">{routeStats.fuelCost}</div>
              <div className="text-slate-600">Fuel Cost</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-800">{routeStats.efficiency}</div>
              <div className="text-slate-600">Efficiency</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Route Stops */}
      {selectedGigsArray.length > 0 && (
        <Card>
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Optimized Route</h3>
          </div>
          <div className="divide-y divide-slate-200">
            {selectedGigsArray.map((gig, index) => {
              const totalPay = parseFloat(gig.payBase) + parseFloat(gig.tipExpected || "0") + parseFloat(gig.payBonus || "0");
              return (
                <div key={gig.id} className="p-4 flex items-center space-x-4">
                  <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800">{gig.title}</h4>
                    <p className="text-sm text-slate-600">
                      {gig.travelDistance || "2.3"} mi • ETA: {new Date(Date.now() + index * 2 * 60 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • ${totalPay.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-600">Drive: {gig.travelTime || 15} min</div>
                    <div className="text-sm text-slate-600">Work: {Math.round(gig.estimatedDuration / 60 * 10) / 10} hrs</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
