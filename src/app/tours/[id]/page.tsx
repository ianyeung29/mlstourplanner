'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tour, TourStop, AppointmentStatus } from '@/types/tour';
import { getTourById, saveTour, deleteTour } from '@/services/storage';
import { optimizeTourSchedule } from '@/services/routeOptimizer';
import { lookupByMlsNumber } from '@/services/mlsService';
import TimelineView from '@/components/TimelineView';
import MapView from '@/components/MapView';
import StatusBadge from '@/components/StatusBadge';
import ConflictBanner from '@/components/ConflictBanner';
import AppointmentModal from '@/components/AppointmentModal';
import ClientEmailModal from '@/components/ClientEmailModal';
import {
  Calendar,
  Clock,
  Printer,
  ChevronLeft,
  RefreshCw,
  Plus,
  Hash,
  Map as MapIcon,
  List,
  Mail,
  Edit2,
  Trash2,
  X,
  Save
} from 'lucide-react';

export default function TourWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const tourId = params.id as string;

  const [tour, setTour] = React.useState<Tour | null>(null);
  const [selectedStopId, setSelectedStopId] = React.useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = React.useState<'TIMELINE' | 'MAP'>('TIMELINE');
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [infeasibleReasons, setInfeasibleReasons] = React.useState<string[]>([]);

  // Edit Tour Modal State
  const [isEditTourOpen, setIsEditTourOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editClientName, setEditClientName] = React.useState('');
  const [editDate, setEditDate] = React.useState('');
  const [editStart, setEditStart] = React.useState('');
  const [editFinish, setEditFinish] = React.useState('');

  // Quick Add MLS State
  const [showAddMlsInput, setShowAddMlsInput] = React.useState(false);
  const [addMlsNumber, setAddMlsNumber] = React.useState('');
  const [isAddingMls, setIsAddingMls] = React.useState(false);

  // Appointment Modal state
  const [activeMessageStop, setActiveMessageStop] = React.useState<TourStop | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = React.useState(false);

  // Client Email Modal state
  const [isClientEmailOpen, setIsClientEmailOpen] = React.useState(false);

  const loadWorkspace = React.useCallback(() => {
    const loaded = getTourById(tourId);
    if (!loaded) return;
    const { updatedTour, result } = optimizeTourSchedule(loaded);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
    if (updatedTour.stops.length > 0 && !selectedStopId) {
      setSelectedStopId(updatedTour.stops[0].id);
    }
  }, [tourId, selectedStopId]);

  React.useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  if (!tour) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading desktop workspace...
      </div>
    );
  }

  const handleOpenEditTourModal = () => {
    setEditName(tour.name);
    setEditClientName(tour.client_display_name || '');
    setEditDate(tour.tour_date);
    setEditStart(tour.earliest_start);
    setEditFinish(tour.latest_finish);
    setIsEditTourOpen(true);
  };

  const handleSaveTourSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Tour = {
      ...tour,
      name: editName,
      client_display_name: editClientName,
      tour_date: editDate,
      earliest_start: editStart,
      latest_finish: editFinish
    };

    const saved = saveTour(updated);
    setTour(saved);
    setIsEditTourOpen(false);
  };

  const handleDeleteTour = () => {
    if (confirm(`Are you sure you want to delete tour "${tour.name}"?`)) {
      deleteTour(tour.id);
      router.push('/');
    }
  };

  // Handle Stop Buffer Changes inline from TimelineView
  const handleUpdateStopBuffers = (stopId: string, visitMins: number, travelBufferMins: number) => {
    const updatedStops = tour.stops.map(s => {
      if (s.id === stopId) {
        return {
          ...s,
          visit_minutes: visitMins,
          travel_buffer_minutes: travelBufferMins
        };
      }
      return s;
    });

    const updated = { ...tour, stops: updatedStops };
    const { updatedTour, result } = optimizeTourSchedule(updated);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  const handleAddStopByMls = async () => {
    if (!addMlsNumber.trim()) return;
    setIsAddingMls(true);
    const listing = await lookupByMlsNumber(addMlsNumber);

    const newStop: TourStop = {
      id: `stop_${Date.now()}`,
      tour_id: tour.id,
      original_input: listing.mls_number,
      normalized_address: listing.normalized_address,
      latitude: listing.latitude,
      longitude: listing.longitude,
      geocode_status: 'RESOLVED',
      mls_number: listing.mls_number,
      list_price: listing.list_price,
      beds: listing.beds,
      baths: listing.baths,
      sqft: listing.sqft,
      image_url: listing.image_url,
      has_open_house: listing.has_open_house,
      open_house_start: listing.open_house_start,
      open_house_end: listing.open_house_end,
      listing_agent_name: listing.listing_agent_name,
      listing_agent_phone: listing.listing_agent_phone,
      listing_agent_email: listing.listing_agent_email,
      listing_brokerage: listing.listing_brokerage,
      agent_notes: listing.agent_notes,
      priority: 'PREFERRED',
      appointment_status: 'NOT_REQUESTED',
      scheduling_mode: 'FLEXIBLE',
      visit_minutes: tour.default_visit_minutes,
      access_before_minutes: tour.default_access_minutes,
      access_after_minutes: 0,
      travel_buffer_minutes: tour.default_travel_buffer,
      availability_windows: []
    };

    const updatedStops = [...tour.stops, newStop];
    const updatedTourObj = { ...tour, stops: updatedStops };
    const { updatedTour, result } = optimizeTourSchedule(updatedTourObj);

    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
    setSelectedStopId(newStop.id);
    setAddMlsNumber('');
    setShowAddMlsInput(false);
    setIsAddingMls(false);
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    const newStops = [...tour.stops];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newStops.length) return;

    const temp = newStops[index];
    newStops[index] = newStops[targetIdx];
    newStops[targetIdx] = temp;

    newStops.forEach((s, idx) => {
      s.planned_order = idx + 1;
    });

    const updated = { ...tour, stops: newStops };
    const { updatedTour, result } = optimizeTourSchedule(updated);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  const handleToggleLock = (stopId: string) => {
    const newStops = tour.stops.map(stop => {
      if (stop.id === stopId) {
        const isLocked = stop.scheduling_mode === 'TIME_LOCKED' || stop.appointment_status === 'CONFIRMED';
        return {
          ...stop,
          scheduling_mode: (isLocked ? 'FLEXIBLE' : 'TIME_LOCKED') as any
        };
      }
      return stop;
    });

    const updated = { ...tour, stops: newStops };
    const { updatedTour, result } = optimizeTourSchedule(updated);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  const handleUpdateStatus = (stopId: string, status: AppointmentStatus, confirmedTime?: string) => {
    const newStops = tour.stops.map(stop => {
      if (stop.id === stopId) {
        const updatedStop: TourStop = {
          ...stop,
          appointment_status: status,
          confirmed_start: status === 'CONFIRMED' ? (confirmedTime || stop.proposed_start) : stop.confirmed_start,
          scheduling_mode: status === 'CONFIRMED' ? 'TIME_LOCKED' : stop.scheduling_mode
        };
        return updatedStop;
      }
      return stop;
    });

    const updated = { ...tour, stops: newStops };
    const { updatedTour, result } = optimizeTourSchedule(updated);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  const handleReoptimize = () => {
    const { updatedTour, result } = optimizeTourSchedule(tour);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  return (
    <div className="space-y-4">
      {/* Workspace Header Toolbar */}
      <div className="bg-slate-900/90 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-800 shadow-lg space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Link
                href="/"
                className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              <span className="text-slate-700">/</span>
              <StatusBadge status={tour.status} type="tour" size="sm" />
            </div>

            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-white tracking-tight">
                {tour.name}
              </h1>
              <button
                onClick={handleOpenEditTourModal}
                title="Edit Tour Settings"
                className="p-1 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-800 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium">
              {tour.client_display_name && (
                <span>Client: <strong className="text-slate-200">{tour.client_display_name}</strong></span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-400" />
                {tour.tour_date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                Window: {tour.earliest_start} – {tour.latest_finish}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsClientEmailOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Client Itinerary</span>
            </button>

            <button
              onClick={() => setShowAddMlsInput(!showAddMlsInput)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add MLS #</span>
            </button>

            <button
              onClick={handleReoptimize}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Re-optimize</span>
            </button>

            <Link
              href={`/tours/${tour.id}/print`}
              target="_blank"
              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </Link>

            <button
              onClick={handleDeleteTour}
              title="Delete Tour"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Add Stop by MLS Number Bar */}
        {showAddMlsInput && (
          <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/50 flex flex-col sm:flex-row items-center gap-2 animate-fadeIn text-xs">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300 shrink-0">
              <Hash className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add MLS #:</span>
            </div>
            <input
              type="text"
              value={addMlsNumber}
              onChange={e => setAddMlsNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddStopByMls()}
              placeholder="e.g. ONEKEY-3501298 or 3489102"
              className="flex-1 w-full bg-slate-900 text-white text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
            <button
              disabled={isAddingMls || !addMlsNumber.trim()}
              onClick={handleAddStopByMls}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isAddingMls ? 'Fetching...' : 'Fetch & Add'}
            </button>
          </div>
        )}
      </div>

      {/* Conflict Banner */}
      <ConflictBanner
        tour={tour}
        warnings={warnings}
        infeasibleReasons={infeasibleReasons}
      />

      {/* Mobile Tab Toggle */}
      <div className="lg:hidden flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('TIMELINE')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'TIMELINE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Timeline View</span>
        </button>
        <button
          onClick={() => setActiveTab('MAP')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'MAP' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Route Map</span>
        </button>
      </div>

      {/* Side-by-Side Widescreen Desktop Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Timeline with inline buffer editing */}
        <div className={`lg:col-span-7 space-y-3 ${activeTab === 'MAP' ? 'hidden lg:block' : 'block'}`}>
          <TimelineView
            tour={tour}
            selectedStopId={selectedStopId}
            onSelectStop={setSelectedStopId}
            onToggleLock={handleToggleLock}
            onMoveStop={handleMoveStop}
            onOpenMessageModal={(stop) => {
              setActiveMessageStop(stop);
              setIsMessageModalOpen(true);
            }}
            onUpdateStopBuffers={handleUpdateStopBuffers}
          />
        </div>

        {/* Right Column (5 cols): Sticky Widescreen Map */}
        <div className={`lg:col-span-5 sticky top-14 h-[calc(100vh-5rem)] min-h-[450px] ${activeTab === 'TIMELINE' ? 'hidden lg:block' : 'block'}`}>
          <MapView
            tour={tour}
            selectedStopId={selectedStopId}
            onSelectStop={setSelectedStopId}
          />
        </div>
      </div>

      {/* Edit Tour Settings Modal */}
      {isEditTourOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleSaveTourSettings} className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                Edit Showing Tour Settings
              </h3>
              <button
                type="button"
                onClick={() => setIsEditTourOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Tour Title</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Client Name</label>
                <input
                  type="text"
                  value={editClientName}
                  onChange={e => setEditClientName(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Earliest Start</label>
                  <input
                    type="time"
                    value={editStart}
                    onChange={e => setEditStart(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Latest Finish</label>
                  <input
                    type="time"
                    value={editFinish}
                    onChange={e => setEditFinish(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditTourOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Tour Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointment Request Modal */}
      <AppointmentModal
        tour={tour}
        stop={activeMessageStop}
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Client Email Itinerary Modal */}
      <ClientEmailModal
        tour={tour}
        isOpen={isClientEmailOpen}
        onClose={() => setIsClientEmailOpen(false)}
      />
    </div>
  );
}
