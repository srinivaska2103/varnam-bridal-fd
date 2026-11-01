'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui';

export function AdminAuthGuard({ children }) {
  const router = useRouter();
  const params = useParams();
  const studioSlug = params?.businessSlug;

  const { isAuthenticated, isInitialized, initialize, currentBusiness, user } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[AdminAuthGuard] Unauthenticated. Redirecting to /login');
        }
        router.replace('/login');
        return;
      }

      // Check role: Must be OWNER or MANAGER (Admin level)
      const userRole = currentBusiness?.role || user?.role;
      if (userRole === 'USER') {
        const targetSlug = currentBusiness?.slug || currentBusiness?.businessSlug || studioSlug || 'srinivasbridalstudio';
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[AdminAuthGuard] USER attempted accessing ADMIN route. Redirecting to user dashboard:', targetSlug);
        }
        router.replace(`/${targetSlug}/user/dashboard`);
        return;
      }

      // Check studio slug matching: Verify tenant isolation
      const currentSlug = currentBusiness?.slug || currentBusiness?.businessSlug;
      if (studioSlug && currentSlug && studioSlug.toLowerCase() !== currentSlug.toLowerCase()) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[AdminAuthGuard] Tenant slug mismatch. Redirecting to correct studio admin dashboard:', currentSlug);
        }
        router.replace(`/${currentSlug}/admin/dashboard`);
      }
    }
  }, [isInitialized, isAuthenticated, currentBusiness, user, studioSlug, router]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FFFDF9]">
        <LoadingSpinner text="Checking studio administration session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const userRole = currentBusiness?.role || user?.role;
  if (userRole === 'USER') {
    return null;
  }

  return children;
}

