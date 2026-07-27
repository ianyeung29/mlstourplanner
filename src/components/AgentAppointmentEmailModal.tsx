'use client';

import React, { useState, useEffect } from 'react';
import { Tour, TourStop } from '@/types/tour';
import { getUserProfile } from '@/services/storage';
import {
  generateAgentAppointmentEmail,
  AgentEmailTemplateType,
  AgentEmailResult
} from '@/services/agentEmailService';
import {
  X,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Send,
  Sparkles,
  Code,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Building,
  UserCheck
} from 'lucide-react';

interface AgentAppointmentEmailModalProps {
  stop: TourStop | null;
  tour: Tour;
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentAppointmentEmailModal({
  stop,
  tour,
  isOpen,
  onClose
}: AgentAppointmentEmailModalProps) {
  const [templateType, setTemplateType] = useState<AgentEmailTemplateType>('STANDARD');
  const [tab, setTab] = useState<'PREVIEW' | 'TEXT' | 'HTML'>('PREVIEW');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customText, setCustomText] = useState('');

  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const agentProfile = getUserProfile();

  const [emailData, setEmailData] = useState<AgentEmailResult | null>(null);

  useEffect(() => {
    if (stop && tour) {
      const generated = generateAgentAppointmentEmail(
        stop,
        tour,
        agentProfile,
        templateType
      );
      setEmailData(generated);
      setCustomText(generated.bodyText);
      setRecipientEmail(stop.listing_agent_email || '');
      setSendSuccess(false);
      setSendError(null);
    }
  }, [stop, tour, templateType]);

  if (!isOpen || !stop || !emailData) return null;

  const handleCopySubject = () => {
    navigator.clipboard.writeText(emailData.subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyBody = () => {
    const textToCopy = tab === 'HTML' ? emailData.bodyHtml : customText;
    navigator.clipboard.writeText(textToCopy);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const handleSendViaResend = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setSendError('Please enter a valid listing agent email address.');
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
          text: customText,
          html: emailData.bodyHtml
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSendSuccess(true);
      } else {
        setSendError(data.error || 'Failed to dispatch email via Resend API.');
      }
    } catch (err: any) {
      setSendError(err.message || 'Network error attempting to send email.');
    } finally {
      setIsSending(false);
    }
  };

  const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
    emailData.subject
  )}&body=${encodeURIComponent(customText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Request Showing Appointment with Listing Agent
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Property: <strong className="text-slate-900 dark:text-white">{stop.normalized_address}</strong></span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <Clock className="w-3 h-3" />
                {emailData.appointmentTimeStr}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Template Selector Bar */}
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              Select Email Template Preset:
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setTemplateType('STANDARD')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                templateType === 'STANDARD'
                  ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 text-indigo-950 dark:text-white font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1">📌 Standard</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">Formal time slot request</div>
            </button>

            <button
              onClick={() => setTemplateType('URGENT')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                templateType === 'URGENT'
                  ? 'bg-rose-50 dark:bg-rose-600/20 border-rose-500 ring-1 ring-rose-500 text-rose-950 dark:text-white font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1 text-rose-700 dark:text-rose-300">⚡ Urgent Request</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">High priority / lockbox</div>
            </button>

            <button
              onClick={() => setTemplateType('OPEN_HOUSE')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                templateType === 'OPEN_HOUSE'
                  ? 'bg-emerald-50 dark:bg-emerald-600/20 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 dark:text-white font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1 text-emerald-700 dark:text-emerald-300">🏠 Open House</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">Courtesy arrival notice</div>
            </button>

            <button
              onClick={() => setTemplateType('FLEXIBLE')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                templateType === 'FLEXIBLE'
                  ? 'bg-purple-50 dark:bg-purple-600/20 border-purple-500 ring-1 ring-purple-500 text-purple-950 dark:text-white font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1 text-purple-700 dark:text-purple-300">⏳ Flexible Window</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">Primary + backup times</div>
            </button>
          </div>
        </div>

        {/* Recipient Agent Info & Resend Dispatch Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">Listing Agent Email:</span>
            <input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="e.g. agent@brokerage.com"
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={handleSendViaResend}
              disabled={isSending || !recipientEmail}
              className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-1.5 shadow transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isSending ? 'Sending...' : 'Send via Resend'}</span>
            </button>

            <a
              href={mailtoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold flex items-center justify-center gap-1 shrink-0 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Mail App</span>
            </a>
          </div>

          {sendSuccess && (
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Email dispatched successfully to {recipientEmail}!</span>
            </div>
          )}

          {sendError && (
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 text-[11px] font-bold flex items-center gap-1.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>{sendError}</span>
            </div>
          )}
        </div>

        {/* View Format Selector & Copy Subject Row */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setTab('PREVIEW')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                tab === 'PREVIEW' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Formatted Preview
            </button>
            <button
              onClick={() => setTab('TEXT')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                tab === 'TEXT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Plain Text (Editable)
            </button>
            <button
              onClick={() => setTab('HTML')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                tab === 'HTML' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              HTML Code
            </button>
          </div>

          <button
            onClick={handleCopyBody}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow cursor-pointer"
          >
            {copiedBody ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedBody ? 'Copied Body!' : 'Copy Email Body'}</span>
          </button>
        </div>

        {/* Subject Line Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <span className="font-bold text-slate-500 dark:text-slate-400 text-xs shrink-0">Subject:</span>
            <span className="font-mono text-slate-900 dark:text-white text-xs truncate bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 flex-1">
              {emailData.subject}
            </span>
          </div>

          <button
            onClick={handleCopySubject}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
          >
            {copiedSubject ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedSubject ? 'Copied!' : 'Copy Subject'}</span>
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
            <textarea
              rows={14}
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 font-mono text-xs p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none shadow-sm"
            />
          )}

          {tab === 'HTML' && (
            <textarea
              rows={14}
              readOnly
              value={emailData.bodyHtml}
              className="w-full bg-slate-900 text-emerald-400 font-mono text-[11px] p-4 rounded-2xl border border-slate-800 focus:outline-none leading-relaxed resize-none shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
