'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { authApi } from '@/services/api/modules';
import { useAuthStore } from '@/store/authStore';

export default function StudioUserLoginPage() {
  const params = useParams();
  const router = useRouter();
  const studioSlug = params?.businessSlug;

  const { setAuth } = useAuthStore();

  const [studioInfo, setStudioInfo] = useState(null);
  const [loadingStudio, setLoadingStudio] = useState(true);
  const [studioError, setStudioError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch studio branding info on mount
  useEffect(() => {
    if (!studioSlug) return;
    let isMounted = true;

    async function loadStudio() {
      try {
        setLoadingStudio(true);
        setStudioError('');
        const res = await authApi.getStudioInfo(studioSlug);
        if (isMounted) {
          setStudioInfo(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setStudioError(
            err.response?.data?.message ||
              err.message ||
              'Bridal studio not found. Please verify the URL.'
          );
        }
      } finally {
        if (isMounted) setLoadingStudio(false);
      }
    }

    loadStudio();
    return () => {
      isMounted = false;
    };
  }, [studioSlug]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authApi.studioUserLogin({
        studioSlug,
        email: email.trim(),
        password,
      });

      const { token, user, memberships } = response.data;

      // Store in authStore
      setAuth({ user, token, memberships });

      // Redirect directly to dedicated user operational dashboard
      const targetSlug = studioSlug || memberships?.[0]?.businessSlug || 'srinivasbridalstudio';
      window.location.href = `/${targetSlug}/user/dashboard`;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to sign in. Please verify your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const studioName = studioInfo?.name || 'Bridal Studio';

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between items-center px-3 sm:px-4 py-6 sm:py-8 selection:bg-amber-100 selection:text-amber-900">
      <div />

      {/* Main Responsive Card Container (supports 360px up to desktop) */}
      <div className="w-full max-w-[440px] mx-auto my-auto transition-all duration-200">
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-5 sm:p-9 relative">
          
          {loadingStudio ? (
            <div className="py-14 flex flex-col items-center justify-center space-y-3">
              <div className="w-6 h-6 border-2 border-orange-500/30 border-t-[#FF6B00] rounded-full animate-spin" />
              <p className="text-xs text-stone-500 font-medium">Connecting to studio...</p>
            </div>
          ) : studioError ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-stone-900">Studio Not Found</h2>
              <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
                {studioError}
              </p>
            </div>
          ) : (
            <>
              {/* VARNAM Bridal Studio Logo Header — Identical to Image 1 */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative w-48 sm:w-60 h-24 sm:h-28 mb-1 sm:mb-2 transition-transform hover:scale-[1.02] duration-200">
                  <Image
                    src="/varnam-logo.png"
                    alt="VARNAM Bridal Studio"
                    fill
                    sizes="(max-width: 640px) 192px, 240px"
                    className="object-contain"
                    priority
                  />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  Studio Sign In
                </h1>
                <p className="text-xs text-stone-500 mt-1 max-w-[290px] leading-relaxed">
                  Access your bridal calendar, clients &amp; studio management
                </p>
              </div>

              {/* Server / Validation Error Box */}
              {errorMessage && (
                <div className="mb-4 p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-start gap-2">
                  <span className="font-bold">Error:</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="studio@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      suppressHydrationWarning
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-stone-50/70 border border-stone-200 hover:border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-600"
                    />
                  </div>
                </div>

                {/* Password with Forgot? inline link */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-stone-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          `Please contact your studio owner at ${studioName} to reset your employee password.`
                        )
                      }
                      className="text-[11px] font-medium text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      suppressHydrationWarning
                      className="w-full pl-10 pr-10 py-2.5 sm:py-3 bg-stone-50/70 border border-stone-200 hover:border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-600"
                    />
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button — Identical gradient and shape to Image 1 */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  suppressHydrationWarning
                  className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md shadow-amber-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Studio</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Studio Attribution Footer inside card */}
                <div className="text-center text-xs text-stone-500 pt-3 border-t border-stone-100">
                  Authorized employee access for{' '}
                  <span className="font-semibold text-stone-700">{studioName}</span>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Clean Minimal Footer — Identical to Image 1 */}
      <footer className="w-full max-w-md text-center text-xs text-stone-400 py-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3">
        <span>
          Powered by <span className="font-medium text-stone-600">VEXA TECH</span>
        </span>
        <span className="hidden sm:inline text-stone-300">•</span>
        <span>Bridal &amp; Makeup Business SaaS</span>
      </footer>
    </div>
  );
}
