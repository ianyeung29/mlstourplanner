'use client';

import React, { useState, useEffect } from 'react';
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
  LogIn,
  Check,
  Server,
  Shield
} from 'lucide-react';
import { triggerAuthModal } from '@/services/authModal';
import { getUserProfile } from '@/services/storage';
import InteractiveDemo from '@/components/InteractiveDemo';

function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirectingCheckout, setIsRedirectingCheckout] = useState(false);

  useEffect(() => {
    const user = getUserProfile();
    const isLoggedIn = !!user && !!user.email && !!user.id;
    const isAuthRequired = searchParams.get('auth') === 'required' || searchParams.get('auth') === 'open';

    if (isLoggedIn && !isAuthRequired) {
      router.push('/dashboard');
      return;
    }

    if (isAuthRequired) {
      triggerAuthModal();
    }
  }, [router, searchParams]);

  const handleOpenAuth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerAuthModal();
  };

  const handleStripeCheckout = async () => {
    const user = getUserProfile();

    if (!user || !user.email || !user.id) {
      alert('Please Sign In or Create an Account first to unlock PRO Unlimited.');
      triggerAuthModal();
      return;
    }

    setIsRedirectingCheckout(true);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          userId: user.id,
          origin: window.location.origin
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start Stripe checkout session.');
        setIsRedirectingCheckout(false);
      }
    } catch (err: any) {
      alert(err.message || 'Network error connecting to Stripe.');
      setIsRedirectingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col space-y-12 pb-12 font-sans">
      {/* Hero Section */}
      <section className="max-w-[1200px] mx-auto px-4 pt-8 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Automated Showing Day Itinerary & Route Optimizer</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Turn Messy Listing Sheets into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">Conflict-Free Showing Days</span> in 2 Minutes.
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Automate driving routes, respect listing agent appointment windows, auto-arrange Open House visits, and deliver polished interactive itineraries to your buyer clients.
        </p>

        {/* Primary Hero CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleOpenAuth}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white text-sm font-black flex items-center justify-center gap-2 shadow-2xl transition-transform active:scale-95 cursor-pointer z-10"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Build a Tour Free — No Card Required</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Outcome Trust Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-[11px] text-slate-400 pt-2 font-medium">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 1-Click MLS & Document Extraction</span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-400" /> Google Maps Turn-by-Turn Route Sync</span>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-indigo-400" /> Client-Ready Interactive Web Links</span>
        </div>
      </section>

      {/* Interactive Product Demonstration Component */}
      <section className="px-4 pt-2">
        <InteractiveDemo />
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-[1200px] mx-auto px-4 space-y-6 pt-4">
        <div className="text-center space-y-1">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">3 Simple Steps</h2>
          <h3 className="text-2xl font-black text-white">From Messy Flyers to a Polished Client Itinerary</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="font-extrabold text-white text-sm">Ingest Property Listings</h4>
            <p className="text-slate-400 leading-relaxed">
              Enter MLS numbers, bulk-paste raw addresses, or upload multi-page listing flyers. AI extracts pricing, specs, agent contacts, and open house dates.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="font-extrabold text-white text-sm">Conflict-Aware Optimization</h4>
            <p className="text-slate-400 leading-relaxed">
              Calculates optimal driving sequences respecting locked stop orders, visit durations, travel buffers, and open house windows.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="font-extrabold text-white text-sm">Dispatch Client Itinerary</h4>
            <p className="text-slate-400 leading-relaxed">
              Generate interactive web links (`https://www.mlstourplanner.com/tours/...`), printable PDFs, or dispatch formatted email summaries in 1 click.
            </p>
          </div>
        </div>
      </section>

      {/* Outcome Feature Highlights Grid */}
      <section id="features" className="max-w-[1300px] mx-auto px-4 space-y-6 pt-4">
        <div className="text-center space-y-1">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Built for Buyer Agents & Teams</h2>
          <h3 className="text-2xl font-black text-white">Everything You Need to Run Professional Showing Days</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 hover:border-indigo-500/50 transition-all">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Conflict-Aware Route Scheduling</h4>
            <p className="text-slate-400 leading-relaxed">
              Automatically sequences property visits to eliminate driving back-and-forth while enforcing hard appointment times and travel buffers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 hover:border-indigo-500/50 transition-all">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Open House Auto-Detection</h4>
            <p className="text-slate-400 leading-relaxed">
              Detects public Open House hours on your tour date and aligns visits automatically without requiring private appointment requests.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 hover:border-indigo-500/50 transition-all">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-white text-sm">Client-Ready Web & Print Itineraries</h4>
            <p className="text-slate-400 leading-relaxed">
              Deliver branded web links, clean printable PDFs, or dispatch formatted showing schedules directly to buyer clients via email.
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Pricing Section */}
      <section id="pricing" className="max-w-[1000px] mx-auto px-4 space-y-6 pt-4">
        <div className="text-center space-y-1">
          <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Simple Transparent Pricing</h2>
          <h3 className="text-2xl font-black text-white">Start Free, Upgrade When You are Ready</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Trial Plan */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-[11px]">
                Free Trial
              </span>
              <div className="text-2xl font-black text-white">$0 <span className="text-xs font-normal text-slate-400">/ 3 Showing Tours</span></div>
              <p className="text-xs text-slate-400">Experience the full platform with zero commitment.</p>

              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3 Complete Showing Tours</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Conflict-Aware Route Optimization</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Interactive Map & Directions</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleOpenAuth}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Start Free Trial
            </button>
          </div>

          {/* PRO Unlimited Plan */}
          <div className="relative p-6 rounded-2xl bg-slate-900 border-2 border-indigo-500/80 shadow-2xl space-y-4 flex flex-col justify-between">
            <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-black text-[10px] tracking-wider uppercase shadow">
              Special Promo
            </div>

            <div className="space-y-3">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold text-[11px] border border-indigo-500/30">
                PRO Unlimited
              </span>
              <div className="text-2xl font-black text-white">
                $14.99 <span className="text-xs font-normal text-slate-400">/ month</span>
                <span className="ml-2 text-xs text-slate-500 line-through font-normal">$29.99/mo</span>
              </div>
              <p className="text-xs text-slate-400">For active agents running regular showing days.</p>

              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span><strong>Unlimited</strong> Showing Tours & Client Contacts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>DeepSeek AI Flyer Document Scanner</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1-Click Resend Email Dispatch to Clients</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Priority Route Optimization Server</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              disabled={isRedirectingCheckout}
              onClick={handleStripeCheckout}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-black text-xs shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isRedirectingCheckout ? 'Connecting to Stripe...' : 'Upgrade to PRO Unlimited ($14.99/mo)'}
            </button>
          </div>
        </div>
      </section>

      {/* Security & Platform Architecture Section */}
      <section className="max-w-[1000px] mx-auto px-4 pt-6 border-t border-slate-800/80">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Security & Data Privacy</span>
          </div>

          <h3 className="text-lg font-black text-white">Enterprise Security & Private Data Isolation</h3>

          <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Your tours, buyer client details, and agent notes remain private to your account. Powered by serverless PostgreSQL database encryption, secure OAuth 2.0 authentication, and Stripe PCI-compliant payment dispatches.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-2 font-medium">
            <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-emerald-400" /> Encrypted Database</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Server className="w-3.5 h-3.5 text-blue-400" /> Multi-Tenant Agent Isolation</span>
            <span>•</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> PCI-Compliant Payments</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LandingPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Loading MLS Tour Planner...
      </div>
    }>
      <LandingPageContent />
    </React.Suspense>
  );
}
