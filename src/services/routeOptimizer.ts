import { Tour, TourStop, RouteOptimizationResult, AvailabilityWindow } from '@/types/tour';
import { calculateHaversineDistanceMeters } from './geocode';

function timeToMinutes(timeStr?: string): number {
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

function getDayNameFromDateStr(dateStr: string): string {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr + 'T00:00:00');
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
}

export function isOpenHouseOnTourDate(stop: TourStop, tourDate?: string): boolean {
  if (!stop.has_open_house) return false;
  if (!stop.open_house_date || !tourDate) return true;

  const ohDateClean = stop.open_house_date.trim().toLowerCase();
  const tourDateClean = tourDate.trim().toLowerCase();

  if (ohDateClean === tourDateClean || tourDateClean.includes(ohDateClean)) return true;

  const tourDayName = getDayNameFromDateStr(tourDate).toLowerCase();
  const tourDayShort = tourDayName.substring(0, 3);

  if (tourDayName && (ohDateClean.includes(tourDayName) || ohDateClean.includes(tourDayShort))) {
    return true;
  }

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const ohDayName = daysOfWeek.find(d => ohDateClean.includes(d) || (d.length >= 3 && ohDateClean.includes(d.substring(0, 3))));

  if (ohDayName && tourDayName && ohDayName !== tourDayName) {
    return false;
  }

  return true;
}

export function ensureStartWithClientTime(tour: Tour): Tour {
  if (!tour.stops || tour.stops.length <= 1) return tour;

  const dayStartMins = timeToMinutes(tour.earliest_start || '09:30');
  const stops = [...tour.stops];

  const firstStop = stops[0];
  const isActiveOpenHouseToday = isOpenHouseOnTourDate(firstStop, tour.tour_date);

  if (firstStop.has_open_house && firstStop.open_house_start && isActiveOpenHouseToday) {
    const ohStartMins = timeToMinutes(firstStop.open_house_start);
    if (ohStartMins > dayStartMins) {
      const flexIdx = stops.findIndex(s => {
        if (!s.has_open_house) return true;
        if (!isOpenHouseOnTourDate(s, tour.tour_date)) return true;
        const sOhStart = timeToMinutes(s.open_house_start);
        return sOhStart <= dayStartMins;
      });

      if (flexIdx > 0) {
        const temp = stops[0];
        stops[0] = stops[flexIdx];
        stops[flexIdx] = temp;
      }
    }
  }

  stops.forEach((s, idx) => {
    s.planned_order = idx + 1;
  });

  return {
    ...tour,
    stops
  };
}

// Helper to generate all permutations of an array
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

function calculateInterStopDistance(stops: TourStop[]): number {
  if (stops.length <= 1) return 0;
  let totalDist = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    totalDist += calculateHaversineDistanceMeters(
      stops[i].latitude,
      stops[i].longitude,
      stops[i + 1].latitude,
      stops[i + 1].longitude
    );
  }
  return totalDist;
}

/**
 * Re-orders stops using Google Directions API to find the global optimal route across ALL stops.
 * Returns updated tour and rich debug logs.
 */
export async function reorderStopsWithGoogle(tour: Tour): Promise<{ tour: Tour; debug?: any }> {
  if (!tour.stops || tour.stops.length <= 1) return { tour };
  try {
    const res = await fetch('/api/google-route-optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stops: tour.stops })
    });
    const data = await res.json();
    if (data.status === 'SUCCESS' && data.stops && data.stops.length === tour.stops.length) {
      return {
        tour: {
          ...tour,
          stops: data.stops
        },
        debug: data.debug
      };
    }
  } catch (e) {
    // Fallback to local optimization
  }
  return { tour: reorderStopsForShortestRoute(tour) };
}

/**
 * Global optimization across ALL property stops without locking any specific start stop.
 */
