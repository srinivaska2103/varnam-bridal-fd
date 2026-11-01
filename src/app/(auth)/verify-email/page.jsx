'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Mail, KeyRound, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { authApi } from '@/services/api/modules';

const otpSchema = z.object({
  email: z.string().email('Please enter a valid email address').optional(),
  userId: z.string().optional(),
  otp: z.string().length(6, 'Verification code must be 6 digits'),
}).refine((data) => data.email || data.userId, {
  message: 'Email address or user ID is required',
  path: ['email'],
});

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [serverError, setServerError] = useState('');
  const [resending, setResending] = useState(false);

  // Read id or email from search parameters or sessionStorage
  const queryId = searchParams.get('id') || '';
  const queryEmail = searchParams.get('email') || '';

  const [userId, setUserId] = useState(queryId);
  const [userEmail, setUserEmail] = useState(queryEmail);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { email: queryEmail, userId: queryId, otp: '' },
  });

  const emailValue = watch('email');

  useEffect(() => {
    // If raw email was in URL, replace URL with clean or id-based address bar
    if (queryEmail) {
      sessionStorage.setItem('pending_verify_email', queryEmail);
      setUserEmail(queryEmail);
      setValue('email', queryEmail);
      // Clean URL search bar so email is not exposed
      if (queryId) {
        window.history.replaceState(null, '', `/verify-email?id=${encodeURIComponent(queryId)}`);
      } else {
        window.history.replaceState(null, '', '/verify-email');
      }
    } else if (queryId) {
      setUserId(queryId);
      setValue('userId', queryId);
      const stored = sessionStorage.getItem('pending_verify_email');
      if (stored) {
        setUserEmail(stored);
        setValue('email', stored);
      }
    } else {
      const stored = sessionStorage.getItem('pending_verify_email');
      if (stored) {
        setUserEmail(stored);
        setValue('email', stored);
      }
    }
  }, [queryEmail, queryId, setValue]);

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const payload = {
        otp: data.otp,
        ...(data.email ? { email: data.email } : {}),
        ...(userId || data.userId ? { userId: userId || data.userId } : {}),
      };

      otpSchema.parse(payload);

      await authApi.verifyEmail(payload);
      sessionStorage.removeItem('pending_verify_email');
      addToast({
        title: 'Email Verified!',
        description: 'You can now sign in with your email and password.',
        variant: 'success',
      });

      router.push('/login');
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        setServerError(err.errors[0]?.message);
      } else {
        setServerError(err.message || 'Verification failed. Please check the code.');
      }
    }
  };

  const handleResend = async () => {
    if (!emailValue && !userId) {
      setServerError('Please enter your email to resend OTP');
      return;
    }
    setResending(true);
    setServerError('');
    try {
      await authApi.resendOtp({
        ...(emailValue ? { email: emailValue } : {}),
        ...(userId ? { userId } : {}),
      });
      addToast({
        title: 'Code resent!',
        description: 'A new 6-digit verification code was sent to your email.',
        variant: 'success',
      });
    } catch (err) {
      setServerError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between items-center px-4 py-8 selection:bg-amber-100 selection:text-amber-900">
      <div />

      {/* Centered Verify Email Card */}
      <div className="w-full max-w-[440px] mx-auto my-auto">
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-6 sm:p-9">
          
          {/* VARNAM Bridal Studio Logo Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative w-52 sm:w-60 h-24 sm:h-28 mb-2">
              <Image
                src="/varnam-logo.png"
                alt="VARNAM Bridal Studio"
                fill
                sizes="(max-width: 640px) 208px, 240px"
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Verify Your Email</h1>
            <p className="text-xs text-stone-500 mt-1">
              Enter the 6-digit verification code sent to your email
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-start gap-2">
                <span className="font-bold">Error:</span>
                <span>{serverError}</span>
              </div>
            )}

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
                  placeholder="studio@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-stone-50/70 border rounded-xl text-sm text-stone-900 placeholder-stone-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-600 ${
                    errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-stone-200 hover:border-stone-300'
                  }`}
                  {...register('email', { required: 'Email is required' })}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* 6-Digit OTP */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-stone-50/70 border rounded-xl text-center text-lg tracking-widest font-mono text-stone-900 placeholder-stone-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-600 ${
                    errors.otp ? 'border-rose-400 bg-rose-50/20' : 'border-stone-200 hover:border-stone-300'
                  }`}
                  {...register('otp', { required: 'Verification code is required' })}
                />
              </div>
              {errors.otp && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.otp.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-md shadow-amber-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Activate Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Resend & Sign in links */}
            <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-semibold text-amber-700 hover:text-amber-800 hover:underline disabled:opacity-50 cursor-pointer"
              >
                {resending ? 'Sending...' : 'Resend code'}
              </button>

              <Link href="/login" className="hover:underline">
                Back to Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Clean Minimal Footer */}
      <footer className="w-full max-w-md text-center text-xs text-stone-400 py-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3">
        <span>Powered by <span className="font-medium text-stone-600">VEXA TECH</span></span>
        <span className="hidden sm:inline text-stone-300">•</span>
        <span>Bridal & Makeup Business SaaS</span>
      </footer>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
