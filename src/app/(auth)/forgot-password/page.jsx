'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { authApi } from '@/services/api/modules';

const forgotEmailSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

const resetPasswordSchema = z
  .object({
    otp: z
      .string()
      .trim()
      .length(6, 'Verification code must be exactly 6 digits')
      .regex(/^[0-9]+$/, 'Code must contain numbers only'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[a-z]/, 'Must include at least one lowercase letter')
      .regex(/[0-9]/, 'Must include at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // Step 1: 'email' -> enter email to receive OTP
  // Step 2: 'verify_and_reset' -> enter 6-digit OTP & new password
  // Step 3: 'success' -> password updated successfully
  const [step, setStep] = useState('email');
  const [emailAddress, setEmailAddress] = useState('');
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resending, setResending] = useState(false);

  // Email Step Form
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors, isSubmitting: isSubmittingEmail },
  } = useForm({
    defaultValues: { email: '' },
  });

  // Reset Step Form
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isSubmittingReset },
  } = useForm({
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  });

  // Handle Step 1: Send OTP to Email
  const onSendOtp = async (data) => {
    setServerError('');
    try {
      forgotEmailSchema.parse(data);
      const normalized = data.email.trim().toLowerCase();

      await authApi.forgotPassword({ email: normalized });

      setEmailAddress(normalized);
      setStep('verify_and_reset');
      addToast({
        title: 'Verification Code Sent',
        description: `A 6-digit security OTP was sent to ${normalized}`,
        variant: 'success',
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to process reset request. Please check your email.';
      setServerError(msg);
    }
  };

  // Handle Step 2: Verify OTP and Set New Password
  const onResetPassword = async (data) => {
    setServerError('');
    try {
      resetPasswordSchema.parse(data);

      await authApi.resetPassword({
        email: emailAddress,
        otp: data.otp.trim(),
        newPassword: data.newPassword,
      });

      setStep('success');
      addToast({
        title: 'Password Reset Successful!',
        description: 'Your studio password has been updated. You can now log in.',
        variant: 'success',
      });
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        setServerError(err.errors[0]?.message);
      } else {
        const msg = err.response?.data?.message || err.message || 'Failed to reset password. Please check your code.';
        setServerError(msg);
      }
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!emailAddress) return;
    setResending(true);
    setServerError('');
    try {
      await authApi.forgotPassword({ email: emailAddress });
      addToast({
        title: 'New Code Dispatched',
        description: `A fresh 6-digit verification code was sent to ${emailAddress}`,
        variant: 'success',
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend verification code.';
      setServerError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between items-center px-4 py-8 selection:bg-amber-100 selection:text-amber-900">
      <div />

      {/* Centered Forgot Password Card */}
      <div className="w-full max-w-[460px] mx-auto my-auto">
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
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              {step === 'email' && 'Reset Password'}
              {step === 'verify_and_reset' && 'Verify Code & Set Password'}
              {step === 'success' && 'Password Updated!'}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              {step === 'email' && 'Enter your registered studio email to receive a 6-digit OTP code'}
              {step === 'verify_and_reset' && `We sent a 6-digit code to ${emailAddress}`}
              {step === 'success' && 'Your account security credentials have been updated.'}
            </p>
          </div>

          {/* Global Server Error Alert */}
          {serverError && (
            <div className="mb-4 p-3.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl flex items-start gap-2 animate-in fade-in">
              <span className="font-bold">Error:</span>
              <span>{serverError}</span>
            </div>
          )}

          {/* STEP 1: ENTER EMAIL FORM */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit(onSendOtp)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  Registered Studio Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    placeholder="studio@example.com"
                    autoComplete="email"
                    className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-stone-50/70 border rounded-xl text-sm text-stone-900 placeholder-stone-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/25 focus:border-[#F97316] ${
                      emailErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-stone-200 hover:border-stone-300'
                    }`}
                    {...registerEmail('email', { required: 'Email address is required' })}
                  />
                </div>
                {emailErrors.email && (
                  <p className="text-[11px] text-rose-600 font-medium">{emailErrors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmittingEmail}
                className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#F97316] to-[#C2410C] hover:from-[#EA580C] hover:to-[#9A3412] shadow-md shadow-orange-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingEmail ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending Security Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center text-xs text-stone-500 pt-3 border-t border-stone-100">
                Remember your password?{' '}
                <Link href="/login" className="font-semibold text-[#F97316] hover:text-[#C2410C] hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY OTP & ENTER NEW PASSWORD */}
          {step === 'verify_and_reset' && (
            <form onSubmit={handleResetSubmit(onResetPassword)} className="space-y-4">
              {/* Notice with email badge */}
              <div className="flex items-center justify-between p-3 bg-orange-50/60 border border-orange-200/80 rounded-2xl text-xs">
                <span className="text-stone-600 truncate mr-2">
                  Code sent to <strong className="text-stone-900 font-bold">{emailAddress}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setServerError('');
                  }}
                  className="text-xs font-bold text-[#F97316] hover:text-[#C2410C] hover:underline shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* 6-Digit OTP Code */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  6-Digit Verification Code (OTP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-stone-50/70 border rounded-xl text-lg font-mono tracking-widest text-stone-900 placeholder-stone-300 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/25 focus:border-[#F97316] ${
                      resetErrors.otp ? 'border-rose-400 bg-rose-50/20' : 'border-stone-200 hover:border-stone-300'
                    }`}
                    {...registerReset('otp', { required: 'Verification code is required' })}
                  />
                </div>
                {resetErrors.otp && (
                  <p className="text-[11px] text-rose-600 font-medium">{resetErrors.otp.message}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 chars, 1 uppercase, 1 digit"
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-10 py-2.5 sm:py-3 bg-stone-50/70 border rounded-xl text-sm text-stone-900 placeholder-stone-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/25 focus:border-[#F97316] ${
                      resetErrors.newPassword ? 'border-rose-400 bg-rose-50/20' : 'border-stone-200 hover:border-stone-300'
                    }`}
                    {...registerReset('newPassword', { required: 'New password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {resetErrors.newPassword && (
                  <p className="text-[11px] text-rose-600 font-medium">{resetErrors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-10 py-2.5 sm:py-3 bg-stone-50/70 border rounded-xl text-sm text-stone-900 placeholder-stone-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#F97316]/25 focus:border-[#F97316] ${
                      resetErrors.confirmPassword ? 'border-rose-400 bg-rose-50/20' : 'border-stone-200 hover:border-stone-300'
                    }`}
                    {...registerReset('confirmPassword', { required: 'Please confirm password' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {resetErrors.confirmPassword && (
                  <p className="text-[11px] text-rose-600 font-medium">{resetErrors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmittingReset}
                className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#F97316] to-[#C2410C] hover:from-[#EA580C] hover:to-[#9A3412] shadow-md shadow-orange-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingReset ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Code & Updating...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP & Save Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend OTP button */}
              <div className="flex items-center justify-between text-xs pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="font-semibold text-[#F97316] hover:text-[#C2410C] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>{resending ? 'Resending code...' : 'Resend OTP'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setServerError('');
                  }}
                  className="text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS STATE */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-stone-900">Password Changed Successfully!</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Your VARNAM Bridal Studio account password has been updated. You can now log in securely.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#F97316] to-[#C2410C] hover:from-[#EA580C] hover:to-[#9A3412] shadow-md shadow-orange-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Continue to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
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
