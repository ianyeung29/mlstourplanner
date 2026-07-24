'use client';

import React, { useEffect, useRef } from 'react';
import { TourStop } from '@/types/tour';
import 'leaflet/dist/leaflet.css';

interface InteractiveMapProps {
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

export default function InteractiveMap({
  stops,
  selectedStopId,
  hoveredStopId,
  onSelectStop,
  onHoverStop
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const polylineRef = useRef<any>(null);

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Dynamically import Leaflet to avoid SSR window issues in Next.js
    import('leaflet').then((L) => {
      const initialLat = stops.length > 0 ? stops[0].latitude : 40.81;
      const initialLng = stops.length > 0 ? stops[0].longitude : -73.50;

      const map = L.map(mapContainerRef.current!, {
        center: [initialLat, initialLng],
        zoom: 12,
        zoomControl: true,
        attributionControl: false
      });

      // Dark Mode Basemap Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers, Polyline, and Hover/Selection Popups dynamically
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Clear existing markers & polyline
      Object.values(markersRef.current).forEach((marker: any) => map.removeLayer(marker));
      markersRef.current = {};

      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }

      if (!stops || stops.length === 0) return;

      const latLngs: [number, number][] = [];

      stops.forEach((stop, index) => {
        const orderNum = index + 1;
        const isSelected = stop.id === selectedStopId;
        const isHovered = stop.id === hoveredStopId;
        const isMustSee = stop.priority === 'MUST_SEE';

        latLngs.push([stop.latitude, stop.longitude]);

        // Custom HTML Marker Icon
        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer transition-all duration-300 ${
            isHovered || isSelected ? 'scale-125 z-50' : 'scale-100 z-10'
          }">
            <!-- Pulsing Glow Ring on Hover/Selection -->
            ${
              isHovered || isSelected
                ? `<div class="absolute -inset-2 rounded-full bg-indigo-500/50 animate-ping"></div>`
                : ''
            }
            <div class="relative w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs shadow-2xl border-2 ${
              isHovered
                ? 'bg-purple-600 text-white border-purple-300 ring-4 ring-purple-500/60 shadow-purple-500/50'
                : isSelected
                  ? 'bg-indigo-600 text-white border-indigo-300 ring-4 ring-indigo-500/60 shadow-indigo-500/50'
                  : isMustSee
                    ? 'bg-amber-500 text-slate-950 border-amber-300'
                    : 'bg-slate-900 text-indigo-300 border-indigo-500'
            }">
              #${orderNum}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -20]
        });

        const priceStr = formatPrice(stop.list_price);
        const popupContent = `
          <div style="min-width: 240px; font-family: system-ui, -apple-system, sans-serif;" class="p-1 text-slate-900">
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              ${
                stop.image_url
                  ? `<img src="${stop.image_url}" style="width: 70px; height: 55px; object-fit: cover; borderRadius: 8px; border: 1px solid #cbd5e1;" />`
                  : `<div style="width: 70px; height: 55px; background: #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #64748b;">No Photo</div>`
              }
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 11px; font-weight: 800; color: #0f172a; line-height: 1.2; margin-bottom: 2px;">
                  #${orderNum} ${stop.normalized_address}
                </div>
                ${priceStr ? `<div style="font-size: 11px; font-weight: 800; color: #059669;">${priceStr}</div>` : ''}
                <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                  ${stop.beds ? `${stop.beds} Beds · ` : ''}${stop.baths ? `${stop.baths} Baths · ` : ''}${stop.sqft ? `${stop.sqft.toLocaleString()} sqft` : ''}
                </div>
              </div>
            </div>
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; color: #475569;">
              <span>⏰ ${stop.planned_arrival} – ${stop.planned_departure}</span>
              <span style="color: #4f46e5; text-transform: uppercase;">${stop.priority || 'PREFERRED'}</span>
            </div>
          </div>
        `;

        const marker = L.marker([stop.latitude, stop.longitude], { icon: customIcon }).addTo(map);
        marker.bindPopup(popupContent, { closeButton: false, offset: L.point(0, -10) });

        marker.on('click', () => {
          onSelectStop?.(stop.id);
        });

        marker.on('mouseover', () => {
          onHoverStop?.(stop.id);
        });

        marker.on('mouseout', () => {
          onHoverStop?.(undefined);
        });

        markersRef.current[stop.id] = marker;
      });

      // Draw polyline connecting stops
      if (latLngs.length > 1) {
        polylineRef.current = L.polyline(latLngs, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8'
        }).addTo(map);
      }

      // Auto-fit map bounds to encompass all stops
      if (latLngs.length > 0) {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }

      // Automatically open Popup for Hovered or Selected Stop
      const activeStopId = hoveredStopId || selectedStopId;
      if (activeStopId && markersRef.current[activeStopId]) {
        markersRef.current[activeStopId].openPopup();
      }
    });
  }, [stops, selectedStopId, hoveredStopId, onSelectStop, onHoverStop]);

  return (
    <div className="relative w-full h-full min-h-[350px]">
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px] bg-slate-950 rounded-xl overflow-hidden" />
    </div>
  );
}
