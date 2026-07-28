'use client';

import React from 'react';
import { Tour, TourStop, AppointmentStatus } from '@/types/tour';
import { getUserProfile } from '@/services/storage';
import {
  extractTemplateVariables,
  DEFAULT_EMAIL_TEMPLATE,
  DEFAULT_SMS_TEMPLATE,
  renderTemplate
} from '@/services/template';
import { X, Copy, Check, Mail, MessageSquare, CheckCircle2, AlertCircle, XCircle, Clock, ExternalLink, Send, Phone } from 'lucide-react';

interface AppointmentModalProps {
  tour: Tour;
  stop: TourStop | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (stopId: string, status: AppointmentStatus, confirmedTime?: string) => void;
}

export default function AppointmentModal({
  tour,
  stop,
  isOpen,
  onClose,
  onUpdateStatus
}: AppointmentModalProps) {
  const [channel, setChannel] = React.useState<'SMS' | 'EMAIL'>('SMS');
  const [copied, setCopied] = React.useState(false);
  const [draftText, setDraftText] = React.useState('');
  const [confirmedTimeInput, setConfirmedTimeInput] = React.useState('');
  const [agentPhoneInput, setAgentPhoneInput] = React.useState('');
  const [agentEmailInput, setAgentEmailInput] = React.useState('');

  const user = getUserProfile();

  React.useEffect(() => {
    if (stop) {
      const vars = extractTemplateVariables(tour, stop, user);
      const template = channel === 'SMS' ? DEFAULT_SMS_TEMPLATE : DEFAULT_EMAIL_TEMPLATE;
      setDraftText(renderTemplate(template, vars));
      setConfirmedTimeInput(stop.confirmed_start || stop.proposed_start || '10:00 AM');
      setAgentPhoneInput(stop.listing_agent_phone || '');
      setAgentEmailInput(stop.listing_agent_email || '');
    }
  }, [stop, tour, channel]);

  if (!isOpen || !stop) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to build deep-link SMS URI for iOS & Android
  const getSmsUrl = () => {
    const cleanPhone = (agentPhoneInput || '').replace(/[^0-9+]/g, '');
    const encodedText = encodeURIComponent(draftText);
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    return cleanPhone
      ? `sms:${cleanPhone}${separator}body=${encodedText}`
      : `sms:${separator}body=${encodedText}`;
  };

  // Helper to build Mailto URI
  const getMailtoUrl = () => {
    const subject = `Showing Request: ${stop.normalized_address}`;
    return `mailto:${encodeURIComponent(agentEmailInput)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draftText)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Showing Request & Status
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-md truncate">
              {stop.normalized_address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white dark:bg-slate-900 text-xs">
          {/* Channel Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setChannel('SMS')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                channel === 'SMS'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>SMS Request Draft</span>
            </button>
            <button
              onClick={() => setChannel('EMAIL')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                channel === 'EMAIL'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email Request Draft</span>
            </button>
          </div>

          {/* Listing Agent Contact Details Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
              <span>Listing Agent Details:</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {stop.listing_agent_name || 'N/A'} {stop.listing_brokerage ? `(${stop.listing_brokerage})` : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">Phone:</span>
                <input
                  type="text"
                  value={agentPhoneInput}
                  onChange={(e) => setAgentPhoneInput(e.target.value)}
                  placeholder="e.g. (516) 555-0188"
                  className="bg-transparent text-slate-900 dark:text-white font-mono font-bold focus:outline-none w-full"
                />
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">Email:</span>
                <input
                  type="email"
                  value={agentEmailInput}
                  onChange={(e) => setAgentEmailInput(e.target.value)}
                  placeholder="e.g. agent@realty.com"
                  className="bg-transparent text-slate-900 dark:text-white font-mono font-bold focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          {/* Draft Message Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Ready-to-Send Draft Message</span>
              <span>{draftText.length} characters</span>
            </div>
            <div className="relative">
              <textarea
                rows={6}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 text-sm font-sans p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed resize-none"
              />

              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Mobile Dispatch Action Banner */}
          {channel === 'SMS' ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5 text-emerald-950 dark:text-emerald-300">
                <div className="font-extrabold flex items-center gap-1.5 text-sm">
                  <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>One-Tap Mobile SMS Auto-Fill</span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                  Opens native Messages app on iPhone or Android with phone number & text pre-filled.
                </p>
              </div>

              <a
                href={getSmsUrl()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open SMS App on Phone</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5 text-indigo-950 dark:text-indigo-300">
                <div className="font-extrabold flex items-center gap-1.5 text-sm">
                  <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>One-Tap Mail App Auto-Fill</span>
                </div>
                <p className="text-[11px] text-indigo-800 dark:text-indigo-400">
                  Opens default Email client with listing agent email, subject line, and body text pre-filled.
                </p>
              </div>

              <a
                href={getMailtoUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 shrink-0 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Open Mail App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Update Appointment Status Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">
              Record Listing Agent Response
            </label>

            {/* Confirmed time input */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Confirmed Start Time:</span>
              <input
                type="text"
                value={confirmedTimeInput}
                onChange={(e) => setConfirmedTimeInput(e.target.value)}
                placeholder="e.g. 10:30 AM"
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold px-3 py-1.5 rounded-xl focus:outline-none focus:border-emerald-500 w-32"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  onUpdateStatus(stop.id, 'CONFIRMED', confirmedTimeInput);
                  onClose();
                }}
                className="px-3 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Confirm Time</span>
              </button>

              <button
                onClick={() => {
                  onUpdateStatus(stop.id, 'REQUESTED');
                  onClose();
                }}
                className="px-3 py-2.5 rounded-xl bg-blue-100 dark:bg-blue-600/20 hover:bg-blue-600/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Mark Requested</span>
              </button>

              <button
                onClick={() => {
                  onUpdateStatus(stop.id, 'ALTERNATE_PROPOSED');
                  onClose();
                }}
                className="px-3 py-2.5 rounded-xl bg-amber-100 dark:bg-amber-600/20 hover:bg-amber-600/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Alt Offered</span>
              </button>

              <button
                onClick={() => {
                  onUpdateStatus(stop.id, 'DECLINED');
                  onClose();
                }}
                className="px-3 py-2.5 rounded-xl bg-rose-100 dark:bg-rose-600/20 hover:bg-rose-600/30 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Declined</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
