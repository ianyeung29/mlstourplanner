'use client';

import React from 'react';
import { TourStop } from '@/types/tour';
import { X, Sparkles, CheckCircle2, MapPin, Clock, Car, Star, Layers, ArrowRight } from 'lucide-react';

export interface RouteOption {
  id: string;
  name: string;
  badgeText: string;
  badgeColor: 'emerald' | 'amber' | 'purple';
  summary: string;
  stops: TourStop[];
  stopsCoveredInWindow: number;
  totalStops: number;
  mustSeeVisitedCount: number;
  mustSeeTotalCount: number;
  totalDriveMins: number;
  totalDriveMiles: number;
}

interface RouteOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: RouteOption[];
  onSelectOption: (option: RouteOption) => void;
}

export default function RouteOptionModal({
  isOpen,
  onClose,
  options,
  onSelectOption
}: RouteOptionModalProps) {
  if (!isOpen || options.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-300 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Multi-Option Route Optimization & AI Recommendation</span>
                <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 font-mono text-[9px] font-bold">3 Presets</span>
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Select the route sequence that best fits your client's priorities</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Options Grid */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs bg-white dark:bg-slate-950">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {options.map((opt) => {
              const isPurple = opt.badgeColor === 'purple';
              const isEmerald = opt.badgeColor === 'emerald';

              return (
                <div
                  key={opt.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-4 relative ${
                    isPurple
                      ? 'bg-purple-50/50 dark:bg-gradient-to-b dark:from-purple-950/40 dark:to-slate-900 border-purple-300 dark:border-purple-500/50 shadow-lg'
                      : isEmerald
                        ? 'bg-slate-50 dark:bg-slate-900/90 border-emerald-300 dark:border-emerald-500/40 hover:border-emerald-400'
                        : 'bg-slate-50 dark:bg-slate-900/90 border-amber-300 dark:border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  {isPurple && (
                    <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-extrabold text-[9px] uppercase tracking-wider shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Recommended
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Badge & Title */}
                    <div className="space-y-1">
                      <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase tracking-wider inline-block ${
                        isPurple ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30' :
                        isEmerald ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' :
                        'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                      }`}>
                        {opt.badgeText}
                      </span>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">{opt.name}</h4>
                    </div>

                    {/* Summary */}
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      "{opt.summary}"
                    </p>

                    {/* Key Metrics Matrix */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-medium pt-1">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                        <div className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Covered in Window
                        </div>
                        <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                          {opt.stopsCoveredInWindow} / {opt.totalStops} Covered
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
                        <div className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Must See
                        </div>
                        <div className="font-extrabold text-amber-600 dark:text-amber-300 text-xs">
                          {opt.mustSeeVisitedCount} / {opt.mustSeeTotalCount} Covered
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5 col-span-2 flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
                          <Car className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Total Drive Metrics
                        </span>
                        <span className="font-bold text-indigo-700 dark:text-indigo-300">
                          {opt.totalDriveMins} mins ({opt.totalDriveMiles} mi)
                        </span>
                      </div>
                    </div>

                    {/* Property Order Mini Sequence List */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Proposed Stop Order:</div>
                      <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {opt.stops.map((s, idx) => (
                          <div key={s.id || idx} className="text-[11px] text-slate-800 dark:text-slate-300 flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
                            <span className="truncate max-w-[180px]">
                              <strong className="text-indigo-600 dark:text-indigo-400 mr-1.5">#{idx + 1}</strong>
                              {s.normalized_address}
                            </span>
                            {s.priority === 'MUST_SEE' && (
                              <span className="text-[9px] font-bold px-1 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 shrink-0">
                                Must See
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectOption(opt);
                      onClose();
                    }}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                      isPurple
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : isEmerald
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    <span>Apply {opt.badgeText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
