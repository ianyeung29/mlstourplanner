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
  const [copiedText, setCopiedText] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const user = getUserProfile();

  useEffect(() => {
    if (stop) {
      setRecipientEmail(stop.listing_agent_email || 'listingagent@example.com');
      const emailData = generateAgentAppointmentEmail(stop, tour, user, templateType);
      setCustomText(emailData.bodyText);
    }
    setSendSuccess(false);
    setSendError(null);
  }, [stop, tour, isOpen, templateType]);

  if (!isOpen || !stop) return null;

  const emailData: AgentEmailResult = generateAgentAppointmentEmail(stop, tour, user, templateType);

  const handleSendDirectEmail = async () => {
    if (!recipientEmail.trim()) {
      alert('Please enter a valid listing agent email address.');
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
          text: customText || emailData.bodyText
        })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setSendError(data.error || 'Failed to send appointment request email.');
      } else {
        setSendSuccess(true);
      }
    } catch (err: any) {
      setSendError(err.message || 'Network error sending email via Resend.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(emailData.subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(customText || emailData.bodyText);
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
              Request Showing Appointment with Listing Agent
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Property: <strong className="text-white">{stop.normalized_address}</strong></span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Clock className="w-3 h-3" />
                {emailData.appointmentTimeStr}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Template Selector Bar */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Select Email Template Preset:
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setTemplateType('STANDARD')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                templateType === 'STANDARD'
                  ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1">📌 Standard</div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">Formal time slot request</div>
            </button>

            <button
              onClick={() => setTemplateType('URGENT')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                templateType === 'URGENT'
                  ? 'bg-rose-600/20 border-rose-500 ring-1 ring-rose-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1 text-rose-300">⚡ Urgent Request</div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">High priority / lockbox</div>
            </button>

            <button
              onClick={() => setTemplateType('OPEN_HOUSE')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                templateType === 'OPEN_HOUSE'
                  ? 'bg-emerald-600/20 border-emerald-500 ring-1 ring-emerald-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1 text-emerald-300">🏠 Open House</div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">Courtesy arrival notice</div>
            </button>

            <button
              onClick={() => setTemplateType('FLEXIBLE')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                templateType === 'FLEXIBLE'
                  ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1 text-purple-300">⏳ Flexible Window</div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">Primary + backup times</div>
            </button>
          </div>
        </div>

        {/* Recipient Agent Info & Resend Dispatch Bar */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="font-bold text-slate-300 shrink-0">Listing Agent Email:</span>
            <input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="e.g. agent@brokerage.com"
              className="flex-1 bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500 w-full"
            />
            <button
              disabled={isSending || !recipientEmail.trim()}
              onClick={handleSendDirectEmail}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow shrink-0 transition-colors disabled:opacity-50"
            >
              {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isSending ? 'Sending...' : 'Send via Resend'}</span>
            </button>
          </div>

          {/* Subject Display Bar */}
          <div className="flex items-center justify-between bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-mono text-[11px] truncate flex-1 mr-2">
              Subject: <strong className="text-white">{emailData.subject}</strong>
            </span>
            <button
              onClick={handleCopySubject}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold shrink-0 transition-colors"
            >
              {copiedSubject ? 'Copied!' : 'Copy Subject'}
            </button>
          </div>

          {/* Status Feedback Banners */}
          {sendSuccess && (
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Appointment request email delivered successfully via Resend API!</span>
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
            <span>Styled Email Preview</span>
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
            <span>Editable Plain Text</span>
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
                title="Listing Agent Email Preview"
                srcDoc={emailData.bodyHtml}
                className="w-full h-[340px] border-0 rounded"
              />
            </div>
          )}

          {tab === 'TEXT' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Edit text before sending or copying:</span>
                <button
                  onClick={handleCopyText}
                  className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-[11px] flex items-center gap-1"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied Text!' : 'Copy Text'}</span>
                </button>
              </div>
              <textarea
                rows={12}
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 text-xs font-mono p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
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
            Auto-populated with calculated showing window: <strong className="text-emerald-400">{emailData.appointmentTimeStr}</strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copied!' : 'Copy Email Body'}</span>
            </button>

            <a
              href={emailData.mailtoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 text-xs font-bold flex items-center gap-1.5 transition-colors"
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
