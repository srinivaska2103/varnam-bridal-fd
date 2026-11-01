'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X,
  Lock,
  ChevronRight,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/utils/formatters';

export function MobileMoreSheet({
  isOpen,
  onClose,
  navigationGroups,
  isEmployeeUser = false,
  getRouteLockInfo,
  onLockedFeatureClick,
  subscriptionInfo,
}) {
  const pathname = usePathname();
  const sheetRef = useRef(null);

  const daysRemaining = React.useMemo(() => {
    if (!subscriptionInfo?.endsAt) return null;
    const now = new Date();
    const expiry = new Date(subscriptionInfo.endsAt);
    const diffMs = expiry.getTime() - now.getTime();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [subscriptionInfo?.endsAt]);

  // Close on Escape key press & trap focus
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    // Prevent background body scrolling when sheet is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter groups: Home, Customers, Enquiries, Bookings are in bottom bar, but we can display the rest cleanly
  // Primary items in bottom bar: /dashboard, /customers, /enquiries, /bookings
  const primaryHrefs = ['/dashboard', '/customers', '/enquiries', '/bookings'];

  return (
    <div
      className="fixed inset-0 z-50 md:hidden flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="More navigation options"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        ref={sheetRef}
        className="relative z-10 w-full max-h-[85vh] bg-white rounded-t-3xl shadow-2xl flex flex-col border-t border-[#F0E7DE] animate-in slide-in-from-bottom duration-300 pb-[env(safe-area-inset-bottom)]"
      >
        {/* Drag Handle & Header */}
        <div className="pt-3 pb-2.5 px-5 border-b border-[#F0E7DE]/80 shrink-0">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-stone-900 tracking-tight">Studio Menu</h3>
              <p className="text-[11px] text-stone-500">More management features &amp; studio settings</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -mr-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subscription Expiry / Active Days Banner */}
          {subscriptionInfo?.hasActiveSubscription && daysRemaining !== null && (
            <Link
              href="/subscription"
              onClick={onClose}
              className="mt-2.5 flex items-center justify-between px-3.5 py-2 rounded-xl bg-orange-50/90 border border-orange-200/80 hover:bg-orange-100/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-[#EA580C] flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="text-[11px] font-bold text-[#C2410C] block leading-tight">
                    {subscriptionInfo.planName || 'Active Plan'}
                  </span>
                  <span className="text-[10px] text-stone-500 block leading-tight">
                    {subscriptionInfo.isCancelledGracePeriod ? 'Access ends in' : 'Plan renews in'}{' '}
                    <strong className="text-stone-700 font-semibold">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</strong>
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#EA580C] flex items-center gap-0.5">
                Manage
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          )}
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {navigationGroups.map((group) => {
            // Filter out primary bottom bar items and adminOnly items if isEmployeeUser
            const items = group.items.filter((item) => {
              if (primaryHrefs.includes(item.href)) return false;
              if (isEmployeeUser && item.adminOnly) return false;
              return true;
            });
            if (items.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1.5">
                <div className="px-3 text-[10px] font-bold text-[#A8A29E] tracking-wider uppercase">
                  {group.title}
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : item.href === '/settings'
                        ? pathname === '/settings'
                        : pathname === item.href || pathname.startsWith(item.href + '/');
                    const lockInfo = getRouteLockInfo(item.href);

                    const handleClick = (e) => {
                      if (lockInfo.isLocked) {
                        e.preventDefault();
                        onClose();
                        onLockedFeatureClick(item, lockInfo);
                        return;
                      }
                      onClose();
                    };

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleClick}
                        className={cn(
                          'flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 select-none',
                          isActive
                            ? 'bg-[#FFF7ED] text-[#EA580C] font-bold shadow-[0_2px_8px_rgba(234,88,12,0.08)] border border-[#FED7AA]'
                            : lockInfo.isLocked
                            ? 'text-stone-400 hover:bg-stone-50 hover:text-stone-600 border border-transparent'
                            : 'text-[#1F2937] hover:bg-stone-50 hover:text-stone-900 border border-transparent'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200',
                              isActive
                                ? 'bg-[#EA580C] text-white shadow-xs'
                                : lockInfo.isLocked
                                ? 'bg-stone-100 text-stone-400'
                                : 'bg-stone-100/80 text-stone-600 group-hover:bg-[#FFEDD5] group-hover:text-[#EA580C]'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="truncate leading-tight text-xs">{item.label}</span>
                            {item.description && (
                              <span className="text-[10px] font-normal text-stone-400 truncate mt-0.5">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {lockInfo.isLocked ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  'text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase',
                                  lockInfo.requiredTier === 'PREMIUM'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : lockInfo.requiredTier === 'GROWTH'
                                    ? 'bg-orange-100 text-[#C2410C] border border-orange-200'
                                    : 'bg-stone-100 text-stone-600 border border-stone-200'
                                )}
                              >
                                {lockInfo.requiredTier}
                              </span>
                              <Lock className="w-3.5 h-3.5 text-stone-400" />
                            </div>
                          ) : (
                            <ChevronRight
                              className={cn(
                                'w-4 h-4',
                                isActive ? 'text-[#F97316]' : 'text-stone-300'
                              )}
                            />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
