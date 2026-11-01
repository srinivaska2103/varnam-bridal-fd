'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  Edit,
  Ban,
  RefreshCw,
  LayoutGrid,
  List,
  Building,
  Check,
  Package,
  RotateCcw,
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
} from '@/components/ui';
import { useModalAlert } from '@/components/ui/ModalAlert';
import {
  bookingApi,
  customerApi,
  packageApi,
  paymentApi,
} from '@/services/api/modules';
import { formatDate, formatINR } from '@/utils/formatters';

// Canonical status configurations
const STATUS_CONFIG = {
  CONFIRMED: {
    label: 'Confirmed',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    variant: 'success',
  },
  PLANNING: {
    label: 'Planning',
    color: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500',
    variant: 'info',
  },
  READY: {
    label: 'Ready',
    color: 'bg-teal-50 text-teal-700 border-teal-200/80',
    dot: 'bg-teal-500',
    variant: 'success',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dot: 'bg-purple-500',
    variant: 'warning',
  },
  DRAFT: {
    label: 'Draft',
    color: 'bg-stone-50 text-stone-700 border-stone-200/80',
    dot: 'bg-stone-400',
    variant: 'default',
  },
  POSTPONED: {
    label: 'Postponed',
    color: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
    variant: 'warning',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-stone-100 text-stone-800 border-stone-300',
    dot: 'bg-stone-600',
    variant: 'default',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500',
    variant: 'danger',
  },
};

