'use client';

import React, { useState } from 'react';
import { TourStop } from '@/types/tour';
import { X, Utensils, Coffee, Clock, MapPin, Sparkles, Check } from 'lucide-react';

interface AddBreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBreak: (breakStop: Partial<TourStop>) => void;
}

export default function AddBreakModal({ isOpen, onClose, onAddBreak }: AddBreakModalProps) {
  const [breakType, setBreakType] = useState<'LUNCH' | 'COFFEE' | 'CUSTOM'>('LUNCH');
  const [customTitle, setCustomTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [addressInput, setAddressInput] = useState('');
  const [startTimeInput, setStartTimeInput] = useState('12:30 PM');
  const [isTimeLocked, setIsTimeLocked] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const title = breakType === 'LUNCH'
      ? 'Lunch & Refreshment Break'
      : breakType === 'COFFEE'
      ? 'Coffee & Snack Rest Stop'
      : (customTitle.trim() || 'Rest Break');

    const address = addressInput.trim() || 'Lunch / Rest Stop';

    const newBreakStop: Partial<TourStop> = {
      is_break: true,
      break_title: title,
      original_input: address,
      normalized_address: address,
      latitude: 40.79,
      longitude: -73.69,
      visit_minutes: durationMinutes,
      priority: 'MUST_SEE',
      appointment_status: isTimeLocked ? 'CONFIRMED' : 'NOT_REQUESTED',
      scheduling_mode: isTimeLocked ? 'TIME_LOCKED' : 'FLEXIBLE',
      confirmed_start: isTimeLocked ? startTimeInput : undefined,
      proposed_start: startTimeInput,
      planned_arrival: startTimeInput,
      agent_notes: `Scheduled ${durationMinutes}-min ${title}.`
    };

    onAddBreak(newBreakStop);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn font-sans text-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-500/10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-600/20 border border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Add Lunch / Rest Break to Tour
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Inserts a scheduled meal/rest stop into your showing route
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-white dark:bg-slate-900">
          {/* Preset Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200">Break Category:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBreakType('LUNCH')}
                className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  breakType === 'LUNCH'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Lunch Break</span>
              </button>

              <button
                type="button"
                onClick={() => setBreakType('COFFEE')}
                className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  breakType === 'COFFEE'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Coffee Stop</span>
              </button>

              <button
                type="button"
                onClick={() => setBreakType('CUSTOM')}
                className={`py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  breakType === 'CUSTOM'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom</span>
              </button>
            </div>
          </div>

          {/* Custom Title Input */}
          {breakType === 'CUSTOM' && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Custom Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="e.g. Client Debrief Lunch"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Duration Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Break Duration:</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 45, 60].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-2 rounded-xl font-extrabold transition-all cursor-pointer ${
                    durationMinutes === mins
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {mins} Minutes
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Time & Lock Toggle */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 dark:text-amber-300">Target Break Start Time:</span>
              <input
                type="text"
                value={startTimeInput}
                onChange={e => setStartTimeInput(e.target.value)}
                placeholder="12:30 PM"
                className="w-28 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-center px-2 py-1 rounded-xl border border-amber-300 dark:border-amber-500/40 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isTimeLocked}
                onChange={e => setIsTimeLocked(e.target.checked)}
                className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span>Lock to exact time slot (e.g. 12:30 PM reserved)</span>
            </label>
          </div>

          {/* Optional Restaurant / Address Input */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>Location / Restaurant Address (Optional):</span>
            </label>
            <input
              type="text"
              value={addressInput}
              onChange={e => setAddressInput(e.target.value)}
              placeholder="e.g. Main Street Bistro, Roslyn NY 11576"
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-extrabold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Add {durationMinutes}-Min Break to Schedule</span>
          </button>
        </form>
      </div>
    </div>
  );
}
