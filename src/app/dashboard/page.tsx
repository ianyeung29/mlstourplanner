'use client';

import React from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { Tour, UserProfile } from '@/types/tour';
import { getToursFromStorage, deleteTour, duplicateTour, getUserProfile, upgradeToPro, FREE_TRIAL_MAX_TOURS, canCreateNewTour } from '@/services/storage';
import StatusBadge from '@/components/StatusBadge';
import {
  Calendar,
  Clock,
  PlusCircle,
  Users,
  Copy,
  Trash2,
  Crown,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const [tours, setTours] = React.useState<Tour[]>([]);
  const [filter, setFilter] = React.useState<'ALL' | 'ACTIVE' | 'CONFIRMED' | 'COMPLETED'>('ALL');
  const [profile, setProfile] = React.useState<UserProfile>(getUserProfile());
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  const loadDashboard = React.useCallback(() => {
    setTours(getToursFromStorage());
    setProfile(getUserProfile());
  }, []);

  React.useEffect(() => {
    loadDashboard();

    const handleProfileUpdate = () => loadDashboard();
    window.addEventListener('profile_updated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);
    return () => {
      window.removeEventListener('profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [loadDashboard]);

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Delete tour "${name}"?`)) {
      deleteTour(id);
      loadDashboard();
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    duplicateTour(id);
    loadDashboard();
  };

  const [isRedirectingCheckout, setIsRedirectingCheckout] = React.useState(false);

  const handleUpgrade = async () => {
    setIsRedirectingCheckout(true);
    try {
      const user = getUserProfile();
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user?.email || '',
          userId: user?.id || '',
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

  const filteredTours = tours.filter(t => {
    if (filter === 'ACTIVE') return t.status === 'DRAFT' || t.status === 'REQUESTING' || t.status === 'PLANNED';
    if (filter === 'CONFIRMED') return t.status === 'CONFIRMED' || t.status === 'PARTIALLY_CONFIRMED';
    if (filter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  const totalConfirmedStops = tours.reduce(
    (acc, t) => acc + t.stops.filter(s => s.appointment_status === 'CONFIRMED').length,
    0
  );
  const totalStops = tours.reduce((acc, t) => acc + t.stops.length, 0);

  const isPro = profile.subscription_tier === 'PAID_PRO';
  const toursUsed = tours.length;

  return (
    <AuthGuard>
      <div className="space-y-4 max-w-[1600px] mx-auto">
        {/* Workspace Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-white tracking-tight">
                Agent Showing Tour Workspace
              </h1>
              {isPro ? (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" /> PRO Unlimited
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                  Free Trial ({toursUsed}/{FREE_TRIAL_MAX_TOURS} Used)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Logged in as <strong className="text-slate-200">{profile.full_name}</strong> ({profile.brokerage_name})
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {!isPro && (
              <button
                disabled={isRedirectingCheckout}
                onClick={handleUpgrade}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{isRedirectingCheckout ? 'Connecting to Stripe...' : 'Upgrade to PRO ($14.99/mo)'}</span>
              </button>
            )}

            <Link
              href={canCreateNewTour() ? "/tours/new" : "#"}
              onClick={(e) => {
                if (!canCreateNewTour()) {
                  e.preventDefault();
                  setShowUpgradeModal(true);
                }
              }}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ New Tour</span>
            </Link>
          </div>
        </div>

        {/* 4-Metric Bar in One Row */}
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Total Tours</div>
            <div className="text-lg font-black text-white">{tours.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Scheduled Properties</div>
            <div className="text-lg font-black text-indigo-400">{totalStops}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Confirmed Showings</div>
            <div className="text-lg font-black text-emerald-400">{totalConfirmedStops}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Active Account</div>
            <div className="text-xs font-bold text-white truncate">{profile.full_name}</div>
          </div>
        </div>

        {/* Tour List Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-semibold">
            {(['ALL', 'ACTIVE', 'CONFIRMED', 'COMPLETED'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  filter === f ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'ALL' ? 'All Tours' : f}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredTours.length} of {tours.length} tours
          </span>
        </div>

        {/* 3-Column Desktop Tour Cards Grid */}
        {filteredTours.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-white">No tours found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click "+ New Tour" to build your first multi-listing showing itinerary.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTours.map(t => (
              <div
                key={t.id}
                className="group p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between space-y-3 shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white text-sm tracking-tight truncate group-hover:text-indigo-400 transition-colors">
                      {t.name}
                    </h3>
                    <StatusBadge status={t.status} type="tour" size="sm" />
                  </div>

                  <div className="space-y-1 text-xs text-slate-300 font-medium">
                    {t.client_display_name && (
                      <div>Client: <strong className="text-slate-100">{t.client_display_name}</strong></div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{t.tour_date}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{t.earliest_start} – {t.latest_finish}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">{t.stops.length} Property Stops</span>
                    <span className="text-emerald-400 font-bold">
                      {t.stops.filter(s => s.appointment_status === 'CONFIRMED').length} Confirmed
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => handleDuplicate(t.id, e)}
                      title="Duplicate Tour"
                      className="p-1.5 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(t.id, t.name, e)}
                      title="Delete Tour"
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Link
                    href={`/tours/${t.id}`}
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow transition-colors"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pro Membership Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center shadow-lg">
                  <Crown className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">Upgrade to MLS Tour Planner PRO</h3>
                <p className="text-slate-400 text-xs">
                  Unlock infinite tour creation, unlimited MLS Web lookups, direct client email dispatch, and priority route optimization.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  disabled={isRedirectingCheckout}
                  onClick={handleUpgrade}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isRedirectingCheckout ? 'Connecting to Stripe Checkout...' : 'Activate PRO Unlimited ($14.99/mo Special Promo)'}
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Continue with Free Trial
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
