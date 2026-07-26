'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tour, TourStop, AppointmentStatus } from '@/types/tour';
import { getTourById, saveTour, deleteTour } from '@/services/storage';
import { optimizeTourSchedule, reorderStopsForShortestRoute, reorderStopsWithGoogle } from '@/services/routeOptimizer';
import { lookupByMlsNumber } from '@/services/mlsService';
import { geocodeAddress } from '@/services/geocode';
import TimelineView from '@/components/TimelineView';
import MapView from '@/components/MapView';
import StatusBadge from '@/components/StatusBadge';
import ConflictBanner from '@/components/ConflictBanner';
import AppointmentModal from '@/components/AppointmentModal';
import ClientEmailModal from '@/components/ClientEmailModal';
import AgentAppointmentEmailModal from '@/components/AgentAppointmentEmailModal';
import AiUploadModal from '@/components/AiUploadModal';
import EditListingModal from '@/components/EditListingModal';
import RouteOptionModal, { RouteOption } from '@/components/RouteOptionModal';
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
  Save,
  Sparkles,
  Loader2,
  Navigation
} from 'lucide-react';

export default function TourWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const tourId = params.id as string;

  const [tour, setTour] = React.useState<Tour | null>(null);
  const [activeFieldStopIndex, setActiveFieldStopIndex] = React.useState(0);
  const [selectedStopId, setSelectedStopId] = React.useState<string | undefined>(undefined);
  const [hoveredStopId, setHoveredStopId] = React.useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = React.useState<'TIMELINE' | 'MAP'>('TIMELINE');
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [infeasibleReasons, setInfeasibleReasons] = React.useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = React.useState(false);

  // Route Options Modal State
  const [routeOptions, setRouteOptions] = React.useState<RouteOption[]>([]);
  const [isRouteOptionModalOpen, setIsRouteOptionModalOpen] = React.useState(false);

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

  // AI Upload Modal state
  const [isAiUploadOpen, setIsAiUploadOpen] = React.useState(false);

  // Edit Listing Modal state
  const [activeEditStop, setActiveEditStop] = React.useState<TourStop | null>(null);
  const [isEditListingOpen, setIsEditListingOpen] = React.useState(false);

  // Appointment Modal state
  const [activeMessageStop, setActiveMessageStop] = React.useState<TourStop | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = React.useState(false);

  // Client Email Modal state
  const [isClientEmailOpen, setIsClientEmailOpen] = React.useState(false);

  // Agent Appointment Email Modal state
  const [activeAgentEmailStop, setActiveAgentEmailStop] = React.useState<TourStop | null>(null);
  const [isAgentEmailOpen, setIsAgentEmailOpen] = React.useState(false);

  const handleOpenAgentEmailModal = (stop: TourStop) => {
    setActiveAgentEmailStop(stop);
    setIsAgentEmailOpen(true);
  };

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

  const handleQuickUpdateTourHeader = (newDate: string, newStart: string, newFinish: string) => {
    if (!tour) return;
    const updated: Tour = {
      ...tour,
      tour_date: newDate,
      earliest_start: newStart,
      latest_finish: newFinish
    };

    const { updatedTour, result } = optimizeTourSchedule(updated);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  const handleDeleteTour = () => {
    if (confirm(`Are you sure you want to delete tour "${tour.name}"?`)) {
      deleteTour(tour.id);
      router.push('/');
    }
  };

  // Handle manual saving of modified listing details
  const handleSaveStopDetails = (updatedStop: TourStop) => {
    const updatedStops = tour.stops.map(s => s.id === updatedStop.id ? updatedStop : s);
    const updated = { ...tour, stops: updatedStops };
    const { updatedTour, result } = optimizeTourSchedule(updated);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
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

  const handleUpdateStopPriority = (stopId: string, priority: 'MUST_SEE' | 'PREFERRED' | 'OPTIONAL') => {
    const updatedStops = tour.stops.map(s => s.id === stopId ? { ...s, priority } : s);
    const updated = { ...tour, stops: updatedStops };
    const { updatedTour, result } = optimizeTourSchedule(updated);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  const handleRemoveStop = (stopId: string) => {
    const updatedStops = tour.stops.filter(s => s.id !== stopId);
    updatedStops.forEach((s, idx) => {
      s.planned_order = idx + 1;
    });

    const updated = { ...tour, stops: updatedStops };
    const { updatedTour, result } = optimizeTourSchedule(updated);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
    if (selectedStopId === stopId) {
      setSelectedStopId(updatedStops.length > 0 ? updatedStops[0].id : undefined);
    }
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
    const { tour: reorderedTour } = await reorderStopsWithGoogle({ ...tour, stops: updatedStops });
    const { updatedTour, result } = optimizeTourSchedule(reorderedTour);

    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
    setSelectedStopId(newStop.id);
    setAddMlsNumber('');
    setShowAddMlsInput(false);
    setIsAddingMls(false);
  };

  const handleAddExtractedStops = async (extractedList: Partial<TourStop>[]) => {
    if (!extractedList || extractedList.length === 0) return;

    const newStops: TourStop[] = await Promise.all(extractedList.map(async (extracted, idx) => {
      const targetAddr = extracted.normalized_address || extracted.original_input || '78 Shelter Rock Rd, Manhasset, NY 11030';
      const geocoded = await geocodeAddress(targetAddr);

      return {
        id: `stop_ai_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
        tour_id: tour.id,
        original_input: targetAddr,
        normalized_address: geocoded.normalized_address || targetAddr,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        geocode_status: 'RESOLVED',
        mls_number: extracted.mls_number || `ONEKEY-${Math.floor(1000000 + Math.random() * 9000000)}`,
        list_price: extracted.list_price || 2150000,
        beds: extracted.beds || 5,
        baths: extracted.baths || 4.5,
        sqft: extracted.sqft || 3850,
        image_url: extracted.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        has_open_house: extracted.has_open_house || false,
        open_house_start: extracted.open_house_start,
        open_house_end: extracted.open_house_end,
        listing_agent_name: extracted.listing_agent_name || 'N/A',
        listing_agent_phone: extracted.listing_agent_phone || 'N/A',
        listing_agent_email: extracted.listing_agent_email || 'N/A',
        listing_brokerage: extracted.listing_brokerage || 'N/A',
        agent_notes: extracted.agent_notes || 'Extracted via DeepSeek AI Scanner',
        priority: 'PREFERRED',
        appointment_status: 'NOT_REQUESTED',
        scheduling_mode: 'FLEXIBLE',
        visit_minutes: tour.default_visit_minutes,
        access_before_minutes: tour.default_access_minutes,
        access_after_minutes: 0,
        travel_buffer_minutes: tour.default_travel_buffer,
        availability_windows: []
      };
    }));

    const updatedStops = [...tour.stops, ...newStops];
    const { tour: reorderedTour } = await reorderStopsWithGoogle({ ...tour, stops: updatedStops });
    const { updatedTour, result } = optimizeTourSchedule(reorderedTour);

    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
    if (newStops.length > 0) {
      setSelectedStopId(newStops[0].id);
    }
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

  const handleReoptimize = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/google-route-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stops: tour.stops,
          earliest_start: tour.earliest_start,
          latest_finish: tour.latest_finish
        })
      });
      const data = await res.json();

      if (data.options && data.options.length > 0) {
        setRouteOptions(data.options);
        setIsRouteOptionModalOpen(true);
      } else {
        const { tour: reordered } = await reorderStopsWithGoogle(tour);
        const { updatedTour, result } = optimizeTourSchedule(reordered);
        saveTour(updatedTour);
        setTour(updatedTour);
        setWarnings(result.warnings);
        setInfeasibleReasons(result.infeasibleReasons || []);
      }
    } catch (e) {
      const { tour: reordered } = await reorderStopsWithGoogle(tour);
      const { updatedTour, result } = optimizeTourSchedule(reordered);
      saveTour(updatedTour);
      setTour(updatedTour);
      setWarnings(result.warnings);
      setInfeasibleReasons(result.infeasibleReasons || []);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSelectRouteOption = (option: RouteOption) => {
    const updated = { ...tour, stops: option.stops };
    const { updatedTour, result } = optimizeTourSchedule(updated);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  return (
    <div className="space-y-4">
      {/* Workspace Header Toolbar */}
      <div className="bg-slate-900/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-lg space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Link
                href="/dashboard"
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
              
              {/* Inline Interactive Tour Date Picker */}
              <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-slate-400 font-semibold">Date:</span>
                <input
                  type="date"
                  value={tour.tour_date}
                  onChange={(e) => handleQuickUpdateTourHeader(e.target.value, tour.earliest_start, tour.latest_finish)}
                  className="bg-transparent text-white font-extrabold text-xs focus:outline-none cursor-pointer"
                />
              </div>

              {/* Inline Interactive Tour Timeframe Window Pickers */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-slate-400 font-semibold">Window:</span>
                <input
                  type="time"
                  value={tour.earliest_start}
                  onChange={(e) => handleQuickUpdateTourHeader(tour.tour_date, e.target.value, tour.latest_finish)}
                  className="bg-slate-900 text-white font-extrabold text-xs px-1 py-0.5 rounded border border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                />
                <span className="text-slate-500 font-bold">–</span>
                <input
                  type="time"
                  value={tour.latest_finish}
                  onChange={(e) => handleQuickUpdateTourHeader(tour.tour_date, tour.earliest_start, e.target.value)}
                  className="bg-slate-900 text-white font-extrabold text-xs px-1 py-0.5 rounded border border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar: Compact Single Horizontal Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 shrink-0">
            <button
              onClick={() => setIsClientEmailOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition-colors shrink-0"
            >
              <Mail className="w-3 h-3" />
              <span>Email Client Itinerary</span>
            </button>

            {/* DeepSeek AI Document Scanner Trigger */}
            <button
              onClick={() => setIsAiUploadOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3 h-3 text-purple-200" />
              <span>+ AI Scan PDF / Image</span>
            </button>

            <button
              onClick={() => setShowAddMlsInput(!showAddMlsInput)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition-colors shrink-0"
            >
              <Plus className="w-3 h-3" />
              <span>+ Add MLS #</span>
            </button>

            <button
              onClick={handleReoptimize}
              disabled={isOptimizing}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 text-[11px] font-bold flex items-center gap-1 shadow transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isOptimizing ? (
                <Loader2 className="w-3 h-3 animate-spin text-white" />
              ) : (
                <RefreshCw className="w-3 h-3 text-white" />
              )}
              <span>Re-optimize</span>
            </button>

            <Link
              href={`/tours/${tour.id}/print`}
              target="_blank"
              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0"
            >
              <Printer className="w-3 h-3" />
              <span>Print Sheet</span>
            </Link>

            <button
              onClick={handleDeleteTour}
              title="Delete Tour"
              className="p-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors shrink-0"
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
            hoveredStopId={hoveredStopId}
            onSelectStop={setSelectedStopId}
            onHoverStop={setHoveredStopId}
            onToggleLock={handleToggleLock}
            onMoveStop={handleMoveStop}
            onOpenMessageModal={(stop) => {
              setActiveMessageStop(stop);
              setIsMessageModalOpen(true);
            }}
            onOpenEditListingModal={(stop) => {
              setActiveEditStop(stop);
              setIsEditListingOpen(true);
            }}
            onOpenAgentEmailModal={handleOpenAgentEmailModal}
            onUpdateStopBuffers={handleUpdateStopBuffers}
            onUpdateStopPriority={handleUpdateStopPriority}
            onRemoveStop={handleRemoveStop}
            onReoptimize={handleReoptimize}
            isOptimizing={isOptimizing}
          />
        </div>

        {/* Right Column (5 cols): Sticky Widescreen Map on Desktop, Full-Height View on Mobile */}
        <div className={`lg:col-span-5 lg:sticky lg:top-14 h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)] min-h-[400px] ${activeTab === 'TIMELINE' ? 'hidden lg:block' : 'block'}`}>
          <MapView
            tour={tour}
            selectedStopId={selectedStopId}
            hoveredStopId={hoveredStopId}
            onSelectStop={setSelectedStopId}
            onHoverStop={setHoveredStopId}
            onRemoveStop={handleRemoveStop}
          />
        </div>
      </div>

      {/* Multi-Option Route Optimization Selection Modal */}
      <RouteOptionModal
        isOpen={isRouteOptionModalOpen}
        onClose={() => setIsRouteOptionModalOpen(false)}
        options={routeOptions}
        onSelectOption={handleSelectRouteOption}
      />

      {/* Edit Listing Details Modal */}
      <EditListingModal
        stop={activeEditStop}
        isOpen={isEditListingOpen}
        onClose={() => setIsEditListingOpen(false)}
        onSaveStop={handleSaveStopDetails}
      />

      {/* DeepSeek AI Document Scanner Upload Modal */}
      <AiUploadModal
        isOpen={isAiUploadOpen}
        onClose={() => setIsAiUploadOpen(false)}
        onAddExtractedStops={handleAddExtractedStops}
      />

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

      {/* Listing Agent Appointment Email Modal */}
      <AgentAppointmentEmailModal
        stop={activeAgentEmailStop}
        tour={tour}
        isOpen={isAgentEmailOpen}
        onClose={() => setIsAgentEmailOpen(false)}
      />

      {/* 📱 Mobile Outdoor Field Mode: Sticky "Next Showing Stop" Navigation Bar */}
      {tour && tour.stops && tour.stops.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-slate-900/98 backdrop-blur-md border-t border-indigo-500/50 shadow-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow">
                #{activeFieldStopIndex + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-white text-xs truncate">
                  {tour.stops[activeFieldStopIndex]?.normalized_address || 'Property Stop'}
                </div>
                <div className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Arrives: {tour.stops[activeFieldStopIndex]?.planned_arrival || 'TBD'}</span>
                </div>
              </div>
            </div>

            {/* Thumb Navigation Controls */}
            <div className="flex items-center space-x-1 shrink-0">
              <button
                type="button"
                disabled={activeFieldStopIndex === 0}
                onClick={() => setActiveFieldStopIndex(prev => Math.max(0, prev - 1))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={activeFieldStopIndex >= tour.stops.length - 1}
                onClick={() => setActiveFieldStopIndex(prev => Math.min(tour.stops.length - 1, prev + 1))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>

          {/* 1-Tap Google Maps GPS Navigation Launch Button */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(tour.stops[activeFieldStopIndex]?.normalized_address || '')}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-white" />
            <span>Launch Google Maps GPS Navigation (Stop #{activeFieldStopIndex + 1})</span>
          </a>
        </div>
      )}
    </div>
  );
}
