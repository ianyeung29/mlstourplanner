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
  try {
    const { stops } = await request.json();

    if (!stops || stops.length <= 1) {
      return NextResponse.json({ status: 'SUCCESS', stops });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    const isGoogleKeyConfigured = !!(apiKey && apiKey.startsWith('AIza') && !apiKey.includes('your_google_maps_key'));

    let bestGlobalSequence: any[] = [...stops];

    if (isGoogleKeyConfigured && stops.length >= 2) {
      let minTotalDurationSeconds = Infinity;

      // Evaluate candidate start & end pairs for open-path TSP optimization
      for (let startIdx = 0; startIdx < stops.length; startIdx++) {
        for (let endIdx = 0; endIdx < stops.length; endIdx++) {
          if (startIdx === endIdx && stops.length > 1) continue;

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

            if (data.status === 'OK' && data.routes?.[0]) {
              const route = data.routes[0];
              const waypointOrder: number[] = route.waypoint_order || [];

              let durationSecs = 0;
              if (route.legs) {
                route.legs.forEach((leg: any) => {
                  durationSecs += leg.duration?.value || 0;
                });
              }

              if (durationSecs < minTotalDurationSeconds && waypointOrder.length === intermediates.length) {
                minTotalDurationSeconds = durationSecs;
                const reorderedIntermediates = waypointOrder.map(idx => intermediates[idx]);
                const candidateSeq = [startStop, ...reorderedIntermediates, endStop];

                // Attach exact Google Directions leg drive times & distances
                if (route.legs && route.legs.length === candidateSeq.length - 1) {
                  candidateSeq[0].drive_minutes_from_prev = 0;
                  candidateSeq[0].drive_miles_from_prev = 0;

                  for (let lIdx = 0; lIdx < route.legs.length; lIdx++) {
                    const leg = route.legs[lIdx];
                    const legMins = Math.max(1, Math.round((leg.duration?.value || 0) / 60));
                    const legMiles = Math.round(((leg.distance?.value || 0) / 1609.34) * 10) / 10;

                    candidateSeq[lIdx + 1].drive_minutes_from_prev = legMins;
                    candidateSeq[lIdx + 1].drive_miles_from_prev = legMiles;
                  }
                }

                bestGlobalSequence = candidateSeq;
              }
            }
          } catch (e: any) {
            // Fallback
          }
        }
      }
    } else {
      // Fallback open-path permutation solver using Haversine distance
      if (stops.length <= 8) {
        const allPermutations = getPermutations(stops);
        let minDistance = Infinity;

        for (const candidate of allPermutations) {
          const dist = calculateRouteDistance(candidate);
          if (dist < minDistance) {
            minDistance = dist;
            bestGlobalSequence = candidate;
          }
        }
      }
    }

    bestGlobalSequence.forEach((s: any, idx: number) => {
      s.planned_order = idx + 1;
      if (idx === 0) {
        s.drive_minutes_from_prev = 0;
        s.drive_miles_from_prev = 0;
      } else if (!s.drive_minutes_from_prev || s.drive_minutes_from_prev === 0) {
        const prev = bestGlobalSequence[idx - 1];
        const distMeters = calculateHaversineDistanceMeters(prev.latitude, prev.longitude, s.latitude, s.longitude);
        s.drive_miles_from_prev = Math.round((distMeters / 1609.34) * 10) / 10;
        s.drive_minutes_from_prev = Math.max(2, Math.ceil(distMeters / 670));
      }
    });

    return NextResponse.json({
      status: 'SUCCESS',
      stops: bestGlobalSequence
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Route optimization error' }, { status: 500 });
  }
}
