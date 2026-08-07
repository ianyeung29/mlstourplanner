'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tour, TourStop } from '@/types/tour';
import StatusBadge from './StatusBadge';
import { getSingleStopNavigationLink } from '@/services/navigationService';
import { Navigation, ExternalLink, Trash2, MapPin, Layers, Map as MapIcon, ChevronUp, ChevronDown, Phone, Clock, Bed, Home, Sparkles, MessageSquare } from 'lucide-react';

const GoogleInteractiveMap = dynamic(() => import('./GoogleInteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs gap-2">
      <div className="w-4 h-4 rounded-full border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin" />
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
  onOpenMessageModal?: (stop: TourStop) => void;
}

export default function MapView({
  tour,
  selectedStopId,
  hoveredStopId,
  onSelectStop,
  onHoverStop,
  onRemoveStop,
  onOpenMessageModal
}: MapViewProps) {
  const [mapMode, setMapMode] = useState<'GOOGLE_INTERACTIVE' | 'GOOGLE_DIRECTIONS'>('GOOGLE_INTERACTIVE');
  const [isSheetExpanded, setIsSheetExpanded] = useState(true);

  const stops = tour.stops;
  const propertyStops = stops.filter(s => !s.is_break);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';

  const origin = propertyStops.length > 0 ? encodeURIComponent(propertyStops[0].normalized_address) : '';
  const destination = propertyStops.length > 1 ? encodeURIComponent(propertyStops[propertyStops.length - 1].normalized_address) : origin;
  const waypoints = propertyStops.length > 2
    ? propertyStops.slice(1, propertyStops.length - 1).map(s => encodeURIComponent(s.normalized_address)).join('|')
    : '';

  const googleMapEmbedUrl = apiKey && !apiKey.includes('your_google_maps_key')
    ? `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&mode=driving`
    : `https://maps.google.com/maps?saddr=${origin}&daddr=${propertyStops.length > 1 ? propertyStops.slice(1).map(s => encodeURIComponent(s.normalized_address)).join('+to:') : origin}&output=embed`;

  const externalDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;

  const activePinStop = tour.stops.find(s => s.id === (selectedStopId || hoveredStopId)) || (propertyStops.length > 0 ? propertyStops[0] : null);

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[450px] bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col font-sans">
      {/* Header Overlay */}
      <div className="p-2.5 sm:p-3 bg-white dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 z-10 shadow-xs">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Google Maps Route Navigation</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono text-[9px]">Live Sync</span>
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">{propertyStops.length} Property Showing Stops</p>
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          {/* Toggle Map Mode */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] sm:text-[11px] font-bold">
            <button
              onClick={() => setMapMode('GOOGLE_INTERACTIVE')}
              className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                mapMode === 'GOOGLE_INTERACTIVE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapIcon className="w-3 h-3" />
              <span>Interactive Map</span>
            </button>
            <button
              onClick={() => setMapMode('GOOGLE_DIRECTIONS')}
              className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                mapMode === 'GOOGLE_DIRECTIONS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Directions</span>
            </button>
          </div>

          <a
            href={externalDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow transition-colors cursor-pointer shrink-0"
          >
            <span>Open GPS</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Map Body Container */}
      <div className="relative flex-1 w-full h-full min-h-[300px]">
        {mapMode === 'GOOGLE_INTERACTIVE' ? (
          <GoogleInteractiveMap
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

      {/* Mobile Slide-Up Property Preview Card Sheet */}
      {activePinStop && (
        <div className="p-3 bg-white dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex flex-col z-20 shadow-xl transition-all">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              {/* Photo Thumbnail */}
              {activePinStop.image_url ? (
                <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 dark:border-slate-800">
                  <img src={activePinStop.image_url} alt={activePinStop.normalized_address} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-300 dark:border-indigo-500/30 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 text-xs shrink-0">
                  #{activePinStop.planned_order}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                  <span className="truncate">{activePinStop.normalized_address}</span>
                  {formatPrice(activePinStop.list_price) && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] shrink-0">
                      {formatPrice(activePinStop.list_price)}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-300 font-semibold">
                    <Clock className="w-3 h-3" />
                    {activePinStop.planned_arrival || 'TBD'}
                  </span>
                  <span>Visit: {activePinStop.visit_minutes}m</span>
                  {activePinStop.beds && <span>· {activePinStop.beds} Bed, {activePinStop.baths} Bath</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* 1-Tap Single Stop GPS Directions Link */}
              <a
                href={getSingleStopNavigationLink(activePinStop.normalized_address, 'google')}
                target="_blank"
                rel="noopener noreferrer"
                title="Navigate directly to this property in Google Maps"
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center gap-1 shadow cursor-pointer"
              >
                <Navigation className="w-3 h-3" />
                <span>Navigate</span>
              </a>

              {onOpenMessageModal && (
                <button
                  type="button"
                  onClick={() => onOpenMessageModal(activePinStop)}
                  title="SMS Showing Request"
                  className="p-1 rounded-lg bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center justify-center cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              )}

              {onRemoveStop && (
                <button
                  onClick={() => {
                    if (confirm(`Remove property "${activePinStop.normalized_address}" from itinerary?`)) {
                      onRemoveStop(activePinStop.id);
                    }
                  }}
                  className="p-1 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Remove Stop"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
