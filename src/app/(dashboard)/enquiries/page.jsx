'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Plus,
  Clock,
  Calendar,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Check,
  Share2,
  CalendarClock,
  History,
  CheckCircle,
  HelpCircle,
  Clock4,
} from 'lucide-react';
import { Card, PageHeader, Button, LoadingSpinner, EmptyState, Badge, ModernDropdown, Modal, ModernDatePicker } from '@/components/ui';
import { useModalAlert } from '@/components/ui/ModalAlert';
import { enquiryApi } from '@/services/api/modules';
import { formatDate, formatINR, cn } from '@/utils/formatters';

const STATUS_FILTERS = [
  { label: 'All Enquiries', value: 'ALL' },
  { label: 'New', value: 'NEW' },
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'Consultation', value: 'CONSULTATION' },
  { label: 'Follow-up', value: 'FOLLOW_UP' },
  { label: 'Converted', value: 'CONVERTED' },
  { label: 'Lost', value: 'LOST' },
];

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'NEW', badgeColor: 'bg-sky-500' },
  { value: 'CONTACTED', label: 'CONTACTED', badgeColor: 'bg-blue-500' },
  { value: 'CONSULTATION', label: 'CONSULTATION', badgeColor: 'bg-purple-500' },
  { value: 'FOLLOW_UP', label: 'FOLLOW_UP', badgeColor: 'bg-amber-500' },
  { value: 'CONVERTED', label: 'CONVERTED', badgeColor: 'bg-emerald-500' },
  { value: 'LOST', label: 'LOST', badgeColor: 'bg-rose-500' },
];

const EVENT_TYPE_OPTIONS = [
  { value: 'WEDDING', label: 'Wedding / Muhurtham' },
  { value: 'ENGAGEMENT', label: 'Engagement' },
  { value: 'RECEPTION', label: 'Reception' },
  { value: 'SANGEET', label: 'Sangeet / Mehendi' },
  { value: 'TRIAL', label: 'Bridal Trial' },
  { value: 'OTHER', label: 'Other Party / Event' },
];

