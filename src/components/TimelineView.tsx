'use client';

import React from 'react';
import { Tour, TourStop } from '@/types/tour';
import { isOpenHouseOnTourDate } from '@/services/routeOptimizer';
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
  Minus,
  RefreshCw,
  Trash2,
  Car,
  Loader2,
  Edit3,
  Code2,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Sparkles,
  Heart,
  HelpCircle,
  XCircle,
  Zap,
  Utensils,
  Coffee
} from 'lucide-react';

interface TimelineViewProps {
  tour: Tour;
  selectedStopId?: string;
  hoveredStopId?: string;
  onSelectStop: (stopId: string) => void;
  onHoverStop?: (stopId?: string) => void;
  onToggleLock: (stopId: string) => void;
  onMoveStop: (index: number, direction: 'up' | 'down') => void;
  onOpenMessageModal: (stop: TourStop) => void;
  onOpenEditListingModal?: (stop: TourStop) => void;
  onOpenAgentEmailModal?: (stop: TourStop) => void;
  onUpdateStopBuffers?: (stopId: string, visitMins: number, travelBufferMins: number) => void;
  onUpdateStopPriority?: (stopId: string, priority: 'MUST_SEE' | 'PREFERRED' | 'OPTIONAL') => void;
  onRemoveStop?: (stopId: string) => void;
  onReoptimize?: () => void;
  isOptimizing?: boolean;
}

