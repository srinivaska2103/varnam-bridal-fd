'use client';

import React from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileBottomNavigation } from '@/components/layout/MobileBottomNavigation';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useAuthStore } from '@/store/authStore';

export default function AdminPortalLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const studioSlug = params?.businessSlug;
  const { currentBusiness, user, isInitialized, isAuthenticated } = useAuthStore();

  // Strict role separation: If a USER account accesses admin portal, redirect to dedicated user portal
  const isEmployeeUser = isInitialized && isAuthenticated && (currentBusiness?.role === 'USER' || user?.role === 'USER');
  const targetSlug = currentBusiness?.slug || currentBusiness?.businessSlug || studioSlug || 'srinivasbridalstudio';

  React.useEffect(() => {
    if (isInitialized && isAuthenticated && isEmployeeUser) {
      router.replace(`/${targetSlug}/user/dashboard`);
    }
  }, [isInitialized, isAuthenticated, isEmployeeUser, targetSlug, router]);

  // Whitelisted un-gated routes
  const isUngatedRoute =
    pathname.includes('/subscription') ||
    pathname.includes('/settings') ||
    pathname.includes('/dashboard') ||
    pathname.includes('/help-support');

  if (isEmployeeUser) {
    return (
      <AdminAuthGuard>
        <div className="flex h-screen items-center justify-center bg-[#FFFDF9]">
          <p className="text-sm font-semibold text-stone-500">Routing to dedicated staff workspace...</p>
        </div>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <div className="flex h-screen bg-[#FFFDF9] overflow-hidden text-[#292524] font-sans">
        {/* Desktop Sidebar (Only visible on md screens and above, completely hidden on mobile) */}
        <Sidebar className="hidden md:flex shrink-0" />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-28 md:pb-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto w-full">
              {isUngatedRoute ? (
                children
              ) : (
                <FeatureGate routePath={pathname}>{children}</FeatureGate>
              )}
            </div>
          </main>
        </div>

        {/* Mobile Fixed Bottom Navigation Bar (Visible only below md: 768px) */}
        <MobileBottomNavigation />
      </div>
    </AdminAuthGuard>
  );
}
