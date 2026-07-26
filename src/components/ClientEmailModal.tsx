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
  }, [isOpen]);

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
          html: emailData.bodyHtml,
          text: emailData.bodyText
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setSendError(data.error || 'Failed to send email.');
      } else {
        setSendSuccess(true);
      }
    } catch (err: any) {
      setSendError(err.message || 'Network error sending email.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              Email Client Showing Itinerary
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Subject: <span className="text-slate-200 font-medium">{emailData.subject}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resend Direct Email Dispatch Bar */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="font-bold text-slate-300 shrink-0">Recipient Client Email:</span>
            <input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="e.g. buyer.client@gmail.com"
              className="flex-1 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500 w-full"
            />
            <button
              disabled={isSending || !recipientEmail.trim()}
              onClick={handleSendResendEmail}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow shrink-0 transition-colors disabled:opacity-50"
            >
              {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isSending ? 'Sending via Resend...' : 'Send Direct via Resend'}</span>
            </button>
          </div>

          {/* Status Feedback Banners */}
          {sendSuccess && (
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Email delivered successfully via Resend API!</span>
            </div>
          )}

          {sendError && (
            <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-start gap-1.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Resend Notice:</strong>
                <span>{sendError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Online Link Sharing Bar */}
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-indigo-300 shrink-0">Online Link:</span>
            <span className="text-slate-300 font-mono truncate">{emailData.onlineUrl}</span>
          </div>

          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-bold text-[11px] flex items-center gap-1 shrink-0 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex px-4 pt-2.5 bg-slate-900 border-b border-slate-800 space-x-2 text-xs font-semibold">
          <button
            onClick={() => setTab('PREVIEW')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'PREVIEW'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Stylish Email Preview</span>
          </button>
          <button
            onClick={() => setTab('TEXT')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'TEXT'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Plain Text</span>
          </button>
          <button
            onClick={() => setTab('HTML')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'HTML'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>HTML Source</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950 space-y-3">
          {tab === 'PREVIEW' && (
            <div className="rounded-xl overflow-hidden border border-slate-700 bg-white p-2 shadow-inner">
              <iframe
                title="Client Email Preview"
                srcDoc={emailData.bodyHtml}
                className="w-full h-[360px] border-0 rounded"
              />
            </div>
          )}

          {tab === 'TEXT' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Formatted Text Email Body</span>
                <button
                  onClick={handleCopyText}
                  className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-[11px] flex items-center gap-1"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied Text!' : 'Copy Text'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={12}
                value={emailData.bodyText}
                className="w-full bg-slate-900 text-slate-200 text-xs font-mono p-3 rounded-xl border border-slate-800 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {tab === 'HTML' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>HTML Code</span>
                <button
                  onClick={handleCopyHtml}
                  className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-[11px] flex items-center gap-1"
                >
                  {copiedHtml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHtml ? 'Copied HTML!' : 'Copy HTML Code'}</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={12}
                value={emailData.bodyHtml}
                className="w-full bg-slate-900 text-slate-300 text-xs font-mono p-3 rounded-xl border border-slate-800 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Send via Resend API or open in mail client
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <a
              href={emailData.mailtoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Mail App</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
