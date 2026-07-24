'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tour, TourStop, ClientContact } from '@/types/tour';
import { batchGeocodeAddresses } from '@/services/geocode';
import { lookupByMlsNumber, batchLookupMlsNumbers, MlsListingResult } from '@/services/mlsService';
import { saveTour, getUserProfile, getContactsFromStorage } from '@/services/storage';
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
  Users
} from 'lucide-react';
import Link from 'next/link';

function NewTourWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactIdParam = searchParams.get('contactId');

  const profile = getUserProfile();
  const contacts = getContactsFromStorage();

  const [step, setStep] = React.useState<number>(1);
  const [inputMode, setInputMode] = React.useState<'MLS' | 'ADDRESS'>('MLS');
  const [loading, setLoading] = React.useState<boolean>(false);

  // Single MLS Lookup
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
  const [bulkMlsInput, setBulkMlsInput] = React.useState(
    `ONEKEY-3489102\nONEKEY-3501298\nONEKEY-3512004\nONEKEY-3498210`
  );
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

  const handleSingleMlsLookup = async () => {
    if (!singleMlsInput.trim()) return;
    setIsSearchingMls(true);
    const result = await lookupByMlsNumber(singleMlsInput);
    setPreviewListing(result);
    setIsSearchingMls(false);
  };

  const handleAddPreviewToList = () => {
    if (!previewListing) return;
    const newStop: Partial<TourStop> = {
      id: `stop_${Date.now()}`,
      original_input: previewListing.mls_number,
      normalized_address: previewListing.normalized_address,
      latitude: previewListing.latitude,
      longitude: previewListing.longitude,
      geocode_status: 'RESOLVED',
      mls_number: previewListing.mls_number,
      list_price: previewListing.list_price,
      beds: previewListing.beds,
      baths: previewListing.baths,
      sqft: previewListing.sqft,
      listing_agent_name: previewListing.listing_agent_name,
      listing_agent_phone: previewListing.listing_agent_phone,
      listing_agent_email: previewListing.listing_agent_email,
      listing_brokerage: previewListing.listing_brokerage,
      agent_notes: previewListing.agent_notes,
      priority: stops.length === 0 ? 'MUST_SEE' : 'PREFERRED',
      appointment_status: 'NOT_REQUESTED',
      scheduling_mode: 'FLEXIBLE',
      visit_minutes: defaultVisitMins,
      access_before_minutes: defaultAccessMins,
      access_after_minutes: 0,
      travel_buffer_minutes: defaultTravelBuffer,
      availability_windows: []
    };

    setStops(prev => [...prev, newStop]);
    setSingleMlsInput('');
    setPreviewListing(null);
  };

  const handleProcessBulkInput = async () => {
    setLoading(true);

    if (inputMode === 'MLS') {
      const mlsLines = bulkMlsInput
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      if (mlsLines.length === 0 && stops.length === 0) {
        alert('Please enter at least one MLS Number.');
        setLoading(false);
        return;
      }

      if (mlsLines.length > 0) {
        const mlsResults = await batchLookupMlsNumbers(mlsLines);
        const newStops: Partial<TourStop>[] = mlsResults.map((res, idx) => ({
          id: `stop_${Date.now()}_${idx}`,
          original_input: res.mls_number,
          normalized_address: res.normalized_address,
          latitude: res.latitude,
          longitude: res.longitude,
          geocode_status: 'RESOLVED',
          mls_number: res.mls_number,
          list_price: res.list_price,
          beds: res.beds,
          baths: res.baths,
          sqft: res.sqft,
          listing_agent_name: res.listing_agent_name,
          listing_agent_phone: res.listing_agent_phone,
          listing_agent_email: res.listing_agent_email,
          listing_brokerage: res.listing_brokerage,
          agent_notes: res.agent_notes,
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
    } else {
      const addressLines = bulkAddressInput
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0);

      if (addressLines.length === 0 && stops.length === 0) {
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
        <div className="space-y-0.5">
          <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <h1 className="text-lg font-black text-white tracking-tight">
            {step === 1 ? 'Configure Showing Tour Window & MLS Listings' : 'Review & Verify Property Schedule List'}
          </h1>
        </div>

        <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
          Step {step} of 2
        </span>
      </div>

      {/* Step 1: 2-Column Desktop Grid */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Tour & Client Parameters */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>1. Tour & Buyer Client Settings</span>
            </h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Tour Name</label>
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

          {/* Right Column: MLS Lookup & Property Inputs */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-indigo-400" />
                <span>2. MLS Listings & Candidate Properties</span>
              </h2>

              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setInputMode('MLS')}
                  className={`px-2.5 py-1 rounded font-semibold flex items-center gap-1 transition-colors ${
                    inputMode === 'MLS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Hash className="w-3 h-3 text-indigo-300" />
                  <span>MLS Lookup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('ADDRESS')}
                  className={`px-2.5 py-1 rounded font-semibold flex items-center gap-1 transition-colors ${
                    inputMode === 'ADDRESS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>Raw Addresses</span>
                </button>
              </div>
            </div>

            {inputMode === 'MLS' && (
              <div className="space-y-3">
                <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Search className="w-3 h-3 text-indigo-400" />
                    Enter MLS Number (Live Lookup)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={singleMlsInput}
                      onChange={e => setSingleMlsInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSingleMlsLookup()}
                      placeholder="e.g. ONEKEY-3489102 or 3501298"
                      className="flex-1 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      disabled={isSearchingMls || !singleMlsInput.trim()}
                      onClick={handleSingleMlsLookup}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors disabled:opacity-50"
                    >
                      {isSearchingMls ? 'Searching...' : 'Fetch Listing'}
                    </button>
                  </div>
                </div>

                {previewListing && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/50 space-y-2 animate-fadeIn shadow-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Listing Fetched
                        </div>
                        <div className="text-xs font-bold text-white mt-0.5">
                          {previewListing.normalized_address}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          MLS #{previewListing.mls_number} · ${previewListing.list_price.toLocaleString()} ({previewListing.beds} Bed, {previewListing.baths} Bath)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddPreviewToList}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add to Tour
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 grid grid-cols-2">
                      <div>Listing Agent: <strong className="text-white">{previewListing.listing_agent_name}</strong></div>
                      <div>Phone: <span className="text-slate-300">{previewListing.listing_agent_phone}</span></div>
                    </div>
                  </div>
                )}

                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>Or Bulk Paste MLS Numbers (1 per line)</span>
                    <span className="text-slate-400 font-normal">e.g. ONEKEY-3489102</span>
                  </label>
                  <textarea
                    rows={4}
                    value={bulkMlsInput}
                    onChange={e => setBulkMlsInput(e.target.value)}
                    placeholder="ONEKEY-3489102&#10;ONEKEY-3501298"
                    className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {inputMode === 'ADDRESS' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Paste Candidate Addresses (1 per line)</span>
                  <span className="text-slate-400 font-normal">Supports 5-12 properties</span>
                </label>
                <textarea
                  rows={6}
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
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Processing Listings...' : 'Process Listings & Proceed'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
                className="text-xs font-semibold text-indigo-400 hover:underline"
              >
                ← Add More MLS Numbers
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
                      value={stop.priority}
                      onChange={e => handleUpdateStopPriority(idx, e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white text-[11px] font-semibold px-2 py-1 rounded-lg focus:outline-none"
                    >
                      <option value="MUST_SEE">Must See</option>
                      <option value="PREFERRED">Preferred</option>
                      <option value="OPTIONAL">Optional</option>
                    </select>

                    <button
                      onClick={() => handleRemoveStop(idx)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleCreateTour}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Build Feasible Itinerary & Open Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewTourPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading tour wizard...</div>}>
      <NewTourWizardContent />
    </Suspense>
  );
}
