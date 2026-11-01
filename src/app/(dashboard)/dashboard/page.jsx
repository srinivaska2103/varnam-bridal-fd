
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CalendarCheck2,
  MessageSquare,
  IndianRupee,
  Plus,
  UserPlus,
  FileSpreadsheet,
  CreditCard,
  CalendarClock,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  ChevronRight,
  Sparkles,
  Phone,
  RefreshCw,
  X,
  Check,
  Sun,
  Moon,
  Sunrise,
} from 'lucide-react';
import { Card, Badge, EmptyState, Button, ModernDropdown, ModernDatePicker, ModernTimePicker } from '@/components/ui';
import { dashboardApi, bookingApi, enquiryApi, customerApi, packageApi } from '@/services/api/modules';
import { useAuthStore } from '@/store/authStore';
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { formatINR, formatDate } from '@/utils/formatters';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

/**
 * Skeleton Loader Component for Statistics Cards
 */
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#F0E7DE] p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-3 w-24 bg-stone-200 rounded" />
          <div className="h-7 w-28 bg-stone-200 rounded" />
          <div className="h-3 w-36 bg-stone-100 rounded" />
        </div>
        <div className="w-11 h-11 rounded-2xl bg-stone-100" />
      </div>
    </div>
  );
}

/**
 * Helper to get greeting and icon based on local time (Studio Theme: Warm Orange & Amber)
 */
function getGreetingDetails() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return {
      text: 'Good morning',
      Icon: Sunrise,
      iconColor: 'text-[#EA580C]',
      iconBg: 'bg-orange-50/90 border-orange-200/80 text-[#C2410C]',
      emoji: '🌅',
    };
  }
  if (hour < 17) {
    return {
      text: 'Good afternoon',
      Icon: Sun,
      iconColor: 'text-[#EA580C]',
      iconBg: 'bg-orange-50/90 border-orange-200/80 text-[#C2410C]',
      emoji: '☀️',
    };
  }
  return {
    text: 'Good evening',
    Icon: Moon,
    iconColor: 'text-[#EA580C]',
    iconBg: 'bg-orange-50/90 border-orange-200/80 text-[#C2410C]',
    emoji: '✨',
  };
}

/**
 * Helper to format Indian dates with time
 */
function formatEventDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export default function DashboardOverviewPage() {
  const { user, currentBusiness } = useAuthStore();
  const { hasActiveSubscription, isLoading: isAccessLoading } = useFeatureAccess();

  const isEmployeeUser = currentBusiness?.role === 'USER' || user?.role === 'USER';

  // 1. Fetch live overview KPI stats
  const {
    data: overviewRes,
    isLoading: loadingOverview,
    isError: errorOverview,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['dashboard-overview', currentBusiness?.id],
    queryFn: () => dashboardApi.getOverview(),
    enabled: !!currentBusiness?.id && hasActiveSubscription,
    staleTime: 60 * 1000,
  });

  // 2. Fetch live revenue analytics
  const {
    data: revenueRes,
    isLoading: loadingRevenue,
    isError: errorRevenue,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: ['dashboard-revenue', currentBusiness?.id],
    queryFn: () => dashboardApi.getRevenue(),
    enabled: !!currentBusiness?.id && hasActiveSubscription,
    staleTime: 60 * 1000,
  });

  // 3. Fetch upcoming 5 confirmed/active bookings
  const {
    data: bookingsRes,
    isLoading: loadingBookings,
    isError: errorBookings,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ['dashboard-upcoming-bookings', currentBusiness?.id],
    queryFn: () => bookingApi.list({ limit: 5, sortBy: 'created_at', sortOrder: 'desc' }),
    enabled: !!currentBusiness?.id && hasActiveSubscription,
    staleTime: 60 * 1000,
  });

  // 4. Fetch latest 5 enquiries
  const {
    data: enquiriesRes,
    isLoading: loadingEnquiries,
    isError: errorEnquiries,
    refetch: refetchEnquiries,
  } = useQuery({
    queryKey: ['dashboard-recent-enquiries', currentBusiness?.id],
    queryFn: () => enquiryApi.list({ limit: 5, sortBy: 'created_at', sortOrder: 'desc' }),
    enabled: !!currentBusiness?.id && hasActiveSubscription,
    staleTime: 60 * 1000,
  });

  const stats = overviewRes?.data || {};
  const revenueSummary = revenueRes?.data?.summary || {};
  const monthlyTrendsMap = revenueRes?.data?.monthly_collection_trends || {};
  const upcomingBookings = bookingsRes?.data?.bookings || [];
  const recentEnquiries = enquiriesRes?.data?.enquiries || [];

  // Modal State for "Create Enquiry Form"
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [enquiryFormData, setEnquiryFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    event_kind: 'WEDDING',
    event_date: '',
    event_venue: '',
    source: 'Instagram',
    notes: '',
  });

  // Modal State for "New Booking"
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [bookingFormSubmitting, setBookingFormSubmitting] = useState(false);
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState('');
  const [bookingErrorMessage, setBookingErrorMessage] = useState('');
  const [bookingFormErrors, setBookingFormErrors] = useState({});
  const [newBookingForm, setNewBookingForm] = useState({
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

  // Fetch Customers (for Booking Creation)
  const { data: customersData = [] } = useQuery({
    queryKey: ['customers-for-booking', currentBusiness?.id],
    queryFn: async () => {
      const res = await customerApi.list({ limit: 100 });
      return res.data?.customers || [];
    },
    enabled: !!currentBusiness?.id && isNewBookingModalOpen,
  });

  // Fetch Packages (for Booking Creation)
  const { data: packagesData = [] } = useQuery({
    queryKey: ['packages-for-booking', currentBusiness?.id],
    queryFn: async () => {
      const res = await packageApi.list();
      return res.data?.packages || [];
    },
    enabled: !!currentBusiness?.id && isNewBookingModalOpen,
  });

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
    setBookingFormErrors({});
    setBookingErrorMessage('');
    setBookingSuccessMessage('');
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

  const handleCreateBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingErrorMessage('');
    const errors = {};

    if (!newBookingForm.customer_id) {
      errors.customer_id = 'Please select a customer';
    }

    const totalPaise = Math.round(Number(newBookingForm.total_amount_rupees || 0) * 100);
    const discountPaise = Math.round(Number(newBookingForm.discount_rupees || 0) * 100);

    if (totalPaise < 0) {
      errors.total_amount_rupees = 'Total amount cannot be negative';
    }

    if (newBookingForm.has_event) {
      if (!newBookingForm.event_date) {
        errors.event_date = 'Event date is required';
      }
      if (!newBookingForm.event_kind) {
        errors.event_kind = 'Event kind is required';
      }
    }

    if (Object.keys(errors).length > 0) {
      setBookingFormErrors(errors);
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

    setBookingFormSubmitting(true);
    try {
      const res = await bookingApi.create(payload);
      setBookingSuccessMessage(`Booking ${res?.data?.booking_number || 'created'} successfully!`);
      refetchOverview();
      refetchRevenue();
      refetchBookings();
      setTimeout(() => {
        setIsNewBookingModalOpen(false);
        setBookingSuccessMessage('');
      }, 1200);
    } catch (err) {
      setBookingErrorMessage(
        err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to create booking'
      );
    } finally {
      setBookingFormSubmitting(false);
    }
  };

  const handleOpenEnquiryModal = () => {
    setEnquiryFormData({
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      event_kind: 'WEDDING',
      event_date: '',
      event_venue: '',
      source: 'Instagram',
      notes: '',
    });
    setFormSuccess(false);
    setFormError('');
    setEnquiryModalOpen(true);
  };

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (!enquiryFormData.customer_name.trim()) {
        throw new Error('Please enter bride/customer name');
      }
      if (!enquiryFormData.customer_phone.trim()) {
        throw new Error('Please enter customer phone number');
      }

      await enquiryApi.create({
        customer_name: enquiryFormData.customer_name.trim(),
        customer_phone: enquiryFormData.customer_phone.trim(),
        customer_email: enquiryFormData.customer_email.trim() || undefined,
        event_kind: enquiryFormData.event_kind,
        event_date: enquiryFormData.event_date ? new Date(enquiryFormData.event_date).toISOString() : undefined,
        event_venue: enquiryFormData.event_venue.trim() || undefined,
        source: enquiryFormData.source,
        notes: enquiryFormData.notes.trim() || undefined,
      });

      setFormSuccess(true);
      // Invalidate queries so dashboard reflects live real data immediately
      refetchEnquiries();
      refetchOverview();
      setTimeout(() => {
        setEnquiryModalOpen(false);
        setFormSuccess(false);
      }, 1200);
    } catch (err) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to create enquiry');
    } finally {
      setFormLoading(false);
    }
  };

  // Parse time-series monthly revenue trends into Recharts format
  const chartData = useMemo(() => {
    const entries = Object.entries(monthlyTrendsMap);
    if (entries.length === 0) return [];
    return entries.map(([month, paise]) => {
      // month is in YYYY-MM format
      let formattedMonth = month;
      try {
        const [year, m] = month.split('-');
        const date = new Date(Number(year), Number(m) - 1, 1);
        formattedMonth = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      } catch {
        // Fallback
      }
      return {
        rawMonth: month,
        month: formattedMonth,
        revenueInr: Number((paise / 100).toFixed(0)),
        revenueFormatted: formatINR(paise),
      };
    });
  }, [monthlyTrendsMap]);

  // First name for greeting
  const firstName = user?.name ? user.name.split(' ')[0] : 'Artist';

  // Indian Locale Formatted Date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  // Time-aware greeting details and icon
  const greetingInfo = useMemo(() => getGreetingDetails(), []);
  const GreetingIcon = greetingInfo.Icon;

  // Render Limited Subscription Onboarding Screen if no active plan (only for ADMIN; never for employee USER)
  if (!isAccessLoading && !hasActiveSubscription && !isEmployeeUser) {
    return (
      <div className="space-y-6 pb-12">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-[#FFFBF7] to-orange-50/50 border border-orange-200/70 p-5 sm:p-7 shadow-xs">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold bg-white border border-orange-200/80 text-stone-700 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                <span className="capitalize">{todayFormatted}</span>
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-[11px] border shadow-2xs ${greetingInfo.iconBg}`}>
                <GreetingIcon className={`w-3.5 h-3.5 ${greetingInfo.iconColor}`} />
                <span>{greetingInfo.text}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#292524] tracking-tight flex items-center flex-wrap gap-2">
              <span>{greetingInfo.text},</span>
              <span className="text-[#EA580C] capitalize font-extrabold">
                {firstName}
              </span>
              <span className="inline-block transform hover:rotate-12 transition-transform origin-bottom-right cursor-default select-none text-2xl sm:text-3xl">
                {greetingInfo.emoji}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Complete your subscription to unlock the full bridal management suite for{' '}
              <span className="font-bold text-[#C2410C] bg-orange-100/70 px-2 py-0.5 rounded-md border border-orange-200/60 inline-block">
                {currentBusiness?.name || 'your studio'}
              </span>.
            </p>
          </div>
        </div>

        {/* Subscription Onboarding Hero */}
        <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-3xl border border-orange-200/80 p-8 sm:p-12 shadow-sm text-center max-w-3xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-white border border-orange-200 text-[#EA580C] flex items-center justify-center mx-auto shadow-sm">
            <CreditCard className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#C2410C] border border-orange-200">
              <Sparkles className="w-3.5 h-3.5" />
              Account Created • No Active Plan
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Choose a Subscription Plan to Get Started
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
              Your business profile is created. Unlock client management, booking calendars, quotations, financial records, expenses, and branded website capabilities by choosing an eligible plan.
            </p>
          </div>

          {/* Quick Plan Comparison Pill */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <div className="text-xs font-bold text-stone-900">Starter</div>
              <div className="text-lg font-extrabold text-[#EA580C] mt-0.5">₹599<span className="text-[10px] text-stone-400 font-normal">/mo</span></div>
              <p className="text-[11px] text-stone-500 mt-1">Core CRM, bookings, calendar, quotations & payments.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border-2 border-orange-400 shadow-xs relative">
              <span className="absolute -top-2 right-3 text-[9px] font-bold bg-orange-600 text-white px-2 py-0.2 rounded-full uppercase">Popular</span>
              <div className="text-xs font-bold text-stone-900">Growth</div>
              <div className="text-lg font-extrabold text-[#EA580C] mt-0.5">₹999<span className="text-[10px] text-stone-400 font-normal">/mo</span></div>
              <p className="text-[11px] text-stone-500 mt-1">All Starter + Public branded website & enquiry capture.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <div className="text-xs font-bold text-stone-900">Premium</div>
              <div className="text-lg font-extrabold text-[#EA580C] mt-0.5">₹29,999<span className="text-[10px] text-stone-400 font-normal"> one-time</span></div>
              <p className="text-[11px] text-stone-500 mt-1">Custom domain (.com/.in) & dedicated cloud server.</p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/subscription" className="w-full sm:w-auto">
              <Button
                variant="primary"
                className="w-full text-xs font-bold py-3 px-8 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Select a Plan & Subscribe</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/settings" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                className="w-full text-xs font-semibold py-3 px-6 rounded-xl cursor-pointer"
              >
                Studio Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Welcome Section — Modern, Responsive Luxury Studio Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-[#FFFBF7] to-orange-50/50 border border-orange-200/70 p-5 sm:p-7 shadow-xs">
        {/* Soft background ambient glow */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 w-44 h-44 bg-amber-300/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
          {/* Left: Greeting, Date & Studio Context */}
          <div className="space-y-2.5 max-w-2xl">
            {/* Top row: Date pill + Time of day badge */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold bg-white border border-orange-200/80 text-stone-700 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
                <span className="capitalize">{todayFormatted}</span>
              </span>

              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold text-[11px] border shadow-2xs ${greetingInfo.iconBg}`}>
                <GreetingIcon className={`w-3.5 h-3.5 ${greetingInfo.iconColor}`} />
                <span>{greetingInfo.text}</span>
              </span>
            </div>

            {/* Main Greeting Heading */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#292524] tracking-tight flex items-center flex-wrap gap-2">
                <span>{greetingInfo.text},</span>
                <span className="text-[#EA580C] capitalize font-extrabold">
                  {firstName}
                </span>
                <span className="inline-block transform hover:rotate-12 transition-transform origin-bottom-right cursor-default select-none text-2xl sm:text-3xl">
                  {greetingInfo.emoji}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Here&apos;s your daily studio briefing for{' '}
                <span className="font-bold text-[#C2410C] bg-orange-100/70 px-2 py-0.5 rounded-md border border-orange-200/60 inline-block">
                  {currentBusiness?.name || 'your beauty studio'}
                </span>
                .
              </p>
            </div>
          </div>

          {/* Right: Quick Actions & Status Summary Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap shrink-0 pt-1 lg:pt-0">
            <Button
              size="sm"
              onClick={handleOpenNewBooking}
              className="bg-gradient-to-r from-[#F97316] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-semibold py-2.5 px-4 sm:px-5 rounded-xl shadow-xs hover:shadow-md transition-all gap-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Booking</span>
            </Button>

            <button
              onClick={() => {
                refetchOverview();
                refetchRevenue();
                refetchBookings();
                refetchEnquiries();
              }}
              title="Refresh statistics"
              className="p-2.5 text-stone-500 hover:text-stone-900 bg-white border border-[#F0E7DE] rounded-xl hover:bg-stone-100 hover:border-stone-300 transition-all shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Refresh dashboard data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingOverview ? 'animate-spin text-[#F97316]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Overview Statistics (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingOverview ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : errorOverview ? (
          <div className="col-span-full bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Could not load live business statistics. Check your studio authorization.</span>
            </div>
            <button
              onClick={() => refetchOverview()}
              className="text-xs font-semibold underline text-rose-700 hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Card 1: Total Bookings */}
            <div className="bg-white rounded-2xl border border-[#F0E7DE] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                    Total Bookings
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#292524] mt-1.5">
                    {stats.bookings?.total_in_period ?? 0}
                  </h3>
                  <p className="text-xs text-[#78716C] mt-1">
                    Confirmed: <span className="font-semibold text-stone-800">{stats.bookings?.confirmed ?? 0}</span>
                    {stats.bookings?.completed ? ` • Completed: ${stats.bookings.completed}` : ''}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F97316] flex items-center justify-center border border-orange-100 shrink-0">
                  <CalendarDays className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Card 2: Upcoming Bookings */}
            <div className="bg-white rounded-2xl border border-[#F0E7DE] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                    Upcoming Bookings
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#292524] mt-1.5">
                    {stats.bookings?.upcoming ?? 0}
                  </h3>
                  <p className="text-xs text-[#78716C] mt-1">
                    Value:{' '}
                    <span className="font-semibold text-stone-800">
                      {formatINR(stats.bookings?.total_booking_value_paise || 0)}
                    </span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 shrink-0">
                  <CalendarCheck2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Card 3: Total Enquiries */}
            <div className="bg-white rounded-2xl border border-[#F0E7DE] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                    Total Enquiries
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#292524] mt-1.5">
                    {stats.enquiries?.total ?? 0}
                  </h3>
                  <p className="text-xs text-[#78716C] mt-1">
                    Conversion Rate:{' '}
                    <span className="font-semibold text-emerald-700">
                      {stats.enquiries?.conversion_rate_percentage ?? 0}%
                    </span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100 shrink-0">
                  <MessageSquare className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Card 4: Revenue (Actual Recorded Cash Received) */}
            <div className="bg-white rounded-2xl border border-[#F0E7DE] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                    Revenue Collected
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1.5">
                    {formatINR(stats.financials?.payments_collected_paise || 0)}
                  </h3>
                  <p className="text-xs text-[#78716C] mt-1">
                    Outstanding:{' '}
                    <span className="font-semibold text-amber-700">
                      {formatINR(stats.financials?.outstanding_customer_payments_paise || 0)}
                    </span>
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
                  <IndianRupee className="w-6 h-6" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Quick-Action Buttons Strip */}
      <div className="bg-white rounded-2xl border border-[#F0E7DE] p-4 shadow-xs">
        <div className="text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-3">
          Quick Studio Actions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            href="/customers"
            className="flex items-center gap-2.5 p-3 rounded-xl border border-[#F0E7DE] bg-[#FFFDF9] hover:bg-orange-50/50 hover:border-[#F97316]/40 transition-colors text-xs font-medium text-[#292524]"
          >
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#C2410C] flex items-center justify-center shrink-0">
              <UserPlus className="w-3.5 h-3.5" />
            </div>
            <span>Add Customer</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenEnquiryModal}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-[#F0E7DE] bg-[#FFFDF9] hover:bg-orange-50/50 hover:border-[#F97316]/40 transition-colors text-xs font-medium text-[#292524] text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <span>Create Enquiry Form</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewBooking}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-[#F0E7DE] bg-[#FFFDF9] hover:bg-orange-50/50 hover:border-[#F97316]/40 transition-colors text-xs font-medium text-[#292524] text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Create Booking</span>
          </button>

          <Link
            href="/payments"
            className="flex items-center gap-2.5 p-3 rounded-xl border border-[#F0E7DE] bg-[#FFFDF9] hover:bg-orange-50/50 hover:border-[#F97316]/40 transition-colors text-xs font-medium text-[#292524]"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
            <span>Add Payment</span>
          </Link>

          <Link
            href="/quotations"
            className="flex items-center gap-2.5 p-3 rounded-xl border border-[#F0E7DE] bg-[#FFFDF9] hover:bg-orange-50/50 hover:border-[#F97316]/40 transition-colors text-xs font-medium text-[#292524]"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <span>Create Quotation</span>
          </Link>
        </div>
      </div>

      {/* 4. Revenue Overview & Booking Calendar Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#F0E7DE] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F0E7DE]">
            <div>
              <h3 className="font-semibold text-[#292524] text-base">Revenue Overview</h3>
              <p className="text-xs text-[#78716C] mt-0.5">
                Actual recorded customer payments received across calendar months
              </p>
            </div>
            <Link
              href="/payments"
              className="text-xs font-semibold text-[#F97316] hover:text-[#C2410C] flex items-center gap-1"
            >
              <span>View Payments</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingRevenue ? (
            <div className="h-64 flex items-center justify-center text-xs text-stone-400">
              Loading revenue chart...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-stone-50/50 rounded-xl border border-dashed border-[#F0E7DE]">
              <IndianRupee className="w-8 h-8 text-stone-300 mb-2" />
              <div className="text-xs font-medium text-stone-600">No payment records yet</div>
              <p className="text-[11px] text-stone-400 mt-1 max-w-xs">
                As you record client payments and advances, monthly collection totals will appear here.
              </p>
              <Link href="/payments" className="mt-3">
                <Button size="sm" variant="secondary" className="text-xs">Record First Payment</Button>
              </Link>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0E7DE" />
                  <XAxis dataKey="month" stroke="#78716C" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#78716C"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Payments Collected']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #F0E7DE',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    }}
                  />
                  <Bar dataKey="revenueInr" fill="#F97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Calendar Preview Card */}
        <div className="bg-white rounded-2xl border border-[#F0E7DE] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F0E7DE]">
            <div>
              <h3 className="font-semibold text-[#292524] text-base">Calendar Preview</h3>
              <p className="text-xs text-[#78716C] mt-0.5">Upcoming scheduled dates</p>
            </div>
            <Link
              href="/calendar"
              className="text-xs font-semibold text-[#F97316] hover:text-[#C2410C] flex items-center gap-1"
            >
              <span>Full Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {upcomingBookings.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No Scheduled Dates"
                description="Upcoming wedding dates, receptions, and trials will show here."
              />
            ) : (
              upcomingBookings.slice(0, 4).map((b) => {
                const event = b.events?.[0] || b.booking_events?.[0];
                const eventDate = event?.event_date ? formatEventDate(event.event_date) : formatDate(b.created_at);
                const eventTitle = event?.title || b.package_name_snapshot || 'Bridal Makeup';
                const customer = b.customer || b.customers;
                const customerName = customer?.full_name || 'Valued Bride';

                return (
                  <div
                    key={b.id}
                    className="p-3 rounded-xl border border-[#F0E7DE] bg-[#FFFDF9] hover:border-[#F97316]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold text-[#292524] truncate">
                          {customerName}
                        </div>
                        <div className="text-[11px] text-[#78716C] truncate mt-0.5">
                          {eventTitle}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-[#C2410C] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full shrink-0">
                        {event?.event_kind || b.status}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#F0E7DE]/60 flex items-center justify-between text-[11px] text-[#78716C]">
                      <span className="flex items-center gap-1 text-stone-600 font-medium">
                        <Clock className="w-3 h-3 text-[#F97316]" />
                        {eventDate}
                      </span>
                      {event?.venue && (
                        <span className="flex items-center gap-1 truncate max-w-[120px]">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate">{event.venue}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. Tables: Upcoming Bridal Bookings & Recent Enquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bridal Bookings Card */}
        <div className="bg-white rounded-2xl border border-[#F0E7DE] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F0E7DE]">
            <div>
              <h3 className="font-semibold text-[#292524] text-base">Upcoming Bridal Bookings</h3>
              <p className="text-xs text-[#78716C] mt-0.5">Next 5 bookings registered in studio</p>
            </div>
            <Link
              href="/bookings"
              className="text-xs font-semibold text-[#F97316] hover:text-[#C2410C] flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingBookings ? (
            <div className="py-8 text-center text-xs text-stone-400">Loading bookings...</div>
          ) : upcomingBookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming bookings"
              description="Confirmed client bookings will appear here."
              action={
                <Link href="/bookings">
                  <Button size="sm" variant="secondary">Create First Booking</Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-[#F0E7DE]">
              {upcomingBookings.map((booking) => {
                const event = booking.events?.[0] || booking.booking_events?.[0];
                const eventDate = event?.event_date ? formatEventDate(event.event_date) : formatDate(booking.created_at);
                const eventName = event?.title || booking.package_name_snapshot || 'Bridal Makeover';
                const customer = booking.customer || booking.customers;
                const customerName = customer?.full_name || 'Client';

                return (
                  <div key={booking.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#292524] truncate">
                          {customerName}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {booking.booking_number}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#78716C] mt-0.5 truncate flex items-center gap-2">
                        <span>{eventName} • <span className="text-stone-700 font-medium">{eventDate}</span></span>
                        {customer?.phone && (
                          <span className="hidden sm:inline text-stone-400">• {customer.phone}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-stone-900">
                        {formatINR(booking.total_amount_paise || 0)}
                      </div>
                      <span className="inline-block mt-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {booking.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Enquiries Card */}
        <div className="bg-white rounded-2xl border border-[#F0E7DE] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#F0E7DE]">
            <div>
              <h3 className="font-semibold text-[#292524] text-base">Recent Enquiries</h3>
              <p className="text-xs text-[#78716C] mt-0.5">Latest client enquiries and CRM leads</p>
            </div>
            <Link
              href="/enquiries"
              className="text-xs font-semibold text-[#F97316] hover:text-[#C2410C] flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingEnquiries ? (
            <div className="py-8 text-center text-xs text-stone-400">Loading enquiries...</div>
          ) : recentEnquiries.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No recent enquiries"
              description="New bridal enquiries and prospective bride leads will show here."
              action={
                <Link href="/enquiries">
                  <Button size="sm" variant="secondary">Add New Enquiry</Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-[#F0E7DE]">
              {recentEnquiries.map((enquiry) => {
                const dateStr = formatEventDate(enquiry.created_at);
                const eventKind = enquiry.event_kind || 'Bridal';

                // Status badge styling
                const isNew = enquiry.status === 'NEW';
                const isConverted = enquiry.status === 'CONVERTED';

                return (
                  <div key={enquiry.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#292524] truncate">
                          {enquiry.customer_name || 'Prospective Client'}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {enquiry.source || 'Manual'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#78716C] mt-0.5 truncate">
                        {eventKind} • Received on {dateStr}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          isNew
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : isConverted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-stone-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        {enquiry.status}
                      </span>
                      <Link
                        href={`/enquiries`}
                        className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100"
                        title="View Enquiry"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* 6. Create Enquiry Form Modal */}
      {enquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#F0E7DE] shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E7DE] mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Create Enquiry Form</h3>
                  <p className="text-xs text-stone-500">Add a new bridal enquiry or prospective client lead</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnquiryModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-stone-900">Enquiry Created!</h4>
                <p className="text-xs text-stone-500">Live dashboard and enquiry pipeline have been updated.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateEnquiry} className="space-y-4">
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
                      value={enquiryFormData.customer_name}
                      onChange={(e) => setEnquiryFormData({ ...enquiryFormData, customer_name: e.target.value })}
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
                      value={enquiryFormData.customer_phone}
                      onChange={(e) => setEnquiryFormData({ ...enquiryFormData, customer_phone: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Event Type
                    </label>
                    <ModernDropdown
                      value={enquiryFormData.event_kind}
                      onChange={(val) => setEnquiryFormData({ ...enquiryFormData, event_kind: val })}
                      options={[
                        { value: 'WEDDING', label: 'Wedding / Muhurtham' },
                        { value: 'ENGAGEMENT', label: 'Engagement' },
                        { value: 'RECEPTION', label: 'Reception' },
                        { value: 'SANGEET', label: 'Sangeet / Mehendi' },
                        { value: 'TRIAL', label: 'Bridal Trial' },
                        { value: 'OTHER', label: 'Other Party / Event' },
                      ]}
                      placeholder="Select Event Type"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Event Date
                    </label>
                    <ModernDatePicker
                      value={enquiryFormData.event_date}
                      onChange={(val) => setEnquiryFormData({ ...enquiryFormData, event_date: val })}
                      placeholder="Select Event Date"
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
                      value={enquiryFormData.event_venue}
                      onChange={(e) => setEnquiryFormData({ ...enquiryFormData, event_venue: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Lead Source
                    </label>
                    <ModernDropdown
                      value={enquiryFormData.source}
                      onChange={(val) => setEnquiryFormData({ ...enquiryFormData, source: val })}
                      options={[
                        { value: 'Instagram', label: 'Instagram' },
                        { value: 'WhatsApp', label: 'WhatsApp' },
                        { value: 'Website', label: 'Website Form' },
                        { value: 'Walk-in', label: 'Walk-in / Studio Visit' },
                        { value: 'Referral', label: 'Word of Mouth / Referral' },
                      ]}
                      placeholder="Select Lead Source"
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
                    value={enquiryFormData.customer_email}
                    onChange={(e) => setEnquiryFormData({ ...enquiryFormData, customer_email: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Special Notes / Service Requirements
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Looking for HD Bridal makeup + saree draping and hairstyle for morning muhurtham"
                    value={enquiryFormData.notes}
                    onChange={(e) => setEnquiryFormData({ ...enquiryFormData, notes: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#F0E7DE] bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316] resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#F0E7DE]">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEnquiryModalOpen(false)}
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
            )}
          </div>
        </div>
      )}
      {/* 7. Create New Booking Modal */}
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
                type="button"
                onClick={() => setIsNewBookingModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccessMessage ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-stone-900">Booking Created!</h4>
                <p className="text-xs text-stone-500">{bookingSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateBookingSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                {bookingErrorMessage && (
                  <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{bookingErrorMessage}</span>
                  </div>
                )}

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
                    error={bookingFormErrors.customer_id}
                  />
                  {customersData.length === 0 && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      No customers found yet. Create a customer first using the Add Customer button.
                    </p>
                  )}
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
                    {bookingFormErrors.total_amount_rupees && (
                      <p className="text-xs text-rose-500 mt-1">{bookingFormErrors.total_amount_rupees}</p>
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
                            options={[
                              { value: 'WEDDING', label: 'Wedding / Muhurtham' },
                              { value: 'RECEPTION', label: 'Reception' },
                              { value: 'ENGAGEMENT', label: 'Engagement / Nichayathartham' },
                              { value: 'SANGEET', label: 'Sangeet' },
                              { value: 'MEHENDI', label: 'Mehendi' },
                              { value: 'HALDI', label: 'Haldi' },
                              { value: 'TRIAL', label: 'Bridal Trial' },
                              { value: 'OTHER', label: 'Other Ceremony' },
                            ]}
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
                            error={bookingFormErrors.event_date}
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
                    disabled={bookingFormSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={bookingFormSubmitting}
                    className="bg-[#F97316] hover:bg-[#ea580c] text-white"
                  >
                    {bookingFormSubmitting ? 'Saving Booking...' : 'Create Booking'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
