'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, MapPin, Clock, Route, CheckCircle2, ArrowLeft, ShieldCheck, Mail, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Top Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Built for Modern Real Estate Agents</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            About <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">MLSTourPlanner</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            The intelligent showing tour optimizer that turns messy MLS listing sheets into perfectly sequenced, time-optimized property tours for buyers and agents.
          </p>
        </div>

        {/* Our Mission */}
        <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Our Mission</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Real estate agents spend hours manually plotting property locations, guessing drive times, checking Open House hours, and emailing listing agents for showing appointments. 
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>MLSTourPlanner</strong> was created to eliminate driving backtracks, enforce strict tour completion deadlines (like finishing before 3:00 PM), and auto-generate professional itineraries for clients in seconds.
          </p>
        </div>

        {/* Key Platform Highlights */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white text-center">Why Top-Producing Agents Trust MLSTourPlanner</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                <Route className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-white">5,040 Permutation Engine</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Evaluates every possible showing sequence mathematically to guarantee maximum <strong>⭐ Must See</strong> listings are visited within your tour window.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-white">Open House Sync</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Detects active Open House hours automatically and bumps arrival times so you never arrive at a closed door.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-white">Automated Appointments</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Auto-populates calculated showing slots into 4 listing agent appointment email templates with direct Resend API dispatch.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Footer Card */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-900/40 via-purple-950/40 to-slate-900 border border-indigo-500/40 text-center space-y-4">
          <h2 className="text-xl font-black text-white">Ready to Transform Your Showing Tours?</h2>
          <p className="text-xs text-slate-300 max-w-xl mx-auto">
            Join thousands of modern agents saving up to 2 hours per tour while delivering white-glove client experiences.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/tours/new"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-transform active:scale-95"
            >
              Build Your First Tour Free
            </Link>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="pt-6 border-t border-slate-800 flex justify-between text-xs text-slate-400">
          <span>© 2026 MLSTourPlanner. All Rights Reserved.</span>
          <div className="space-x-4">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/contact" className="hover:text-white">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
