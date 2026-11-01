'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  User,
  MapPin,
  Video,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  FileCheck,
  Check,
  ChevronDown,
  ExternalLink,
  Edit3,
  CalendarDays,
  LayoutList,
  UserCheck,
  Sparkle,
  Share2,
  ImageIcon,
  Maximize2,
  History,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Send,
  MessageSquare,
  Package,
  IndianRupee,
  MessageSquareQuote,
  ThumbsUp,
  XCircle,
  CalendarCheck,
  HeartHandshake,
  Crown,
} from 'lucide-react';
import {
  Card,
  PageHeader,
  Button,
  LoadingSpinner,
  EmptyState,
  Badge,
  ModernDropdown,
  ModernDatePicker,
  ModernTimePicker,
  Modal,
} from '@/components/ui';
import { useModalAlert } from '@/components/ui/ModalAlert';
import {
  consultationApi,
  customerApi,
  enquiryApi,
  bookingApi,
  businessApi,
  notificationApi,
} from '@/services/api/modules';

import { useAuthStore } from '@/store/authStore';
import { formatDate, formatDateTime, cn } from '@/utils/formatters';

// Filter and Type Options
const CONSULTATION_TYPES = [
  { value: 'ALL', label: 'All Consultation Types' },
  { value: 'IN_PERSON', label: 'In-Person Consultation' },
  { value: 'TRIAL', label: 'Bridal Trial (Makeup & Hair)' },
  { value: 'STUDIO', label: 'Studio Consultation' },
  { value: 'PHONE', label: 'Phone Consultation' },
  { value: 'VIDEO', label: 'Video Call (Google Meet / Zoom)' },
  { value: 'OTHER', label: 'Other' },
];

const FORM_CONSULTATION_TYPES = [
  { value: 'IN_PERSON', label: 'In-Person Studio Consultation' },
  { value: 'TRIAL', label: 'Bridal Trial (Makeup & Hair Demo)' },
  { value: 'STUDIO', label: 'Studio Visit & Look Preview' },
  { value: 'PHONE', label: 'Phone Discovery Call' },
  { value: 'VIDEO', label: 'Virtual Video Consultation' },
  { value: 'OTHER', label: 'Custom / Other Consultation' },
];

const CONSULTATION_STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
];

const STATUS_BADGE_CONFIG = {
  REQUESTED: {
    label: 'Requested',
    color: 'bg-amber-50 text-amber-700 border-amber-200/90',
    dot: 'bg-amber-500',
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    dot: 'bg-emerald-500',
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    color: 'bg-purple-50 text-purple-700 border-purple-200/90',
    dot: 'bg-purple-500',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-blue-50 text-blue-700 border-blue-200/90',
    dot: 'bg-blue-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-rose-50 text-rose-700 border-rose-200/90',
    dot: 'bg-rose-500',
  },
  NO_SHOW: {
    label: 'No Show',
    color: 'bg-stone-100 text-stone-600 border-stone-200/90',
    dot: 'bg-stone-400',
  },
};

const OUTCOME_TAGS = [
  { id: 'TRIAL_APPROVED', label: 'Trial Approved & Loved Look' },
  { id: 'CHANGES_REQUESTED', label: 'Changes Requested / Minor Tweaks' },
  { id: 'PACKAGE_PENDING', label: 'Package Discussion Pending' },
  { id: 'FOLLOW_UP_NEEDED', label: 'Client Needs Follow-Up' },
  { id: 'READY_TO_BOOK', label: 'Ready to Book / Advance Invoiced' },
  { id: 'NOT_PROCEEDING', label: 'Did Not Proceed' },
];

