'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  MessageCircle,
  CalendarCheck2,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/utils/formatters';
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { NAVIGATION_GROUPS } from './Sidebar';
import { MobileMoreSheet } from './MobileMoreSheet';
import { LockedFeatureDialog } from '@/components/subscription/LockedFeatureDialog';
import { ContactSalesModal } from '@/components/subscription/ContactSalesModal';
import { useAuthStore } from '@/store/authStore';

export function MobileBottomNavigation() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const featureAccess = useFeatureAccess();
  const { getRouteLockInfo } = featureAccess;
  const { currentBusiness, user } = useAuthStore();
  const studioSlug = currentBusiness?.slug || currentBusiness?.businessSlug || 'srinivasbridalstudio';
  const isAdminScoped = pathname.includes(`/${studioSlug}/admin`) || pathname.startsWith('/[businessSlug]/admin');
  const baseAdminPrefix = isAdminScoped ? `/${studioSlug}/admin` : '';

  const isEmployeeUser = currentBusiness?.role === 'USER' || user?.role === 'USER';

  // State for locked feature dialog & contact sales modal
  const [lockedDialog, setLockedDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    requiredTier: 'STARTER',
    requiredPlanName: 'Starter (₹599/mo)',
  });
  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false);

  const handleLockedFeatureClick = (item, lockInfo) => {
    if (lockInfo.requiredTier === 'PREMIUM') {
      setIsContactSalesOpen(true);
    } else {
      setLockedDialog({
        isOpen: true,
        title: item.label,
        description: lockInfo.description,
        requiredTier: lockInfo.requiredTier,
        requiredPlanName: lockInfo.requiredPlanName,
      });
    }
  };

  // Primary navigation tabs
  const rawPrimaryTabs = isEmployeeUser
    ? [
        { label: 'Home', href: '/dashboard', icon: Home },
        { label: 'Customers', href: '/customers', icon: Users },
        { label: 'Enquiries', href: '/enquiries', icon: MessageCircle },
        { label: 'Services', href: '/services', icon: CalendarCheck2 },
      ]
    : [
        { label: 'Home', href: '/dashboard', icon: Home },
        { label: 'Customers', href: '/customers', icon: Users },
        { label: 'Enquiries', href: '/enquiries', icon: MessageCircle },
        { label: 'Bookings', href: '/bookings', icon: CalendarCheck2 },
      ];

  const primaryTabs = rawPrimaryTabs.map((tab) => ({
    ...tab,
    targetHref: baseAdminPrefix ? `${baseAdminPrefix}${tab.href}` : tab.href,
  }));

  // Check if current route is a primary tab
  const isPrimaryActive = primaryTabs.some(
    (tab) => pathname === tab.targetHref || pathname === tab.href || (tab.href !== '/dashboard' && (pathname.startsWith(tab.targetHref) || pathname.startsWith(tab.href)))
  );

  // If active route is not one of the 4 primary tabs, "More" is highlighted
  const isMoreActive = !isPrimaryActive;

  return (
    <>
      {/* Floating Pill Mobile Navigation Bar */}
      <div className="fixed bottom-[calc(10px+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex justify-center px-3 pointer-events-none md:hidden">
        <nav
          className="pointer-events-auto w-[calc(100%-12px)] max-w-[420px] h-[60px] sm:h-[66px] bg-white/95 rounded-[999px] border border-[#FED7AA] shadow-[0_8px_30px_rgba(234,88,12,0.14)] flex items-center justify-around px-1.5 py-0.5 select-none backdrop-blur-md"
          aria-label="Mobile Navigation"
        >
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const targetHref = tab.targetHref || tab.href;
            const isActive =
              pathname === targetHref || pathname === tab.href || (tab.href !== '/dashboard' && (pathname.startsWith(targetHref) || pathname.startsWith(tab.href)));
            const lockInfo = getRouteLockInfo(tab.href);

            const handleClick = (e) => {
              if (lockInfo.isLocked) {
                e.preventDefault();
                handleLockedFeatureClick(tab, lockInfo);
              }
            };

            return (
              <Link
                key={tab.href}
                href={targetHref}
                onClick={handleClick}
                className="flex flex-col items-center justify-center flex-1 h-full py-0.5 px-0.5 transition-all duration-200 ease-in-out group focus:outline-none"
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={cn(
                    'relative w-9 sm:w-11 h-8 sm:h-9 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-200 ease-in-out',
                    isActive
                      ? 'bg-gradient-to-b from-[#FFF7ED] to-[#FFEDD5]/60 text-[#EA580C] shadow-[0_2px_10px_rgba(234,88,12,0.15)] ring-1 ring-[#FED7AA]/80'
                      : 'text-stone-400 group-hover:text-stone-700'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-[18px] sm:w-[20px] h-[18px] sm:h-[20px] transition-transform duration-200 ease-in-out',
                      isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.75]'
                    )}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#EA580C] shadow-xs" />
                  )}
                  {lockInfo.isLocked && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-stone-300 ring-2 ring-white" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[9px] sm:text-[10px] tracking-tight mt-0.5 leading-tight truncate max-w-[58px] transition-colors duration-200 ease-in-out',
                    isActive ? 'font-bold text-[#EA580C]' : 'font-medium text-stone-500'
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* More Tab */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full py-0.5 px-0.5 transition-all duration-200 ease-in-out group focus:outline-none cursor-pointer"
            aria-label="Open more menu options"
            aria-expanded={isMoreOpen}
          >
            <div
              className={cn(
                'relative w-9 sm:w-11 h-8 sm:h-9 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-200 ease-in-out',
                isMoreActive
                  ? 'bg-gradient-to-b from-[#FFF7ED] to-[#FFEDD5]/60 text-[#EA580C] shadow-[0_2px_10px_rgba(234,88,12,0.15)] ring-1 ring-[#FED7AA]/80'
                  : 'text-stone-400 group-hover:text-stone-700'
              )}
            >
              <LayoutGrid
                className={cn(
                  'w-[18px] sm:w-[20px] h-[18px] sm:h-[20px] transition-transform duration-200 ease-in-out',
                  isMoreActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.75]'
                )}
              />
              {isMoreActive && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#EA580C] shadow-xs" />
              )}
            </div>
            <span
              className={cn(
                'text-[9px] sm:text-[10px] tracking-tight mt-0.5 leading-tight truncate max-w-[58px] transition-colors duration-200 ease-in-out',
                isMoreActive ? 'font-bold text-[#EA580C]' : 'font-medium text-stone-500'
              )}
            >
              More
            </span>
          </button>
        </nav>
      </div>

      {/* More Sheet Popover */}
      <MobileMoreSheet
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        navigationGroups={NAVIGATION_GROUPS}
        isEmployeeUser={isEmployeeUser}
        getRouteLockInfo={getRouteLockInfo}
        onLockedFeatureClick={handleLockedFeatureClick}
        subscriptionInfo={{
          planName: featureAccess.planName,
          endsAt: featureAccess.endsAt,
          hasActiveSubscription: featureAccess.hasActiveSubscription,
          isCancelledGracePeriod: featureAccess.isCancelledGracePeriod,
        }}
      />

      {/* Subscription Feature Gate Modals */}
      <LockedFeatureDialog
        isOpen={lockedDialog.isOpen}
        onClose={() => setLockedDialog((prev) => ({ ...prev, isOpen: false }))}
        featureTitle={lockedDialog.title}
        featureDescription={lockedDialog.description}
        requiredTier={lockedDialog.requiredTier}
        requiredPlanName={lockedDialog.requiredPlanName}
      />

      <ContactSalesModal
        isOpen={isContactSalesOpen}
        onClose={() => setIsContactSalesOpen(false)}
      />
    </>
  );
}
