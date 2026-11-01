'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  X,
  User,
  CalendarCheck,
  AlertCircle,
  Tag,
  ArrowRight,
  CheckCircle2,
  ListFilter,
  Plus,
} from 'lucide-react';
import {
  Card,
  PageHeader,
  Button,
  LoadingSpinner,
  Badge,
  ModernDropdown,
} from '@/components/ui';
import { consultationApi } from '@/services/api/modules';
import { useAuthStore } from '@/store/authStore';

const CATEGORY_CONFIG = {
  ALL: { label: 'All Events', color: 'bg-stone-100 text-stone-700' },
  CONSULTATION: {
    label: 'Consultation',
    color: 'bg-orange-50 text-orange-700 border-orange-200/80',
    chipBg: 'bg-orange-50 text-[#C2410C] border-orange-200',
    badge: 'bg-orange-500',
    dot: 'bg-[#F97316]',
  },
  FOLLOW_UP: {
    label: 'Follow-up',
    color: 'bg-blue-50 text-blue-700 border-blue-200/80',
    chipBg: 'bg-blue-50 text-blue-700 border-blue-200',
    badge: 'bg-blue-500',
    dot: 'bg-blue-500',
  },
  BOOKING: {
    label: 'Confirmed Booking',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    chipBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badge: 'bg-emerald-500',
    dot: 'bg-emerald-500',
  },
};

