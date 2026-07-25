'use client';

import React, { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { UserProfile } from '@/types/tour';
import { getUserProfile, saveUserProfile } from '@/services/storage';
import {
  Settings,
  Save,
  CheckCircle2,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Crown,
  CreditCard,
  ExternalLink,
  HeartHandshake,
  AlertTriangle,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [showCancelNotice, setShowCancelNotice] = useState(false);

  const handleChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveUserProfile(profile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Calculate Service Termination Date (End of current 30-day billing period)
  const getTerminationDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleOpenStripePortal = async () => {
    setIsLoadingPortal(true);
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: profile.email,
          origin: window.location.origin
        })
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open Stripe Billing Portal.');
        setIsLoadingPortal(false);
      }
    } catch (err: any) {
      alert(err.message || 'Network error connecting to Stripe Billing Portal.');
      setIsLoadingPortal(false);
    }
  };

  const handleLocalCancelSubscription = () => {
    if (confirm('Are you sure you want to cancel your PRO Unlimited subscription?')) {
      const updated: UserProfile = {
        ...profile,
        subscription_tier: 'FREE_TRIAL'
      };
      saveUserProfile(updated);
      setProfile(updated);
      setShowCancelNotice(true);
    }
  };

  const isProActive = profile.subscription_tier === 'PAID_PRO';

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto space-y-6 font-sans pb-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <span>Agent Account & Subscription Settings</span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage your profile, billing subscription, default visit durations, and travel buffers.
            </p>
          </div>

          {savedSuccess && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}
        </div>

        {/* Subscription Plan & Billing Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <h2 className="font-bold text-white text-xs">Active Plan & Subscription Status</h2>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 border ${
              isProActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
            }`}>
              {isProActive ? '🟢 PRO UNLIMITED ($14.99/mo)' : '⚪ FREE TRIAL PLAN'}
            </span>
          </div>

          {/* Polite Cancellation Farewell Message & Termination Date Notice */}
          {showCancelNotice && (
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2 text-xs animate-fadeIn">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <HeartHandshake className="w-4 h-4 text-rose-400 shrink-0" />
                <span>We&apos;re sorry to see you go!</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Thank you for using MLSTourPlanner to plan your showing tours with us! We&apos;ve loved helping you deliver seamless experiences to your buyer clients.
              </p>
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px]">
                📅 <strong>Service Termination Date:</strong> Your PRO features will remain fully active until <strong>{getTerminationDateStr()}</strong> (the end of your current billing period). No further renewal charges will occur.
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs pt-1">
            <div className="text-slate-300 text-[11px] space-y-1">
              <div>Plan: <strong className="text-white">{isProActive ? 'PRO Unlimited Membership' : 'Free Trial Account'}</strong></div>
              <div>Billing Cycle: <span className="text-slate-400">{isProActive ? '$14.99 / month (Special Promo Rate)' : 'Standard Trial Access'}</span></div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              {/* Stripe Customer Portal Launcher */}
              <button
                type="button"
                disabled={isLoadingPortal}
                onClick={handleOpenStripePortal}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors w-full sm:w-auto cursor-pointer"
              >
                {isLoadingPortal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                <span>{isLoadingPortal ? 'Opening Portal...' : 'Manage Billing in Stripe'}</span>
                <ExternalLink className="w-3 h-3 text-indigo-300" />
              </button>

              {isProActive && (
                <button
                  type="button"
                  onClick={handleLocalCancelSubscription}
                  className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/60 text-rose-300 hover:text-rose-200 border border-rose-500/40 text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  Cancel Plan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs shadow-lg">
          <div className="space-y-3">
            <h2 className="font-bold text-white text-xs border-b border-slate-800 pb-1">Agent & Brokerage Credentials</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Agent Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={e => handleChange('full_name', e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Brokerage Firm</label>
                <input
                  type="text"
                  value={profile.brokerage_name || ''}
                  onChange={e => handleChange('brokerage_name', e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Mobile Phone</label>
                <input
                  type="text"
                  value={profile.phone || ''}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h2 className="font-bold text-white text-xs border-b border-slate-800 pb-1">Showing Defaults & Optimization Rules</h2>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Default Starting Address</label>
              <input
                type="text"
                value={profile.default_start_address || ''}
                onChange={e => handleChange('default_start_address', e.target.value)}
                placeholder="100 Northern Blvd, Great Neck, NY 11021"
                className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Default Visit Time (mins)</label>
                <input
                  type="number"
                  value={profile.default_visit_minutes || 25}
                  onChange={e => handleChange('default_visit_minutes', parseInt(e.target.value) || 25)}
                  className="w-full bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Access Buffer (mins)</label>
                <input
                  type="number"
                  value={profile.default_access_minutes || 5}
                  onChange={e => handleChange('default_access_minutes', parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Travel Buffer (mins)</label>
                <input
                  type="number"
                  value={profile.default_travel_buffer || 5}
                  onChange={e => handleChange('default_travel_buffer', parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-950 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Showing Defaults</span>
          </button>
        </form>
      </div>
    </AuthGuard>
  );
}
