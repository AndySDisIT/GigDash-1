import { useEffect, useRef } from "react";
import { decodePolyline } from "@/lib/polyline-decoder";

interface RouteMapProps {
  polyline?: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  mode: string;
}

export function RouteMap({ 
  polyline, 
  originLat, 
  originLng, 
  destinationLat, 
  destinationLng,
  mode 
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) {
      console.error("Leaflet not loaded");
      return;
    }

    // Initialize map centered between origin and destination
    const centerLat = (originLat + destinationLat) / 2;
    const centerLng = (originLng + destinationLng) / 2;
    const map = L.map(mapRef.current).setView([centerLat, centerLng], 12);
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

  // Update route when polyline changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Clear existing route and markers
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Get route color based on mode
    const getRouteColor = (mode: string) => {
      switch (mode) {
        case 'driving': return '#2563eb'; // blue
        case 'bicycling': return '#16a34a'; // green
        case 'walking': return '#9333ea'; // purple
        case 'transit': return '#ea580c'; // orange
        default: return '#64748b'; // slate
      }
    };

    // Add origin marker (green)
    const originMarker = L.marker([originLat, originLng], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background: #16a34a;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).bindPopup('<strong>Your Location</strong>');
    originMarker.addTo(mapInstanceRef.current);
    markersRef.current.push(originMarker);

    // Add destination marker (red)
    const destMarker = L.marker([destinationLat, destinationLng], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background: #dc2626;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    }).bindPopup('<strong>Destination</strong>');
    destMarker.addTo(mapInstanceRef.current);
    markersRef.current.push(destMarker);

    // Draw route if polyline is available
    if (polyline) {
      try {
        const coordinates = decodePolyline(polyline);
        const routeColor = getRouteColor(mode);
        
        const polylineLayer = L.polyline(coordinates, {
          color: routeColor,
          weight: 5,
          opacity: 0.8,
          smoothFactor: 1
        });
        
        routeLayerRef.current = polylineLayer;
        polylineLayer.addTo(mapInstanceRef.current);

        // Fit map to show entire route
        const bounds = polylineLayer.getBounds();
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      } catch (error) {
        console.error('Error decoding polyline:', error);
      }
    } else {
      // No polyline, just fit to show both markers
      const bounds = L.latLngBounds(
        [[originLat, originLng], [destinationLat, destinationLng]]
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [polyline, originLat, originLng, destinationLat, destinationLng, mode]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-[400px] rounded-lg border border-slate-200"
      data-testid="route-map"
    />
  );
}
