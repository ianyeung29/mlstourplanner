'use client';

import React from 'react';
import { Tour, TourStop } from '@/types/tour';
import StatusBadge from './StatusBadge';
import { Navigation, ExternalLink, Trash2, MapPin, Home, Bed, Bath, Maximize2, DollarSign, Clock, Sparkles } from 'lucide-react';

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

  // Active or Hovered Stop for Map Pinpoint Popup
  const activePinStop = stops.find(s => s.id === (hoveredStopId || selectedStopId)) || (stops.length > 0 ? stops[0] : null);
  const isHoverActive = Boolean(hoveredStopId && stops.some(s => s.id === hoveredStopId));

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

      {/* Interactive Map Pinpoints Quick Selector Strip */}
      <div className="px-3 py-2 bg-slate-900/80 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto z-10">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-indigo-400" /> Map Pins:
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
                  ? 'bg-indigo-500 text-white border-indigo-400 ring-2 ring-indigo-400/50 shadow-lg scale-105'
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

      {/* Real Google Maps Embed / Interactive Iframe with Floating Pinpoint Popup Overlay */}
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

        {/* Floating Map Pinpoint Info Popup (Triggered on Hover or Selection) */}
        {activePinStop && (
          <div className={`absolute top-4 left-4 right-4 pointer-events-auto transition-all duration-300 transform z-20 ${
            isHoverActive ? 'scale-100 opacity-100' : 'scale-98 opacity-95'
          }`}>
            <div className="p-3.5 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/50 rounded-2xl shadow-2xl ring-1 ring-indigo-500/30 flex items-start gap-3.5">
              {/* Photo Thumbnail */}
              <div className="relative w-24 h-20 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-700/80 shadow-md">
                {activePinStop.image_url ? (
                  <img
                    src={activePinStop.image_url}
                    alt={activePinStop.normalized_address}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                    <Home className="w-6 h-6" />
                  </div>
                )}
                {/* Stop Order Badge overlay */}
                <div className="absolute top-1 left-1 px-2 py-0.5 rounded-md bg-indigo-600/90 backdrop-blur text-white text-[10px] font-black shadow">
                  #{activePinStop.planned_order}
                </div>
              </div>

              {/* Details & Specs */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-black text-white leading-tight truncate">
                    {activePinStop.normalized_address}
                  </h4>
                  {formatPrice(activePinStop.list_price) && (
                    <span className="text-xs font-black text-emerald-400 shrink-0 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      {formatPrice(activePinStop.list_price)}
                    </span>
                  )}
                </div>

                {/* Specs: Beds, Baths, Sqft */}
                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-300">
                  {typeof activePinStop.beds === 'number' && (
                    <span className="flex items-center gap-1">
                      <Bed className="w-3 h-3 text-indigo-400" /> {activePinStop.beds} Beds
                    </span>
                  )}
                  {typeof activePinStop.baths === 'number' && (
                    <span className="flex items-center gap-1">
                      <Bath className="w-3 h-3 text-indigo-400" /> {activePinStop.baths} Baths
                    </span>
                  )}
                  {activePinStop.sqft && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Maximize2 className="w-3 h-3 text-slate-500" /> {activePinStop.sqft.toLocaleString()} sqft
                    </span>
                  )}
                </div>

                {/* Scheduled Time & Status */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span className="flex items-center gap-1 font-bold text-indigo-300">
                    <Clock className="w-3 h-3 text-indigo-400" /> {activePinStop.planned_arrival} – {activePinStop.planned_departure}
                  </span>
                  <StatusBadge status={activePinStop.appointment_status} size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Stop Action Bar */}
      {activePinStop && (
        <div className="p-3 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-xs shrink-0">
              #{activePinStop.planned_order}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {activePinStop.normalized_address}
              </div>
              <div className="text-[10px] text-slate-400">
                Arrival: <strong className="text-indigo-300">{activePinStop.planned_arrival}</strong> · Visit: {activePinStop.visit_minutes}m
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