export default function CentralizedCalendarPage() {
  const { currentBusiness, user } = useAuthStore();
  const studioSlug = currentBusiness?.slug || currentBusiness?.businessSlug || 'srinivasbridalstudio';
  const role = currentBusiness?.role || user?.role || 'ADMIN';
  const isAdmin = role === 'OWNER' || role === 'MANAGER' || role === 'ADMIN';

  // Navigation Prefix
  const basePath = isAdmin ? `/${studioSlug}/admin` : `/${studioSlug}/user`;

  // Views: 'month' | 'week' | 'day'
  const [viewMode, setViewMode] = useState('month');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => new Date().toISOString().split('T')[0]);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // ALL, CONSULTATION, FOLLOW_UP, BOOKING
  const [searchTerm, setSearchTerm] = useState('');

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Compute active date range based on viewMode & currentDate
  const calendarRange = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();

    if (viewMode === 'month') {
      const firstDay = new Date(y, m, 1);
      const startStr = new Date(y, m, 1 - firstDay.getDay()).toISOString().split('T')[0];
      const endStr = new Date(y, m + 1, 14).toISOString().split('T')[0];
      return { startDate: startStr, endDate: endStr };
    } else if (viewMode === 'week') {
      const curr = new Date(currentDate);
      const first = curr.getDate() - curr.getDay();
      const startStr = new Date(curr.setDate(first)).toISOString().split('T')[0];
      const endStr = new Date(curr.setDate(first + 6)).toISOString().split('T')[0];
      return { startDate: startStr, endDate: endStr };
    } else {
      // Day view
      const dStr = currentDate.toISOString().split('T')[0];
      return { startDate: dStr, endDate: dStr };
    }
  }, [currentDate, viewMode]);

  // API Query
  const {
    data: calendarData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['centralized-calendar', calendarRange],
    queryFn: async () => {
      const res = await consultationApi.getCalendar(calendarRange);
      return res.data;
    },
  });

  const rawEvents = calendarData?.calendar || [];
  const nextPendingFollowUp = calendarData?.nextPendingFollowUp || null;
  const counts = calendarData?.counts || {
    totalEvents: 0,
    consultationsCount: 0,
    followUpsCount: 0,
    bridalBookingsCount: 0,
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return rawEvents.filter((ev) => {
      // Category filter
      if (categoryFilter !== 'ALL' && ev.eventType !== categoryFilter) {
        return false;
      }
      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nameMatch = ev.customerName?.toLowerCase().includes(term);
        const titleMatch = ev.title?.toLowerCase().includes(term);
        const bookingNumMatch = ev.bookingNumber?.toLowerCase().includes(term);
        const venueMatch = ev.venue?.toLowerCase().includes(term) || ev.location?.toLowerCase().includes(term);
        if (!nameMatch && !titleMatch && !bookingNumMatch && !venueMatch) {
          return false;
        }
      }
      return true;
    });
  }, [rawEvents, categoryFilter, searchTerm]);

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const ev of filteredEvents) {
      const d = ev.eventDate || (ev.scheduled_start ? ev.scheduled_start.split('T')[0] : null);
      if (d) {
        if (!map[d]) map[d] = [];
        map[d].push(ev);
      }
    }
    return map;
  }, [filteredEvents]);

  // Navigation handlers
  const nextDate = () => {
    if (viewMode === 'month') {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
    } else {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1));
    }
  };

  const prevDate = () => {
    if (viewMode === 'month') {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
    } else {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1));
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  // Month grid generator
  const calendarGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const dateStr = new Date(year, month - 1, d).toISOString().split('T')[0];
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = new Date(Date.UTC(year, month, d)).toISOString().split('T')[0];
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill rows of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const dateStr = new Date(year, month + 1, d).toISOString().split('T')[0];
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Week days generator
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.getFullYear(), curr.getMonth(), first + i);
      days.push({
        dayNumber: d.getDate(),
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }
    return days;
  }, [currentDate]);

  // Heading Label
  const calendarHeading = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'week') {
      if (weekDays.length === 0) return '';
      const start = new Date(weekDays[0].dateStr + 'T00:00:00');
      const end = new Date(weekDays[6].dateStr + 'T00:00:00');
      return `${start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  }, [viewMode, currentDate, weekDays]);

  return (
    <div className="space-y-5">
      {/* 1. Page Header */}
      <PageHeader
        title="Centralized Studio Calendar"
        subtitle="Unified schedule of consultations, follow-ups, confirmed bookings, and bridal ceremonies."
        action={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link href={`${basePath}/bookings`}>
                <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                  <CalendarDays className="w-4 h-4 mr-1.5 text-stone-500" />
                  Manage Bookings
                </Button>
              </Link>
            )}
            <Link href={`${basePath}/consultations`}>
              <Button size="sm" className="bg-[#F97316] hover:bg-[#ea580c] text-white shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Schedule Consultation
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Top Banner / Next Follow-up Highlight Card */}
      {nextPendingFollowUp && (
        <Card className="p-3.5 sm:p-4 bg-gradient-to-r from-orange-50 via-white to-amber-50/50 border-orange-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center text-white shrink-0 shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C2410C] bg-orange-100/80 px-2 py-0.5 rounded-md">
                    Next Pending Follow-up
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    {new Date(nextPendingFollowUp.scheduled_start || nextPendingFollowUp.eventDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-[#292524] mt-0.5">
                  {nextPendingFollowUp.customerName}{' '}
                  <span className="text-xs font-normal text-stone-500">
                    ({nextPendingFollowUp.followUpType === 'ENQUIRY_FOLLOW_UP' ? 'Enquiry Lead' : 'Consultation Outcome'})
                  </span>
                </h4>
                {nextPendingFollowUp.notes && (
                  <p className="text-xs text-stone-600 line-clamp-1 mt-0.5 italic">
                    "{nextPendingFollowUp.notes}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedEvent(nextPendingFollowUp)}
                className="text-xs h-8 text-[#C2410C] border-orange-200 hover:bg-orange-100/50"
              >
                Inspect Follow-up
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Metric Badges Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => setCategoryFilter('ALL')}
          className={`p-3 rounded-xl border text-left transition-all ${
            categoryFilter === 'ALL'
              ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500 shadow-2xs'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500">All Scheduled</span>
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="text-lg font-black text-stone-900 mt-1">{counts.totalEvents}</div>
        </button>

        <button
          onClick={() => setCategoryFilter('CONSULTATION')}
          className={`p-3 rounded-xl border text-left transition-all ${
            categoryFilter === 'CONSULTATION'
              ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500 shadow-2xs'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-orange-700">Consultations</span>
            <div className="w-2 h-2 rounded-full bg-[#F97316]" />
          </div>
          <div className="text-lg font-black text-[#C2410C] mt-1">{counts.consultationsCount}</div>
        </button>

        <button
          onClick={() => setCategoryFilter('FOLLOW_UP')}
          className={`p-3 rounded-xl border text-left transition-all ${
            categoryFilter === 'FOLLOW_UP'
              ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500 shadow-2xs'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-700">Follow-ups</span>
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-lg font-black text-blue-800 mt-1">{counts.followUpsCount}</div>
        </button>

        <button
          onClick={() => setCategoryFilter('BOOKING')}
          className={`p-3 rounded-xl border text-left transition-all ${
            categoryFilter === 'BOOKING'
              ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-2xs'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700">Confirmed Events</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-lg font-black text-emerald-800 mt-1">{counts.bridalBookingsCount}</div>
        </button>
      </div>

      {/* 4. Calendar Controls & Filter Toolbar */}
      <Card className="p-3.5 sm:p-4 border-[#F0E7DE] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, booking #, or venue..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-stone-200 text-xs sm:text-sm bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#F97316]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: View switcher & Navigation */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
            {/* View switcher: Month | Week | Day */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs font-semibold">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white text-[#292524] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-white text-[#292524] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'day'
                    ? 'bg-white text-[#292524] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Day
              </button>
            </div>

            {/* Prev, Today, Next */}
            <div className="flex items-center gap-1.5">
              <Button onClick={goToToday} size="sm" variant="outline" className="h-8 px-2.5 text-xs font-semibold">
                Today
              </Button>
              <div className="flex items-center rounded-lg border border-stone-200 bg-white overflow-hidden shadow-2xs">
                <button
                  onClick={prevDate}
                  className="p-1.5 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                  title="Previous"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-stone-200" />
                <button
                  onClick={nextDate}
                  className="p-1.5 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                  title="Next"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Date heading & Active Category Filter pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#F0E7DE]/80 text-xs">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-[#292524] text-base tracking-tight">
              {calendarHeading}
            </h3>
            <Badge variant="outline" className="text-[10px]">
              {filteredEvents.length} events
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {Object.keys(CATEGORY_CONFIG).map((catKey) => {
              const cfg = CATEGORY_CONFIG[catKey];
              const isSelected = categoryFilter === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setCategoryFilter(catKey)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border shrink-0 ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {catKey !== 'ALL' && (
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                        catKey === 'CONSULTATION'
                          ? 'bg-[#F97316]'
                          : catKey === 'FOLLOW_UP'
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  )}
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 5. Calendar Body: Month, Week, or Day View */}
      <Card className="p-3 sm:p-5 border-[#F0E7DE]">
        {isLoading ? (
          <div className="py-16">
            <LoadingSpinner text="Synchronizing studio calendar events..." />
          </div>
        ) : viewMode === 'month' ? (
          /* ======================== MONTH VIEW ======================== */
          <div className="space-y-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] sm:text-xs text-stone-500 py-1.5 bg-stone-50 rounded-lg border border-stone-200/50">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarGridDays.map((cell, idx) => {
                const dayEvents = eventsByDate[cell.dateStr] || [];
                const isToday = cell.dateStr === new Date().toISOString().split('T')[0];
                const isSelected = cell.dateStr === selectedDateStr;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`h-12 sm:h-auto sm:min-h-[105px] p-1 sm:p-1.5 rounded-lg sm:rounded-xl border transition-all cursor-pointer flex flex-col justify-between sm:justify-start ${
                      isSelected
                        ? 'ring-2 ring-[#F97316] border-[#F97316] bg-orange-50/40 shadow-xs'
                        : isToday
                        ? 'border-orange-300 bg-orange-50/20'
                        : cell.isCurrentMonth
                        ? 'bg-white border-stone-200 hover:border-orange-200'
                        : 'bg-stone-50/40 border-stone-100/80 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs w-full">
                      <span
                        className={`font-bold inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] sm:text-xs leading-none ${
                          isToday
                            ? 'bg-[#F97316] text-white shadow-2xs'
                            : cell.isCurrentMonth
                            ? 'text-[#292524]'
                            : 'text-stone-300'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="hidden sm:inline-flex text-[10px] font-bold text-orange-600 bg-orange-100/60 px-1.5 rounded">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Mobile dots */}
                    {dayEvents.length > 0 && (
                      <div className="flex sm:hidden items-center justify-center gap-0.5 mt-auto">
                        {dayEvents.slice(0, 3).map((ev, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              ev.eventType === 'CONSULTATION'
                                ? 'bg-[#F97316]'
                                : ev.eventType === 'FOLLOW_UP'
                                ? 'bg-blue-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[8px] text-stone-500 font-bold leading-none">+</span>
                        )}
                      </div>
                    )}

                    {/* Desktop event chips */}
                    <div className="hidden sm:block space-y-1 overflow-y-auto max-h-[75px] custom-scrollbar mt-1">
                      {dayEvents.map((evt) => {
                        const isConsult = evt.eventType === 'CONSULTATION';
                        const isFollowUp = evt.eventType === 'FOLLOW_UP';
                        const isBooking = evt.eventType === 'BOOKING';

                        const chipStyle = isConsult
                          ? 'bg-orange-50 border-orange-200/80 text-[#C2410C] hover:bg-orange-100'
                          : isFollowUp
                          ? 'bg-blue-50 border-blue-200/80 text-blue-700 hover:bg-blue-100'
                          : 'bg-emerald-50 border-emerald-200/80 text-emerald-800 hover:bg-emerald-100';

                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(evt);
                            }}
                            className={`p-1 rounded border text-[10px] font-semibold transition-colors cursor-pointer truncate ${chipStyle}`}
                            title={`${evt.title} (${evt.customerName})`}
                          >
                            <span className="block truncate font-bold">{evt.customerName}</span>
                            <span className="block truncate text-[9px] opacity-80">
                              {isConsult && 'Consultation'}
                              {isFollowUp && 'Follow-up'}
                              {isBooking && (evt.event_kind || 'Booking')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'week' ? (
          /* ======================== WEEK VIEW ======================== */
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {weekDays.map((col) => {
                const dayEvents = eventsByDate[col.dateStr] || [];
                const isToday = col.dateStr === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={col.dateStr}
                    className={`rounded-xl border p-2.5 min-h-[220px] flex flex-col ${
                      isToday ? 'border-orange-300 bg-orange-50/15' : 'border-stone-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">
                          {col.dayName}
                        </span>
                        <span
                          className={`text-sm font-extrabold ${
                            isToday ? 'text-[#F97316]' : 'text-stone-800'
                          }`}
                        >
                          {col.dayNumber}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-stone-400">
                        {dayEvents.length} events
                      </span>
                    </div>

                    <div className="space-y-1.5 mt-2 flex-1 overflow-y-auto max-h-[300px]">
                      {dayEvents.length === 0 ? (
                        <div className="text-[10px] text-stone-300 italic text-center py-4">
                          No events
                        </div>
                      ) : (
                        dayEvents.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={() => setSelectedEvent(evt)}
                            className="p-2 rounded-lg border text-xs cursor-pointer hover:shadow-xs transition-all bg-white hover:border-orange-300"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  evt.eventType === 'CONSULTATION'
                                    ? 'bg-[#F97316]'
                                    : evt.eventType === 'FOLLOW_UP'
                                    ? 'bg-blue-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              <span className="font-bold text-[#292524] truncate">
                                {evt.customerName}
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                              {evt.title}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ======================== DAY VIEW ======================== */
          <div className="space-y-3">
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-sm">
                No events scheduled for this day.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="p-3.5 rounded-xl border border-stone-200 bg-white hover:border-orange-300 hover:shadow-2xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          evt.eventType === 'CONSULTATION'
                            ? 'bg-[#F97316]'
                            : evt.eventType === 'FOLLOW_UP'
                            ? 'bg-blue-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[#292524] text-sm sm:text-base">
                            {evt.customerName}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              CATEGORY_CONFIG[evt.eventType]?.color
                            }`}
                          >
                            {CATEGORY_CONFIG[evt.eventType]?.label}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">{evt.title}</p>
                        {evt.venue && (
                          <div className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#F97316]" />
                            {evt.venue}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Day Agenda Drawer / Summary (especially for Month view & Mobile) */}
        {viewMode === 'month' && (
          <div className="pt-3 border-t border-stone-100 mt-3">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
                <h4 className="text-xs sm:text-sm font-bold text-[#292524]">
                  Schedule for{' '}
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </h4>
              </div>
              <span className="text-[11px] text-stone-500 font-medium">
                {(eventsByDate[selectedDateStr] || []).length} events
              </span>
            </div>

            {(eventsByDate[selectedDateStr] || []).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(eventsByDate[selectedDateStr] || []).map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="p-3 rounded-xl bg-orange-50/50 hover:bg-orange-100/70 border border-orange-200/80 transition-all cursor-pointer flex items-center justify-between shadow-2xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            evt.eventType === 'CONSULTATION'
                              ? 'bg-[#F97316]'
                              : evt.eventType === 'FOLLOW_UP'
                              ? 'bg-blue-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="text-xs font-bold text-[#292524] truncate">
                          {evt.customerName}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#C2410C] font-semibold truncate mt-0.5">
                        {evt.eventType === 'CONSULTATION' && 'Bride Consultation'}
                        {evt.eventType === 'FOLLOW_UP' && 'Pending Client Follow-up'}
                        {evt.eventType === 'BOOKING' && (evt.event_kind || 'Ceremony Booking')}
                      </div>
                      {evt.venue && (
                        <div className="text-[10px] text-stone-500 truncate mt-0.5">
                          📍 {evt.venue}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-[#C2410C] hover:bg-white shrink-0">
                      Details
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3 px-4 rounded-xl bg-stone-50 text-center text-xs text-stone-400 border border-dashed border-stone-200">
                No events or appointments scheduled on this date
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 6. Event Detail Drawer / Modal (No duplicate editable records) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    CATEGORY_CONFIG[selectedEvent.eventType]?.color
                  }`}
                >
                  {CATEGORY_CONFIG[selectedEvent.eventType]?.label}
                </span>
                <span className="text-xs text-stone-400">
                  Ref: {selectedEvent.bookingNumber || selectedEvent.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#292524]">
                  {selectedEvent.customerName}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  {selectedEvent.title}
                </p>
              </div>

              {/* Event Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-orange-50/40 border border-orange-200/60 text-xs">
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Event Date</span>
                  <span className="font-bold text-stone-800">
                    {new Date(selectedEvent.eventDate + 'T00:00:00').toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-bold text-[#C2410C]">
                    {selectedEvent.status || 'Active'}
                  </span>
                </div>
                {selectedEvent.customerPhone && (
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Contact Phone</span>
                    <a
                      href={`tel:${selectedEvent.customerPhone}`}
                      className="font-bold text-stone-800 hover:text-orange-600 flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3 text-[#F97316]" />
                      {selectedEvent.customerPhone}
                    </a>
                  </div>
                )}
                {(selectedEvent.venue || selectedEvent.location) && (
                  <div>
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">Location</span>
                    <span className="font-bold text-stone-800 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#F97316]" />
                      {selectedEvent.venue || selectedEvent.location}
                    </span>
                  </div>
                )}
              </div>

              {/* Notes / Feedback */}
              {(selectedEvent.notes || selectedEvent.feedback_summary) && (
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <span className="text-stone-400 block text-[10px] uppercase font-bold mb-1">
                    Notes & Discussion Record
                  </span>
                  <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                    {selectedEvent.notes || selectedEvent.feedback_summary}
                  </p>
                </div>
              )}

              {/* Package or Service snapshot */}
              {selectedEvent.package_name && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                  <Sparkles className="w-4 h-4 text-[#F97316]" />
                  <span className="text-stone-500">Package:</span>
                  <span className="font-bold text-stone-800">{selectedEvent.package_name}</span>
                </div>
              )}
            </div>

            {/* Modal Footer: Action link to original business record */}
            <div className="p-4 border-t border-stone-100 flex items-center justify-end bg-stone-50/50">
              <div className="flex items-center gap-2">
                {selectedEvent.eventType === 'BOOKING' && selectedEvent.bookingId && isAdmin && (
                  <Link href={`${basePath}/bookings`}>
                    <Button size="sm" className="bg-[#F97316] hover:bg-[#ea580c] text-white">
                      Open Booking Record
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                )}
                {selectedEvent.eventType === 'CONSULTATION' && (
                  <Link href={`${basePath}/consultations`}>
                    <Button size="sm" className="bg-[#F97316] hover:bg-[#ea580c] text-white">
                      Manage Consultation
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                )}
                {selectedEvent.eventType === 'FOLLOW_UP' && (
                  <Link href={`${basePath}/enquiries`}>
                    <Button size="sm" className="bg-[#F97316] hover:bg-[#ea580c] text-white">
                      Open Enquiry Lead
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
