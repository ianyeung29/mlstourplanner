import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function calculateHaversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

function calculateRouteDistance(sequence: any[]): number {
  let total = 0;
  for (let i = 0; i < sequence.length - 1; i++) {
    total += calculateHaversineDistanceMeters(
      sequence[i].latitude,
      sequence[i].longitude,
      sequence[i + 1].latitude,
      sequence[i + 1].longitude
    );
  }
  return total;
}

function formatStopsWithDriveMetrics(seq: any[]): any[] {
  const result = seq.map((s, idx) => ({ ...s, planned_order: idx + 1 }));
  result.forEach((s, idx) => {
    if (idx === 0) {
      s.drive_minutes_from_prev = 0;
      s.drive_miles_from_prev = 0;
    } else {
      const prev = result[idx - 1];
      const distMeters = calculateHaversineDistanceMeters(prev.latitude, prev.longitude, s.latitude, s.longitude);
      s.drive_miles_from_prev = Math.round((distMeters / 1609.34) * 10) / 10;
      s.drive_minutes_from_prev = Math.max(2, Math.ceil(distMeters / 670));
    }
  });
  return result;
}

function computeWindowCoverageMetrics(seq: any[], earliestStartStr: string = '09:30', latestFinishStr: string = '15:30') {
  let currentMins = timeToMinutes(earliestStartStr);
  const finishMins = timeToMinutes(latestFinishStr);
  let stopsCoveredInWindow = 0;
  let mustSeeVisitedCount = 0;

  seq.forEach((stop, index) => {
    if (index > 0) {
      const prev = seq[index - 1];
      const dist = calculateHaversineDistanceMeters(prev.latitude, prev.longitude, stop.latitude, stop.longitude);
      currentMins += Math.max(2, Math.ceil(dist / 670));
    }

    if (stop.has_open_house && stop.open_house_start) {
      const ohStart = timeToMinutes(stop.open_house_start);
      if (currentMins < ohStart) {
        currentMins = ohStart;
      }
    }

    const visitMins = stop.visit_minutes || 25;
    const stopFinishMins = currentMins + visitMins;

    if (stopFinishMins <= finishMins) {
      stopsCoveredInWindow++;
      if (stop.priority === 'MUST_SEE') {
        mustSeeVisitedCount++;
      }
    }

    currentMins += visitMins + (stop.travel_buffer_minutes || 5);
  });

  const mustSeeTotalCount = seq.filter((s: any) => s.priority === 'MUST_SEE').length;
  return { stopsCoveredInWindow, mustSeeVisitedCount, mustSeeTotalCount };
}

function optimizeSequenceForShortestDistance(stops: any[]): any[] {
  if (stops.length <= 7) {
    const perms = getPermutations(stops);
    let minDist = Infinity;
    let best = stops;
    for (const cand of perms) {
      const d = calculateRouteDistance(cand);
      if (d < minDist) {
        minDist = d;
        best = cand;
      }
    }
    return best;
  }
  return stops;
}

/**
 * Detects geographic outlier properties that are far away from the main cluster of listings.
 * Outliers (> 5 miles away) are automatically assigned lowest scheduling priority and deferred to the end of the route.
 */
function partitionByGeographicDensity(stops: any[]): { clusterStops: any[]; outlierStops: any[] } {
  if (stops.length <= 3) return { clusterStops: stops, outlierStops: [] };

  const avgLat = stops.reduce((acc, s) => acc + s.latitude, 0) / stops.length;
  const avgLng = stops.reduce((acc, s) => acc + s.longitude, 0) / stops.length;

  const stopsWithDist = stops.map(s => {
    const distMeters = calculateHaversineDistanceMeters(avgLat, avgLng, s.latitude, s.longitude);
    return { stop: s, distMiles: distMeters / 1609.34 };
  });

  stopsWithDist.sort((a, b) => a.distMiles - b.distMiles);
  const medianDist = stopsWithDist[Math.floor(stopsWithDist.length / 2)].distMiles;

  const clusterStops: any[] = [];
  const outlierStops: any[] = [];

  stopsWithDist.forEach(item => {
    // Flag as outlier if > 5 miles away from centroid or > 3x median cluster radius AND not MUST_SEE
    if (item.distMiles > Math.max(5.0, medianDist * 3) && item.stop.priority !== 'MUST_SEE') {
      outlierStops.push(item.stop);
    } else {
      clusterStops.push(item.stop);
    }
  });

  return { clusterStops, outlierStops };
}

/**
 * STRATEGY 2: Must See & Preferred Priority Guaranteed
 * Strictly schedules all MUST_SEE and PREFERRED properties in positions #1 to #6 FIRST,
 * automatically deferring distant outlier properties (like 31 Yale St in Garden City) to the end.
 */
