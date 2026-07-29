import { Tour, TourStop } from '@/types/tour';

/**
 * Generates an iCalendar (.ics) file string containing all showing appointment stops for a tour.
 */
export function generateIcsCalendarFile(tour: Tour): string {
  const dateStr = tour.tour_date || new Date().toISOString().split('T')[0];
  const cleanDate = dateStr.replace(/-/g, '');

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MLSTourPlanner//Showing Tour Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  tour.stops.forEach((stop, idx) => {
    const startTimeStr = stop.confirmed_start || stop.planned_arrival || '10:00';
    const endTimeStr = stop.planned_departure || '10:30';

    const startIso = formatIcsTime(cleanDate, startTimeStr);
    const endIso = formatIcsTime(cleanDate, endTimeStr);

    const summary = `Showing #${idx + 1}: ${stop.normalized_address}`;
    const description = [
      `MLS #: ${stop.mls_number || 'N/A'}`,
      `Price: $${stop.list_price?.toLocaleString() || 'N/A'}`,
      `Beds/Baths: ${stop.beds || 0} Bed, ${stop.baths || 0} Bath`,
      `Listing Agent: ${stop.listing_agent_name || 'N/A'} (${stop.listing_agent_phone || 'N/A'})`,
      `Showing Notes / Lockbox: ${stop.agent_notes || 'N/A'}`,
      `Tour Client: ${tour.client_display_name || 'N/A'}`
    ].join('\\n');

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:tour_${tour.id}_stop_${stop.id}_${idx}@mlstourplanner.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:${summary}`,
      `LOCATION:${stop.normalized_address}`,
      `DESCRIPTION:${description}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');
  return icsContent.join('\r\n');
}

/**
 * Helper to trigger browser download of the .ics iCalendar file.
 */
export function downloadIcsFile(tour: Tour) {
  const icsData = generateIcsCalendarFile(tour);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `${tour.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_showing_schedule.ics`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generates a 1-click Google Calendar Event link for the entire tour timeframe.
 */
export function generateGoogleCalendarUrl(tour: Tour): string {
  const dateStr = tour.tour_date || new Date().toISOString().split('T')[0];
  const cleanDate = dateStr.replace(/-/g, '');

  const startIso = formatIcsTime(cleanDate, tour.earliest_start || '10:00');
  const endIso = formatIcsTime(cleanDate, tour.latest_finish || '16:00');

  const title = encodeURIComponent(`Real Estate Showing Tour: ${tour.name}`);
  const details = encodeURIComponent(
    `Showing Tour Itinerary with ${tour.stops.length} properties.\n\nStops:\n` +
      tour.stops.map((s, i) => `${i + 1}. ${s.normalized_address} (${s.planned_arrival || 'TBD'})`).join('\n')
  );
  const location = encodeURIComponent(tour.start_address || tour.stops[0]?.normalized_address || '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}

function formatIcsTime(cleanDate: string, timeStr: string): string {
  // Parses "10:30 AM" or "10:30" into "YYYYMMDDTHHMM00"
  let hh = 10;
  let mm = 0;

  if (timeStr) {
    const isPM = /pm/i.test(timeStr);
    const isAM = /am/i.test(timeStr);
    const cleaned = timeStr.replace(/[^0-9:]/g, '');
    const parts = cleaned.split(':');
    if (parts.length >= 2) {
      hh = parseInt(parts[0], 10);
      mm = parseInt(parts[1], 10);
      if (isPM && hh < 12) hh += 12;
      if (isAM && hh === 12) hh = 0;
    }
  }

  const hhStr = hh.toString().padStart(2, '0');
  const mmStr = mm.toString().padStart(2, '0');
  return `${cleanDate}T${hhStr}${mmStr}00`;
}
