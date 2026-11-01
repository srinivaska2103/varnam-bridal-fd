'use client';

import React, { useState } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/services/supportApi';
import { ModernDropdown } from '@/components/ui';
import {
  ArrowLeft,
  LifeBuoy,
  Send,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  FileText,
  Clock,
  ShieldAlert,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

const SUPPORT_CATEGORIES = [
  { value: 'Technical Issue', label: 'Technical Issue', badgeColor: 'bg-rose-500' },
  { value: 'Account & Login', label: 'Account & Login', badgeColor: 'bg-blue-500' },
  { value: 'Enquiries & Customers', label: 'Enquiries & Customers', badgeColor: 'bg-emerald-500' },
  { value: 'Consultations', label: 'Consultations & Trials', badgeColor: 'bg-purple-500' },
  { value: 'Bookings', label: 'Wedding Bookings', badgeColor: 'bg-amber-500' },
  { value: 'Payments & Billing', label: 'Payments & Billing', badgeColor: 'bg-emerald-600' },
  { value: 'WhatsApp Integration', label: 'WhatsApp Automation', badgeColor: 'bg-[#25D366]' },
  { value: 'Public Website', label: 'Public Studio Website', badgeColor: 'bg-indigo-500' },
  { value: 'Subscription', label: 'Subscription Plan', badgeColor: 'bg-orange-500' },
  { value: 'Feature Request', label: 'Feature Request', badgeColor: 'bg-teal-500' },
  { value: 'Other', label: 'Other Inquiries', badgeColor: 'bg-stone-500' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low (General question / advice)', badgeColor: 'bg-stone-400' },
  { value: 'MEDIUM', label: 'Medium (Standard inquiry)', badgeColor: 'bg-amber-500' },
  { value: 'HIGH', label: 'High (Impacts bookings or enquiries)', badgeColor: 'bg-orange-600' },
  { value: 'CRITICAL', label: 'Critical (Urgent studio disruption)', badgeColor: 'bg-rose-600' },
];

const MODULE_OPTIONS = [
  { value: 'Dashboard & Metrics', label: 'Dashboard & Metrics' },
  { value: 'Enquiries CRM', label: 'Enquiries CRM' },
  { value: 'Consultations & Trials', label: 'Consultations & Trials' },
  { value: 'Services & Packages', label: 'Services & Packages' },
  { value: 'Wedding Bookings', label: 'Wedding Bookings' },
  { value: 'Payments & Invoicing', label: 'Payments & Invoicing' },
  { value: 'WhatsApp Cloud Automation', label: 'WhatsApp Cloud Automation' },
  { value: 'Public Studio Website', label: 'Public Studio Website' },
  { value: 'Expense Tracker', label: 'Expense Tracker' },
  { value: 'Subscription & Billing', label: 'Subscription & Billing' },
  { value: 'Other / General', label: 'Other / General' },
];

export default function RaiseTicketPage() {
  const params = useParams();
  const pathname = usePathname();
  const studioSlug = params?.businessSlug;
  const isUserPortal = pathname?.includes('/user/');
  const basePath = studioSlug ? (isUserPortal ? `/${studioSlug}/user/help-support` : `/${studioSlug}/admin/help-support`) : '/help-support';

  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    subject: '',
    category: 'Technical Issue',
    priority: 'MEDIUM',
    related_module: 'Consultations & Trials',
    description: '',
  });

  const [attachments, setAttachments] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // File upload processing (Data URI encoding with size check)
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg(`File "${file.name}" exceeds the 5MB size limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUri = event.target?.result;
        if (dataUri) {
          setAttachments((prev) => [
            ...prev,
            {
              file_name: file.name,
              file_url: dataUri,
              file_size: file.size,
              mime_type: file.type,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const createTicketMutation = useMutation({
    mutationFn: (payload) => supportApi.createTicket(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['user-support-tickets']);
      queryClient.invalidateQueries(['user-support-tickets-recent']);
      setSubmittedTicket(res.data);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to submit ticket');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.subject.trim()) {
      setErrorMsg('Please provide a ticket subject');
      return;
    }
    if (!form.description.trim()) {
      setErrorMsg('Please describe your issue in detail');
      return;
    }

    createTicketMutation.mutate({
      ...form,
      attachments,
    });
  };

  // Success view
  if (submittedTicket) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] p-4 sm:p-8 flex items-center justify-center -m-3 sm:-m-6 lg:-m-8">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-10 border border-stone-200/90 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
              Ticket Submitted Successfully
            </span>
            <h1 className="text-2xl font-extrabold text-stone-900">
              Support Request Received
            </h1>
            <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto">
              Our VARNAM support engineers have been notified and will investigate your request. You will receive updates via email and inside your dashboard.
            </p>
          </div>

          <div className="bg-[#FFFBF7] rounded-2xl p-4 border border-orange-200/80 text-left space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500 font-medium">Ticket Reference Number:</span>
              <span className="font-mono font-bold text-[#FF6B00] text-sm">
                #{submittedTicket.ticket_number}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500 font-medium">Subject:</span>
              <span className="font-bold text-stone-800 truncate max-w-[200px]">
                {submittedTicket.subject}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-500 font-medium">Status:</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase text-[10px]">
                {submittedTicket.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={`${basePath}/tickets/${submittedTicket.id}`}
              className="flex-1 py-3 px-4 bg-[#FF6B00] hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>View Ticket & Chat</span>
            </Link>
            <Link
              href={basePath}
              className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-all"
            >
              Back to Help Center
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF7] pb-24 -m-3 sm:-m-6 lg:-m-8 font-sans text-stone-900">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-stone-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href={basePath}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF6B00]" />
            <span>Back to Help Center</span>
          </Link>
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Submit a Technical Ticket
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Raise a Support Ticket
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Encountering an error or need configuration assistance? Describe your inquiry below.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/90 shadow-sm space-y-6">
          {/* Subject */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
              Ticket Subject *
            </label>
            <input
              type="text"
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. WhatsApp consultation reschedule alert remaining queued"
              className="w-full px-4 py-3 bg-[#FFFBF7] border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all font-medium"
            />
          </div>

          {/* Category & Priority Grid with ModernDropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-30">
            <div className="relative">
              <ModernDropdown
                label="SUPPORT CATEGORY *"
                value={form.category}
                onChange={(val) => setForm({ ...form, category: val })}
                options={SUPPORT_CATEGORIES}
                placeholder="Select category..."
                buttonClassName="bg-[#FFFBF7] py-3 rounded-xl border-stone-200"
              />
            </div>

            <div className="relative">
              <ModernDropdown
                label="PRIORITY LEVEL *"
                value={form.priority}
                onChange={(val) => setForm({ ...form, priority: val })}
                options={PRIORITY_OPTIONS}
                placeholder="Select priority..."
                buttonClassName="bg-[#FFFBF7] py-3 rounded-xl border-stone-200"
              />
            </div>
          </div>

          {/* Related Module with ModernDropdown */}
          <div className="relative z-20">
            <ModernDropdown
              label="RELATED MODULE (OPTIONAL)"
              value={form.related_module}
              onChange={(val) => setForm({ ...form, related_module: val })}
              options={MODULE_OPTIONS}
              placeholder="Select related module..."
              buttonClassName="bg-[#FFFBF7] py-3 rounded-xl border-stone-200"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5 relative z-10">
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
              Issue Description *
            </label>
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Please describe what happened, steps to reproduce, or error messages encountered..."
              className="w-full p-4 bg-[#FFFBF7] border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] leading-relaxed transition-all font-normal"
            />
          </div>

          {/* Attachments Upload */}
          <div className="space-y-2 relative z-10">
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
              Attachments / Screenshots (Optional)
            </label>

            <div className="border-2 border-dashed border-stone-200 hover:border-orange-300 rounded-2xl p-6 text-center hover:bg-orange-50/30 transition-all cursor-pointer relative">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-6 h-6 text-stone-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-stone-700">
                Click or drag screenshots / logs here
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Supports PNG, JPG, WebP, PDF up to 5MB
              </p>
            </div>

            {/* Attached file previews */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#FFFBF7] border border-stone-200 rounded-xl text-xs text-stone-700"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-4 h-4 text-[#FF6B00] shrink-0" />
                      <span className="truncate font-semibold">{att.file_name}</span>
                      <span className="text-[10px] text-stone-400">
                        ({Math.round((att.file_size || 0) / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit CTA */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between relative z-10">
            <Link
              href={basePath}
              className="text-xs font-bold text-stone-500 hover:text-stone-800"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={createTicketMutation.isPending}
              className="px-6 py-3 bg-gradient-to-r from-[#FF6B00] to-[#EA580C] hover:from-orange-600 hover:to-orange-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {createTicketMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Support Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
