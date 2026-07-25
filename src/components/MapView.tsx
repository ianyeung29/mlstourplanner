'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tour, TourStop } from '@/types/tour';
import StatusBadge from './StatusBadge';
import { Navigation, ExternalLink, Trash2, MapPin, Layers, Map as MapIcon } from 'lucide-react';

const GoogleInteractiveMap = dynamic(() => import('./GoogleInteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-slate-950 flex items-center justify-center text-indigo-400 font-bold text-xs gap-2">
      <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
      <span>Loading Google Maps Interactive Engine...</span>
    </div>
  )
});

interface MapViewProps {
  tour: Tour;
  selectedStopId?: string;
  hoveredStopId?: string;
  onSelectStop?: (stopId: string) => void;
  onHoverStop?: (stopId?: string) => void;
  onRemoveStop?: (stopId: string) => void;
}

export default function MapView({
  tour,
  selectedStopId,
  hoveredStopId,
  onSelectStop,
  onHoverStop,
  onRemoveStop
}: MapViewProps) {
  const [mapMode, setMapMode] = useState<'GOOGLE_INTERACTIVE' | 'GOOGLE_DIRECTIONS'>('GOOGLE_INTERACTIVE');
  const stops = tour.stops;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';

  const origin = stops.length > 0 ? encodeURIComponent(stops[0].normalized_address) : '';
  const destination = stops.length > 1 ? encodeURIComponent(stops[stops.length - 1].normalized_address) : origin;
  const waypoints = stops.length > 2
    ? stops.slice(1, stops.length - 1).map(s => encodeURIComponent(s.normalized_address)).join('|')
    : '';

  const googleMapEmbedUrl = apiKey && !apiKey.includes('your_google_maps_key')
    ? `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&mode=driving`
    : `https://maps.google.com/maps?saddr=${origin}&daddr=${stops.length > 1 ? stops.slice(1).map(s => encodeURIComponent(s.normalized_address)).join('+to:') : origin}&output=embed`;

  const externalDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;

  const activePinStop = stops.find(s => s.id === (hoveredStopId || selectedStopId)) || (stops.length > 0 ? stops[0] : null);

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Header Overlay */}
      <div className="p-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-indigo-400" />
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Google Maps Route Navigation</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px]">Live Hover Sync</span>
            </h4>
            <p className="text-[10px] text-slate-400">{stops.length} Property Showing Stops · Long Island</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Map Mode */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setMapMode('GOOGLE_INTERACTIVE')}
              className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                mapMode === 'GOOGLE_INTERACTIVE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3 h-3" />
              <span>Google Interactive Map</span>
            </button>
            <button
              onClick={() => setMapMode('GOOGLE_DIRECTIONS')}
              className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                mapMode === 'GOOGLE_DIRECTIONS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Google Directions</span>
            </button>
          </div>

          {stops.length > 0 && (
            <a
              href={externalDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition-colors shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open Google Maps</span>
            </a>
          )}
        </div>
      </div>

      {/* Map Pins Selector Bar */}
      <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto z-10">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-indigo-400" /> Tour Pins:
        </span>
        {stops.map((stop, idx) => {
          const isSelected = stop.id === selectedStopId;
          const isHovered = stop.id === hoveredStopId;
          return (
            <button
              key={stop.id}
              onClick={() => onSelectStop?.(stop.id)}
              onMouseEnter={() => onHoverStop?.(stop.id)}
              onMouseLeave={() => onHoverStop?.(undefined)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer border ${
                isHovered
                  ? 'bg-purple-600 text-white border-purple-300 ring-2 ring-purple-400/80 shadow-lg scale-105'
                  : isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 ring-1 ring-indigo-500/50'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>#{idx + 1}</span>
              <span className="max-w-[90px] truncate text-[11px] font-normal">{stop.normalized_address.split(',')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Map Body */}
      <div className="relative flex-1 w-full h-full min-h-[350px] bg-slate-950">
        {mapMode === 'GOOGLE_INTERACTIVE' ? (
          <GoogleInteractiveMap
            key={stops.map(s => `${s.id}:${s.planned_order}`).join(',')}
            stops={stops}
            selectedStopId={selectedStopId}
            hoveredStopId={hoveredStopId}
            onSelectStop={onSelectStop}
            onHoverStop={onHoverStop}
          />
        ) : (
          <iframe
            key={stops.map(s => `${s.id}:${s.planned_order}`).join(',')}
            title="Google Maps Driving Route"
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: '350px' }}
            loading="lazy"
            allowFullScreen
            src={googleMapEmbedUrl}
            className="w-full h-full filter saturate-[1.1]"
          />
        )}
      </div>

      {/* Bottom Quick Detail Bar */}
      {activePinStop && (
        <div className="p-3 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-xs shrink-0">
              #{activePinStop.planned_order}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                <span>{activePinStop.normalized_address}</span>
                {formatPrice(activePinStop.list_price) && (
                  <span className="text-emerald-400 font-extrabold text-[11px]">
                    {formatPrice(activePinStop.list_price)}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-3">
                <span>Arrival: <strong className="text-indigo-300">{activePinStop.planned_arrival}</strong></span>
                <span>Visit: {activePinStop.visit_minutes}m</span>
                {activePinStop.beds && <span>{activePinStop.beds} Bed / {activePinStop.baths} Bath</span>}
              </div>
            </div>
          </div>

          {onRemoveStop && (
            <button
              onClick={() => {
                if (confirm(`Remove property "${activePinStop.normalized_address}" from itinerary?`)) {
                  onRemoveStop(activePinStop.id);
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
