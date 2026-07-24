import { Tour, UserProfile, ClientContact } from '@/types/tour';
import { optimizeTourSchedule } from './routeOptimizer';

const STORAGE_KEY_TOURS = 'mls_tour_planner_tours_v1';
const STORAGE_KEY_PROFILE = 'mls_tour_planner_profile_v1';
const STORAGE_KEY_CONTACTS = 'mls_tour_planner_contacts_v1';

export const FREE_TRIAL_MAX_TOURS = 3;

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'user_default_01',
  full_name: 'Ian Yeung',
  phone: '(516) 555-8820',
  email: 'ianyeung30@gmail.com',
  brokerage_name: 'Side Realty & Luxury Properties',
  license_number: 'NY-1049281',
  default_start_address: '100 Northern Blvd, Great Neck, NY 11021',
  default_visit_minutes: 25,
  default_access_minutes: 5,
  default_travel_buffer: 5,
  timezone: 'America/New_York',
  subscription_tier: 'PAID_PRO',
  is_verified: true,
  tours_created_count: 1
};

export const GUEST_USER_PROFILE: UserProfile = {
  id: '',
  full_name: '',
  phone: '',
  email: '',
  brokerage_name: '',
  license_number: '',
  default_start_address: '',
  default_visit_minutes: 25,
  default_access_minutes: 5,
  default_travel_buffer: 5,
  timezone: 'America/New_York',
  subscription_tier: 'FREE_TRIAL',
  is_verified: false,
  tours_created_count: 0
};

export const INITIAL_CONTACTS: ClientContact[] = [
  {
    id: 'contact_01',
    name: 'The Smith Family',
    email: 'ianyeung30@gmail.com',
    phone: '(516) 555-0199',
    notes: 'Looking for 4+ bed homes in North Shore Long Island',
    preferred_contact_method: 'EMAIL',
    preferred_contact_time: 'MORNING',
    created_at: new Date().toISOString()
  },
  {
    id: 'contact_02',
    name: 'The Harrison Family',
    email: 'harrison.client@example.com',
    phone: '(516) 555-0244',
    notes: 'Requires 2-car garage and updated kitchen',
    preferred_contact_method: 'SMS',
    preferred_contact_time: 'AFTERNOON',
    created_at: new Date().toISOString()
  }
];

