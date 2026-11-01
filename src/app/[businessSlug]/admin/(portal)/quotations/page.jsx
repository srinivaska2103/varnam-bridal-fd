'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Send,
  Check,
  X,
  FileCheck,
  Printer,
  Share2,
  RefreshCw,
  Sparkles,
  Package,
  Layers,
  IndianRupee,
  Phone,
  Mail,
  User,
  ArrowRight,
  ExternalLink,
  Ban,
  CalendarDays,
  MapPin,
  ChevronRight,
  Info,
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
  quotationApi,
  customerApi,
  serviceApi,
  packageApi,
  businessApi,
} from '@/services/api/modules';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatINR } from '@/utils/formatters';

// Status badge and styling configuration matching Prisma enum
const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft Proposal',
    color: 'bg-stone-100 text-stone-700 border-stone-200',
    dot: 'bg-stone-400',
    variant: 'default',
  },
  SENT: {
    label: 'Sent to Bride',
    color: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dot: 'bg-sky-500',
    variant: 'info',
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
    variant: 'success',
  },
  DECLINED: {
    label: 'Declined',
    color: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500',
    variant: 'danger',
  },
  EXPIRED: {
    label: 'Expired',
    color: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
    variant: 'warning',
  },
};

const FILTER_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft Proposals' },
  { value: 'SENT', label: 'Sent to Client' },
  { value: 'ACCEPTED', label: 'Accepted (Ready for Booking)' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'EXPIRED', label: 'Expired' },
];

const EVENT_KIND_OPTIONS = [
  { value: 'WEDDING', label: 'Wedding / Muhurtham' },
  { value: 'ENGAGEMENT', label: 'Engagement / Nichayathartham' },
  { value: 'RECEPTION', label: 'Reception' },
  { value: 'SANGEET', label: 'Sangeet / Mehendi' },
  { value: 'HALDI', label: 'Haldi Ceremony' },
  { value: 'MEHENDI', label: 'Mehndi Party' },
  { value: 'TRIAL', label: 'Bridal Trial Makeup' },
  { value: 'OTHER', label: 'Other Special Event' },
];

