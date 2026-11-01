'use client';

import React from 'react';
import { UserSidebar } from '@/components/user/UserSidebar';
import { UserHeader } from '@/components/user/UserHeader';
import { UserMobileBottomNavigation } from '@/components/user/UserMobileBottomNavigation';
import { UserAuthGuard } from '@/components/user/UserAuthGuard';

export default function UserPortalLayout({ children }) {
  return (
    <UserAuthGuard>
      <div className="flex h-screen bg-[#FFFDF9] overflow-hidden text-[#292524] font-sans">
        {/* Desktop Sidebar (Only visible on md screens and above, hidden on mobile) */}
        <UserSidebar className="hidden md:flex shrink-0" />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <UserHeader />
          <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-28 md:pb-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto w-full">{children}</div>
          </main>
        </div>

        {/* Floating Pill Mobile Bottom Navigation (Identical to Image 2: Home, Customers, Enquiries, Bookings/Consult, More) */}
        <UserMobileBottomNavigation />
      </div>
    </UserAuthGuard>
  );
}
