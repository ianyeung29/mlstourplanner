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
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [showCancelNotice, setShowCancelNotice] = useState(false);

  const { theme, setTheme } = useTheme();

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
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Agent Profile & Preferences
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Configure your agent defaults, color theme, and subscription billing options
            </p>
          </div>
          {savedSuccess && (
            <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved Successfully</span>
            </div>
          )}
        </div>

        {/* Subscription Plan & Billing Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-slate-200 dark:border-indigo-500/30 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {isProActive ? 'PRO Unlimited Subscription' : 'Free Trial Mode'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isProActive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                }`}>
                  {isProActive ? 'ACTIVE ($14.99/mo)' : '3/3 FREE TOURS REMAINING'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {isProActive
                  ? 'Unlimited tours, DeepSeek AI Scanner, multi-property route optimization, and client dispatches.'
                  : 'Upgrade to PRO Unlimited to unlock unlimited showing tours, DeepSeek AI scanning, and client dispatches.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenStripePortal}
                disabled={isLoadingPortal}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingPortal ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5" />
                )}
                <span>{isProActive ? 'Manage Stripe Billing' : 'Upgrade to PRO ($14.99/mo)'}</span>
              </button>

              {isProActive && (
                <button
                  type="button"
                  onClick={handleLocalCancelSubscription}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  Cancel Plan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-4 text-xs shadow-lg">
          <div className="space-y-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-200 dark:border-slate-800 pb-1">Agent & Brokerage Credentials</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Agent Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={e => handleChange('full_name', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Brokerage Firm</label>
                <input
                  type="text"
                  value={profile.brokerage_name || ''}
                  onChange={e => handleChange('brokerage_name', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Mobile Phone</label>
                <input
                  type="text"
                  value={profile.phone || ''}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h2 className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-200 dark:border-slate-800 pb-1">🎨 App Color Theme Preference</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  handleChange('theme_mode', 'light');
                  setTheme('light');
                }}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  (profile.theme_mode || theme) === 'light'
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-950 dark:text-white font-bold ring-2 ring-indigo-500/50'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Sun className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Light Mode (Default)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Clean, high-contrast light theme</div>
                  </div>
                </div>
                {(profile.theme_mode || theme) === 'light' && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  handleChange('theme_mode', 'dark');
                  setTheme('dark');
                }}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  (profile.theme_mode || theme) === 'dark'
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-950 dark:text-white font-bold ring-2 ring-indigo-500/50'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Sleek dark mode theme</div>
                  </div>
                </div>
                {(profile.theme_mode || theme) === 'dark' && <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h2 className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-200 dark:border-slate-800 pb-1">Showing Defaults & Optimization Rules</h2>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Default Starting Address</label>
              <input
                type="text"
                value={profile.default_start_address || ''}
                onChange={e => handleChange('default_start_address', e.target.value)}
                placeholder="100 Northern Blvd, Great Neck, NY 11021"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Default Visit Time (mins)</label>
                <input
                  type="number"
                  value={profile.default_visit_minutes || 25}
                  onChange={e => handleChange('default_visit_minutes', parseInt(e.target.value) || 25)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Access Before (mins)</label>
                <input
                  type="number"
                  value={profile.default_access_minutes || 5}
                  onChange={e => handleChange('default_access_minutes', parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Travel Buffer (mins)</label>
                <input
                  type="number"
                  value={profile.default_travel_buffer || 5}
                  onChange={e => handleChange('default_travel_buffer', parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 focus:outline-none focus:border-indigo-500"
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
