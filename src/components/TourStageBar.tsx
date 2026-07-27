'use client';

import React from 'react';
import { Layers, MapPin, Route, Share2, Check } from 'lucide-react';

interface TourStageBarProps {
  currentStage: 1 | 2 | 3; // 1 = Properties, 2 = Route, 3 = Share
  onSelectStage?: (stage: 1 | 2 | 3) => void;
  canNavigateToRoute?: boolean;
  canNavigateToShare?: boolean;
}

export default function TourStageBar({
  currentStage,
  onSelectStage,
  canNavigateToRoute = true,
  canNavigateToShare = true
}: TourStageBarProps) {
  const stages = [
    { id: 1, name: '1. Properties', description: 'Add listings & flyers', icon: MapPin },
    { id: 2, name: '2. Route', description: 'Instant route & conflicts', icon: Route },
    { id: 3, name: '3. Share', description: 'Select buyer & dispatch', icon: Share2 }
  ];

  return (
    <div className="w-full max-w-[1200px] mx-auto bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-2.5 shadow-md">
      <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs font-sans">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const isActive = currentStage === stage.id;
          const isPassed = currentStage > stage.id;

          let isClickable = false;
          if (stage.id === 1) isClickable = true;
          if (stage.id === 2 && canNavigateToRoute) isClickable = true;
          if (stage.id === 3 && canNavigateToShare) isClickable = true;

          return (
            <button
              key={stage.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSelectStage?.(stage.id as 1 | 2 | 3)}
              className={`p-2.5 sm:p-3 rounded-xl transition-all flex items-center justify-center sm:justify-start gap-2.5 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-extrabold shadow-lg ring-1 ring-indigo-400/50'
                  : isPassed
                  ? 'bg-emerald-50 dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-950/60 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800/80 cursor-not-allowed'
              } ${isClickable && !isActive ? 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer' : ''}`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white font-black'
                    : isPassed
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                    : 'bg-slate-200 dark:bg-slate-900 text-slate-500'
                }`}
              >
                {isPassed ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Icon className="w-4 h-4" />}
              </div>

              <div className="text-left hidden sm:block min-w-0">
                <div className="font-black text-xs tracking-tight truncate">{stage.name}</div>
                <div
                  className={`text-[10px] truncate ${
                    isActive ? 'text-indigo-100 font-medium' : isPassed ? 'text-emerald-600 dark:text-emerald-400/80' : 'text-slate-500'
                  }`}
                >
                  {stage.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
