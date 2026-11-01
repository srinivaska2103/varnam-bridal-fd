'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui';

export function UserAuthGuard({ children }) {
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
          console.log('[UserAuthGuard] Unauthenticated. Redirecting to user login:', studioSlug);
        }
        router.replace(`/${studioSlug || 'srinivasbridalstudio'}/user/login`);
        return;
      }

      // Check role: Must be USER
      const userRole = currentBusiness?.role || user?.role;
      if (userRole === 'OWNER' || userRole === 'SUPER_ADMIN') {
        const currentSlug = currentBusiness?.slug || currentBusiness?.businessSlug || studioSlug || 'srinivasbridalstudio';
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[UserAuthGuard] ADMIN attempted accessing USER route. Redirecting to admin dashboard:', currentSlug);
        }
        router.replace(`/${currentSlug}/admin/dashboard`);
        return;
      }

      // Check studio slug matching
      const currentSlug = currentBusiness?.slug || currentBusiness?.businessSlug;
      if (studioSlug && currentSlug && studioSlug.toLowerCase() !== currentSlug.toLowerCase()) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[UserAuthGuard] Tenant slug mismatch. Redirecting to correct user dashboard:', currentSlug);
        }
        router.replace(`/${currentSlug}/user/dashboard`);
      }
    }
  }, [isInitialized, isAuthenticated, currentBusiness, user, studioSlug, router]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FFFDF9]">
        <LoadingSpinner text="Checking staff authentication session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const userRole = currentBusiness?.role || user?.role;
  if (userRole === 'OWNER' || userRole === 'SUPER_ADMIN') {
    return null;
  }

  return children;
}

