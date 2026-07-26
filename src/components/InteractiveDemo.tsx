'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  MapPin,
  Clock,
  Car,
  Home,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Lock,
  Bed,
  Mail,
  Copy,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function InteractiveDemo() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(2);
  const [sampleListings, setSampleListings] = useState([
    { id: '1', address: '123 Main St, Great Neck, NY 11021', price: '$1,450,000', beds: 4, baths: 3.5, sqft: 3200, time: '09:30 AM – 10:00 AM', priority: '⭐ Must See', status: 'CONFIRMED', openHouse: true, agent: 'Sarah Jenkins (Side Luxury)' },
    { id: '2', address: '45 Harbor Rd, Manhasset, NY 11030', price: '$2,250,000', beds: 5, baths: 4.5, sqft: 4100, time: '10:05 AM – 10:35 AM', priority: '🔹 Preferred', status: 'REQUESTING', openHouse: false, agent: 'Michael Vance (Douglas Elliman)' },
    { id: '3', address: '12 Northern Blvd, Roslyn, NY 11576', price: '$1,890,000', beds: 4, baths: 3, sqft: 3600, time: '10:42 AM – 11:12 AM', priority: '🔹 Preferred', status: 'CONFIRMED', openHouse: true, agent: 'David Miller (Compass)' }
  ]);

  return (
    <div className="w-full max-w-[1250px] mx-auto p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6 font-sans">
      {/* Demo Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-[10px] uppercase tracking-wider border border-indigo-500/30">
              Interactive Product Demo
            </span>
            <span className="text-xs text-slate-400">Try the workflow live</span>
          </div>
          <h3 className="text-lg font-black text-white tracking-tight mt-1">
            See How MLS Tour Planner Works in Action
          </h3>
        </div>

        {/* 3 Step Selector Buttons */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeStep === 1 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Ingest Listings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeStep === 2 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-purple-300" />
            <span>2. Conflict-Aware Route</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeStep === 3 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>3. Client Itinerary</span>
          </button>
        </div>
      </div>

      {/* STEP 1: Listing Ingestion Demo */}
      {activeStep === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start animate-fadeIn text-xs">
          <div className="md:col-span-6 space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-indigo-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Multi-Source Property Listing Ingestion
            </h4>
            <p className="text-slate-400 text-xs">
              Upload listing flyers (PDFs or screenshots), enter MLS numbers, or bulk-paste raw property addresses.
            </p>

            <div className="p-4 border-2 border-dashed border-indigo-500/40 rounded-xl bg-indigo-500/5 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-indigo-400 mx-auto" />
              <div className="font-bold text-white">DeepSeek AI Listing Flyer Scanner</div>
              <p className="text-[11px] text-slate-400">Extracts specs, price, open house dates & crops primary photos</p>
              <span className="inline-block px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px]">
                Sample Listing Sheet Loaded
              </span>
            </div>
          </div>

          <div className="md:col-span-6 space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-emerald-400">
              Parsed Property Metadata (3 Properties)
            </h4>
            {sampleListings.map((item, idx) => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="w-6 h-6 rounded bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="truncate">
                    <div className="font-extrabold text-white text-xs truncate">{item.address}</div>
                    <div className="text-[11px] text-slate-400">{item.price} • {item.beds} Bed, {item.baths} Bath ({item.sqft} sqft)</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 shrink-0">
                  Parsed
                </span>
              </div>
            ))}
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>Proceed to Route Optimization</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Conflict-Aware Route Schedule Demo */}
      {activeStep === 2 && (
        <div className="space-y-4 animate-fadeIn text-xs">
          {/* Header Window Bar */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2 font-bold text-white">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>EXPECTED TOUR TIME WINDOW: 09:30 AM – 16:00 PM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] border border-emerald-500/30">
                3 Property Stops Feasible
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-[11px]">
                0 Driving Conflicts
              </span>
            </div>
          </div>

          {/* Timeline Cards Sequence */}
          <div className="space-y-3">
            {sampleListings.map((stop, idx) => (
              <React.Fragment key={stop.id}>
                {/* Property Stop Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-3">
                      <div className="w-14 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-indigo-400 text-sm shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="font-black text-white text-xs leading-snug">{stop.address}</div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="font-extrabold text-emerald-400">{stop.price}</span>
                          <span className="text-slate-300 font-semibold">• {stop.beds} Bed, {stop.baths} Bath</span>
                          <span className="text-slate-400">({stop.sqft} sqft)</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30 shrink-0">
                      {stop.priority}
                    </span>
                  </div>

                  {stop.openHouse && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold">
                      <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Open House 11:00 AM – 1:00 PM (No Appointment Needed)</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Scheduled Visit: {stop.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Visit: 25m</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Buffer: 5m</span>
                    </div>
                  </div>
                </div>

                {/* Driving Distance Connector */}
                {idx < sampleListings.length - 1 && (
                  <div className="flex items-center justify-center my-1">
                    <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                      <Car className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Drive to Stop #{idx + 2}: 4 mins (1.7 miles) • 5m Travel Buffer</span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>View Client Itinerary Link</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Client Itinerary Link & PDF Demo */}
      {activeStep === 3 && (
        <div className="space-y-4 animate-fadeIn text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-white text-sm">North Shore Luxury Showing Tour</h4>
                <p className="text-slate-400 text-xs">Client: The Smith Family • Tour Date: July 26, 2026</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Client Link Ready
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
              <div className="text-[11px] font-bold text-indigo-300 flex items-center justify-between">
                <span>Interactive Client Web Link:</span>
                <span className="text-[10px] text-slate-400">Shareable with buyers</span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
                <span>https://www.mlstourplanner.com/tours/sample_tour_01</span>
                <button
                  type="button"
                  onClick={() => alert('Client Itinerary Link copied to clipboard!')}
                  className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-500 transition-colors ml-2 shrink-0 cursor-pointer"
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="font-bold text-white text-xs">Itinerary Summary:</div>
              <div className="space-y-1 text-slate-300 text-xs">
                <div>• Stop #1 (09:30 AM): 123 Main St, Great Neck, NY — $1,450,000</div>
                <div>• Stop #2 (10:05 AM): 45 Harbor Rd, Manhasset, NY — $2,250,000</div>
                <div>• Stop #3 (10:42 AM): 12 Northern Blvd, Roslyn, NY — $1,890,000</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