const EVENT_KINDS = [
  { value: 'WEDDING', label: 'Wedding / Muhurtham' },
  { value: 'RECEPTION', label: 'Reception' },
  { value: 'ENGAGEMENT', label: 'Engagement / Nichayathartham' },
  { value: 'SANGEET', label: 'Sangeet' },
  { value: 'MEHENDI', label: 'Mehendi' },
  { value: 'HALDI', label: 'Haldi' },
  { value: 'TRIAL', label: 'Bridal Trial' },
  { value: 'OTHER', label: 'Other Ceremony' },
];

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useModalAlert();

  // View state: 'list' | 'calendar'
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [eventKindFilter, setEventKindFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState(''); // 'all' | 'fully_paid' | 'partial' | 'unpaid'
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'all' | 'upcoming' | 'past' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modals
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [isEditBookingModalOpen, setIsEditBookingModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);


  // 1. Fetch Summary Stats
  const {
    data: statsData,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['booking-stats'],
    queryFn: async () => {
      const res = await bookingApi.getStats();
      return res.data;
    },
  });

  // Calculate actual query params for list
  const queryParams = useMemo(() => {
    const params = {};
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (statusFilter) params.status = statusFilter;
    if (eventKindFilter) params.event_kind = eventKindFilter;

    const todayStr = new Date().toISOString().split('T')[0];
    if (dateRangeFilter === 'upcoming') {
      params.startDate = todayStr;
    } else if (dateRangeFilter === 'past') {
      params.endDate = todayStr;
    } else if (dateRangeFilter === 'custom') {
      if (customStartDate) params.startDate = customStartDate;
      if (customEndDate) params.endDate = customEndDate;
    }
    return params;
  }, [searchTerm, statusFilter, eventKindFilter, dateRangeFilter, customStartDate, customEndDate]);

  // 2. Fetch Bookings List
  const {
    data: bookingsResponse,
    isLoading: isLoadingList,
    isError: isErrorList,
    refetch: refetchBookings,
    isFetching: isFetchingList,
  } = useQuery({
    queryKey: ['bookings', queryParams],
    queryFn: async () => {
      const res = await bookingApi.list(queryParams);
      return res.data;
    },
  });

  const rawBookings = bookingsResponse?.bookings || [];

  // Filter client-side for payment status if needed
  const filteredBookings = useMemo(() => {
    if (!paymentFilter) return rawBookings;
    return rawBookings.filter((b) => {
      if (paymentFilter === 'fully_paid') return b.is_fully_paid;
      if (paymentFilter === 'partial') return b.total_paid_paise > 0 && !b.is_fully_paid;
      if (paymentFilter === 'unpaid') return b.total_paid_paise === 0;
      return true;
    });
  }, [rawBookings, paymentFilter]);


  // 4. Booking Details Query
  const {
    data: selectedBookingDetail,
    isLoading: isLoadingDetail,
    refetch: refetchSelectedBooking,
  } = useQuery({
    queryKey: ['booking-detail', selectedBookingId],
    queryFn: async () => {
      if (!selectedBookingId) return null;
      const res = await bookingApi.getById(selectedBookingId);
      return res.data;
    },
    enabled: !!selectedBookingId,
  });

  // 4b. Refund Eligibility Query for cancelled booking in detail panel
  const {
    data: bookingRefundEligibilityData,
    isLoading: isLoadingBookingRefundEligibility,
  } = useQuery({
    queryKey: ['booking-refund-eligibility', selectedBookingId],
    queryFn: async () => {
      const res = await paymentApi.getRefundEligibility(selectedBookingId);
      const raw = res.data;
      if (!raw) return null;
      const fs = raw.financial_summary || {};
      return {
        ...raw,
        original_booking_total_paise: fs.original_booking_total_paise ?? raw.total_amount_paise ?? 0,
        total_payments_received_paise: fs.total_payments_received_paise ?? raw.total_paid_paise ?? 0,
        previous_completed_refunds_paise: fs.previous_completed_refunds_paise ?? raw.total_refunded_paise ?? 0,
        previous_pending_refunds_paise: fs.previous_pending_refunds_paise ?? 0,
        approved_refundable_amount_paise: fs.approved_refundable_amount_paise ?? raw.approved_refundable_paise ?? 0,
        remaining_refund_balance_paise: fs.remaining_refund_balance_paise ?? raw.remaining_refund_paise ?? 0,
        net_payable_paise: fs.net_payable_paise ?? raw.net_payable_paise ?? (fs.original_booking_total_paise ?? raw.total_amount_paise ?? 0),
        outstanding_due_paise: Math.max(0, (fs.net_payable_paise ?? raw.net_payable_paise ?? (fs.original_booking_total_paise ?? raw.total_amount_paise ?? 0)) - (fs.total_payments_received_paise ?? raw.total_paid_paise ?? 0)),
        total_paid_paise: fs.total_payments_received_paise ?? raw.total_paid_paise ?? 0,
        approved_refundable_paise: fs.approved_refundable_amount_paise ?? raw.approved_refundable_paise ?? 0,
        total_refunded_paise: fs.previous_completed_refunds_paise ?? raw.total_refunded_paise ?? 0,
        remaining_refund_paise: fs.remaining_refund_balance_paise ?? raw.remaining_refund_paise ?? 0,
      };
    },
    enabled: !!selectedBookingId && selectedBookingDetail?.status === 'CANCELLED',
  });
  const bookingRefundEligibility = bookingRefundEligibilityData || null;

  // 5. Fetch Customers (for Booking Creation)
  const { data: customersData } = useQuery({
    queryKey: ['customers-for-booking'],
    queryFn: async () => {
      const res = await customerApi.list({ limit: 100 });
      return res.data?.customers || [];
    },
    enabled: isNewBookingModalOpen,
  });

  // 6. Fetch Packages (for Booking Creation/Edit)
  const { data: packagesData } = useQuery({
    queryKey: ['packages-for-booking'],
    queryFn: async () => {
      const res = await packageApi.list();
      return res.data?.packages || [];
    },
    enabled: isNewBookingModalOpen || isEditBookingModalOpen,
  });

  // Form states for New Booking
  const [newBookingForm, setNewBookingForm] = useState({
    customer_id: '',
    package_id: '',
    status: 'CONFIRMED',
    total_amount_rupees: '',
    discount_rupees: '0',
    notes: '',
    // Initial Event
    has_event: true,
    event_kind: 'WEDDING',
    event_title: '',
    event_date: '',
    start_time: '06:00',
    end_time: '12:00',
    venue: '',
    city: '',
    instructions: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Form state for Edit Booking
  const [editBookingForm, setEditBookingForm] = useState({
    package_id: '',
    total_amount_rupees: '',
    discount_rupees: '0',
    notes: '',
  });

  // Form state for Add Event to existing booking
  const [addEventForm, setAddEventForm] = useState({
    event_kind: 'RECEPTION',
    title: '',
    event_date: '',
    start_time: '18:00',
    end_time: '22:00',
    venue: '',
    city: '',
    instructions: '',
  });

  // Form state for Record Payment
  const [recordPaymentForm, setRecordPaymentForm] = useState({
    amount_rupees: '',
    method: 'UPI',
    reference_note: '',
    notes: '',
  });

  // Form state for Cancellation
  const [cancellationReason, setCancellationReason] = useState('');

  // MUTATIONS
  // Create Booking Mutation
  const createBookingMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await bookingApi.create(payload);
      return res.data;
    },
    onSuccess: (newBooking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['booking-calendar'] });
      setIsNewBookingModalOpen(false);
      showAlert({
        title: 'Booking Created',
        message: `Booking ${newBooking.booking_number} created successfully.`,
        type: 'success',
      });
      setSelectedBookingId(newBooking.id);
    },
    onError: (err) => {
      showAlert({
        title: 'Failed to Create Booking',
        message: err.response?.data?.message || err.message || 'An error occurred while creating booking.',
        type: 'error',
      });
    },
  });

  // Update Booking Mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await bookingApi.update(id, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail', selectedBookingId] });
      setIsEditBookingModalOpen(false);
      showAlert({
        title: 'Booking Updated',
        message: 'Booking details updated successfully.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Update Failed',
        message: err.response?.data?.message || err.message || 'Could not update booking.',
        type: 'error',
      });
    },
  });

  // Add Event Mutation
  const addEventMutation = useMutation({
    mutationFn: async ({ bookingId, eventData }) => {
      const res = await bookingApi.addEvent(bookingId, eventData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['booking-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail', selectedBookingId] });
      setIsAddEventModalOpen(false);
      showAlert({
        title: 'Ceremony Event Added',
        message: 'New ceremony schedule was attached to the booking.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Could Not Add Event',
        message: err.response?.data?.message || err.message || 'Event schedule error.',
        type: 'error',
      });
    },
  });

  // Record Payment Mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await paymentApi.create(payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail', selectedBookingId] });
      setIsRecordPaymentModalOpen(false);
      showAlert({
        title: 'Payment Recorded',
        message: 'Payment was successfully credited to this booking.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Payment Recording Failed',
        message: err.response?.data?.message || err.message || 'Could not record payment.',
        type: 'error',
      });
    },
  });

  // Cancel Booking Mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const res = await bookingApi.cancel(id, { cancellation_reason: reason });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['booking-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail', selectedBookingId] });
      setIsCancelModalOpen(false);
      showAlert({
        title: 'Booking Cancelled',
        message: 'The booking was marked as cancelled with reason recorded.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Cancellation Failed',
        message: err.response?.data?.message || err.message || 'Could not cancel booking.',
        type: 'error',
      });
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await bookingApi.updateStatus(id, { status });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail', selectedBookingId] });
      showAlert({
        title: 'Status Updated',
        message: `Booking moved to status: ${data.status}`,
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Status Update Failed',
        message: err.response?.data?.message || 'Could not change booking status.',
        type: 'error',
      });
    },
  });

  // Handlers
  const handleOpenNewBooking = () => {
    setNewBookingForm({
      customer_id: '',
      package_id: '',
      status: 'CONFIRMED',
      total_amount_rupees: '',
      discount_rupees: '0',
      notes: '',
      has_event: true,
      event_kind: 'WEDDING',
      event_title: '',
      event_date: '',
      start_time: '06:00',
      end_time: '12:00',
      venue: '',
      city: '',
      instructions: '',
    });
    setFormErrors({});
    setIsNewBookingModalOpen(true);
  };

  const handlePackageSelectInNewBooking = (pkgId) => {
    const pkg = (packagesData || []).find((p) => p.id === pkgId);
    if (pkg) {
      setNewBookingForm((prev) => ({
        ...prev,
        package_id: pkg.id,
        total_amount_rupees: (Number(pkg.price_paise) / 100).toString(),
      }));
    } else {
      setNewBookingForm((prev) => ({
        ...prev,
        package_id: '',
      }));
    }
  };

  const handlePackageSelectInEditBooking = (pkgId) => {
    const pkg = (packagesData || []).find((p) => p.id === pkgId);
    if (pkg) {
      setEditBookingForm((prev) => ({
        ...prev,
        package_id: pkg.id,
        total_amount_rupees: (Number(pkg.price_paise) / 100).toString(),
      }));
    } else {
      setEditBookingForm((prev) => ({
        ...prev,
        package_id: '',
      }));
    }
  };

  const handleCreateBookingSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!newBookingForm.customer_id) errors.customer_id = 'Please select a customer';
    const totalPaise = Math.round(Number(newBookingForm.total_amount_rupees || 0) * 100);
    const discountPaise = Math.round(Number(newBookingForm.discount_rupees || 0) * 100);

    if (totalPaise < 0) errors.total_amount_rupees = 'Total amount cannot be negative';

    if (newBookingForm.has_event) {
      if (!newBookingForm.event_date) errors.event_date = 'Event date is required';
      if (!newBookingForm.event_kind) errors.event_kind = 'Event kind is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      customer_id: newBookingForm.customer_id,
      package_id: newBookingForm.package_id || null,
      status: newBookingForm.status,
      total_amount_paise: totalPaise,
      discount_paise: discountPaise,
      notes: newBookingForm.notes || null,
    };

    if (newBookingForm.has_event && newBookingForm.event_date) {
      payload.event = {
        event_kind: newBookingForm.event_kind,
        title: newBookingForm.event_title || `${newBookingForm.event_kind} Makeover`,
        event_date: newBookingForm.event_date,
        start_time: newBookingForm.start_time ? `${newBookingForm.start_time}:00` : null,
        end_time: newBookingForm.end_time ? `${newBookingForm.end_time}:00` : null,
        venue: newBookingForm.venue || null,
        city: newBookingForm.city || null,
        instructions: newBookingForm.instructions || null,
      };
    }

    createBookingMutation.mutate(payload);
  };

  const handleOpenEditBooking = (booking) => {
    setEditBookingForm({
      package_id: booking.package_id || '',
      total_amount_rupees: (Number(booking.total_amount_paise) / 100).toString(),
      discount_rupees: (Number(booking.discount_paise) / 100).toString(),
      notes: booking.notes || '',
    });
    setIsEditBookingModalOpen(true);
  };

  const handleEditBookingSubmit = (e) => {
    e.preventDefault();
    if (!selectedBookingId) return;

    const totalPaise = Math.round(Number(editBookingForm.total_amount_rupees || 0) * 100);
    const discountPaise = Math.round(Number(editBookingForm.discount_rupees || 0) * 100);

    const payload = {
      package_id: editBookingForm.package_id || null,
      total_amount_paise: totalPaise,
      discount_paise: discountPaise,
      notes: editBookingForm.notes || null,
    };

    updateBookingMutation.mutate({ id: selectedBookingId, payload });
  };

  const handleAddEventSubmit = (e) => {
    e.preventDefault();
    if (!selectedBookingId) return;
    if (!addEventForm.event_date) {
      showAlert({ title: 'Validation Error', message: 'Event date is required.', type: 'warning' });
      return;
    }

    const payload = {
      event_kind: addEventForm.event_kind,
      title: addEventForm.title || `${addEventForm.event_kind} Event`,
      event_date: addEventForm.event_date,
      start_time: addEventForm.start_time ? `${addEventForm.start_time}:00` : null,
      end_time: addEventForm.end_time ? `${addEventForm.end_time}:00` : null,
      venue: addEventForm.venue || null,
      city: addEventForm.city || null,
      instructions: addEventForm.instructions || null,
    };

    addEventMutation.mutate({ bookingId: selectedBookingId, eventData: payload });
  };

  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedBookingId) return;

    const amountPaise = Math.round(Number(recordPaymentForm.amount_rupees || 0) * 100);
    if (amountPaise <= 0) {
      showAlert({ title: 'Validation Error', message: 'Please enter a valid payment amount.', type: 'warning' });
      return;
    }

    const payload = {
      booking_id: selectedBookingId,
      amount_paise: amountPaise,
      method: recordPaymentForm.method,
      reference_note: recordPaymentForm.reference_note || null,
      notes: recordPaymentForm.notes || null,
    };

    recordPaymentMutation.mutate(payload);
  };

  const handleCancelBookingSubmit = (e) => {
    e.preventDefault();
    if (!selectedBookingId) return;
    if (!cancellationReason.trim()) {
      showAlert({ title: 'Validation Error', message: 'Cancellation reason is required.', type: 'warning' });
      return;
    }
    cancelBookingMutation.mutate({ id: selectedBookingId, reason: cancellationReason });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setEventKindFilter('');
    setPaymentFilter('');
    setDateRangeFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const hasActiveFilters = Boolean(
    searchTerm || statusFilter || eventKindFilter || paymentFilter || dateRangeFilter !== 'all'
  );


  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Bookings & Bridal Orders"
        subtitle="Manage bridal bookings, wedding packages, and payment balances."
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenNewBooking}
              className="bg-[#F97316] hover:bg-[#ea580c] text-white shadow-sm"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Booking
            </Button>
          </div>
        }
      />

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Total Bookings */}
        <Card className="p-4 border-[#F0E7DE] hover:border-orange-300 transition-colors">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Bookings</div>
          {isLoadingStats ? (
            <div className="h-7 w-16 bg-stone-200 animate-pulse rounded mt-2" />
          ) : (
            <div className="text-2xl font-black text-[#292524] mt-1.5">
              {statsData?.total_bookings ?? 0}
            </div>
          )}
          <div className="text-[11px] text-stone-400 mt-0.5">Active bridal orders</div>
        </Card>

        {/* Metric 2: Upcoming Weddings */}
        <Card className="p-4 border-[#F0E7DE] hover:border-orange-300 transition-colors">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Upcoming Weddings</div>
          {isLoadingStats ? (
            <div className="h-7 w-16 bg-stone-200 animate-pulse rounded mt-2" />
          ) : (
            <div className="text-2xl font-black text-[#F97316] mt-1.5">
              {statsData?.upcoming_weddings ?? 0}
            </div>
          )}
          <div className="text-[11px] text-stone-400 mt-0.5">Scheduled ceremonies</div>
        </Card>

        {/* Metric 3: Confirmed Bookings */}
        <Card className="p-4 border-[#F0E7DE] hover:border-orange-300 transition-colors">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Confirmed</div>
          {isLoadingStats ? (
            <div className="h-7 w-16 bg-stone-200 animate-pulse rounded mt-2" />
          ) : (
            <div className="text-2xl font-black text-emerald-600 mt-1.5">
              {statsData?.confirmed_bookings ?? 0}
            </div>
          )}
          <div className="text-[11px] text-stone-400 mt-0.5">Ready for service</div>
        </Card>

        {/* Metric 4: Pending / Planning */}
        <Card className="p-4 border-[#F0E7DE] hover:border-orange-300 transition-colors">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Draft / Pending</div>
          {isLoadingStats ? (
            <div className="h-7 w-16 bg-stone-200 animate-pulse rounded mt-2" />
          ) : (
            <div className="text-2xl font-black text-amber-600 mt-1.5">
              {statsData?.pending_bookings ?? 0}
            </div>
          )}
          <div className="text-[11px] text-stone-400 mt-0.5">Awaiting confirmation</div>
        </Card>

        {/* Metric 5: Outstanding Balance */}
        <Card className="p-4 col-span-2 lg:col-span-1 border-[#F0E7DE] bg-orange-50/30 hover:border-orange-300 transition-colors">
          <div className="text-xs font-semibold text-orange-900 uppercase tracking-wider">Outstanding Payments</div>
          {isLoadingStats ? (
            <div className="h-7 w-24 bg-stone-200 animate-pulse rounded mt-2" />
          ) : (
            <div className="text-2xl font-black text-rose-600 mt-1.5">
              {formatINR(statsData?.total_outstanding_paise ?? 0)}
            </div>
          )}
          <div className="text-[11px] text-stone-500 mt-0.5">
            Collected: {formatINR(statsData?.total_paid_paise ?? 0)}
          </div>
        </Card>
      </div>

      {/* 3. Search Bar, Filters & View Toggle */}
      <Card className="p-4 border-[#F0E7DE] space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name, booking reference or phone..."
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-stone-50/70 border border-[#F0E7DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-all text-[#292524] placeholder:text-stone-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Row with Modern Dropdowns & Date Picker */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#F0E7DE]/60 text-xs">
          {/* Status Filter */}
          <div className="w-36">
            <ModernDropdown
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              placeholder="All Statuses"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'CONFIRMED', label: 'Confirmed', badgeColor: 'bg-emerald-500' },
                { value: 'PLANNING', label: 'Planning', badgeColor: 'bg-blue-500' },
                { value: 'READY', label: 'Ready', badgeColor: 'bg-teal-500' },
                { value: 'IN_PROGRESS', label: 'In Progress', badgeColor: 'bg-purple-500' },
                { value: 'DRAFT', label: 'Draft', badgeColor: 'bg-stone-400' },
                { value: 'POSTPONED', label: 'Postponed', badgeColor: 'bg-amber-500' },
                { value: 'COMPLETED', label: 'Completed', badgeColor: 'bg-stone-600' },
                { value: 'CANCELLED', label: 'Cancelled', badgeColor: 'bg-rose-500' },
              ]}
              buttonClassName="py-1.5 px-3 text-xs rounded-lg"
            />
          </div>

          {/* Event Kind Filter */}
          <div className="w-44">
            <ModernDropdown
              value={eventKindFilter}
              onChange={(val) => setEventKindFilter(val)}
              placeholder="All Event Types"
              options={[
                { value: '', label: 'All Event Types' },
                ...EVENT_KINDS.map((ek) => ({ value: ek.value, label: ek.label })),
              ]}
              buttonClassName="py-1.5 px-3 text-xs rounded-lg"
            />
          </div>

          {/* Payment Status Filter */}
          <div className="w-36">
            <ModernDropdown
              value={paymentFilter}
              onChange={(val) => setPaymentFilter(val)}
              placeholder="All Payments"
              options={[
                { value: '', label: 'All Payments' },
                { value: 'fully_paid', label: 'Fully Paid', badgeColor: 'bg-emerald-500' },
                { value: 'partial', label: 'Partially Paid', badgeColor: 'bg-amber-500' },
                { value: 'unpaid', label: 'Unpaid (No Advance)', badgeColor: 'bg-rose-500' },
              ]}
              buttonClassName="py-1.5 px-3 text-xs rounded-lg"
            />
          </div>

          {/* Date Range Preset Filter */}
          <div className="w-40">
            <ModernDropdown
              value={dateRangeFilter}
              onChange={(val) => setDateRangeFilter(val)}
              placeholder="All Dates"
              options={[
                { value: 'all', label: 'All Dates' },
                { value: 'upcoming', label: 'Upcoming Events' },
                { value: 'past', label: 'Past Events' },
                { value: 'custom', label: 'Custom Date Range' },
              ]}
              buttonClassName="py-1.5 px-3 text-xs rounded-lg"
            />
          </div>

          {dateRangeFilter === 'custom' && (
            <div className="flex items-center gap-1.5">
              <div className="w-36">
                <ModernDatePicker
                  value={customStartDate}
                  onChange={(val) => setCustomStartDate(val)}
                  placeholder="Start date..."
                  className="text-xs"
                />
              </div>
              <span className="text-stone-400">to</span>
              <div className="w-36">
                <ModernDatePicker
                  value={customEndDate}
                  onChange={(val) => setCustomEndDate(val)}
                  placeholder="End date..."
                  className="text-xs"
                />
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-1.5 text-xs text-[#F97316] hover:text-[#ea580c] font-semibold hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}

          <div className="ml-auto text-stone-400 text-xs">
            {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
          </div>
        </div>
      </Card>

      {/* 4. MAIN CONTENT AREA: BOOKINGS LIST */}
      <div>
        {isLoadingList ? (
          <div className="py-12">
            <LoadingSpinner text="Loading wedding bookings and schedules..." />
          </div>
        ) : isErrorList ? (
            <Card className="p-8 text-center border-red-200 bg-red-50/30">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h3 className="font-bold text-stone-900 text-base">Unable to load bookings</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
                We couldn&apos;t retrieve your booking information. Please check your connection and try again.
              </p>
              <Button onClick={() => refetchBookings()} size="sm" variant="outline">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Retry
              </Button>
            </Card>
          ) : filteredBookings.length === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                icon={CalendarDays}
                title="No bookings match your filters"
                description="Try changing your search keywords or clearing your status/date filters."
                action={
                  <Button onClick={clearFilters} size="sm" variant="outline">
                    Clear Filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No bookings yet"
                description="Create your first booking to start organizing bridal events, wedding dates, and payments."
                action={
                  <Button onClick={handleOpenNewBooking} size="sm">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create New Booking
                  </Button>
                }
              />
            )
          ) : (
            <div className="space-y-3.5">
              {filteredBookings.map((b) => {
                const statusCfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.CONFIRMED;
                const nextEvent = b.events?.[0];

                return (
                  <Card
                    key={b.id}
                    className="p-5 border-[#F0E7DE] hover:border-orange-300 hover:shadow-sm transition-all duration-150"
                  >
                    {/* Header: Reference, Status, Customer, Financials */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3.5 border-b border-stone-100">
                      {/* Left: Ref & Client */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100/70 border border-orange-200/60 flex items-center justify-center font-bold text-sm text-[#F97316] shrink-0">
                          {b.customer?.full_name ? b.customer.full_name.charAt(0).toUpperCase() : 'B'}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-extrabold text-[#C2410C] bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200/60">
                              {b.booking_number}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.color}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                            {b.package_name_snapshot && (
                              <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                                {b.package_name_snapshot}
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-3 text-xs">
                            <span className="font-bold text-[#292524] text-sm">
                              {b.customer?.full_name || 'Client'}
                            </span>
                            {b.customer?.phone && (
                              <span className="flex items-center gap-1 text-stone-500">
                                <Phone className="w-3 h-3 text-[#F97316]" />
                                {b.customer.phone}
                              </span>
                            )}
                            {b.customer?.city && (
                              <span className="hidden sm:flex items-center gap-1 text-stone-500">
                                <MapPin className="w-3 h-3 text-[#F97316]" />
                                {b.customer.city}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Payment Balances & Action Menu */}
                      <div className="flex items-center justify-between lg:justify-end gap-5">
                        <div className="flex items-center gap-4 text-xs">
                          <div>
                            <span className="text-[11px] text-stone-400 block">Agreed Total</span>
                            <span className="font-extrabold text-stone-900 text-sm">
                              {formatINR(b.net_payable_paise)}
                            </span>
                          </div>
                          <div className="border-l border-stone-200 pl-3">
                            <span className="text-[11px] text-stone-400 block">Paid</span>
                            <span className="font-extrabold text-emerald-600 text-sm">
                              {formatINR(b.total_paid_paise)}
                            </span>
                          </div>
                          <div className="border-l border-stone-200 pl-3">
                            <span className="text-[11px] text-stone-400 block">Balance</span>
                            <span
                              className={`font-extrabold text-sm ${
                                b.balance_due_paise > 0 ? 'text-rose-600' : 'text-emerald-700'
                              }`}
                            >
                              {b.balance_due_paise > 0 ? formatINR(b.balance_due_paise) : 'Paid in Full'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            onClick={() => setSelectedBookingId(b.id)}
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-[#F97316]" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Scheduled Ceremony Events */}
                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {b.events && b.events.length > 0 ? (
                          b.events.map((evt) => (
                            <div
                              key={evt.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-50 rounded-lg border border-stone-200/80 text-stone-700 font-medium"
                            >
                              <Sparkles className="w-3 h-3 text-[#F97316]" />
                              <span>{evt.title || evt.event_kind}</span>
                              <span className="text-stone-400">•</span>
                              <span className="font-semibold text-stone-800">
                                {formatDate(evt.event_date)}
                              </span>
                              {evt.start_time && (
                                <span className="text-stone-500">
                                  ({evt.start_time.slice(0, 5)})
                                </span>
                              )}
                              {evt.venue && (
                                <span className="hidden md:inline text-stone-400">
                                  @ {evt.venue}
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-stone-400 italic text-xs">
                            No ceremony dates attached yet
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-stone-400">
                        Created on {formatDate(b.created_at)}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW BOOKING                                                */}
      {/* ========================================================================= */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-[#F0E7DE] overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#F0E7DE] flex items-center justify-between bg-[#FFFDF9]">
              <div>
                <h3 className="font-extrabold text-[#292524] text-lg">Create New Booking</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Schedule wedding ceremonies and record financial commitments.
                </p>
              </div>
              <button
                onClick={() => setIsNewBookingModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateBookingSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Client Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Select Bride / Client <span className="text-rose-500">*</span>
                </label>
                <ModernDropdown
                  value={newBookingForm.customer_id}
                  onChange={(val) =>
                    setNewBookingForm((prev) => ({ ...prev, customer_id: val }))
                  }
                  placeholder="-- Choose registered customer --"
                  options={(customersData || []).map((c) => ({
                    value: c.id,
                    label: `${c.full_name} (${c.phone})${c.city ? ` • ${c.city}` : ''}`,
                  }))}
                  error={formErrors.customer_id}
                />
              </div>

              {/* Bridal Package & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Bridal Package (Optional)
                  </label>
                  <ModernDropdown
                    value={newBookingForm.package_id}
                    onChange={(val) => handlePackageSelectInNewBooking(val)}
                    placeholder="-- None / Custom Service --"
                    options={[
                      { value: '', label: '-- None / Custom Service --' },
                      ...(packagesData || []).map((p) => ({
                        value: p.id,
                        label: `${p.name} (${formatINR(p.price_paise)})`,
                      })),
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Booking Status
                  </label>
                  <ModernDropdown
                    value={newBookingForm.status}
                    onChange={(val) =>
                      setNewBookingForm((prev) => ({ ...prev, status: val }))
                    }
                    options={[
                      { value: 'CONFIRMED', label: 'Confirmed', badgeColor: 'bg-emerald-500' },
                      { value: 'PLANNING', label: 'Planning', badgeColor: 'bg-blue-500' },
                      { value: 'READY', label: 'Ready', badgeColor: 'bg-teal-500' },
                      { value: 'DRAFT', label: 'Draft', badgeColor: 'bg-stone-400' },
                    ]}
                  />
                </div>
              </div>

              {/* Financials: Agreed Amount & Discount */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Agreed Total (₹ Rupees) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 35000"
                    value={newBookingForm.total_amount_rupees}
                    onChange={(e) =>
                      setNewBookingForm((prev) => ({
                        ...prev,
                        total_amount_rupees: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                  />
                  {formErrors.total_amount_rupees && (
                    <p className="text-xs text-rose-500 mt-1">{formErrors.total_amount_rupees}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Discount (₹ Rupees)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newBookingForm.discount_rupees}
                    onChange={(e) =>
                      setNewBookingForm((prev) => ({
                        ...prev,
                        discount_rupees: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                  />
                </div>
              </div>

              {/* Event / Ceremony Schedule section */}
              <div className="border-t border-stone-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                    Ceremony Schedule
                  </h4>
                  <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBookingForm.has_event}
                      onChange={(e) =>
                        setNewBookingForm((prev) => ({ ...prev, has_event: e.target.checked }))
                      }
                      className="rounded text-[#F97316] focus:ring-[#F97316]"
                    />
                    Schedule initial ceremony event
                  </label>
                </div>

                {newBookingForm.has_event && (
                  <div className="space-y-3 p-3.5 bg-orange-50/30 rounded-xl border border-orange-200/60">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Ceremony Type <span className="text-rose-500">*</span>
                        </label>
                        <ModernDropdown
                          value={newBookingForm.event_kind}
                          onChange={(val) =>
                            setNewBookingForm((prev) => ({ ...prev, event_kind: val }))
                          }
                          options={EVENT_KINDS.map((k) => ({
                            value: k.value,
                            label: k.label,
                          }))}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Ceremony Title (e.g. Muhurtham)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Traditional Muhurtham"
                          value={newBookingForm.event_title}
                          onChange={(e) =>
                            setNewBookingForm((prev) => ({ ...prev, event_title: e.target.value }))
                          }
                          className="w-full px-3.5 py-2 text-sm bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Event Date <span className="text-rose-500">*</span>
                        </label>
                        <ModernDatePicker
                          value={newBookingForm.event_date}
                          onChange={(val) =>
                            setNewBookingForm((prev) => ({ ...prev, event_date: val }))
                          }
                          error={formErrors.event_date}
                        />
                      </div>

                      <div>
                        <ModernTimePicker
                          label="Start Time"
                          value={newBookingForm.start_time}
                          onChange={(val) =>
                            setNewBookingForm((prev) => ({ ...prev, start_time: val }))
                          }
                        />
                      </div>

                      <div>
                        <ModernTimePicker
                          label="End Time"
                          value={newBookingForm.end_time}
                          onChange={(val) =>
                            setNewBookingForm((prev) => ({ ...prev, end_time: val }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Venue / Mandapam
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Mayor Ramanathan Hall"
                          value={newBookingForm.venue}
                          onChange={(e) =>
                            setNewBookingForm((prev) => ({ ...prev, venue: e.target.value }))
                          }
                          className="w-full px-3.5 py-2 text-sm bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Chennai"
                          value={newBookingForm.city}
                          onChange={(e) =>
                            setNewBookingForm((prev) => ({ ...prev, city: e.target.value }))
                          }
                          className="w-full px-3.5 py-2 text-sm bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Internal Notes & Preferences
                </label>
                <textarea
                  rows={2}
                  placeholder="Bridal styling preferences, saree draping instructions, etc."
                  value={newBookingForm.notes}
                  onChange={(e) =>
                    setNewBookingForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewBookingModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createBookingMutation.isPending}
                  className="bg-[#F97316] hover:bg-[#ea580c] text-white"
                >
                  {createBookingMutation.isPending ? 'Saving Booking...' : 'Create Booking'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VIEW BOOKING DETAILS                                              */}
      {/* ========================================================================= */}
      {selectedBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-[#F0E7DE] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#F0E7DE] flex items-center justify-between bg-[#FFFDF9]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-orange-100/80 border border-orange-200 flex items-center justify-center font-black text-base text-[#F97316] shrink-0">
                  {selectedBookingDetail?.customer?.full_name?.charAt(0).toUpperCase() || 'B'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-[#C2410C] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
                      {selectedBookingDetail?.booking_number || 'Loading...'}
                    </span>
                    {selectedBookingDetail && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          STATUS_CONFIG[selectedBookingDetail.status]?.color ||
                          'bg-stone-50 text-stone-700'
                        }`}
                      >
                        {selectedBookingDetail.status}
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-[#292524] text-lg mt-0.5">
                    {selectedBookingDetail?.customer?.full_name || 'Booking Details'}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedBookingId(null)}
                  className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {isLoadingDetail ? (
                <div className="py-12">
                  <LoadingSpinner text="Loading booking schedule and financial summary..." />
                </div>
              ) : !selectedBookingDetail ? (
                <div className="text-center py-10 text-stone-500">Booking information not found.</div>
              ) : (
                <>
                  {/* Client & Booking Quick Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Client Info Card */}
                    <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/70 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#F97316]" />
                        Client Details
                      </div>
                      <div className="font-bold text-stone-900 text-sm">
                        {selectedBookingDetail.customer?.full_name}
                      </div>
                      {selectedBookingDetail.customer?.phone && (
                        <div className="text-xs text-stone-600 flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#F97316]" />
                          {selectedBookingDetail.customer.phone}
                        </div>
                      )}
                      {selectedBookingDetail.customer?.email && (
                        <div className="text-xs text-stone-600 flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-[#F97316]" />
                          {selectedBookingDetail.customer.email}
                        </div>
                      )}
                    </div>

                    {/* Booking Workflow Card */}
                    <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/70 space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[#F97316]" />
                        Package & Status
                      </div>
                      <div className="font-bold text-stone-900 text-sm">
                        {selectedBookingDetail.package_name_snapshot || 'Custom Bridal Service'}
                      </div>
                      <div className="text-xs text-stone-500">
                        Created on {formatDate(selectedBookingDetail.created_at)}
                      </div>

                      {/* Status Transition Control */}
                      {selectedBookingDetail.status !== 'CANCELLED' &&
                        selectedBookingDetail.status !== 'COMPLETED' && (
                          <div className="pt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] text-stone-400">Change Status:</span>
                            {['CONFIRMED', 'PLANNING', 'READY', 'COMPLETED'].map((st) => (
                              <button
                                key={st}
                                disabled={updateStatusMutation.isPending}
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: selectedBookingDetail.id,
                                    status: st,
                                  })
                                }
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                                  selectedBookingDetail.status === st
                                    ? 'bg-[#F97316] text-white border-[#F97316]'
                                    : 'bg-white text-stone-600 border-stone-200 hover:border-orange-300'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Financials Summary Banner */}
                  <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-200/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-[#F97316]" />
                        Financial Summary
                      </h4>
                      {selectedBookingDetail.status !== 'CANCELLED' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditBooking(selectedBookingDetail)}
                            className="h-7 text-xs bg-white"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit Amount
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setRecordPaymentForm({
                                amount_rupees: (
                                  Number(selectedBookingDetail.payment_summary?.balance_due_paise || 0) /
                                  100
                                ).toString(),
                                method: 'UPI',
                                reference_note: '',
                                notes: '',
                              });
                              setIsRecordPaymentModalOpen(true);
                            }}
                            className="h-7 text-xs bg-[#F97316] hover:bg-[#ea580c] text-white"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Record Payment
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-orange-200/50">
                      <div>
                        <span className="text-[11px] text-stone-500 block">Agreed Total</span>
                        <span className="font-extrabold text-[#292524] text-base">
                          {formatINR(selectedBookingDetail.payment_summary?.total_amount_paise || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-stone-500 block">Discount</span>
                        <span className="font-extrabold text-stone-600 text-base">
                          {formatINR(selectedBookingDetail.payment_summary?.discount_paise || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-stone-500 block">Total Received</span>
                        <span className="font-extrabold text-emerald-600 text-base">
                          {formatINR(selectedBookingDetail.payment_summary?.total_paid_paise || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-stone-500 block">Outstanding Balance</span>
                        <span
                          className={`font-black text-base ${
                            selectedBookingDetail.payment_summary?.balance_due_paise > 0
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {formatINR(selectedBookingDetail.payment_summary?.balance_due_paise || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Ceremony Events */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4 text-[#F97316]" />
                        Ceremony Schedule ({selectedBookingDetail.events?.length || 0})
                      </h4>
                      {selectedBookingDetail.status !== 'CANCELLED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAddEventForm({
                              event_kind: 'RECEPTION',
                              title: '',
                              event_date: '',
                              start_time: '18:00',
                              end_time: '22:00',
                              venue: selectedBookingDetail.customer?.city || '',
                              city: selectedBookingDetail.customer?.city || '',
                              instructions: '',
                            });
                            setIsAddEventModalOpen(true);
                          }}
                          className="h-7 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1 text-[#F97316]" />
                          Add Ceremony Event
                        </Button>
                      )}
                    </div>

                    {selectedBookingDetail.events?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedBookingDetail.events.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-3.5 rounded-xl bg-white border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 text-sm">
                                  {ev.title || ev.event_kind}
                                </span>
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-50 text-[#F97316] border border-orange-200">
                                  {ev.event_kind}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-[#F97316]" />
                                  {formatDate(ev.event_date)}
                                </span>
                                {ev.start_time && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-stone-400" />
                                    {ev.start_time.slice(0, 5)} - {ev.end_time?.slice(0, 5) || 'Finish'}
                                  </span>
                                )}
                                {ev.venue && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-stone-400" />
                                    {ev.venue} {ev.city ? `(${ev.city})` : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            <Badge variant="default" className="self-start sm:self-auto text-xs">
                              {ev.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-stone-200 text-center text-xs text-stone-400">
                        No ceremony events added yet. Click &quot;Add Ceremony Event&quot; above.
                      </div>
                    )}
                  </div>

                  {/* Payment Records Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#F97316]" />
                      Payment History ({selectedBookingDetail.payments?.length || 0})
                    </h4>

                    {selectedBookingDetail.payments?.length > 0 ? (
                      <div className="border border-stone-200 rounded-xl overflow-hidden">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold">
                            <tr>
                              <th className="p-2.5">Date</th>
                              <th className="p-2.5">Method</th>
                              <th className="p-2.5">Reference</th>
                              <th className="p-2.5">Amount</th>
                              <th className="p-2.5 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {selectedBookingDetail.payments.map((p) => (
                              <tr key={p.id} className="hover:bg-stone-50/50">
                                <td className="p-2.5 font-medium text-stone-800">
                                  {formatDate(p.paid_at)}
                                </td>
                                <td className="p-2.5 text-stone-600">{p.method}</td>
                                <td className="p-2.5 text-stone-500">
                                  {p.receipt_number || p.reference_note || '—'}
                                </td>
                                <td className="p-2.5 font-bold text-emerald-600">
                                  {formatINR(p.amount_paise)}
                                </td>
                                <td className="p-2.5 text-right">
                                  <Badge
                                    variant={p.status === 'RECORDED' ? 'success' : 'default'}
                                    className="text-[10px]"
                                  >
                                    {p.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-stone-200 text-center text-xs text-stone-400">
                        No payments recorded for this booking yet.
                      </div>
                    )}
                  </div>

                  {/* Notes & Cancellation Info */}
                  {selectedBookingDetail.notes && (() => {
                    const imageMatch = selectedBookingDetail.notes.match(/(data:image\/[a-zA-Z0-9.+]+;base64,[A-Za-z0-9+/=]+|https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|svg)(?:\?[^\s"'<>]*)?)/i);
                    const extractedImg = imageMatch ? imageMatch[1] : null;
                    const cleanNotes = selectedBookingDetail.notes
                      .replace(/(?:Reference Look \/ Inspiration Photo:\s*)?data:image\/[a-zA-Z0-9.+]+;base64,[A-Za-z0-9+/=]+/gi, '')
                      .trim();

                    return (
                      <div className="space-y-2.5">
                        {extractedImg && (
                          <div className="p-3 bg-[#FFFDF9] border border-[#F0E7DE] rounded-xl flex flex-col min-[380px]:flex-row items-start sm:items-center gap-3">
                            <div className="relative rounded-lg overflow-hidden border border-stone-200 w-full min-[380px]:w-24 h-24 shrink-0 bg-stone-50">
                              <img src={extractedImg} alt="Reference" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-stone-900 block">Attached Inspiration Photo</span>
                              <p className="text-[11px] text-stone-500 mb-2">Reference look from enquiry/booking</p>
                              <a
                                href={extractedImg}
                                target="_blank"
                                rel="noreferrer"
                                download="booking-reference-look"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#C2410C] text-[11px] font-bold rounded-lg transition-colors"
                              >
                                View Full Size
                              </a>
                            </div>
                          </div>
                        )}
                        {cleanNotes && (
                          <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 whitespace-pre-wrap break-words">
                            <span className="font-bold text-stone-900 block mb-0.5">Notes:</span>
                            {cleanNotes}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {selectedBookingDetail.status === 'CANCELLED' && (
                    <div className="space-y-3">
                      {/* Cancellation Reason */}
                      <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                        <span className="font-bold block mb-0.5">Cancellation Reason:</span>
                        {selectedBookingDetail.cancellation_reason || 'No reason specified'}
                      </div>

                      {/* Refund Status Section */}
                      <div className="p-3.5 bg-rose-50/40 border border-rose-200/70 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                            <IndianRupee className="w-3.5 h-3.5 text-rose-600" />
                            Refund Status
                          </h4>
                          {bookingRefundEligibility?.refund_status && (() => {
                            const badgeMap = {
                              NOT_ELIGIBLE: 'bg-stone-100 text-stone-600 border-stone-200',
                              APPROVAL_REQUIRED: 'bg-amber-50 text-amber-700 border-amber-200',
                              REFUND_PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                              PARTIALLY_REFUNDED: 'bg-orange-50 text-orange-700 border-orange-200',
                              REFUNDED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            };
                            const cls = badgeMap[bookingRefundEligibility.refund_status] || badgeMap.NOT_ELIGIBLE;
                            return (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
                                {bookingRefundEligibility.refund_status.replace(/_/g, ' ')}
                              </span>
                            );
                          })()}
                        </div>

                        {isLoadingBookingRefundEligibility ? (
                          <div className="text-xs text-stone-400 animate-pulse py-1">Loading refund summary...</div>
                        ) : bookingRefundEligibility ? (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[11px] text-stone-500 block">Total Paid</span>
                              <span className="font-bold text-emerald-700">{formatINR(bookingRefundEligibility.total_paid_paise || 0)}</span>
                            </div>
                            <div>
                              <span className="text-[11px] text-stone-500 block">Approved for Refund</span>
                              <span className="font-bold text-stone-800">{formatINR(bookingRefundEligibility.approved_refundable_paise || 0)}</span>
                            </div>
                            <div>
                              <span className="text-[11px] text-stone-500 block">Already Refunded</span>
                              <span className="font-bold text-rose-600">{formatINR(bookingRefundEligibility.total_refunded_paise || 0)}</span>
                            </div>
                            <div>
                              <span className="text-[11px] text-stone-500 block">Remaining Refund Balance</span>
                              <span className="font-black text-rose-700">{formatINR(bookingRefundEligibility.remaining_refund_paise ?? bookingRefundEligibility.approved_refundable_paise ?? 0)}</span>
                            </div>
                            {bookingRefundEligibility.outstanding_due_paise > 0 && (
                              <div className="col-span-2 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 mt-0.5">
                                <span className="text-[11px] font-medium text-amber-800 flex items-center gap-1">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                  Outstanding Due (from Customer)
                                </span>
                                <span className="font-bold text-amber-700 text-xs">{formatINR(bookingRefundEligibility.outstanding_due_paise)}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-stone-400 py-1">No refund data available.</div>
                        )}

                        {/* Record Refund button — only if not fully refunded */}
                        {bookingRefundEligibility?.refund_status !== 'REFUNDED' &&
                          bookingRefundEligibility?.refund_status !== 'NOT_ELIGIBLE' && (
                          <Link
                            href={`/payments?mode=REFUND&bookingId=${selectedBookingDetail.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Record Refund
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  {selectedBookingDetail.status !== 'CANCELLED' && (
                    <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setCancellationReason('');
                          setIsCancelModalOpen(true);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Cancel Booking
                      </button>

                      <Button onClick={() => setSelectedBookingId(null)} size="sm" variant="outline">
                        Close
                      </Button>
                    </div>
                  )}

                  {/* Cancelled booking footer */}
                  {selectedBookingDetail.status === 'CANCELLED' && (
                    <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                      <Link
                        href={`/payments?mode=REFUND&bookingId=${selectedBookingDetail.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Record Refund
                      </Link>
                      <Button onClick={() => setSelectedBookingId(null)} size="sm" variant="outline">
                        Close
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT BOOKING AMOUNTS & NOTES                                      */}
      {/* ========================================================================= */}
      {isEditBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-[#F0E7DE] overflow-hidden">
            <div className="p-5 border-b border-[#F0E7DE] flex items-center justify-between bg-[#FFFDF9]">
              <h3 className="font-bold text-[#292524] text-base">Edit Booking Financials</h3>
              <button
                onClick={() => setIsEditBookingModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditBookingSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Bridal Package
                </label>
                <ModernDropdown
                  value={editBookingForm.package_id}
                  onChange={(val) => handlePackageSelectInEditBooking(val)}
                  placeholder="-- Custom / No Package --"
                  options={[
                    { value: '', label: '-- Custom / No Package --' },
                    ...(packagesData || []).map((p) => ({
                      value: p.id,
                      label: `${p.name} (${formatINR(p.price_paise)})`,
                    })),
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Agreed Total (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editBookingForm.total_amount_rupees}
                  onChange={(e) =>
                    setEditBookingForm((prev) => ({
                      ...prev,
                      total_amount_rupees: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editBookingForm.discount_rupees}
                  onChange={(e) =>
                    setEditBookingForm((prev) => ({
                      ...prev,
                      discount_rupees: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={editBookingForm.notes}
                  onChange={(e) =>
                    setEditBookingForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditBookingModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateBookingMutation.isPending}
                  className="bg-[#F97316] hover:bg-[#ea580c] text-white"
                >
                  {updateBookingMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD CEREMONY EVENT                                                */}
      {/* ========================================================================= */}
      {isAddEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[#F0E7DE] overflow-hidden">
            <div className="p-5 border-b border-[#F0E7DE] flex items-center justify-between bg-[#FFFDF9]">
              <h3 className="font-bold text-[#292524] text-base">Attach Ceremony Event</h3>
              <button
                onClick={() => setIsAddEventModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEventSubmit} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Event Type
                  </label>
                  <ModernDropdown
                    value={addEventForm.event_kind}
                    onChange={(val) =>
                      setAddEventForm((prev) => ({ ...prev, event_kind: val }))
                    }
                    options={EVENT_KINDS.map((ek) => ({
                      value: ek.value,
                      label: ek.label,
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Reception Evening"
                    value={addEventForm.title}
                    onChange={(e) =>
                      setAddEventForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <ModernDatePicker
                    value={addEventForm.event_date}
                    onChange={(val) =>
                      setAddEventForm((prev) => ({ ...prev, event_date: val }))
                    }
                  />
                </div>

                <div>
                  <ModernTimePicker
                    label="Start Time"
                    value={addEventForm.start_time}
                    onChange={(val) =>
                      setAddEventForm((prev) => ({ ...prev, start_time: val }))
                    }
                  />
                </div>

                <div>
                  <ModernTimePicker
                    label="End Time"
                    value={addEventForm.end_time}
                    onChange={(val) =>
                      setAddEventForm((prev) => ({ ...prev, end_time: val }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Venue
                  </label>
                  <input
                    type="text"
                    placeholder="Mandapam / Hotel"
                    value={addEventForm.venue}
                    onChange={(e) =>
                      setAddEventForm((prev) => ({ ...prev, venue: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai"
                    value={addEventForm.city}
                    onChange={(e) =>
                      setAddEventForm((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Styling Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes for artist, timing, helper staff, etc."
                  value={addEventForm.instructions}
                  onChange={(e) =>
                    setAddEventForm((prev) => ({ ...prev, instructions: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddEventModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={addEventMutation.isPending}
                  className="bg-[#F97316] hover:bg-[#ea580c] text-white"
                >
                  {addEventMutation.isPending ? 'Attaching...' : 'Attach Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RECORD PAYMENT                                                    */}
      {/* ========================================================================= */}
      {isRecordPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-[#F0E7DE] overflow-hidden">
            <div className="p-5 border-b border-[#F0E7DE] flex items-center justify-between bg-[#FFFDF9]">
              <h3 className="font-bold text-[#292524] text-base">Record Payment</h3>
              <button
                onClick={() => setIsRecordPaymentModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Payment Amount (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 10000"
                  value={recordPaymentForm.amount_rupees}
                  onChange={(e) =>
                    setRecordPaymentForm((prev) => ({
                      ...prev,
                      amount_rupees: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:border-[#F97316] font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Payment Method
                </label>
                <ModernDropdown
                  value={recordPaymentForm.method}
                  onChange={(val) =>
                    setRecordPaymentForm((prev) => ({ ...prev, method: val }))
                  }
                  options={[
                    { value: 'UPI', label: 'UPI (GPay / PhonePe / Paytm)' },
                    { value: 'CASH', label: 'Cash' },
                    { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT' },
                    { value: 'CARD_OFFLINE', label: 'Card POS Offline' },
                    { value: 'OTHER', label: 'Other' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Reference / Transaction Note
                </label>
                <input
                  type="text"
                  placeholder="UPI Ref ID, GPay screenshot note, etc."
                  value={recordPaymentForm.reference_note}
                  onChange={(e) =>
                    setRecordPaymentForm((prev) => ({
                      ...prev,
                      reference_note: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-[#F0E7DE] rounded-xl focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRecordPaymentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={recordPaymentMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {recordPaymentMutation.isPending ? 'Recording...' : 'Save Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CANCEL BOOKING REASON                                             */}
      {/* ========================================================================= */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-rose-200 overflow-hidden">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/40">
              <h3 className="font-bold text-rose-950 text-base flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-600" />
                Cancel Booking
              </h3>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCancelBookingSubmit} className="p-5 space-y-3.5">
              <p className="text-xs text-stone-600">
                Cancelling this booking will safely release schedule dates while preserving all
                financial transaction records and customer profile history.
              </p>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Cancellation Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Client postponed wedding date / Family emergency"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelModalOpen(false)}
                >
                  Keep Booking
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={cancelBookingMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {cancelBookingMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