export default function ConsultationsPage() {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useModalAlert();
  const currentBusiness = useAuthStore((state) => state.currentBusiness);
  const businessId = currentBusiness?.id;

  // View Mode: 'list' | 'calendar' | 'outcomes'
  const [viewMode, setViewMode] = useState('list');

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Outcomes Tab Filters
  const [outcomeTagFilter, setOutcomeTagFilter] = useState('ALL');
  const [outcomeIntentionFilter, setOutcomeIntentionFilter] = useState('all');
  const [outcomeFollowUpStatus, setOutcomeFollowUpStatus] = useState('all');
  const [outcomePage, setOutcomePage] = useState(1);
  const [selectedOutcomeDetail, setSelectedOutcomeDetail] = useState(null);

  const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);

  // Modal States
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Active items being viewed/edited
  const [activeConsultation, setActiveConsultation] = useState(null);

  // Schedule / Create Form State strictly matching schema.prisma consultations model
  const initialScheduleForm = {
    customer_id: '',
    requested_name: '',
    requested_phone: '',
    consultation_type: 'TRIAL',
    scheduled_date: '',
    scheduled_time: '11:00',
    duration_minutes: '60',
    location_name: '',
    location_address: '',
    location_map_url: '',
    meeting_url: '',
    confirmed_by: '',
    enquiry_id: '',
    booking_id: '',
    notes: '',
  };
  const [scheduleForm, setScheduleForm] = useState(initialScheduleForm);
  const [scheduleErrors, setScheduleErrors] = useState({});

  // Reschedule Form State
  const [rescheduleForm, setRescheduleForm] = useState({
    scheduled_date: '',
    scheduled_time: '11:00',
    duration_minutes: '60',
    notes: '',
  });
  const [rescheduleError, setRescheduleError] = useState('');

  // Outcome Form State
  const [outcomeForm, setOutcomeForm] = useState({
    selectedTag: 'TRIAL_APPROVED',
    summary: '',
    agreed_services: '',
    agreed_package: '',
    estimated_price_rupees: '',
    follow_up_date: '',
    intends_to_proceed: true,
  });

  // Cancel Form State
  const [cancelReason, setCancelReason] = useState('');

  // 1. Fetch Consultation Dashboard Stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['consultation-stats', businessId],
    queryFn: () => consultationApi.getStats(),
    enabled: !!businessId,
  });
  const stats = statsData?.data || {
    totalConsultations: 0,
    upcomingConsultations: 0,
    completedConsultations: 0,
    cancelledConsultations: 0,
  };

  // 2. Fetch Consultations List
  const {
    data: listData,
    isLoading: isLoadingList,
    refetch: refetchList,
  } = useQuery({
    queryKey: [
      'consultations-list',
      businessId,
      searchTerm,
      statusFilter,
      typeFilter,
      filterStartDate,
      filterEndDate,
      page,
    ],
    queryFn: () =>
      consultationApi.list({
        page,
        limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        consultation_type: typeFilter !== 'ALL' ? typeFilter : undefined,
        startDate: filterStartDate ? new Date(filterStartDate).toISOString() : undefined,
        endDate: filterEndDate ? new Date(filterEndDate + 'T23:59:59').toISOString() : undefined,
      }),
    enabled: !!businessId && viewMode === 'list',
  });

  const consultations = listData?.data?.consultations || [];
  const pagination = listData?.data?.pagination || { total: 0, page: 1, totalPages: 1 };

  // 3b. Fetch Recorded Outcomes History (when in 'outcomes' tab or when recording)
  const {
    data: outcomesData,
    isLoading: isLoadingOutcomes,
    refetch: refetchOutcomes,
  } = useQuery({
    queryKey: [
      'consultation-outcomes-history',
      businessId,
      searchTerm,
      outcomeTagFilter,
      outcomeIntentionFilter,
      outcomeFollowUpStatus,
      filterStartDate,
      filterEndDate,
      outcomePage,
    ],
    queryFn: () =>
      consultationApi.getOutcomes({
        page: outcomePage,
        limit: 15,
        search: searchTerm || undefined,
        outcome_tag: outcomeTagFilter !== 'ALL' ? outcomeTagFilter : undefined,
        intends_to_proceed: outcomeIntentionFilter !== 'all' ? outcomeIntentionFilter : undefined,
        follow_up_status: outcomeFollowUpStatus !== 'all' ? outcomeFollowUpStatus : undefined,
        startDate: filterStartDate ? new Date(filterStartDate).toISOString() : undefined,
        endDate: filterEndDate ? new Date(filterEndDate + 'T23:59:59').toISOString() : undefined,
      }),
    enabled: !!businessId && viewMode === 'outcomes',
  });

  const recordedOutcomes = outcomesData?.data?.outcomes || [];
  const outcomeCounts = outcomesData?.data?.counts || {
    total: 0,
    trialApproved: 0,
    changesRequested: 0,
    packageDiscussion: 0,
    needsFollowUp: 0,
    readyToBook: 0,
    didNotProceed: 0,
  };
  const outcomePagination = outcomesData?.data?.pagination || { total: 0, page: 1, totalPages: 1 };

  // 4b. Fetch Full Consultation Details (including Rescheduling History & WhatsApp Message Delivery Jobs)
  const {
    data: activeConsultationDetailData,
    isLoading: isLoadingConsultationDetail,
    refetch: refetchConsultationDetail,
  } = useQuery({
    queryKey: ['consultation-detail', activeConsultation?.id],
    queryFn: () => consultationApi.getById(activeConsultation.id),
    enabled: isDetailsModalOpen && !!activeConsultation?.id,
  });

  const detailedConsultation = activeConsultationDetailData?.data || activeConsultation;

  // WhatsApp Message Retry Mutation
  const [retryingJobId, setRetryingJobId] = useState(null);
  const retryMessageMutation = useMutation({
    mutationFn: (jobId) => {
      setRetryingJobId(jobId);
      return notificationApi.retry(jobId);
    },
    onSuccess: () => {
      setRetryingJobId(null);
      refetchConsultationDetail();
      queryClient.invalidateQueries(['consultations-list']);
      showAlert({
        title: 'WhatsApp Message Retried',
        message: 'Notification retry has been dispatched to WhatsApp Cloud API.',
        type: 'success',
      });
    },
    onError: (err) => {
      setRetryingJobId(null);
      showAlert({
        title: 'Retry Failed',
        message: err.response?.data?.message || err.message || 'Could not retry WhatsApp message.',
        type: 'danger',
      });
    },
  });
  const { data: customersData } = useQuery({
    queryKey: ['customers-picker', businessId],
    queryFn: () => customerApi.list({ limit: 100 }),
    enabled: isScheduleModalOpen && !!businessId,
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff-members', businessId],
    queryFn: () => businessApi.getMembers(businessId),
    enabled: isScheduleModalOpen && !!businessId,
  });

  const { data: enquiriesData } = useQuery({
    queryKey: ['enquiries-picker', businessId],
    queryFn: () => enquiryApi.list({ limit: 50 }),
    enabled: isScheduleModalOpen && !!businessId,
  });

  const { data: bookingsData } = useQuery({
    queryKey: ['bookings-picker', businessId],
    queryFn: () => bookingApi.list({ limit: 50 }),
    enabled: isScheduleModalOpen && !!businessId,
  });

  // Format dropdown options directly with safe fallbacks
  const customerOptions = useMemo(() => {
    const list = customersData?.data?.customers || [];
    return [
      { value: '', label: 'Select Existing Customer / Bride' },
      ...list.map((c) => ({
        value: c.id,
        label: `${c.full_name || 'Unnamed Client'} (${c.phone || c.email || 'No contact'})`,
      })),
    ];
  }, [customersData]);

  const staffOptions = useMemo(() => {
    const list = staffData?.data?.members || [];
    return [
      { value: '', label: 'Unassigned / Studio Artist' },
      ...list.map((m) => ({
        value: m.user_id,
        label: `${m.users?.name || m.users?.email || 'Staff Member'} (${m.role})`,
      })),
    ];
  }, [staffData]);

  const enquiryOptions = useMemo(() => {
    const list = enquiriesData?.data?.enquiries || [];
    return [
      { value: '', label: 'None (Standalone Consultation)' },
      ...list.map((e) => ({
        value: e.id,
        label: `${e.customer_name || 'Enquiry'} - ${e.event_kind || 'Event'} (${e.status})`,
      })),
    ];
  }, [enquiriesData]);

  const bookingOptions = useMemo(() => {
    const list = bookingsData?.data?.bookings || [];
    return [
      { value: '', label: 'None (Pre-Booking Trial)' },
      ...list.map((b) => ({
        value: b.id,
        label: `#${b.booking_number} - ${b.customer?.full_name || 'Client'} (${b.status})`,
      })),
    ];
  }, [bookingsData]);

  // Mutations
  const scheduleMutation = useMutation({
    mutationFn: (payload) => consultationApi.schedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['consultations-list']);
      queryClient.invalidateQueries(['consultation-stats']);
      queryClient.invalidateQueries(['consultations-calendar']);
      setIsScheduleModalOpen(false);
      setScheduleForm(initialScheduleForm);
      showAlert({
        title: 'Consultation Scheduled',
        message: 'The bridal trial / consultation has been booked and scheduled successfully.',
        type: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to schedule consultation';
      showAlert({
        title: 'Scheduling Failed',
        message: msg,
        type: 'danger',
      });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, payload }) => consultationApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['consultations-list']);
      queryClient.invalidateQueries(['consultation-stats']);
      queryClient.invalidateQueries(['consultations-calendar']);
      queryClient.invalidateQueries(['consultation-detail']);
      setIsRescheduleModalOpen(false);
      setActiveConsultation(null);
      showAlert({
        title: 'Consultation Rescheduled',
        message: 'The new appointment date and time have been confirmed. WhatsApp confirmation has been dispatched to the client.',
        type: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to reschedule';
      setRescheduleError(msg);
    },
  });

  const outcomeMutation = useMutation({
    mutationFn: ({ id, payload }) => consultationApi.recordOutcome(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['consultations-list']);
      queryClient.invalidateQueries(['consultation-stats']);
      queryClient.invalidateQueries(['consultations-calendar']);
      queryClient.invalidateQueries(['consultation-outcomes-history']);
      queryClient.invalidateQueries(['enquiries-follow-ups']);
      queryClient.invalidateQueries(['enquiries']);
      setIsOutcomeModalOpen(false);
      setActiveConsultation(null);
      showAlert({
        title: 'Outcome Recorded & Preserved!',
        message: 'Consultation outcome has been permanently logged in history and follow-up synced to Enquiries.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Error Saving Outcome',
        message: err.response?.data?.message || err.message,
        type: 'danger',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      consultationApi.cancel(id, { cancellation_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['consultations-list']);
      queryClient.invalidateQueries(['consultation-stats']);
      queryClient.invalidateQueries(['consultations-calendar']);
      setIsCancelModalOpen(false);
      setActiveConsultation(null);
      showAlert({
        title: 'Consultation Cancelled',
        message: 'The consultation has been marked as cancelled.',
        type: 'info',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Cancellation Failed',
        message: err.response?.data?.message || err.message,
        type: 'danger',
      });
    },
  });

  const statusUpdateMutation = useMutation({
    mutationFn: ({ id, status }) => consultationApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['consultations-list']);
      queryClient.invalidateQueries(['consultation-stats']);
      queryClient.invalidateQueries(['consultations-calendar']);
      showAlert({
        title: 'Status Updated',
        message: 'Consultation status updated successfully.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Failed to Update Status',
        message: err.response?.data?.message || err.message,
        type: 'danger',
      });
    },
  });

  // Handle customer picker autofill
  const handleCustomerSelect = (custId) => {
    if (!custId) {
      setScheduleForm((prev) => ({
        ...prev,
        customer_id: '',
      }));
      return;
    }
    const list = customersData?.data?.customers || [];
    const found = list.find((c) => c.id === custId);
    if (found) {
      setScheduleForm((prev) => ({
        ...prev,
        customer_id: custId,
        requested_name: found.full_name || prev.requested_name,
        requested_phone: found.phone || prev.requested_phone,
      }));
    }
  };

  // Schedule Form Submission
  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!scheduleForm.requested_name.trim()) {
      errors.requested_name = 'Bride / Client name is required';
    }
    if (!scheduleForm.scheduled_date) {
      errors.scheduled_date = 'Please pick a consultation date';
    }
    if (!scheduleForm.scheduled_time) {
      errors.scheduled_time = 'Please pick a start time';
    }

    if (Object.keys(errors).length > 0) {
      setScheduleErrors(errors);
      return;
    }

    // Compute ISO start and end times
    const startStr = `${scheduleForm.scheduled_date}T${scheduleForm.scheduled_time}:00`;
    const startDate = new Date(startStr);
    const durationMins = parseInt(scheduleForm.duration_minutes, 10) || 60;
    const endDate = new Date(startDate.getTime() + durationMins * 60 * 1000);

    const payload = {
      customer_id: scheduleForm.customer_id || null,
      requested_name: scheduleForm.requested_name.trim(),
      requested_phone: scheduleForm.requested_phone.trim(),
      consultation_type: scheduleForm.consultation_type,
      status: 'CONFIRMED',
      scheduled_start: startDate.toISOString(),
      scheduled_end: endDate.toISOString(),
      location_name: scheduleForm.location_name.trim() || null,
      location_address: scheduleForm.location_address.trim() || null,
      location_map_url: scheduleForm.location_map_url?.trim() || null,
      meeting_url: scheduleForm.meeting_url.trim() || null,
      notes: scheduleForm.notes.trim() || null,
      confirmed_by: scheduleForm.confirmed_by || null,
      enquiry_id: scheduleForm.enquiry_id || null,
      booking_id: scheduleForm.booking_id || null,
    };

    scheduleMutation.mutate(payload);
  };

  // Reschedule Form Submission
  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    setRescheduleError('');
    if (!rescheduleForm.scheduled_date || !rescheduleForm.scheduled_time) {
      setRescheduleError('Please select both a date and time.');
      return;
    }

    const startStr = `${rescheduleForm.scheduled_date}T${rescheduleForm.scheduled_time}:00`;
    const startDate = new Date(startStr);
    const durationMins = parseInt(rescheduleForm.duration_minutes, 10) || 60;
    const endDate = new Date(startDate.getTime() + durationMins * 60 * 1000);

    const payload = {
      scheduled_start: startDate.toISOString(),
      scheduled_end: endDate.toISOString(),
      notes: rescheduleForm.notes.trim()
        ? `${activeConsultation.notes || ''}\n[Rescheduled]: ${rescheduleForm.notes.trim()}`.trim()
        : activeConsultation.notes,
    };

    rescheduleMutation.mutate({ id: activeConsultation.id, payload });
  };

  // Outcome Form Submission
  const handleOutcomeSubmit = (e) => {
    e.preventDefault();
    if (!activeConsultation) return;

    const priceRupees = parseFloat(outcomeForm.estimated_price_rupees);
    const payload = {
      outcome_tag: outcomeForm.selectedTag,
      feedback_summary: outcomeForm.summary || null,
      agreed_package: outcomeForm.agreed_package || null,
      agreed_services: outcomeForm.agreed_services || null,
      estimated_price_paise:
        !isNaN(priceRupees) && priceRupees > 0 ? Math.round(priceRupees * 100) : null,
      follow_up_date: outcomeForm.follow_up_date || null,
      intends_to_proceed: outcomeForm.intends_to_proceed,
    };

    outcomeMutation.mutate({ id: activeConsultation.id, payload });
  };

  // Trigger Cancel
  const handleConfirmCancel = () => {
    if (!activeConsultation) return;
    cancelMutation.mutate({
      id: activeConsultation.id,
      reason: cancelReason.trim() || 'Cancelled by studio',
    });
  };

  // Quick WhatsApp reminder
  const handleSendReminderWhatsApp = (cons) => {
    const name = cons.requested_name || cons.customers?.full_name || 'Client';
    const phone = cons.requested_phone || cons.customers?.phone;
    if (!phone) {
      showAlert({
        title: 'No Phone Number',
        message: 'No contact phone number is recorded for this consultation.',
        type: 'warning',
      });
      return;
    }
    const dateFormatted = cons.scheduled_start ? formatDateTime(cons.scheduled_start) : 'Scheduled Date';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hello ${name},\n\nThis is a friendly reminder for your upcoming bridal consultation / trial with ${currentBusiness?.name || 'our studio'}.\n\nAppointment: ${dateFormatted}\nType: ${cons.consultation_type}\nVenue: ${cons.location_name || cons.location_address || 'Studio'}\n\nPlease let us know if you need to make any adjustments.`
    );
    window.open(`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#292524] tracking-tight">
              Consultations & Trials
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#C2410C] border border-orange-200/80">
              Bridal Artistry Studio
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Schedule bridal makeup trials, hair previews, skin tone consultations, and record bride look preferences.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Toggle with Recorded Outcomes */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setPage(1);
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
                viewMode === 'list'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              )}
            >
              <LayoutList className="w-3.5 h-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('outcomes');
                setOutcomePage(1);
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
                viewMode === 'outcomes'
                  ? 'bg-[#F97316] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              )}
            >
              <History className="w-3.5 h-3.5" />
              Recorded Outcomes
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setScheduleForm(initialScheduleForm);
              setScheduleErrors({});
              setIsScheduleModalOpen(true);
            }}
            className="bg-[#F97316] hover:bg-[#C2410C] text-white shadow-sm rounded-xl px-4 text-xs h-9 font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            Schedule Consultation
          </Button>
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      {/* 2. Summary Metric Cards: Dynamically Render Consultations or Recorded Outcomes */}
      {viewMode === 'outcomes' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {/* Total */}
            <Card className="p-3 bg-white border-[#F0E7DE] rounded-2xl shadow-2xs hover:border-stone-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Total Recorded</span>
                <span className="p-1 rounded-lg bg-stone-100 text-stone-600">
                  <History className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xl font-black text-stone-900 mt-1 block">
                {isLoadingOutcomes ? '...' : outcomeCounts.total}
              </span>
              <span className="text-[10px] text-stone-400">All trial outcomes</span>
            </Card>

            {/* Trial Approved */}
            <Card className="p-3 bg-emerald-50/50 border-emerald-100 rounded-2xl shadow-2xs hover:border-emerald-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Loved Look</span>
                <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xl font-black text-emerald-700 mt-1 block">
                {isLoadingOutcomes ? '...' : outcomeCounts.trialApproved}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Trial approved</span>
            </Card>

            {/* Changes Requested */}
            <Card className="p-3 bg-amber-50/50 border-amber-100 rounded-2xl shadow-2xs hover:border-amber-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Minor Tweaks</span>
                <span className="p-1 rounded-lg bg-amber-100 text-amber-700">
                  <Edit3 className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xl font-black text-amber-700 mt-1 block">
                {isLoadingOutcomes ? '...' : outcomeCounts.changesRequested}
              </span>
              <span className="text-[10px] text-amber-600 font-medium">Changes requested</span>
            </Card>

            {/* Package Pending */}
            <Card className="p-3 bg-blue-50/50 border-blue-100 rounded-2xl shadow-2xs hover:border-blue-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Pkg Discussion</span>
                <span className="p-1 rounded-lg bg-blue-100 text-blue-700">
                  <Package className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xl font-black text-blue-700 mt-1 block">
                {isLoadingOutcomes ? '...' : outcomeCounts.packageDiscussion}
              </span>
              <span className="text-[10px] text-blue-600 font-medium">Under discussion</span>
            </Card>

            {/* Needs Follow Up */}
            <Card className="p-3 bg-purple-50/50 border-purple-100 rounded-2xl shadow-2xs hover:border-purple-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">Needs Follow-up</span>
                <span className="p-1 rounded-lg bg-purple-100 text-purple-700">
                  <CalendarClock className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xl font-black text-purple-700 mt-1 block">
                {isLoadingOutcomes ? '...' : outcomeCounts.needsFollowUp}
              </span>
              <span className="text-[10px] text-purple-600 font-medium">Awaiting decision</span>
            </Card>

            {/* Ready to Book */}
            <Card className="p-3 bg-orange-50/60 border-orange-200 rounded-2xl shadow-2xs hover:border-orange-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#C2410C] uppercase tracking-wider block">Ready to Book</span>
                <span className="p-1 rounded-lg bg-orange-100 text-[#C2410C]">
                  <FileCheck className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xl font-black text-[#C2410C] mt-1 block">
                {isLoadingOutcomes ? '...' : outcomeCounts.readyToBook}
              </span>
              <span className="text-[10px] text-orange-600 font-medium">Advance invoiced</span>
            </Card>

            {/* Did Not Proceed */}
            <Card className="p-3 bg-stone-100/70 border-stone-200 rounded-2xl shadow-2xs col-span-2 sm:col-span-1 hover:border-stone-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">Did Not Proceed</span>
                <span className="p-1 rounded-lg bg-stone-200 text-stone-600">
                  <XCircle className="w-3.5 h-3.5" />
                </span>
              </div>
              <span className="text-xl font-black text-stone-700 mt-1 block">
                {isLoadingOutcomes ? '...' : outcomeCounts.didNotProceed}
              </span>
              <span className="text-[10px] text-stone-500 font-medium">Closed / passed</span>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total */}
          <Card className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-2xs hover:border-stone-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Total Consultations</span>
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
                <CalendarClock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#292524]">
                {isLoadingStats ? (
                  <span className="inline-block w-12 h-6 bg-stone-200 animate-pulse rounded" />
                ) : (
                  stats.totalConsultations
                )}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">All time scheduled appointments</p>
          </Card>

          {/* Card 2: Upcoming */}
          <Card className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-2xs hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Upcoming Trials</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-700">
                {isLoadingStats ? (
                  <span className="inline-block w-12 h-6 bg-stone-200 animate-pulse rounded" />
                ) : (
                  stats.upcomingConsultations
                )}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Active future bookings</p>
          </Card>

          {/* Card 3: Completed */}
          <Card className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-2xs hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Completed Looks</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-blue-700">
                {isLoadingStats ? (
                  <span className="inline-block w-12 h-6 bg-stone-200 animate-pulse rounded" />
                ) : (
                  stats.completedConsultations
                )}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Trials & previews executed</p>
          </Card>

          {/* Card 4: Cancelled */}
          <Card className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-2xs hover:border-rose-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Cancelled / No-Show</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-rose-700">
                {isLoadingStats ? (
                  <span className="inline-block w-12 h-6 bg-stone-200 animate-pulse rounded" />
                ) : (
                  stats.cancelledConsultations
                )}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Cancelled appointments</p>
          </Card>
        </div>
      )}

      {/* 3. Search and Filtering Bar */}
      <Card className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-2xs">
        {viewMode === 'outcomes' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setOutcomePage(1);
                }}
                placeholder="Search bride, package, feedback notes..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#F97316] focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Outcome Tag Filter */}
            <ModernDropdown
              value={outcomeTagFilter}
              onChange={(val) => {
                setOutcomeTagFilter(val);
                setOutcomePage(1);
              }}
              options={[
                { value: 'ALL', label: 'All Outcome Categories' },
                ...OUTCOME_TAGS.map((t) => ({ value: t.label, label: t.label })),
              ]}
              placeholder="Filter by Outcome"
            />

            {/* Follow-up Status */}
            <ModernDropdown
              value={outcomeFollowUpStatus}
              onChange={(val) => {
                setOutcomeFollowUpStatus(val);
                setOutcomePage(1);
              }}
              options={[
                { value: 'all', label: 'All Follow-up States' },
                { value: 'today', label: 'Due Today' },
                { value: 'upcoming', label: 'Upcoming Follow-up' },
                { value: 'overdue', label: 'Overdue Follow-up' },
              ]}
              placeholder="Follow-up State"
            />

            {/* Reset Filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setOutcomeTagFilter('ALL');
                setOutcomeIntentionFilter('all');
                setOutcomeFollowUpStatus('all');
                setFilterStartDate('');
                setFilterEndDate('');
                setOutcomePage(1);
              }}
              className="w-full text-xs font-semibold h-10 border-[#F0E7DE] text-stone-600 hover:bg-stone-50 rounded-xl"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search bride name, phone, notes..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#F97316] focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Dropdown */}
            <ModernDropdown
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={CONSULTATION_STATUSES}
              placeholder="Filter by Status"
            />

            {/* Type Dropdown */}
            <ModernDropdown
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setPage(1);
              }}
              options={CONSULTATION_TYPES}
              placeholder="Filter by Type"
            />

            {/* Reset Filters Action */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setTypeFilter('ALL');
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setPage(1);
                }}
                className="w-full text-xs font-semibold h-10 border-[#F0E7DE] text-stone-600 hover:bg-stone-50 rounded-xl"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 4. Main Body: List View OR Calendar View OR Recorded Outcomes Tab */}
      {viewMode === 'outcomes' ? (
        <div className="space-y-4">
          {isLoadingOutcomes ? (
            <div className="py-16">
              <LoadingSpinner text="Loading consultation outcome history..." />
            </div>
          ) : recordedOutcomes.length === 0 ? (
            <EmptyState
              icon={History}
              title="No consultation outcomes recorded yet"
              description="When bridal makeup trials are concluded and feedback is recorded, their permanent outcomes will appear here."
            />
          ) : (
            <div className="bg-white rounded-2xl border border-[#F0E7DE] shadow-2xs overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[780px]">
                  <thead>
                    <tr className="border-b border-[#F0E7DE] bg-stone-50/70 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      <th className="py-3 px-4">Client & Contact</th>
                      <th className="py-3 px-4">Outcome Category</th>
                      <th className="py-3 px-4">Agreed Package & Quote</th>
                      <th className="py-3 px-4">Intends to Book</th>
                      <th className="py-3 px-4">Follow-Up Date</th>
                      <th className="py-3 px-4">Recorded Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs">
                    {recordedOutcomes.map((item) => {
                      const clientName =
                        item.customers?.full_name ||
                        item.consultations?.requested_name ||
                        'Bride Client';
                      const clientPhone =
                        item.customers?.phone || item.consultations?.requested_phone || '—';

                      return (
                        <tr key={item.id} className="hover:bg-orange-50/20 transition-colors">
                          {/* Client */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-stone-900 block">{clientName}</span>
                            <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-stone-400" />
                              {clientPhone}
                            </span>
                          </td>

                          {/* Outcome Category */}
                          <td className="py-3.5 px-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border',
                                item.outcome_tag === 'Trial Approved & Loved Look'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : item.outcome_tag === 'Changes Requested / Minor Tweaks'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : item.outcome_tag === 'Ready to Book / Advance Invoiced'
                                  ? 'bg-orange-50 text-[#C2410C] border-orange-200'
                                  : item.outcome_tag === 'Did Not Proceed'
                                  ? 'bg-stone-100 text-stone-700 border-stone-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              )}
                            >
                              <Sparkles className="w-3 h-3" />
                              {item.outcome_tag}
                            </span>
                            {item.feedback_summary && (
                              <p className="text-[11px] text-stone-600 line-clamp-1 mt-1 max-w-xs italic">
                                "{item.feedback_summary}"
                              </p>
                            )}
                          </td>

                          {/* Agreed Package & Quote */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-stone-800 block">
                              {item.agreed_package || 'Custom Bridal Look'}
                            </span>
                            <span className="text-[11px] font-bold text-[#C2410C] mt-0.5 block">
                              {item.estimated_price_paise
                                ? `₹${(item.estimated_price_paise / 100).toLocaleString('en-IN')}`
                                : 'Quote Pending'}
                            </span>
                          </td>

                          {/* Intends to Proceed */}
                          <td className="py-3.5 px-4">
                            {item.intends_to_proceed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                Yes, Confirmed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                <HelpCircle className="w-3 h-3" />
                                Undecided
                              </span>
                            )}
                          </td>

                          {/* Follow-Up Date */}
                          <td className="py-3.5 px-4">
                            {item.follow_up_date ? (
                              <div className="flex items-center gap-1 text-stone-800 font-semibold">
                                <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
                                <span>{formatDate(item.follow_up_date)}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-stone-400">None scheduled</span>
                            )}
                          </td>

                          {/* Recorded Date */}
                          <td className="py-3.5 px-4 text-stone-500 text-[11px]">
                            {item.created_at ? formatDateTime(item.created_at) : '—'}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedOutcomeDetail(item)}
                                className="h-7 text-[11px] font-bold rounded-lg border-[#F0E7DE] hover:bg-orange-50 text-stone-700"
                              >
                                View Outcome
                              </Button>
                              {item.customer_id && (
                                <Link
                                  href={`/customers`}
                                  className="p-1.5 text-stone-400 hover:text-[#F97316] rounded-lg hover:bg-stone-100 transition-colors"
                                  title="Open Client Profile"
                                >
                                  <User className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Outcomes Pagination Footer */}
              {outcomePagination.totalPages > 1 && (
                <div className="px-4 py-3 bg-stone-50 border-t border-[#F0E7DE] flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    Page {outcomePagination.page} of {outcomePagination.totalPages} (Total{' '}
                    {outcomePagination.total} outcomes)
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={outcomePage <= 1}
                      onClick={() => setOutcomePage((p) => Math.max(1, p - 1))}
                      className="h-8 text-xs rounded-xl"
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={outcomePage >= outcomePagination.totalPages}
                      onClick={() => setOutcomePage((p) => p + 1)}
                      className="h-8 text-xs rounded-xl"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          {isLoadingList ? (
            <div className="py-16">
              <LoadingSpinner text="Loading consultations & trials..." />
            </div>
          ) : consultations.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No consultations found"
              description="Schedule a bridal makeup trial or discovery session to record client preferences and lock booking commitments."
              action={
                <Button
                  size="sm"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="bg-[#F97316] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Schedule First Trial
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {consultations.map((item) => {
                const statusConfig = STATUS_BADGE_CONFIG[item.status] || STATUS_BADGE_CONFIG.REQUESTED;
                const clientName = item.requested_name || item.customers?.full_name || 'Bride Consultation';
                const clientPhone = item.requested_phone || item.customers?.phone;
                const clientEmail = item.customers?.email;
                const startTimeFormatted = item.scheduled_start ? formatDateTime(item.scheduled_start) : 'Date TBD';
                const staffAssigned = item.users?.name || item.users?.email || 'Studio Artist';

                return (
                  <Card
                    key={item.id}
                    className="p-5 bg-white border-[#F0E7DE] rounded-2xl shadow-2xs hover:border-orange-200 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left: Consultation Info */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-stone-900 text-sm tracking-tight truncate">
                          {clientName}
                        </h3>

                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                            statusConfig.color
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dot)} />
                          {statusConfig.label}
                        </span>

                        {item.consultation_reschedules && item.consultation_reschedules.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-800 bg-orange-100/90 border border-orange-300 px-2 py-0.5 rounded-md">
                            Rescheduled Slot
                          </span>
                        )}

                        <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                          {item.consultation_type?.replace('_', ' ')}
                        </span>

                        {item.bookings && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            Booking #{item.bookings.booking_number}
                          </span>
                        )}

                        {item.enquiries && (
                          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            Enquiry Linked
                          </span>
                        )}
                      </div>

                      {/* Timings and Venue Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                          <span className="font-medium text-stone-800">{startTimeFormatted}</span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">
                            {item.location_name || item.location_address || 'Studio (In-Person)'}
                          </span>
                        </div>
                      </div>

                      {/* Client Contact Info */}
                      {(clientPhone || clientEmail) && (
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 pt-0.5">
                          {clientPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-400" />
                              {clientPhone}
                            </span>
                          )}
                          {clientEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-stone-400" />
                              {clientEmail}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Notes / Outcome preview if present */}
                      {item.notes && (() => {
                        const imageMatch = item.notes.match(
                          /(data:image\/[a-zA-Z0-9.+]+;base64,[A-Za-z0-9+/=]+|https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|svg)(?:\?[^\s"'<>]*)?)/i
                        );
                        const extractedImg = imageMatch ? imageMatch[1] : null;

                        // Separate out sections cleanly
                        const rawText = item.notes
                          .replace(
                            /(?:Reference Look \/ Inspiration Photo:\s*)?data:image\/[a-zA-Z0-9.+]+;base64,[A-Za-z0-9+/=]+/gi,
                            ''
                          )
                          .trim();

                        // Parse out tags like [Rescheduled], [OUTCOME RECORDED], [Cancelled]
                        const outcomeMatch = rawText.match(/\[OUTCOME RECORDED[^\]]*\]:?\s*([^[\n]+)/i);
                        const rescheduleMatch = rawText.match(/\[Rescheduled\]:?\s*([^[\n]+)/i);
                        const cancelMatch = rawText.match(/\[Cancelled\][^\n]*/i);

                        // Clean base text without bracket tags
                        const baseNotes = rawText
                          .replace(/\[OUTCOME RECORDED[^\]]*\][^\n]*/gi, '')
                          .replace(/\[Rescheduled\][^\n]*/gi, '')
                          .replace(/\[Cancelled\][^\n]*/gi, '')
                          .replace(/^Notes:\s*/i, '')
                          .replace(/Enquiry:\s*Public Form Submission:?/i, '')
                          .trim();

                        return (
                          <div className="mt-2.5 p-3 sm:p-3.5 bg-gradient-to-r from-stone-50/90 via-orange-50/30 to-stone-50/90 border border-[#F0E7DE] rounded-2xl shadow-2xs space-y-2.5 w-full overflow-hidden">
                            {/* Header row: badge & attached preview */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-stone-500">
                                <MessageSquareQuote className="w-3.5 h-3.5 text-[#F97316] shrink-0" />
                                <span className="font-extrabold uppercase text-[10px] tracking-wider text-stone-600">
                                  Notes & Consultation Log
                                </span>
                              </div>

                              {extractedImg && (
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-orange-100/70 border border-orange-200/80 text-[10px] font-bold text-[#C2410C]">
                                  <ImageIcon className="w-3 h-3 text-[#F97316]" />
                                  <span>Reference Photo</span>
                                </div>
                              )}
                            </div>

                            {/* Main Body: Stacked for 360px mobile responsiveness */}
                            <div className="flex flex-col min-[420px]:flex-row items-start gap-3">
                              {extractedImg && (
                                <div className="relative group shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-orange-200/90 bg-white shadow-2xs">
                                  <img
                                    src={extractedImg}
                                    alt="Reference Preview"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                </div>
                              )}

                              <div className="flex-1 min-w-0 space-y-1.5 w-full">
                                {baseNotes && (
                                  <p className="text-xs text-stone-800 font-medium leading-relaxed break-words line-clamp-3">
                                    {baseNotes}
                                  </p>
                                )}

                                {/* Tagged Badges & Chips */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  {outcomeMatch && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                      <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                      {outcomeMatch[1]?.trim() || 'Outcome Logged'}
                                    </span>
                                  )}

                                  {rescheduleMatch && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium">
                                      <Clock className="w-2.5 h-2.5 text-amber-600" />
                                      {rescheduleMatch[1]?.trim() || 'Rescheduled'}
                                    </span>
                                  )}

                                  {cancelMatch && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium">
                                      <AlertCircle className="w-2.5 h-2.5 text-rose-500" />
                                      {cancelMatch[0]?.trim()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100 shrink-0">
                      {/* WhatsApp Reminder */}
                      {clientPhone && item.status !== 'CANCELLED' && item.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => handleSendReminderWhatsApp(item)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                          title="Send WhatsApp Reminder"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* View Details */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveConsultation(item);
                          setIsDetailsModalOpen(true);
                        }}
                        className="text-xs h-9 border-[#F0E7DE] hover:bg-stone-50 text-stone-700 rounded-xl"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Details
                      </Button>

                      {/* Action based on status */}
                      {item.status !== 'COMPLETED' && item.status !== 'CANCELLED' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setActiveConsultation(item);
                              setOutcomeForm({
                                selectedTag: 'TRIAL_APPROVED',
                                summary: '',
                                agreed_services: '',
                                agreed_package: '',
                                estimated_price_rupees: '',
                                follow_up_date: '',
                                intends_to_proceed: true,
                              });
                              setIsOutcomeModalOpen(true);
                            }}
                            className="bg-[#F97316] hover:bg-[#C2410C] text-white text-xs h-9 rounded-xl font-bold"
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1" />
                            Record Outcome
                          </Button>

                          {/* Quick Actions Dropdown */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setActiveConsultation(item);
                                const d = item.scheduled_start ? new Date(item.scheduled_start) : new Date();
                                const y = d.getFullYear();
                                const m = String(d.getMonth() + 1).padStart(2, '0');
                                const day = String(d.getDate()).padStart(2, '0');
                                const hh = String(d.getHours()).padStart(2, '0');
                                const mm = String(d.getMinutes()).padStart(2, '0');
                                setRescheduleForm({
                                  scheduled_date: `${y}-${m}-${day}`,
                                  scheduled_time: `${hh}:${mm}`,
                                  duration_minutes: '60',
                                  notes: '',
                                });
                                setIsRescheduleModalOpen(true);
                              }}
                              className="text-stone-500 hover:text-stone-900 text-xs h-9 rounded-xl"
                              title="Reschedule appointment"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              Reschedule
                            </Button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveConsultation(item);
                                setCancelReason('');
                                setIsCancelModalOpen(true);
                              }}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Cancel Consultation"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}

                      {item.status === 'COMPLETED' && (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <Check className="w-3.5 h-3.5" />
                          Trial Finished
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-xs text-stone-500">
                    Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="text-xs h-8 rounded-xl"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="text-xs h-8 rounded-xl"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Schedule Consultation Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Consultation / Trial"
        size="lg"
      >
        <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Section 1: Client Information */}
          <div className="space-y-3 pb-3 border-b border-[#F0E7DE]">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#F97316]" />
              Client Details
            </h4>

            <ModernDropdown
              label="Select Existing Client"
              value={scheduleForm.customer_id}
              onChange={handleCustomerSelect}
              options={customerOptions}
              placeholder="Search or pick registered client..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">
                  Bride / Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={scheduleForm.requested_name}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({ ...prev, requested_name: e.target.value }))
                  }
                  placeholder="e.g. Priya Sundaram"
                  className={cn(
                    'w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-all',
                    scheduleErrors.requested_name ? 'border-rose-400' : 'border-[#F0E7DE]'
                  )}
                />
                {scheduleErrors.requested_name && (
                  <p className="text-xs text-rose-500 font-medium">{scheduleErrors.requested_name}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={scheduleForm.requested_phone}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({ ...prev, requested_phone: e.target.value }))
                  }
                  placeholder="e.g. 9840123456"
                  className={cn(
                    'w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-all',
                    scheduleErrors.requested_phone ? 'border-rose-400' : 'border-[#F0E7DE]'
                  )}
                />
                {scheduleErrors.requested_phone && (
                  <p className="text-xs text-rose-500 font-medium">{scheduleErrors.requested_phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Appointment Timing & Type */}
          <div className="space-y-3 pb-3 border-b border-[#F0E7DE]">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-[#F97316]" />
              Schedule & Location
            </h4>

            <div className="grid grid-cols-1 gap-3">
              <ModernDropdown
                label="Consultation Format"
                value={scheduleForm.consultation_type}
                onChange={(val) => setScheduleForm((prev) => ({ ...prev, consultation_type: val }))}
                options={FORM_CONSULTATION_TYPES}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Appointment Date <span className="text-rose-500">*</span>
                </label>
                <ModernDatePicker
                  value={scheduleForm.scheduled_date}
                  onChange={(val) => setScheduleForm((prev) => ({ ...prev, scheduled_date: val }))}
                  placeholder="Pick date..."
                  error={scheduleErrors.scheduled_date}
                />
              </div>

              <div>
                <ModernTimePicker
                  label="Start Time *"
                  value={scheduleForm.scheduled_time}
                  onChange={(val) => setScheduleForm((prev) => ({ ...prev, scheduled_time: val }))}
                  placeholder="Pick time..."
                  align="left"
                  error={scheduleErrors.scheduled_time}
                />
              </div>

              <div>
                <ModernDropdown
                  label="Duration"
                  value={scheduleForm.duration_minutes}
                  onChange={(val) => setScheduleForm((prev) => ({ ...prev, duration_minutes: val }))}
                  options={[
                    { value: '30', label: '30 Mins (Quick)' },
                    { value: '45', label: '45 Mins' },
                    { value: '60', label: '60 Mins (Standard)' },
                    { value: '90', label: '90 Mins (Demo)' },
                    { value: '120', label: '120 Mins (Trial)' },
                    { value: '180', label: '180 Mins (Full)' },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">Studio Name / Location Name</label>
                <input
                  type="text"
                  value={scheduleForm.location_name}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({ ...prev, location_name: e.target.value }))
                  }
                  placeholder="e.g. Madurai Studio - Bridal Suite A"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#F0E7DE] rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#F97316] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">Location Address</label>
                <input
                  type="text"
                  value={scheduleForm.location_address}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({ ...prev, location_address: e.target.value }))
                  }
                  placeholder="e.g. 102 Anna Nagar, Madurai"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#F0E7DE] rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#F97316] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">Virtual Meeting URL</label>
                <input
                  type="url"
                  value={scheduleForm.meeting_url}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({ ...prev, meeting_url: e.target.value }))
                  }
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#F0E7DE] rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#F97316] transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">Google Map URL</label>
                <input
                  type="url"
                  value={scheduleForm.location_map_url}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({ ...prev, location_map_url: e.target.value }))
                  }
                  placeholder="https://maps.google.com/..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#F0E7DE] rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#F97316] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Optional Linkage & Notes */}
          <div className="space-y-3 pb-3">
            <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-[#F97316]" />
              Linkage & Notes
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ModernDropdown
                label="Linked Enquiry (Optional)"
                value={scheduleForm.enquiry_id}
                onChange={(val) => setScheduleForm((prev) => ({ ...prev, enquiry_id: val }))}
                options={enquiryOptions}
              />

              <ModernDropdown
                label="Linked Booking (Optional)"
                value={scheduleForm.booking_id}
                onChange={(val) => setScheduleForm((prev) => ({ ...prev, booking_id: val }))}
                options={bookingOptions}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">Consultation Notes</label>
              <textarea
                rows={2}
                value={scheduleForm.notes}
                onChange={(e) =>
                  setScheduleForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Notes about discussion, requirements, look preview..."
                className="w-full px-3.5 py-2.5 bg-white border border-[#F0E7DE] rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#F97316] transition-all"
              />
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-[#F0E7DE]">
            <span className="text-[11px] text-stone-400">
              * Required fields: Name, Phone, Date & Time
            </span>
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={scheduleMutation.isPending}
                className="bg-[#F97316] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl px-5"
              >
                Confirm Consultation
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* 6. Record Outcome Modal */}
      <Modal
        isOpen={isOutcomeModalOpen}
        onClose={() => setIsOutcomeModalOpen(false)}
        title="Record Trial Outcome & Client Feedback"
        size="md"
      >
        <form onSubmit={handleOutcomeSubmit} className="p-6 space-y-4">
          <p className="text-xs text-stone-500">
            Log the conclusion of the consultation with{' '}
            <span className="font-bold text-stone-800">
              {activeConsultation?.requested_name || activeConsultation?.customers?.full_name}
            </span>
            . This marks the consultation as completed and updates client records.
          </p>

          {/* Quick Outcome Tags */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-stone-700">Result / Outcome Tag</label>
            <div className="grid grid-cols-2 gap-2">
              {OUTCOME_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setOutcomeForm((prev) => ({ ...prev, selectedTag: tag.label }))
                  }
                  className={cn(
                    'p-2 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                    outcomeForm.selectedTag === tag.label
                      ? 'bg-orange-50 border-[#F97316] text-[#C2410C]'
                      : 'bg-white border-[#F0E7DE] text-stone-700 hover:bg-stone-50'
                  )}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-stone-700">Look & Trial Feedback Summary</label>
            <textarea
              rows={3}
              value={outcomeForm.summary}
              onChange={(e) =>
                setOutcomeForm((prev) => ({ ...prev, summary: e.target.value }))
              }
              placeholder="e.g. Bride loved the matte eyeshadow and nude lips. Wants slightly looser curls for the muhurtham..."
              className="w-full px-3 py-2 bg-white border border-[#F0E7DE] rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#F97316]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">Agreed Package</label>
              <input
                type="text"
                value={outcomeForm.agreed_package}
                onChange={(e) =>
                  setOutcomeForm((prev) => ({ ...prev, agreed_package: e.target.value }))
                }
                placeholder="e.g. Royal Bridal Signature"
                className="w-full px-3 py-2 bg-white border border-[#F0E7DE] rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#F97316]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">Estimated Quote (₹)</label>
              <input
                type="number"
                value={outcomeForm.estimated_price_rupees}
                onChange={(e) =>
                  setOutcomeForm((prev) => ({ ...prev, estimated_price_rupees: e.target.value }))
                }
                placeholder="e.g. 35000"
                className="w-full px-3 py-2 bg-white border border-[#F0E7DE] rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#F97316]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-stone-700">Next Follow-Up Date (Optional)</label>
            <ModernDatePicker
              value={outcomeForm.follow_up_date}
              onChange={(val) => setOutcomeForm((prev) => ({ ...prev, follow_up_date: val }))}
              placeholder="Pick follow up date..."
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="intends_to_proceed"
              checked={outcomeForm.intends_to_proceed}
              onChange={(e) =>
                setOutcomeForm((prev) => ({ ...prev, intends_to_proceed: e.target.checked }))
              }
              className="w-4 h-4 text-[#F97316] rounded border-stone-300 focus:ring-[#F97316]"
            />
            <label htmlFor="intends_to_proceed" className="text-xs font-semibold text-stone-700 cursor-pointer">
              Client confirmed intention to book bridal package
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0E7DE]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOutcomeModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={outcomeMutation.isPending}
              className="bg-[#F97316] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl px-4"
            >
              Save Outcome & Mark Completed
            </Button>
          </div>
        </form>
      </Modal>

      {/* 7. Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Bridal Consultation"
        size="md"
      >
        <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4 pb-16 min-h-[440px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3 bg-orange-50/50 border border-orange-200/70 rounded-2xl flex items-start gap-2.5">
              <CalendarClock className="w-4 h-4 text-[#F97316] shrink-0 mt-0.5" />
              <div className="text-xs text-stone-600">
                Rescheduling appointment for{' '}
                <strong className="text-stone-900 font-bold">
                  {activeConsultation?.requested_name || activeConsultation?.customers?.full_name}
                </strong>
                . Checks for studio calendar conflicts automatically.
              </div>
            </div>

            {rescheduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {rescheduleError}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">New Appointment Date *</label>
              <ModernDatePicker
                value={rescheduleForm.scheduled_date}
                onChange={(val) =>
                  setRescheduleForm((prev) => ({ ...prev, scheduled_date: val }))
                }
                placeholder="Pick new date..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 relative z-20">
              <div className="relative z-30">
                <ModernTimePicker
                  label="New Start Time *"
                  value={rescheduleForm.scheduled_time}
                  onChange={(val) =>
                    setRescheduleForm((prev) => ({ ...prev, scheduled_time: val }))
                  }
                  align="left"
                />
              </div>

              <div className="relative z-20">
                <ModernDropdown
                  label="Duration"
                  value={rescheduleForm.duration_minutes}
                  onChange={(val) =>
                    setRescheduleForm((prev) => ({ ...prev, duration_minutes: val }))
                  }
                  options={[
                    { value: '30', label: '30 Mins (Quick Discovery)' },
                    { value: '45', label: '45 Mins (Skin & Look Chat)' },
                    { value: '60', label: '60 Mins (Full Look Discussion)' },
                    { value: '90', label: '90 Mins (Trial Makeup Demo)' },
                    { value: '120', label: '120 Mins (Full Makeup & Hair Trial)' },
                    { value: '180', label: '180 Mins (Complete Bridal Mockup)' },
                  ]}
                />
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              <label className="block text-xs font-bold text-stone-700">Reason / Reschedule Note</label>
              <input
                type="text"
                value={rescheduleForm.notes}
                onChange={(e) =>
                  setRescheduleForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="e.g. Bride requested evening slot due to office schedule"
                className="w-full px-3.5 py-2.5 bg-white border border-[#F0E7DE] rounded-xl text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0E7DE] relative z-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRescheduleModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={rescheduleMutation.isPending}
              className="bg-[#F97316] hover:bg-[#C2410C] text-white text-xs font-bold rounded-xl px-5"
            >
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* 8. Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Consultation Appointment"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-xs text-stone-600">
            Are you sure you want to cancel the consultation for{' '}
            <span className="font-bold text-stone-900">
              {activeConsultation?.requested_name || activeConsultation?.customers?.full_name}
            </span>
            ?
          </p>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-stone-700">Reason for Cancellation</label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Client requested cancellation or no longer required"
              className="w-full px-3 py-2 bg-white border border-[#F0E7DE] rounded-xl text-xs text-stone-800 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Keep Appointment
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={cancelMutation.isPending}
              onClick={handleConfirmCancel}
              className="text-xs font-bold rounded-xl"
            >
              Yes, Cancel Appointment
            </Button>
          </div>
        </div>
      </Modal>

      {/* 9. Full Details Drawer / Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Consultation & Bridal Trial Details"
        size="lg"
      >
        {activeConsultation && (
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Header snippet */}
            <div className="flex items-start justify-between pb-4 border-b border-[#F0E7DE]">
              <div>
                <h3 className="text-lg font-black text-stone-900">
                  {activeConsultation.requested_name || activeConsultation.customers?.full_name || 'Bride Consultation'}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                  <span>Type: <strong className="text-stone-800">{activeConsultation.consultation_type}</strong></span>
                  <span>•</span>
                  <span>Scheduled: <strong className="text-stone-800">{activeConsultation.scheduled_start ? formatDateTime(activeConsultation.scheduled_start) : 'TBD'}</strong></span>
                </div>
              </div>

              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold border',
                  STATUS_BADGE_CONFIG[activeConsultation.status]?.color || 'bg-stone-100 text-stone-700'
                )}
              >
                {activeConsultation.status}
              </span>
            </div>

            {/* Contact & Location Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50/60 p-4 rounded-2xl border border-stone-200/80">
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider block">Contact Information</span>
                <p className="text-stone-800">Phone: <strong className="text-stone-900">{activeConsultation.requested_phone || activeConsultation.customers?.phone || 'Not provided'}</strong></p>
                <p className="text-stone-800">Email: <strong className="text-stone-900">{activeConsultation.customers?.email || 'Not provided'}</strong></p>
              </div>

              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider block">Location & Format</span>
                <p className="text-stone-800">Venue: <strong className="text-stone-900">{activeConsultation.location_name || 'Studio'}</strong></p>
                {activeConsultation.location_address && (
                  <p className="text-stone-600">{activeConsultation.location_address}</p>
                )}
                {activeConsultation.meeting_url && (
                  <a
                    href={activeConsultation.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#F97316] font-bold underline"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Open Video Meeting
                  </a>
                )}
              </div>
            </div>

            {/* Notes & Log History with Modern Image Preview */}
            {activeConsultation.notes && (() => {
              // Extract embedded base64 image or image URLs if present in notes
              const imageMatch = activeConsultation.notes.match(/(data:image\/[a-zA-Z0-9.+]+;base64,[A-Za-z0-9+/=]+|https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|svg)(?:\?[^\s"'<>]*)?)/i);
              const extractedImg = imageMatch ? imageMatch[1] : null;
              
              // Clean text notes to remove raw base64 string
              const cleanNotes = activeConsultation.notes
                .replace(/(?:Reference Look \/ Inspiration Photo:\s*)?data:image\/[a-zA-Z0-9.+]+;base64,[A-Za-z0-9+/=]+/gi, '')
                .trim();

              return (
                <div className="space-y-3">
                  <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider block">
                    Consultation Notes & Requirements
                  </span>

                  {/* Render Visual Image Card if reference photo is present */}
                  {extractedImg && (
                    <div className="bg-[#FFFDF9] border border-[#F0E7DE] rounded-2xl p-3 sm:p-4">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <ImageIcon className="w-4 h-4 text-[#F97316]" />
                        <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider">
                          Attached Reference / Inspiration Photo
                        </h4>
                      </div>
                      <div className="flex flex-col min-[380px]:flex-row items-start sm:items-center gap-3 bg-white p-2.5 rounded-xl border border-stone-200/70">
                        <div className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-50 w-full min-[380px]:w-32 h-32 shrink-0 shadow-2xs">
                          <img
                            src={extractedImg}
                            alt="Reference Look"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <span className="text-xs font-bold text-stone-900">Bride Reference Look</span>
                          <p className="text-[11px] text-stone-500 leading-snug">
                            Uploaded during enquiry submission for makeup & styling inspiration.
                          </p>
                          <div className="pt-1">
                            <a
                              href={extractedImg}
                              target="_blank"
                              rel="noreferrer"
                              download="reference-look"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#C2410C] font-bold text-xs rounded-xl transition-colors cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>View / Full Size</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Text Notes Body */}
                  {cleanNotes && (
                    <div className="p-3.5 sm:p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 whitespace-pre-wrap leading-relaxed break-words">
                      {cleanNotes}
                    </div>
                  )}
                </div>
              );
            })()}

              {/* Consultation Rescheduling History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-[#F97316]" />
                    Rescheduling History
                  </h4>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {detailedConsultation?.consultation_reschedules?.length || 0} reschedule{detailedConsultation?.consultation_reschedules?.length === 1 ? '' : 's'} recorded
                  </span>
                </div>

                {detailedConsultation?.consultation_reschedules && detailedConsultation.consultation_reschedules.length > 0 ? (
                  <div className="space-y-2">
                    {detailedConsultation.consultation_reschedules.map((entry, idx) => (
                      <div
                        key={entry.id || idx}
                        className="p-3 bg-stone-50/80 border border-stone-200/80 rounded-xl space-y-1.5 text-xs text-stone-700"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className="font-bold text-stone-900">
                            Rescheduled #{detailedConsultation.consultation_reschedules.length - idx}
                          </span>
                          <span className="text-[10px] text-stone-500">
                            {formatDateTime(entry.created_at)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                          <div className="text-stone-500">
                            <span className="block font-medium text-stone-400">Previous Slot:</span>
                            <span className="text-stone-700 line-through">
                              {entry.previous_start ? formatDateTime(entry.previous_start) : 'None'}
                            </span>
                          </div>
                          <div className="text-stone-800">
                            <span className="block font-medium text-[#C2410C]">New Slot:</span>
                            <span className="font-bold text-stone-900">
                              {entry.new_start ? formatDateTime(entry.new_start) : 'TBD'}
                            </span>
                          </div>
                        </div>

                        {entry.reason && (
                          <div className="text-[11px] text-stone-600 pt-0.5">
                            <span className="font-medium text-stone-500">Reason: </span>
                            {entry.reason}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-[10px] text-stone-500">
                          <span>
                            Changed by: <strong className="text-stone-700">{entry.users?.name || 'Studio Staff'}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold">
                            WhatsApp Alert:
                            <span
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
                                entry.whatsapp_status === 'DELIVERED' || entry.whatsapp_status === 'SENT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : entry.whatsapp_status === 'FAILED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              )}
                            >
                              {entry.whatsapp_status || 'QUEUED'}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-stone-50 border border-dashed border-stone-200 rounded-xl text-center text-xs text-stone-500">
                    No rescheduling history recorded for this consultation.
                  </div>
                )}
              </div>

              {/* WhatsApp Messages & Delivery Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                    WhatsApp Messages & Delivery
                  </h4>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => refetchConsultationDetail()}
                    className="text-stone-500 hover:text-stone-800 text-[11px] h-7 px-2"
                    title="Refresh message statuses"
                  >
                    <RefreshCw className={cn('w-3 h-3 mr-1', isLoadingConsultationDetail && 'animate-spin')} />
                    Refresh Status
                  </Button>
                </div>

                {detailedConsultation?.notification_jobs && detailedConsultation.notification_jobs.length > 0 ? (
                  <div className="space-y-2">
                    {detailedConsultation.notification_jobs.map((job) => {
                      const rawPhone = String(job.recipient || '');
                      const maskedPhone =
                        rawPhone.length > 5
                          ? `${rawPhone.slice(0, 5)}***${rawPhone.slice(-2)}`
                          : rawPhone;

                      const isFailed = job.status === 'FAILED';
                      const isDelivered = job.status === 'DELIVERED';
                      const isSent = job.status === 'SENT';
                      const isQueued = job.status === 'QUEUED';
                      const isCancelled = job.status === 'CANCELLED';

                      return (
                        <div
                          key={job.id}
                          className="p-3 bg-stone-50/80 border border-stone-200/80 rounded-xl space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-stone-900">{job.subject || 'Consultation Message'}</span>
                              <span className="text-[10px] text-stone-400">({job.channel})</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1',
                                  isDelivered || isSent
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isFailed
                                    ? 'bg-rose-100 text-rose-800'
                                    : isCancelled
                                    ? 'bg-stone-200 text-stone-600'
                                    : 'bg-amber-100 text-amber-800'
                                )}
                              >
                                {isDelivered || isSent ? (
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                ) : isFailed ? (
                                  <AlertCircle className="w-2.5 h-2.5" />
                                ) : (
                                  <Clock className="w-2.5 h-2.5" />
                                )}
                                {job.status}
                              </span>

                              {isFailed && (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => retryMessageMutation.mutate(job.id)}
                                  disabled={retryingJobId === job.id}
                                  className="h-6 px-2 text-[10px] font-bold border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg"
                                >
                                  <RefreshCw
                                    className={cn('w-2.5 h-2.5 mr-1', retryingJobId === job.id && 'animate-spin')}
                                  />
                                  Retry Send
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-stone-600 pt-0.5">
                            <div>
                              <span className="font-medium text-stone-400">Recipient: </span>
                              <strong className="text-stone-800">{maskedPhone}</strong>
                            </div>
                            <div>
                              <span className="font-medium text-stone-400">Template: </span>
                              <span className="font-mono text-[10px] bg-stone-200/70 px-1 rounded text-stone-800">
                                {job.template_name || 'Standard Message'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-200/60">
                            <span>
                              Scheduled: {job.scheduled_at ? formatDateTime(job.scheduled_at) : 'Immediate'}
                            </span>
                            {job.sent_at && <span>Sent: {formatDateTime(job.sent_at)}</span>}
                          </div>

                          {job.error_message && (
                            <div className="p-2 bg-rose-50/70 border border-rose-200/60 rounded-lg text-[10px] text-rose-700">
                              <span className="font-bold">Error: </span>
                              {job.error_message}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-stone-50 border border-dashed border-stone-200 rounded-xl text-center text-xs text-stone-500">
                    No WhatsApp reminders or notifications dispatched yet for this consultation.
                  </div>
                )}
              </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#F0E7DE]">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsDetailsModalOpen(false)}
                className="w-full sm:w-auto text-xs rounded-xl"
              >
                Close Details
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 10. Complete Outcome Record Detail Modal */}
      {selectedOutcomeDetail && (
        <Modal
          isOpen={!!selectedOutcomeDetail}
          onClose={() => setSelectedOutcomeDetail(null)}
          title="Recorded Outcome & Client Trial Feedback"
          size="md"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#F0E7DE]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-[#F97316] shrink-0 font-black">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base">
                    {selectedOutcomeDetail.customers?.full_name ||
                      selectedOutcomeDetail.consultations?.requested_name ||
                      'Bride Client'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>
                      {selectedOutcomeDetail.customers?.phone ||
                        selectedOutcomeDetail.consultations?.requested_phone ||
                        '—'}
                    </span>
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#C2410C] border border-orange-200">
                <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                {selectedOutcomeDetail.outcome_tag}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Feedback Summary Card */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div className="flex items-center gap-1.5 text-stone-500 mb-1.5">
                  <MessageSquareQuote className="w-3.5 h-3.5 text-[#F97316]" />
                  <span className="font-bold uppercase text-[10px] tracking-wider">
                    Look & Trial Feedback Summary
                  </span>
                </div>
                <p className="text-stone-800 whitespace-pre-wrap leading-relaxed pl-5">
                  {selectedOutcomeDetail.feedback_summary || 'No feedback notes provided.'}
                </p>
              </div>

              {/* Package & Quote Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-orange-100/70 text-[#F97316] shrink-0 mt-0.5">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider block">
                      Agreed Package
                    </span>
                    <span className="font-bold text-stone-900 mt-0.5 block">
                      {selectedOutcomeDetail.agreed_package || 'Custom Bridal Look'}
                    </span>
                  </div>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-100/80 text-emerald-700 shrink-0 mt-0.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider block">
                      Estimated Price
                    </span>
                    <span className="font-bold text-[#C2410C] mt-0.5 block">
                      {selectedOutcomeDetail.estimated_price_paise
                        ? `₹${(selectedOutcomeDetail.estimated_price_paise / 100).toLocaleString('en-IN')}`
                        : 'Quote Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Intention & Follow-up Date Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-start gap-2.5">
                  <div className={cn(
                    "p-1.5 rounded-lg shrink-0 mt-0.5",
                    selectedOutcomeDetail.intends_to_proceed ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600"
                  )}>
                    {selectedOutcomeDetail.intends_to_proceed ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <HelpCircle className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider block">
                      Booking Intention
                    </span>
                    <span className="font-bold text-stone-900 mt-0.5 block">
                      {selectedOutcomeDetail.intends_to_proceed ? 'Intends to proceed' : 'Undecided'}
                    </span>
                  </div>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-100 text-purple-700 shrink-0 mt-0.5">
                    <CalendarCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider block">
                      Next Follow-Up Date
                    </span>
                    <span className="font-bold text-stone-900 mt-0.5 block">
                      {selectedOutcomeDetail.follow_up_date
                        ? formatDate(selectedOutcomeDetail.follow_up_date)
                        : 'None scheduled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Consultation Context & Client Links */}
              {selectedOutcomeDetail.consultations && (
                <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-3.5 h-3.5 text-[#F97316]" />
                    <span className="text-[11px] text-stone-600">
                      Linked Consultation: <strong className="text-stone-800">{selectedOutcomeDetail.consultations.consultation_type}</strong> ({selectedOutcomeDetail.consultations.scheduled_start ? formatDateTime(selectedOutcomeDetail.consultations.scheduled_start) : 'N/A'})
                    </span>
                  </div>

                  {selectedOutcomeDetail.customer_id && (
                    <Link
                      href={`/customers`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F97316] hover:underline"
                    >
                      <span>Client Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )}

              <div className="text-[11px] text-stone-400 pt-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Recorded: {formatDateTime(selectedOutcomeDetail.created_at)}
                </span>
                {selectedOutcomeDetail.users?.name && (
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    By: {selectedOutcomeDetail.users.name}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0E7DE] flex items-center justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedOutcomeDetail(null)}
                className="text-xs rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 11. Bridal Booking Quick Detail Modal (from Calendar View) */}
      {selectedBookingDetail && (
        <Modal
          isOpen={!!selectedBookingDetail}
          onClose={() => setSelectedBookingDetail(null)}
          title="Bridal Booking Event Details"
          size="md"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#F0E7DE]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base">
                    {selectedBookingDetail.customerName || 'Bridal Client'}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{selectedBookingDetail.customerPhone || 'Not provided'}</span>
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                {selectedBookingDetail.status || 'CONFIRMED'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider block">
                    Event Type
                  </span>
                  <span className="font-extrabold text-stone-900 mt-0.5 block">
                    💍 {selectedBookingDetail.event_kind || 'WEDDING'}
                  </span>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider block">
                    Event Date
                  </span>
                  <span className="font-extrabold text-stone-900 mt-0.5 block">
                    📅 {selectedBookingDetail.eventDate ? formatDate(selectedBookingDetail.eventDate) : 'Date TBD'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider block">
                    Package Snapshot
                  </span>
                  <span className="font-bold text-stone-800 mt-0.5 block">
                    {selectedBookingDetail.package_name || 'Bridal Makeover Package'}
                  </span>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="font-bold text-stone-400 uppercase text-[10px] tracking-wider block">
                    Venue / City
                  </span>
                  <span className="font-bold text-stone-800 mt-0.5 block">
                    📍 {selectedBookingDetail.venue || 'Studio / Customer Venue'}
                  </span>
                </div>
              </div>

              {selectedBookingDetail.bookingNumber && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-900">
                      Booking #{selectedBookingDetail.bookingNumber}
                    </span>
                  </div>

                  <Link
                    href={`/bookings`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:underline"
                  >
                    <span>View Booking</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#F0E7DE] flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedBookingDetail(null)}
                className="text-xs rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
