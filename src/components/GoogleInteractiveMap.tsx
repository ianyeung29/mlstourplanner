'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TourStop } from '@/types/tour';

interface GoogleInteractiveMapProps {
  stops: TourStop[];
  selectedStopId?: string;
  hoveredStopId?: string;
  onSelectStop?: (stopId: string) => void;
  onHoverStop?: (stopId?: string) => void;
}

function formatPrice(price?: number): string | null {
  if (!price) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
}

// Sleek Dark Theme Styles for Official Google Maps
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b687a' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b687a' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e68' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#021019' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c4595' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#e98df5' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d8c' }] }
];

export default function GoogleInteractiveMap({
  stops,
  selectedStopId,
  hoveredStopId,
  onSelectStop,
  onHoverStop
}: GoogleInteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapObjRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const infoWindowRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';

  // Load Google Maps JavaScript API Script dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).google?.maps) {
      setIsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-js-api-script';
    let existingScript = document.getElementById(scriptId) as HTMLScriptElement;

    if (!existingScript) {
      existingScript = document.createElement('script');
      existingScript.id = scriptId;
      existingScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      existingScript.async = true;
      existingScript.defer = true;
      existingScript.onload = () => setIsLoaded(true);
      document.head.appendChild(existingScript);
    } else {
      existingScript.addEventListener('load', () => setIsLoaded(true));
    }
  }, [apiKey]);

  // Initialize Map Instance once API is ready
  useEffect(() => {
    if (!isLoaded || !mapRef.current || googleMapObjRef.current) return;

    const google = (window as any).google;
    const initialLat = stops.length > 0 ? stops[0].latitude : 40.81;
    const initialLng = stops.length > 0 ? stops[0].longitude : -73.50;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: initialLat, lng: initialLng },
      zoom: 12,
      styles: darkMapStyle,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    });

    infoWindowRef.current = new google.maps.InfoWindow({
      disableAutoPan: true
    });

    googleMapObjRef.current = map;
  }, [isLoaded, stops]);

  // Update Markers, Real-Time Driving Directions, and Hover Popups whenever stops change
  useEffect(() => {
    if (!isLoaded || !googleMapObjRef.current) return;

    const google = (window as any).google;
    const map = googleMapObjRef.current;

    // Clear existing markers, polyline, and directions
    Object.values(markersRef.current).forEach((m: any) => m.setMap(null));
    markersRef.current = {};

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }

    if (!stops || stops.length === 0) return;

    const pathCoords: any[] = [];
    const bounds = new google.maps.LatLngBounds();

    stops.forEach((stop, index) => {
      const orderNum = index + 1;
      const pos = { lat: stop.latitude, lng: stop.longitude };
      pathCoords.push(pos);
      bounds.extend(pos);

      const isMustSee = stop.priority === 'MUST_SEE';
      const pinColor = isMustSee ? '#f59e0b' : '#6366f1';

      // SVG Pinpoint Icon with Stop Number Badge
      const svgMarkerIcon = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: pinColor,
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff',
        scale: 1.8,
        anchor: new google.maps.Point(12, 22),
        labelOrigin: new google.maps.Point(12, 9)
      };

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: `#${orderNum} ${stop.normalized_address}`,
        icon: svgMarkerIcon,
        label: {
          text: `${orderNum}`,
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: '900'
        }
      });

      marker.addListener('click', () => {
        onSelectStop?.(stop.id);
      });

      marker.addListener('mouseover', () => {
        onHoverStop?.(stop.id);
      });

      marker.addListener('mouseout', () => {
        onHoverStop?.(undefined);
      });

      markersRef.current[stop.id] = marker;
    });

    // Draw Turn-by-Turn Driving Directions via DirectionsService
    if (stops.length > 1) {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true, // Keep our custom SVG markers
        polylineOptions: {
          strokeColor: '#818cf8',
          strokeOpacity: 0.9,
          strokeWeight: 5
        }
      });

      directionsRendererRef.current = directionsRenderer;

      const origin = { lat: stops[0].latitude, lng: stops[0].longitude };
      const destination = { lat: stops[stops.length - 1].latitude, lng: stops[stops.length - 1].longitude };
      const waypoints = stops.slice(1, stops.length - 1).map(s => ({
        location: { lat: s.latitude, lng: s.longitude },
        stopover: true
      }));

      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false
        },
        (result: any, status: any) => {
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result);
          } else {
            // Fallback to smooth geodesic Polyline if DirectionsService fails
            polylineRef.current = new google.maps.Polyline({
              path: pathCoords,
              geodesic: true,
              strokeColor: '#6366f1',
              strokeOpacity: 0.9,
              strokeWeight: 4,
              map
            });
          }
        }
      );
    }

    if (stops.length > 0) {
      map.fitBounds(bounds);
    }
  }, [isLoaded, stops, onSelectStop, onHoverStop]);

  // Handle Hover State Popup logic (CLOSE ALL POPUPS WHEN NOT HOVERING)
  useEffect(() => {
    if (!isLoaded || !googleMapObjRef.current || !infoWindowRef.current) return;

    const google = (window as any).google;
    const map = googleMapObjRef.current;
    const infoWindow = infoWindowRef.current;

    // Reset all marker animations
    Object.values(markersRef.current).forEach((m: any) => m.setAnimation(null));

    // RULE: If mouse is NOT hovering over any listing or pinpoint, CLOSE ALL POPUPS!
    if (!hoveredStopId || !markersRef.current[hoveredStopId]) {
      infoWindow.close();
      return;
    }

    // Mouse IS hovering over a listing -> Open InfoWindow Popup directly on that pin!
    const targetStop = stops.find(s => s.id === hoveredStopId);
    const targetMarker = markersRef.current[hoveredStopId];

    if (targetStop && targetMarker) {
      targetMarker.setAnimation(google.maps.Animation.BOUNCE);
      const priceStr = formatPrice(targetStop.list_price);

      const htmlContent = `
        <div style="min-width: 250px; font-family: system-ui, -apple-system, sans-serif; padding: 4px;" class="text-slate-900">
          <div style="display: flex; gap: 10px; align-items: flex-start;">
            ${
              targetStop.image_url
                ? `<img src="${targetStop.image_url}" style="width: 72px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;" />`
                : `<div style="width: 72px; height: 56px; background: #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #64748b;">No Photo</div>`
            }
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 12px; font-weight: 900; color: #0f172a; line-height: 1.2; margin-bottom: 3px;">
                #${targetStop.planned_order} ${targetStop.normalized_address}
              </div>
              ${priceStr ? `<div style="font-size: 12px; font-weight: 900; color: #059669;">${priceStr}</div>` : ''}
              <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
                ${targetStop.beds ? `${targetStop.beds} Beds · ` : ''}${targetStop.baths ? `${targetStop.baths} Baths · ` : ''}${targetStop.sqft ? `${targetStop.sqft.toLocaleString()} sqft` : ''}
              </div>
            </div>
          </div>
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #475569;">
            <span>⏰ ${targetStop.planned_arrival} – ${targetStop.planned_departure}</span>
            <span style="color: #4f46e5; text-transform: uppercase;">${targetStop.priority || 'PREFERRED'}</span>
          </div>
        </div>
      `;

      infoWindow.setContent(htmlContent);
      infoWindow.open(map, targetMarker);
    }
  }, [isLoaded, hoveredStopId, stops]);

  return (
    <div className="relative w-full h-full min-h-[350px]">
      <div ref={mapRef} className="w-full h-full min-h-[350px] bg-slate-950 rounded-xl overflow-hidden" />
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-950 flex items-center justify-center text-indigo-400 font-bold text-xs gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
          <span>Loading Google Maps Interactive Engine...</span>
        </div>
      )}
    </div>
  );
}
