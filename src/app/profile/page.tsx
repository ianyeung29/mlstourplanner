'use client';

import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import { UserProfile } from '@/types/tour';
import { getUserProfile, saveUserProfile } from '@/services/storage';
import { Settings, Save, CheckCircle2, Building, User, Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<UserProfile>(getUserProfile());
  const [savedSuccess, setSavedSuccess] = React.useState(false);

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

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <span>Agent Profile & Showing Settings</span>
            </h1>
            <p className="text-xs text-slate-400">
              Configure your default showing durations, travel buffers, and starting location.
            </p>
          </div>

          {savedSuccess && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs shadow-lg">
          <div className="space-y-3">
            <h2 className="font-bold text-white text-xs border-b border-slate-800 pb-1">Agent & Brokerage Credentials</h2>

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-3 gap-3">
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
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Showing Defaults</span>
          </button>
        </form>
      </div>
    </AuthGuard>
  );
}
