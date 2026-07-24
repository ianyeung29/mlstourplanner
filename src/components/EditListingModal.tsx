'use client';

import React from 'react';
import { TourStop } from '@/types/tour';
import { geocodeAddress } from '@/services/geocode';
import { X, Edit3, Save, MapPin, DollarSign, Home, Bed, Bath, User, Phone, Mail, Building, FileText, Image as ImageIcon } from 'lucide-react';

interface EditListingModalProps {
  stop: TourStop | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveStop: (updatedStop: TourStop) => void;
}

export default function EditListingModal({
  stop,
  isOpen,
  onClose,
  onSaveStop
}: EditListingModalProps) {
  if (!isOpen || !stop) return null;

  const [address, setAddress] = React.useState(stop.normalized_address || stop.original_input || '');
  const [listPrice, setListPrice] = React.useState<number | string>(stop.list_price || '');
  const [beds, setBeds] = React.useState<number | string>(stop.beds || '');
  const [baths, setBathsNum] = React.useState<number | string>(stop.baths || '');
  const [sqft, setSqft] = React.useState<number | string>(stop.sqft || '');
  const [imageUrl, setImageUrl] = React.useState(stop.image_url || '');

  const [hasOpenHouse, setHasOpenHouse] = React.useState(!!stop.has_open_house);
  const [ohDate, setOhDate] = React.useState(stop.open_house_date || '');
  const [ohStart, setOhStart] = React.useState(stop.open_house_start || '11:00');
  const [ohEnd, setOhEnd] = React.useState(stop.open_house_end || '13:00');

  const [agentName, setAgentName] = React.useState(stop.listing_agent_name || '');
  const [agentPhone, setAgentPhone] = React.useState(stop.listing_agent_phone || '');
  const [agentEmail, setAgentEmail] = React.useState(stop.listing_agent_email || '');
  const [brokerage, setBrokerage] = React.useState(stop.listing_brokerage || '');
  const [notes, setNotes] = React.useState(stop.agent_notes || '');

  const [isGeocoding, setIsGeocoding] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeocoding(true);

    let lat = stop.latitude;
    let lng = stop.longitude;
    let normalized = address;

    // If address changed, re-geocode
    if (address.trim() !== stop.normalized_address) {
      const geo = await geocodeAddress(address);
      lat = geo.latitude;
      lng = geo.longitude;
      normalized = geo.normalized_address || address;
    }

    const updated: TourStop = {
      ...stop,
      normalized_address: normalized,
      latitude: lat,
      longitude: lng,
      list_price: listPrice === '' ? undefined : Number(listPrice),
      beds: beds === '' ? undefined : Number(beds),
      baths: baths === '' ? undefined : Number(baths),
      sqft: sqft === '' ? undefined : Number(sqft),
      image_url: imageUrl || undefined,
      has_open_house: hasOpenHouse,
      open_house_date: hasOpenHouse ? (ohDate || undefined) : undefined,
      open_house_start: hasOpenHouse ? ohStart : undefined,
      open_house_end: hasOpenHouse ? ohEnd : undefined,
      listing_agent_name: agentName,
      listing_agent_phone: agentPhone,
      listing_agent_email: agentEmail,
      listing_brokerage: brokerage,
      agent_notes: notes
    };

    setIsGeocoding(false);
    onSaveStop(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <form onSubmit={handleSubmit} className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <span>Edit Property Listing Information</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 bg-slate-950">
          {/* Address */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              Property Address
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 31 Yale St, Garden City, NY 11530"
              className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Price & Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                List Price ($)
              </label>
              <input
                type="number"
                value={listPrice}
                onChange={e => setListPrice(e.target.value)}
                placeholder="1399000"
                className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-indigo-400" />
                Beds
              </label>
              <input
                type="number"
                value={beds}
                onChange={e => setBeds(e.target.value)}
                placeholder="3"
                className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-indigo-400" />
                Baths
              </label>
              <input
                type="number"
                step="0.5"
                value={baths}
                onChange={e => setBathsNum(e.target.value)}
                placeholder="2"
                className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-indigo-400" />
                Sqft
              </label>
              <input
                type="number"
                value={sqft}
                onChange={e => setSqft(e.target.value)}
                placeholder="1792"
                className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Photo Image URL */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              Listing Photo URL
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Open House Window Toggle */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasOpenHouse}
                  onChange={e => setHasOpenHouse(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/50"
                />
                <span>Has Open House Schedule</span>
              </label>
            </div>

            {hasOpenHouse && (
              <div className="space-y-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 font-medium">Open House Date / Day</label>
                  <input
                    type="text"
                    value={ohDate}
                    onChange={e => setOhDate(e.target.value)}
                    placeholder="e.g. Saturday, Sunday, 07/26, or Saturday 7/26"
                    className="w-full bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">Open House Start</label>
                    <input
                      type="time"
                      value={ohStart}
                      onChange={e => setOhStart(e.target.value)}
                      className="w-full bg-slate-950 text-white text-xs px-2 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">Open House End</label>
                    <input
                      type="time"
                      value={ohEnd}
                      onChange={e => setOhEnd(e.target.value)}
                      className="w-full bg-slate-950 text-white text-xs px-2 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Listing Agent Specs */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200">Listing Agent Contact Details</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Listing Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  placeholder="N/A"
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Brokerage</label>
                <input
                  type="text"
                  value={brokerage}
                  onChange={e => setBrokerage(e.target.value)}
                  placeholder="Howard Hanna Coach"
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Agent Phone</label>
                <input
                  type="text"
                  value={agentPhone}
                  onChange={e => setAgentPhone(e.target.value)}
                  placeholder="(516) 555-0188"
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Agent Email</label>
                <input
                  type="email"
                  value={agentEmail}
                  onChange={e => setAgentEmail(e.target.value)}
                  placeholder="vvance@example.com"
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Showing Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Agent Showing Notes & Lockbox Access
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Call listing agent 15 mins prior. Lockbox on side porch."
              className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isGeocoding}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isGeocoding ? 'Geocoding & Saving...' : 'Save Listing Details'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
