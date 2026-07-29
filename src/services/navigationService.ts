import { Tour, TourStop } from '@/types/tour';

export interface NavigationLinks {
  googleMapsUrl: string;
  appleMapsUrl: string;
  wazeUrl: string;
  stopCount: number;
}

/**
 * Builds multi-stop driving route URLs for Google Maps, Apple Maps, and Waze.
 */
export function generateNavigationLinks(tour: Tour): NavigationLinks {
  const validStops = tour.stops.filter(s => s.normalized_address || s.original_input);

  if (validStops.length === 0) {
    return {
      googleMapsUrl: 'https://maps.google.com',
      appleMapsUrl: 'https://maps.apple.com',
      wazeUrl: 'https://waze.com',
      stopCount: 0
    };
  }

  const startAddress = tour.start_address || validStops[0].normalized_address || validStops[0].original_input;
  const endAddress = validStops[validStops.length - 1].normalized_address || validStops[validStops.length - 1].original_input;

  // Intermediate waypoints (excluding start if it matches first stop)
  const waypointAddresses = validStops.slice(0, validStops.length - 1).map(s => s.normalized_address || s.original_input);

  // 1. Google Maps Multi-Stop Driving URL
  // Format: https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...&travelmode=driving
  const googleOrigin = encodeURIComponent(startAddress);
  const googleDestination = encodeURIComponent(endAddress);
  const googleWaypoints = waypointAddresses.map(a => encodeURIComponent(a)).join('|');

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${googleOrigin}&destination=${googleDestination}&waypoints=${googleWaypoints}&travelmode=driving`;

  // 2. Apple Maps Multi-Stop Driving URL
  // Format: https://maps.apple.com/?saddr=Origin&daddr=Stop1&daddr=Stop2...
  let appleMapsUrl = `https://maps.apple.com/?saddr=${encodeURIComponent(startAddress)}`;
  validStops.forEach(stop => {
    const addr = stop.normalized_address || stop.original_input;
    appleMapsUrl += `&daddr=${encodeURIComponent(addr)}`;
  });

  // 3. Waze Driving URL (Points to the first upcoming property stop)
  const firstStopAddr = validStops[0].normalized_address || validStops[0].original_input;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(firstStopAddr)}&navigate=yes`;

  return {
    googleMapsUrl,
    appleMapsUrl,
    wazeUrl,
    stopCount: validStops.length
  };
}

/**
 * Builds direct GPS navigation link for a single property stop.
 */
export function getSingleStopNavigationLink(address: string, provider: 'google' | 'apple' | 'waze'): string {
  const encoded = encodeURIComponent(address);
  if (provider === 'apple') {
    return `https://maps.apple.com/?daddr=${encoded}&dirflg=d`;
  }
  if (provider === 'waze') {
    return `https://waze.com/ul?q=${encoded}&navigate=yes`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;
}
