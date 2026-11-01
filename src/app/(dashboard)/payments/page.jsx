'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Calendar,
  Printer,
  RefreshCw,
  Sparkles,
  IndianRupee,
  Phone,
  Mail,
  User,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Filter,
  X,
  FileCheck,
  TrendingUp,
  Receipt,
  Download,
  Share2,
  CalendarDays,
  FileText,
  BadgeAlert,
  RotateCcw,
  Building2,
  Check,
  ShieldCheck,
  Pencil,
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
} from '@/components/ui';
import { useModalAlert } from '@/components/ui/ModalAlert';
import {
  paymentApi,
  bookingApi,
  customerApi,
  businessApi,
} from '@/services/api/modules';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatINR } from '@/utils/formatters';

// Payment method labels and badges
const PAYMENT_METHODS = [
  { value: 'ALL', label: 'All Methods' },
  { value: 'UPI', label: 'UPI (GPay, PhonePe, Paytm)' },
  { value: 'CASH', label: 'Cash in Hand' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer (IMPS/NEFT)' },
  { value: 'CARD_OFFLINE', label: 'POS Card Machine' },
  { value: 'OTHER', label: 'Other Receipt' },
];

const METHOD_OPTIONS_FOR_FORM = [
  { value: 'UPI', label: 'UPI (Google Pay / PhonePe / QR)' },
  { value: 'CASH', label: 'Cash in Hand' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer / IMPS / NEFT' },
  { value: 'CARD_OFFLINE', label: 'Card Swipe (POS Terminal)' },
  { value: 'OTHER', label: 'Other Manual Mode' },
];

const TRANSACTION_TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Transactions' },
  { value: 'PAYMENT', label: 'Payments Received (+)' },
  { value: 'REFUND', label: 'Refunds Issued (-)' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'RECORDED', label: 'Recorded (Payment)' },
  { value: 'REFUNDED', label: 'Completed Refund' },
  { value: 'PENDING_REFUND', label: 'Pending Refund' },
  { value: 'VOIDED', label: 'Voided' },
];

const STATUS_BADGE_CONFIG = {
  RECORDED: {
    label: 'Recorded',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    dot: 'bg-emerald-500',
  },
  REFUNDED: {
    label: 'Refunded',
    color: 'bg-rose-50 text-rose-700 border-rose-200/90',
    dot: 'bg-rose-500',
  },
  PENDING_REFUND: {
    label: 'Refund Pending',
    color: 'bg-amber-50 text-amber-700 border-amber-200/90',
    dot: 'bg-amber-500',
  },
  VOIDED: {
    label: 'Voided',
    color: 'bg-stone-100 text-stone-600 border-stone-200/90',
    dot: 'bg-stone-400',
  },
};

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useModalAlert();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || currentBusiness?.business_id;
  const searchParams = useSearchParams();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, PAYMENT, REFUND
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('PAYMENT'); // 'PAYMENT' or 'REFUND'
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);
  const [refundingPayment, setRefundingPayment] = useState(null);

  // Record Payment Form state
  const [recordForm, setRecordForm] = useState({
    customer_id: '',
    booking_id: '',
    amount_rupees: '',
    method: 'UPI',
    paid_at: new Date().toISOString().split('T')[0],
    receipt_number: '',
    reference_note: '',
    notes: '',
  });
  const [recordErrors, setRecordErrors] = useState({});

  // Record Refund Form state (inside Record Modal when modalMode === 'REFUND')
  const [recordRefundForm, setRecordRefundForm] = useState({
    booking_id: '',
    refund_amount_rupees: '',
    method: 'UPI',
    refund_date: new Date().toISOString().split('T')[0],
    refund_status: 'REFUNDED', // 'REFUNDED' (Completed) or 'PENDING_REFUND' (Pending)
    refund_reference: '',
    original_payment_id: '',
    reference_note: '', // UTR / Txn Reference
    reason: '',
    notes: '',
  });
  const [recordRefundErrors, setRecordRefundErrors] = useState({});
  const [isApprovalInputOpen, setIsApprovalInputOpen] = useState(false);
  const [approvalAmountInput, setApprovalAmountInput] = useState('');
  const [approvalNotesInput, setApprovalNotesInput] = useState('');

  // Refund Form state (from table quick refund button)
  const [refundForm, setRefundForm] = useState({
    refund_amount_rupees: '',
    reason: '',
    refund_method: 'UPI',
    reference_note: '',
  });
  const [refundErrors, setRefundErrors] = useState({});

  // 1. Fetch live studio business profile
  const { data: businessProfileData } = useQuery({
    queryKey: ['business-profile', businessId],
    queryFn: () => businessApi.getProfile(),
    enabled: !!businessId,
  });
  const liveBusiness = businessProfileData?.data || currentBusiness;

  // 2. Fetch payment summary metrics (Server-calculated)
  const {
    data: metricsData,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ['payments-metrics', businessId],
    queryFn: () => paymentApi.getMetrics(),
    enabled: !!businessId,
  });
  const metrics = metricsData?.data || {
    total_collected_paise: 0,
    total_refunded_paise: 0,
    net_collected_paise: 0,
    today_collection_paise: 0,
    advance_collected_paise: 0,
    outstanding_balance_paise: 0,
  };

  // 3. Fetch payment records with server-side filters & pagination
  const {
    data: paymentsData,
    isLoading: isLoadingPayments,
    isError: isPaymentsError,
    error: paymentsError,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: [
      'payments-list',
      businessId,
      searchTerm,
      typeFilter,
      statusFilter,
      methodFilter,
      startDate,
      endDate,
      page,
    ],
    queryFn: () =>
      paymentApi.list({
        page,
        limit,
        search: searchTerm || undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        method: methodFilter !== 'ALL' ? methodFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: !!businessId,
  });

  const payments = paymentsData?.data?.payments || [];
  const pagination = paymentsData?.data?.pagination || { total: 0, page: 1, totalPages: 1 };

  // 4. Fetch customers for record payment form
  const { data: customersData } = useQuery({
    queryKey: ['customers', businessId],
    queryFn: () => customerApi.list({ limit: 100 }),
    enabled: isRecordModalOpen && !!businessId,
  });
  const customers = customersData?.data?.customers || [];

  // 5. Fetch confirmed bookings for record payment form
  const { data: bookingsData } = useQuery({
    queryKey: ['bookings-active', businessId],
    queryFn: () => bookingApi.list({ limit: 100 }),
    enabled: isRecordModalOpen && !!businessId,
  });
  const allBookings = bookingsData?.data?.bookings || [];

  // In Payment mode: active non-cancelled bookings
  // In Refund mode: cancelled bookings only
  const activeBookings = useMemo(() => {
    return allBookings.filter((b) => b.status !== 'CANCELLED');
  }, [allBookings]);

  const cancelledBookings = useMemo(() => {
    return allBookings.filter((b) => b.status === 'CANCELLED');
  }, [allBookings]);

  // Fetch refund eligibility for selected booking in Refund mode
  const {
    data: refundEligibilityData,
    isLoading: isLoadingEligibility,
    refetch: refetchEligibility,
  } = useQuery({
    queryKey: ['refund-eligibility', businessId, recordRefundForm.booking_id],
    queryFn: () => paymentApi.getRefundEligibility(recordRefundForm.booking_id),
    enabled: isRecordModalOpen && modalMode === 'REFUND' && !!recordRefundForm.booking_id,
  });
  const rawEligibility = refundEligibilityData?.data || null;
  const eligibility = useMemo(() => {
    if (!rawEligibility) return null;
    const fs = rawEligibility.financial_summary || {};
    const originalTotal = fs.original_booking_total_paise ?? rawEligibility.total_amount_paise ?? 0;
    const totalPaid = fs.total_payments_received_paise ?? rawEligibility.total_paid_paise ?? 0;
    const prevRefunds = fs.previous_completed_refunds_paise ?? rawEligibility.total_refunded_paise ?? 0;
    const pendingRefunds = fs.previous_pending_refunds_paise ?? 0;
    const approvedAmt = fs.approved_refundable_amount_paise ?? rawEligibility.approved_refundable_paise ?? 0;
    const remainingBalance = fs.remaining_refund_balance_paise ?? rawEligibility.remaining_refund_paise ?? 0;
    const netPayable = fs.net_payable_paise ?? rawEligibility.net_payable_paise ?? originalTotal;
    const outstandingDue = Math.max(0, netPayable - totalPaid);

    return {
      ...rawEligibility,
      original_booking_total_paise: originalTotal,
      total_payments_received_paise: totalPaid,
      previous_completed_refunds_paise: prevRefunds,
      previous_pending_refunds_paise: pendingRefunds,
      approved_refundable_amount_paise: approvedAmt,
      remaining_refund_balance_paise: remainingBalance,
      net_payable_paise: netPayable,
      outstanding_due_paise: outstandingDue,
      // Backward compatibility aliases for UI references:
      total_amount_paise: originalTotal,
      total_paid_paise: totalPaid,
      total_refunded_paise: prevRefunds,
      approved_refundable_paise: approvedAmt,
      remaining_refund_paise: remainingBalance,
    };
  }, [rawEligibility]);

  // Filter bookings based on selected customer in Payment mode
  const filteredBookings = useMemo(() => {
    if (!recordForm.customer_id) return activeBookings;
    return activeBookings.filter(
      (b) => b.customer?.id === recordForm.customer_id || b.customer_id === recordForm.customer_id
    );
  }, [activeBookings, recordForm.customer_id]);

  // Selected booking's outstanding balance
  const selectedBookingDetails = useMemo(() => {
    if (!recordForm.booking_id) return null;
    return activeBookings.find((b) => b.id === recordForm.booking_id);
  }, [activeBookings, recordForm.booking_id]);

  // Approve Refund Mutation
  const approveRefundMutation = useMutation({
    mutationFn: ({ bookingId, payload }) => paymentApi.approveRefund(bookingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['refund-eligibility']);
      queryClient.invalidateQueries(['bookings-active']);
      setIsApprovalInputOpen(false);
      setApprovalAmountInput('');
      setApprovalNotesInput('');
      showAlert({
        title: 'Refund Amount Approved',
        message: 'The refundable liability has been approved and confirmed for this cancelled booking.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Approval Failed',
        message: err?.response?.data?.message || err?.message || 'Failed to approve refundable amount.',
        type: 'error',
      });
    },
  });

  // Record Customer Refund Mutation
  const recordCustomerRefundMutation = useMutation({
    mutationFn: (payload) => paymentApi.recordRefund(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['payments-list']);
      queryClient.invalidateQueries(['payments-metrics']);
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['refund-eligibility']);
      setIsRecordModalOpen(false);
      resetRecordRefundForm();
      const isCompleted = res?.data?.status === 'REFUNDED';
      showAlert({
        title: isCompleted ? 'Refund Record Saved' : 'Pending Refund Recorded',
        message: isCompleted
          ? 'Customer refund of ' + formatINR(res?.data?.amount_paise) + ' has been completed and reconciled.'
          : 'Pending refund recorded. It will not reduce cash movement until marked Completed.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Could Not Record Refund',
        message: err?.response?.data?.message || err?.message || 'Failed to save refund record.',
        type: 'error',
      });
    },
  });

  // Record Payment Mutation
  const recordPaymentMutation = useMutation({
    mutationFn: (payload) => paymentApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments-list']);
      queryClient.invalidateQueries(['payments-metrics']);
      queryClient.invalidateQueries(['bookings']);
      setIsRecordModalOpen(false);
      resetRecordForm();
      showAlert({
        title: 'Payment Recorded Successfully',
        message: 'The manual payment receipt has been persisted to the ledger and reconciled with the booking.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Could Not Record Payment',
        message: err?.response?.data?.message || err?.message || 'Failed to record manual payment.',
        type: 'error',
      });
    },
  });

  // Refund Payment Mutation
  const refundPaymentMutation = useMutation({
    mutationFn: ({ id, payload }) => paymentApi.refund(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments-list']);
      queryClient.invalidateQueries(['payments-metrics']);
      queryClient.invalidateQueries(['bookings']);
      setRefundingPayment(null);
      resetRefundForm();
      showAlert({
        title: 'Refund Documented',
        message: 'The refund has been recorded and financial ledgers adjusted.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Refund Failed',
        message: err?.response?.data?.message || err?.message || 'Could not process refund.',
        type: 'error',
      });
    },
  });

  // Reset forms
  const resetRecordForm = () => {
    setRecordForm({
      customer_id: '',
      booking_id: '',
      amount_rupees: '',
      method: 'UPI',
      paid_at: new Date().toISOString().split('T')[0],
      receipt_number: '',
      reference_note: '',
      notes: '',
    });
    setRecordErrors({});
  };

  const resetRefundForm = () => {
    setRefundForm({
      refund_amount_rupees: '',
      reason: '',
      refund_method: 'UPI',
      reference_note: '',
    });
    setRefundErrors({});
  };

  const resetRecordRefundForm = () => {
    setRecordRefundForm({
      booking_id: '',
      refund_amount_rupees: '',
      method: 'UPI',
      refund_date: new Date().toISOString().split('T')[0],
      refund_status: 'REFUNDED',
      refund_reference: '',
      original_payment_id: '',
      reference_note: '',
      reason: '',
      notes: '',
    });
    setRecordRefundErrors({});
    setIsApprovalInputOpen(false);
    setApprovalAmountInput('');
    setApprovalNotesInput('');
  };

  // Handle URL params on mount — open modal in REFUND mode with pre-filled booking
  useEffect(() => {
    const mode = searchParams.get('mode');
    const bookingId = searchParams.get('bookingId');
    if (mode === 'REFUND') {
      setModalMode('REFUND');
      if (bookingId) {
        setRecordRefundForm((prev) => ({ ...prev, booking_id: bookingId }));
      }
      setIsRecordModalOpen(true);
    }
  }, [searchParams]);

  // Handle Record Payment Submit
  const handleRecordSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!recordForm.booking_id) {
      errors.booking_id = 'Please select a related booking for this receipt.';
    }

    const amt = parseFloat(recordForm.amount_rupees);
    if (!amt || isNaN(amt) || amt <= 0) {
      errors.amount_rupees = 'Please enter a valid positive payment amount.';
    }

    if (!recordForm.paid_at) {
      errors.paid_at = 'Payment date is required.';
    }

    if (Object.keys(errors).length > 0) {
      setRecordErrors(errors);
      return;
    }

    const payload = {
      booking_id: recordForm.booking_id,
      amount_paise: Math.round(amt * 100),
      method: recordForm.method,
      paid_at: recordForm.paid_at,
      receipt_number: recordForm.receipt_number?.trim() || undefined,
      reference_note: recordForm.reference_note?.trim() || null,
      notes: recordForm.notes?.trim() || null,
    };

    recordPaymentMutation.mutate(payload);
  };

  // Handle Record Refund Submit
  const handleRecordRefundSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!recordRefundForm.booking_id) {
      errors.booking_id = 'Please select a cancelled booking to process the refund against.';
    }

    const refAmt = parseFloat(recordRefundForm.refund_amount_rupees);
    if (!refAmt || isNaN(refAmt) || refAmt <= 0) {
      errors.refund_amount_rupees = 'Please enter a valid positive refund amount.';
    } else if (eligibility) {
      const remainingPaise = eligibility.remaining_refund_paise ?? eligibility.approved_refundable_paise ?? 0;
      if (refAmt * 100 > remainingPaise + 1) {
        errors.refund_amount_rupees = `Refund cannot exceed remaining refundable balance of ${formatINR(remainingPaise)}.`;
      }
    }

    if (!recordRefundForm.refund_date) {
      errors.refund_date = 'Refund date is required.';
    }

    if (Object.keys(errors).length > 0) {
      setRecordRefundErrors(errors);
      return;
    }

    const doSubmit = () => {
      const payload = {
        booking_id: recordRefundForm.booking_id,
        refund_amount_paise: Math.round(refAmt * 100),
        method: recordRefundForm.method,
        refund_date: recordRefundForm.refund_date,
        status: recordRefundForm.refund_status,          // backend schema uses 'status', not 'refund_status'
        refund_reference: recordRefundForm.refund_reference?.trim() || undefined,
        original_payment_id: recordRefundForm.original_payment_id || undefined,
        reference_note: recordRefundForm.reference_note?.trim() || null,
        reason: recordRefundForm.reason?.trim() || null,
        notes: recordRefundForm.notes?.trim() || null,
      };
      recordCustomerRefundMutation.mutate(payload);
    };

    if (recordRefundForm.refund_status === 'REFUNDED') {
      showConfirm({
        title: 'Confirm Completed Refund',
        message: `Marking this refund as COMPLETED will immediately reduce net cash movement by ${formatINR(Math.round(refAmt * 100))}. This action is recorded in the financial ledger. Are you sure the refund has been physically transferred to the client?`,
        confirmText: 'Yes, Save Refund Record',
        variant: 'danger',
      }).then((confirmed) => {
        if (confirmed) doSubmit();
      });
    } else {
      doSubmit();
    }
  };

  // Handle Refund Submit
  const handleRefundSubmit = (e) => {
    e.preventDefault();
    if (!refundingPayment) return;

    const errors = {};
    const originalMaxRupees = Number(refundingPayment.amount_paise) / 100;
    const refAmt = parseFloat(refundForm.refund_amount_rupees);

    if (!refAmt || isNaN(refAmt) || refAmt <= 0) {
      errors.refund_amount_rupees = 'Please enter a positive refund amount.';
    } else if (refAmt > originalMaxRupees) {
      errors.refund_amount_rupees = `Refund cannot exceed original payment amount of ₹${originalMaxRupees.toLocaleString('en-IN')}`;
    }

    if (!refundForm.reason || refundForm.reason.trim().length < 3) {
      errors.reason = 'Please state a brief reason for the refund (minimum 3 characters).';
    }

    if (Object.keys(errors).length > 0) {
      setRefundErrors(errors);
      return;
    }

    refundPaymentMutation.mutate({
      id: refundingPayment.id,
      payload: {
        refund_amount_paise: Math.round(refAmt * 100),
        reason: refundForm.reason.trim(),
        refund_method: refundForm.refund_method,
        reference_note: refundForm.reference_note?.trim() || null,
      },
    });
  };

  // Printable receipt trigger
  const handlePrintReceipt = () => {
    window.print();
  };

  // Share receipt on WhatsApp
  const handleShareReceipt = (payment) => {
    if (!payment) return;
    const clientName = payment.customer_name || 'Client';
    const amount = formatINR(payment.amount_paise);
    const receiptNum = payment.receipt_number || payment.id?.slice(0, 8);
    const date = formatDate(payment.paid_at);
    const studioName = liveBusiness?.name || 'Bridal Studio';

    const text = encodeURIComponent(
      `Hello ${clientName},\n\nWe have received your payment of ${amount} for booking #${payment.booking_number}.\n\nReceipt Number: ${receiptNum}\nDate: ${date}\nPayment Mode: ${payment.method}\n\nThank you for choosing ${studioName}!`
    );

    const phone = payment.customer_phone?.replace(/[^0-9]/g, '') || '';
    if (phone) {
      window.open(`https://wa.me/${phone.startsWith('91') ? phone : `91${phone}`}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  // Export payments as CSV
  const handleExportCSV = () => {
    if (payments.length === 0) {
      showAlert({
        title: 'No Payments to Export',
        message: 'There are no payment records matching the current filter criteria.',
        type: 'warning',
      });
      return;
    }

    const headers = ['Receipt Number', 'Client Name', 'Phone', 'Booking Number', 'Payment Date', 'Method', 'Status', 'Amount (INR)', 'Reference Note', 'Notes'];
    const rows = payments.map((p) => [
      p.receipt_number || '',
      `"${p.customer_name || ''}"`,
      p.customer_phone || '',
      p.booking_number || '',
      formatDate(p.paid_at),
      p.method || '',
      p.status || '',
      (Number(p.amount_paise) / 100).toFixed(2),
      `"${(p.reference_note || '').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VARNAM_Payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#292524] tracking-tight">Payment Records</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#C2410C] border border-orange-200/80">
              Manual Ledger
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Track client payments, advance receipts, outstanding balances, and refunds.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-[#F0E7DE] hover:bg-stone-50 text-xs h-9 text-stone-700 rounded-xl"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-stone-500" />
            Export
          </Button>

          <Button
            size="sm"
            onClick={() => {
              resetRecordForm();
              setIsRecordModalOpen(true);
            }}
            className="bg-[#F97316] hover:bg-[#C2410C] text-white shadow-sm rounded-xl px-4 text-xs h-9 font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* 2. Payment Summary Metrics Cards (Server-Calculated & Interactive) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Total Collected */}
        <Card
          onClick={() => {
            setTypeFilter('PAYMENT');
            setPage(1);
          }}
          className={`p-4 bg-white border rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer group select-none ${
            typeFilter === 'PAYMENT' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20' : 'border-[#F0E7DE] hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 group-hover:text-emerald-700 transition-colors">Total Collected</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-stone-900 group-hover:text-emerald-800 transition-colors">
              {isLoadingMetrics ? (
                <span className="inline-block w-24 h-6 bg-stone-200 animate-pulse rounded" />
              ) : (
                formatINR(metrics.total_collected_paise)
              )}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-[11px] text-stone-400">Recorded receipts</p>
            <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">Filter →</span>
          </div>
        </Card>

        {/* Metric 2: Today's Collection */}
        <Card
          onClick={() => {
            const todayStr = new Date().toISOString().split('T')[0];
            setStartDate(todayStr);
            setEndDate(todayStr);
            setPage(1);
          }}
          className={`p-4 bg-white border rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer group select-none ${
            startDate && startDate === endDate ? 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/20' : 'border-[#F0E7DE] hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 group-hover:text-orange-700 transition-colors">Today&apos;s Collection</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-100 transition-all">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-orange-600 group-hover:text-orange-700 transition-colors">
              {isLoadingMetrics ? (
                <span className="inline-block w-20 h-6 bg-stone-200 animate-pulse rounded" />
              ) : (
                formatINR(metrics.today_collection_paise)
              )}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-[11px] text-stone-400">Recorded today</p>
            <span className="text-[10px] font-bold text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">Today →</span>
          </div>
        </Card>

        {/* Metric 3: Total Refunds Processed */}
        <Card
          onClick={() => {
            setTypeFilter('REFUND');
            setPage(1);
          }}
          className={`p-4 bg-white border rounded-2xl shadow-2xs hover:shadow-md transition-all cursor-pointer group select-none ${
            typeFilter === 'REFUND' ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-[#F0E7DE] hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 group-hover:text-rose-700 transition-colors">Total Refunds</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-100 transition-all">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-rose-600 group-hover:text-rose-700 transition-colors">
              {isLoadingMetrics ? (
                <span className="inline-block w-20 h-6 bg-stone-200 animate-pulse rounded" />
              ) : (
                formatINR(metrics.total_refunded_paise || 0)
              )}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-[11px] text-stone-400">Client refunds disbursed</p>
            <span className="text-[10px] font-bold text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">Filter →</span>
          </div>
        </Card>

        {/* Metric 4: Advance Payments */}
        <Card className="p-4 bg-white border border-[#F0E7DE] rounded-2xl shadow-2xs hover:shadow-md hover:border-sky-300 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 group-hover:text-sky-700 transition-colors">Advance Payments</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-100 transition-all">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-sky-700 group-hover:text-sky-800 transition-colors">
              {isLoadingMetrics ? (
                <span className="inline-block w-20 h-6 bg-stone-200 animate-pulse rounded" />
              ) : (
                formatINR(metrics.advance_collected_paise)
              )}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Locked against active bookings</p>
        </Card>

        {/* Metric 5: Outstanding Balance */}
        <Card className="p-4 bg-white border border-[#F0E7DE] rounded-2xl shadow-2xs hover:shadow-md hover:border-amber-300 transition-all col-span-2 sm:col-span-1 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 group-hover:text-amber-800 transition-colors">Outstanding Balance</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-100 transition-all">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-amber-700 group-hover:text-amber-800 transition-colors">
              {isLoadingMetrics ? (
                <span className="inline-block w-24 h-6 bg-stone-200 animate-pulse rounded" />
              ) : (
                formatINR(metrics.outstanding_balance_paise)
              )}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Unpaid on active bookings</p>
        </Card>
      </div>

      {/* 3. Search & Responsive Filter Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-[#F0E7DE] shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by receipt number, bride name, phone, or booking reference..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-[#F0E7DE] bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-all text-[#292524]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters row - fully responsive across mobile, tablet, and desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5">
            {/* Transaction Type Filter */}
            <ModernDropdown
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setPage(1);
              }}
              options={TRANSACTION_TYPE_OPTIONS}
              placeholder="All Transactions"
            />

            {/* Method Filter */}
            <ModernDropdown
              value={methodFilter}
              onChange={(val) => {
                setMethodFilter(val);
                setPage(1);
              }}
              options={PAYMENT_METHODS}
              placeholder="Filter by Mode"
            />

            {/* Status Filter */}
            <ModernDropdown
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={PAYMENT_STATUS_OPTIONS}
              placeholder="Filter by Status"
            />

            {/* Date Range Start */}
            <ModernDatePicker
              value={startDate}
              onChange={(val) => {
                setStartDate(val);
                setPage(1);
              }}
              placeholder="From Date"
            />

            {/* Date Range End */}
            <ModernDatePicker
              value={endDate}
              onChange={(val) => {
                setEndDate(val);
                setPage(1);
              }}
              placeholder="To Date"
            />
          </div>
        </div>

        {/* Clear Filters indicator */}
        {(searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL' || methodFilter !== 'ALL' || startDate || endDate) && (
          <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
            <span className="text-stone-500 font-medium">
              Filtered results: <strong className="text-stone-800">{pagination.total}</strong> payments found
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
                setMethodFilter('ALL');
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
              className="text-[#C2410C] hover:bg-orange-50 text-xs h-7 px-2"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* 4. Payment Records Table / Card List */}
      {isLoadingPayments ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner text="Retrieving authenticated payment ledger..." />
        </div>
      ) : isPaymentsError ? (
        <Card className="p-8 text-center border-rose-200 bg-rose-50/30 rounded-2xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-900 text-base">Unable to load payments</h3>
          <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
            {paymentsError?.response?.data?.message ||
              paymentsError?.message ||
              "We couldn't retrieve your payment records. Please try again."}
          </p>
          <Button size="sm" onClick={() => refetchPayments()} className="mt-4 bg-[#F97316] text-white">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </Card>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={
            searchTerm || statusFilter !== 'ALL' || methodFilter !== 'ALL' || startDate || endDate
              ? 'No payments match your filters'
              : 'No payment records yet'
          }
          description={
            searchTerm || statusFilter !== 'ALL' || methodFilter !== 'ALL' || startDate || endDate
              ? 'Try modifying your search query or clear the active filter settings.'
              : 'Record client advance payments, installments, and generate branded studio receipts.'
          }
          action={
            searchTerm || statusFilter !== 'ALL' || methodFilter !== 'ALL' || startDate || endDate ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setMethodFilter('ALL');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsRecordModalOpen(true)}
                className="bg-[#F97316] hover:bg-[#C2410C] text-white font-bold"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Record First Payment
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#F0E7DE] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFFDF9] text-stone-500 font-bold uppercase tracking-wider text-[11px] border-b border-[#F0E7DE]">
                  <tr>
                    <th className="py-3.5 px-4">Receipt #</th>
                    <th className="py-3.5 px-4">Client / Bride</th>
                    <th className="py-3.5 px-4">Booking Ref</th>
                    <th className="py-3.5 px-4">Payment Date</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {payments.map((p) => {
                    const statusConfig = STATUS_BADGE_CONFIG[p.status] || STATUS_BADGE_CONFIG.RECORDED;
                    const isRefund = p.type === 'REFUND' || p.status === 'REFUNDED' || p.status === 'PENDING_REFUND';

                    return (
                      <tr key={p.id} className={`hover:bg-stone-50/80 transition-all ${isRefund ? 'bg-rose-50/25 hover:bg-rose-50/50' : ''}`}>
                        {/* Receipt Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-stone-800">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isRefund && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200/80 tracking-wide">
                                REFUND
                              </span>
                            )}
                            <span className="bg-stone-100/90 text-[#C2410C] px-2 py-0.5 rounded-md border border-stone-200/80 hover:bg-orange-50 transition-colors">
                              {p.receipt_number || p.id.slice(0, 8)}
                            </span>
                          </div>
                        </td>

                        {/* Client */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#292524]">{p.customer_name || 'Direct Client'}</div>
                          {p.customer_phone && (
                            <div className="text-[11px] text-stone-400 font-medium flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-stone-300" />
                              {p.customer_phone}
                            </div>
                          )}
                        </td>

                        {/* Booking */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[11px] text-stone-600 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200/80">
                            {p.booking_number ? `#${p.booking_number}` : 'Unlinked'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-stone-600">
                          <div className="font-medium">{formatDate(p.paid_at || p.created_at)}</div>
                          {p.reference_note && (
                            <div className="text-[10px] text-stone-400 truncate max-w-xs mt-0.5" title={p.reference_note}>
                              {p.reference_note}
                            </div>
                          )}
                        </td>

                        {/* Method */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md text-[11px]">
                            {p.method}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-black text-sm tracking-tight ${
                              isRefund ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            {isRefund ? '−' : '+'}{formatINR(p.amount_paise)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${statusConfig.color}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                            {statusConfig.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Receipt */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReceiptPayment(p)}
                              className="text-xs h-8 px-2.5 border-[#F0E7DE] hover:border-orange-300 text-stone-700 hover:text-[#C2410C]"
                              title="View & Print Official Receipt"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1 text-[#F97316]" />
                              Receipt
                            </Button>

                            {/* Share on WhatsApp */}
                            <button
                              type="button"
                              onClick={() => handleShareReceipt(p)}
                              className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Share receipt via WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Refund action */}
                            {p.status === 'RECORDED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRefundingPayment(p);
                                  setRefundForm({
                                    refund_amount_rupees: (Number(p.amount_paise) / 100).toString(),
                                    reason: '',
                                    refund_method: p.method,
                                    reference_note: `Refund for ${p.receipt_number || p.id.slice(0, 8)}`,
                                  });
                                }}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Process Refund"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-3">
            {payments.map((p) => {
              const statusConfig = STATUS_BADGE_CONFIG[p.status] || STATUS_BADGE_CONFIG.RECORDED;

              return (
                <Card
                  key={p.id}
                  className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#C2410C] bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        {p.receipt_number || p.id.slice(0, 8)}
                      </span>
                      <h4 className="font-bold text-[#292524] text-sm mt-1.5">
                        {p.customer_name || 'Direct Client'}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        Booking: #{p.booking_number || 'Unlinked'} • {formatDate(p.paid_at || p.created_at)}
                      </p>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-black text-base ${
                          p.status === 'REFUNDED' ? 'text-rose-600 line-through' : 'text-emerald-700'
                        }`}
                      >
                        {formatINR(p.amount_paise)}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 ${statusConfig.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {p.reference_note && (
                    <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/60 text-xs text-stone-600 italic">
                      Note: {p.reference_note}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#F0E7DE] flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      Mode: {p.method}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReceiptPayment(p)}
                        className="text-xs h-7 px-2.5 border-[#F0E7DE]"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1 text-[#F97316]" />
                        Receipt
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleShareReceipt(p)}
                        className="p-1.5 text-stone-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 cursor-pointer"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {p.status === 'RECORDED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRefundingPayment(p);
                            setRefundForm({
                              refund_amount_rupees: (Number(p.amount_paise) / 100).toString(),
                              reason: '',
                              refund_method: p.method,
                              reference_note: `Refund for ${p.receipt_number || p.id.slice(0, 8)}`,
                            });
                          }}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Refund"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination bar */}
          {pagination.totalPages > 1 && (
            <div className="p-4 bg-white rounded-2xl border border-[#F0E7DE] shadow-2xs flex items-center justify-between text-xs">
              <span className="text-stone-500">
                Page <strong className="text-stone-800">{pagination.page}</strong> of{' '}
                <strong className="text-stone-800">{pagination.totalPages}</strong> ({pagination.total} records)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 text-xs border-[#F0E7DE]"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 text-xs border-[#F0E7DE]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          5. RECORD MANUAL PAYMENT / RECORD REFUND DUAL-MODE MODAL
         ========================================================================= */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#F0E7DE] overflow-hidden">
            {/* Modal Header - Responsive Typography */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FFFDF9] border-b border-[#F0E7DE] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${modalMode === 'REFUND' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-[#C2410C]'}`}>
                  {modalMode === 'REFUND' ? <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" /> : <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[#292524] text-sm sm:text-base leading-tight truncate">
                    {modalMode === 'REFUND' ? 'Record Customer Refund' : 'Record Manual Payment'}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5 truncate max-w-[200px] sm:max-w-none">
                    {modalMode === 'REFUND'
                      ? 'Log refund for cancelled booking — pending or completed'
                      : 'Document client advances, installments, cash, and UPI'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRecordModalOpen(false);
                  resetRecordForm();
                  resetRecordRefundForm();
                  setModalMode('PAYMENT');
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Segmented Control */}
            <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-0 shrink-0">
              <div className="flex items-center bg-stone-100 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('PAYMENT');
                    resetRecordRefundForm();
                  }}
                  className={`flex-1 text-[11px] sm:text-xs font-bold py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalMode === 'PAYMENT'
                      ? 'bg-white shadow-sm text-[#C2410C]'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalMode('REFUND');
                    resetRecordForm();
                  }}
                  className={`flex-1 text-[11px] sm:text-xs font-bold py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    modalMode === 'REFUND'
                      ? 'bg-white shadow-sm text-rose-600'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Record Refund</span>
                </button>
              </div>
            </div>

            {/* ── PAYMENT MODE ── */}
            {modalMode === 'PAYMENT' && (
              <form onSubmit={handleRecordSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-3.5 custom-scrollbar">
                {/* Customer Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                    Select Bride / Client (Optional Filter)
                  </label>
                  <ModernDropdown
                    value={recordForm.customer_id}
                    onChange={(val) => {
                      setRecordForm({ ...recordForm, customer_id: val, booking_id: '' });
                    }}
                    options={[
                      { value: '', label: '-- All Clients --' },
                      ...customers.map((c) => ({
                        value: c.id,
                        label: `${c.full_name} (${c.phone || 'No phone'})`,
                      })),
                    ]}
                    placeholder="Filter bookings by client..."
                  />
                </div>

                {/* Booking Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                    Related Confirmed Booking <span className="text-red-500">*</span>
                  </label>
                  {filteredBookings.length === 0 ? (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                      No confirmed bookings available to record payment against.{' '}
                      <Link href="/bookings" className="underline font-bold text-amber-950">
                        View Bookings
                      </Link>
                    </div>
                  ) : (
                    <ModernDropdown
                      value={recordForm.booking_id}
                      onChange={(val) => {
                        setRecordForm({ ...recordForm, booking_id: val });
                        if (recordErrors.booking_id) setRecordErrors((p) => ({ ...p, booking_id: undefined }));
                      }}
                      options={filteredBookings.map((b) => ({
                        value: b.id,
                        label: `#${b.booking_number} — ${b.customer?.full_name || 'Client'} (Total: ${formatINR(
                          b.total_amount_paise
                        )})`,
                      }))}
                      placeholder="-- Select booking --"
                      error={!!recordErrors.booking_id}
                    />
                  )}
                  {recordErrors.booking_id && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{recordErrors.booking_id}</p>
                  )}
                </div>

                {/* Outstanding Balance Banner if Booking Selected */}
                {selectedBookingDetails && (
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/90 text-xs space-y-1">
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Agreed Booking Total:</span>
                      <span className="font-bold text-stone-900">
                        {formatINR(selectedBookingDetails.total_amount_paise)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Total Already Paid:</span>
                      <span className="font-semibold text-emerald-700">
                        {formatINR(selectedBookingDetails.total_paid_paise || 0)}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-stone-200 flex items-center justify-between">
                      <span className="font-bold text-stone-900">Outstanding Balance Due:</span>
                      <span className="font-black text-amber-700 text-sm">
                        {formatINR(selectedBookingDetails.balance_due_paise || 0)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Payment Amount & Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                      Amount Received (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="e.g. 10000"
                        value={recordForm.amount_rupees}
                        onChange={(e) => {
                          setRecordForm({ ...recordForm, amount_rupees: e.target.value });
                          if (recordErrors.amount_rupees) setRecordErrors((p) => ({ ...p, amount_rupees: undefined }));
                        }}
                        className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-stone-200 bg-white font-bold text-[#292524] focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                      />
                    </div>
                    {recordErrors.amount_rupees && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">{recordErrors.amount_rupees}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <ModernDropdown
                      value={recordForm.method}
                      onChange={(val) => setRecordForm({ ...recordForm, method: val })}
                      options={METHOD_OPTIONS_FOR_FORM}
                      placeholder="Payment method"
                    />
                  </div>
                </div>

                {/* Date & Optional Receipt Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                      Payment Date <span className="text-red-500">*</span>
                    </label>
                    <ModernDatePicker
                      value={recordForm.paid_at}
                      onChange={(dateStr) => setRecordForm({ ...recordForm, paid_at: dateStr })}
                      placeholder="Select payment date..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                      Receipt # (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Leave empty for auto-generated"
                      value={recordForm.receipt_number}
                      onChange={(e) => setRecordForm({ ...recordForm, receipt_number: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] text-[#292524]"
                    />
                  </div>
                </div>

                {/* Transaction Reference Note */}
                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                    Transaction Reference / UTR Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI Ref: 329182910291 or Cheque #1029"
                    value={recordForm.reference_note}
                    onChange={(e) => setRecordForm({ ...recordForm, reference_note: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] text-[#292524]"
                  />
                </div>

                {/* Internal Notes */}
                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                    Internal Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Paid in cash at bridal trial session."
                    value={recordForm.notes}
                    onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] text-[#292524] resize-none"
                  />
                </div>

                {/* Form Actions */}
                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#F0E7DE]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsRecordModalOpen(false);
                      resetRecordForm();
                      setModalMode('PAYMENT');
                    }}
                    className="border-[#F0E7DE]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={recordPaymentMutation.isPending}
                    className="bg-[#F97316] hover:bg-[#C2410C] text-white font-bold"
                  >
                    {recordPaymentMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-1.5" />
                    )}
                    Save Payment Receipt
                  </Button>
                </div>
              </form>
            )}

            {/* ── REFUND MODE ── */}
            {modalMode === 'REFUND' && (
              <form onSubmit={handleRecordRefundSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">

                {/* Cancelled Booking Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                    Cancelled Booking <span className="text-red-500">*</span>
                  </label>
                  {cancelledBookings.length === 0 ? (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
                      No cancelled bookings found. Only cancelled bookings are eligible for refund processing.
                    </div>
                  ) : (
                    <ModernDropdown
                      value={recordRefundForm.booking_id}
                      onChange={(val) => {
                        setRecordRefundForm((prev) => ({ ...prev, booking_id: val }));
                        if (recordRefundErrors.booking_id)
                          setRecordRefundErrors((p) => ({ ...p, booking_id: undefined }));
                      }}
                      options={cancelledBookings.map((b) => ({
                        value: b.id,
                        label: `#${b.booking_number} — ${b.customer?.full_name || 'Client'} (Total: ${formatINR(b.total_amount_paise || 0)}${Number(b.total_paid_paise || 0) > 0 ? `, Paid: ${formatINR(b.total_paid_paise)}` : ''})`,
                      }))}
                      placeholder="-- Select cancelled booking --"
                      error={!!recordRefundErrors.booking_id}
                    />
                  )}
                  {recordRefundErrors.booking_id && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{recordRefundErrors.booking_id}</p>
                  )}
                </div>

                {/* Financial Summary Card (when eligibility loaded) */}
                {recordRefundForm.booking_id && (
                  <>
                    {isLoadingEligibility ? (
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500 text-center animate-pulse">
                        Loading refund eligibility...
                      </div>
                    ) : eligibility ? (
                      <div className="bg-rose-50/30 border border-rose-200/80 rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                            <IndianRupee className="w-3.5 h-3.5 text-rose-600" />
                            Financial Summary
                          </h4>
                          {/* Refund Status Badge */}
                          {eligibility.refund_status && (() => {
                            const badgeMap = {
                              NOT_ELIGIBLE: 'bg-stone-100 text-stone-600 border-stone-200',
                              APPROVAL_REQUIRED: 'bg-amber-50 text-amber-700 border-amber-200',
                              REFUND_PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                              PARTIALLY_REFUNDED: 'bg-orange-50 text-orange-700 border-orange-200',
                              REFUNDED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            };
                            const cls = badgeMap[eligibility.refund_status] || badgeMap.NOT_ELIGIBLE;
                            return (
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${cls}`}>
                                {eligibility.refund_status.replace(/_/g, ' ')}
                              </span>
                            );
                          })()}
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between text-stone-600">
                            <span>Original Booking Total</span>
                            <span className="font-semibold text-stone-800">{formatINR(eligibility.original_booking_total_paise)}</span>
                          </div>
                          <div className="flex justify-between text-stone-600">
                            <span>Total Payments Received</span>
                            <span className="font-semibold text-emerald-700">{formatINR(eligibility.total_payments_received_paise)}</span>
                          </div>
                          {eligibility.outstanding_due_paise > 0 && (
                            <div className="flex justify-between items-center bg-amber-50 border border-amber-200 px-2 py-1.5 rounded-lg -mx-1">
                              <span className="font-medium text-amber-800 flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                Outstanding Due (from Customer)
                              </span>
                              <span className="font-bold text-amber-700">{formatINR(eligibility.outstanding_due_paise)}</span>
                            </div>
                          )}
                          {eligibility.total_refunded_paise > 0 && (
                            <div className="flex justify-between text-stone-600">
                              <span>Previous Completed Refunds</span>
                              <span className="font-semibold text-rose-600">−{formatINR(eligibility.total_refunded_paise)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-stone-600 items-center">
                            <span>Approved Refundable Amount</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-stone-800">{formatINR(eligibility.approved_refundable_amount_paise || 0)}</span>
                              {!isApprovalInputOpen && eligibility.refund_status !== 'REFUNDED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsApprovalInputOpen(true);
                                    setApprovalAmountInput(
                                      ((eligibility.approved_refundable_amount_paise || 0) / 100).toString()
                                    );
                                  }}
                                  className="p-0.5 text-stone-400 hover:text-amber-600 rounded cursor-pointer"
                                  title="Edit approved refundable amount"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="pt-2 border-t border-rose-200/60 flex justify-between items-center">
                            <span className="font-bold text-rose-900">Remaining Refund Balance</span>
                            <span className="font-black text-rose-700 text-sm">{formatINR(eligibility.remaining_refund_balance_paise || 0)}</span>
                          </div>
                        </div>

                        {/* Approval inline form */}
                        {(isApprovalInputOpen || eligibility.refund_status === 'APPROVAL_REQUIRED') && (
                          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                            <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {eligibility.refund_status === 'APPROVAL_REQUIRED'
                                ? 'Approve Refundable Amount'
                                : 'Update Approved Refundable Amount'}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="Refundable amount"
                                  value={approvalAmountInput}
                                  onChange={(e) => setApprovalAmountInput(e.target.value)}
                                  className="w-full text-xs pl-6 pr-3 py-2 rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 font-bold"
                                />
                              </div>
                              <input
                                type="text"
                                placeholder="Approval notes (optional)"
                                value={approvalNotesInput}
                                onChange={(e) => setApprovalNotesInput(e.target.value)}
                                className="w-full text-xs px-3 py-2 rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                type="button"
                                size="sm"
                                disabled={approveRefundMutation.isPending}
                                onClick={() => {
                                  const amt = parseFloat(approvalAmountInput);
                                  if (!amt || isNaN(amt) || amt < 0) {
                                    showAlert({ title: 'Invalid Amount', message: 'Please enter a valid refundable amount.', type: 'warning' });
                                    return;
                                  }
                                  approveRefundMutation.mutate({
                                    bookingId: recordRefundForm.booking_id,
                                    payload: {
                                      approved_refundable_paise: Math.round(amt * 100),
                                      refund_approval_notes: approvalNotesInput?.trim() || null,
                                    },
                                  });
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 px-3 font-bold"
                              >
                                {approveRefundMutation.isPending ? (
                                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3 mr-1" />
                                )}
                                Approve Amount
                              </Button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsApprovalInputOpen(false);
                                  setApprovalAmountInput('');
                                  setApprovalNotesInput('');
                                }}
                                className="text-xs text-stone-500 hover:text-stone-700 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Refund Fields — show when eligibility loaded and there is refundable amount OR status allows */}
                    {eligibility && (
                      (eligibility.remaining_refund_paise > 0 ||
                        eligibility.approved_refundable_paise > 0 ||
                        ['PARTIALLY_REFUNDED', 'REFUND_PENDING'].includes(eligibility.refund_status)) ? (
                        <div className="space-y-3.5">
                          {/* Refund Amount & Method */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                                Refund Amount (₹) <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="e.g. 5000"
                                  value={recordRefundForm.refund_amount_rupees}
                                  onChange={(e) => {
                                    setRecordRefundForm((prev) => ({ ...prev, refund_amount_rupees: e.target.value }));
                                    if (recordRefundErrors.refund_amount_rupees)
                                      setRecordRefundErrors((p) => ({ ...p, refund_amount_rupees: undefined }));
                                  }}
                                  className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-stone-200 bg-white font-bold text-[#292524] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                />
                              </div>
                              {recordRefundErrors.refund_amount_rupees && (
                                <p className="text-[11px] text-rose-500 mt-1 font-medium">
                                  {recordRefundErrors.refund_amount_rupees}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                                Refund Method <span className="text-red-500">*</span>
                              </label>
                              <ModernDropdown
                                value={recordRefundForm.method}
                                onChange={(val) => setRecordRefundForm((prev) => ({ ...prev, method: val }))}
                                options={METHOD_OPTIONS_FOR_FORM}
                                placeholder="Refund method"
                              />
                            </div>
                          </div>

                          {/* Refund Date & Status */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                              <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                                Refund Date <span className="text-red-500">*</span>
                              </label>
                              <ModernDatePicker
                                value={recordRefundForm.refund_date}
                                onChange={(dateStr) =>
                                  setRecordRefundForm((prev) => ({ ...prev, refund_date: dateStr }))
                                }
                                placeholder="Select refund date..."
                              />
                              {recordRefundErrors.refund_date && (
                                <p className="text-[11px] text-rose-500 mt-1 font-medium">
                                  {recordRefundErrors.refund_date}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                                Refund Status <span className="text-red-500">*</span>
                              </label>
                              <ModernDropdown
                                value={recordRefundForm.refund_status}
                                onChange={(val) =>
                                  setRecordRefundForm((prev) => ({ ...prev, refund_status: val }))
                                }
                                options={[
                                  { value: 'REFUNDED', label: 'Completed (Money Transferred)' },
                                  { value: 'PENDING_REFUND', label: 'Pending (Not Yet Paid)' },
                                ]}
                                placeholder="Refund status"
                              />
                            </div>
                          </div>

                          {/* Refund Reference / UTR */}
                          <div>
                            <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                              Refund Reference / UTR (Optional — auto-generated if empty)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. UPI Ref: 912839102 or Bank Ref: NEFT123"
                              value={recordRefundForm.refund_reference}
                              onChange={(e) =>
                                setRecordRefundForm((prev) => ({ ...prev, refund_reference: e.target.value }))
                              }
                              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-[#292524]"
                            />
                          </div>

                          {/* Refund Reason */}
                          <div>
                            <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                              Refund Reason (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Cancelled due to wedding postponement"
                              value={recordRefundForm.reason}
                              onChange={(e) =>
                                setRecordRefundForm((prev) => ({ ...prev, reason: e.target.value }))
                              }
                              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-[#292524]"
                            />
                          </div>

                          {/* Internal Notes */}
                          <div>
                            <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                              Internal Notes (Optional)
                            </label>
                            <textarea
                              rows={2}
                              placeholder="e.g. Refund approved by owner — transferred via GPay."
                              value={recordRefundForm.notes}
                              onChange={(e) =>
                                setRecordRefundForm((prev) => ({ ...prev, notes: e.target.value }))
                              }
                              className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-[#292524] resize-none"
                            />
                          </div>
                        </div>
                      ) : eligibility.refund_status === 'NOT_ELIGIBLE' ? (
                        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 text-center">
                          This booking is not eligible for a refund — no payments were collected.
                        </div>
                      ) : eligibility.refund_status === 'REFUNDED' ? (
                        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          All refunds for this booking have been fully processed and reconciled.
                        </div>
                      ) : null
                    )}
                  </>
                )}

                {/* Form Actions */}
                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#F0E7DE]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsRecordModalOpen(false);
                      resetRecordRefundForm();
                      setModalMode('PAYMENT');
                    }}
                    className="border-[#F0E7DE]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      recordCustomerRefundMutation.isPending ||
                      !recordRefundForm.booking_id ||
                      !eligibility ||
                      (eligibility.remaining_refund_paise <= 0 &&
                        eligibility.approved_refundable_paise <= 0 &&
                        !['PARTIALLY_REFUNDED', 'REFUND_PENDING'].includes(eligibility?.refund_status))
                    }
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  >
                    {recordCustomerRefundMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4 mr-1.5" />
                    )}
                    Save Refund Record
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          6. PAYMENT DETAILS & PRINTABLE RECEIPT MODAL
         ========================================================================= */}
      {selectedReceiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[94vh] flex flex-col shadow-2xl border border-[#F0E7DE] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-[#FFFDF9] border-b border-[#F0E7DE] flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-[#F97316]" />
                <h3 className="font-bold text-[#292524] text-base">Payment Receipt</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintReceipt}
                  className="text-xs h-8 px-2.5 border-[#F0E7DE]"
                >
                  <Printer className="w-3.5 h-3.5 mr-1 text-stone-600" />
                  Print
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptPayment(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar print:p-0 print:m-0" id="payment-receipt-print">
              {/* Studio Branding */}
              <div className="flex items-start justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-3">
                  {liveBusiness?.logo_url ? (
                    <img
                      src={liveBusiness.logo_url}
                      alt={liveBusiness?.name}
                      className="w-12 h-12 rounded-xl object-contain border border-stone-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center font-bold text-lg">
                      {liveBusiness?.name?.charAt(0) || 'V'}
                    </div>
                  )}
                  <div>
                    <h2 className="font-extrabold text-[#292524] text-base leading-tight">
                      {liveBusiness?.name || 'Bridal & Makeup Studio'}
                    </h2>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {liveBusiness?.city ? `${liveBusiness.city}, ${liveBusiness.state || 'India'}` : 'Bridal Studio'}
                    </p>
                    {liveBusiness?.business_phone && (
                      <p className="text-[11px] text-stone-500 font-mono">Ph: {liveBusiness.business_phone}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Receipt Voucher
                  </span>
                  <span className="font-mono font-bold text-stone-800 text-sm">
                    {selectedReceiptPayment.receipt_number || selectedReceiptPayment.id?.slice(0, 8)}
                  </span>
                  <div className="text-[11px] text-stone-500 mt-1">
                    Date: {formatDate(selectedReceiptPayment.paid_at || selectedReceiptPayment.created_at)}
                  </div>
                </div>
              </div>

              {/* Customer & Booking Details */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Received From
                  </span>
                  <div className="font-bold text-[#292524] mt-0.5">
                    {selectedReceiptPayment.customer_name || 'Client'}
                  </div>
                  {selectedReceiptPayment.customer_phone && (
                    <div className="text-stone-500 mt-0.5">{selectedReceiptPayment.customer_phone}</div>
                  )}
                  {selectedReceiptPayment.customer_email && (
                    <div className="text-stone-500">{selectedReceiptPayment.customer_email}</div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Associated Booking
                  </span>
                  <div className="font-mono font-bold text-stone-800 mt-0.5">
                    #{selectedReceiptPayment.booking_number || 'N/A'}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Status: {selectedReceiptPayment.booking_status || 'CONFIRMED'}
                  </div>
                </div>
              </div>

              {/* Amount Paid Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-emerald-50/30 border border-emerald-200/90 text-center space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Amount Received in Full
                </span>
                <div className="text-3xl font-black text-emerald-700 tracking-tight">
                  {formatINR(selectedReceiptPayment.amount_paise)}
                </div>
                <div className="text-xs text-emerald-900 font-medium">
                  Payment Mode: <strong>{selectedReceiptPayment.method}</strong>
                </div>
              </div>

              {/* Transaction Metadata */}
              <div className="space-y-1.5 text-xs text-stone-600 bg-white p-3.5 rounded-2xl border border-stone-200">
                {selectedReceiptPayment.reference_note && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Transaction Reference:</span>
                    <span className="font-mono font-bold text-stone-800">
                      {selectedReceiptPayment.reference_note}
                    </span>
                  </div>
                )}
                {selectedReceiptPayment.recorded_by && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400">Recorded By:</span>
                    <span className="font-semibold text-stone-800">
                      {selectedReceiptPayment.recorded_by}
                    </span>
                  </div>
                )}
                {selectedReceiptPayment.notes && (
                  <div className="pt-2 border-t border-stone-100">
                    <span className="text-[10px] font-bold text-stone-400 uppercase block mb-0.5">
                      Remarks / Notes
                    </span>
                    <p className="italic text-stone-600">{selectedReceiptPayment.notes}</p>
                  </div>
                )}
              </div>

              {/* Receipt Footer */}
              <div className="pt-4 border-t border-stone-200 text-center text-[10px] text-stone-400 space-y-1">
                <p>This is a computer-generated receipt issued by {liveBusiness?.name || 'Bridal Studio'}.</p>
                <p>Official acknowledgment of client manual payment receipt.</p>
              </div>

              {/* Modal footer print buttons */}
              <div className="pt-3 flex items-center justify-between print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShareReceipt(selectedReceiptPayment)}
                  className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-xs"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1" />
                  Share via WhatsApp
                </Button>

                <Button
                  size="sm"
                  onClick={handlePrintReceipt}
                  className="bg-[#F97316] text-white text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. REFUND CONFIRMATION MODAL
         ========================================================================= */}
      {refundingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#F0E7DE] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-rose-950 text-base leading-tight">
                  Process Payment Refund
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRefundingPayment(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRefundSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-stone-600">
                  <span>Original Receipt:</span>
                  <span className="font-mono font-bold text-stone-900">
                    {refundingPayment.receipt_number || refundingPayment.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Client:</span>
                  <span className="font-bold text-stone-900">{refundingPayment.customer_name}</span>
                </div>
                <div className="flex items-center justify-between text-stone-600">
                  <span>Original Payment Amount:</span>
                  <span className="font-bold text-emerald-700">
                    {formatINR(refundingPayment.amount_paise)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                  Refund Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={Number(refundingPayment.amount_paise) / 100}
                    step="any"
                    value={refundForm.refund_amount_rupees}
                    onChange={(e) => setRefundForm({ ...refundForm, refund_amount_rupees: e.target.value })}
                    className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-stone-200 bg-white font-bold text-[#292524] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
                {refundErrors.refund_amount_rupees && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">
                    {refundErrors.refund_amount_rupees}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                  Refund Method
                </label>
                <ModernDropdown
                  value={refundForm.refund_method}
                  onChange={(val) => setRefundForm({ ...refundForm, refund_method: val })}
                  options={METHOD_OPTIONS_FOR_FORM}
                  placeholder="Refund method"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                  Refund Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ceremony postponement / partial cancellation adjustment"
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-[#292524] resize-none"
                />
                {refundErrors.reason && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">{refundErrors.reason}</p>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRefundingPayment(null)}
                  className="border-stone-200 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={refundPaymentMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  {refundPaymentMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-1" />
                  )}
                  Confirm Refund
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
