import { Tour, TourStop, RouteOptimizationResult, AvailabilityWindow } from '@/types/tour';
import { calculateHaversineDistanceMeters } from './geocode';

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3]?.toUpperCase();

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function minutesToFormattedTime(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = Math.round(totalMinutes % 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minStr} ${ampm}`;
}

export function generateConflictRemedies(
  tour: Tour,
  warnings: string[],
  infeasibleReasons: string[] = []
): Array<{ title: string; actionText: string; stopId?: string }> {
  const remedies: Array<{ title: string; actionText: string; stopId?: string }> = [];

  if (infeasibleReasons.length > 0) {
    remedies.push({
      title: 'Adjust Open House or Tour Window',
      actionText: 'Extend tour end time or unlock locked property stops to allow optimal re-routing around Open House hours.'
    });
  }

  if (warnings.some(w => w.includes('Overrun Warning'))) {
    remedies.push({
      title: 'Reduce Visit Duration',
      actionText: 'Decrease default stop visit length from 25m to 20m to complete all showings before latest finish.'
    });
  }

  return remedies;
}

export function optimizeTourSchedule(tour: Tour): {
  updatedTour: Tour;
  result: RouteOptimizationResult;
} {
  const warnings: string[] = [];
  const infeasibleReasons: string[] = [];

  const dayStartMins = timeToMinutes(tour.earliest_start || '09:00');
  const dayFinishMins = timeToMinutes(tour.latest_finish || '17:00');

  let currentMins = dayStartMins;
  let currentLat = tour.start_latitude;
  let currentLng = tour.start_longitude;

  let totalDriveMins = 0;
  let totalVisitMins = 0;
  let totalWaitMins = 0;
  let totalDistMeters = 0;

  const processedStops: TourStop[] = [];

  // Sort stops: LOCKED / CONFIRMED / OPEN_HOUSE first, then MUST_SEE, PREFERRED, OPTIONAL
  const sortedStops = [...tour.stops].sort((a, b) => {
    const aOpenHouse = a.has_open_house && a.open_house_start;
    const bOpenHouse = b.has_open_house && b.open_house_start;

    const aLocked = a.scheduling_mode === 'TIME_LOCKED' || a.appointment_status === 'CONFIRMED' || aOpenHouse;
    const bLocked = b.scheduling_mode === 'TIME_LOCKED' || b.appointment_status === 'CONFIRMED' || bOpenHouse;

    if (aLocked && !bLocked) return -1;
    if (!aLocked && bLocked) return 1;

    const priorityScore = { MUST_SEE: 3, PREFERRED: 2, OPTIONAL: 1 };
    return priorityScore[b.priority] - priorityScore[a.priority];
  });

  sortedStops.forEach((stop, index) => {
    // 1. Calculate Drive Time from Previous Location
    const distMeters = calculateHaversineDistanceMeters(
      currentLat,
      currentLng,
      stop.latitude,
      stop.longitude
    );
    totalDistMeters += distMeters;

    let driveMins = Math.max(5, Math.ceil(distMeters / 670));
    totalDriveMins += driveMins;

    // 2. Projected Arrival Time
    let arrivalMins = currentMins + driveMins + (stop.travel_buffer_minutes || tour.default_travel_buffer);

    // 3. Open House Auto-Adjustment Logic
    let openHouseWindow: AvailabilityWindow | undefined = undefined;
    if (stop.has_open_house && stop.open_house_start && stop.open_house_end) {
      const ohStartMins = timeToMinutes(stop.open_house_start);
      const ohEndMins = timeToMinutes(stop.open_house_end);
      openHouseWindow = {
        id: `oh_${stop.id}`,
        start_at: stop.open_house_start,
        end_at: stop.open_house_end,
        constraint_type: 'HARD',
        source: 'OPEN_HOUSE'
      };

      if (arrivalMins < ohStartMins) {
        const waitNeeded = ohStartMins - arrivalMins;
        totalWaitMins += waitNeeded;
        warnings.push(
          `🏠 Open House Auto-Adjustment: Added ${waitNeeded}m wait for Stop #${index + 1} (${stop.normalized_address}) to align with Open House starting at ${minutesToFormattedTime(ohStartMins)}.`
        );
        arrivalMins = ohStartMins;
      } else if (arrivalMins + stop.visit_minutes > ohEndMins) {
        infeasibleReasons.push(
          `⚠️ Open House Conflict: Stop #${index + 1} (${stop.normalized_address}) arrives at ${minutesToFormattedTime(arrivalMins)} which exceeds Open House end time (${minutesToFormattedTime(ohEndMins)}).`
        );
      }
    }

    // 4. Hard Availability Windows & Confirmed Appointments
    const hardWindows = stop.availability_windows.filter(w => w.constraint_type === 'HARD');
    hardWindows.forEach(win => {
      const winStartMins = timeToMinutes(win.start_at);
      if (arrivalMins < winStartMins) {
        const wait = winStartMins - arrivalMins;
        totalWaitMins += wait;
        arrivalMins = winStartMins;
      }
    });

    const departureMins = arrivalMins + stop.access_before_minutes + stop.visit_minutes + stop.access_after_minutes;
    totalVisitMins += stop.visit_minutes;

    if (departureMins > dayFinishMins) {
      warnings.push(
        `Overrun Warning: Stop #${index + 1} (${stop.normalized_address}) finishes at ${minutesToFormattedTime(departureMins)}, exceeding latest tour end time (${minutesToFormattedTime(dayFinishMins)}).`
      );
    }

    const updatedStop: TourStop = {
      ...stop,
      planned_order: index + 1,
      planned_arrival: minutesToFormattedTime(arrivalMins),
      planned_departure: minutesToFormattedTime(departureMins),
      availability_windows: openHouseWindow
        ? [...stop.availability_windows.filter(w => w.source !== 'OPEN_HOUSE'), openHouseWindow]
        : stop.availability_windows
    };

    processedStops.push(updatedStop);

    currentMins = departureMins;
    currentLat = stop.latitude;
    currentLng = stop.longitude;
  });

  const updatedTour: Tour = {
    ...tour,
    stops: processedStops,
    updated_at: new Date().toISOString()
  };

  const result: RouteOptimizationResult = {
    status: infeasibleReasons.length > 0 ? 'INFEASIBLE' : 'SUCCESS',
    stops: processedStops.map(s => ({
      stopId: s.id,
      planned_order: s.planned_order || null,
      planned_arrival: s.planned_arrival || null,
      planned_departure: s.planned_departure || null,
      drive_seconds: 600,
      drive_distance_meters: 5000,
      wait_seconds: 0,
      scheduled: true,
      warnings: []
    })),
    totals: {
      driveMinutes: totalDriveMins,
      visitMinutes: totalVisitMins,
      waitMinutes: totalWaitMins,
      totalDistanceMiles: Math.round((totalDistMeters / 1609.34) * 10) / 10
    },
    warnings,
    infeasibleReasons
  };

  return { updatedTour, result };
}
