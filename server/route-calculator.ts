import { z } from "zod";

export const RouteRequestSchema = z.object({
  origin: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']),
  departureTime: z.string().optional(),
});

export type RouteRequest = z.infer<typeof RouteRequestSchema>;

export interface RouteStep {
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

export interface RouteResult {
  mode: string;
  distance: string;
  duration: string;
  steps: RouteStep[];
  polyline?: string;
  transitInfo?: {
    localSystem: string; // e.g., "MARTA", "JTA", "NYC Subway"
    totalFare?: string;
  };
}

/**
 * Calculate route using Google Maps Directions API
 */
export async function calculateRoute(
  request: RouteRequest,
  apiKey: string
): Promise<RouteResult> {
  const { origin, destination, mode, departureTime } = request;

  const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: mode,
    key: apiKey,
  });

  // Add transit-specific parameters
  if (mode === 'transit') {
    params.append('transit_mode', 'bus|subway|train|rail|tram');
    params.append('transit_routing_preference', 'fewer_transfers');
    if (departureTime) {
      params.append('departure_time', departureTime);
    } else {
      params.append('departure_time', 'now');
    }
  }

  const url = `${baseUrl}?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Directions API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
  }

  const route = data.routes[0];
  const leg = route.legs[0];

  // Extract steps
  const steps: RouteStep[] = leg.steps.map((step: any) => {
    const routeStep: RouteStep = {
      instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Strip HTML
      distance: step.distance.text,
      duration: step.duration.text,
      travelMode: step.travel_mode,
    };

    // Add transit details if available
    if (step.transit_details) {
      const transit = step.transit_details;
      routeStep.transitDetails = {
        line: transit.line.short_name || transit.line.name,
        vehicle: transit.line.vehicle.name,
        departure: new Date(transit.departure_time.value * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        arrival: new Date(transit.arrival_time.value * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        stops: transit.num_stops,
      };
    }

    return routeStep;
  });

  // Detect local transit system from transit steps
  let localSystem = 'Local Transit';
  if (mode === 'transit' && leg.steps) {
    const transitSteps = leg.steps.filter((s: any) => s.transit_details);
    if (transitSteps.length > 0) {
      const agencyName = transitSteps[0].transit_details?.line?.agencies?.[0]?.name;
      if (agencyName) {
        localSystem = agencyName;
      }
    }
  }

  const result: RouteResult = {
    mode,
    distance: leg.distance.text,
    duration: leg.duration.text,
    steps,
    polyline: route.overview_polyline?.points,
  };

  if (mode === 'transit') {
    result.transitInfo = {
      localSystem,
      totalFare: leg.fare?.text,
    };
  }

  return result;
}

/**
 * Calculate routes for all transportation modes
 */
export async function calculateAllRoutes(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  apiKey: string
): Promise<Record<string, RouteResult>> {
  const modes: Array<'driving' | 'walking' | 'bicycling' | 'transit'> = [
    'driving',
    'walking',
    'bicycling',
    'transit',
  ];

  const results: Record<string, RouteResult> = {};

  // Calculate routes in parallel
  await Promise.all(
    modes.map(async (mode) => {
      try {
        const route = await calculateRoute({ origin, destination, mode }, apiKey);
        results[mode] = route;
      } catch (error) {
        console.error(`Error calculating ${mode} route:`, error);
        // Create error placeholder
        results[mode] = {
          mode,
          distance: 'N/A',
          duration: 'N/A',
          steps: [],
        };
      }
    })
  );

  return results;
}
