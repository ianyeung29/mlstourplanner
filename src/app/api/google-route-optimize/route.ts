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

export async function POST(request: Request) {
  const debugLog: any = {
    apiKeyConfigured: false,
    stopsCount: 0,
    apiStatus: null,
    provider: 'UNKNOWN',
    candidatesEvaluated: 0,
    googleResponses: [],
    minTotalDurationSeconds: null,
    minDistanceMeters: null,
    originalSequence: [],
    reorderedSequence: []
  };

  try {
    const { stops } = await request.json();
    debugLog.stopsCount = stops?.length || 0;
    debugLog.originalSequence = stops?.map((s: any) => s.normalized_address) || [];

    if (!stops || stops.length <= 1) {
      debugLog.reorderedSequence = debugLog.originalSequence;
      return NextResponse.json({ status: 'SUCCESS', stops, debug: debugLog });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    const isGoogleKeyConfigured = !!(apiKey && apiKey.startsWith('AIza') && !apiKey.includes('your_google_maps_key'));
    debugLog.apiKeyConfigured = isGoogleKeyConfigured;

    let bestGlobalSequence: any[] = [...stops];

    if (isGoogleKeyConfigured && stops.length >= 2) {
      let minTotalDurationSeconds = Infinity;
      debugLog.provider = 'GOOGLE_DIRECTIONS_API_OPEN_PATH';

      // Evaluate candidate start & end pairs for open-path TSP optimization
      for (let startIdx = 0; startIdx < stops.length; startIdx++) {
        for (let endIdx = 0; endIdx < stops.length; endIdx++) {
          if (startIdx === endIdx && stops.length > 1) continue;

          debugLog.candidatesEvaluated++;
          const startStop = stops[startIdx];
          const endStop = stops[endIdx];
          const intermediates = stops.filter((_: any, i: number) => i !== startIdx && i !== endIdx);

          let waypointsParam = '';
          if (intermediates.length > 0) {
            waypointsParam = `&waypoints=optimize:true|${intermediates.map((s: any) => encodeURIComponent(s.normalized_address)).join('|')}`;
          }

          const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(startStop.normalized_address)}&destination=${encodeURIComponent(endStop.normalized_address)}${waypointsParam}&key=${apiKey}`;

          try {
            const googleRes = await fetch(url);
            const data = await googleRes.json();
            debugLog.apiStatus = googleRes.status;

            if (data.status === 'OK' && data.routes?.[0]) {
              const route = data.routes[0];
              const waypointOrder: number[] = route.waypoint_order || [];

              let durationSecs = 0;
              if (route.legs) {
                route.legs.forEach((leg: any) => {
                  durationSecs += leg.duration?.value || 0;
                });
              }

              debugLog.googleResponses.push({
                start: startStop.normalized_address,
                end: endStop.normalized_address,
                durationSecs,
                waypointOrder
              });

              if (durationSecs < minTotalDurationSeconds && waypointOrder.length === intermediates.length) {
                minTotalDurationSeconds = durationSecs;
                debugLog.minTotalDurationSeconds = durationSecs;
                const reorderedIntermediates = waypointOrder.map(idx => intermediates[idx]);
                bestGlobalSequence = [startStop, ...reorderedIntermediates, endStop];
              }
            }
          } catch (e: any) {
            debugLog.googleResponses.push({ error: e.message });
          }
        }
      }
    } else {
      // Fallback open-path permutation solver using precise Haversine distance
      debugLog.provider = 'HAVERSINE_PERMUTATION_SOLVER (Google Maps Key Not Set in .env.local)';
      if (stops.length <= 8) {
        const allPermutations = getPermutations(stops);
        let minDistance = Infinity;

        for (const candidate of allPermutations) {
          debugLog.candidatesEvaluated++;
          const dist = calculateRouteDistance(candidate);
          if (dist < minDistance) {
            minDistance = dist;
            debugLog.minDistanceMeters = dist;
            bestGlobalSequence = candidate;
          }
        }
      }
    }

    bestGlobalSequence.forEach((s: any, idx: number) => {
      s.planned_order = idx + 1;
    });

    debugLog.reorderedSequence = bestGlobalSequence.map((s: any) => s.normalized_address);

    return NextResponse.json({
      status: 'SUCCESS',
      provider: debugLog.provider,
      stops: bestGlobalSequence,
      debug: debugLog
    });
  } catch (error: any) {
    debugLog.error = error.message;
    return NextResponse.json({ error: error.message || 'Route optimization error', debug: debugLog }, { status: 500 });
  }
}
