export interface GeocodeResult {
  normalized_address: string;
  latitude: number;
  longitude: number;
  geocode_status: 'RESOLVED' | 'AMBIGUOUS' | 'FAILED';
  mls_number?: string;
  list_price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  listing_agent_name?: string;
  listing_agent_phone?: string;
  listing_agent_email?: string;
  listing_brokerage?: string;
}

export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const MOCK_LOCATION_DATABASE: Record<string, { lat: number; lng: number; fullAddress: string }> = {
  'GREAT NECK': { lat: 40.7865, lng: -73.7285, fullAddress: '123 Main St, Great Neck, NY 11021' },
  'MANHASSET': { lat: 40.7971, lng: -73.7001, fullAddress: '45 Harbor Rd, Manhasset, NY 11030' },
  'ROSLYN': { lat: 40.8012, lng: -73.6521, fullAddress: '12 Northern Blvd, Roslyn, NY 11576' },
  'GLEN COVE': { lat: 40.8654, lng: -73.6276, fullAddress: '88 Forest Ave, Glen Cove, NY 11542' },
  'JERICHO': { lat: 40.7901, lng: -73.5385, fullAddress: '200 Jericho Turnpike, Jericho, NY 11753' },
  'SYOSSET': { lat: 40.8173, lng: -73.5012, fullAddress: '15 Jackson Ave, Syosset, NY 11791' }
};

export async function geocodeAddress(addressInput: string): Promise<GeocodeResult> {
  const cleanInput = addressInput.trim().toUpperCase();

  let matchedLocation = Object.entries(MOCK_LOCATION_DATABASE).find(([key]) =>
    cleanInput.includes(key)
  );

  let lat = 40.7865;
  let lng = -73.7285;
  let normalized = addressInput;

  if (matchedLocation) {
    lat = matchedLocation[1].lat;
    lng = matchedLocation[1].lng;
    normalized = matchedLocation[1].fullAddress;
  } else {
    // Deterministic hash offset for unlisted addresses
    const hash = cleanInput.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    lat = 40.75 + (hash % 100) * 0.002;
    lng = -73.75 + (hash % 100) * 0.002;
  }

  return {
    normalized_address: normalized,
    latitude: lat,
    longitude: lng,
    geocode_status: 'RESOLVED',
    mls_number: `ONEKEY-${3400000 + (Math.abs(cleanInput.length * 19283) % 100000)}`,
    list_price: 850000 + (Math.abs(cleanInput.length * 9412) % 1500000),
    beds: 3 + (cleanInput.length % 3),
    baths: 2 + (cleanInput.length % 3),
    sqft: 2200 + (cleanInput.length * 50),
    listing_agent_name: 'Sarah Jenkins',
    listing_agent_phone: '(516) 555-0192',
    listing_agent_email: 'sjenkins@compass.com',
    listing_brokerage: 'Compass Real Estate'
  };
}

export async function batchGeocodeAddresses(addresses: string[]): Promise<GeocodeResult[]> {
  return Promise.all(addresses.map(addr => geocodeAddress(addr)));
}
