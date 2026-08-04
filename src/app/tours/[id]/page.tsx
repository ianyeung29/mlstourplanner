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
import NavigationModal from '@/components/NavigationModal';
import AddBreakModal from '@/components/AddBreakModal';
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
  Navigation,
  Utensils
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

  // GPS Navigation & Calendar Modal state
  const [isNavigationOpen, setIsNavigationOpen] = React.useState(false);

  // Add Break Modal state
  const [isAddBreakOpen, setIsAddBreakOpen] = React.useState(false);

  const handleAddBreakStop = (breakStop: Partial<TourStop>) => {
    if (!tour) return;
    const newStop: TourStop = {
      id: `stop_break_${Date.now()}`,
      tour_id: tour.id,
      original_input: breakStop.original_input || 'Lunch Break',
      normalized_address: breakStop.normalized_address || 'Lunch Break',
      latitude: breakStop.latitude || 40.79,
      longitude: breakStop.longitude || -73.69,
      geocode_status: 'RESOLVED',
      priority: 'MUST_SEE',
      appointment_status: breakStop.appointment_status || 'CONFIRMED',
      scheduling_mode: breakStop.scheduling_mode || 'TIME_LOCKED',
      confirmed_start: breakStop.confirmed_start,
      proposed_start: breakStop.proposed_start,
      planned_arrival: breakStop.planned_arrival,
      visit_minutes: breakStop.visit_minutes || 45,
      access_before_minutes: 0,
      access_after_minutes: 0,
      travel_buffer_minutes: 5,
      agent_notes: breakStop.agent_notes,
      is_break: true,
      break_title: breakStop.break_title,
      availability_windows: []
    };

    const updatedStops = [...tour.stops, newStop];
    const draft = { ...tour, stops: updatedStops };
    const { updatedTour, result } = optimizeTourSchedule(draft);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

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
      <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
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
    const draft = {
      ...tour,
      name: editName,
      client_display_name: editClientName,
      tour_date: editDate,
      earliest_start: editStart,
      latest_finish: editFinish
    };
    const { updatedTour, result } = optimizeTourSchedule(draft);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
    setIsEditTourOpen(false);
  };

  const handleQuickUpdateTourHeader = (newDate: string, newStart: string, newFinish: string) => {
    const draft = {
      ...tour,
      tour_date: newDate,
      earliest_start: newStart,
      latest_finish: newFinish
    };
    const { updatedTour, result } = optimizeTourSchedule(draft);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  const handleToggleLock = (stopId: string) => {
    const updatedStops = tour.stops.map(s => {
      if (s.id === stopId) {
        const isLocked = s.scheduling_mode === 'TIME_LOCKED' || s.appointment_status === 'CONFIRMED';
        return {
          ...s,
          scheduling_mode: (isLocked ? 'FLEXIBLE' : 'TIME_LOCKED') as any
        };
      }
      return s;
    });

    const draft = { ...tour, stops: updatedStops };
    const { updatedTour, result } = optimizeTourSchedule(draft);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= tour.stops.length) return;

    const copy = [...tour.stops];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    copy.forEach((s, idx) => {
      s.planned_order = idx + 1;
    });

    const draft = { ...tour, stops: copy };
    const { updatedTour, result } = optimizeTourSchedule(draft, { preserveOrder: true });
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  const handleUpdateStopBuffers = (stopId: string, visitMins: number, travelBufferMins: number) => {
    const updatedStops = tour.stops.map(s => {
      if (s.id === stopId) {
        return { ...s, visit_minutes: visitMins, travel_buffer_minutes: travelBufferMins };
      }
      return s;
    });

    const draft = { ...tour, stops: updatedStops };
    const { updatedTour, result } = optimizeTourSchedule(draft);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  const handleUpdateStopPriority = (stopId: string, priority: any) => {
    const updatedStops = tour.stops.map(s => {
      if (s.id === stopId) {
        return { ...s, priority };
      }
      return s;
    });

    const draft = { ...tour, stops: updatedStops };
    const { updatedTour, result } = optimizeTourSchedule(draft);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  const handleRemoveStop = (stopId: string) => {
    const updatedStops = tour.stops.filter(s => s.id !== stopId);
    const draft = { ...tour, stops: updatedStops };
    const { updatedTour, result } = optimizeTourSchedule(draft);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  const handleSaveStopDetails = (updatedStop: TourStop) => {
    const updatedStops = tour.stops.map(s => s.id === updatedStop.id ? updatedStop : s);
    const draft = { ...tour, stops: updatedStops };
    const { updatedTour, result } = optimizeTourSchedule(draft);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
    setIsEditListingOpen(false);
  };

  const handleAddExtractedStops = async (extractedList: Partial<TourStop>[]) => {
    if (!extractedList || extractedList.length === 0) return;

    const newStops: Partial<TourStop>[] = await Promise.all(extractedList.map(async (extracted, idx) => {
      const targetAddr = extracted.normalized_address || extracted.original_input || '78 Shelter Rock Rd, Manhasset, NY 11030';
      const geocoded = await geocodeAddress(targetAddr);

      return {
        id: `stop_ai_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
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
        visit_minutes: tour.default_visit_minutes || 25,
        access_before_minutes: tour.default_access_minutes || 5,
        access_after_minutes: 0,
        travel_buffer_minutes: tour.default_travel_buffer || 5,
        availability_windows: []
      };
    }));

    const combined = [...tour.stops, ...newStops];
    const draft = { ...tour, stops: combined as TourStop[] };
    const { updatedTour, result } = optimizeTourSchedule(draft);
    saveTour(updatedTour);
    setTour(updatedTour);
    setWarnings(result.warnings);
    setInfeasibleReasons(result.infeasibleReasons || []);
  };

  const handleAddStopByMls = async () => {
    if (!addMlsNumber.trim()) return;
    setIsAddingMls(true);

    try {
      const listing = await lookupByMlsNumber(addMlsNumber);
      if (!listing) {
        alert(`No listing found for MLS #${addMlsNumber}`);
        setIsAddingMls(false);
        return;
      }

      const geocoded = await geocodeAddress(listing.normalized_address);

      const newStop: TourStop = {
        id: `stop_mls_${Date.now()}`,
        tour_id: tour.id,
        original_input: listing.normalized_address,
        normalized_address: geocoded.normalized_address || listing.normalized_address,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        geocode_status: geocoded.geocode_status,
        mls_number: listing.mls_number,
        list_price: listing.list_price,
        beds: listing.beds,
        baths: listing.baths,
        sqft: listing.sqft,
        listing_agent_name: listing.listing_agent_name,
        listing_agent_phone: listing.listing_agent_phone,
        listing_agent_email: listing.listing_agent_email,
        listing_brokerage: listing.listing_brokerage,
        priority: 'PREFERRED',
        appointment_status: 'NOT_REQUESTED',
        scheduling_mode: 'FLEXIBLE',
        visit_minutes: tour.default_visit_minutes || 25,
        access_before_minutes: tour.default_access_minutes || 5,
        access_after_minutes: 0,
        travel_buffer_minutes: tour.default_travel_buffer || 5,
        availability_windows: []
      };

      const combined = [...tour.stops, newStop];
      const draft = { ...tour, stops: combined };
      const { updatedTour, result } = optimizeTourSchedule(draft);
      saveTour(updatedTour);
      setTour(updatedTour);
      setWarnings(result.warnings);
      setInfeasibleReasons(result.infeasibleReasons || []);
      setAddMlsNumber('');
      setShowAddMlsInput(false);
    } catch (err: any) {
      alert(err.message || 'Error adding MLS listing.');
    } finally {
      setIsAddingMls(false);
    }
  };

  const handleDeleteTour = () => {
    if (confirm(`Delete tour "${tour.name}"?`)) {
      deleteTour(tour.id);
      router.push('/dashboard');
    }
  };

  const handleReoptimize = async () => {
    setIsOptimizing(true);

    try {
      const res = await fetch('/api/google-route-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_address: tour.start_address || '100 Northern Blvd, Great Neck, NY 11021',
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
    <div className="space-y-4 font-sans pb-8">
      {/* Workspace Header Toolbar */}
      <div className="bg-white dark:bg-slate-900/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Link
                href="/dashboard"
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <StatusBadge status={tour.status} type="tour" size="sm" />
            </div>

            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {tour.name}
              </h1>
              <button
                onClick={handleOpenEditTourModal}
                title="Edit Tour Settings"
                className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              {tour.client_display_name && (
                <span>Client: <strong className="text-slate-900 dark:text-slate-200">{tour.client_display_name}</strong></span>
              )}
              
              {/* Inline Interactive Tour Date Picker */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Date:</span>
                <input
                  type="date"
                  value={tour.tour_date}
                  onChange={(e) => handleQuickUpdateTourHeader(e.target.value, tour.earliest_start, tour.latest_finish)}
                  className="bg-transparent text-slate-900 dark:text-white font-extrabold text-xs focus:outline-none cursor-pointer"
                />
              </div>

              {/* Inline Interactive Tour Timeframe Window Pickers */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Window:</span>
                <input
                  type="time"
                  value={tour.earliest_start}
                  onChange={(e) => handleQuickUpdateTourHeader(tour.tour_date, e.target.value, tour.latest_finish)}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold text-xs px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                />
                <span className="text-slate-400 dark:text-slate-500 font-bold">–</span>
                <input
                  type="time"
                  value={tour.latest_finish}
                  onChange={(e) => handleQuickUpdateTourHeader(tour.tour_date, tour.earliest_start, e.target.value)}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold text-xs px-1 py-0.5 rounded border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar: Compact Single Horizontal Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 shrink-0">
            <button
              onClick={() => setIsClientEmailOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition-colors shrink-0 cursor-pointer"
            >
              <Mail className="w-3 h-3" />
              <span>Email Client Itinerary</span>
            </button>

            {/* 1-Tap Mobile GPS Route Navigation & Calendar Export */}
            <button
              onClick={() => setIsNavigationOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition-colors shrink-0 cursor-pointer"
            >
              <Navigation className="w-3 h-3 text-indigo-200" />
              <span>GPS & Calendar</span>
            </button>

            {/* DeepSeek AI Document Scanner Trigger */}
            <button
              onClick={() => setIsAiUploadOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <Sparkles className="w-3 h-3 text-purple-200" />
              <span>+ AI Scan PDF / Image</span>
            </button>

            {/* Lunch / Coffee Rest Break Trigger */}
            <button
              onClick={() => setIsAddBreakOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-[11px] font-bold flex items-center gap-1 shadow transition-colors shrink-0 cursor-pointer"
            >
              <Utensils className="w-3 h-3 text-amber-100" />
              <span>+ Add Break</span>
            </button>

            <button
              onClick={handleReoptimize}
              disabled={isOptimizing}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 text-[11px] font-bold flex items-center gap-1 shadow-all disabled:opacity-50 cursor-pointer shrink-0"
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
              className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white border border-indigo-200 dark:border-indigo-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0"
            >
              <Printer className="w-3 h-3" />
              <span>Print Sheet</span>
            </Link>

            <button
              onClick={handleDeleteTour}
              title="Delete Tour"
              className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 text-slate-500 dark:text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Conflict Banner */}
      <ConflictBanner
        tour={tour}
        warnings={warnings}
        infeasibleReasons={infeasibleReasons}
      />

      {/* Mobile Tab Toggle */}
      <div className="lg:hidden flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('TIMELINE')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'TIMELINE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Timeline View</span>
        </button>
        <button
          onClick={() => setActiveTab('MAP')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            activeTab === 'MAP' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400'
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

        {/* Right Column (5 cols): Interactive Google Map */}
        <div className={`lg:col-span-5 sticky top-16 h-[calc(100vh-8rem)] min-h-[400px] ${activeTab === 'TIMELINE' ? 'hidden lg:block' : 'block'}`}>
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

      {/* Route Options Multi-Sequence Comparison Modal */}
      <RouteOptionModal
        isOpen={isRouteOptionModalOpen}
        options={routeOptions}
        onClose={() => setIsRouteOptionModalOpen(false)}
        onSelectOption={handleSelectRouteOption}
      />

      {/* DeepSeek AI Document Scanner Upload Modal */}
      <AiUploadModal
        isOpen={isAiUploadOpen}
        onClose={() => setIsAiUploadOpen(false)}
        onAddExtractedStops={handleAddExtractedStops}
      />

      {/* Edit Property Listing Information Modal */}
      <EditListingModal
        stop={activeEditStop}
        isOpen={isEditListingOpen}
        onClose={() => setIsEditListingOpen(false)}
        onSaveStop={handleSaveStopDetails}
      />

      {/* Showing Notes & Appointment Status Modal */}
      <AppointmentModal
        tour={tour}
        stop={activeMessageStop}
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        onUpdateStatus={(stopId, status, confirmedTime) => {
          const updatedStops = tour.stops.map(s => {
            if (s.id === stopId) {
              return {
                ...s,
                appointment_status: status,
                confirmed_start: confirmedTime || s.confirmed_start
              };
            }
            return s;
          });
          const draft = { ...tour, stops: updatedStops };
          const { updatedTour, result } = optimizeTourSchedule(draft);
          saveTour(updatedTour);
          setTour(updatedTour);
          setWarnings(result.warnings);
          setInfeasibleReasons(result.infeasibleReasons || []);
          setIsMessageModalOpen(false);
        }}
      />

      {/* Email Listing Agent Appointment Request Modal */}
      <AgentAppointmentEmailModal
        stop={activeAgentEmailStop}
        tour={tour}
        isOpen={isAgentEmailOpen}
        onClose={() => setIsAgentEmailOpen(false)}
      />

      {/* Email Client Itinerary Modal */}
      <ClientEmailModal
        tour={tour}
        isOpen={isClientEmailOpen}
        onClose={() => setIsClientEmailOpen(false)}
      />

      {/* GPS Driving Navigation & Calendar Modal */}
      <NavigationModal
        tour={tour}
        isOpen={isNavigationOpen}
        onClose={() => setIsNavigationOpen(false)}
      />

      {/* Add Lunch / Rest Break Modal */}
      <AddBreakModal
        isOpen={isAddBreakOpen}
        onClose={() => setIsAddBreakOpen(false)}
        onAddBreak={handleAddBreakStop}
      />

      {/* Edit Tour Name & Schedule Modal */}
      {isEditTourOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleSaveTourSettings} className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Edit Tour Header & Constraints</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditTourOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Tour Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Buyer Client Name</label>
                <input
                  type="text"
                  value={editClientName}
                  onChange={e => setEditClientName(e.target.value)}
                  placeholder="e.g. Smith Family"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Date</label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Start Time</label>
                  <input
                    type="time"
                    required
                    value={editStart}
                    onChange={e => setEditStart(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Finish Time</label>
                  <input
                    type="time"
                    required
                    value={editFinish}
                    onChange={e => setEditFinish(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditTourOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Sticky Glassmorphic Action Bar (Fixed to bottom of screen on mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-2 shadow-2xl flex items-center justify-around gap-1.5 font-sans text-[10px] font-bold">
        <button
          onClick={() => setIsNavigationOpen(true)}
          className="flex-1 py-2 rounded-xl bg-indigo-600 text-white flex flex-col items-center justify-center gap-0.5 shadow-md active:scale-95 transition-transform cursor-pointer"
        >
          <Navigation className="w-4 h-4 text-indigo-100" />
          <span>GPS & Cal</span>
        </button>

        <button
          onClick={handleReoptimize}
          disabled={isOptimizing}
          className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex flex-col items-center justify-center gap-0.5 border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform disabled:opacity-50 cursor-pointer"
        >
          {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          <span>Optimize</span>
        </button>

        <button
          onClick={() => setIsClientEmailOpen(true)}
          className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex flex-col items-center justify-center gap-0.5 border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform cursor-pointer"
        >
          <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Share</span>
        </button>

        <button
          onClick={() => setIsAiUploadOpen(true)}
          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex flex-col items-center justify-center gap-0.5 shadow-md active:scale-95 transition-transform cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-purple-200" />
          <span>AI Scan</span>
        </button>
      </div>
    </div>
  );
}
