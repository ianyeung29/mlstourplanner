'use client';

import React from 'react';
import { Tour } from '@/types/tour';
import { generateConflictRemedies } from '@/services/routeOptimizer';
import { AlertTriangle, Lightbulb, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ConflictBannerProps {
  tour: Tour;
  warnings: string[];
  infeasibleReasons?: string[];
}

export default function ConflictBanner({ tour, warnings, infeasibleReasons = [] }: ConflictBannerProps) {
  const hasConflicts = infeasibleReasons.length > 0;
  const hasWarnings = warnings.length > 0;

  if (!hasConflicts && !hasWarnings) {
    return (
      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fadeIn">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Feasible Route: All showing stops are within availability windows & travel buffers!</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono">0 Conflicts</span>
      </div>
    );
  }

  const remedies = generateConflictRemedies(tour, warnings, infeasibleReasons);

  return (
    <div className="space-y-2 animate-fadeIn text-xs">
      {/* Hard Conflict Notice */}
      {hasConflicts && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 space-y-2 shadow-lg">
          <div className="flex items-center space-x-2 font-bold text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Hard Scheduling Conflicts Detected ({infeasibleReasons.length})</span>
          </div>

          <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-300">
            {infeasibleReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings & Auto-Arrangements */}
      {hasWarnings && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1.5">
          <div className="flex items-center space-x-2 font-bold text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Schedule Adjustments & Open House Alerts ({warnings.length})</span>
          </div>

          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200 font-medium">
            {warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actionable Remedies */}
      {remedies.length > 0 && (
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-1.5 text-indigo-400 font-bold text-xs">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Suggested Conflict Remedies</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {remedies.map((remedy, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-0.5"
              >
                <div className="font-bold text-white">{remedy.title}</div>
                <div className="text-slate-400">{remedy.actionText}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
