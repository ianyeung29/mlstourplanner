'use client';

import React from 'react';
import { Tour } from '@/types/tour';
import { getUserProfile } from '@/services/storage';
import { generateClientItineraryEmail, ClientEmailResult } from '@/services/clientEmailService';
import { X, Mail, Copy, Check, ExternalLink, Send, Sparkles, Code, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface ClientEmailModalProps {
  tour: Tour;
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientEmailModal({ tour, isOpen, onClose }: ClientEmailModalProps) {
  const [tab, setTab] = React.useState<'PREVIEW' | 'TEXT' | 'HTML'>('PREVIEW');
  const [recipientEmail, setRecipientEmail] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [sendSuccess, setSendSuccess] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);

  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedText, setCopiedText] = React.useState(false);
  const [copiedHtml, setCopiedHtml] = React.useState(false);

  const user = getUserProfile();

  React.useEffect(() => {
    setSendSuccess(false);
    setSendError(null);
    if (tour.client_email) {
      setRecipientEmail(tour.client_email);
    }
  }, [isOpen, tour]);

  if (!isOpen) return null;

  const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  const currentOrigin = envBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://www.mlstourplanner.com');
  const emailData: ClientEmailResult = generateClientItineraryEmail(tour, user, currentOrigin);

  const handleSendResendEmail = async () => {
    if (!recipientEmail.trim()) {
      alert('Please enter a recipient email address.');
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: emailData.subject,
          text: emailData.bodyText,
          html: emailData.bodyHtml
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSendSuccess(true);
      } else {
        setSendError(data.error || 'Failed to send email via Resend API.');
      }
    } catch (err: any) {
      setSendError(err.message || 'Network error.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(emailData.onlineUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(emailData.bodyText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(emailData.bodyHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Email Client Showing Itinerary
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Subject: <span className="text-slate-900 dark:text-slate-200 font-medium">{emailData.subject}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resend Direct Email Dispatch Bar */}
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">Recipient Client Email:</span>
            <input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="e.g. buyer.client@gmail.com"
              className="flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 w-full"
            />
            <button
              disabled={isSending || !recipientEmail.trim()}
              onClick={handleSendResendEmail}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isSending ? 'Sending via Resend...' : 'Send Direct via Resend'}</span>
            </button>
          </div>

          {/* Status Feedback Banners */}
          {sendSuccess && (
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Email delivered successfully via Resend API!</span>
            </div>
          )}

          {sendError && (
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/20 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-start gap-1.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white block">Resend Notice:</strong>
                <span>{sendError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Online Link Sharing Bar */}
        <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-indigo-700 dark:text-indigo-300 shrink-0">Online Link:</span>
            <span className="text-slate-700 dark:text-slate-300 font-mono truncate">{emailData.onlineUrl}</span>
          </div>

          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white border border-indigo-200 dark:border-indigo-500/30 font-bold text-[11px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex px-4 pt-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-x-2 text-xs font-semibold">
          <button
            onClick={() => setTab('PREVIEW')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'PREVIEW'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>HTML Preview</span>
          </button>

          <button
            onClick={() => setTab('TEXT')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'TEXT'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Plain Text</span>
          </button>

          <button
            onClick={() => setTab('HTML')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'HTML'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>HTML Source</span>
          </button>
        </div>

        {/* Content Body Area */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950">
          {tab === 'PREVIEW' && (
            <div
              className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-lg text-xs leading-relaxed max-w-2xl mx-auto space-y-3 font-sans"
              dangerouslySetInnerHTML={{ __html: emailData.bodyHtml }}
            />
          )}

          {tab === 'TEXT' && (
            <div className="space-y-2">
              <div className="flex justify-end">
                <button
                  onClick={handleCopyText}
                  className="px-3 py-1 rounded bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied!' : 'Copy Plain Text'}</span>
                </button>
              </div>
              <textarea
                rows={12}
                readOnly
                value={emailData.bodyText}
                className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 font-mono text-xs p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none leading-relaxed resize-none shadow-sm"
              />
            </div>
          )}

          {tab === 'HTML' && (
            <div className="space-y-2">
              <div className="flex justify-end">
                <button
                  onClick={handleCopyHtml}
                  className="px-3 py-1 rounded bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedHtml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHtml ? 'Copied!' : 'Copy HTML Code'}</span>
                </button>
              </div>
              <textarea
                rows={12}
                readOnly
                value={emailData.bodyHtml}
                className="w-full bg-slate-900 text-emerald-400 font-mono text-[11px] p-4 rounded-2xl border border-slate-800 focus:outline-none leading-relaxed resize-none shadow-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
