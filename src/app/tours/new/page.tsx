'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tour, TourStop, ClientContact } from '@/types/tour';
import { batchGeocodeAddresses, geocodeAddress } from '@/services/geocode';
import { lookupByMlsNumber, batchLookupMlsNumbers, MlsListingResult } from '@/services/mlsService';
import { saveTour, getUserProfile, getContactsFromStorage } from '@/services/storage';
import { optimizeTourSchedule } from '@/services/routeOptimizer';
import AiUploadModal from '@/components/AiUploadModal';
import EditListingModal from '@/components/EditListingModal';
import AppointmentModal from '@/components/AppointmentModal';
import AgentAppointmentEmailModal from '@/components/AgentAppointmentEmailModal';
import TourStageBar from '@/components/TourStageBar';
import TimelineView from '@/components/TimelineView';
import MapView from '@/components/MapView';
import ClientEmailModal from '@/components/ClientEmailModal';
import AddBreakModal from '@/components/AddBreakModal';
import { triggerAuthModal } from '@/services/authModal';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  Users,
  UploadCloud,
  FileText,
  Share2,
  Copy,
  Printer,
  Mail,
  Sliders,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Check,
  Edit2,
  Utensils
} from 'lucide-react';
import Link from 'next/link';

function NewTourWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactIdParam = searchParams.get('contactId');

  const profile = getUserProfile();
  const contacts = getContactsFromStorage();
  const isLoggedIn = !!profile && !!profile.email && !!profile.id;

  // 3 Stages: 1 = Properties, 2 = Route, 3 = Share
  const [stage, setStage] = React.useState<1 | 2 | 3>(1);
  const [inputMode, setInputMode] = React.useState<'AI' | 'ADDRESS'>('AI');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [isAiUploadOpen, setIsAiUploadOpen] = React.useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = React.useState(false);
  const [isClientEmailOpen, setIsClientEmailOpen] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Modals for Stop Action Toolbar (Edit, Lock, Email, Notes)
  const [activeEditStop, setActiveEditStop] = React.useState<TourStop | null>(null);
  const [isEditListingOpen, setIsEditListingOpen] = React.useState(false);

  const [activeMessageStop, setActiveMessageStop] = React.useState<TourStop | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = React.useState(false);

  const [activeAgentEmailStop, setActiveAgentEmailStop] = React.useState<TourStop | null>(null);
  const [isAgentEmailOpen, setIsAgentEmailOpen] = React.useState(false);

  // Add Break Modal state
  const [isAddBreakOpen, setIsAddBreakOpen] = React.useState(false);

  const handleAddBreakStop = (breakStop: Partial<TourStop>) => {
    if (!savedTour) return;
    const newStop: TourStop = {
      id: `stop_break_${Date.now()}`,
      tour_id: savedTour.id,
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

    const updatedStops = [...savedTour.stops, newStop];
    buildAndOptimizeTour(updatedStops);
  };

  // Form State (Defaulted automatically from agent saved preferences)
  const [name, setName] = React.useState('Showing Tour');
  const [selectedContactId, setSelectedContactId] = React.useState<string>(contactIdParam || (contacts.length > 0 ? contacts[0].id : ''));
  const [clientDisplayName, setClientDisplayName] = React.useState<string>('');
  const [clientEmail, setClientEmail] = React.useState<string>('');

  React.useEffect(() => {
    const targetId = contactIdParam || (contacts.length > 0 ? contacts[0].id : '');
    if (targetId) {
      const found = contacts.find(c => c.id === targetId);
      if (found) {
        setSelectedContactId(found.id);
        setClientDisplayName(found.name);
        setClientEmail(found.email);
        setName(`${found.name} Showing Tour`);
      }
    }
  }, [contactIdParam]);

  const [tourDate, setTourDate] = React.useState('2026-07-26');
  const [earliestStart, setEarliestStart] = React.useState('09:30');
  const [latestFinish, setLatestFinish] = React.useState('16:00');
  const [startAddress, setStartAddress] = React.useState(
    profile.default_start_address || '100 Northern Blvd, Great Neck, NY 11021'
  );
  const [defaultVisitMins, setDefaultVisitMins] = React.useState(profile.default_visit_minutes || 25);
  const [defaultAccessMins, setDefaultAccessMins] = React.useState(profile.default_access_minutes || 5);
  const [defaultTravelBuffer, setDefaultTravelBuffer] = React.useState(profile.default_travel_buffer || 5);

  // Default candidate addresses pre-filled for 1-click instant route generation
  const [bulkAddressInput, setBulkAddressInput] = React.useState(
    `123 Main St, Great Neck, NY\n45 Harbor Rd, Manhasset, NY\n12 Northern Blvd, Roslyn, NY\n88 Forest Ave, Glen Cove, NY`
  );

  const [stops, setStops] = React.useState<Partial<TourStop>[]>([]);
  const [savedTour, setSavedTour] = React.useState<Tour | null>(null);

  // Update client fields when contact dropdown selected
  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId);
    const found = contacts.find(c => c.id === contactId);
    if (found) {
      setClientDisplayName(found.name);
      setClientEmail(found.email);
      setName(`${found.name} Showing Tour`);
    }
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
        priority: (idx === 0 && stops.length === 0) ? 'MUST_SEE' : 'PREFERRED',
        appointment_status: 'NOT_REQUESTED',
        scheduling_mode: 'FLEXIBLE',
        visit_minutes: defaultVisitMins,
        access_before_minutes: defaultAccessMins,
        access_after_minutes: 0,
        travel_buffer_minutes: defaultTravelBuffer,
        availability_windows: []
      };
    }));

    const combined = [...stops, ...newStops];
    setStops(combined);
    buildAndOptimizeTour(combined, tourDate, earliestStart, latestFinish);
  };

  const handleProcessBulkInput = async () => {
    setLoading(true);

    const addressLines = bulkAddressInput
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (addressLines.length === 0 && stops.length === 0) {
      if (inputMode === 'AI') {
        setIsAiUploadOpen(true);
        setLoading(false);
        return;
      }
      alert('Please enter at least one property address.');
      setLoading(false);
      return;
    }

    let combinedStops = [...stops];

    if (addressLines.length > 0) {
      const geocodedResults = await batchGeocodeAddresses(addressLines);
      const newStops: Partial<TourStop>[] = geocodedResults.map((geo, idx) => ({
        id: `stop_${Date.now()}_${idx}`,
        original_input: addressLines[idx],
        normalized_address: geo.normalized_address,
        latitude: geo.latitude,
        longitude: geo.longitude,
        geocode_status: geo.geocode_status,
        mls_number: geo.mls_number,
        list_price: geo.list_price,
        beds: geo.beds,
        baths: geo.baths,
        sqft: geo.sqft,
        listing_agent_name: geo.listing_agent_name,
        listing_agent_phone: geo.listing_agent_phone,
        listing_agent_email: geo.listing_agent_email,
        listing_brokerage: geo.listing_brokerage,
        priority: (idx === 0 && stops.length === 0) ? 'MUST_SEE' : 'PREFERRED',
        appointment_status: 'NOT_REQUESTED',
        scheduling_mode: 'FLEXIBLE',
        visit_minutes: defaultVisitMins,
        access_before_minutes: defaultAccessMins,
        access_after_minutes: 0,
        travel_buffer_minutes: defaultTravelBuffer,
        availability_windows: []
      }));
      combinedStops = [...combinedStops, ...newStops];
      setStops(combinedStops);
    }

    setLoading(false);
    buildAndOptimizeTour(combinedStops, tourDate, earliestStart, latestFinish);
  };

  const buildAndOptimizeTour = (
    currentStops: Partial<TourStop>[],
    targetDate: string = tourDate,
    targetStart: string = earliestStart,
    targetFinish: string = latestFinish,
    options?: { preserveOrder?: boolean }
  ) => {
    const draftTour: Tour = {
      id: savedTour?.id || `tour_${Date.now()}`,
      name: name || 'Showing Tour',
      client_display_name: clientDisplayName,
      client_email: clientEmail,
      client_id: selectedContactId,
      status: 'DRAFT',
      tour_date: targetDate,
      timezone: 'America/New_York',
      earliest_start: targetStart,
      latest_finish: targetFinish,
      start_input: startAddress,
      start_address: startAddress,
      start_latitude: 40.7865,
      start_longitude: -73.7285,
      default_visit_minutes: defaultVisitMins,
      default_access_minutes: defaultAccessMins,
      default_travel_buffer: defaultTravelBuffer,
      stops: currentStops as TourStop[],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const persisted = saveTour(draftTour, options);
    setSavedTour(persisted);
    setStops(persisted.stops);
    setStage(2);
  };

  const handleUpdateDateTime = (newDate: string, newStart: string, newFinish: string) => {
    setTourDate(newDate);
    setEarliestStart(newStart);
    setLatestFinish(newFinish);
    if (savedTour) {
      buildAndOptimizeTour(savedTour.stops, newDate, newStart, newFinish);
    }
  };

  const handleToggleLock = (stopId: string) => {
    if (!savedTour) return;
    const updatedStops = savedTour.stops.map(s => {
      if (s.id === stopId) {
        const isLocked = s.scheduling_mode === 'TIME_LOCKED' || s.appointment_status === 'CONFIRMED';
        return {
          ...s,
          scheduling_mode: (isLocked ? 'FLEXIBLE' : 'TIME_LOCKED') as any
        };
      }
      return s;
    });
    buildAndOptimizeTour(updatedStops);
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    if (!savedTour) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= savedTour.stops.length) return;

    const copy = [...savedTour.stops];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    copy.forEach((s, idx) => {
      s.planned_order = idx + 1;
    });

    buildAndOptimizeTour(copy, tourDate, earliestStart, latestFinish, { preserveOrder: true });
  };

  const handleSaveStopDetails = (updatedStop: TourStop) => {
    if (!savedTour) return;
    const updatedStops = savedTour.stops.map(s => s.id === updatedStop.id ? updatedStop : s);
    buildAndOptimizeTour(updatedStops);
    setIsEditListingOpen(false);
  };

  const handleUpdateStopBuffers = (stopId: string, visitMins: number, travelBufferMins: number) => {
    if (!savedTour) return;
    const updatedStops = savedTour.stops.map(s => {
      if (s.id === stopId) {
        return { ...s, visit_minutes: visitMins, travel_buffer_minutes: travelBufferMins };
      }
      return s;
    });
    buildAndOptimizeTour(updatedStops);
  };

  const handleUpdateStopPriority = (stopId: string, priority: any) => {
    if (!savedTour) return;
    const updatedStops = savedTour.stops.map(s => {
      if (s.id === stopId) {
        return { ...s, priority };
      }
      return s;
    });
    buildAndOptimizeTour(updatedStops);
  };

  const handleRemoveStop = (stopId: string) => {
    if (!savedTour) return;
    const updatedStops = savedTour.stops.filter(s => s.id !== stopId);
    buildAndOptimizeTour(updatedStops);
  };

  const handleReoptimize = () => {
    if (savedTour) {
      buildAndOptimizeTour(savedTour.stops);
    }
  };

  const handleCopyClientLink = () => {
    if (!savedTour) return;
    const url = `${window.location.origin}/tours/${savedTour.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* 3-Stage Progress Indicator */}
      <TourStageBar
        currentStage={stage}
        onSelectStage={(targetStage) => setStage(targetStage)}
        canNavigateToRoute={stops.length > 0}
        canNavigateToShare={stops.length > 0}
      />

      {/* Guest Account Creation Callout Banner */}
      {!isLoggedIn && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/40 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 text-indigo-950 dark:text-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span><strong>Guest Tour Sandbox:</strong> You are building a sample tour. Create a free account to save and dispatch this itinerary to your buyer!</span>
          </div>
          <button
            type="button"
            onClick={() => triggerAuthModal()}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow"
          >
            Create Free Account
          </button>
        </div>
      )}

      {/* STAGE 1: Add Listings (Properties) */}
      {stage === 1 && (
        <div className="max-w-[1000px] mx-auto space-y-5 animate-fadeIn">
          {/* Main Hero Input Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Add Properties & Listings</h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">Upload listing flyers, paste addresses, or scan PDFs to build your showing route</p>
              </div>

              {/* 2 Primary Mode Tabs: AI Scan (Primary) & Address List */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setInputMode('AI')}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                    inputMode === 'AI' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-purple-700 dark:text-purple-300 hover:text-indigo-600 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-300" />
                  <span>+ AI Listing Scan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('ADDRESS')}
                  className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                    inputMode === 'ADDRESS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>Paste Addresses</span>
                </button>
              </div>
            </div>

            {/* Tour Date & Time Controls Bar (Editable) */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Tour Date & Time Window:</span>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Date:</span>
                  <input
                    type="date"
                    value={tourDate}
                    onChange={e => handleUpdateDateTime(e.target.value, earliestStart, latestFinish)}
                    className="bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Start:</span>
                  <input
                    type="time"
                    value={earliestStart}
                    onChange={e => handleUpdateDateTime(tourDate, e.target.value, latestFinish)}
                    className="bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Finish:</span>
                  <input
                    type="time"
                    value={latestFinish}
                    onChange={e => handleUpdateDateTime(tourDate, earliestStart, e.target.value)}
                    className="bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* AI Scan Document & Image Zone */}
            {inputMode === 'AI' && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-purple-50/50 dark:bg-slate-950 border-2 border-purple-300 dark:border-purple-500/50 space-y-3 text-center shadow-md">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-600/20 border border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 mx-auto flex items-center justify-center shadow">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-black text-slate-900 dark:text-white text-base">DeepSeek AI Listing Flyer & Document Scanner</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                      Upload property flyers, MLS PDF printouts, or listing screenshots. AI automatically extracts addresses, pricing, specs, listing agent contacts, and Open House dates!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiUploadOpen(true)}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-black text-xs inline-flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-purple-200" />
                    <span>Upload Flyer PDF / Image to Scan</span>
                  </button>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Or Paste Candidate Addresses (1 per line)</span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal text-[11px]">Supports 5-12 properties</span>
                  </label>
                  <textarea
                    rows={4}
                    value={bulkAddressInput}
                    onChange={e => setBulkAddressInput(e.target.value)}
                    placeholder="123 Main St, Great Neck, NY&#10;45 Harbor Rd, Manhasset, NY"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-mono text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Candidate Address Input Mode */}
            {inputMode === 'ADDRESS' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Paste Candidate Addresses (1 per line)</span>
                  <span className="text-slate-500 dark:text-slate-400 font-normal text-[11px]">Supports 5-12 properties</span>
                </label>
                <textarea
                  rows={7}
                  value={bulkAddressInput}
                  onChange={e => setBulkAddressInput(e.target.value)}
                  placeholder="123 Main St, Great Neck, NY&#10;45 Harbor Rd, Manhasset, NY"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-mono text-xs p-3.5 rounded-xl border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>
            )}

            {/* Primary Action Button */}
            <button
              disabled={loading}
              onClick={handleProcessBulkInput}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Processing Listings...' : 'Create Showing Route →'}</span>
            </button>
          </div>

          {/* Optional Collapsible Settings Accordion (Starting Origin) */}
          <div className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>⚙️ Advanced Settings (Starting Origin Address)</span>
              </div>
              {showSettingsDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSettingsDrawer && (
              <div className="p-4 pt-0 border-t border-slate-200 dark:border-slate-800/60 space-y-2 text-xs animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Starting Origin Address</label>
                  <input
                    type="text"
                    value={startAddress}
                    onChange={e => setStartAddress(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 2: Instant Route & Plain-Language Conflicts */}
      {stage === 2 && savedTour && (
        <div className="space-y-4 animate-fadeIn">
          {/* Instant Route Summary Header Banner with Editable Date/Time */}
          <div className="p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border-2 border-indigo-300 dark:border-indigo-500/80 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-black text-[10px] uppercase border border-emerald-300 dark:border-emerald-500/30">
                  Route Optimized
                </span>
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Your {savedTour.stops.length}-Property Showing Tour is Ready
                </h2>
              </div>

              {/* Editable Tour Date & Time Controls Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Date:</span>
                  <input
                    type="date"
                    value={tourDate}
                    onChange={e => handleUpdateDateTime(e.target.value, earliestStart, latestFinish)}
                    className="bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Start:</span>
                  <input
                    type="time"
                    value={earliestStart}
                    onChange={e => handleUpdateDateTime(tourDate, e.target.value, latestFinish)}
                    className="bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Finish:</span>
                  <input
                    type="time"
                    value={latestFinish}
                    onChange={e => handleUpdateDateTime(tourDate, earliestStart, e.target.value)}
                    className="bg-transparent text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Lunch / Coffee Rest Break Trigger */}
                <button
                  type="button"
                  onClick={() => setIsAddBreakOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold flex items-center gap-1 shadow transition-colors shrink-0 cursor-pointer"
                >
                  <Utensils className="w-3.5 h-3.5 text-amber-100" />
                  <span>+ Add Break</span>
                </button>
              </div>
            </div>

            {/* Primary Action Button: Review & Share */}
            <button
              type="button"
              onClick={() => setStage(3)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <span>Review & Share Tour →</span>
            </button>
          </div>

          {/* Timeline & Map Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-3">
              <TimelineView
                tour={savedTour}
                onSelectStop={() => {}}
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
                onOpenAgentEmailModal={(stop) => {
                  setActiveAgentEmailStop(stop);
                  setIsAgentEmailOpen(true);
                }}
                onUpdateStopBuffers={handleUpdateStopBuffers}
                onUpdateStopPriority={handleUpdateStopPriority}
                onRemoveStop={handleRemoveStop}
                onReoptimize={handleReoptimize}
              />
            </div>

            <div className="lg:col-span-5 sticky top-16 h-[calc(100vh-8rem)] min-h-[400px]">
              <MapView tour={savedTour} onSelectStop={() => {}} />
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: Select Buyer & Dispatch Share */}
      {stage === 3 && savedTour && (
        <div className="max-w-[800px] mx-auto space-y-5 animate-fadeIn">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Share Tour with Buyer Client</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Assign buyer contact details and dispatch interactive links or PDF itineraries</p>
            </div>

            {/* Buyer Selection Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 space-y-3">
              <label className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Select Buyer Client Contact</span>
              </label>

              <select
                value={selectedContactId}
                onChange={e => handleSelectContact(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none"
              >
                <option value="">-- Manual Client Entry --</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  value={clientDisplayName}
                  onChange={e => setClientDisplayName(e.target.value)}
                  placeholder="Buyer Client Name (e.g. Smith Family)"
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800"
                />
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="Buyer Client Email"
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800"
                />
              </div>
            </div>

            {/* Dispatch Action Controls */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Dispatch Options</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Copy Interactive Link */}
                <button
                  type="button"
                  onClick={handleCopyClientLink}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 text-left space-y-2 group transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">{copiedLink ? 'Link Copied!' : 'Copy Web Link'}</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Shareable interactive buyer web link</p>
                </button>

                {/* 2. Dispatch Email */}
                <button
                  type="button"
                  onClick={() => setIsClientEmailOpen(true)}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 text-left space-y-2 group transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">Email Itinerary</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">Send formatted showing schedule via email</p>
                </button>

                {/* 3. Print / PDF */}
                <Link
                  href={`/tours/${savedTour.id}/print`}
                  target="_blank"
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 text-left space-y-2 group transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs">Print / PDF</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">High-res printable showing sheet</p>
                </Link>
              </div>
            </div>

            {/* Direct Link to Full Workspace Page */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStage(2)}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ← Back to Route View
              </button>

              <Link
                href={`/tours/${savedTour.id}`}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow"
              >
                <span>Open Full Tour Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* DeepSeek AI Document Scanner Upload Modal */}
      <AiUploadModal
        isOpen={isAiUploadOpen}
        onClose={() => setIsAiUploadOpen(false)}
        onAddExtractedStops={handleAddExtractedStops}
      />

      {/* Edit Listing Modal */}
      <EditListingModal
        stop={activeEditStop}
        isOpen={isEditListingOpen}
        onClose={() => setIsEditListingOpen(false)}
        onSaveStop={handleSaveStopDetails}
      />

      {/* Appointment Notes & Status Modal */}
      {savedTour && (
        <AppointmentModal
          tour={savedTour}
          stop={activeMessageStop}
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          onUpdateStatus={(stopId, status, confirmedTime) => {
            if (!savedTour) return;
            const updatedStops = savedTour.stops.map(s => {
              if (s.id === stopId) {
                return {
                  ...s,
                  appointment_status: status,
                  confirmed_start: confirmedTime || s.confirmed_start
                };
              }
              return s;
            });
            buildAndOptimizeTour(updatedStops);
            setIsMessageModalOpen(false);
          }}
        />
      )}

      {/* Listing Agent Appointment Email Modal */}
      {savedTour && (
        <AgentAppointmentEmailModal
          stop={activeAgentEmailStop}
          tour={savedTour}
          isOpen={isAgentEmailOpen}
          onClose={() => setIsAgentEmailOpen(false)}
        />
      )}

      {/* Client Email Modal */}
      {savedTour && (
        <ClientEmailModal
          tour={savedTour}
          isOpen={isClientEmailOpen}
          onClose={() => setIsClientEmailOpen(false)}
        />
      )}

      {/* Add Lunch / Rest Break Modal */}
      <AddBreakModal
        isOpen={isAddBreakOpen}
        onClose={() => setIsAddBreakOpen(false)}
        onAddBreak={handleAddBreakStop}
      />
    </div>
  );
}

export default function NewTourWizardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading Showing Tour Wizard...</div>}>
      <NewTourWizardContent />
    </Suspense>
  );
}
