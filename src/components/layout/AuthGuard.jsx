'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui';

export function AuthGuard({ children }) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, initialize, currentBusiness, user } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      const isUserRole = currentBusiness?.role === 'USER' || user?.role === 'USER';
      const slug = currentBusiness?.slug || currentBusiness?.businessSlug;
      if (isUserRole && slug) {
        router.replace(`/${slug}/user/login`);
      } else {
        router.replace('/login');
      }
    }
  }, [isInitialized, isAuthenticated, currentBusiness, user, router]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-50">
        <LoadingSpinner text="Checking authentication session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
