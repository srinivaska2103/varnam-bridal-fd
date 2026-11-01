'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function StudioUserLogoutPage() {
  const params = useParams();
  const router = useRouter();
  const studioSlug = params?.businessSlug;
  const { logout } = useAuthStore();

  useEffect(() => {
    logout();
    if (studioSlug) {
      router.replace(`/${studioSlug}/user/login`);
    } else {
      router.replace('/login');
    }
  }, [studioSlug, router, logout]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF9]">
      <p className="text-xs font-semibold text-stone-500">Signing out from studio portal...</p>
    </div>
  );
}

