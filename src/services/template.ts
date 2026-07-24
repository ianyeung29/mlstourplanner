import { Tour, TourStop, UserProfile } from '@/types/tour';

export interface TemplateVariables {
  agent_name: string;
  agent_phone: string;
  agent_email: string;
  agent_brokerage: string;
  client_name: string;
  listing_agent_name: string;
  listing_address: string;
  mls_number: string;
  proposed_arrival_time: string;
  proposed_departure_time: string;
  visit_duration: string;
  tour_date: string;
  tour_day: string;
}

export function extractTemplateVariables(tour: Tour, stop: TourStop, user: UserProfile): TemplateVariables {
  const dateObj = new Date(tour.tour_date + 'T00:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const tour_day = isNaN(dateObj.getTime()) ? '' : days[dateObj.getDay()];

  return {
    agent_name: user.full_name || 'Agent',
    agent_phone: user.phone || '(516) 555-0100',
    agent_email: user.email || 'agent@brokerage.com',
    agent_brokerage: user.brokerage_name || 'Premier Real Estate',
    client_name: tour.client_display_name || 'Buyer Client',
    listing_agent_name: stop.listing_agent_name || 'Listing Agent',
    listing_address: stop.normalized_address || stop.original_input,
    mls_number: stop.mls_number || 'N/A',
    proposed_arrival_time: stop.proposed_start || stop.planned_arrival || '10:00 AM',
    proposed_departure_time: stop.planned_departure || '10:30 AM',
    visit_duration: `${stop.visit_minutes || tour.default_visit_minutes}`,
    tour_date: tour.tour_date,
    tour_day: tour_day
  };
}

export const DEFAULT_EMAIL_TEMPLATE = `Subject: Showing request for {{listing_address}} on {{tour_day}}, {{tour_date}}

Hi {{listing_agent_name}},

I would like to request a showing of {{listing_address}} (MLS #{{mls_number}}) on {{tour_day}}, {{tour_date}} at approximately {{proposed_arrival_time}} for {{visit_duration}} minutes for my buyer client {{client_name}}.

Please let me know whether that time works or if another nearby time is preferred.

Thank you,
{{agent_name}}
{{agent_brokerage}}
{{agent_phone}}
{{agent_email}}`;

export const DEFAULT_SMS_TEMPLATE = `Hi {{listing_agent_name}}, this is {{agent_name}} with {{agent_brokerage}}. May I show {{listing_address}} on {{tour_day}}, {{tour_date}} at approximately {{proposed_arrival_time}} for {{visit_duration}} minutes? Please let me know if that time works. Thank you!`;

export function renderTemplate(template: string, vars: TemplateVariables): string {
  let result = template;
  (Object.keys(vars) as Array<keyof TemplateVariables>).forEach(key => {
    const val = vars[key] || `[${key}]`;
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, val);
  });
  return result;
}
