'use client';

import React from 'react';
import { Tour, TourStop } from '@/types/tour';
import StatusBadge from './StatusBadge';
import { MapPin, Navigation, Home, CheckCircle2, Clock, Trash2, ExternalLink, Layers } from 'lucide-react';

interface MapViewProps {
  tour: Tour;
  selectedStopId?: string;
  onSelectStop?: (stopId: string) => void;
  onRemoveStop?: (stopId: string) => void;
}

export default function MapView({ tour, selectedStopId, onSelectStop, onRemoveStop }: MapViewProps) {
  const stops = tour.stops;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';

  const origin = stops.length > 0 ? encodeURIComponent(stops[0].normalized_address) : '';
  const destination = stops.length > 1 ? encodeURIComponent(stops[stops.length - 1].normalized_address) : origin;
  const waypoints = stops.length > 2
    ? stops.slice(1, stops.length - 1).map(s => encodeURIComponent(s.normalized_address)).join('|')
    : '';

  // Google Maps Embed API Directions URL starting directly at Stop #1
  const googleMapEmbedUrl = apiKey && !apiKey.includes('your_google_maps_key')
    ? `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&mode=driving`
    : `https://maps.google.com/maps?saddr=${origin}&daddr=${stops.length > 1 ? stops.slice(1).map(s => encodeURIComponent(s.normalized_address)).join('+to:') : origin}&output=embed`;

  // Direct Google Maps Directions link for one-click navigation
  const externalDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;

  const activeStop = stops.find(s => s.id === selectedStopId);

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Header Overlay */}
      <div className="p-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-indigo-400" />
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Google Maps Route Navigation</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px]">Live Traffic</span>
            </h4>
            <p className="text-[10px] text-slate-400">{stops.length} Property Showing Stops · Long Island</p>
          </div>
        </div>

        {stops.length > 0 && (
          <a
            href={externalDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Open in Google Maps App</span>
          </a>
        )}
      </div>

      {/* Real Google Maps Embed / Interactive Iframe */}
      <div className="relative flex-1 w-full h-full min-h-[350px] bg-slate-950">
        {stops.length > 0 ? (
          <iframe
            title="Google Maps Driving Route"
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: '350px' }}
            loading="lazy"
            allowFullScreen
            src={googleMapEmbedUrl}
            className="w-full h-full filter saturate-[1.1]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            No property listings in tour itinerary yet.
          </div>
        )}
      </div>

      {/* Selected Stop Quick Detail Bar at Bottom */}
      {activeStop && (
        <div className="p-3.5 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between z-20">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-xs shrink-0">
              #{activeStop.planned_order}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white flex items-center gap-2 truncate">
                <span className="truncate">{activeStop.normalized_address}</span>
                <StatusBadge status={activeStop.appointment_status} size="sm" />
              </div>
              <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3 mt-0.5">
                <span>Arrival: <strong className="text-indigo-300">{activeStop.planned_arrival}</strong></span>
                <span>Visit: <strong>{activeStop.visit_minutes}m</strong></span>
                {activeStop.mls_number && <span className="text-slate-500 font-mono">MLS: {activeStop.mls_number}</span>}
              </div>
            </div>
          </div>

          {onRemoveStop && (
            <button
              onClick={() => {
                if (confirm(`Remove property "${activeStop.normalized_address}" from itinerary?`)) {
                  onRemoveStop(activeStop.id);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-rose-600 text-rose-300 hover:text-white border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ml-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