export default function QuotationsPage() {
  const queryClient = useQueryClient();
  const { showAlert, showConfirm } = useModalAlert();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || currentBusiness?.business_id;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [viewingQuotationId, setViewingQuotationId] = useState(null);
  const [convertingQuotation, setConvertingQuotation] = useState(null);

  // Quick Customer Creation inline state
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [quickCustomerForm, setQuickCustomerForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    city: '',
  });
  const [quickCustomerError, setQuickCustomerError] = useState('');

  // Conversion form modal state
  const [convertForm, setConvertForm] = useState({
    event_date: '',
    event_kind: 'WEDDING',
    start_time: '06:00',
    end_time: '12:00',
    venue: '',
    city: '',
    instructions: '',
    notes: '',
  });

  // Quotation Editor Form State
  const [formData, setFormData] = useState({
    customer_id: '',
    valid_until: '',
    terms: '1. 50% advance booking deposit required to lock ceremony date.\n2. Travel & accommodation outside city limits charged additionally at actuals.\n3. Early morning starts before 6:00 AM incur a nominal artist commute charge.',
    discount_rupees: '',
    tax_rupees: '',
    items: [
      {
        description: '',
        quantity: 1,
        unit_price_rupees: '',
        service_id: null,
        package_id: null,
      },
    ],
  });
  const [formErrors, setFormErrors] = useState({});

  // 1. Fetch Quotations from Backend
  const {
    data: quotationsRes,
    isLoading: isLoadingQuotations,
    isError: isQuotationsError,
    error: quotationsError,
    refetch: refetchQuotations,
    isFetching: isFetchingQuotations,
  } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => quotationApi.list({ limit: 100 }),
  });

  const quotations = useMemo(() => {
    return quotationsRes?.data?.quotations || [];
  }, [quotationsRes]);

  // 2. Fetch Customers for Quotation selection
  const { data: customersRes, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerApi.list({ limit: 100 }),
  });
  const customers = useMemo(() => customersRes?.data?.customers || [], [customersRes]);

  // 3. Fetch Catalog Services & Packages for quick line-item addition
  const { data: servicesRes } = useQuery({
    queryKey: ['services'],
    queryFn: () => serviceApi.list({ limit: 100, is_active: true }),
  });
  const availableServices = useMemo(() => servicesRes?.data?.services || [], [servicesRes]);

  const { data: packagesRes } = useQuery({
    queryKey: ['packages'],
    queryFn: () => packageApi.list({ limit: 100, is_active: true }),
  });
  const availablePackages = useMemo(() => packagesRes?.data?.packages || [], [packagesRes]);

  // 4. Fetch Single Quotation Detail for Drawer/Modal
  const { data: detailRes, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['quotation-detail', viewingQuotationId],
    queryFn: () => quotationApi.getById(viewingQuotationId),
    enabled: !!viewingQuotationId,
  });
  const selectedQuotation = useMemo(() => detailRes?.data || null, [detailRes]);

  // 5. Fetch Studio Business Profile for branding & printing
  const { data: businessRes } = useQuery({
    queryKey: ['business-profile', businessId],
    queryFn: () => businessApi.getById(businessId),
    enabled: !!businessId,
  });
  const studioProfile = businessRes?.data || currentBusiness;

  // 6. Summary Metric Calculations
  const metrics = useMemo(() => {
    const total = quotations.length;
    const drafts = quotations.filter((q) => q.status === 'DRAFT').length;
    const sent = quotations.filter((q) => q.status === 'SENT').length;
    const accepted = quotations.filter((q) => q.status === 'ACCEPTED').length;

    // Total quoted proposals value (accepted + sent)
    const totalQuotedValuePaise = quotations
      .filter((q) => q.status === 'ACCEPTED' || q.status === 'SENT')
      .reduce((acc, curr) => acc + Number(curr.total_paise || 0), 0);

    return {
      total,
      drafts,
      sent,
      accepted,
      totalQuotedValuePaise,
    };
  }, [quotations]);

  // 7. Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const numMatch = (q.quotation_number || '').toLowerCase().includes(query);
        const nameMatch = (q.customers?.full_name || '').toLowerCase().includes(query);
        const phoneMatch = (q.customers?.phone || '').toLowerCase().includes(query);
        if (!numMatch && !nameMatch && !phoneMatch) return false;
      }

      return true;
    });
  }, [quotations, statusFilter, searchTerm]);

  // 8. Live Client Estimate Calculation (server is source of truth on submit)
  const liveEstimate = useMemo(() => {
    let subtotal = 0;
    formData.items.forEach((item) => {
      const q = Number(item.quantity) || 1;
      const p = Number(item.unit_price_rupees) || 0;
      subtotal += q * p;
    });

    const discount = Number(formData.discount_rupees) || 0;
    const tax = Number(formData.tax_rupees) || 0;
    const total = Math.max(0, subtotal - discount + tax);

    return {
      subtotal,
      discount,
      tax,
      total,
    };
  }, [formData.items, formData.discount_rupees, formData.tax_rupees]);

  // 9. Mutations
  const createMutation = useMutation({
    mutationFn: (payload) => quotationApi.create(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setIsCreateModalOpen(false);
      resetForm();
      showAlert({
        title: 'Quotation Created',
        message: `Quotation "${res?.data?.quotation_number || ''}" created with server-verified totals.`,
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Could Not Create Quotation',
        message: err.response?.data?.message || err.message || 'Server rejected quotation.',
        type: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => quotationApi.update(id, data),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation-detail', vars.id] });
      setEditingQuotation(null);
      resetForm();
      showAlert({
        title: 'Quotation Updated',
        message: `Quotation updated successfully with recalculated totals.`,
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Could Not Update Quotation',
        message: err.response?.data?.message || err.message || 'Server rejected update.',
        type: 'error',
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => quotationApi.updateStatus(id, { status }),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['quotation-detail', vars.id] });
      showAlert({
        title: 'Status Updated',
        message: `Proposal marked as ${STATUS_CONFIG[vars.status]?.label || vars.status}.`,
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Status Update Denied',
        message: err.response?.data?.message || err.message || 'Invalid status transition.',
        type: 'error',
      });
    },
  });

  const convertMutation = useMutation({
    mutationFn: ({ id, data }) => quotationApi.convertToBooking(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setConvertingQuotation(null);
      if (viewingQuotationId) setViewingQuotationId(null);
      showAlert({
        title: 'Converted into Confirmed Booking!',
        message: `Booking ${res?.data?.booking?.booking_number || ''} was created from this quotation with locked pricing.`,
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Conversion Failed',
        message: err.response?.data?.message || err.message || 'Could not convert to booking.',
        type: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => quotationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      if (viewingQuotationId) setViewingQuotationId(null);
      showAlert({
        title: 'Quotation Removed',
        message: 'Quotation deleted successfully.',
        type: 'success',
      });
    },
    onError: (err) => {
      showAlert({
        title: 'Cannot Delete Quotation',
        message:
          err.response?.data?.message ||
          err.message ||
          'Could not delete quotation. Converted quotations must be preserved.',
        type: 'error',
      });
    },
  });

  // Quick Create Customer Mutation from inside Quotation Modal
  const createCustomerQuickMutation = useMutation({
    mutationFn: (data) => customerApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      const newCustomer = res?.data;
      if (newCustomer?.id) {
        setFormData((prev) => ({ ...prev, customer_id: newCustomer.id }));
        if (formErrors.customer_id) setFormErrors((p) => ({ ...p, customer_id: undefined }));
      }
      setIsQuickCustomerOpen(false);
      setQuickCustomerForm({ full_name: '', phone: '', email: '', city: '' });
      setQuickCustomerError('');
      showAlert({
        title: 'Customer Added',
        message: `${newCustomer?.full_name || 'Client'} has been created and automatically selected.`,
        type: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create customer';
      setQuickCustomerError(msg);
    },
  });

  const handleQuickCustomerSubmit = (e) => {
    e.preventDefault();
    if (!quickCustomerForm.full_name.trim()) {
      setQuickCustomerError('Customer name is required');
      return;
    }
    if (!quickCustomerForm.phone.trim()) {
      setQuickCustomerError('Phone number is required');
      return;
    }
    setQuickCustomerError('');
    createCustomerQuickMutation.mutate({
      full_name: quickCustomerForm.full_name.trim(),
      phone: quickCustomerForm.phone.trim(),
      email: quickCustomerForm.email.trim() || undefined,
      city: quickCustomerForm.city.trim() || undefined,
    });
  };

  // Selected customer object for preview card
  const selectedCustomer = useMemo(() => {
    if (!formData.customer_id) return null;
    return customers.find((c) => c.id === formData.customer_id) || null;
  }, [customers, formData.customer_id]);

  const resetForm = () => {
    setFormData({
      customer_id: '',
      valid_until: '',
      terms: '1. 50% advance booking deposit required to lock ceremony date.\n2. Travel & accommodation outside city limits charged additionally at actuals.\n3. Early morning starts before 6:00 AM incur a nominal artist commute charge.',
      discount_rupees: '',
      tax_rupees: '',
      items: [
        {
          description: '',
          quantity: 1,
          unit_price_rupees: '',
          service_id: null,
          package_id: null,
        },
      ],
    });
    setFormErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (quote) => {
    if (quote.status === 'ACCEPTED') {
      showAlert({
        title: 'Quotation Already Accepted',
        message: 'Accepted quotations are legally binding proposals and cannot be modified. You can duplicate or create a fresh quotation if requirements changed.',
        type: 'warning',
      });
      return;
    }

    const itemsMapped = (quote.quotation_items || []).map((i) => ({
      description: i.description || '',
      quantity: Number(i.quantity) || 1,
      unit_price_rupees: (Number(i.unit_price_paise) / 100).toString(),
      service_id: null,
      package_id: null,
    }));

    setFormData({
      customer_id: quote.customer_id || '',
      valid_until: quote.valid_until ? quote.valid_until.split('T')[0] : '',
      terms: quote.terms || '',
      discount_rupees:
        Number(quote.discount_paise) > 0 ? (Number(quote.discount_paise) / 100).toString() : '',
      tax_rupees:
        Number(quote.tax_paise) > 0 ? (Number(quote.tax_paise) / 100).toString() : '',
      items:
        itemsMapped.length > 0
          ? itemsMapped
          : [{ description: '', quantity: 1, unit_price_rupees: '', service_id: null, package_id: null }],
    });
    setFormErrors({});
    setEditingQuotation(quote);
  };

  // Add Item to Quotation Form
  const handleAddItem = (preset) => {
    if (preset?.type === 'SERVICE') {
      const s = preset.data;
      const priceRupees =
        Number(s.default_price_paise) > 0 ? (Number(s.default_price_paise) / 100).toString() : '';
      setFormData((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            description: s.name,
            quantity: 1,
            unit_price_rupees: priceRupees,
            service_id: s.id,
            package_id: null,
          },
        ],
      }));
    } else if (preset?.type === 'PACKAGE') {
      const p = preset.data;
      const priceRupees =
        Number(p.price_paise) > 0 ? (Number(p.price_paise) / 100).toString() : '';
      setFormData((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            description: `${p.name} (Bridal Combo Package)`,
            quantity: 1,
            unit_price_rupees: priceRupees,
            service_id: null,
            package_id: p.id,
          },
        ],
      }));
    } else {
      // Manual blank line item
      setFormData((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            description: '',
            quantity: 1,
            unit_price_rupees: '',
            service_id: null,
            package_id: null,
          },
        ],
      }));
    }
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      showAlert({
        title: 'Line Item Required',
        message: 'A quotation must have at least one line item.',
        type: 'warning',
      });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => {
        if (idx === index) {
          return { ...item, [field]: value };
        }
        return item;
      }),
    }));
  };

  // Validation
  const validateEditor = () => {
    const errors = {};
    if (!formData.customer_id) {
      errors.customer_id = 'Please select a customer/bride for this quotation';
    }

    if (!formData.items || formData.items.length === 0) {
      errors.items = 'At least one line item is required';
    } else {
      const itemErrors = [];
      formData.items.forEach((item, idx) => {
        if (!item.description || !item.description.trim()) {
          itemErrors[idx] = 'Item description is required';
        } else if (item.unit_price_rupees === '' || isNaN(Number(item.unit_price_rupees)) || Number(item.unit_price_rupees) < 0) {
          itemErrors[idx] = 'Enter valid unit price (₹)';
        }
      });
      if (itemErrors.length > 0) {
        errors.itemDetails = itemErrors;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateEditor()) return;

    // Build payload matching backend Zod schema
    const itemsPayload = formData.items.map((item) => ({
      description: item.description.trim(),
      quantity: Math.max(1, Number(item.quantity) || 1),
      unit_price_paise: Math.round(Number(item.unit_price_rupees) * 100),
      service_id: item.service_id || null,
      package_id: item.package_id || null,
    }));

    const discountPaise = formData.discount_rupees
      ? Math.round(Number(formData.discount_rupees) * 100)
      : 0;

    const taxPaise = formData.tax_rupees
      ? Math.round(Number(formData.tax_rupees) * 100)
      : 0;

    const payload = {
      customer_id: formData.customer_id,
      valid_until: formData.valid_until || null,
      terms: formData.terms.trim() || null,
      discount_paise: discountPaise,
      tax_paise: taxPaise,
      items: itemsPayload,
    };

    if (editingQuotation) {
      updateMutation.mutate({ id: editingQuotation.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Convert to Booking Modal Launcher
  const openConvertModal = (quote) => {
    if (quote.status !== 'ACCEPTED') {
      showAlert({
        title: 'Acceptance Required',
        message: `Quotation must be in 'Accepted' status before converting to a booking. Current status is '${STATUS_CONFIG[quote.status]?.label || quote.status}'. Would you like to mark it as Accepted first?`,
        type: 'warning',
      });
      return;
    }

    if (quote.bookings && quote.bookings.length > 0) {
      showAlert({
        title: 'Already Converted',
        message: `This quotation was already converted into booking ${quote.bookings[0].booking_number}. Duplicate bookings are prevented.`,
        type: 'info',
      });
      return;
    }

    const defaultDate = quote.enquiries?.event_date
      ? quote.enquiries.event_date.split('T')[0]
      : new Date().toISOString().split('T')[0];

    setConvertForm({
      event_date: defaultDate,
      event_kind: quote.enquiries?.event_kind || 'WEDDING',
      start_time: '06:00',
      end_time: '12:00',
      venue: '',
      city: quote.customers?.city || '',
      instructions: `Quotation Reference: ${quote.quotation_number}`,
      notes: `Agreed Quotation Total: ₹${(Number(quote.total_paise) / 100).toLocaleString('en-IN')}`,
    });
    setConvertingQuotation(quote);
  };

  const handleConvertSubmit = (e) => {
    e.preventDefault();
    if (!convertForm.event_date) {
      showAlert({
        title: 'Date Required',
        message: 'Please choose the ceremony event date.',
        type: 'warning',
      });
      return;
    }

    convertMutation.mutate({
      id: convertingQuotation.id,
      data: {
        event_date: convertForm.event_date,
        event_kind: convertForm.event_kind,
        start_time: convertForm.start_time || null,
        end_time: convertForm.end_time || null,
        venue: convertForm.venue.trim() || null,
        city: convertForm.city.trim() || null,
        instructions: convertForm.instructions.trim() || null,
        notes: convertForm.notes.trim() || null,
      },
    });
  };

  // Print Quotation Handler
  const handlePrintQuotation = () => {
    window.print();
  };

  // Share via WhatsApp
  const handleShareWhatsApp = (quote) => {
    const phone = quote.customers?.phone?.replace(/\D/g, '');
    const clientName = quote.customers?.full_name || 'Maam';
    const amountStr = formatINR(quote.total_paise);
    const studio = studioProfile?.name || 'Our Bridal Studio';

    const text = encodeURIComponent(
      `Hello ${clientName}! ✨\n\nHere is your official bridal makeover quotation from *${studio}*:\n\n` +
      `📋 *Quote Number:* ${quote.quotation_number}\n` +
      `💰 *Total Investment:* ${amountStr}\n` +
      `🗓️ *Valid Until:* ${formatDate(quote.valid_until)}\n\n` +
      `Please review the proposal breakdown. We look forward to creating your dream bridal looks! 💄`
    );

    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Safe Deletion
  const handleDeleteQuotation = async (quote) => {
    if (quote.bookings && quote.bookings.length > 0) {
      showAlert({
        title: 'Cannot Delete Converted Proposal',
        message: `This quotation is linked to active booking ${quote.bookings[0].booking_number}. Converted quotations are retained for audit integrity.`,
        type: 'warning',
      });
      return;
    }

    const confirmed = await showConfirm({
      title: 'Delete this quotation?',
      message: `Please confirm removal of quotation ${quote.quotation_number}. This will permanently remove the proposal.`,
      confirmText: 'Delete Proposal',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (confirmed) {
      deleteMutation.mutate(quote.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Itemized Quotations"
        subtitle="Create professional bridal quotations, manage client approvals, and convert accepted proposals into bookings."
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchQuotations()}
              disabled={isFetchingQuotations}
              title="Refresh Quotations"
              className="border-[#F0E7DE] hover:bg-stone-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingQuotations ? 'animate-spin' : ''}`} />
            </Button>

            <Button size="sm" onClick={openCreateModal} className="shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Quotation
            </Button>
          </div>
        }
      />

      {/* 2. Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-sm hover:border-orange-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Total Proposals</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#292524]">{metrics.total}</span>
            <span className="text-[11px] text-stone-400 font-medium">created</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-sm hover:border-sky-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Awaiting Response</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-700">{metrics.sent}</span>
            <span className="text-[11px] text-stone-400 font-medium">sent to brides</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-sm hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Accepted Proposals</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{metrics.accepted}</span>
            <span className="text-[11px] text-stone-400 font-medium">approved</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-[#F0E7DE] rounded-2xl shadow-sm hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500">Pipeline Quoted Value</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#C2410C] flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold text-[#292524]">
              {metrics.totalQuotedValuePaise > 0 ? formatINR(metrics.totalQuotedValuePaise) : '₹0'}
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#F0E7DE] shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by quotation number, bride name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#F0E7DE] bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] transition-all text-[#292524]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="w-full sm:w-56">
            <ModernDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={FILTER_STATUS_OPTIONS}
              placeholder="Filter by Status"
            />
          </div>

          {(searchTerm || statusFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
              }}
              className="text-stone-500 hover:text-stone-800 text-xs px-2.5 h-9 shrink-0"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* 4. Quotations List / Loading / Empty */}
      {isLoadingQuotations ? (
        <div className="py-16 flex flex-col items-center justify-center">
          <LoadingSpinner text="Loading quotations..." />
        </div>
      ) : isQuotationsError ? (
        <Card className="p-8 text-center border-rose-200 bg-rose-50/30 rounded-2xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-900 text-base">Unable to load quotations</h3>
          <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
            {quotationsError?.response?.data?.message ||
              quotationsError?.message ||
              "We couldn't retrieve your quotations. Please check your connection and try again."}
          </p>
          <Button size="sm" onClick={() => refetchQuotations()} className="mt-4">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </Card>
      ) : quotations.length === 0 ? (
        /* Empty Catalog */
        <Card className="p-12 text-center border-dashed border-2 border-stone-200 rounded-3xl bg-white shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-stone-900 text-lg">No quotations created</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
            Create professional bridal quotations with server-calculated subtotals, itemized artistry services,
            packages, and client discount terms. Convert approved proposals into bookings seamlessly.
          </p>
          <Button size="sm" onClick={openCreateModal} className="mt-6 shadow-md">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Your First Quotation
          </Button>
        </Card>
      ) : filteredQuotations.length === 0 ? (
        /* Filter Empty */
        <Card className="p-10 text-center border-stone-200 rounded-2xl bg-white shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-stone-900 text-sm">No matching quotations</h3>
          <p className="text-xs text-stone-500 mt-1">
            Try a different search term or clear your filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
            }}
            className="mt-4 border-[#F0E7DE]"
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        /* Quotation Cards / Structured Table */
        <div className="space-y-3.5">
          {filteredQuotations.map((q) => {
            const statusCfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.DRAFT;
            const hasBooking = q.bookings && q.bookings.length > 0;
            const isAccepted = q.status === 'ACCEPTED';

            return (
              <Card
                key={q.id}
                className="p-4 sm:p-5 border-[#F0E7DE] rounded-2xl hover:border-orange-200 transition-all bg-white shadow-xs hover:shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Proposal ID, Customer, Dates */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#C2410C] bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200/60">
                        {q.quotation_number}
                      </span>

                      <span
                        className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusCfg.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>

                      {hasBooking && (
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-purple-600" />
                          Booking: {q.bookings[0].booking_number}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <h4 className="font-bold text-[#292524] text-base truncate">
                        {q.customers?.full_name || 'Prospective Bride'}
                      </h4>
                      {q.customers?.phone && (
                        <span className="text-stone-500 flex items-center gap-1 text-[11px]">
                          <Phone className="w-3 h-3 text-stone-400" />
                          {q.customers.phone}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-500">
                      <span>Created: {formatDate(q.created_at)}</span>
                      {q.valid_until && <span>Valid until: {formatDate(q.valid_until)}</span>}
                      <span>Line Items: {q.quotation_items?.length || 0}</span>
                      {Number(q.discount_paise) > 0 && (
                        <span className="text-emerald-600 font-medium">
                          Discount: {formatINR(q.discount_paise)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Calculated Totals & Action Buttons */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                        Server-Verified Total
                      </div>
                      <div className="text-xl font-extrabold text-[#C2410C]">
                        {formatINR(q.total_paise)}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* View & Print Details */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingQuotationId(q.id)}
                        className="text-stone-600 hover:text-stone-900 text-xs px-2.5 h-8"
                        title="View Full Proposal Breakdown"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>

                      {/* Edit (if not accepted) */}
                      {!isAccepted && !hasBooking && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(q)}
                          className="border-[#F0E7DE] hover:border-orange-300 text-[#C2410C] text-xs px-2.5 h-8"
                          title="Edit Line Items & Terms"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                      )}

                      {/* Convert to Booking CTA */}
                      {isAccepted && !hasBooking && (
                        <Button
                          size="sm"
                          onClick={() => openConvertModal(q)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 h-8 shadow-xs"
                          title="Convert Accepted Quotation into Confirmed Booking"
                        >
                          <FileCheck className="w-3.5 h-3.5 mr-1" />
                          Convert to Booking
                        </Button>
                      )}

                      {/* Status Dropdown Quick Actions */}
                      <div className="relative group">
                        <ModernDropdown
                          value={q.status}
                          onChange={(newSt) => statusMutation.mutate({ id: q.id, status: newSt })}
                          options={[
                            { value: 'DRAFT', label: 'Mark as Draft' },
                            { value: 'SENT', label: 'Mark as Sent' },
                            { value: 'ACCEPTED', label: 'Mark as Accepted' },
                            { value: 'DECLINED', label: 'Mark as Declined' },
                            { value: 'EXPIRED', label: 'Mark as Expired' },
                          ]}
                          placeholder="Status"
                          className="w-32 h-8 text-[11px]"
                        />
                      </div>

                      {/* Share via WhatsApp */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShareWhatsApp(q)}
                        className="text-emerald-600 hover:bg-emerald-50 text-xs px-2 h-8"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>

                      {/* Delete (if not converted) */}
                      {!hasBooking && (
                        <button
                          type="button"
                          onClick={() => handleDeleteQuotation(q)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Quotation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          5. CREATE / EDIT QUOTATION MODAL
         ========================================================================= */}
      {(isCreateModalOpen || editingQuotation) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FFFDF9] sm:rounded-3xl w-full sm:max-w-4xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl border-0 sm:border border-[#F0E7DE] overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-[#F0E7DE] flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-[#FF6B00] text-white flex items-center justify-center shadow-sm shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#1F2937] text-sm sm:text-base leading-tight truncate">
                      {editingQuotation ? `Edit Quotation ${editingQuotation.quotation_number}` : 'Create Quotation'}
                    </h3>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#FF6B00] border border-orange-200">
                      VARNAM OFFICIAL
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#6B7280] mt-0.5 truncate">
                    Prepare a professional bridal service quotation for your client.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingQuotation(null);
                  resetForm();
                }}
                className="p-2 text-stone-400 hover:text-[#1F2937] rounded-xl hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
              {/* SECTION A: Client Information & Proposal Validity */}
              <div className="p-4 sm:p-5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF6B00] flex items-center justify-center">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    Client Information &amp; Validity
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickCustomerForm({ full_name: '', phone: '', email: '', city: '' });
                      setQuickCustomerError('');
                      setIsQuickCustomerOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00] hover:text-[#E05E00] bg-orange-50 hover:bg-orange-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Customer</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                      Select Customer / Bride <span className="text-red-500">*</span>
                    </label>
                    {customers.length === 0 ? (
                      <div className="text-xs text-amber-800 bg-amber-50 p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span>No customers found. Add your first customer to create a quotation.</span>
                        <button
                          type="button"
                          onClick={() => setIsQuickCustomerOpen(true)}
                          className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer text-left"
                        >
                          + Add Customer
                        </button>
                      </div>
                    ) : (
                      <ModernDropdown
                        value={formData.customer_id}
                        onChange={(val) => {
                          setFormData({ ...formData, customer_id: val });
                          if (formErrors.customer_id) setFormErrors((p) => ({ ...p, customer_id: undefined }));
                        }}
                        options={customers.map((c) => ({
                          value: c.id,
                          label: c.full_name,
                          subText: `${c.phone || ''}${c.email ? ' • ' + c.email : ''}${c.city ? ' • ' + c.city : ''}`,
                          searchTerms: `${c.full_name} ${c.phone || ''} ${c.email || ''} ${c.city || ''}`,
                        }))}
                        placeholder="Search by name, phone, or email..."
                        error={!!formErrors.customer_id}
                      />
                    )}
                    {formErrors.customer_id && (
                      <p className="text-[11px] text-rose-500 mt-1.5 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {formErrors.customer_id}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                      Quotation Validity Date (Optional)
                    </label>
                    <ModernDatePicker
                      value={formData.valid_until}
                      onChange={(dateStr) => setFormData({ ...formData, valid_until: dateStr })}
                      placeholder="Select validity date..."
                    />
                    <p className="text-[10px] text-[#6B7280] mt-1">
                      Proposal will automatically display as expired after this date
                    </p>
                  </div>
                </div>

                {/* Selected Customer Card Preview */}
                {selectedCustomer && (
                  <div className="mt-3 p-3 bg-[#FFF8F0] rounded-xl border border-orange-200/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#FF6B00] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {selectedCustomer.full_name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1F2937] flex items-center gap-2">
                          <span>{selectedCustomer.full_name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-white font-medium text-stone-600 border border-orange-200">
                            Verified Client
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6B7280] flex flex-wrap items-center gap-3 mt-0.5">
                          {selectedCustomer.phone && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-[#FF6B00]" /> {selectedCustomer.phone}
                            </span>
                          )}
                          {selectedCustomer.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#FF6B00]" /> {selectedCustomer.email}
                            </span>
                          )}
                          {selectedCustomer.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#FF6B00]" /> {selectedCustomer.city}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, customer_id: '' })}
                      className="text-[11px] text-stone-400 hover:text-stone-700 font-medium cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION B: Quick Insert from Artistry Catalog */}
              <div className="p-4 bg-white rounded-2xl border border-stone-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Quick Insert from Artistry Catalog
                  </span>
                  <span className="text-[11px] text-[#6B7280] font-medium hidden sm:inline">
                    Click to add item with preset rate
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 max-h-32 overflow-y-auto custom-scrollbar pt-0.5">
                  {/* Services Quick Chips */}
                  {availableServices.slice(0, 12).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleAddItem({ type: 'SERVICE', data: s })}
                      className="group inline-flex items-center gap-1.5 text-xs font-semibold bg-[#FFF8F0] hover:bg-[#FF6B00] hover:text-white text-[#1F2937] px-3 py-1.5 rounded-xl border border-orange-200/80 hover:border-[#FF6B00] shadow-2xs transition-all duration-150 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-[#FF6B00] group-hover:text-white transition-colors" />
                      <span>{s.name}</span>
                      {Number(s.default_price_paise) > 0 && (
                        <span className="text-[#6B7280] group-hover:text-orange-100 font-medium">
                          ({formatINR(s.default_price_paise)})
                        </span>
                      )}
                    </button>
                  ))}

                  {/* Packages Quick Chips */}
                  {availablePackages.slice(0, 6).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddItem({ type: 'PACKAGE', data: p })}
                      className="group inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200 hover:border-amber-600 shadow-2xs transition-all duration-150 cursor-pointer"
                    >
                      <Package className="w-3 h-3 text-amber-600 group-hover:text-white transition-colors" />
                      <span>{p.name}</span>
                      {Number(p.price_paise) > 0 && (
                        <span className="text-amber-700 group-hover:text-amber-100 font-medium">
                          ({formatINR(p.price_paise)})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION C: Itemized Line Items Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#FF6B00]" />
                      Itemized Services &amp; Offerings ({formData.items.length}) <span className="text-red-500">*</span>
                    </h4>
                    <p className="text-[11px] text-[#6B7280] mt-0.5 leading-relaxed">
                      Customise descriptions, quantities, and agreed prices
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddItem(null)}
                    className="text-xs border-orange-200 hover:border-[#FF6B00] hover:text-[#FF6B00] hover:bg-orange-50 h-8 px-3 rounded-xl shadow-2xs self-start sm:self-auto font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1 text-[#FF6B00]" /> Add Custom Item
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {formData.items.map((item, index) => {
                    const lineTotal = (Number(item.quantity) || 1) * (Number(item.unit_price_rupees) || 0);

                    return (
                      <div
                        key={index}
                        className="p-3.5 bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:border-[#FF6B00]/60 flex flex-col gap-2.5 transition-all"
                      >
                        {/* Description & Delete Row */}
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-orange-50 text-[#FF6B00] flex items-center justify-center text-[11px] font-bold shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              placeholder="e.g. Bridal Muhurtham HD Makeup & Hair Styling"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] font-medium text-[#1F2937] transition-all"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quantity, Unit Price, and Line Total in a single compact row */}
                        <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-stone-100">
                          {/* Qty */}
                          <div className="w-24 shrink-0">
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                className="w-full text-xs pl-3 pr-7 py-2 rounded-xl border border-stone-200 bg-stone-50/40 focus:bg-white text-center font-bold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-stone-400 pointer-events-none">
                                qty
                              </span>
                            </div>
                          </div>

                          {/* Unit Price */}
                          <div className="flex-1 max-w-[160px] shrink-0">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
                                ₹
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="Unit Price"
                                value={item.unit_price_rupees}
                                onChange={(e) => handleItemChange(index, 'unit_price_rupees', e.target.value)}
                                className="w-full text-xs pl-7 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50/40 focus:bg-white font-bold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition-all text-right"
                              />
                            </div>
                          </div>

                          {/* Total */}
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-stone-400 block font-medium">Line Total</span>
                            <span className="text-xs sm:text-sm font-black text-[#FF6B00]">
                              {lineTotal > 0 ? formatINR(lineTotal * 100) : '₹0'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {formErrors.items && (
                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {formErrors.items}
                  </p>
                )}
                {formErrors.itemDetails && formErrors.itemDetails.length > 0 && (
                  <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Please enter description and unit price for all line items.
                  </p>
                )}
              </div>

              {/* SECTION D: Additional Charges & Financial Summary */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-[#FFF8F0] to-orange-50/30 rounded-2xl border border-orange-200 shadow-2xs space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                  {/* Discounts & Taxes inputs */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-[#FF6B00]" /> Adjustments &amp; Financial Details
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#1F2937] mb-1">
                          Discount (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={formData.discount_rupees}
                            onChange={(e) => setFormData({ ...formData, discount_rupees: e.target.value })}
                            className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-orange-200 bg-white font-bold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] shadow-2xs transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#1F2937] mb-1">
                          Applicable Tax (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={formData.tax_rupees}
                            onChange={(e) => setFormData({ ...formData, tax_rupees: e.target.value })}
                            className="w-full text-xs pl-7 pr-3 py-2.5 rounded-xl border border-orange-200 bg-white font-bold text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] shadow-2xs transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Server Calculation Preview Box */}
                  <div className="p-4 bg-white rounded-2xl border border-orange-200 shadow-sm space-y-2">
                    <div className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center justify-between pb-1 border-b border-stone-100">
                      <span>Server Financial Summary</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono text-[9px] font-bold">
                        Backend Verified
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#1F2937] pt-0.5">
                      <span className="text-[#6B7280]">Itemized Subtotal:</span>
                      <span className="font-semibold">{formatINR(liveEstimate.subtotal * 100)}</span>
                    </div>

                    {liveEstimate.discount > 0 && (
                      <div className="flex items-center justify-between text-xs text-emerald-600">
                        <span>Discount Applied:</span>
                        <span className="font-semibold">-{formatINR(liveEstimate.discount * 100)}</span>
                      </div>
                    )}

                    {liveEstimate.tax > 0 && (
                      <div className="flex items-center justify-between text-xs text-[#1F2937]">
                        <span className="text-[#6B7280]">Taxes &amp; Levies:</span>
                        <span className="font-semibold">+{formatINR(liveEstimate.tax * 100)}</span>
                      </div>
                    )}

                    <div className="pt-2.5 border-t border-stone-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1F2937]">Grand Total:</span>
                      <span className="text-xl font-black text-[#FF6B00] tracking-tight">
                        {formatINR(liveEstimate.total * 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION E: Terms & Conditions */}
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1.5">
                  Terms &amp; Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Specify advance payment terms, travel charges, cancellation policy, and complimentary touch-ups."
                  className="w-full text-xs px-4 py-3 rounded-2xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] text-[#1F2937] resize-none transition-all shadow-2xs leading-relaxed"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#F0E7DE] sticky bottom-0 bg-[#FFFDF9] py-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingQuotation(null);
                    resetForm();
                  }}
                  className="border-stone-200 hover:bg-stone-50 rounded-xl px-4 text-xs h-9 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-[#FF6B00] hover:bg-[#E05E00] text-white rounded-xl shadow-sm px-5 text-xs h-9 font-bold cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-1.5" />
                  )}
                  {editingQuotation ? 'Save Quotation Changes' : 'Generate Quotation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          5B. QUICK ADD CUSTOMER MODAL
         ========================================================================= */}
      {isQuickCustomerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#F0E7DE] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1F2937]">Add New Bride / Client</h3>
                  <p className="text-[11px] text-[#6B7280]">Quickly add client profile to this quotation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCustomerOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {quickCustomerError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{quickCustomerError}</span>
              </div>
            )}

            <form onSubmit={handleQuickCustomerSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">
                  Full Name / Bride Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priyadharshini M"
                  value={quickCustomerForm.full_name}
                  onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, full_name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={quickCustomerForm.phone}
                  onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, phone: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. client@example.com"
                    value={quickCustomerForm.email}
                    onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, email: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1F2937] mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Madurai"
                    value={quickCustomerForm.city}
                    onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, city: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuickCustomerOpen(false)}
                  className="rounded-xl text-xs h-9 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createCustomerQuickMutation.isPending}
                  className="bg-[#FF6B00] hover:bg-[#E05E00] text-white rounded-xl text-xs h-9 font-bold cursor-pointer"
                >
                  {createCustomerQuickMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-1.5" />
                  )}
                  Save &amp; Select Bride
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. QUOTATION DETAILS & PRINTABLE VIEW DRAWER
         ========================================================================= */}
      {viewingQuotationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#F0E7DE] overflow-hidden">
            {/* Drawer Header with Print & Close */}
            <div className="px-6 py-4 bg-[#FFFDF9] border-b border-[#F0E7DE] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#292524] text-base leading-tight">
                    Quotation Details
                  </h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Official bridal proposal with itemized breakdown
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintQuotation}
                  className="border-[#F0E7DE] text-xs h-8"
                  title="Print official quotation"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print
                </Button>

                {selectedQuotation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareWhatsApp(selectedQuotation)}
                    className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs h-8"
                    title="Share via WhatsApp"
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Share
                  </Button>
                )}

                <button
                  type="button"
                  onClick={() => setViewingQuotationId(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar print:p-0 print:m-0">
              {isLoadingDetail || !selectedQuotation ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner text="Loading proposal breakdown..." />
                </div>
              ) : (
                <div className="space-y-6" id="printable-quotation">
                  {/* Studio Branding & Quotation Header */}
                  <div className="flex items-start justify-between pb-4 border-b border-[#F0E7DE]">
                    <div className="space-y-1">
                      <h2 className="text-xl font-extrabold text-[#F97316]">
                        {studioProfile?.name || 'VARNAM Bridal Studio'}
                      </h2>
                      <p className="text-xs text-stone-500">
                        {studioProfile?.city ? `${studioProfile.city}, ` : ''}{studioProfile?.state || 'India'}
                      </p>
                      {studioProfile?.businessPhone && (
                        <p className="text-xs text-stone-500">Phone: {studioProfile.businessPhone}</p>
                      )}
                      {studioProfile?.businessEmail && (
                        <p className="text-xs text-stone-500">Email: {studioProfile.businessEmail}</p>
                      )}
                    </div>

                    <div className="text-right space-y-1">
                      <span className="font-mono text-sm font-bold text-[#C2410C] bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
                        {selectedQuotation.quotation_number}
                      </span>
                      <p className="text-xs text-stone-500 mt-2">
                        Date: {formatDate(selectedQuotation.created_at)}
                      </p>
                      {selectedQuotation.valid_until && (
                        <p className="text-xs text-stone-500">
                          Valid Until: {formatDate(selectedQuotation.valid_until)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Client Information & Status */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50/70 border border-stone-200/80">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        Prepared For
                      </span>
                      <h4 className="text-sm font-bold text-[#292524] mt-0.5">
                        {selectedQuotation.customers?.full_name || 'Prospective Bride'}
                      </h4>
                      {selectedQuotation.customers?.phone && (
                        <p className="text-xs text-stone-500 mt-0.5">
                          {selectedQuotation.customers.phone}
                        </p>
                      )}
                      {selectedQuotation.customers?.email && (
                        <p className="text-xs text-stone-500">{selectedQuotation.customers.email}</p>
                      )}
                      {selectedQuotation.customers?.city && (
                        <p className="text-xs text-stone-500">{selectedQuotation.customers.city}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        Proposal Status
                      </span>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md border ${
                            STATUS_CONFIG[selectedQuotation.status]?.color || 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {STATUS_CONFIG[selectedQuotation.status]?.label || selectedQuotation.status}
                        </span>
                      </div>

                      {selectedQuotation.bookings && selectedQuotation.bookings.length > 0 && (
                        <p className="text-xs text-purple-700 font-semibold mt-2">
                          Confirmed Booking: #{selectedQuotation.bookings[0].booking_number}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                      Itemized Services & Pricing
                    </h4>
                    <div className="rounded-2xl border border-stone-200 overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                          <tr>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3 text-center w-16">Qty</th>
                            <th className="py-2.5 px-3 text-right w-24">Unit Price</th>
                            <th className="py-2.5 px-3 text-right w-28">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {(selectedQuotation.quotation_items || []).map((item) => (
                            <tr key={item.id} className="hover:bg-stone-50/50">
                              <td className="py-2.5 px-3 font-medium text-[#292524]">
                                {item.description}
                              </td>
                              <td className="py-2.5 px-3 text-center text-stone-600 font-bold">
                                {Number(item.quantity)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-stone-600">
                                {formatINR(item.unit_price_paise)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-[#C2410C]">
                                {formatINR(item.line_total_paise)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Breakdown Table */}
                  <div className="flex justify-end">
                    <div className="w-72 space-y-1.5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
                      <div className="flex items-center justify-between text-stone-600">
                        <span>Subtotal:</span>
                        <span className="font-semibold text-stone-900">
                          {formatINR(selectedQuotation.subtotal_paise)}
                        </span>
                      </div>

                      {Number(selectedQuotation.discount_paise) > 0 && (
                        <div className="flex items-center justify-between text-emerald-600 font-medium">
                          <span>Special Discount:</span>
                          <span>-{formatINR(selectedQuotation.discount_paise)}</span>
                        </div>
                      )}

                      {Number(selectedQuotation.tax_paise) > 0 && (
                        <div className="flex items-center justify-between text-stone-600">
                          <span>Taxes:</span>
                          <span>+{formatINR(selectedQuotation.tax_paise)}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                        <span className="font-bold text-stone-900 text-sm">Quoted Total:</span>
                        <span className="text-xl font-black text-[#C2410C]">
                          {formatINR(selectedQuotation.total_paise)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Notes */}
                  {selectedQuotation.terms && (
                    <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F0E7DE]">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                        Terms & Client Conditions
                      </span>
                      <p className="text-xs text-stone-600 whitespace-pre-line leading-relaxed">
                        {selectedQuotation.terms}
                      </p>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-4 border-t border-[#F0E7DE] flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-2">
                      {selectedQuotation.status === 'ACCEPTED' && (!selectedQuotation.bookings || selectedQuotation.bookings.length === 0) && (
                        <Button
                          size="sm"
                          onClick={() => {
                            const q = selectedQuotation;
                            setViewingQuotationId(null);
                            openConvertModal(q);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                        >
                          <FileCheck className="w-3.5 h-3.5 mr-1" />
                          Convert to Booking
                        </Button>
                      )}

                      {selectedQuotation.status !== 'ACCEPTED' && (!selectedQuotation.bookings || selectedQuotation.bookings.length === 0) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const q = selectedQuotation;
                            setViewingQuotationId(null);
                            openEditModal(q);
                          }}
                          className="text-xs border-[#F0E7DE] h-8"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingQuotationId(null)}
                      className="border-[#F0E7DE] text-xs h-8"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. CONVERT TO BOOKING CONFIRMATION MODAL
         ========================================================================= */}
      {convertingQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#F0E7DE] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-950 text-base leading-tight">
                    Convert Quotation to Booking
                  </h3>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Locks agreed quotation price into an active confirmed booking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConvertingQuotation(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversion Form */}
            <form onSubmit={handleConvertSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Quotation Reference:</span>
                  <span className="font-bold text-stone-900">{convertingQuotation.quotation_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Customer:</span>
                  <span className="font-bold text-stone-900">{convertingQuotation.customers?.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Agreed Price Snapshot:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    {formatINR(convertingQuotation.total_paise)}
                  </span>
                </div>
              </div>

              {/* Event Ceremony Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Event Ceremony Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                      Ceremony Date <span className="text-red-500">*</span>
                    </label>
                    <ModernDatePicker
                      value={convertForm.event_date}
                      onChange={(dateStr) => setConvertForm({ ...convertForm, event_date: dateStr })}
                      placeholder="Select ceremony date..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#292524] mb-1.5">
                      Event Type
                    </label>
                    <ModernDropdown
                      value={convertForm.event_kind}
                      onChange={(val) => setConvertForm({ ...convertForm, event_kind: val })}
                      options={EVENT_KIND_OPTIONS}
                      placeholder="Event kind"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#292524] mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={convertForm.start_time}
                      onChange={(e) => setConvertForm({ ...convertForm, start_time: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium text-[#292524] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#292524] mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={convertForm.end_time}
                      onChange={(e) => setConvertForm({ ...convertForm, end_time: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium text-[#292524] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1">
                    Ceremony Venue / Mandap
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ITC Grand Chola / Bride's Residence"
                    value={convertForm.venue}
                    onChange={(e) => setConvertForm({ ...convertForm, venue: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium text-[#292524] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292524] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai"
                    value={convertForm.city}
                    onChange={(e) => setConvertForm({ ...convertForm, city: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 bg-white font-medium text-[#292524] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Conversion Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConvertingQuotation(null)}
                  className="border-stone-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={convertMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  {convertMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-1.5" />
                  )}
                  Confirm & Create Booking
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
