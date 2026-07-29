export type TourStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'REQUESTING'
  | 'PARTIALLY_CONFIRMED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type AppointmentStatus =
  | 'NOT_REQUESTED'
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'DECLINED'
  | 'ALTERNATE_PROPOSED'
  | 'CANCELLED';

export type StopPriority = 'MUST_SEE' | 'PREFERRED' | 'OPTIONAL';

export type SchedulingMode =
  | 'FLEXIBLE'
  | 'TIME_LOCKED' | 'ORDER_LOCKED' | 'TIME_AND_ORDER_LOCKED';

export interface AvailabilityWindow {
  id: string;
  start_at: string;
  end_at: string;
  constraint_type: 'HARD' | 'SOFT';
  must_finish_by_end?: boolean;
  source: 'USER_ENTERED' | 'CONFIRMED_APPOINTMENT' | 'OPEN_HOUSE';
}

export interface TourStop {
  id: string;
  tour_id: string;
  original_input: string;
  normalized_address: string;
  place_id?: string;
  latitude: number;
  longitude: number;
  geocode_status: 'RESOLVED' | 'AMBIGUOUS' | 'FAILED';
  
  mls_number?: string;
  list_price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  image_url?: string;

  has_open_house?: boolean;
  open_house_date?: string;
  open_house_start?: string;
  open_house_end?: string;

  listing_agent_name?: string;
  listing_agent_phone?: string;
  listing_agent_email?: string;
  listing_brokerage?: string;

  priority: StopPriority;
  appointment_status: AppointmentStatus;
  scheduling_mode: SchedulingMode;

  visit_minutes: number;
  access_before_minutes: number;
  access_after_minutes: number;
  travel_buffer_minutes: number;

  proposed_start?: string;
  confirmed_start?: string;
  planned_arrival?: string;
  planned_departure?: string;
  planned_order?: number;

  drive_minutes_from_prev?: number;
  drive_miles_from_prev?: number;

  agent_notes?: string;
  client_notes?: string;

  buyer_rating?: 'FAVORITE' | 'MAYBE' | 'PASS';
  buyer_comments?: string;
  buyer_feedback_updated_at?: string;

  is_break?: boolean;
  break_title?: string;

  availability_windows: AvailabilityWindow[];
}

export interface Tour {
  id: string;
  name: string;
  client_display_name?: string;
  client_email?: string;
  client_id?: string;
  status: TourStatus;
  tour_date: string;
  timezone: string;
  earliest_start: string;
  latest_finish: string;

  start_input: string;
  start_address: string;
  start_latitude: number;
  start_longitude: number;

  end_input?: string;
  end_address?: string;
  end_latitude?: number;
  end_longitude?: number;

  default_visit_minutes: number;
  default_access_minutes: number;
  default_travel_buffer: number;

  notes?: string;
  stops: TourStop[];

  // Creator Agent Details (Tied to Tour for Client View)
  agent_name?: string;
  agent_email?: string;
  agent_phone?: string;
  agent_brokerage?: string;
  
  created_at: string;
  updated_at: string;
}

export interface RouteOptimizationResult {
  status: 'SUCCESS' | 'INFEASIBLE' | 'FAILED';
  stops: Array<{
    stopId: string;
    planned_order: number | null;
    planned_arrival: string | null;
    planned_departure: string | null;
    drive_seconds: number | null;
    drive_distance_meters: number | null;
    wait_seconds: number;
    scheduled: boolean;
    reasonCode?: string;
    warnings: string[];
  }>;
  totals: {
    driveMinutes: number;
    visitMinutes: number;
    waitMinutes: number;
    totalDistanceMiles: number;
  };
  warnings: string[];
  infeasibleReasons?: string[];
}

export interface UserProfile {
  id: string;
  full_name: string;
  phone?: string;
  email: string;
  brokerage_name?: string;
  license_number?: string;
  default_start_address?: string;
  default_visit_minutes: number;
  default_access_minutes: number;
  default_travel_buffer: number;
  timezone: string;
  subscription_tier: 'FREE_TRIAL' | 'PAID_PRO';
  is_verified?: boolean;
  tours_created_count: number;
  theme_mode?: 'light' | 'dark';
}

export interface ClientContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  preferred_contact_method?: 'EMAIL' | 'SMS' | 'PHONE' | 'WHATSAPP';
  preferred_contact_time?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME';
  created_at: string;
}
