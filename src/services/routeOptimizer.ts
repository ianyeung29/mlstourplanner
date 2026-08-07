import { Tour, TourStop, RouteOptimizationResult, AvailabilityWindow } from '@/types/tour';
import { calculateHaversineDistanceMeters } from './geocode';

export function timeToMinutes(timeStr?: string): number {
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

export function minutesToFormattedTime(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = Math.round(totalMinutes % 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minsStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minsStr} ${ampm}`;
}

function getDayNameFromDateStr(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export function isOpenHouseOnTourDate(stop: TourStop, tourDate?: string): boolean {
  if (!stop.has_open_house) return false;
  if (!stop.open_house_date) return true;
  if (!tourDate) return true;

  const ohDateClean = stop.open_house_date.trim().toLowerCase();
  const tourDateClean = tourDate.trim().toLowerCase();

  if (ohDateClean === tourDateClean || tourDateClean.includes(ohDateClean)) return true;

  const tourDayName = getDayNameFromDateStr(tourDate).toLowerCase();

  if (tourDayName && (ohDateClean.includes(tourDayName) || ohDateClean.includes(tourDayName.substring(0, 3)))) {
    return true;
  }

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const ohDayName = daysOfWeek.find(d => ohDateClean.includes(d) || (d.length >= 3 && ohDateClean.includes(d.substring(0, 3))));

  if (ohDayName && tourDayName && ohDayName !== tourDayName) {
    return false;
  }

  return true;
}

function getPermutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
    const remainingPerms = getPermutations(remaining);
    for (const perm of remainingPerms) {
      result.push([current, ...perm]);
    }
  }
  return result;
}

/**
 * Low-level schedule calculation for a tour.
 */
function runScheduleCalculation(tour: Tour): Tour {
  const dayStartMins = timeToMinutes(tour.earliest_start || '10:30');
  const dayFinishMins = timeToMinutes(tour.latest_finish || '15:00');

  let currentDepartureMins = dayStartMins;

  // Track physical location coordinates of start address or previous property
  let lastLat = tour.start_latitude || 40.7865;
  let lastLng = tour.start_longitude || -73.7285;

  const scheduledStops: TourStop[] = tour.stops.map((stop, index) => {
    let driveMins = 0;
    let distMeters = 0;
    let stopLat = stop.latitude;
    let stopLng = stop.longitude;

    if (stop.is_break) {
      // Break stops inherit previous property location (location pause)
      if (index > 0) {
        const prevPhysical = tour.stops.slice(0, index).reverse().find(s => !s.is_break) || tour.stops[index - 1];
        stopLat = prevPhysical.latitude;
        stopLng = prevPhysical.longitude;
      } else {
        stopLat = lastLat;
        stopLng = lastLng;
      }
      driveMins = 0;
      distMeters = 0;
    } else {
      if (index > 0) {
        distMeters = calculateHaversineDistanceMeters(
          lastLat,
          lastLng,
          stopLat,
          stopLng
        );
        driveMins = Math.max(3, Math.ceil(distMeters / 670));
      }
      // Update last physical property location for subsequent drive calculations
      lastLat = stopLat;
      lastLng = stopLng;
    }

    const bufferMins = typeof stop.travel_buffer_minutes === 'number'
      ? stop.travel_buffer_minutes
      : (tour.default_travel_buffer || 5);

    let arrivalMins = index === 0 ? dayStartMins : currentDepartureMins + driveMins;

    const isActiveOpenHouseToday = isOpenHouseOnTourDate(stop, tour.tour_date);
    if (stop.has_open_house && stop.open_house_start && stop.open_house_end && isActiveOpenHouseToday) {
      const ohStartMins = timeToMinutes(stop.open_house_start);
      if (arrivalMins < ohStartMins) {
        arrivalMins = ohStartMins;
      }
    }

    const accessBeforeMins = stop.access_before_minutes || 0;
    const accessAfterMins = stop.access_after_minutes || 0;
    const visitMins = stop.visit_minutes || tour.default_visit_minutes || 25;
    const departureMins = arrivalMins + accessBeforeMins + visitMins + accessAfterMins;

    const appliedBuffer = stop.is_break ? 0 : bufferMins;
    currentDepartureMins = departureMins + appliedBuffer;

    return {
      ...stop,
      latitude: stopLat,
      longitude: stopLng,
      planned_order: index + 1,
      planned_arrival: minutesToFormattedTime(arrivalMins),
      planned_departure: minutesToFormattedTime(departureMins),
      visit_minutes: visitMins,
      travel_buffer_minutes: appliedBuffer,
      drive_minutes_from_prev: (index === 0 || stop.is_break) ? 0 : driveMins,
      drive_miles_from_prev: (index === 0 || stop.is_break) ? 0 : Math.round((distMeters / 1609.34) * 10) / 10
    };
  });

  return { ...tour, stops: scheduledStops };
}

/**
 * Priority Solver: Tests all permutations of stops using the exact schedule calculation engine
 * to pick the sequence that maximizes MUST_SEE property completion before latest_finish (3:00 PM).
 */
export function ensureMustSeePrioritySchedule(tour: Tour): Tour {
  if (!tour.stops || tour.stops.length <= 2) return tour;

  const stops = [...tour.stops];
  const dayFinishMins = timeToMinutes(tour.latest_finish || '15:00');

  const perms = getPermutations(stops);
  let bestSeq = stops;
  let maxScore = -Infinity;

  for (const cand of perms) {
    const candTour = { ...tour, stops: cand };
    const updatedTour = runScheduleCalculation(candTour);

    let mustSeeVisitedCount = 0;
    let stopsCoveredInWindow = 0;
    let totalDistMeters = 0;

    updatedTour.stops.forEach((s, idx) => {
      if (idx > 0) {
        const prev = updatedTour.stops[idx - 1];
        totalDistMeters += calculateHaversineDistanceMeters(prev.latitude, prev.longitude, s.latitude, s.longitude);
      }
      if (s.planned_departure) {
        const depMins = timeToMinutes(s.planned_departure);
        if (depMins <= dayFinishMins) {
          stopsCoveredInWindow++;
          if (s.priority === 'MUST_SEE') {
            mustSeeVisitedCount++;
          }
        }
      }
    });

    const score = (mustSeeVisitedCount * 10000000) + (stopsCoveredInWindow * 100000) - (totalDistMeters / 100);

    if (score > maxScore) {
      maxScore = score;
      bestSeq = cand;
    }
  }

  const finalStops = [...bestSeq];
  finalStops.forEach((s, i) => { s.planned_order = i + 1; });

  return { ...tour, stops: finalStops };
}

export function reorderStopsForShortestRoute(tour: Tour): { tour: Tour; warnings: string[] } {
  return { tour: ensureMustSeePrioritySchedule(tour), warnings: [] };
}

export async function reorderStopsWithGoogle(tour: Tour): Promise<{ tour: Tour; warnings: string[] }> {
  return { tour: ensureMustSeePrioritySchedule(tour), warnings: [] };
}

export function generateConflictRemedies(tour: Tour, warnings: string[], infeasibleReasons: string[]): Array<{ title: string; actionText: string }> {
  const remedies: Array<{ title: string; actionText: string }> = [];
  if (warnings.length > 0 || infeasibleReasons.length > 0) {
    remedies.push({
      title: 'Adjust Open House or Tour Window',
      actionText: 'Extend tour end time or unlock locked property stops to allow optimal re-routing around Open House hours.'
    });
    remedies.push({
      title: 'Reduce Visit Duration',
      actionText: 'Decrease default stop visit length from 25m to 20m to complete all showings before latest finish.'
    });
  }
  return remedies;
}

export function optimizeTourSchedule(
  tourInput: Tour,
  options?: { preserveOrder?: boolean }
): {
  updatedTour: Tour;
  result: RouteOptimizationResult;
} {
  const tour = options?.preserveOrder
    ? tourInput
    : ensureMustSeePrioritySchedule(tourInput);
  const warnings: string[] = [];
  const infeasibleReasons: string[] = [];

  const dayFinishMins = timeToMinutes(tour.latest_finish || '15:00');
  const scheduledTour = runScheduleCalculation(tour);

  let totalDriveMins = 0;
  let totalDistMeters = 0;
  let totalWaitMins = 0;
  let totalVisitMins = 0;

  scheduledTour.stops.forEach((stop, index) => {
    totalDriveMins += stop.drive_minutes_from_prev || 0;
    totalDistMeters += (stop.drive_miles_from_prev || 0) * 1609.34;
    totalVisitMins += stop.visit_minutes || 25;

    const isActiveOpenHouseToday = isOpenHouseOnTourDate(stop, tour.tour_date);
    if (stop.has_open_house && stop.open_house_start && stop.open_house_end && isActiveOpenHouseToday) {
      const ohEndMins = timeToMinutes(stop.open_house_end);
      const arrMins = timeToMinutes(stop.planned_arrival);
      if (arrMins + stop.visit_minutes > ohEndMins) {
        infeasibleReasons.push(
          `⚠️ Open House Conflict: Stop #${index + 1} (${stop.normalized_address}) arrives at ${stop.planned_arrival} which exceeds Open House end time (${stop.open_house_end}).`
        );
      }
    }

    const depMins = timeToMinutes(stop.planned_departure);
    if (depMins > dayFinishMins) {
      warnings.push(
        `Overrun Warning: Stop #${index + 1} (${stop.normalized_address}) finishes at ${stop.planned_departure}, exceeding latest tour end time (${minutesToFormattedTime(dayFinishMins)}).`
      );
    }
  });

  const resultStops = scheduledTour.stops.map(s => ({
    stopId: s.id,
    planned_order: s.planned_order ?? null,
    planned_arrival: s.planned_arrival || null,
    planned_departure: s.planned_departure || null,
    drive_seconds: (s.drive_minutes_from_prev || 0) * 60,
    drive_distance_meters: (s.drive_miles_from_prev || 0) * 1609.34,
    wait_seconds: 0,
    scheduled: true,
    warnings: [] as string[]
  }));

  const lastStopDepMins = timeToMinutes(scheduledTour.stops[scheduledTour.stops.length - 1]?.planned_departure);
  const overallFeasible = infeasibleReasons.length === 0 && lastStopDepMins <= dayFinishMins;

  const result: RouteOptimizationResult = {
    status: overallFeasible ? 'SUCCESS' : 'INFEASIBLE',
    stops: resultStops,
    totals: {
      driveMinutes: totalDriveMins,
      totalDistanceMiles: Math.round((totalDistMeters / 1609.34) * 10) / 10,
      visitMinutes: totalVisitMins,
      waitMinutes: totalWaitMins
    },
    warnings,
    infeasibleReasons
  };

  return {
    updatedTour: scheduledTour,
    result
  };
}
