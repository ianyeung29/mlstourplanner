'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, ArrowLeft, Eye, Server, UserCheck, CheckCircle2 } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Back Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Page Header */}
        <div className="border-b border-slate-800 pb-6 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-slate-400">
            Last Updated: July 25, 2026 · Committed to Safeguarding Real Estate Agent & Client Information
          </p>
        </div>

        {/* Policy Content Body */}
        <div className="space-y-8 text-xs text-slate-300 leading-relaxed">
          {/* Guarantee Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white text-xs font-bold block mb-1">Zero Data Sale Guarantee</strong>
              <p className="text-slate-300 text-[11px]">
                MLSTourPlanner will <strong>never sell, rent, or monetize</strong> your client lists, showing itineraries, agent profile details, or MLS searching patterns to third-party advertisers or data brokers.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">1</span>
              Information We Collect
            </h2>
            <p>
              We collect information necessary to deliver property showing itinerary planning and agent optimization services:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Agent Profile Data:</strong> Full name, email address, phone number, brokerage firm, and default starting address.</li>
              <li><strong>Tour & Itinerary Data:</strong> Property addresses, MLS listing numbers, custom showing notes, and scheduled tour dates.</li>
              <li><strong>Client Contact Data:</strong> Optional buyer client names or email addresses entered for itinerary delivery.</li>
              <li><strong>Device & Usage Data:</strong> Technical logs, browser user-agent, and anonymized device fingerprint tokens used solely to enforce free trial limits and secure active sessions.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">2</span>
              How We Use Your Information
            </h2>
            <p>Your data is used strictly for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>Calculating shortest driving routes and permutation priority schedules.</li>
              <li>Dispatching showing itinerary emails to your client or appointment request emails to listing agents.</li>
              <li>Maintaining your agent workspace, settings, and saved tour history.</li>
              <li>Providing customer support and technical troubleshooting.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">3</span>
              Third-Party Integrations & Infrastructure
            </h2>
            <p>
              To deliver maps, distance matrices, and reliable transactional emails, MLSTourPlanner integrates with trusted infrastructure providers:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <strong className="text-white text-[11px] block">Google Maps & Directions API</strong>
                <p className="text-[10px] text-slate-400">Used for geocoding property addresses, rendering interactive maps, and calculating real-time driving routes.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <strong className="text-white text-[11px] block">Resend Email API</strong>
                <p className="text-[10px] text-slate-400">Used to securely deliver styled client itinerary emails and listing agent showing requests.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">4</span>
              Data Security & Retention
            </h2>
            <p>
              We implement industry-standard encryption protocols (HTTPS/TLS) and secure database storage. Tour data stored locally in your browser workspace remains under your direct control and can be cleared at any time.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">5</span>
              Your Privacy Rights & Contact
            </h2>
            <p>
              You have the right to inspect, edit, or request complete deletion of your account and tour data at any time. For privacy inquiries, contact our data protection team at <strong>privacy@mlstourplanner.com</strong>.
            </p>
          </section>
        </div>

        {/* Footer Link */}
        <div className="pt-6 border-t border-slate-800 flex justify-between text-xs text-slate-400">
          <span>© 2026 MLSTourPlanner. All Rights Reserved.</span>
          <Link href="/terms" className="text-indigo-400 hover:underline">View Terms of Service →</Link>
        </div>
      </div>
    </div>
  );
}
