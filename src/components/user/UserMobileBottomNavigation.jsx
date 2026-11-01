'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import {
  Home,
  Users,
  MessageCircle,
  CalendarCheck2,
  LayoutGrid,
  Sparkles,
  Package,
  FileSpreadsheet,
  Bell,
  HelpCircle,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';

export function UserMobileBottomNavigation() {
  const pathname = usePathname();
  const params = useParams();
  const studioSlug = params?.businessSlug || 'srinivasbridalstudio';
  const { currentBusiness, user, logout } = useAuthStore();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // 4 Primary tabs exactly matching Image 2
  const primaryTabs = [
    { label: 'Home', pathSegment: 'dashboard', icon: Home },
    { label: 'Customers', pathSegment: 'customers', icon: Users },
    { label: 'Enquiries', pathSegment: 'enquiries', icon: MessageCircle },
    { label: 'Consult', pathSegment: 'consultations', icon: CalendarCheck2 },
  ];

  // Secondary items accessed via "More" modal sheet
  const moreItems = [
    { label: 'Services', pathSegment: 'services', icon: Sparkles },
    { label: 'Packages', pathSegment: 'packages', icon: Package },
    { label: 'Quotations', pathSegment: 'quotations', icon: FileSpreadsheet },
    { label: 'Notifications', pathSegment: 'notifications', icon: Bell },
    { label: 'Help & Support', pathSegment: 'help-support', icon: HelpCircle },
  ];

  const isPrimaryActive = primaryTabs.some((tab) => {
    const href = `/${studioSlug}/user/${tab.pathSegment}`;
    return pathname === href || (tab.pathSegment !== 'dashboard' && pathname.startsWith(href));
  });

  const isMoreActive = !isPrimaryActive;

  const handleLogout = () => {
    logout();
    window.location.href = `/${studioSlug}/user/login`;
  };

  return (
    <>
      {/* Floating Pill Mobile Navigation Bar — Exactly Matching Image 2 */}
      <div className="fixed bottom-[calc(10px+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex justify-center px-3 pointer-events-none md:hidden">
        <nav
          className="pointer-events-auto w-[calc(100%-12px)] max-w-[420px] h-[60px] sm:h-[66px] bg-white/95 rounded-[999px] border border-[#FED7AA] shadow-[0_8px_30px_rgba(234,88,12,0.14)] flex items-center justify-around px-1.5 py-0.5 select-none backdrop-blur-md"
          aria-label="Staff Mobile Navigation"
        >
          {primaryTabs.map((tab) => {
            const itemHref = `/${studioSlug}/user/${tab.pathSegment}`;
            const isActive =
              pathname === itemHref ||
              (tab.pathSegment !== 'dashboard' && pathname.startsWith(itemHref));
            const Icon = tab.icon;

            return (
              <Link
                key={tab.pathSegment}
                href={itemHref}
                className="flex flex-col items-center justify-center flex-1 h-full py-0.5 px-0.5 transition-all duration-200 ease-in-out group focus:outline-none"
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

          {/* More Tab with 4-square LayoutGrid icon matching Image 2 */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full py-0.5 px-0.5 transition-all duration-200 ease-in-out group focus:outline-none cursor-pointer"
            aria-label="Open more menu options"
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
                'text-[9px] sm:text-[10px] tracking-tight mt-0.5 leading-tight transition-colors duration-200 ease-in-out',
                isMoreActive ? 'font-bold text-[#EA580C]' : 'font-medium text-stone-500'
              )}
            >
              More
            </span>
          </button>
        </nav>
      </div>

      {/* "More" Bottom Sheet Drawer for Additional User Modules */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl p-5 border-t border-[#F0E7DE] z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E7DE]">
              <span className="font-extrabold text-sm text-stone-900">More Studio Features</span>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 py-4">
              {moreItems.map((item) => {
                const itemHref = `/${studioSlug}/user/${item.pathSegment}`;
                const isActive = pathname === itemHref || pathname.startsWith(itemHref);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.pathSegment}
                    href={itemHref}
                    onClick={() => setIsMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-xs font-bold',
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-[#EA580C] text-white border-transparent shadow-xs'
                        : 'bg-stone-50/80 border-[#F0E7DE] text-stone-700 hover:bg-orange-50/40 hover:border-orange-200'
                    )}
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-xl flex items-center justify-center shrink-0',
                        isActive ? 'bg-white/20 text-white' : 'bg-orange-100/70 text-[#C2410C]'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#F0E7DE] flex items-center justify-between">
              <span className="text-xs text-stone-500">{user?.name || 'Staff User'}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
