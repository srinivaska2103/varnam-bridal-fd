'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  CalendarClock,
  Users,
  CalendarDays,
  Bell,
  ArrowRight,
  Sun,
  Sunrise,
  Moon,
  Clock,
  Sparkles,
  Phone,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  dashboardApi,
  enquiryApi,
  consultationApi,
  notificationApi,
} from '@/services/api/modules';
import { formatDate } from '@/utils/formatters';

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

export default function UserDashboardPage() {
  const params = useParams();
  const studioSlug = params?.businessSlug || 'srinivasbridalstudio';
  const { user, currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id;

  const greetingInfo = useMemo(() => getGreetingDetails(), []);
  const GreetingIcon = greetingInfo.Icon;

  // Indian Locale Formatted Date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Artist';

  // 1. Live Overview KPIs
  const { data: overviewRes, isLoading: loadingOverview } = useQuery({
    queryKey: ['user-dashboard-overview', businessId],
    queryFn: () => dashboardApi.getOverview(),
    enabled: !!businessId,
    staleTime: 60 * 1000,
  });

  // 2. Recent Enquiries
  const { data: enquiriesRes, isLoading: loadingEnquiries } = useQuery({
    queryKey: ['user-dashboard-enquiries', businessId],
    queryFn: () => enquiryApi.list({ limit: 5, sortBy: 'created_at', sortOrder: 'desc' }),
    enabled: !!businessId,
    staleTime: 30 * 1000,
  });

  // 3. Upcoming Consultations
  const { data: consultRes, isLoading: loadingConsult } = useQuery({
    queryKey: ['user-dashboard-consultations', businessId],
    queryFn: () => consultationApi.list({ limit: 5, status: 'CONFIRMED' }),
    enabled: !!businessId,
    staleTime: 30 * 1000,
  });

  const overview = overviewRes?.data || {};
  const recentEnquiries = enquiriesRes?.data?.enquiries || enquiriesRes?.data || [];
  const upcomingConsultations = consultRes?.data?.consultations || consultRes?.data || [];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Welcome Section — Identical Luxury Warm Cream Banner (Matching Image 2) */}
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
                  {currentBusiness?.name || 'Srinivas K A\'s Bridal Studio'}
                </span>
              </p>
            </div>
          </div>

          {/* Right Action: Create Enquiry */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/${studioSlug}/user/enquiries`}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-[#EA580C] hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 active:scale-98 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Enquiry</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Operational Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Enquiries */}
        <div className="bg-white rounded-2xl border border-[#F0E7DE] p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">New Enquiries</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {loadingOverview ? '—' : (overview.newEnquiriesCount ?? overview.totalEnquiries ?? 0)}
            </span>
          </div>
          <Link
            href={`/${studioSlug}/user/enquiries`}
            className="mt-3 text-xs font-bold text-[#F97316] hover:underline flex items-center gap-1"
          >
            <span>Review Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Consultations */}
        <div className="bg-white rounded-2xl border border-[#F0E7DE] p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Consultations</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {loadingOverview ? '—' : (overview.pendingConsultationsCount ?? upcomingConsultations.length)}
            </span>
          </div>
          <Link
            href={`/${studioSlug}/user/consultations`}
            className="mt-3 text-xs font-bold text-amber-700 hover:underline flex items-center gap-1"
          >
            <span>View Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-2xl border border-[#F0E7DE] p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Clients</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {loadingOverview ? '—' : (overview.totalCustomers ?? 0)}
            </span>
          </div>
          <Link
            href={`/${studioSlug}/user/customers`}
            className="mt-3 text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>Open Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Active Quotations */}
        <div className="bg-white rounded-2xl border border-[#F0E7DE] p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Quotations</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {loadingOverview ? '—' : (overview.totalQuotations ?? 'Active')}
            </span>
          </div>
          <Link
            href={`/${studioSlug}/user/quotations`}
            className="mt-3 text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
          >
            <span>Draft Proposals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Content Grid: Recent Enquiries & Upcoming Consultations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enquiries */}
        <div className="bg-white rounded-2xl border border-[#F0E7DE] p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#F0E7DE]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-stone-900">Recent Enquiries</h3>
            </div>
            <Link
              href={`/${studioSlug}/user/enquiries`}
              className="text-xs font-bold text-[#F97316] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="flex-1 divide-y divide-[#F0E7DE]/70">
            {loadingEnquiries ? (
              <div className="py-12 text-center text-xs text-stone-400">Loading enquiries...</div>
            ) : recentEnquiries.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">No recent client enquiries</div>
            ) : (
              recentEnquiries.slice(0, 5).map((enquiry) => (
                <div key={enquiry.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-800 truncate">
                      {enquiry.customer_name || enquiry.name || 'Anonymous Client'}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                      <span>{enquiry.service_interest || enquiry.ceremony_type || 'Bridal Enquiry'}</span>
                      {enquiry.customer_phone && (
                        <>
                          <span>•</span>
                          <span>{enquiry.customer_phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#C2410C] border border-orange-200/60 uppercase">
                    {enquiry.status || 'NEW'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Consultations */}
        <div className="bg-white rounded-2xl border border-[#F0E7DE] p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#F0E7DE]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <CalendarClock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-stone-900">Scheduled Consultations</h3>
            </div>
            <Link
              href={`/${studioSlug}/user/consultations`}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="flex-1 divide-y divide-[#F0E7DE]/70">
            {loadingConsult ? (
              <div className="py-12 text-center text-xs text-stone-400">Loading consultations...</div>
            ) : upcomingConsultations.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-400">No scheduled consultations</div>
            ) : (
              upcomingConsultations.slice(0, 5).map((consult) => (
                <div key={consult.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-800 truncate">
                      {consult.client_name || consult.customer?.full_name || 'Client Consultation'}
                    </p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {formatDate(consult.scheduled_date || consult.created_at)}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 uppercase">
                    {consult.status || 'SCHEDULED'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
