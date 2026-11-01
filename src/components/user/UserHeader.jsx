'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  ChevronDown,
  LogOut,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { notificationApi } from '@/services/api/modules';
import { PwaInstallPrompt } from '@/components/ui/PwaInstallPrompt';

export function UserHeader() {
  const pathname = usePathname();
  const params = useParams();
  const studioSlug = params?.businessSlug || 'srinivasbridalstudio';
  const queryClient = useQueryClient();
  const { currentBusiness, user, logout } = useAuthStore();
  const { planName, endsAt, hasActiveSubscription, isCancelledGracePeriod } = useFeatureAccess();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);

  // Fetch recent notifications
  const { data: notifData } = useQuery({
    queryKey: ['user-header-notifications', currentBusiness?.id],
    queryFn: () => notificationApi.list({ page: 1, limit: 5, sortBy: 'newest' }),
    enabled: !!currentBusiness?.id,
    staleTime: 1000 * 30,
  });

  const { data: notifSummaryData } = useQuery({
    queryKey: ['user-notifications-summary', currentBusiness?.id],
    queryFn: () => notificationApi.getSummary(),
    enabled: !!currentBusiness?.id,
    staleTime: 1000 * 30,
  });

  const recentNotifications = useMemo(() => {
    return notifData?.data?.notifications || notifData?.data || [];
  }, [notifData]);

  const unreadCount = useMemo(() => {
    const summaryUnread = notifSummaryData?.data?.unread_notifications;
    if (typeof summaryUnread === 'number') return summaryUnread;
    return recentNotifications.filter((n) => n.status === 'SENT' || (!n.opened_at && n.status !== 'DELIVERED')).length;
  }, [notifSummaryData, recentNotifications]);

  const hasUnread = unreadCount > 0;

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-header-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications-summary'] });
    },
  });

  const markSingleMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-header-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['user-notifications-summary'] });
    },
  });

  // Calculate days remaining in studio plan
  const daysRemaining = useMemo(() => {
    if (!endsAt) return 29; // default preview or fallback
    const now = new Date();
    const expiry = new Date(endsAt);
    const diffMs = expiry.getTime() - now.getTime();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [endsAt]);

  // Page title mapping
  const pageTitle = useMemo(() => {
    if (pathname.includes('/user/dashboard')) return 'Dashboard';
    if (pathname.includes('/user/enquiries')) return 'Enquiries';
    if (pathname.includes('/user/consultations')) return 'Consultation Scheduling';
    if (pathname.includes('/user/customers')) return 'Customers';
    if (pathname.includes('/user/services')) return 'Services';
    if (pathname.includes('/user/packages')) return 'Packages';
    if (pathname.includes('/user/quotations')) return 'Quotations';
    if (pathname.includes('/user/notifications')) return 'Notifications';
    if (pathname.includes('/user/help-support')) return 'Help & Support';
    return 'Studio Workspace';
  }, [pathname]);

  // Outside click listener
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

  const handleLogout = () => {
    logout();
    window.location.href = `/${studioSlug}/user/login`;
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const studioName = currentBusiness?.name || 'Srinivas K A\'s Bridal Studio';
  const studioLogo = currentBusiness?.logo_url || '/varnam-logo.png';

  return (
    <header className="h-14 sm:h-16 border-b border-[#F0E7DE] bg-white sticky top-0 z-30 px-2 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-2 shadow-2xs">
      {/* Left: Studio Logo + Page Title + Studio Name Subtitle */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-[#F0E7DE] bg-amber-50/50 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs">
          <img
            src={studioLogo}
            alt={studioName}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = '/varnam-logo.png';
            }}
          />
        </div>

        <div className="min-w-0 flex flex-col justify-center">
          <h1 className="text-xs sm:text-base font-extrabold text-[#1C1917] tracking-tight leading-tight truncate">
            {pageTitle}
          </h1>
          <p className="text-[10px] text-stone-500 font-medium leading-tight truncate max-w-[100px] sm:max-w-xs">
            {studioName}
          </p>
        </div>
      </div>

      {/* Right: Days Pill + Bell Icon + Install Button + User Profile Avatar */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Days Pill */}
        <div className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold text-[#EA580C] bg-orange-50 border border-orange-200/80 shrink-0">
          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#EA580C]" />
          <span>{daysRemaining}d</span>
        </div>

        {/* Notifications Icon with Popup */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            className="p-1 sm:p-2 text-stone-600 hover:text-stone-900 rounded-full hover:bg-stone-100 transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnread && (
              <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 rounded-full bg-[#EA580C] ring-2 ring-white animate-pulse" />
            )}
          </button>

          {notifOpen && (
            <div className="fixed sm:absolute inset-x-2.5 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:mt-2 sm:w-88 max-w-[calc(100vw-20px)] bg-white rounded-2xl shadow-xl border border-[#F0E7DE] overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#F0E7DE] flex items-center justify-between bg-stone-50">
                <span className="font-bold text-xs text-stone-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    className="text-[10px] font-semibold text-[#EA580C] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[#F0E7DE]/60 custom-scrollbar">
                {recentNotifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-400">
                    No new notifications
                  </div>
                ) : (
                  recentNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markSingleMutation.mutate(notif.id)}
                      className="p-3 hover:bg-stone-50 transition-colors cursor-pointer text-left"
                    >
                      <p className="text-xs font-semibold text-stone-800 line-clamp-1">
                        {notif.subject || notif.title || 'Studio Notification'}
                      </p>
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                        {notif.content_preview || notif.message || notif.body || 'Client update'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Install PWA Prompt Pill (Identical to Image 2) */}
        <PwaInstallPrompt />

        {/* User Profile Avatar with Initial (SK / N / etc.) */}
        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className="w-8 h-8 rounded-full bg-stone-900 text-white font-bold text-xs flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shadow-xs shrink-0 ring-2 ring-stone-200"
            aria-label="Staff Profile"
          >
            {initials}
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#F0E7DE] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-[#F0E7DE]">
                <div className="text-xs font-bold text-stone-900 truncate">{user?.name || 'Staff User'}</div>
                <div className="text-[10px] text-stone-500 truncate">{user?.email}</div>
              </div>

              <Link
                href={`/${studioSlug}/user/help-support`}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
              >
                <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                Help &amp; Support
              </Link>

              <div className="border-t border-[#F0E7DE] my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
