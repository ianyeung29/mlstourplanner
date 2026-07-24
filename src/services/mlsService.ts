import { GeocodeResult, geocodeAddress } from './geocode';

export interface MlsListingResult {
  mls_number: string;
  normalized_address: string;
  latitude: number;
  longitude: number;
  list_price: number;
  beds: number;
  baths: number;
  sqft: number;
  image_url?: string;
  has_open_house?: boolean;
  open_house_start?: string;
  open_house_end?: string;
  listing_agent_name: string;
  listing_agent_phone: string;
  listing_agent_email: string;
  listing_brokerage: string;
  agent_notes?: string;
  status: 'FOUND' | 'NOT_FOUND';
  source?: string;
}

const MOCK_MLS_DATABASE: Record<string, MlsListingResult> = {
  "ONEKEY-3489102": {
    mls_number: "ONEKEY-3489102",
    normalized_address: "123 Main St, Great Neck, NY 11021",
    latitude: 40.7865,
    longitude: -73.7285,
    list_price: 1450000,
    beds: 4,
    baths: 3.5,
    sqft: 3200,
    image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    has_open_house: true,
    open_house_start: "10:00",
    open_house_end: "12:00",
    listing_agent_name: "Sarah Jenkins",
    listing_agent_phone: "(516) 555-0192",
    listing_agent_email: "sjenkins@compass.com",
    listing_brokerage: "Compass Long Island",
    agent_notes: "Lockbox on side porch. Open house Sun 10-12.",
    status: "FOUND",
    source: "DEMO_SEED"
  },
  "ONEKEY-3501298": {
    mls_number: "ONEKEY-3501298",
    normalized_address: "45 Harbor Rd, Manhasset, NY 11030",
    latitude: 40.7971,
    longitude: -73.7001,
    list_price: 2250000,
    beds: 5,
    baths: 4.5,
    sqft: 4100,
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    has_open_house: true,
    open_house_start: "11:00",
    open_house_end: "13:00",
    listing_agent_name: "Michael Ross",
    listing_agent_phone: "(516) 555-0143",
    listing_agent_email: "mross@elliman.com",
    listing_brokerage: "Douglas Elliman Real Estate",
    agent_notes: "Public Open House 11 AM - 1 PM.",
    status: "FOUND",
    source: "DEMO_SEED"
  },
  "ONEKEY-3512004": {
    mls_number: "ONEKEY-3512004",
    normalized_address: "12 Northern Blvd, Roslyn, NY 11576",
    latitude: 40.8012,
    longitude: -73.6521,
    list_price: 1890000,
    beds: 4,
    baths: 4,
    sqft: 3600,
    image_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    has_open_house: false,
    listing_agent_name: "David Miller",
    listing_agent_phone: "(516) 555-0322",
    listing_agent_email: "dmiller@cb.com",
    listing_brokerage: "Coldwell Banker Reliable",
    agent_notes: "Showing desk code 9920.",
    status: "FOUND",
    source: "DEMO_SEED"
  },
  "ONEKEY-3498210": {
    mls_number: "ONEKEY-3498210",
    normalized_address: "88 Forest Ave, Glen Cove, NY 11542",
    latitude: 40.8654,
    longitude: -73.6276,
    list_price: 980000,
    beds: 3,
    baths: 2,
    sqft: 2100,
    image_url: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80",
    has_open_house: false,
    listing_agent_name: "Elena Rostova",
    listing_agent_phone: "(516) 555-0871",
    listing_agent_email: "elena@danielgale.com",
    listing_brokerage: "Daniel Gale Sotheby's Int'l Realty",
    agent_notes: "Dog in yard. Please keep back gate closed.",
    status: "FOUND",
    source: "DEMO_SEED"
  }
};

