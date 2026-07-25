'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, ArrowLeft, AlertCircle, Scale, Lock, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
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
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Scale className="w-4 h-4" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Terms of Service</h1>
          <p className="text-xs text-slate-400">
            Last Updated: July 25, 2026 · Effective Immediately for All Users & Real Estate Agents
          </p>
        </div>

        {/* Terms Content Body */}
        <div className="space-y-8 text-xs text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">1</span>
              Acceptance of Terms
            </h2>
            <p>
              By accessing or using <strong>MLSTourPlanner</strong> (&quot;the Platform&quot;, &quot;Service&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service. If you are using the Service on behalf of a real estate brokerage, agency, or team, you represent that you have authority to bind that entity. If you do not agree to these terms, you may not access or use the Platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">2</span>
              Service Description & Real Estate License Use
            </h2>
            <p>
              MLSTourPlanner provides automated property showing itinerary generation, route optimization algorithms, matrix drive-time estimations, Open House schedule synchronization, and appointment email formatting for licensed real estate professionals and home buyers.
            </p>
            <p>
              You agree to use the Service strictly in compliance with applicable local real estate commission rules, MLS rules, MLS Fair Housing guidelines, and relevant state or federal laws.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">3</span>
              MLS Data & Route Accuracy Disclaimer
            </h2>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Important Route & Timing Disclaimer</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-normal">
                Estimated driving durations, matrix mileage, open house times, and showing appointment windows are generated based on mathematical heuristics and external GIS mappings. Real-world traffic conditions, weather delays, listing status changes, or unannounced lockbox updates may alter actual arrival times. Agents remain solely responsible for verifying appointment access with listing agents.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">4</span>
              Subscriptions, Billing & Promotional Pricing
            </h2>
            <p>
              Access to MLSTourPlanner PRO Unlimited features is available via monthly subscription. The standard list price is <strong>$29.99/month</strong>. Promotional pricing (e.g. <strong>$14.99/month</strong>) is offered for a limited duration and is subject to promotional conditions specified at sign-up.
            </p>
            <p>
              Subscriptions automatically renew each month unless canceled prior to the renewal billing date via account settings or support request. Payments are processed securely via third-party billing providers.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">5</span>
              Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, MLSTourPlanner and its developers, officers, employees, or agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, missed real estate appointments, listing seller disputes, or client dissatisfaction resulting from your use of the Platform.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30">6</span>
              Modifications to Service & Terms
            </h2>
            <p>
              We reserve the right to modify or discontinue any feature of the Service at any time. Changes to these Terms will be posted on this page with an updated effective date.
            </p>
          </section>
        </div>

        {/* Footer Link */}
        <div className="pt-6 border-t border-slate-800 flex justify-between text-xs text-slate-400">
          <span>© 2026 MLSTourPlanner. All Rights Reserved.</span>
          <Link href="/privacy" className="text-indigo-400 hover:underline">View Privacy Policy →</Link>
        </div>
      </div>
    </div>
  );
}