export const INITIAL_SEED_TOURS: Tour[] = [
  {
    id: 'tour_seed_01',
    name: 'North Shore Luxury Showcase',
    client_display_name: 'The Smith Family',
    client_email: 'ianyeung30@gmail.com',
    client_id: 'contact_01',
    status: 'REQUESTING',
    tour_date: '2026-07-25',
    timezone: 'America/New_York',
    earliest_start: '09:30',
    latest_finish: '15:30',
    start_input: '100 Northern Blvd, Great Neck, NY 11021',
    start_address: '100 Northern Blvd, Great Neck, NY 11021',
    start_latitude: 40.7865,
    start_longitude: -73.7285,
    default_visit_minutes: 25,
    default_access_minutes: 5,
    default_travel_buffer: 5,
    notes: 'Clients prefer quiet residential streets and garage parking. Looking for 4+ beds.',
    
    // Tied permanently to Creator Agent
    agent_name: 'Ian Yeung',
    agent_email: 'ianyeung30@gmail.com',
    agent_phone: '(516) 555-8820',
    agent_brokerage: 'Side Realty & Luxury Properties',

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stops: [
      {
        id: 'stop_101',
        tour_id: 'tour_seed_01',
        original_input: '123 Main St, Great Neck, NY',
        normalized_address: '123 Main St, Great Neck, NY 11021',
        latitude: 40.7865,
        longitude: -73.7285,
        geocode_status: 'RESOLVED',
        mls_number: 'ONEKEY-3489102',
        list_price: 1450000,
        beds: 4,
        baths: 3.5,
        sqft: 3200,
        image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        has_open_house: true,
        open_house_start: '10:00',
        open_house_end: '12:00',
        listing_agent_name: 'Sarah Jenkins',
        listing_agent_phone: '(516) 555-0192',
        listing_agent_email: 'sjenkins@compass.com',
        listing_brokerage: 'Compass Long Island',
        priority: 'MUST_SEE',
        appointment_status: 'CONFIRMED',
        scheduling_mode: 'TIME_LOCKED',
        confirmed_start: '10:00 AM',
        proposed_start: '10:00 AM',
        planned_arrival: '10:00 AM',
        planned_departure: '10:30 AM',
        visit_minutes: 25,
        access_before_minutes: 5,
        access_after_minutes: 0,
        travel_buffer_minutes: 5,
        agent_notes: 'Lockbox on side porch rail.',
        availability_windows: []
      },
      {
        id: 'stop_102',
        tour_id: 'tour_seed_01',
        original_input: '45 Harbor Rd, Manhasset, NY',
        normalized_address: '45 Harbor Rd, Manhasset, NY 11030',
        latitude: 40.7971,
        longitude: -73.7001,
        geocode_status: 'RESOLVED',
        mls_number: 'ONEKEY-3501298',
        list_price: 2250000,
        beds: 5,
        baths: 4.5,
        sqft: 4100,
        image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        has_open_house: true,
        open_house_start: '11:00',
        open_house_end: '13:00',
        listing_agent_name: 'Michael Ross',
        listing_agent_phone: '(516) 555-0143',
        listing_agent_email: 'mross@elliman.com',
        listing_brokerage: 'Douglas Elliman Real Estate',
        priority: 'MUST_SEE',
        appointment_status: 'REQUESTED',
        scheduling_mode: 'FLEXIBLE',
        proposed_start: '11:00 AM',
        visit_minutes: 30,
        access_before_minutes: 5,
        access_after_minutes: 0,
        travel_buffer_minutes: 5,
        agent_notes: 'Agent must be present for showings.',
        availability_windows: []
      },
      {
        id: 'stop_103',
        tour_id: 'tour_seed_01',
        original_input: '12 Northern Blvd, Roslyn, NY',
        normalized_address: '12 Northern Blvd, Roslyn, NY 11576',
        latitude: 40.8012,
        longitude: -73.6521,
        geocode_status: 'RESOLVED',
        mls_number: 'ONEKEY-3512004',
        list_price: 1890000,
        beds: 4,
        baths: 4,
        sqft: 3600,
        image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        priority: 'PREFERRED',
        appointment_status: 'NOT_REQUESTED',
        scheduling_mode: 'FLEXIBLE',
        visit_minutes: 25,
        access_before_minutes: 5,
        access_after_minutes: 0,
        travel_buffer_minutes: 5,
        availability_windows: []
      }
    ]
  }
];

// --- TOUR MANAGEMENT ---
export function getToursFromStorage(): Tour[] {
  if (typeof window === 'undefined') return INITIAL_SEED_TOURS;
  const raw = localStorage.getItem(STORAGE_KEY_TOURS);
  if (!raw) {
    const initialized = INITIAL_SEED_TOURS.map(t => optimizeTourSchedule(t).updatedTour);
    localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(initialized));
    return initialized;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_SEED_TOURS;
  }
}

export function saveToursToStorage(tours: Tour[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_TOURS, JSON.stringify(tours));
}

export function getTourById(id: string): Tour | undefined {
  const tours = getToursFromStorage();
  return tours.find(t => t.id === id);
}

