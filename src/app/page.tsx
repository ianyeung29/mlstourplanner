'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Smartphone,
  Crown,
  Lock,
  UserCheck,
  LogIn
} from 'lucide-react';
import { triggerAuthModal } from '@/services/authModal';

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (searchParams.get('auth') === 'required' || searchParams.get('auth') === 'open') {
      triggerAuthModal();
    }
  }, [searchParams]);

  const handleOpenAuth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerAuthModal();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col space-y-10 pb-8">
      {/* Hero Section */}
      <section className="max-w-[1200px] mx-auto px-4 pt-6 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>The #1 Showing Itinerary Platform for Top Real Estate Agents</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Plan Multi-Listing Showing Tours in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">Seconds, Not Hours.</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Automate drive times, resolve listing agent appointment conflicts, auto-arrange Open House visits, and deliver high-end interactive itineraries to buyer clients on Web, iOS, and Android.
        </p>

        {/* Hero CTA - Single Button to Popup Login Box */}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={handleOpenAuth}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white text-sm font-black flex items-center gap-2 shadow-2xl transition-transform active:scale-95 cursor-pointer z-10"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Agent Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2 font-medium">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Google OAuth & Email Login</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5 text-blue-400" /> iOS, Android & Web Sync</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-indigo-400" /> Neon Database Security</span>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="max-w-[1300px] mx-auto px-4 space-y-6 pt-4">
        <div className="text-center space-y-1">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Built for Luxury & High-Volume Agents</h2>
          <h3 className="text-2xl font-black text-white">Everything You Need to Run Seamless Showing Tours</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 hover:border-indigo-500/50 transition-all">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Deterministic Route Optimizer</h4>
            <p className="text-slate-400 leading-relaxed">
              Single-vehicle multi-stop optimization engine that enforces hard appointment constraints, travel buffers, and access windows.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 hover:border-indigo-500/50 transition-all">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Open House Auto-Arrangement</h4>
            <p className="text-slate-400 leading-relaxed">
              Detects public Open House hours and automatically aligns property visits within open windows without private showing requests.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 hover:border-indigo-500/50 transition-all">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Cross-Platform Neon Database</h4>
            <p className="text-slate-400 leading-relaxed">
              Powered by Neon PostgreSQL and REST APIs. Access your showing schedules on Web browsers, iPhone, and Android devices seamlessly.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section - $19/mo */}
      <section id="pricing" className="max-w-[1000px] mx-auto px-4 space-y-6 pt-4">
        <div className="text-center space-y-1">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Subscription Tiers</h2>
          <h3 className="text-2xl font-black text-white">Choose the Right Plan for Your Brokerage</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Trial Plan */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-[11px]">
                Free Trial
              </span>
              <div className="text-2xl font-black text-white">$0 <span className="text-xs font-normal text-slate-400">/ 3 Tours</span></div>
              <p className="text-xs text-slate-400">Perfect for agents testing the platform.</p>

              <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 3 Free Showing Tours</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> MLS Number Lookup & Web Scraper</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Open House Auto-Arrangement</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Hardware Protected Machine ID</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAuth}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center transition-colors block mt-4 cursor-pointer"
            >
              Sign In to Start Free Trial
            </button>
          </div>

          {/* Paid Pro Plan - $19/mo */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/50 space-y-4 flex flex-col justify-between shadow-2xl relative">
            <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider">
              Most Popular
            </div>

            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[11px] flex items-center gap-1 w-fit border border-indigo-500/30">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                PRO Unlimited
              </span>
              <div className="text-2xl font-black text-white">$19 <span className="text-xs font-normal text-slate-400">/ month</span></div>
              <p className="text-xs text-slate-300">For active real estate agents & teams.</p>

              <div className="space-y-2 text-xs text-slate-200 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Infinite Showing Tour Creation</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Resend Direct Email Client Delivery</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Cross-Platform REST API Access (iOS & Android)</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Priority AI Route Optimization</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAuth}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg transition-transform active:scale-95 mt-4 cursor-pointer"
            >
              Sign In & Unlock PRO ($19/mo)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LandingPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LandingPageContent />
    </React.Suspense>
  );
}
