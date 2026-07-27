'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, ShieldCheck, Scale, Mail, MessageSquare, Heart } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // HIDE FOOTER ON PRINT SHEET VIEW
  if (pathname && pathname.includes('/print')) {
    return null;
  }

  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs py-8 px-4 font-sans transition-colors duration-200">
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Brand Identity */}
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center shadow">
            <Compass className="w-3 h-3 text-white" />
          </div>
          <span className="font-black text-slate-900 dark:text-white text-xs tracking-tight">MLSTourPlanner</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Automated Real Estate Showing Itinerary & Route Optimizer</span>
        </div>

        {/* Center Quick Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <Link href="/about" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            About MLSTourPlanner
          </Link>
          <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Contact Support
          </Link>
        </div>

        {/* Right Copyright & Build */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          © 2026 MLSTourPlanner · All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
