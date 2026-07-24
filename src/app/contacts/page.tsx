'use client';

import React from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import { ClientContact } from '@/types/tour';
import { getContactsFromStorage, saveContact, deleteContact, importContactsFromText } from '@/services/storage';
import { Users, UserPlus, Mail, Phone, FileText, Upload, Calendar, ArrowRight, Clock, MessageSquare } from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = React.useState<ClientContact[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [preferredMethod, setPreferredMethod] = React.useState<'EMAIL' | 'SMS' | 'PHONE' | 'WHATSAPP'>('EMAIL');
  const [preferredTime, setPreferredTime] = React.useState<'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME'>('ANYTIME');

  const [bulkText, setBulkText] = React.useState('');
  const [showBulkModal, setShowBulkModal] = React.useState(false);
  const formRef = React.useRef<HTMLDivElement>(null);

  const loadContacts = React.useCallback(() => {
    setContacts(getContactsFromStorage());
  }, []);

  React.useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleEditClick = (contact: ClientContact) => {
    setEditingId(contact.id);
    setName(contact.name);
    setEmail(contact.email);
    setPhone(contact.phone || '');
    setNotes(contact.notes || '');
    setPreferredMethod(contact.preferred_contact_method || 'EMAIL');
    setPreferredTime(contact.preferred_contact_time || 'ANYTIME');

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setPreferredMethod('EMAIL');
    setPreferredTime('ANYTIME');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Client Name and Email are required.');
      return;
    }

    const updated: ClientContact = {
      id: editingId || `contact_${Date.now()}`,
      name,
      email,
      phone,
      notes,
      preferred_contact_method: preferredMethod,
      preferred_contact_time: preferredTime,
      created_at: new Date().toISOString()
    };

    saveContact(updated);
    loadContacts();
    handleResetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove contact "${name}"?`)) {
      deleteContact(id);
      loadContacts();
    }
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    importContactsFromText(bulkText);
    loadContacts();
    setBulkText('');
    setShowBulkModal(false);
  };

  return (
    <AuthGuard>
      <div className="space-y-4 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Client Contact Book</span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage your buyer clients and instantly schedule showing itineraries for them.
            </p>
          </div>

          <button
            onClick={() => setShowBulkModal(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Bulk Text / CSV Import</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Edit / Creation Form */}
          <div ref={formRef} className="lg:col-span-1 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md self-start">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="font-bold text-white text-xs flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>{editingId ? 'Edit Client Details' : 'Add New Client'}</span>
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-[10px] text-slate-400 hover:text-white underline font-semibold"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Client Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. The Smith Family"
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. client@example.com"
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. (516) 555-0199"
                  className="w-full bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Prefer Contact Way</label>
                  <select
                    value={preferredMethod}
                    onChange={e => setPreferredMethod(e.target.value as any)}
                    className="w-full bg-slate-950 text-white text-xs px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SMS">SMS Text</option>
                    <option value="PHONE">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Prefer Time Period</label>
                  <select
                    value={preferredTime}
                    onChange={e => setPreferredTime(e.target.value as any)}
                    className="w-full bg-slate-950 text-white text-xs px-2 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="MORNING">Morning (8am - 12pm)</option>
                    <option value="AFTERNOON">Afternoon (12pm - 5pm)</option>
                    <option value="EVENING">Evening (5pm - 8pm)</option>
                    <option value="ANYTIME">Anytime</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Client Search Preferences</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Looking for 4+ bed homes in North Shore Long Island. Prefers garage parking."
                  className="w-full bg-slate-950 text-white text-xs p-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow transition-colors"
              >
                <span>{editingId ? 'Update Client Profile' : 'Save New Client'}</span>
              </button>
            </form>
          </div>

          {/* Contact List */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="font-bold text-white text-xs">Client Contact Cards ({contacts.length})</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contacts.map(c => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-sm tracking-tight">{c.name}</h3>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditClick(c)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-[10px] font-bold transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-[10px] font-bold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{c.email}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{c.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-medium border-t border-slate-800/80">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-emerald-400" />
                          {c.preferred_contact_method || 'EMAIL'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {c.preferred_contact_time || 'ANYTIME'}
                        </span>
                      </div>

                      {c.notes && (
                        <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60 line-clamp-2">
                          "{c.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/tours/new?contactId=${c.id}`}
                    className="w-full py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Schedule a Tour</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bulk Import Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>Bulk Import Client Contacts</span>
                </h3>
                <p className="text-slate-400">
                  Paste contact names, emails, and phone numbers line by line or in CSV format.
                </p>
              </div>

              <textarea
                rows={6}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={`Example Format:\nThe Miller Family <miller@example.com>\nThe Johnson Family, johnson@example.com, (516) 555-0922`}
                className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 font-mono focus:outline-none focus:border-indigo-500"
              />

              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Import Contacts
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