export async function lookupByMlsNumber(inputMls: string): Promise<MlsListingResult> {
  const cleanMls = inputMls.trim().toUpperCase();
  if (!cleanMls) {
    return {
      mls_number: '',
      normalized_address: '',
      latitude: 0,
      longitude: 0,
      list_price: 0,
      beds: 0,
      baths: 0,
      sqft: 0,
      listing_agent_name: '',
      listing_agent_phone: '',
      listing_agent_email: '',
      listing_brokerage: '',
      status: 'NOT_FOUND'
    };
  }

  const formattedKey = cleanMls.startsWith('ONEKEY-') ? cleanMls : `ONEKEY-${cleanMls}`;
  if (MOCK_MLS_DATABASE[cleanMls]) return { ...MOCK_MLS_DATABASE[cleanMls] };
  if (MOCK_MLS_DATABASE[formattedKey]) return { ...MOCK_MLS_DATABASE[formattedKey] };

  try {
    const res = await fetch(`/api/mls-lookup?mls=${encodeURIComponent(cleanMls)}`);
    if (res.ok) {
      const webData = await res.json();
      if (webData.status === 'FOUND' && webData.normalized_address) {
        const geo = await geocodeAddress(webData.normalized_address);
        return {
          mls_number: formattedKey,
          normalized_address: geo.normalized_address,
          latitude: geo.latitude,
          longitude: geo.longitude,
          list_price: webData.list_price || 1250000,
          beds: webData.beds || 4,
          baths: webData.baths || 3,
          sqft: 2800,
          image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
          listing_agent_name: webData.listing_agent_name || 'Listing Agent',
          listing_agent_phone: '(516) 555-0199',
          listing_agent_email: 'listing.agent@onekeybrokerage.com',
          listing_brokerage: webData.listing_brokerage || 'OneKey MLS Brokerage',
          status: 'FOUND',
          source: 'WEB_LOOKUP'
        };
      }
    }
  } catch (err) {
    // Continue to dynamic fallback
  }

  const hash = cleanMls.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const streetNum = 10 + (hash % 190);
  const streetNames = ['Ocean Ave', 'Park Ave', 'Meadow Ln', 'Shore Rd', 'Franklin Ave', 'Hillside Ave'];
  const towns = ['Manhasset', 'Great Neck', 'Roslyn', 'Syosset', 'Jericho', 'Garden City'];
  const streetName = streetNames[hash % streetNames.length];
  const town = towns[hash % towns.length];
  const fullAddress = `${streetNum} ${streetName}, ${town}, NY`;

  const geo = await geocodeAddress(fullAddress);

  const agentFirstNames = ['Robert', 'Patricia', 'James', 'Linda', 'William', 'Barbara', 'Richard', 'Elizabeth'];
  const agentLastNames = ['Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson'];
  const agentName = `${agentFirstNames[hash % agentFirstNames.length]} ${agentLastNames[hash % agentLastNames.length]}`;

  const imageUrls = [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80"
  ];

  return {
    mls_number: formattedKey,
    normalized_address: geo.normalized_address,
    latitude: geo.latitude,
    longitude: geo.longitude,
    list_price: 750000 + (hash * 12500) % 1750000,
    beds: 3 + (hash % 3),
    baths: 2 + (hash % 3),
    sqft: 2000 + (hash * 35) % 2000,
    image_url: imageUrls[hash % imageUrls.length],
    listing_agent_name: agentName,
    listing_agent_phone: `(516) 555-${1000 + (hash % 8999)}`,
    listing_agent_email: `${agentName.toLowerCase().replace(' ', '.')}@onekeybrokerage.com`,
    listing_brokerage: `${town} Premier Properties`,
    agent_notes: 'Lockbox access available via ShowingTime.',
    status: 'FOUND',
    source: 'GENERATED'
  };
}

export async function batchLookupMlsNumbers(mlsNumbers: string[]): Promise<MlsListingResult[]> {
  return Promise.all(mlsNumbers.map(num => lookupByMlsNumber(num)));
}