const SOURCE_OPTIONS = [
  { value: 'Manual', label: 'Direct Manual Entry' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Walk-in', label: 'Walk-in / Studio' },
  { value: 'Referral', label: 'Referral / Word of Mouth' },
];

function getStatusBadge(status) {
  switch (status) {
    case 'CONVERTED':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'LOST':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'NEW':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'CONTACTED':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'CONSULTATION':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'FOLLOW_UP':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    default:
      return 'bg-stone-50 text-stone-800 border-stone-200';
  }
}

export default function EnquiriesPage() {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useModalAlert();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Active Main Tab: 'enquiries' | 'followups'
  const [activeTab, setActiveTab] = useState('enquiries');
  const [followUpFilter, setFollowUpFilter] = useState('all'); // 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'

  // Modal states
  const [newEnquiryModalOpen, setNewEnquiryModalOpen] = useState(false);
  const [detailModalEnquiry, setDetailModalEnquiry] = useState(null);
  const [editStatusEnquiry, setEditStatusEnquiry] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Follow-up completion / rescheduling modal
  const [followUpActionItem, setFollowUpActionItem] = useState(null);
  const [followUpActionNote, setFollowUpActionNote] = useState('');
  const [followUpActionNextDate, setFollowUpActionNextDate] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);

  // Manual enquiry form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    event_kind: 'WEDDING',
    event_date: '',
    event_venue: '',
    source: 'Manual',
    notes: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch enquiries list with filters
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['enquiries', statusFilter, searchTerm],
    queryFn: () => {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      return enquiryApi.list(params);
    },
    enabled: activeTab === 'enquiries',
  });

  const enquiries = data?.data?.enquiries || [];

  // Fetch Follow-Ups view
  const {
    data: followUpsData,
    isLoading: isLoadingFollowUps,
    refetch: refetchFollowUps,
  } = useQuery({
    queryKey: ['enquiries-follow-ups', followUpFilter, searchTerm],
    queryFn: () =>
      enquiryApi.getFollowUps({
        filter: followUpFilter,
        search: searchTerm.trim() || undefined,
      }),
    enabled: activeTab === 'followups',
  });

  const followUps = followUpsData?.data?.followUps || [];
  const followUpCounts = followUpsData?.data?.counts || {
    all: 0,
    today: 0,
    upcoming: 0,
    overdue: 0,
    completed: 0,
  };

  // Manual enquiry submission
  const handleCreateManualEnquiry = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (!formData.customer_name.trim()) throw new Error('Customer name is required');
      if (!formData.customer_phone.trim()) throw new Error('Customer phone is required');

      await enquiryApi.create({
        customer_name: formData.customer_name.trim(),
        customer_phone: formData.customer_phone.trim(),
        customer_email: formData.customer_email.trim() || undefined,
        event_kind: formData.event_kind,
        event_date: formData.event_date ? new Date(formData.event_date).toISOString() : undefined,
        event_venue: formData.event_venue.trim() || undefined,
        source: formData.source || 'Manual',
        notes: formData.notes.trim() || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      setNewEnquiryModalOpen(false);
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        event_kind: 'WEDDING',
        event_date: '',
        event_venue: '',
        source: 'Manual',
        notes: '',
      });
    } catch (err) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to create enquiry');
    } finally {
      setFormLoading(false);
    }
  };

  // Update Status handler
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!editStatusEnquiry || !newStatus) return;
    setUpdatingStatus(true);
    try {
      await enquiryApi.update(editStatusEnquiry.id, {
        status: newStatus,
        notes: statusNotes ? `${editStatusEnquiry.notes ? editStatusEnquiry.notes + '\n' : ''}Update: ${statusNotes}` : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      setEditStatusEnquiry(null);
      if (detailModalEnquiry && detailModalEnquiry.id === editStatusEnquiry.id) {
        setDetailModalEnquiry({ ...detailModalEnquiry, status: newStatus });
      }
    } catch (err) {
      await showAlert({
        title: 'Status Update Failed',
        message: err.response?.data?.error?.message || err.message || 'Could not update status',
        variant: 'error',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Convert Enquiry to Booking
  const handleConvertEnquiry = async (enquiry) => {
    const confirmed = await showConfirm({
      title: 'Convert to Confirmed Booking',
      message: `Are you sure you want to convert the bridal enquiry from ${enquiry.customer_name} into a confirmed booking?`,
      confirmText: 'Yes, Convert Booking',
      cancelText: 'Cancel',
      variant: 'warning',
    });
    if (!confirmed) return;

    try {
      await enquiryApi.convert(enquiry.id, {
        package_name_snapshot: `${enquiry.event_kind || 'Bridal'} Makeover`,
        notes: enquiry.notes || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      await showAlert({
        title: 'Booking Confirmed!',
        message: `Enquiry from ${enquiry.customer_name} has been successfully converted into a confirmed booking.`,
        variant: 'success',
      });
      if (detailModalEnquiry) setDetailModalEnquiry(null);
    } catch (err) {
      await showAlert({
        title: 'Conversion Failed',
        message: err.response?.data?.error?.message || err.message || 'Failed to convert enquiry',
        variant: 'error',
      });
    }
  };

  // Handle Complete / Reschedule Follow-up
  const handleFollowUpActionSubmit = async (e) => {
    e.preventDefault();
    if (!followUpActionItem) return;
    setSubmittingFollowUp(true);

    try {
      await enquiryApi.completeFollowUp(followUpActionItem.id, {
        completion_note: followUpActionNote.trim() || undefined,
        next_follow_up_date: followUpActionNextDate || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['enquiries-follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });

      await showAlert({
        title: followUpActionNextDate ? 'Follow-Up Rescheduled' : 'Follow-Up Completed',
        message: followUpActionNextDate
          ? `Follow-up concluded and next follow-up scheduled for ${formatDate(followUpActionNextDate)}.`
          : 'Follow-up marked as completed.',
        variant: 'success',
      });

      setFollowUpActionItem(null);
      setFollowUpActionNote('');
      setFollowUpActionNextDate('');
    } catch (err) {
      await showAlert({
        title: 'Action Failed',
        message: err.response?.data?.error?.message || err.message || 'Failed to process follow-up',
        variant: 'error',
      });
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with required buttons and View Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Enquiry CRM & Follow-Ups
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#C2410C] border border-orange-200/80">
              Pipeline
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage incoming wedding leads, schedule follow-ups, track trial outcomes, and convert clients.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Active Tab Toggle */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setActiveTab('enquiries')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'enquiries'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              All Leads
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('followups')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'followups'
                  ? 'bg-[#F97316] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Follow-Ups</span>
              {followUpCounts.overdue + followUpCounts.today > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-[#C2410C]">
                  {followUpCounts.overdue + followUpCounts.today}
                </span>
              )}
            </button>
          </div>

          <Link href="/settings/enquiry-form">
            <Button variant="secondary" size="sm" className="gap-1.5 border-[#F0E7DE] hover:border-[#F97316]">
              <Share2 className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Share Form</span>
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={() => setNewEnquiryModalOpen(true)}
            className="bg-[#F97316] hover:bg-[#C2410C] text-white shadow-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Lead</span>
          </Button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <Card className="p-4 shadow-xs">
        {activeTab === 'followups' ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search follow-ups by bride, phone or outcome note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2 rounded-xl border border-[#F0E7DE] bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
              />
            </div>

            {/* Follow-up View Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
              {[
                { label: 'All Follow-Ups', value: 'all', count: followUpCounts.all },
                { label: 'Due Today', value: 'today', count: followUpCounts.today, badge: 'text-amber-700 bg-amber-100' },
                { label: 'Upcoming', value: 'upcoming', count: followUpCounts.upcoming },
                { label: 'Overdue', value: 'overdue', count: followUpCounts.overdue, badge: 'text-rose-700 bg-rose-100' },
                { label: 'Completed', value: 'completed', count: followUpCounts.completed },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFollowUpFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    followUpFilter === f.value
                      ? 'bg-[#F97316] text-white shadow-xs'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  <span>{f.label}</span>
                  {typeof f.count === 'number' && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        followUpFilter === f.value ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by bride name, phone, email or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#F0E7DE] bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === f.value
                      ? 'bg-[#F97316] text-white shadow-xs'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 3. Main Content: Leads View OR Follow-Ups View */}
      {activeTab === 'followups' ? (
        <div>
          {isLoadingFollowUps ? (
            <Card className="p-12 text-center">
              <LoadingSpinner text="Loading client follow-up schedule..." />
            </Card>
          ) : followUps.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No follow-ups in this view"
              description="When a consultation outcome records a next follow-up date, or when you set follow-ups on leads, they appear here."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-[#F0E7DE] shadow-2xs overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[760px]">
                  <thead>
                    <tr className="border-b border-[#F0E7DE] bg-stone-50/70 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Follow-Up Date & Status</th>
                      <th className="py-3 px-4">Latest Trial Outcome / Notes</th>
                      <th className="py-3 px-4">Enquiry Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs">
                    {followUps.map((item) => {
                      const isOverdue = item.urgency === 'overdue';
                      const isToday = item.urgency === 'today';
                      const isCompleted = item.urgency === 'completed' || item.status === 'CONVERTED';

                      return (
                        <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
                          {/* Client */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-stone-900 block">{item.customer_name}</span>
                            <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-stone-400" />
                              {item.customer_phone}
                            </span>
                            {item.customer_email && (
                              <span className="text-[10px] text-stone-400 block truncate max-w-[180px]">
                                {item.customer_email}
                              </span>
                            )}
                          </td>

                          {/* Follow-up Date & Urgency */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
                              <span className="font-bold text-stone-900">
                                {item.next_follow_up_at ? formatDate(item.next_follow_up_at) : 'Completed'}
                              </span>
                            </div>
                            <span
                              className={cn(
                                'inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border',
                                isOverdue
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isToday
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : isCompleted
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              )}
                            >
                              {isOverdue ? '⚠️ Overdue' : isToday ? '⏰ Due Today' : isCompleted ? '✅ Concluded' : 'Upcoming'}
                            </span>
                          </td>

                          {/* Latest Outcome */}
                          <td className="py-3.5 px-4 max-w-xs">
                            {item.latestOutcome ? (
                              <div>
                                <span className="inline-flex items-center gap-1 font-bold text-[11px] text-[#C2410C] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/80">
                                  <Sparkles className="w-3 h-3" />
                                  {item.latestOutcome.outcome_tag}
                                </span>
                                {item.latestOutcome.feedback_summary && (
                                  <p className="text-[11px] text-stone-600 line-clamp-1 italic mt-1">
                                    "{item.latestOutcome.feedback_summary}"
                                  </p>
                                )}
                              </div>
                            ) : item.latestActivity ? (
                              <div>
                                <span className="font-semibold text-stone-800 block text-[11px]">
                                  {item.latestActivity.title}
                                </span>
                                {item.latestActivity.details && (
                                  <p className="text-[11px] text-stone-500 line-clamp-1">
                                    {item.latestActivity.details}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-stone-400 italic">No notes recorded</span>
                            )}
                          </td>

                          {/* Enquiry Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Open complete & reschedule modal */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setFollowUpActionItem(item);
                                  setFollowUpActionNote('');
                                  setFollowUpActionNextDate('');
                                }}
                                className="h-7 text-[11px] font-bold rounded-lg border-[#F0E7DE] hover:bg-orange-50 text-stone-700"
                              >
                                Follow-up Action
                              </Button>

                              {/* View Details */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDetailModalEnquiry(item)}
                                className="h-7 px-2 text-[11px] text-stone-600 hover:text-stone-900"
                              >
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : isLoading ? (
        <Card className="p-12 text-center">
          <LoadingSpinner text="Fetching lead pipeline..." />
        </Card>
      ) : isError ? (
        <Card className="p-8 text-center bg-rose-50/50 border-rose-200">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Failed to load enquiries</h3>
          <p className="text-xs text-rose-700 mt-1 mb-4">Could not retrieve enquiry records from the server.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : enquiries.length === 0 ? (
        /* Empty State with Required Spec */
        <Card className="p-12 text-center max-w-xl mx-auto shadow-xs border-[#F0E7DE]">
          <div className="w-14 h-14 rounded-2xl bg-orange-100/60 text-[#C2410C] flex items-center justify-center mx-auto mb-4 border border-orange-200">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#292524]">No wedding enquiries yet</h3>
          <p className="text-xs text-[#78716C] mt-1.5 max-w-md mx-auto leading-relaxed">
            Create your custom enquiry form and share it with potential clients. New submissions will appear here automatically.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/settings/enquiry-form">
              <Button size="sm" className="bg-[#F97316] hover:bg-[#C2410C] text-white shadow-xs gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span>Create Enquiry Form</span>
              </Button>
            </Link>
            <Button size="sm" variant="secondary" onClick={() => setNewEnquiryModalOpen(true)}>
              Record Manually
            </Button>
          </div>
        </Card>
      ) : (
        /* Enquiries Responsive Card Feed */
        <div className="space-y-3">
          {enquiries.map((enq) => {
            const isConverted = enq.status === 'CONVERTED';
            const isLost = enq.status === 'LOST';

            
            const isNew = enq.status === 'NEW';

            return (
              <Card
                key={enq.id}
                className="p-4 sm:p-5 hover:border-[#F97316]/30 transition-all hover:shadow-xs border-[#F0E7DE]"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Customer details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-stone-900 text-sm sm:text-base truncate">
                        {enq.customer_name}
                      </h4>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          isConverted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isLost
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : isNew
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {enq.status}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono bg-stone-50 px-2 py-0.5 rounded">
                        via {enq.source || 'Direct'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-stone-600">
                      <span className="flex items-center gap-1 font-medium text-stone-800">
                        <Phone className="w-3.5 h-3.5 text-[#F97316]" />
                        {enq.customer_phone}
                      </span>
                      {enq.customer_email && (
                        <span className="flex items-center gap-1 text-stone-500">
                          <Mail className="w-3.5 h-3.5 text-stone-400" />
                          {enq.customer_email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
                        {enq.event_date ? formatDate(enq.event_date) : 'Date TBD'} ({enq.event_kind || 'Wedding'})
                      </span>
                      {enq.event_venue && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{enq.event_venue}</span>
                        </span>
                      )}
                    </div>

                    {/* Preview of custom answers or notes if present */}
                    {enq.notes && (
                      <p className="text-xs text-stone-500 line-clamp-1 italic pt-1">
                        &ldquo;{enq.notes}&rdquo;
                      </p>
                    )}

                    {/* WhatsApp Automated Delivery Badges */}
                    {enq.whatsapp_notifications && (
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {enq.whatsapp_notifications.admin_alert && (
                          <div className="flex items-center gap-1.5 text-[11px] bg-stone-100/80 px-2 py-0.5 rounded-md border border-stone-200">
                            <span className="font-semibold text-stone-600">Admin Alert:</span>
                            <span
                              className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                enq.whatsapp_notifications.admin_alert.status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : enq.whatsapp_notifications.admin_alert.status === 'SENT'
                                  ? 'bg-blue-100 text-blue-800'
                                  : enq.whatsapp_notifications.admin_alert.status === 'FAILED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {enq.whatsapp_notifications.admin_alert.status}
                            </span>
                          </div>
                        )}

                        {enq.whatsapp_notifications.customer_ack && (
                          <div className="flex items-center gap-1.5 text-[11px] bg-stone-100/80 px-2 py-0.5 rounded-md border border-stone-200">
                            <span className="font-semibold text-stone-600">Customer Ack:</span>
                            <span
                              className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                enq.whatsapp_notifications.customer_ack.status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : enq.whatsapp_notifications.customer_ack.status === 'SENT'
                                  ? 'bg-blue-100 text-blue-800'
                                  : enq.whatsapp_notifications.customer_ack.status === 'FAILED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {enq.whatsapp_notifications.customer_ack.status}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailModalEnquiry(enq)}
                      className="text-xs h-8"
                    >
                      View Details
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditStatusEnquiry(enq);
                        setNewStatus(enq.status);
                        setStatusNotes('');
                      }}
                      className="text-xs h-8"
                    >
                      Update Status
                    </Button>

                    {!isConverted && !isLost && (
                      <Button
                        size="sm"
                        onClick={() => handleConvertEnquiry(enq)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                      >
                        Convert to Booking
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 4. Modal: View Enquiry Details (Modernized & Mobile 360px Responsive) */}
      {detailModalEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#F0E7DE] shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header with Warm Aesthetic Gradient Accent */}
            <div className="relative px-4 sm:px-6 pt-5 pb-4 bg-gradient-to-br from-[#FFFDF9] via-white to-orange-50/30 border-b border-[#F0E7DE]/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#C2410C] text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md shadow-orange-500/20 shrink-0">
                    {detailModalEnquiry.customer_name?.charAt(0)?.toUpperCase() || 'E'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-stone-900 text-base sm:text-lg tracking-tight">
                        {detailModalEnquiry.customer_name}
                      </h3>
                      <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${getStatusBadge(detailModalEnquiry.status)}`}>
                        {detailModalEnquiry.status}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 flex items-center gap-1.5 font-medium flex-wrap">
                      <span>Enquiry #{detailModalEnquiry.id.slice(0, 8)}</span>
                      <span className="text-stone-300">•</span>
                      <span>Source: <strong className="text-stone-700 capitalize">{detailModalEnquiry.source?.replace(/_/g, ' ') || 'Direct'}</strong></span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailModalEnquiry(null)}
                  className="p-1.5 sm:p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 custom-scrollbar bg-white">
              {/* Essential Contact & Event Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gradient-to-br from-[#FFFDF9] to-stone-50/60 p-3.5 sm:p-4 rounded-2xl border border-[#F0E7DE]">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-100/60 text-[#C2410C] flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">Phone</span>
                    <a
                      href={`tel:${detailModalEnquiry.customer_phone}`}
                      className="block font-bold text-stone-900 text-xs sm:text-sm hover:text-[#F97316] transition-colors truncate mt-0.5"
                    >
                      {detailModalEnquiry.customer_phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-100/60 text-[#C2410C] flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">Email</span>
                    <div className="font-medium text-stone-800 text-xs truncate mt-0.5">
                      {detailModalEnquiry.customer_email || '—'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-100/60 text-[#C2410C] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">Event Type</span>
                    <div className="font-bold text-stone-900 text-xs mt-0.5 capitalize">
                      {detailModalEnquiry.event_kind || 'Wedding'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-100/60 text-[#C2410C] flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">Event Date</span>
                    <div className="font-bold text-stone-900 text-xs mt-0.5">
                      {detailModalEnquiry.event_date ? formatDate(detailModalEnquiry.event_date) : 'To be decided'}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 pt-1 border-t border-stone-200/50 flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-100/60 text-[#C2410C] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">Venue / Location</span>
                    <div className="font-medium text-stone-800 text-xs mt-0.5 leading-snug">
                      {detailModalEnquiry.event_venue || 'Venue not provided yet'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Form Answers Section */}
              {detailModalEnquiry.custom_answers && Object.keys(detailModalEnquiry.custom_answers).length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                    <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                      Custom Form Answers
                    </h4>
                  </div>
                  <div className="bg-[#FFFDF9] border border-[#F0E7DE] rounded-2xl p-3 sm:p-4 divide-y divide-stone-100 shadow-2xs">
                    {Object.entries(detailModalEnquiry.custom_answers).map(([key, val]) => {
                      const isImage = typeof val === 'string' && (
                        val.startsWith('data:image/') ||
                        (val.startsWith('http') && /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(val))
                      );

                      return (
                        <div key={key} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-2">
                          <span className="font-semibold text-stone-600 text-xs capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>

                          {isImage ? (
                            <div className="mt-1 bg-stone-50 border border-[#F0E7DE] rounded-2xl p-2.5 flex flex-col sm:flex-row items-center gap-3">
                              <div className="relative group rounded-xl overflow-hidden border border-stone-200/70 bg-white w-full sm:w-36 h-36 shrink-0 shadow-xs">
                                <img
                                  src={val}
                                  alt="Reference Attachment"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="flex flex-col gap-2 w-full">
                                <span className="text-xs font-bold text-stone-800">Attached Reference Photo</span>
                                <p className="text-[11px] text-stone-500">Client uploaded visual style / reference look</p>
                                <div className="flex items-center gap-2 pt-1">
                                  <a
                                    href={val}
                                    target="_blank"
                                    rel="noreferrer"
                                    download="reference-image"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#C2410C] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                                  >
                                    <span>View / Full Size</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-stone-900 font-bold text-xs bg-white px-3 py-2 rounded-xl border border-stone-200/60 break-words">
                              {Array.isArray(val) ? val.join(', ') : String(val)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes / Special Requirements */}
              {detailModalEnquiry.notes && (
                <div className="space-y-2">
                  <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#F97316]" />
                    <span>Notes / Requirements</span>
                  </h4>
                  <div className="bg-stone-50 border border-stone-200/80 p-3.5 sm:p-4 rounded-2xl text-xs text-stone-700 whitespace-pre-wrap leading-relaxed shadow-2xs break-words">
                    {/* Sanitize any potential long base64 strings in historical records */}
                    {detailModalEnquiry.notes.replace(/data:image\/[a-zA-Z0-9.+]+;base64,[A-Za-z0-9+/=]+/g, '[Attached Reference Photo (See Image Above)]')}
                  </div>
                </div>
              )}

              {/* WhatsApp Notification Lifecycle Audit */}
              {detailModalEnquiry.whatsapp_notifications && (
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Delivery Lifecycle</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Admin Alert Card */}
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-800">Admin Alert</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            detailModalEnquiry.whatsapp_notifications.admin_alert?.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : detailModalEnquiry.whatsapp_notifications.admin_alert?.status === 'SENT'
                              ? 'bg-blue-100 text-blue-800'
                              : detailModalEnquiry.whatsapp_notifications.admin_alert?.status === 'FAILED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {detailModalEnquiry.whatsapp_notifications.admin_alert?.status || 'NOT QUEUED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Template: <code className="text-stone-700 font-mono">new_enquiry_alert__admin</code>
                      </p>
                      {detailModalEnquiry.whatsapp_notifications.admin_alert?.recipient && (
                        <p className="text-[11px] text-stone-500">
                          Recipient: +{detailModalEnquiry.whatsapp_notifications.admin_alert.recipient}
                        </p>
                      )}
                      {detailModalEnquiry.whatsapp_notifications.admin_alert?.provider_message_id && (
                        <p className="text-[10px] text-stone-400 font-mono truncate">
                          ID: {detailModalEnquiry.whatsapp_notifications.admin_alert.provider_message_id}
                        </p>
                      )}
                    </div>

                    {/* Customer Ack Card */}
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-800">Customer Ack</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            detailModalEnquiry.whatsapp_notifications.customer_ack?.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : detailModalEnquiry.whatsapp_notifications.customer_ack?.status === 'SENT'
                              ? 'bg-blue-100 text-blue-800'
                              : detailModalEnquiry.whatsapp_notifications.customer_ack?.status === 'FAILED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {detailModalEnquiry.whatsapp_notifications.customer_ack?.status || 'NOT QUEUED'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Template: <code className="text-stone-700 font-mono">new_enquiry_notification</code>
                      </p>
                      {detailModalEnquiry.whatsapp_notifications.customer_ack?.recipient && (
                        <p className="text-[11px] text-stone-500">
                          Recipient: +{detailModalEnquiry.whatsapp_notifications.customer_ack.recipient}
                        </p>
                      )}
                      {detailModalEnquiry.whatsapp_notifications.customer_ack?.provider_message_id && (
                        <p className="text-[10px] text-stone-400 font-mono truncate">
                          ID: {detailModalEnquiry.whatsapp_notifications.customer_ack.provider_message_id}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-3.5 sm:px-6 sm:py-4 bg-stone-50/80 border-t border-[#F0E7DE] flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center justify-between gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDetailModalEnquiry(null)}
                className="text-stone-600 hover:text-stone-900 order-2 min-[420px]:order-1"
              >
                Close
              </Button>

              <div className="flex items-center gap-2 order-1 min-[420px]:order-2 w-full min-[420px]:w-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditStatusEnquiry(detailModalEnquiry);
                    setNewStatus(detailModalEnquiry.status);
                    setStatusNotes('');
                    setDetailModalEnquiry(null);
                  }}
                  className="border-[#F0E7DE] text-stone-700 hover:bg-stone-100 flex-1 min-[420px]:flex-initial text-xs sm:text-sm"
                >
                  <Edit className="w-3.5 h-3.5 mr-1 text-[#F97316]" />
                  Update Status
                </Button>

                {detailModalEnquiry.status !== 'CONVERTED' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const current = detailModalEnquiry;
                      setDetailModalEnquiry(null);
                      handleConvertEnquiry(current);
                    }}
                    className="bg-gradient-to-r from-[#F97316] to-[#C2410C] hover:opacity-95 text-white shadow-xs font-semibold flex-1 min-[420px]:flex-initial text-xs sm:text-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Convert
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Update Status */}
      {editStatusEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#F0E7DE] shadow-2xl max-w-md w-full p-6">
            <h3 className="font-bold text-stone-900 text-base mb-1">Update Enquiry Status</h3>
            <p className="text-xs text-stone-500 mb-4">
              Current client: <span className="font-semibold text-stone-800">{editStatusEnquiry.customer_name}</span>
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <ModernDropdown
                label="Select Status"
                value={newStatus}
                onChange={(val) => setNewStatus(val)}
                options={STATUS_OPTIONS}
              />

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Follow-up Note (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Spoke to bride on call, shared lookbook on WhatsApp"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#F0E7DE] flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditStatusEnquiry(null)}
                  disabled={updatingStatus}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updatingStatus}
                  className="bg-[#F97316] hover:bg-[#C2410C] text-white"
                >
                  {updatingStatus ? 'Updating...' : 'Save Status'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Create Manual Enquiry */}
      {newEnquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#F0E7DE] shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E7DE] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">New Enquiry</h3>
                  <p className="text-xs text-stone-500">Record a wedding enquiry or bridal consultation lead</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewEnquiryModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualEnquiry} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Bride / Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deepika Ramesh"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <ModernDropdown
                    label="Event Type"
                    value={formData.event_kind}
                    onChange={(val) => setFormData({ ...formData, event_kind: val })}
                    options={EVENT_TYPE_OPTIONS}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Venue / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai / Madurai"
                    value={formData.event_venue}
                    onChange={(e) => setFormData({ ...formData, event_venue: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <ModernDropdown
                    label="Lead Source"
                    value={formData.source}
                    onChange={(val) => setFormData({ ...formData, source: val })}
                    options={SOURCE_OPTIONS}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Customer Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="bride@example.com"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Special Notes / Service Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Looking for HD Bridal makeup + saree draping and hairstyle"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#F0E7DE]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setNewEnquiryModalOpen(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={formLoading}
                  className="bg-[#F97316] hover:bg-[#C2410C] text-white shadow-xs"
                >
                  {formLoading ? 'Saving...' : 'Save Enquiry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Follow-Up Action Modal: Complete & Reschedule Next Date */}
      {followUpActionItem && (
        <Modal
          isOpen={!!followUpActionItem}
          onClose={() => setFollowUpActionItem(null)}
          title="Process Client Follow-Up"
          size="md"
        >
          <form onSubmit={handleFollowUpActionSubmit} className="p-6 space-y-4">
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Active Follow-up Client
              </span>
              <h4 className="font-extrabold text-stone-900 text-sm mt-0.5">
                {followUpActionItem.customer_name}
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Phone: {followUpActionItem.customer_phone}
                {followUpActionItem.next_follow_up_at && (
                  <span className="ml-2">
                    • Scheduled for: <strong>{formatDate(followUpActionItem.next_follow_up_at)}</strong>
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Call / Discussion Summary Note
              </label>
              <textarea
                rows={3}
                required
                value={followUpActionNote}
                onChange={(e) => setFollowUpActionNote(e.target.value)}
                placeholder="e.g. Spoke with bride. She loved the look and requested custom quotation with saree drapist."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">
                Schedule Next Follow-Up Date (Optional)
              </label>
              <ModernDatePicker
                value={followUpActionNextDate}
                onChange={(val) => setFollowUpActionNextDate(val)}
                placeholder="Select next follow-up date..."
                disablePastDates={true}
                className="w-full text-xs"
              />
              <p className="text-[11px] text-stone-400">
                Leave empty if this follow-up concludes the discussion without requiring a new follow-up date.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#F0E7DE]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setFollowUpActionItem(null)}
                disabled={submittingFollowUp}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingFollowUp}
                className="bg-[#F97316] hover:bg-[#C2410C] text-white shadow-xs font-bold"
              >
                {submittingFollowUp
                  ? 'Saving...'
                  : followUpActionNextDate
                  ? 'Save & Schedule Next'
                  : 'Mark as Completed'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
