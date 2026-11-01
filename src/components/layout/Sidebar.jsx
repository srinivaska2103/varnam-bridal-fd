'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CalendarDays,
  Calendar,
  CalendarClock,
  Sparkles,
  Package,
  FileSpreadsheet,
  CreditCard,
  Receipt,
  Boxes,
  LineChart,
  Bell,
  Mail,
  Globe,
  Settings,
  UserCheck,
  LogOut,
  Building2,
  Lock,
  X,
  ChevronRight,
  Share2,
  IndianRupee,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/formatters';
import { ModernDropdown } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { businessApi } from '@/services/api/modules';
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { LockedFeatureDialog } from '@/components/subscription/LockedFeatureDialog';
import { ContactSalesModal } from '@/components/subscription/ContactSalesModal';

export const NAVIGATION_GROUPS = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'BUSINESS MANAGEMENT',
    items: [
      { label: 'Calendar', href: '/calendar', icon: Calendar },
      { label: 'Customers', href: '/customers', icon: Users },
      { label: 'Enquiries', href: '/enquiries', icon: MessageSquare },
      { label: 'Bookings', href: '/bookings', icon: CalendarDays, adminOnly: true },
      { label: 'Consultations', href: '/consultations', icon: CalendarClock },
    ],
  },
  {
    title: 'SERVICES & SALES',
    items: [
      { label: 'Services', href: '/services', icon: Sparkles },
      { label: 'Packages', href: '/packages', icon: Package },
      { label: 'Quotations', href: '/quotations', icon: FileSpreadsheet },
      { label: 'Payments', href: '/payments', icon: CreditCard, adminOnly: true },
    ],
  },
  {
    title: 'BUSINESS OPERATIONS',
    items: [
      { label: 'Expenses', href: '/expenses', icon: IndianRupee, adminOnly: true },
      { label: 'Reports', href: '/reports', icon: LineChart, adminOnly: true },
    ],
  },
  {
    title: 'GROWTH',
    items: [
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Campaigns', href: '/campaigns', icon: Mail, adminOnly: true },
      {
        label: 'Website',
        href: '/website',
        icon: Globe,
        adminOnly: true,
      },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'User Management', href: '/settings/users', icon: UserCheck, adminOnly: true },
      { label: 'Business Settings', href: '/settings', icon: Settings, adminOnly: true },
      { label: 'Custom Enquiry Form', href: '/settings/enquiry-form', icon: Share2, adminOnly: true },
      { label: 'Subscription', href: '/subscription', icon: CreditCard, adminOnly: true },
      { label: 'Help & Support', href: '/help-support', icon: HelpCircle },
    ],
  },
];

