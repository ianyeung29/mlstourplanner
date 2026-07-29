'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Tour, TourStop } from '@/types/tour';
import { getTourById, updateStopFeedback } from '@/services/storage';
import {
  Heart,
  HelpCircle,
  XCircle,
  MapPin,
  Calendar,
  Clock,
  Bed,
  Bath,
  Home,
  Check,
  Send,
  MessageSquare,
  Building,
  Phone,
  Mail,
  Sparkles
} from 'lucide-react';

export default function ClientItineraryPage() {
  const params = useParams();
  const tourId = params.id as string;

  const [tour, setTour] = React.useState<Tour | null>(null);
  const [activeComments, setActiveComments] = React.useState<Record<string, string>>({});
  const [savedBadge, setSavedBadge] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (tourId) {
      const loaded = getTourById(tourId);
      if (loaded) {
        setTour(loaded);
        const initialComments: Record<string, string> = {};
        loaded.stops.forEach(s => {
          if (s.buyer_comments) {
            initialComments[s.id] = s.buyer_comments;
          }
        });
        setActiveComments(initialComments);
      }
    }
  }, [tourId]);

  if (!tour) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 text-slate-500 font-sans text-xs">
        Loading Showing Tour Itinerary...
      </div>
    );
  }

  const handleSetRating = (stopId: string, rating: 'FAVORITE' | 'MAYBE' | 'PASS') => {
    const updated = updateStopFeedback(tour.id, stopId, rating, activeComments[stopId]);
    if (updated) {
      setTour(updated);
      setSavedBadge(prev => ({ ...prev, [stopId]: true }));
      setTimeout(() => setSavedBadge(prev => ({ ...prev, [stopId]: false })), 2000);
    }
  };

  const handleSaveComment = (stopId: string) => {
    const stop = tour.stops.find(s => s.id === stopId);
    if (!stop) return;

    const rating = stop.buyer_rating || 'MAYBE';
    const updated = updateStopFeedback(tour.id, stopId, rating, activeComments[stopId]);
    if (updated) {
      setTour(updated);
      setSavedBadge(prev => ({ ...prev, [stopId]: true }));
      setTimeout(() => setSavedBadge(prev => ({ ...prev, [stopId]: false })), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16">
      {/* Top Client Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 shadow-md">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
              Buyer Tour Itinerary
            </span>
            <span className="text-xs text-indigo-100 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {tour.tour_date}
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight">{tour.name}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-100 font-medium pt-1">
            {tour.client_display_name && (
              <span>Prepared for: <strong>{tour.client_display_name}</strong></span>
            )}
            {tour.agent_name && (
              <span>Realtor: <strong>{tour.agent_name}</strong> ({tour.agent_brokerage || 'Real Estate Agent'})</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Property List with Interactive Rating & Notes */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 text-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Rate & Review Properties in Real-Time</h3>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              Tap <strong className="text-rose-500">Favorite</strong>, <strong className="text-amber-500">Maybe</strong>, or <strong className="text-slate-500">Pass</strong> as you tour each property. Your agent will see your notes live!
            </p>
          </div>
        </div>

        {/* Tour Property Stops */}
        <div className="space-y-5">
          {tour.stops.map((stop, idx) => {
            const rating = stop.buyer_rating;

            return (
              <div
                key={stop.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-lg overflow-hidden transition-all"
              >
                {/* Property Photo & Specs Header */}
                <div className="relative h-48 sm:h-56 bg-slate-100 dark:bg-slate-950">
                  {stop.image_url ? (
                    <img
                      src={stop.image_url}
                      alt={stop.normalized_address}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-semibold text-xs">
                      No Photo Available
                    </div>
                  )}

                  {/* Stop Number Badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-indigo-600 text-white font-black text-xs shadow-md">
                    Stop #{idx + 1}
                  </div>

                  {/* Time Window Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white flex items-center justify-between text-xs font-semibold shadow-lg">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      Showing Window: {stop.planned_arrival || 'TBD'} – {stop.planned_departure || 'TBD'}
                    </span>
                    {stop.list_price && (
                      <span className="font-extrabold text-emerald-400 text-sm">
                        ${stop.list_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-5 space-y-4 text-xs">
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{stop.normalized_address}</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-300 font-semibold pt-0.5">
                      {(stop.beds || stop.baths) && (
                        <span className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          {stop.beds || 0} Bed, {stop.baths || 0} Bath
                        </span>
                      )}
                      {stop.sqft && (
                        <span className="flex items-center gap-1">
                          <Home className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          {stop.sqft.toLocaleString()} sqft
                        </span>
                      )}
                      {stop.mls_number && (
                        <span className="font-mono text-[11px] text-slate-500">
                          MLS #{stop.mls_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interactive Buyer Feedback Rating Controls */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                      <span>Your Rating for this Home:</span>
                      {savedBadge[stop.id] && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-1 animate-fadeIn">
                          <Check className="w-3 h-3" /> Saved!
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetRating(stop.id, 'FAVORITE')}
                        className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          rating === 'FAVORITE'
                            ? 'bg-rose-600 text-white shadow-md scale-[1.02]'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-rose-400'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${rating === 'FAVORITE' ? 'fill-white' : 'text-rose-500'}`} />
                        <span>Favorite</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetRating(stop.id, 'MAYBE')}
                        className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          rating === 'MAYBE'
                            ? 'bg-amber-500 text-white shadow-md scale-[1.02]'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
                        }`}
                      >
                        <HelpCircle className={`w-4 h-4 ${rating === 'MAYBE' ? 'fill-white' : 'text-amber-500'}`} />
                        <span>Maybe</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetRating(stop.id, 'PASS')}
                        className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          rating === 'PASS'
                            ? 'bg-slate-700 text-white shadow-md scale-[1.02]'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        <XCircle className="w-4 h-4 text-slate-400" />
                        <span>Pass</span>
                      </button>
                    </div>

                    {/* Buyer Feedback Notes Input */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Your Thoughts / Notes for Realtor:</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={activeComments[stop.id] || ''}
                          onChange={(e) => setActiveComments(prev => ({ ...prev, [stop.id]: e.target.value }))}
                          onBlur={() => handleSaveComment(stop.id)}
                          placeholder="e.g. Loved the open kitchen, backyard needs fencing"
                          className="flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveComment(stop.id)}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
