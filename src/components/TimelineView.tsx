'use client';

import React from 'react';
import { Tour, TourStop } from '@/types/tour';
import StatusBadge from './StatusBadge';
import {
  Clock,
  MapPin,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Building,
  Home,
  Bed,
  Bath,
  Plus,
  Minus
} from 'lucide-react';

interface TimelineViewProps {
  tour: Tour;
  selectedStopId?: string;
  onSelectStop: (stopId: string) => void;
  onToggleLock: (stopId: string) => void;
  onMoveStop: (index: number, direction: 'up' | 'down') => void;
  onOpenMessageModal: (stop: TourStop) => void;
  onUpdateStopBuffers?: (stopId: string, visitMins: number, travelBufferMins: number) => void;
}

export default function TimelineView({
  tour,
  selectedStopId,
  onSelectStop,
  onToggleLock,
  onMoveStop,
  onOpenMessageModal,
  onUpdateStopBuffers
}: TimelineViewProps) {
  return (
    <div className="space-y-3">
      {/* Tour Start Origin Card */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0 border border-emerald-500/40">
            S
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>Origin: {tour.start_address}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Planned Tour Start Time: <strong className="text-slate-200">{tour.earliest_start}</strong>
            </div>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px] border border-slate-800 font-mono">
          Departure
        </span>
      </div>

      {/* Property Stops List */}
      <div className="space-y-2.5">
        {tour.stops.map((stop, idx) => {
          const isSelected = stop.id === selectedStopId;
          const isLocked = stop.scheduling_mode === 'TIME_LOCKED' || stop.appointment_status === 'CONFIRMED';
          const hasOpenHouse = stop.has_open_house;

          const handleVisitChange = (delta: number) => {
            if (!onUpdateStopBuffers) return;
            const newVisit = Math.max(5, (stop.visit_minutes || 25) + delta);
            onUpdateStopBuffers(stop.id, newVisit, stop.travel_buffer_minutes || 5);
          };

          const handleBufferChange = (delta: number) => {
            if (!onUpdateStopBuffers) return;
            const newBuffer = Math.max(0, (stop.travel_buffer_minutes || 5) + delta);
            onUpdateStopBuffers(stop.id, stop.visit_minutes || 25, newBuffer);
          };

          return (
            <div
              key={stop.id}
              onClick={() => onSelectStop(stop.id)}
              className={`group relative p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                isSelected
                  ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: Listing Photo Thumbnail & Address */}
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  {/* Primary Property Image Thumbnail */}
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                    {stop.image_url ? (
                      <img
                        src={stop.image_url}
                        alt="Property Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                        No Image
                      </div>
                    )}
                    <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded bg-indigo-600/90 text-white font-bold text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white truncate max-w-[280px]">
                        {stop.normalized_address}
                      </h4>
                      <StatusBadge status={stop.appointment_status} type="appointment" size="sm" />
                    </div>

                    {/* Price & Bed/Bath Specs */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      {stop.list_price && (
                        <span className="font-extrabold text-emerald-400">
                          ${stop.list_price.toLocaleString()}
                        </span>
                      )}
                      {stop.beds && (
                        <span className="text-slate-300 font-semibold flex items-center gap-1">
                          <Bed className="w-3 h-3 text-indigo-400" />
                          {stop.beds} Beds, {stop.baths} Baths
                        </span>
                      )}
                      {stop.sqft && (
                        <span className="text-slate-400">
                          ({stop.sqft.toLocaleString()} sqft)
                        </span>
                      )}
                    </div>

                    {/* Open House Auto-Arrangement Badge */}
                    {hasOpenHouse && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                        <Home className="w-3 h-3 text-amber-400" />
                        <span>Open House {stop.open_house_start || '10:00'} - {stop.open_house_end || '12:00'}</span>
                      </div>
                    )}

                    {/* Listing Agent Contact */}
                    <div className="text-[11px] text-slate-400 truncate">
                      Agent: <strong className="text-slate-200">{stop.listing_agent_name || 'N/A'}</strong> ({stop.listing_brokerage || 'N/A'})
                    </div>
                  </div>
                </div>

                {/* Right Action Toolbar */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleLock(stop.id);
                    }}
                    title={isLocked ? "Unlock Time" : "Lock Time"}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      isLocked
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMessageModal(stop);
                    }}
                    title="Request / Update Appointment"
                    className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex flex-col">
                    <button
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveStop(idx, 'up');
                      }}
                      className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === tour.stops.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveStop(idx, 'down');
                      }}
                      className="p-0.5 text-slate-500 hover:text-white disabled:opacity-30"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Time Schedule & Inline Buffer Editor Bar */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-medium">
                <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>Time: {stop.planned_arrival || 'TBD'} – {stop.planned_departure || 'TBD'}</span>
                </div>

                {/* Inline Visit & Buffer Control Buttons */}
                <div className="flex items-center space-x-3 text-[10px]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center space-x-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    <span className="text-slate-400">Visit:</span>
                    <button
                      onClick={() => handleVisitChange(-5)}
                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-white px-0.5">{stop.visit_minutes}m</span>
                    <button
                      onClick={() => handleVisitChange(5)}
                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center space-x-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    <span className="text-slate-400">Buffer:</span>
                    <button
                      onClick={() => handleBufferChange(-5)}
                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-white px-0.5">{stop.travel_buffer_minutes}m</span>
                    <button
                      onClick={() => handleBufferChange(5)}
                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
