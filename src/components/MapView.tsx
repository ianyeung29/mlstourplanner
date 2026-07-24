'use client';

import React from 'react';
import { Tour, TourStop } from '@/types/tour';
import StatusBadge from './StatusBadge';
import { MapPin, Navigation, Home, CheckCircle2, Clock } from 'lucide-react';

interface MapViewProps {
  tour: Tour;
  selectedStopId?: string;
  onSelectStop?: (stopId: string) => void;
}

export default function MapView({ tour, selectedStopId, onSelectStop }: MapViewProps) {
  const stops = tour.stops;

  // Find geographic bounds
  const lats = [tour.start_latitude, ...stops.map(s => s.latitude)];
  const lngs = [tour.start_longitude, ...stops.map(s => s.longitude)];
  if (tour.end_latitude) lats.push(tour.end_latitude);
  if (tour.end_longitude) lngs.push(tour.end_longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const padLat = Math.max((maxLat - minLat) * 0.15, 0.02);
  const padLng = Math.max((maxLng - minLng) * 0.15, 0.02);

  const viewMinLat = minLat - padLat;
  const viewMaxLat = maxLat + padLat;
  const viewMinLng = minLng - padLng;
  const viewMaxLng = maxLng + padLng;

  // Convert lat/lng to 0-100% SVG coordinates
  const getCoords = (lat: number, lng: number) => {
    const x = ((lng - viewMinLng) / (viewMaxLng - viewMinLng)) * 100;
    const y = 100 - ((lat - viewMinLat) / (viewMaxLat - viewMinLat)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const startCoord = getCoords(tour.start_latitude, tour.start_longitude);
  const stopCoords = stops.map(s => ({
    stop: s,
    coord: getCoords(s.latitude, s.longitude)
  }));

  // Build SVG path points
  const points = [
    `${startCoord.x},${startCoord.y}`,
    ...stopCoords.map(sc => `${sc.coord.x},${sc.coord.y}`)
  ];
  if (tour.end_latitude && tour.end_longitude) {
    const endCoord = getCoords(tour.end_latitude, tour.end_longitude);
    points.push(`${endCoord.x},${endCoord.y}`);
  }

  const pathD = `M ${points.join(' L ')}`;

  const activeStop = stops.find(s => s.id === selectedStopId);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 flex items-center gap-2 shadow-lg">
        <Navigation className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-semibold text-slate-200">
          {stops.length} Showing Stops · Long Island / OneKey MLS
        </span>
      </div>

      {/* SVG Canvas Map Simulation */}
      <div className="relative flex-1 w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Animated Route Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#4f46e5"
            strokeWidth="0.8"
            strokeDasharray="2,1"
            className="animate-pulse"
          />
          <path
            d={pathD}
            fill="none"
            stroke="#818cf8"
            strokeWidth="0.5"
            opacity="0.8"
          />
        </svg>

        {/* Start Location Pin */}
        <div
          style={{ left: `${startCoord.x}%`, top: `${startCoord.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <Home className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 backdrop-blur-md text-[10px] text-slate-300 font-semibold px-2 py-0.5 rounded border border-slate-800 pointer-events-none shadow-md">
            Start Location
          </div>
        </div>

        {/* Stop Markers */}
        {stopCoords.map(({ stop, coord }, index) => {
          const isSelected = stop.id === selectedStopId;
          const isConfirmed = stop.appointment_status === 'CONFIRMED';
          const isRequested = stop.appointment_status === 'REQUESTED';

          const bgClass = isConfirmed
            ? 'bg-emerald-600 border-emerald-400 text-white'
            : isRequested
            ? 'bg-blue-600 border-blue-400 text-white'
            : 'bg-slate-900 border-indigo-500 text-indigo-300';

          return (
            <div
              key={stop.id}
              style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
              onClick={() => onSelectStop && onSelectStop(stop.id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group transition-all duration-300 ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
            >
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-lg shadow-indigo-500/20 ${bgClass}`}>
                {index + 1}
              </div>

              {/* Tooltip on hover or selection */}
              <div className={`absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 backdrop-blur-md text-xs px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl transition-opacity pointer-events-none ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <div className="font-semibold text-white">{stop.planned_arrival || 'TBD'}</div>
                <div className="text-[10px] text-slate-400 max-w-[140px] truncate">{stop.normalized_address}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Stop Quick Detail Bar at Bottom */}
      {activeStop && (
        <div className="p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-between z-20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
              #{activeStop.planned_order}
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{activeStop.normalized_address}</span>
                <StatusBadge status={activeStop.appointment_status} size="sm" />
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                <span>Arrival: <strong className="text-indigo-300">{activeStop.planned_arrival}</strong></span>
                <span>Duration: <strong>{activeStop.visit_minutes}m</strong></span>
                {activeStop.mls_number && <span className="text-slate-500">MLS: {activeStop.mls_number}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