export function saveTour(tour: Tour): Tour {
  const profile = getUserProfile();

  // Attach Creator Agent metadata if not already attached
  const tourWithAgent: Tour = {
    ...tour,
    agent_name: tour.agent_name || profile.full_name || 'Ian Yeung',
    agent_email: tour.agent_email || profile.email || 'ianyeung30@gmail.com',
    agent_phone: tour.agent_phone || profile.phone || '(516) 555-8820',
    agent_brokerage: tour.agent_brokerage || profile.brokerage_name || 'Side Luxury Real Estate'
  };

  const { updatedTour } = optimizeTourSchedule(tourWithAgent);
  const tours = getToursFromStorage();
  const index = tours.findIndex(t => t.id === updatedTour.id);

  if (index >= 0) {
    tours[index] = updatedTour;
  } else {
    tours.unshift(updatedTour);
    profile.tours_created_count = (profile.tours_created_count || 0) + 1;
    saveUserProfile(profile);
  }
  saveToursToStorage(tours);
  return updatedTour;
}

export function duplicateTour(id: string): Tour | undefined {
  const tour = getTourById(id);
  if (!tour) return undefined;

  const duplicated: Tour = {
    ...tour,
    id: `tour_${Date.now()}`,
    name: `${tour.name} (Copy)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return saveTour(duplicated);
}

export function deleteTour(id: string): void {
  const tours = getToursFromStorage().filter(t => t.id !== id);
  saveToursToStorage(tours);
}

// --- USER PROFILE & SUBSCRIPTION ---
export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') return INITIAL_USER_PROFILE;
  const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(INITIAL_USER_PROFILE));
    return INITIAL_USER_PROFILE;
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_USER_PROFILE,
      ...parsed
    };
  } catch (e) {
    return INITIAL_USER_PROFILE;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent('profile_updated', { detail: profile }));
}

export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(GUEST_USER_PROFILE));
  window.dispatchEvent(new CustomEvent('profile_updated', { detail: GUEST_USER_PROFILE }));
}

export function upgradeToPro(): UserProfile {
  const profile = getUserProfile();
  const updated: UserProfile = {
    ...profile,
    subscription_tier: 'PAID_PRO'
  };
  saveUserProfile(updated);
  return updated;
}

export function canCreateNewTour(): boolean {
  const profile = getUserProfile();
  if (profile.subscription_tier === 'PAID_PRO') return true;
  const tours = getToursFromStorage();
  return tours.length < FREE_TRIAL_MAX_TOURS;
}

// --- CLIENT CONTACTS MANAGEMENT ---
export function getContactsFromStorage(): ClientContact[] {
  if (typeof window === 'undefined') return INITIAL_CONTACTS;
  const raw = localStorage.getItem(STORAGE_KEY_CONTACTS);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(INITIAL_CONTACTS));
    return INITIAL_CONTACTS;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_CONTACTS;
  }
}

export function saveContactsToStorage(contacts: ClientContact[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
}

export function saveContact(contact: ClientContact): ClientContact {
  const contacts = getContactsFromStorage();
  const index = contacts.findIndex(c => c.id === contact.id);
  if (index >= 0) {
    contacts[index] = contact;
  } else {
    contacts.unshift(contact);
  }
  saveContactsToStorage(contacts);
  return contact;
}

export function deleteContact(id: string): void {
  const contacts = getContactsFromStorage().filter(c => c.id !== id);
  saveContactsToStorage(contacts);
}

export function importContactsFromText(text: string): ClientContact[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const imported: ClientContact[] = [];

  lines.forEach((line, idx) => {
    let name = line;
    let email = '';
    let phone = '';

    if (line.includes('<') && line.includes('>')) {
      name = line.substring(0, line.indexOf('<')).trim();
      email = line.substring(line.indexOf('<') + 1, line.indexOf('>')).trim();
    } else if (line.includes(',')) {
      const parts = line.split(',').map(p => p.trim());
      name = parts[0];
      email = parts[1] || '';
      phone = parts[2] || '';
    }

    if (name) {
      imported.push({
        id: `contact_imp_${Date.now()}_${idx}`,
        name,
        email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: phone || '(516) 555-0100',
        created_at: new Date().toISOString()
      });
    }
  });

  const existing = getContactsFromStorage();
  const combined = [...imported, ...existing];
  saveContactsToStorage(combined);
  return combined;
}
