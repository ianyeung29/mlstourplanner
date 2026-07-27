'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { getTourById, getUserProfile } from '@/services/storage';
import { Tour } from '@/types/tour';
import { Calendar, Clock, MapPin, Printer, Compass, Home, Bed, Bath, User } from 'lucide-react';

export default function PrintItineraryPage() {
  const params = useParams();
  const tourId = params.id as string;
  const [tour, setTour] = React.useState<Tour | null>(null);
  const currentUser = getUserProfile();

  React.useEffect(() => {
    const loaded = getTourById(tourId);
    if (loaded) setTour(loaded);
  }, [tourId]);

  if (!tour) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading client itinerary...</div>;
  }

  // Creator Agent details tied to Tour record
  const agentName = tour.agent_name || currentUser.full_name || 'Ian Yeung';
  const agentBrokerage = tour.agent_brokerage || currentUser.brokerage_name || 'Side Luxury Real Estate';
  const agentPhone = tour.agent_phone || currentUser.phone || '(516) 555-8820';
  const agentEmail = tour.agent_email || currentUser.email || 'ianyeung30@gmail.com';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 max-w-4xl mx-auto space-y-4">
      {/* Pure Client Printable Itinerary Content Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xl print:bg-white print:text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Title Header */}
        <div className="border-b border-slate-800 print:border-slate-300 pb-4 space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-bold text-indigo-400 print:text-indigo-700 uppercase tracking-wider">
                Property Showing Itinerary
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white print:text-slate-900 tracking-tight">
                {tour.name}
              </h1>
            </div>

            {/* Creator Agent Card */}
            <div className="text-right text-xs text-slate-400 print:text-slate-600">
              <div className="font-bold text-slate-200 print:text-slate-900">{agentName}</div>
              <div>{agentBrokerage}</div>
              <div>{agentPhone}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 print:text-slate-700 pt-2 font-medium">
            {tour.client_display_name && (
              <span>Client: <strong>{tour.client_display_name}</strong></span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Date: <strong>{tour.tour_date}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Window: <strong>{tour.earliest_start} – {tour.latest_finish}</strong>
            </span>
            <span>Total Properties: <strong>{tour.stops.length}</strong></span>
          </div>
        </div>

        {/* Property Timeline List */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 print:text-slate-700 uppercase tracking-wider">
            Scheduled Property Stops
          </h2>

          <div className="space-y-3">
            {tour.stops.map((stop, idx) => (
              <div
                key={stop.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 print:bg-slate-50 print:border-slate-300 flex flex-col sm:flex-row items-start justify-between gap-4"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                  {/* Primary Property Image Thumbnail */}
                  {stop.image_url ? (
                    <img
                      src={stop.image_url}
                      alt="Property Listing"
                      className="w-24 h-16 rounded-lg object-cover border border-slate-800 print:border-slate-300 shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-16 rounded-lg bg-slate-900 border border-slate-800 print:bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 shrink-0">
                      No Photo
                    </div>
                  )}

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <h3 className="text-sm font-bold text-white print:text-slate-900 truncate">
                        {stop.normalized_address}
                      </h3>
                    </div>

                    {/* Price & Specs */}
                    <div className="text-xs text-slate-300 print:text-slate-800 font-medium flex flex-wrap items-center gap-2">
                      {stop.list_price && (
                        <strong className="text-emerald-400 print:text-emerald-700 font-extrabold text-sm">
                          ${stop.list_price.toLocaleString()}
                        </strong>
                      )}
                      {stop.beds && (
                        <span>
                          {stop.beds} Beds, {stop.baths} Baths
                        </span>
                      )}
                      {stop.sqft && (
                        <span className="text-slate-400 print:text-slate-600">
                          ({stop.sqft.toLocaleString()} sqft)
                        </span>
                      )}
                      {stop.mls_number && (
                        <span className="text-slate-400 font-mono">MLS #{stop.mls_number}</span>
                      )}
                    </div>

                    {/* Open House Badge */}
                    {stop.has_open_house && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 print:bg-amber-100 print:text-amber-900 border border-amber-500/30 text-[10px] font-bold">
                        <Home className="w-3 h-3 text-amber-400" />
                        <span>Public Open House: {stop.open_house_start || '10:00'} - {stop.open_house_end || '12:00'}</span>
                      </div>
                    )}

                    {stop.client_notes && (
                      <div className="text-xs text-slate-400 print:text-slate-600 italic bg-slate-900 print:bg-slate-100 p-2 rounded border border-slate-800 print:border-slate-200 mt-1">
                        "{stop.client_notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Arrival/Departure Box */}
                <div className="bg-indigo-950/60 print:bg-indigo-50 p-3 rounded-xl border border-indigo-500/30 text-right shrink-0 min-w-[140px]">
                  <div className="text-[10px] uppercase font-bold text-indigo-300 print:text-indigo-800">
                    Planned Showing Time
                  </div>
                  <div className="text-sm font-black text-white print:text-indigo-950 mt-0.5">
                    {stop.planned_arrival || 'TBD'} – {stop.planned_departure || 'TBD'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer tied to Creator Agent & Platform Branding */}
        <div className="border-t border-slate-800 print:border-slate-300 pt-4 space-y-1.5 text-center text-xs text-slate-400 print:text-slate-600 font-medium">
          <div>
            Prepared by <strong>{agentName}</strong> · {agentBrokerage} · {agentPhone} · {agentEmail}
          </div>
          <div className="text-[11px] text-slate-400 print:text-slate-600">
            ⚡ Powered by <a href="https://www.mlstourplanner.com" target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-400 print:text-slate-800 hover:underline">MLSTourPlanner.com</a> — Real Estate Showing Tour Optimizer
          </div>
        </div>
      </div>
    </div>
  );
}
