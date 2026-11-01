'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Menu,
  Bell,
  Sparkles,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  CreditCard,
  CheckCheck,
  X,
  MessageSquare,
  Send,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { notificationApi } from '@/services/api/modules';
import { PwaInstallPrompt } from '@/components/ui/PwaInstallPrompt';

export function Header({ onMenuClick }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { currentBusiness, user, logout } = useAuthStore();
  const { planName, endsAt, hasActiveSubscription, isCancelledGracePeriod } = useFeatureAccess();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  // Fetch recent notifications for popup
  const { data: notifData } = useQuery({
    queryKey: ['header-notifications-preview'],
    queryFn: () => notificationApi.list({ page: 1, limit: 5, sortBy: 'newest' }),
    enabled: !!currentBusiness,
    staleTime: 1000 * 30, // 30s
  });

  // Fetch summary to check for unread notifications count
  const { data: notifSummaryData } = useQuery({
    queryKey: ['notifications-summary'],
    queryFn: () => notificationApi.getSummary(),
    enabled: !!currentBusiness,
    staleTime: 1000 * 30, // 30s
  });

  const recentNotifications = useMemo(() => {
    return notifData?.data?.notifications || notifData?.data || [];
  }, [notifData]);

  const unreadCount = useMemo(() => {
    const summaryUnread = notifSummaryData?.data?.unread_notifications;
    if (typeof summaryUnread === 'number') return summaryUnread;
    return recentNotifications.filter((n) => n.status === 'SENT' || (!n.opened_at && n.status !== 'DELIVERED')).length;
  }, [notifSummaryData, recentNotifications]);

  const hasUnread = useMemo(() => {
    if (unreadCount > 0) return true;
    return recentNotifications.some((n) => n.status === 'SENT' || (!n.opened_at && n.status !== 'DELIVERED'));
  }, [unreadCount, recentNotifications]);

  // Mutation: Mark all as read
  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['header-notifications-preview'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-summary'] });
    },
  });

  // Mutation: Mark single notification as read
  const markSingleMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['header-notifications-preview'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-summary'] });
    },
  });

  const isEmployeeUser = currentBusiness?.role === 'USER' || user?.role === 'USER';

  // Calculate days remaining in subscription (strictly hidden from employee users)
  const daysRemaining = useMemo(() => {
    if (isEmployeeUser) return null;
    if (!endsAt) return null;
    const now = new Date();
    const expiry = new Date(endsAt);
    const diffMs = expiry.getTime() - now.getTime();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [endsAt, isEmployeeUser]);

  // Derive human-readable breadcrumb / title from pathname
  const pageTitle = useMemo(() => {
    if (pathname === '/dashboard') return 'Dashboard Overview';
    if (pathname.startsWith('/customers')) return 'Customers';
    if (pathname.startsWith('/enquiries')) return 'Enquiries';
    if (pathname.startsWith('/bookings')) return 'Bookings';
    if (pathname.startsWith('/calendar')) return 'Calendar';
    if (pathname.startsWith('/consultations')) return 'Consultations';
    if (pathname.startsWith('/services')) return 'Services';
    if (pathname.startsWith('/packages')) return 'Packages';
    if (pathname.startsWith('/quotations')) return 'Quotations';
    if (pathname.startsWith('/payments')) return 'Payments';
    if (pathname.startsWith('/expenses')) return 'Expenses';
    if (pathname.startsWith('/inventory')) return 'Inventory';
    if (pathname.startsWith('/reports')) return 'Reports';
    if (pathname.startsWith('/notifications')) return 'Notifications';
    if (pathname.startsWith('/website')) return 'Branded Website';
    if (pathname.startsWith('/settings/account')) return 'Account Settings';
    if (pathname.startsWith('/settings')) return 'Business Settings';
    if (pathname.startsWith('/subscription')) return 'Subscription & Billing';
    return 'Studio Overview';
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <header className="h-14 sm:h-16 border-b border-[#F0E7DE] bg-white sticky top-0 z-30 px-2 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-2">
      {/* Left: Studio branding & Page Title */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-1 -ml-1 text-stone-600 hover:text-stone-900 rounded-lg lg:hidden focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 cursor-pointer shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="md:hidden w-7 h-7 rounded-lg border border-[#F0E7DE] bg-orange-50 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
            <img
              src={currentBusiness?.logo_url || '/varnam-logo.png'}
              alt={currentBusiness?.name || 'Studio'}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = '/varnam-logo.png';
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-stone-900 tracking-tight leading-tight truncate">{pageTitle}</h1>
            <p className="text-[10px] text-stone-500 md:hidden leading-tight truncate max-w-[90px] sm:max-w-[140px]">
              {currentBusiness?.name || 'Studio'}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Subscription Expiry Tag, Notifications Popup, Profile Dropdown */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {/* Subscription Countdown Pill */}
        {hasActiveSubscription && daysRemaining !== null && (
          <Link
            href="/subscription"
            className={`flex items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border transition-all shrink-0 ${
              daysRemaining <= 5
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : daysRemaining <= 10
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : 'bg-orange-50 text-[#C2410C] border-orange-200 hover:bg-orange-100/70'
            }`}
            title={`Active Plan: ${planName} — ${isCancelledGracePeriod ? 'Ends' : 'Renews'} in ${daysRemaining} days`}
          >
            <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0 text-[#F97316]" />
            <span>
              <span className="hidden sm:inline">{isCancelledGracePeriod ? 'Ends in' : 'Renews in'}{' '}</span>
              <strong className="font-bold">{daysRemaining}d</strong>
              <span className="hidden sm:inline">{daysRemaining === 1 ? ' left' : ' left'}</span>
            </span>
          </Link>
        )}

        {/* Notifications Icon with Interactive Popup */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            className="p-1.5 sm:p-2 text-stone-500 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors relative focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 cursor-pointer"
            aria-label="View notifications"
            aria-expanded={notifOpen}
          >
            <Bell className="w-4 h-4" />
            {hasUnread && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F97316] ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Notification Popover Dropdown - Modern, Interactive & 360px Mobile-Friendly */}
          {notifOpen && (
            <div className="fixed sm:absolute inset-x-2.5 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:mt-2 sm:w-96 max-w-[calc(100vw-20px)] bg-white rounded-3xl shadow-2xl border border-[#F0E7DE] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="px-4 py-3.5 border-b border-[#F0E7DE] flex items-center justify-between bg-gradient-to-r from-[#FFFDF9] to-stone-50/80">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-100/70 text-[#C2410C] flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-extrabold text-xs text-stone-900 tracking-tight">Activity & Alerts</span>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#C2410C] shadow-2xs animate-pulse">
                      {unreadCount} new
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-500">
                      All caught up
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {hasUnread && (
                    <button
                      type="button"
                      disabled={markAllMutation.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllMutation.mutate();
                      }}
                      className="text-[11px] font-bold text-stone-600 hover:text-[#F97316] flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#F97316]" />
                      <span className="hidden min-[380px]:inline">Mark all read</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 sm:hidden"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notification items list */}
              <div className="max-h-[65vh] sm:max-h-84 overflow-y-auto divide-y divide-stone-100/90 custom-scrollbar">
                {recentNotifications.length === 0 ? (
                  <div className="py-10 px-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-2 text-stone-400">
                      <Bell className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-stone-700">No new notifications</p>
                    <p className="text-[11px] text-stone-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
                      New enquiries, bridal consultations, and WhatsApp dispatches will appear here.
                    </p>
                  </div>
                ) : (
                  recentNotifications.map((notif) => {
                    const isUnread = notif.status === 'SENT' || (!notif.opened_at && notif.status !== 'DELIVERED');
                    const isDelivered = notif.status === 'DELIVERED';
                    const isFailed = notif.status === 'FAILED';

                    // Humanize raw template/notification names
                    const formatTitle = (title) => {
                      if (!title) return 'System Alert';
                      if (title.toUpperCase() === 'TRANSACTIONAL') return 'Transactional Message';
                      return title
                        .replace(/[_-]/g, ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase());
                    };

                    // Format phone/email cleanly
                    const recipientText = notif.recipient_phone || notif.recipient_email || notif.recipient || 'Client update';

                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (isUnread) {
                            markSingleMutation.mutate(notif.id);
                          }
                        }}
                        className={`p-3.5 transition-all flex items-start gap-3 text-left cursor-pointer group ${
                          isUnread
                            ? 'bg-orange-50/30 hover:bg-orange-50/60 border-l-4 border-[#F97316]'
                            : 'hover:bg-stone-50/90 bg-white'
                        }`}
                      >
                        {/* Channel / Status Avatar */}
                        <div className="mt-0.5 shrink-0">
                          {isDelivered ? (
                            <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shadow-2xs">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          ) : isFailed ? (
                            <div className="w-8 h-8 rounded-xl bg-rose-100/70 text-rose-600 flex items-center justify-center shadow-2xs">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-xl bg-orange-100/70 text-[#C2410C] flex items-center justify-center shadow-2xs">
                              {notif.recipient_phone ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className={`text-xs truncate ${isUnread ? 'font-bold text-stone-900' : 'font-semibold text-stone-750'}`}>
                              {formatTitle(notif.template_name || notif.notification_type || notif.subject)}
                            </p>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-[#F97316] ring-2 ring-orange-200 shrink-0" />
                            )}
                          </div>

                          <p className="text-[11px] text-stone-600 line-clamp-1 mt-0.5 font-medium flex items-center gap-1">
                            <span>{recipientText}</span>
                          </p>

                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-100/80">
                            <span className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-300" />
                              {notif.created_at
                                ? new Date(notif.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Just now'}
                            </span>

                            {isUnread ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markSingleMutation.mutate(notif.id);
                                }}
                                className="text-[10px] font-bold text-[#F97316] hover:text-[#C2410C] flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-orange-100/60 transition-colors"
                              >
                                <CheckCheck className="w-3 h-3" />
                                <span>Mark read</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-stone-400 font-medium">Read</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-stone-50 border-t border-[#F0E7DE] flex items-center justify-between gap-2">
                <Link
                  href="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="w-full text-center py-1.5 px-3 bg-white hover:bg-stone-100 border border-[#F0E7DE] rounded-xl text-xs font-bold text-stone-800 hover:text-[#F97316] flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <span>Go to Notification Center</span>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* PWA Install Button (Displays automatically when installation is available) */}
        <PwaInstallPrompt />

        {/* User Profile Menu */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-full sm:rounded-xl hover:bg-stone-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 cursor-pointer"
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-full bg-orange-100 text-[#C2410C] font-bold text-xs flex items-center justify-center border border-orange-200 shrink-0">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#292524] leading-tight">
                {user?.name || 'Studio Owner'}
              </span>
              <span className="text-[10px] text-[#78716C] leading-tight truncate max-w-[120px]">
                {user?.email || 'Active'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-lg border border-[#F0E7DE] py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3.5 py-2 border-b border-[#F0E7DE]/80 sm:hidden">
                <div className="text-xs font-semibold text-[#292524]">{user?.name || 'Studio Owner'}</div>
                <div className="text-[10px] text-[#78716C] truncate">{user?.email || '—'}</div>
              </div>

              {daysRemaining !== null && (
                <div className="px-3.5 py-2 border-b border-[#F0E7DE]/80 md:hidden bg-orange-50/50">
                  <div className="text-[11px] font-bold text-[#C2410C] flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#F97316]" />
                    {isCancelledGracePeriod ? 'Ends in' : 'Renews in'} {daysRemaining} days
                  </div>
                </div>
              )}

              {!isEmployeeUser && (
                <>
                  <Link
                    href="/subscription"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#F97316]" />
                    Subscription &amp; Plans
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-50"
                  >
                    <Settings className="w-3.5 h-3.5 text-stone-400" />
                    Business Settings
                  </Link>

                  <div className="border-t border-[#F0E7DE]/80 my-1" />
                </>
              )}

              <button
                onClick={() => {
                  setProfileOpen(false);
                  const isUserRole = currentBusiness?.role === 'USER' || user?.role === 'USER';
                  const slug = currentBusiness?.slug || currentBusiness?.businessSlug || 'srinivasbridalstudio';
                  logout();
                  if (isUserRole) {
                    window.location.href = `/${slug}/user/login`;
                  } else {
                    window.location.href = '/login';
                  }
                }}
                className="w-full text-left flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