export function Sidebar({ className, onClose }) {
  const pathname = usePathname();
  const { currentBusiness, memberships, setCurrentBusiness, user, logout } = useAuthStore();
  const businessId = currentBusiness?.id || currentBusiness?.business_id;
  const studioSlug = currentBusiness?.slug || currentBusiness?.businessSlug || 'srinivasbridalstudio';

  // Check if we are currently inside the scoped /:studioSlug/admin route architecture
  const isAdminScoped = pathname.includes(`/${studioSlug}/admin`) || pathname.startsWith('/[businessSlug]/admin');
  const baseAdminPrefix = isAdminScoped ? `/${studioSlug}/admin` : '';

  const {
    hasActiveSubscription,
    planTier,
    planName,
    getRouteLockInfo,
  } = useFeatureAccess();

  // State for locked feature dialog & contact sales modal
  const [lockedDialog, setLockedDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    requiredTier: 'STARTER',
    requiredPlanName: 'Starter (₹599/mo)',
  });
  const [showContactSales, setShowContactSales] = useState(false);

  // React Query: sync live business profile with Settings page updates
  const { data: businessProfileRes } = useQuery({
    queryKey: ['business-profile', businessId],
    queryFn: () => businessApi.getById(businessId),
    enabled: !!businessId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const businessProfile = businessProfileRes?.data;
  const studioName = businessProfile?.name || currentBusiness?.name || 'My Bridal Studio';
  const studioCity = businessProfile?.city || currentBusiness?.city;
  const studioLogo =
    businessProfile?.logoUrl ||
    businessProfile?.logo_url ||
    currentBusiness?.logo_url ||
    currentBusiness?.logoUrl ||
    '/varnam-logo.png';

  // Determine if active session is USER role vs ADMIN (OWNER / MANAGER)
  const isEmployeeUser = currentBusiness?.role === 'USER' || user?.role === 'USER';

  // Filter navigation items based on role
  const filteredNavigationGroups = useMemo(() => {
    return NAVIGATION_GROUPS.map((group) => {
      const visibleItems = group.items.filter((item) => {
        if (isEmployeeUser && item.adminOnly) return false;
        return true;
      });
      return { ...group, items: visibleItems };
    }).filter((group) => group.items.length > 0);
  }, [isEmployeeUser]);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const handleItemClick = (e, item, lockInfo) => {
    if (lockInfo.isLocked) {
      e.preventDefault();
      setLockedDialog({
        isOpen: true,
        title: item.label,
        description: lockInfo.description,
        requiredTier: lockInfo.requiredTier,
        requiredPlanName: lockInfo.requiredPlanName,
      });
      return;
    }
    if (onClose) onClose();
  };

  return (
    <>
      <aside
        className={cn(
          'w-64 sm:w-72 bg-white text-stone-700 flex flex-col h-screen border-r border-[#F0E7DE] select-none shadow-[2px_0_12px_rgba(0,0,0,0.02)]',
          className
        )}
      >
        {/* 1. Studio Header with User Logo & Brand Name */}
        <div className="px-5 py-4 border-b border-[#F0E7DE] flex items-center justify-between bg-white shrink-0">
          <Link href={baseAdminPrefix ? `${baseAdminPrefix}/dashboard` : '/dashboard'} onClick={onClose} className="flex items-center gap-3 group min-w-0">
            <div className="relative w-10 h-10 rounded-xl border border-[#F0E7DE] bg-[#FFFDF9] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs transition-transform group-hover:scale-105 duration-200 p-1">
              <img
                src={studioLogo}
                alt={studioName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/varnam-logo.png';
                }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base font-extrabold tracking-tight text-[#F97316] leading-tight truncate">
                {studioName}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-semibold text-[#78716C] tracking-wider uppercase truncate">
                  {studioCity ? `${studioCity} Studio` : 'Bridal Studio'}
                </span>
                {!isEmployeeUser && (
                  <span
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.2 rounded tracking-wide uppercase',
                      planTier === 'PREMIUM'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : planTier === 'GROWTH'
                        ? 'bg-orange-100 text-[#C2410C] border border-orange-200'
                        : planTier === 'STARTER'
                        ? 'bg-stone-100 text-stone-700 border border-stone-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    )}
                  >
                    {planTier === 'NONE' ? 'No Plan' : planTier}
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Mobile drawer close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 -mr-1 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors lg:hidden focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 cursor-pointer"
              aria-label="Close sidebar navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 2. Active Studio Switcher (when multiple businesses exist) */}
        {memberships && memberships.length > 1 && (
          <div className="px-4 py-2.5 border-b border-[#F0E7DE] bg-[#FFFDF9] shrink-0">
            <label className="block text-[10px] font-bold text-[#A8A29E] tracking-wider uppercase mb-1">
              Switch Studio
            </label>
            <ModernDropdown
              value={currentBusiness?.id || ''}
              onChange={(val) => {
                const selected = memberships.find((m) => (m.businesses?.id || m.id) === val);
                if (selected) setCurrentBusiness(selected.businesses || selected);
              }}
              options={memberships.map((m) => {
                const b = m.businesses || m;
                return { value: b.id, label: b.name };
              })}
              placeholder="Select studio..."
            />
          </div>
        )}

        {/* 3. Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 custom-scrollbar">
          {filteredNavigationGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-[#A8A29E] tracking-wider uppercase mb-1.5">
                {group.title}
              </div>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  // Scoped target href for admin portal
                  const targetHref = baseAdminPrefix
                    ? item.href === '/settings/users'
                      ? `${baseAdminPrefix}/users`
                      : `${baseAdminPrefix}${item.href}`
                    : item.href;

                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === targetHref || pathname === '/dashboard'
                      : item.href === '/settings'
                      ? pathname === targetHref || pathname === '/settings'
                      : pathname === targetHref || pathname.startsWith(targetHref + '/') || pathname === item.href || pathname.startsWith(item.href + '/');

                  const lockInfo = getRouteLockInfo(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={targetHref}
                      onClick={(e) => handleItemClick(e, item, lockInfo)}
                      title={lockInfo.isLocked ? `Requires ${lockInfo.requiredPlanName}` : item.label}
                      className={cn(
                        'group flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 select-none',
                        lockInfo.isLocked
                          ? 'opacity-65 text-stone-400 hover:text-stone-600 hover:bg-stone-50/80 cursor-pointer'
                          : isActive
                          ? 'bg-gradient-to-r from-[#FF5F00] via-[#FF6600] to-[#FF7A00] text-white font-bold shadow-md shadow-orange-500/25'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'text-stone-400 group-hover:text-stone-600'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={cn('tracking-tight', lockInfo.isLocked && 'text-stone-500')}>{item.label}</span>
                      </div>

                      {lockInfo.isLocked ? (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          <Lock className="w-2.5 h-2.5" />
                          {lockInfo.requiresPremium
                            ? 'Premium'
                            : lockInfo.requiresGrowth
                            ? 'Growth'
                            : 'Starter'}
                        </span>
                      ) : isActive ? (
                        <div className="w-2 h-2 rounded-full bg-white shadow-xs shrink-0" />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* 4. Sleek Footer Profile Strip */}
        <div className="p-3 border-t border-[#F0E7DE] bg-[#FFFDF9] shrink-0">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-[#F0E7DE] shadow-2xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-[#C2410C] font-bold flex items-center justify-center text-xs border border-orange-200 shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-stone-900 truncate">
                  {user?.name || 'Studio Owner'}
                </div>
                <div className="text-[10px] text-stone-500 truncate">
                  {user?.email || 'Logged in'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const isUserRole = currentBusiness?.role === 'USER' || user?.role === 'USER';
                const slug = currentBusiness?.slug || currentBusiness?.businessSlug || 'srinivasbridalstudio';
                logout();
                if (isUserRole) {
                  window.location.href = `/${slug}/user/login`;
                } else {
                  window.location.href = '/login';
                }
              }}
              title="Sign out"
              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Locked Feature Modal Trigger */}
      <LockedFeatureDialog
        isOpen={lockedDialog.isOpen}
        onClose={() => setLockedDialog({ ...lockedDialog, isOpen: false })}
        featureTitle={lockedDialog.title}
        featureDescription={lockedDialog.description}
        requiredTier={lockedDialog.requiredTier}
        requiredPlanName={lockedDialog.requiredPlanName}
        onContactSales={() => setShowContactSales(true)}
      />

      {/* Contact Sales Modal */}
      <ContactSalesModal
        isOpen={showContactSales}
        onClose={() => setShowContactSales(false)}
      />
    </>
  );
}
