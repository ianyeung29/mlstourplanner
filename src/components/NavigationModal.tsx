'use client';

import React from 'react';
import { Tour } from '@/types/tour';
import { generateNavigationLinks } from '@/services/navigationService';
import { downloadIcsFile, generateGoogleCalendarUrl } from '@/services/calendarService';
import { X, Navigation, Map, Calendar, ExternalLink, Download, Sparkles, Check } from 'lucide-react';

interface NavigationModalProps {
  tour: Tour;
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationModal({ tour, isOpen, onClose }: NavigationModalProps) {
  const [copiedCalendar, setCopiedCalendar] = React.useState(false);

  if (!isOpen) return null;

  const navLinks = generateNavigationLinks(tour);
  const googleCalendarUrl = generateGoogleCalendarUrl(tour);

  const handleDownloadIcs = () => {
    downloadIcsFile(tour);
    setCopiedCalendar(true);
    setTimeout(() => setCopiedCalendar(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-300 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                GPS Driving Navigation & Calendar Export
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Launch turn-by-turn driving route or sync showing times to phone calendar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 bg-white dark:bg-slate-900">
          {/* Multi-Stop Driving Navigation Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Map className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                1-Tap GPS Driving Route ({navLinks.stopCount} Stops)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <a
                href={navLinks.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-all flex flex-col justify-between space-y-2 group cursor-pointer"
              >
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Full multi-stop driving route</div>
              </a>

              <a
                href={navLinks.appleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-all flex flex-col justify-between space-y-2 group cursor-pointer"
              >
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Apple Maps</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Native iPhone & Mac navigation</div>
              </a>

              <a
                href={navLinks.wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 text-left transition-all flex flex-col justify-between space-y-2 group cursor-pointer"
              >
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Waze</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Traffic-optimized navigation</div>
              </a>
            </div>
          </div>

          {/* Calendar Export Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Calendar Event Sync & Download
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-600/10 border border-emerald-300 dark:border-emerald-500/30 hover:border-emerald-500 text-left transition-all space-y-1.5 cursor-pointer"
              >
                <div className="font-bold text-emerald-950 dark:text-emerald-300 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Download iCalendar (.ics)</span>
                  </span>
                  {copiedCalendar && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                  Adds all confirmed showing stops to Apple Calendar, Outlook, or phone calendar app.
                </p>
              </button>

              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-600/10 border border-indigo-300 dark:border-indigo-500/30 hover:border-indigo-500 text-left transition-all space-y-1.5 cursor-pointer block"
              >
                <div className="font-bold text-indigo-950 dark:text-indigo-300 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Add to Google Calendar</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-400">
                  Creates Google Calendar event pre-filled with addresses, showing times, and notes.
                </p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
