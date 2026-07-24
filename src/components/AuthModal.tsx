'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, saveUserProfile } from '@/services/storage';
import { UserProfile } from '@/types/tour';
import { X, Compass, LogIn, UserPlus, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEMO_AGENTS: UserProfile[] = [
  {
    id: 'agent_ian',
    full_name: 'Ian Yeung',
    email: 'ianyeung30@gmail.com',
    phone: '(516) 555-8820',
    brokerage_name: 'Side Realty & Luxury Properties',
    license_number: 'NY-1049281',
    default_start_address: '100 Northern Blvd, Great Neck, NY 11021',
    default_visit_minutes: 25,
    default_access_minutes: 5,
    default_travel_buffer: 5,
    timezone: 'America/New_York',
    subscription_tier: 'PAID_PRO',
    is_verified: true,
    tours_created_count: 5
  },
  {
    id: 'agent_sarah',
    full_name: 'Sarah Jenkins',
    email: 'sjenkins@compass.com',
    phone: '(516) 555-0192',
    brokerage_name: 'Compass Long Island',
    license_number: 'NY-8820192',
    default_start_address: '45 Harbor Rd, Manhasset, NY 11030',
    default_visit_minutes: 30,
    default_access_minutes: 5,
    default_travel_buffer: 5,
    timezone: 'America/New_York',
    subscription_tier: 'FREE_TRIAL',
    is_verified: true,
    tours_created_count: 2
  },
  {
    id: 'agent_michael',
    full_name: 'Michael Ross',
    email: 'mross@elliman.com',
    phone: '(516) 555-0143',
    brokerage_name: 'Douglas Elliman Real Estate',
    license_number: 'NY-9901432',
    default_start_address: '12 Northern Blvd, Roslyn, NY 11576',
    default_visit_minutes: 20,
    default_access_minutes: 5,
    default_travel_buffer: 5,
    timezone: 'America/New_York',
    subscription_tier: 'PAID_PRO',
    is_verified: true,
    tours_created_count: 12
  }
];

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const currentProfile = getUserProfile();

  const [mode, setMode] = React.useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [brokerage, setBrokerage] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectAgent = (agent: UserProfile) => {
    saveUserProfile(agent);
    onClose();
    router.push('/dashboard');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_id: `g_${Date.now()}`,
          email: email || 'ianyeung30@gmail.com',
          full_name: fullName || 'Ian Yeung (Google)'
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        saveUserProfile({
          ...currentProfile,
          id: data.user.id,
          full_name: data.user.full_name,
          email: data.user.email,
          brokerage_name: data.user.brokerage_name || 'Side Luxury Real Estate',
          subscription_tier: 'PAID_PRO',
          is_verified: true
        });
        onClose();
        router.push('/dashboard');
      } else {
        setErrorMsg(data.error || 'Google Authentication failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const endpoint = mode === 'REGISTER' ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName || email.split('@')[0],
          email,
          password,
          brokerage_name: brokerage,
          phone
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Authentication failed.');
      } else if (data.verification_required) {
        setSuccessMsg(data.message || `Verification link sent to ${email}. Please verify your email address before logging in.`);
        setMode('LOGIN');
      } else if (data.user) {
        saveUserProfile({
          ...currentProfile,
          id: data.user.id,
          full_name: data.user.full_name,
          email: data.user.email,
          phone: data.user.phone,
          brokerage_name: data.user.brokerage_name || 'Side Luxury Real Estate',
          subscription_tier: data.user.subscription_tier || 'FREE_TRIAL',
          is_verified: true
        });
        onClose();
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Agent Portal Sign In</h3>
              <p className="text-[11px] text-slate-400">Access your synced showing itineraries</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 bg-slate-950 text-xs">
          {/* Google OAuth Quick Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center justify-center gap-2 shadow transition-all active:scale-95 disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 15.907 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-950 px-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold absolute">
              Or Email Authentication
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 font-semibold text-xs">
              <button
                type="button"
                onClick={() => { setMode('LOGIN'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-1 rounded-md transition-colors flex items-center justify-center gap-1 ${
                  mode === 'LOGIN' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('REGISTER'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-1 rounded-md transition-colors flex items-center justify-center gap-1 ${
                  mode === 'REGISTER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Ian Yeung"
                  className="w-full bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. ianyeung30@gmail.com"
                className="w-full bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : mode === 'REGISTER' ? 'Register Account (Sends Verification Link)' : 'Sign In & Enter Workspace'}</span>
            </button>
          </form>

          {/* Preset Demo Agent Quick Switcher */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Switch Agent Demo Profile
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {DEMO_AGENTS.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer space-y-0.5 text-[11px]"
                >
                  <div className="font-bold text-white truncate">{agent.full_name}</div>
                  <div className="text-[9px] text-slate-400 truncate">{agent.brokerage_name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