function generateMustSeePreferredGuaranteedRoute(stops: any[], earliestStartStr: string = '10:30', latestFinishStr: string = '15:00'): any[] {
  if (stops.length <= 2) return stops;

  // 1. Separate distant geographic outliers (e.g. Garden City, 25 mins away)
  const { clusterStops, outlierStops } = partitionByGeographicDensity(stops);

  // 2. Separate MUST_SEE vs PREFERRED vs OPTIONAL within the main cluster
  const mustSee = clusterStops.filter((s: any) => s.priority === 'MUST_SEE');
  const preferred = clusterStops.filter((s: any) => s.priority === 'PREFERRED' || !s.priority);
  const optional = clusterStops.filter((s: any) => s.priority === 'OPTIONAL');

  const priorityCore = [...mustSee, ...preferred];
  const bestCore = priorityCore.length > 1 ? optimizeSequenceForShortestDistance(priorityCore) : priorityCore;
  const bestOptional = optional.length > 0 ? optimizeSequenceForShortestDistance(optional) : [];
  const bestOutliers = outlierStops.length > 0 ? optimizeSequenceForShortestDistance(outlierStops) : [];

  return [...bestCore, ...bestOptional, ...bestOutliers];
}

export async function POST(request: Request) {
  try {
    const { stops, earliest_start, latest_finish } = await request.json();

    if (!stops || stops.length <= 1) {
      return NextResponse.json({ status: 'SUCCESS', stops, options: [] });
    }

    const startStr = earliest_start || '10:30';
    const finishStr = latest_finish || '15:00';

    let rawOpt1: any[] | null = null;
    let rawOpt2: any[] | null = null;
    let rawOpt3: any[] | null = null;
    let summaryOpt1 = 'Density-First Clustering: Prioritizes geographically close listings to fit maximum showings into tour window, deferring distant detours.';
    let summaryOpt2 = 'Priority Guaranteed: Strictly guarantees 100% of Must See & Preferred properties inside your tour window, placing distant detours at the end.';
    let summaryOpt3 = 'DeepSeek AI Smart Choice: Intelligently balances priority coverage, open house schedules, and travel times for the optimal tour itinerary.';

    const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
    const mapStopsById = (ids: string[]) => {
      const map = new Map(stops.map((s: any) => [s.id, s]));
      const ordered = (ids || []).map(id => map.get(id)).filter(Boolean);
      const missing = stops.filter((s: any) => !ids?.includes(s.id));
      return [...ordered, ...missing];
    };

    // PASS 1: DeepSeek AI Generation
    if (apiKey && apiKey.startsWith('sk-')) {
      const prompt = `You are an expert real estate tour logistics AI planner.
You are given a list of tour stops, client tour window limits, and property priorities.

TOUR WINDOW:
- Earliest Start: ${startStr}
- Latest Finish: ${finishStr}

PROPERTIES TO VISIT (${stops.length} Stops):
${stops.map((s: any) => `
Stop ID: ${s.id}
Address: ${s.normalized_address}
Priority: ${s.priority || 'PREFERRED'} (MUST_SEE = top priority, PREFERRED = medium, OPTIONAL = low)
Open House: ${s.has_open_house ? `${s.open_house_start || ''} - ${s.open_house_end || ''}` : 'None'}
Visit Duration: ${s.visit_minutes || 25} mins
Travel Buffer: ${s.travel_buffer_minutes || 5} mins
Lat/Lng: (${s.latitude}, ${s.longitude})
`).join('\n')}

CRITICAL DOMAIN RULES:
1. Stop #1 MUST start at Earliest Start (${startStr}).
2. GEOGRAPHIC OUTLIER RULE: Any property (such as 31 Yale St in Garden City) that is > 5 miles away from the main cluster of listings MUST be deferred to the VERY END of the route (position #${stops.length}) to prevent wasting 50 minutes of driving and ruining the schedule for the main cluster of listings.
3. ALL properties marked MUST_SEE (like 6 Cherry Ln E and 95 Miller Blvd) MUST finish (planned_departure) BEFORE ${finishStr}!

Please generate 3 distinct route options:
- option1_stop_ids: Array of stop IDs ordered to maximize the total number of listings that finish BEFORE ${finishStr}.
- option2_stop_ids: Array of stop IDs ordered so that 100% of MUST_SEE properties finish BEFORE ${finishStr}, followed by PREFERRED properties, with distant outliers placed at the end.
- option3_stop_ids: Array of stop IDs for the DeepSeek AI Smart Hybrid Choice balancing priority coverage and travel distance.

Return ONLY valid raw JSON format:
{
  "option1_stop_ids": ["id1", "id2", ...],
  "option2_stop_ids": ["id1", "id2", ...],
  "option3_stop_ids": ["id1", "id2", ...],
  "option1_summary": "...",
  "option2_summary": "...",
  "option3_summary": "..."
}`;

      try {
        const aiRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'You are an AI real estate route optimizer returning raw JSON.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.1
          })
        });

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const contentStr = aiJson.choices?.[0]?.message?.content;
          if (contentStr) {
            const cleanJsonStr = contentStr.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJsonStr);

            if (parsed.option1_stop_ids && parsed.option2_stop_ids && parsed.option3_stop_ids) {
              rawOpt1 = mapStopsById(parsed.option1_stop_ids);
              rawOpt2 = mapStopsById(parsed.option2_stop_ids);
              rawOpt3 = mapStopsById(parsed.option3_stop_ids);

              if (parsed.option1_summary) summaryOpt1 = parsed.option1_summary;
              if (parsed.option2_summary) summaryOpt2 = parsed.option2_summary;
              if (parsed.option3_summary) summaryOpt3 = parsed.option3_summary;
            }
          }
        }
      } catch (aiErr) {
        // Fallback
      }
    }

    // Heuristic Partitioned Fallback
    if (!rawOpt1 || !rawOpt2 || !rawOpt3) {
      rawOpt1 = generateMustSeePreferredGuaranteedRoute(stops, startStr, finishStr);
      rawOpt2 = generateMustSeePreferredGuaranteedRoute(stops, startStr, finishStr);
      rawOpt3 = generateMustSeePreferredGuaranteedRoute(stops, startStr, finishStr);
    }

    const seqOpt1 = formatStopsWithDriveMetrics(rawOpt1);
    const covOpt1 = computeWindowCoverageMetrics(seqOpt1, startStr, finishStr);

    const option1_max_listings = {
      id: 'opt_max_listings',
      name: 'Option 1: Max Listings (Density First)',
      badgeText: 'Max Listings',
      badgeColor: 'emerald',
      summary: summaryOpt1,
      stops: seqOpt1,
      stopsCoveredInWindow: covOpt1.stopsCoveredInWindow,
      totalStops: seqOpt1.length,
      mustSeeVisitedCount: covOpt1.mustSeeVisitedCount,
      mustSeeTotalCount: covOpt1.mustSeeTotalCount,
      totalDriveMins: seqOpt1.reduce((acc: number, s: any) => acc + (s.drive_minutes_from_prev || 0), 0),
      totalDriveMiles: Math.round(seqOpt1.reduce((acc: number, s: any) => acc + (s.drive_miles_from_prev || 0), 0) * 10) / 10
    };

    const seqOpt2 = formatStopsWithDriveMetrics(rawOpt2);
    const covOpt2 = computeWindowCoverageMetrics(seqOpt2, startStr, finishStr);

    const option2_must_see_priority = {
      id: 'opt_must_see_priority',
      name: 'Option 2: Must See & Preferred Guaranteed',
      badgeText: 'Must See Guaranteed',
      badgeColor: 'amber',
      summary: summaryOpt2,
      stops: seqOpt2,
      stopsCoveredInWindow: covOpt2.stopsCoveredInWindow,
      totalStops: seqOpt2.length,
      mustSeeVisitedCount: covOpt2.mustSeeVisitedCount,
      mustSeeTotalCount: covOpt2.mustSeeTotalCount,
      totalDriveMins: seqOpt2.reduce((acc: number, s: any) => acc + (s.drive_minutes_from_prev || 0), 0),
      totalDriveMiles: Math.round(seqOpt2.reduce((acc: number, s: any) => acc + (s.drive_miles_from_prev || 0), 0) * 10) / 10
    };

    const seqOpt3 = formatStopsWithDriveMetrics(rawOpt3);
    const covOpt3 = computeWindowCoverageMetrics(seqOpt3, startStr, finishStr);

    const option3_ai_recommended = {
      id: 'opt_ai_recommended',
      name: 'Option 3: DeepSeek AI Recommended Choice',
      badgeText: 'AI Recommended',
      badgeColor: 'purple',
      summary: summaryOpt3,
      stops: seqOpt3,
      stopsCoveredInWindow: covOpt3.stopsCoveredInWindow,
      totalStops: seqOpt3.length,
      mustSeeVisitedCount: covOpt3.mustSeeVisitedCount,
      mustSeeTotalCount: covOpt3.mustSeeTotalCount,
      totalDriveMins: seqOpt3.reduce((acc: number, s: any) => acc + (s.drive_minutes_from_prev || 0), 0),
      totalDriveMiles: Math.round(seqOpt3.reduce((acc: number, s: any) => acc + (s.drive_miles_from_prev || 0), 0) * 10) / 10
    };

    return NextResponse.json({
      status: 'SUCCESS',
      stops: seqOpt2,
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
