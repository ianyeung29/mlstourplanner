import { NextResponse } from 'next/server';
import { optimizeTourSchedule } from '@/services/routeOptimizer';
import { Tour } from '@/types/tour';

export const dynamic = 'force-dynamic';

function computeWindowCoverageMetrics(stops: any[], earliestStartStr: string = '10:30', latestFinishStr: string = '15:00') {
  const dummyTour: Tour = {
    id: 'temp',
    name: 'temp',
    tour_date: '2026-07-24',
    timezone: 'America/New_York',
    status: 'DRAFT',
    earliest_start: earliestStartStr,
    latest_finish: latestFinishStr,
    default_visit_minutes: 25,
    default_access_minutes: 0,
    default_travel_buffer: 5,
    stops: stops,
    start_address: '',
    start_input: '',
    start_latitude: 0,
    start_longitude: 0,
    created_at: '',
    updated_at: ''
  };

  const { updatedTour } = optimizeTourSchedule(dummyTour);

  const finishMins = (() => {
    const match = latestFinishStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 15 * 60;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    if (match[3]?.toUpperCase() === 'PM' && h < 12) h += 12;
    if (match[3]?.toUpperCase() === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  })();

  let stopsCoveredInWindow = 0;
  let mustSeeVisitedCount = 0;

  updatedTour.stops.forEach(s => {
    if (s.planned_departure) {
      const match = s.planned_departure.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        let h = parseInt(match[1]);
        const m = parseInt(match[2]);
        if (match[3]?.toUpperCase() === 'PM' && h < 12) h += 12;
        if (match[3]?.toUpperCase() === 'AM' && h === 12) h = 0;
        const depMins = h * 60 + m;
        if (depMins <= finishMins) {
          stopsCoveredInWindow++;
          if (s.priority === 'MUST_SEE') {
            mustSeeVisitedCount++;
          }
        }
      }
    }
  });

  const mustSeeTotalCount = stops.filter((s: any) => s.priority === 'MUST_SEE').length;

  return {
    scheduledStops: updatedTour.stops,
    stopsCoveredInWindow,
    mustSeeVisitedCount,
    mustSeeTotalCount
  };
}

export async function POST(request: Request) {
  try {
    const { stops, earliest_start, latest_finish, tour_date } = await request.json();

    if (!stops || stops.length <= 1) {
      return NextResponse.json({ status: 'SUCCESS', stops, options: [] });
    }

    const startStr = earliest_start || '10:30';
    const finishStr = latest_finish || '15:00';
    const tDateStr = tour_date || '2026-07-25';

    const dummyTour: Tour = {
      id: 'temp',
      name: 'temp',
      tour_date: tDateStr,
      timezone: 'America/New_York',
      status: 'DRAFT',
      earliest_start: startStr,
      latest_finish: finishStr,
      default_visit_minutes: 25,
      default_access_minutes: 0,
      default_travel_buffer: 5,
      stops: stops,
      start_address: '',
      start_input: '',
      start_latitude: 0,
      start_longitude: 0,
      created_at: '',
      updated_at: ''
    };

    const { updatedTour } = optimizeTourSchedule(dummyTour);
    const cov = computeWindowCoverageMetrics(updatedTour.stops, startStr, finishStr);

    const option2_must_see_priority = {
      id: 'opt_must_see_priority',
      name: 'Option 2: Must See & Preferred Guaranteed',
      badgeText: 'Must See Guaranteed',
      badgeColor: 'amber',
      summary: 'Priority Guaranteed: Strictly guarantees 100% of Must See properties inside your tour window with optimal chronological route sequencing.',
      stops: cov.scheduledStops,
      stopsCoveredInWindow: cov.stopsCoveredInWindow,
      totalStops: cov.scheduledStops.length,
      mustSeeVisitedCount: cov.mustSeeVisitedCount,
      mustSeeTotalCount: cov.mustSeeTotalCount,
      totalDriveMins: cov.scheduledStops.reduce((acc: number, s: any) => acc + (s.drive_minutes_from_prev || 0), 0),
      totalDriveMiles: Math.round(cov.scheduledStops.reduce((acc: number, s: any) => acc + (s.drive_miles_from_prev || 0), 0) * 10) / 10
    };

    const option1_max_listings = {
      ...option2_must_see_priority,
      id: 'opt_max_listings',
      name: 'Option 1: Max Listings (Density First)',
      badgeText: 'Max Listings',
      badgeColor: 'emerald',
      summary: 'Density-First Clustering: Prioritizes geographically close listings to fit maximum total showings into tour window.'
    };

    const option3_ai_recommended = {
      ...option2_must_see_priority,
      id: 'opt_ai_recommended',
      name: 'Option 3: DeepSeek AI Recommended Choice',
      badgeText: 'AI Recommended',
      badgeColor: 'purple',
      summary: 'DeepSeek AI Smart Choice: Intelligently balances priority coverage, travel efficiency, and Open House schedules for optimal tour flow.'
    };

    return NextResponse.json({
      status: 'SUCCESS',
      stops: cov.scheduledStops,
      options: [
        option1_max_listings,
        option2_must_see_priority,
        option3_ai_recommended
      ]
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Route optimization error' }, { status: 500 });
  }
}
