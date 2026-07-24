'use client';

import React from 'react';
import { AppointmentStatus, TourStatus, StopPriority } from '@/types/tour';
import { CheckCircle2, Clock, XCircle, AlertCircle, HelpCircle, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: AppointmentStatus | TourStatus | StopPriority | string;
  type?: 'appointment' | 'tour' | 'priority';
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, type = 'appointment' }: StatusBadgeProps) {
  const baseClasses = "inline-flex items-center gap-1 font-semibold rounded px-2 py-0.5 text-[11px]";

  if (type === 'appointment') {
    switch (status as AppointmentStatus) {
      case 'CONFIRMED':
        return (
          <span className={`${baseClasses} bg-emerald-500/15 text-emerald-400 border border-emerald-500/30`}>
            <CheckCircle2 className="w-3 h-3" />
            Confirmed
          </span>
        );
      case 'REQUESTED':
        return (
          <span className={`${baseClasses} bg-blue-500/15 text-blue-400 border border-blue-500/30`}>
            <Clock className="w-3 h-3" />
            Requested
          </span>
        );
      case 'ALTERNATE_PROPOSED':
        return (
          <span className={`${baseClasses} bg-amber-500/15 text-amber-400 border border-amber-500/30`}>
            <AlertCircle className="w-3 h-3" />
            Alt Offered
          </span>
        );
      case 'DECLINED':
        return (
          <span className={`${baseClasses} bg-rose-500/15 text-rose-400 border border-rose-500/30`}>
            <XCircle className="w-3 h-3" />
            Declined
          </span>
        );
      case 'NOT_REQUESTED':
      default:
        return (
          <span className={`${baseClasses} bg-slate-800 text-slate-400 border border-slate-700`}>
            <HelpCircle className="w-3 h-3" />
            Not Requested
          </span>
        );
    }
  }

  if (type === 'priority') {
    switch (status as StopPriority) {
      case 'MUST_SEE':
        return (
          <span className={`${baseClasses} bg-indigo-500/15 text-indigo-300 border border-indigo-500/30`}>
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Must See
          </span>
        );
      case 'PREFERRED':
        return (
          <span className={`${baseClasses} bg-slate-800 text-slate-300 border border-slate-700`}>
            Preferred
          </span>
        );
      case 'OPTIONAL':
      default:
        return (
          <span className={`${baseClasses} bg-slate-900 text-slate-400 border border-slate-800`}>
            Optional
          </span>
        );
    }
  }

  return (
    <span className={`${baseClasses} bg-indigo-500/20 text-indigo-300 border border-indigo-500/30`}>
      <Clock className="w-3 h-3" />
      {status}
    </span>
  );
}
