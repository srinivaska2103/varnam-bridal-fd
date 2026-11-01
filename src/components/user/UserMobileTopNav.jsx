'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useParams } from 'next/navigation';
import {
  X,
  LayoutDashboard,
  Users,
  MessageSquare,
  CalendarClock,
  Sparkles,
  Package,
  FileSpreadsheet,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/formatters';
import { USER_NAVIGATION_ITEMS } from './UserSidebar';

export function UserMobileTopNav({ isOpen, onClose }) {
  const pathname = usePathname();
  const params = useParams();
  const studioSlug = params?.businessSlug || 'srinivasbridalstudio';
  const { currentBusiness, user, logout } = useAuthStore();

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 md:hidden flex flex-col">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Top Slide-Down Sheet */}
      <div className="relative w-full max-h-[85vh] bg-gradient-to-b from-[#FFFDF9] via-white to-[#FAF6F0] rounded-b-3xl shadow-2xl z-10 flex flex-col border-b border-[#F0E7DE] overflow-hidden animate-in slide-in-from-top duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-[#F0E7DE] flex items-center justify-between bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden bg-white border border-[#EADBCC] flex items-center justify-center shrink-0 shadow-xs">
              <Image
                src={studioLogo}
                alt={studioName}
                width={36}
                height={36}
                className="object-contain w-full h-full p-1"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-xs text-[#292524] truncate leading-tight">
                {studioName}
              </span>
              <span className="inline-block text-[9px] font-black uppercase text-orange-700 bg-orange-100/90 px-1.5 py-0.2 rounded-md mt-0.5 w-max">
                Staff Portal
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Grid (Interactive 2-column or clean list on mobile) */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="text-[10px] font-black tracking-wider text-stone-400 uppercase mb-2 px-1">
            Studio Navigation
          </div>

          <div className="grid grid-cols-2 gap-2">
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
                    'flex items-center gap-2.5 p-3 rounded-2xl border transition-all duration-150',
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-[#EA580C] text-white border-transparent shadow-md shadow-orange-500/20 font-bold'
                      : 'bg-white border-[#F0E7DE] text-stone-700 hover:border-orange-200 hover:bg-orange-50/40 active:scale-98 font-semibold'
                  )}
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-xl flex items-center justify-center shrink-0',
                      isActive ? 'bg-white/20 text-white' : 'bg-orange-50 text-[#C2410C]'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer: User Details & Logout */}
        <div className="p-4 bg-stone-50 border-t border-[#F0E7DE] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-stone-800 truncate">{user?.name || 'Staff'}</p>
              <p className="text-[10px] text-stone-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