function parseTimeToMins(timeStr?: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const ampm = match[3]?.toUpperCase();

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export default function TimelineView({
  tour,
  selectedStopId,
  hoveredStopId,
  onSelectStop,
  onHoverStop,
  onToggleLock,
  onMoveStop,
  onOpenMessageModal,
  onOpenEditListingModal,
  onOpenAgentEmailModal,
  onUpdateStopBuffers,
  onUpdateStopPriority,
  onRemoveStop,
  onReoptimize,
  isOptimizing = false
}: TimelineViewProps) {
  const [showDriveDebug, setShowDriveDebug] = React.useState(false);

  const tourFinishMins = parseTimeToMins(tour.latest_finish || '16:00');

  const withinWindowStops: Array<{ stop: TourStop; origIdx: number }> = [];
  const outsideWindowStops: Array<{ stop: TourStop; origIdx: number }> = [];

  tour.stops.forEach((stop, idx) => {
    const arrMins = parseTimeToMins(stop.planned_arrival);
    if (tourFinishMins > 0 && arrMins > tourFinishMins) {
      outsideWindowStops.push({ stop, origIdx: idx });
    } else {
      withinWindowStops.push({ stop, origIdx: idx });
    }
  });

  const renderStopCard = (stop: TourStop, idx: number, isOutside: boolean) => {
    const isSelected = stop.id === selectedStopId;
    const isHovered = stop.id === hoveredStopId;
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

    const driveMins = typeof stop.drive_minutes_from_prev === 'number'
      ? stop.drive_minutes_from_prev
      : 0;
    const driveMiles = typeof stop.drive_miles_from_prev === 'number'
      ? stop.drive_miles_from_prev
      : 0;

    return (
      <React.Fragment key={stop.id}>
        {/* Inter-Stop Drive Time Connector Badge */}
        {idx > 0 && (
          <div className="flex items-center justify-center py-1">
            <div className="px-3.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] flex items-center gap-1.5 shadow-md animate-fadeIn">
              <Car className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Drive to Stop #{idx + 1}: <strong className="text-slate-900 dark:text-white">{driveMins} mins</strong> ({driveMiles} miles)</span>
            </div>
          </div>
        )}

        <div
          onClick={() => onSelectStop(stop.id)}
          onMouseEnter={() => onHoverStop?.(stop.id)}
          onMouseLeave={() => onHoverStop?.(undefined)}
          className={`group relative p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
            isHovered
              ? 'bg-indigo-50/50 dark:bg-slate-900 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/80 shadow-2xl scale-[1.01]'
              : isOutside
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-400 dark:border-rose-500/70 hover:border-rose-500'
                : isSelected
                  ? 'bg-indigo-50/60 dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          {stop.is_break ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 font-sans">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                  <Utensils className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-amber-950 dark:text-amber-300 flex items-center gap-2">
                    <span>{stop.break_title || 'Lunch & Rest Break'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-mono text-[9px]">
                      {stop.visit_minutes} mins
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium truncate">
                    Location: {stop.normalized_address || 'Scheduled Rest Stop'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold font-mono text-amber-900 dark:text-amber-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  {stop.planned_arrival || '12:30 PM'}
                </span>
                {onRemoveStop && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveStop(stop.id);
                    }}
                    className="p-1 rounded-lg hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Remove Break"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Top Row: Thumbnail + Full Width Property Details */}
            <div className="flex items-start space-x-3">
              {/* Primary Property Image Thumbnail */}
              <div className="relative w-16 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-800">
                {stop.image_url ? (
                  <img
                    src={stop.image_url}
                    alt="Property Thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                    No Image
                  </div>
                )}
                <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shadow">
                  #{idx + 1}
                </span>
              </div>

              {/* Property Details */}
              <div className="space-y-1 min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug break-words">
                  {stop.normalized_address}
                </h4>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <StatusBadge status={stop.appointment_status} type="appointment" size="sm" />

                  {/* Interactive Priority Selector Dropdown */}
                  <select
                    value={stop.priority || 'PREFERRED'}
                    onChange={(e) => onUpdateStopPriority?.(stop.id, e.target.value as any)}
                    title="Change Property Priority"
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border cursor-pointer focus:outline-none transition-colors ${
                      stop.priority === 'MUST_SEE'
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                        : stop.priority === 'PREFERRED'
                          ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <option value="MUST_SEE" className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-300 font-bold">⭐ Must See</option>
                    <option value="PREFERRED" className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 font-bold">🔹 Preferred</option>
                    <option value="OPTIONAL" className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold">⚪ Optional</option>
                  </select>

                  {isOutside && (
                    <span
                      title={`Estimated arrival (${stop.planned_arrival || 'TBD'}) exceeds tour latest finish constraint of ${tour.latest_finish || '16:00 PM'}`}
                      className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 text-[10px] font-bold flex items-center gap-1 cursor-help"
                    >
                      <AlertTriangle className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                      <span>Exceeds {tour.latest_finish || 'Finish'} Window</span>
                    </span>
                  )}
                </div>

                {/* Price & Bed/Bath Specs */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] pt-0.5">
                  {stop.list_price && (
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      ${stop.list_price.toLocaleString()}
                    </span>
                  )}
                  {(stop.beds || stop.baths) && (
                    <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1">
                      <Bed className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      {stop.beds || 0} Bed, {stop.baths || 0} Bath
                    </span>
                  )}
                  {stop.sqft && (
                    <span className="text-slate-500 dark:text-slate-400">
                      ({stop.sqft.toLocaleString()} sqft)
                    </span>
                  )}
                </div>

                {/* Open House Auto-Arrangement Badge */}
                {hasOpenHouse && (
                  isOpenHouseOnTourDate(stop, tour.tour_date) ? (
                    <div className="flex items-start gap-1.5 p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[10px] font-extrabold shadow-sm leading-tight mt-1">
                      <Home className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>Open House {stop.open_house_date ? `${stop.open_house_date} ` : ''}{stop.open_house_start || '11:00'} - {stop.open_house_end || '13:00'} (No Appointment Needed)</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-1.5 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-[10px] font-bold shadow-sm leading-tight mt-1">
                      <Home className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>Open House is on {stop.open_house_date || 'different day'} — Appointment Required</span>
                    </div>
                  )
                )}

                {/* Listing Agent Contact */}
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate pt-0.5">
                  Agent: <strong className="text-slate-800 dark:text-slate-200">{stop.listing_agent_name || 'N/A'}</strong> ({stop.listing_brokerage || 'N/A'})
                </div>

                {/* Real-Time Buyer Rating & Feedback Comments */}
                {(stop.buyer_rating || stop.buyer_comments) && (
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 space-y-1 text-[11px] mt-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-purple-800 dark:text-purple-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        Buyer Rating:
                      </span>
                      {stop.buyer_rating === 'FAVORITE' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-sm">
                          <Heart className="w-3 h-3 fill-white" /> Favorite
                        </span>
                      )}
                      {stop.buyer_rating === 'MAYBE' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-sm">
                          <HelpCircle className="w-3 h-3 fill-white" /> Maybe
                        </span>
                      )}
                      {stop.buyer_rating === 'PASS' && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-600 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-sm">
                          <XCircle className="w-3 h-3 text-slate-300" /> Pass
                        </span>
                      )}
                    </div>
                    {stop.buyer_comments && (
                      <p className="text-slate-800 dark:text-slate-200 font-medium italic pl-1 text-[11px]">
                        "{stop.buyer_comments}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Dedicated Action Toolbar Row (Full width below property details) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-1 overflow-x-auto text-[11px]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenEditListingModal?.(stop)}
                  title="Edit Property Info"
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleLock(stop.id)}
                  title={isLocked ? "Unlock Stop Order" : "Lock Stop Order"}
                  className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    isLocked
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/40'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {isLocked ? <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" /> : <Unlock className="w-3 h-3" />}
                  <span>{isLocked ? 'Locked' : 'Lock'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAgentEmailModal?.(stop)}
                  title="Email Listing Agent Appointment Request"
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-800 flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  <Mail className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenMessageModal(stop)}
                  title="SMS Showing Request & Status"
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-purple-700 dark:text-purple-300 border border-slate-200 dark:border-slate-800 flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span>SMS</span>
                </button>

                {onRemoveStop && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove #${idx + 1} ${stop.normalized_address} from tour?`)) {
                        onRemoveStop(stop.id);
                      }
                    }}
                    title="Remove Listing from Itinerary"
                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-rose-600 text-slate-500 hover:text-white border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Up / Down Reorder Buttons */}
              <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => onMoveStop(idx, 'up')}
                  className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === tour.stops.length - 1}
                  onClick={() => onMoveStop(idx, 'down')}
                  className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                <div className={`flex items-center gap-1.5 font-bold ${isOutside ? 'text-rose-700 dark:text-rose-300' : 'text-indigo-700 dark:text-indigo-300'}`}>
                  <Clock className={`w-3 h-3 ${isOutside ? 'text-rose-500 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                  <span>Time: {stop.planned_arrival || 'TBD'} – {stop.planned_departure || 'TBD'}</span>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3 text-[10px]" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Visit:</span>
                    <button
                      onClick={() => handleVisitChange(-5)}
                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-slate-900 dark:text-white px-0.5">{stop.visit_minutes}m</span>
                    <button
                      onClick={() => handleVisitChange(5)}
                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Buffer:</span>
                    <button
                      onClick={() => handleBufferChange(-5)}
                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-slate-900 dark:text-white px-0.5">{stop.travel_buffer_minutes}m</span>
                    <button
                      onClick={() => handleBufferChange(5)}
                      className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-4">
      {/* 🔹 Container: Property Stops Within Expected Tour Window */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/20 border-2 border-indigo-300 dark:border-indigo-500/80 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-indigo-200 dark:border-indigo-500/30 pb-2">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Expected Tour Time Window ({tour.earliest_start || '09:30 AM'} – {tour.latest_finish || '16:00 PM'})</span>
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-600/30 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/40 text-[10px] font-extrabold">
            {withinWindowStops.length} Property Stop{withinWindowStops.length > 1 ? 's' : ''} Feasible
          </span>
        </div>

        <div className="space-y-2">
          {withinWindowStops.length > 0 ? (
            withinWindowStops.map(item => renderStopCard(item.stop, item.origIdx, false))
          ) : (
            <div className="p-4 text-center text-xs text-indigo-800 dark:text-indigo-300 font-medium">
              No properties currently scheduled within the expected tour window.
            </div>
          )}
        </div>
      </div>

      {/* ⚠️ Red/Rose Box Container: Property Stops Beyond Tour Window */}
      {outsideWindowStops.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-400 dark:border-rose-500/80 shadow-md space-y-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 dark:border-rose-500/30 pb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <h3 className="text-xs font-black text-rose-900 dark:text-rose-300 uppercase tracking-wider">
                Beyond Tour Window — {outsideWindowStops.length} Unreachable Stop{outsideWindowStops.length > 1 ? 's' : ''} (Finishes after {tour.latest_finish || '16:00 PM'})
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-600/30 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 text-[10px] font-extrabold shrink-0">
              Action Required
            </span>
          </div>

          {/* Schedule Fix Assistant Box */}
          <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-rose-200 dark:border-rose-500/40 space-y-2 text-xs">
            <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              <span>Schedule Assistant Suggestion:</span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              Reducing stop visit durations by 5 mins will allow all <strong>{outsideWindowStops.length} unreachable stop(s)</strong> to fit within your <strong>{tour.latest_finish || '16:00 PM'}</strong> finish window.
            </p>
            {onUpdateStopBuffers && (
              <button
                type="button"
                onClick={() => {
                  tour.stops.forEach(stop => {
                    const currentVisit = stop.visit_minutes || 25;
                    const newVisit = Math.max(10, currentVisit - 5);
                    onUpdateStopBuffers?.(stop.id, newVisit, stop.travel_buffer_minutes || 5);
                  });
                  if (onReoptimize) onReoptimize();
                }}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-[11px] font-black flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Apply 5m Visit Reduction & Re-Optimize Schedule</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {outsideWindowStops.map(item => renderStopCard(item.stop, item.origIdx, true))}
          </div>
        </div>
      )}

      {/* Re-optimize Route Button & Debug Toggle */}
      {onReoptimize && (
        <div className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onReoptimize}
              disabled={isOptimizing}
              className="flex-1 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-600 text-slate-800 dark:text-slate-300 hover:text-white border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-xs font-bold flex items-center justify-center gap-2 shadow transition-all cursor-pointer disabled:opacity-50"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span>Google Re-optimizing Route Sequence...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Re-optimize Route Sequence</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowDriveDebug(!showDriveDebug)}
              title="Toggle Drive Time Debug Log"
              className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-purple-700 dark:text-purple-400 border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Drive Logs</span>
            </button>
          </div>

          {/* Drive Time Debug Log Accordion */}
          {showDriveDebug && (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-purple-300 dark:border-purple-500/40 text-[11px] font-mono space-y-1.5 animate-fadeIn">
              <div className="font-bold text-purple-800 dark:text-purple-300 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center justify-between">
                <span>🔍 Live Inter-Stop Drive Metrics Log</span>
                <span className="text-slate-500 text-[10px]">Total Stops: {tour.stops.length}</span>
              </div>
              {tour.stops.map((s, i) => (
                <div key={s.id} className="text-slate-800 dark:text-slate-300 flex items-center justify-between py-0.5 border-b border-slate-100 dark:border-slate-900">
                  <span className="truncate max-w-[240px]">#{i + 1} {s.normalized_address}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                    {i === 0 ? 'START' : `🚗 ${s.drive_minutes_from_prev || 0}m (${s.drive_miles_from_prev || 0} mi)`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
