'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tour, TourStop, ClientContact } from '@/types/tour';
import { batchGeocodeAddresses, geocodeAddress } from '@/services/geocode';
import { lookupByMlsNumber, batchLookupMlsNumbers, MlsListingResult } from '@/services/mlsService';
import { saveTour, getUserProfile, getContactsFromStorage } from '@/services/storage';
import AiUploadModal from '@/components/AiUploadModal';
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Hash,
  ChevronLeft,
  Users,
  UploadCloud,
  FileText
} from 'lucide-react';
import Link from 'next/link';

function NewTourWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactIdParam = searchParams.get('contactId');

  const profile = getUserProfile();
  const contacts = getContactsFromStorage();

  const [step, setStep] = React.useState<number>(1);
  // Default primary input mode set to 'AI' (MLS Lookup hidden until MLS subscription active)
  const [inputMode, setInputMode] = React.useState<'AI' | 'ADDRESS'>('AI');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [isAiUploadOpen, setIsAiUploadOpen] = React.useState(false);

  // Single MLS Lookup (preserved for future API subscription)
  const [singleMlsInput, setSingleMlsInput] = React.useState('');
  const [previewListing, setPreviewListing] = React.useState<MlsListingResult | null>(null);
  const [isSearchingMls, setIsSearchingMls] = React.useState(false);

  // Form State
  const [name, setName] = React.useState('North Shore Showing Tour');
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

  // Bulk Inputs
  const [bulkAddressInput, setBulkAddressInput] = React.useState(
    `123 Main St, Great Neck, NY\n45 Harbor Rd, Manhasset, NY\n12 Northern Blvd, Roslyn, NY\n88 Forest Ave, Glen Cove, NY`
  );

  const [stops, setStops] = React.useState<Partial<TourStop>[]>([]);

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

    setStops(prev => [...prev, ...newStops]);
    setStep(2);
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
      setStops(prev => [...prev, ...newStops]);
    }

    setLoading(false);
    setStep(2);
  };

  const handleRemoveStop = (index: number) => {
    setStops(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateStopPriority = (index: number, priority: any) => {
    setStops(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], priority };
      return copy;
    });
  };

  const handleCreateTour = () => {
    if (stops.length === 0) {
      alert('You need at least one valid property stop to build a schedule.');
      return;
    }

    const newTour: Tour = {
      id: `tour_${Date.now()}`,
      name,
      client_display_name: clientDisplayName,
      client_email: clientEmail,
      client_id: selectedContactId,
      status: 'DRAFT',
      tour_date: tourDate,
      timezone: 'America/New_York',
      earliest_start: earliestStart,
      latest_finish: latestFinish,
      start_input: startAddress,
      start_address: startAddress,
      start_latitude: 40.7865,
      start_longitude: -73.7285,
      default_visit_minutes: defaultVisitMins,
      default_access_minutes: defaultAccessMins,
      default_travel_buffer: defaultTravelBuffer,
      stops: stops as TourStop[],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const saved = saveTour(newTour);
    router.push(`/tours/${saved.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Create New Showing Day Tour</h1>
            <p className="text-xs text-slate-400">Step {step} of 2: {step === 1 ? 'Tour Details & Listings' : 'Review Property Sequence'}</p>
          </div>
        </div>

        {step === 2 && (
          <button
            type="button"
            onClick={handleCreateTour}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate & Optimize Route</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Step 1 Form */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Tour & Client Settings */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
            <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>1. TOUR & BUYER CLIENT DETAILS</span>
            </h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Showing Tour Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Select Client Contact */}
              <div className="space-y-1 p-2.5 rounded-xl bg-slate-950 border border-indigo-500/30">
                <label className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Select Saved Buyer Client
                </label>
                <select
                  value={selectedContactId}
                  onChange={e => handleSelectContact(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
                >
                  <option value="">-- Manual Client Entry --</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <input
                    type="text"
                    value={clientDisplayName}
                    onChange={e => setClientDisplayName(e.target.value)}
                    placeholder="Client Name"
                    className="bg-slate-900 text-slate-200 px-2 py-1 rounded border border-slate-800"
                  />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    placeholder="Client Email"
                    className="bg-slate-900 text-slate-200 px-2 py-1 rounded border border-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Tour Date</label>
                <input
                  type="date"
                  value={tourDate}
                  onChange={e => setTourDate(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Earliest Start</label>
                  <input
                    type="time"
                    value={earliestStart}
                    onChange={e => setEarliestStart(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Latest Finish</label>
                  <input
                    type="time"
                    value={latestFinish}
                    onChange={e => setLatestFinish(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Starting Origin Address
                </label>
                <input
                  type="text"
                  value={startAddress}
                  onChange={e => setStartAddress(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Right Column: AI Document Scanner & Candidate Properties */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>2. CANDIDATE PROPERTIES & LISTINGS</span>
              </h2>

              {/* 2 Primary Input Mode Tabs: AI Scan (Primary) & Candidate Addresses */}
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setInputMode('AI')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded font-bold flex items-center justify-center gap-1.5 transition-all ${
                    inputMode === 'AI' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-purple-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>+ AI Listing Scan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('ADDRESS')}
                  className={`flex-1 sm:flex-none px-3 py-1 rounded font-bold flex items-center justify-center gap-1.5 transition-all ${
                    inputMode === 'ADDRESS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Candidate Addresses</span>
                </button>
              </div>
            </div>

            {/* Primary Input Mode 1: AI Scan Scanner */}
            {inputMode === 'AI' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-5 rounded-2xl bg-slate-950 border-2 border-purple-500/50 space-y-3 text-center shadow-xl">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-300 mx-auto flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-white text-sm">DeepSeek AI Listing Flyer & Document Scanner</h4>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                      Upload property flyers, MLS PDF printouts, or listing screenshots. AI automatically extracts addresses, pricing, specs, listing agent contacts, and Open House dates!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiUploadOpen(true)}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-purple-200" />
                    <span>Upload Flyer PDF / Image to Scan</span>
                  </button>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Or Paste Candidate Addresses (1 per line)</span>
                    <span className="text-slate-400 font-normal">Supports 5-12 properties</span>
                  </label>
                  <textarea
                    rows={4}
                    value={bulkAddressInput}
                    onChange={e => setBulkAddressInput(e.target.value)}
                    placeholder="123 Main St, Great Neck, NY&#10;45 Harbor Rd, Manhasset, NY"
                    className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Input Mode 2: Candidate Addresses */}
            {inputMode === 'ADDRESS' && (
              <div className="space-y-1 animate-fadeIn">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Paste Candidate Addresses (1 per line)</span>
                  <span className="text-slate-400 font-normal">Supports 5-12 properties</span>
                </label>
                <textarea
                  rows={7}
                  value={bulkAddressInput}
                  onChange={e => setBulkAddressInput(e.target.value)}
                  placeholder="123 Main St, Great Neck, NY&#10;45 Harbor Rd, Manhasset, NY"
                  className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>
            )}

            <button
              disabled={loading}
              onClick={handleProcessBulkInput}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Processing Listings...' : 'Process Listings & Proceed'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 Form */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-indigo-400" />
                <span>Fetched Property Stops ({stops.length})</span>
              </h3>
              <button
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-indigo-400 hover:underline cursor-pointer"
              >
                ← Add More Properties / Documents
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stops.map((stop, idx) => (
                <div
                  key={stop.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-indigo-600/20 text-indigo-300 text-[11px] font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-white truncate max-w-[200px]">{stop.normalized_address}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      Agent: <strong className="text-slate-200">{stop.listing_agent_name || 'N/A'}</strong> ({stop.listing_brokerage || 'N/A'})
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={stop.priority || 'PREFERRED'}
                      onChange={e => handleUpdateStopPriority(idx, e.target.value)}
                      className="bg-slate-900 text-white text-[11px] px-2 py-1 rounded border border-slate-700"
                    >
                      <option value="MUST_SEE">⭐ Must See</option>
                      <option value="PREFERRED">🔹 Preferred</option>
                      <option value="OPTIONAL">⚪ Optional</option>
                    </select>

                    <button
                      onClick={() => handleRemoveStop(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove Stop"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
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
    </div>
  );
}

export default function NewTourWizardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-xs">Loading Showing Tour Wizard...</div>}>
      <NewTourWizardContent />
    </Suspense>
  );
}
