'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useParams } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  CalendarClock,
  Sparkles,
  Package,
  FileSpreadsheet,
  Bell,
  HelpCircle,
  LogOut,
  X,
  ChevronRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/formatters';

export const USER_NAVIGATION_ITEMS = [
  { label: 'Dashboard', pathSegment: 'dashboard', icon: LayoutDashboard, badge: null },
  { label: 'Calendar', pathSegment: 'calendar', icon: Calendar, badge: null },
  { label: 'Enquiries', pathSegment: 'enquiries', icon: MessageSquare, badge: 'Leads' },
  { label: 'Consultations', pathSegment: 'consultations', icon: CalendarClock, badge: null },
  { label: 'Customers', pathSegment: 'customers', icon: Users, badge: null },
  { label: 'Services', pathSegment: 'services', icon: Sparkles, badge: null },
  { label: 'Packages', pathSegment: 'packages', icon: Package, badge: null },
  { label: 'Quotations', pathSegment: 'quotations', icon: FileSpreadsheet, badge: null },
  { label: 'Notifications', pathSegment: 'notifications', icon: Bell, badge: null },
  { label: 'Help & Support', pathSegment: 'help-support', icon: HelpCircle, badge: null },
];

export function UserSidebar({ className, onClose }) {
  const pathname = usePathname();
  const params = useParams();
  const studioSlug = params?.businessSlug || 'srinivasbridalstudio';
  const { currentBusiness, user, logout } = useAuthStore();

  const studioName = currentBusiness?.name || 'Bridal Studio';
  const studioLogo = currentBusiness?.logo_url || '/varnam-logo.png';

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const handleLogout = () => {
    logout();
    window.location.href = `/${studioSlug}/user/login`;
  };

  return (
    <aside
      className={cn(
        'w-68 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#FFFDF9] border-r border-[#F0E7DE]/80 flex flex-col h-full select-none z-30 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)]',
        className
      )}
    >
      {/* Studio Header Card */}
      <div className="p-4 border-b border-[#F0E7DE]/70">
        <div className="flex items-center justify-between">
          <Link
            href={`/${studioSlug}/user/dashboard`}
            className="flex items-center gap-3 group focus:outline-none min-w-0 flex-1"
          >
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-white border border-[#EADBCC] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
              <Image
                src={studioLogo}
                alt={studioName}
                width={40}
                height={40}
                className="object-contain w-full h-full p-1"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-xs text-[#292524] truncate group-hover:text-[#EA580C] transition-colors leading-tight tracking-tight">
                {studioName}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  STAFF WORKSPACE
                </span>
              </div>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation List — Exactly 9 Permitted Modules */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5 custom-scrollbar">
        <div className="px-3 pb-1.5 flex items-center justify-between text-[10px] font-black tracking-wider text-stone-400 uppercase">
          <span>OPERATIONAL MODULES</span>
          <span className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.2 rounded font-bold">9</span>
        </div>

        {USER_NAVIGATION_ITEMS.map((item) => {
          const itemHref = `/${studioSlug}/user/${item.pathSegment}`;
          const isActive =
            pathname === itemHref ||
            (item.pathSegment !== 'dashboard' && pathname.startsWith(itemHref));
          const Icon = item.icon;

          return (
            <Link
              key={item.pathSegment}
              href={itemHref}
              onClick={onClose}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-[#EA580C] text-white shadow-md shadow-orange-500/20 translate-x-1'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/90 hover:shadow-2xs'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-stone-100/80 text-stone-500 group-hover:bg-orange-50 group-hover:text-orange-600'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>

              <span className="truncate flex-1 tracking-tight">{item.label}</span>

              {item.badge && !isActive && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700">
                  {item.badge}
                </span>
              )}

              {isActive && (
                <div className="w-2 h-2 rounded-full bg-white shadow-xs shrink-0" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Staff Profile Card Footer */}
      <div className="p-3.5 border-t border-[#F0E7DE]/80 bg-gradient-to-t from-white to-[#FAF6F0]/80">
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[#F0E7DE] shadow-xs hover:border-orange-200 transition-all">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-[#292524] truncate leading-tight">
              {user?.name || 'Staff User'}
            </p>
            <p className="text-[10px] font-medium text-stone-500 truncate leading-tight mt-0.5">
              {user?.email || 'Active Employee'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