export function reorderStopsForShortestRoute(tour: Tour): Tour {
  if (!tour.stops || tour.stops.length <= 1) return tour;

  const stops = [...tour.stops];
  let bestSequence: TourStop[] = [...stops];

  if (stops.length <= 7) {
    const allPermutations = getPermutations(stops);
    let minScore = Infinity;

    for (const candidate of allPermutations) {
      let score = calculateInterStopDistance(candidate);

      let currentMins = timeToMinutes(tour.earliest_start || '09:30');

      candidate.forEach((stop, index) => {
        if (index > 0) {
          const prev = candidate[index - 1];
          const dist = calculateHaversineDistanceMeters(prev.latitude, prev.longitude, stop.latitude, stop.longitude);
          const driveMins = Math.max(2, Math.ceil(dist / 670));
          currentMins += driveMins;
        }

        const finishWindowMins = timeToMinutes(tour.latest_finish || '15:30');
        const visitMins = stop.visit_minutes || 25;
        const stopFinishMins = currentMins + visitMins;

        if (stopFinishMins > finishWindowMins) {
          const overrunMins = stopFinishMins - finishWindowMins;
          if (stop.priority === 'MUST_SEE') {
            score += 10000000 + (overrunMins * 10000);
          } else if (stop.priority === 'PREFERRED' || !stop.priority) {
            score += 500000 + (overrunMins * 1000);
          } else {
            score += 10000 + (overrunMins * 100);
          }
        }

        if (stop.has_open_house && stop.open_house_start && stop.open_house_end) {
          const ohStart = timeToMinutes(stop.open_house_start);
          const ohEnd = timeToMinutes(stop.open_house_end);
          if (currentMins < ohStart) {
            score += (ohStart - currentMins) * 30;
          } else if (currentMins > ohEnd) {
            score += 50000;
          }
        }

        currentMins += visitMins + (stop.travel_buffer_minutes || 5);
      });

      if (score < minScore) {
        minScore = score;
        bestSequence = candidate;
      }
    }
  } else {
    let improved = true;
    let iterations = 0;
    while (improved && iterations < 50) {
      improved = false;
      iterations++;
      for (let i = 0; i < bestSequence.length - 1; i++) {
        for (let j = i + 1; j < bestSequence.length; j++) {
          const newCandidate = [...bestSequence];
          const sub = newCandidate.slice(i, j + 1).reverse();
          newCandidate.splice(i, j + 1 - i, ...sub);

          const currentDist = calculateInterStopDistance(bestSequence);
          const newDist = calculateInterStopDistance(newCandidate);

          if (newDist < currentDist) {
            bestSequence = newCandidate;
            improved = true;
          }
        }
      }
    }
  }

  bestSequence.forEach((s, idx) => {
    s.planned_order = idx + 1;
    if (idx > 0) {
      const prev = bestSequence[idx - 1];
      const distMeters = calculateHaversineDistanceMeters(prev.latitude, prev.longitude, s.latitude, s.longitude);
      s.drive_miles_from_prev = Math.round((distMeters / 1609.34) * 10) / 10;
      s.drive_minutes_from_prev = Math.max(3, Math.ceil(distMeters / 670));
    }
  });

  return {
    ...tour,
    stops: bestSequence
  };
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

export function optimizeTourSchedule(tourInput: Tour): {
  updatedTour: Tour;
  result: RouteOptimizationResult;
} {
  const tour = ensureStartWithClientTime(tourInput);
  const warnings: string[] = [];
  const infeasibleReasons: string[] = [];

  const dayStartMins = timeToMinutes(tour.earliest_start || '09:30');
  const dayFinishMins = timeToMinutes(tour.latest_finish || '17:00');

  let currentDepartureMins = dayStartMins;
  let totalDriveMins = 0;
  let totalVisitMins = 0;
  let totalWaitMins = 0;
  let totalDistMeters = 0;

  const processedStops: TourStop[] = [];

  tour.stops.forEach((stop, index) => {
    let driveMins = 0;
    let distMeters = 0;

    if (index > 0) {
      if (typeof stop.drive_minutes_from_prev === 'number' && stop.drive_minutes_from_prev > 0) {
        driveMins = stop.drive_minutes_from_prev;
        const distMiles = stop.drive_miles_from_prev || 0;
        distMeters = distMiles * 1609.34;
      } else {
        const prevStop = tour.stops[index - 1];
        distMeters = calculateHaversineDistanceMeters(
          prevStop.latitude,
          prevStop.longitude,
          stop.latitude,
          stop.longitude
        );
        driveMins = Math.max(3, Math.ceil(distMeters / 670));
      }
      totalDistMeters += distMeters;
      totalDriveMins += driveMins;
    }

    const bufferMins = typeof stop.travel_buffer_minutes === 'number'
      ? stop.travel_buffer_minutes
      : (tour.default_travel_buffer || 5);

    let arrivalMins = index === 0
      ? dayStartMins
      : currentDepartureMins + driveMins;

    let openHouseWindow: AvailabilityWindow | undefined = undefined;
    const isActiveOpenHouseToday = isOpenHouseOnTourDate(stop, tour.tour_date);

    if (stop.has_open_house && stop.open_house_start && stop.open_house_end) {
      if (isActiveOpenHouseToday) {
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
            `🏠 Open House Auto-Adjustment: Scheduled Stop #${index + 1} (${stop.normalized_address}) at ${minutesToFormattedTime(ohStartMins)} to align with Open House hours.`
          );
          arrivalMins = ohStartMins;
        } else if (arrivalMins + stop.visit_minutes > ohEndMins) {
          infeasibleReasons.push(
            `⚠️ Open House Conflict: Stop #${index + 1} (${stop.normalized_address}) arrives at ${minutesToFormattedTime(arrivalMins)} which exceeds Open House end time (${minutesToFormattedTime(ohEndMins)}).`
          );
        }
      } else {
        warnings.push(
          `📅 Open House Date Notice: Stop #${index + 1} (${stop.normalized_address}) has an Open House on ${stop.open_house_date || 'a different day'}, but your showing tour is scheduled for ${tour.tour_date}. Standard appointment request required.`
        );
      }
    }

    if (stop.scheduling_mode === 'TIME_LOCKED' || stop.appointment_status === 'CONFIRMED') {
      const lockedTimeStr = stop.confirmed_start || stop.proposed_start || stop.planned_arrival;
      if (lockedTimeStr) {
        const lockedMins = timeToMinutes(lockedTimeStr);
        if (lockedMins > 0 && arrivalMins < lockedMins) {
          const waitNeeded = lockedMins - arrivalMins;
          totalWaitMins += waitNeeded;
          arrivalMins = lockedMins;
        }
      }
    }

    const visitMins = stop.visit_minutes || tour.default_visit_minutes || 25;
    const accessBeforeMins = stop.access_before_minutes || 0;
    const accessAfterMins = stop.access_after_minutes || 0;

    const departureMins = arrivalMins + accessBeforeMins + visitMins + accessAfterMins;
    totalVisitMins += visitMins;

    if (departureMins > dayFinishMins) {
      warnings.push(
        `Overrun Warning: Stop #${index + 1} (${stop.normalized_address}) finishes at ${minutesToFormattedTime(departureMins)}, exceeding latest tour end time (${minutesToFormattedTime(dayFinishMins)}).`
      );
    }

    const calculatedMiles = Math.round((distMeters / 1609.34) * 10) / 10;
    const finalDriveMins = index > 0 ? (typeof stop.drive_minutes_from_prev === 'number' && stop.drive_minutes_from_prev > 0 ? stop.drive_minutes_from_prev : driveMins) : 0;
    const finalDriveMiles = index > 0 ? (typeof stop.drive_miles_from_prev === 'number' && stop.drive_miles_from_prev > 0 ? stop.drive_miles_from_prev : calculatedMiles) : 0;

    const updatedStop: TourStop = {
      ...stop,
      planned_order: index + 1,
      planned_arrival: minutesToFormattedTime(arrivalMins),
      planned_departure: minutesToFormattedTime(departureMins),
      drive_minutes_from_prev: finalDriveMins,
      drive_miles_from_prev: finalDriveMiles,
      availability_windows: openHouseWindow
        ? [...stop.availability_windows.filter(w => w.source !== 'OPEN_HOUSE'), openHouseWindow]
        : stop.availability_windows
    };

    processedStops.push(updatedStop);
    currentDepartureMins = departureMins + bufferMins;
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
      drive_seconds: (s.drive_minutes_from_prev || 0) * 60,
      drive_distance_meters: (s.drive_miles_from_prev || 0) * 1609.34,
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
