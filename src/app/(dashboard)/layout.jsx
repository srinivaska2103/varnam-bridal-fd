'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileBottomNavigation } from '@/components/layout/MobileBottomNavigation';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useAuthStore } from '@/store/authStore';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentBusiness, user, isInitialized, isAuthenticated } = useAuthStore();

  // Strict role separation: If a USER account accesses the admin dashboard root, redirect to their dedicated portal
  const isEmployeeUser = isInitialized && isAuthenticated && (currentBusiness?.role === 'USER' || user?.role === 'USER');
  const userStudioSlug = currentBusiness?.slug || currentBusiness?.businessSlug || 'srinivasbridalstudio';

  React.useEffect(() => {
    if (isInitialized && isAuthenticated && isEmployeeUser) {
      router.replace(`/${userStudioSlug}/user/dashboard`);
    }
  }, [isInitialized, isAuthenticated, isEmployeeUser, userStudioSlug, router]);

  // Whitelisted un-gated routes
  const isUngatedRoute =
    pathname === '/subscription' ||
    pathname.startsWith('/subscription') ||
    pathname === '/settings' ||
    pathname === '/dashboard' ||
    pathname.startsWith('/help-support');

  // If authenticated admin visits legacy root /dashboard, cleanly redirect to their dedicated /[studioSlug]/admin/dashboard
  React.useEffect(() => {
    if (isInitialized && isAuthenticated && !isEmployeeUser) {
      if (pathname === '/dashboard') {
        router.replace(`/${userStudioSlug}/admin/dashboard`);
      }
    }
  }, [isInitialized, isAuthenticated, isEmployeeUser, userStudioSlug, pathname, router]);

  if (isEmployeeUser) {
    return (
      <AuthGuard>
        <div className="flex h-screen items-center justify-center bg-[#FFFDF9]">
          <p className="text-sm font-semibold text-stone-500">Routing to dedicated staff workspace...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
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
    </AuthGuard>
  );
}
