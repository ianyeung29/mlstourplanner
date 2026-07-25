'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, saveUserProfile } from '@/services/storage';
import { X, Compass, LogIn, UserPlus, Mail, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

  const handleGoogleSignIn = async () => {
    // If user entered a specific email, use it; otherwise prompt user
    const targetEmail = email.trim();

    if (!targetEmail) {
      setErrorMsg('Please type your Gmail address in the email field below to sign in with Google.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_id: `g_${Date.now()}`,
          email: targetEmail,
          full_name: fullName.trim() || targetEmail.split('@')[0]
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        saveUserProfile({
          ...currentProfile,
          id: data.user.id,
          full_name: data.user.full_name,
          email: data.user.email,
          brokerage_name: data.user.brokerage_name || 'Luxury Real Estate',
          subscription_tier: 'FREE_TRIAL',
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
          full_name: fullName.trim() || email.split('@')[0],
          email: email.trim(),
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
          brokerage_name: data.user.brokerage_name || 'Luxury Real Estate',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-sans">
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
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 bg-slate-950 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs animate-fadeIn">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 font-semibold text-xs">
              <button
                type="button"
                onClick={() => { setMode('LOGIN'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-1 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  mode === 'LOGIN' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('REGISTER'); setErrorMsg(null); setSuccessMsg(null); }}
                className={`flex-1 py-1 rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  mode === 'REGISTER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>

            {mode === 'REGISTER' && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setErrorMsg(null); }}
                placeholder="Enter any email (e.g. user@gmail.com)"
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
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : mode === 'REGISTER' ? 'Register Account (Sends Verification Link)' : 'Sign In & Enter Workspace'}</span>
            </button>
          </form>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-950 px-3 text-[10px] text-slate-500 uppercase tracking-widest font-bold absolute">
              Or Quick Sign In
            </span>
          </div>

          {/* Google OAuth Quick Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center justify-center gap-2 shadow transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 15.907 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            <span>Sign In with Typed Email</span>
          </button>
        </div>
      </div>
    </div>
  );
}
