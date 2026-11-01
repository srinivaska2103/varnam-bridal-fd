'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { authApi } from '@/services/api/modules';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters with letters & numbers'),
});

export default function RegisterPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      registerSchema.parse(data);

      const res = await authApi.register(data);
      addToast({
        title: 'Account created!',
        description: 'Verification code sent to your email address.',
        variant: 'success',
      });

      const generatedId = res?.data?.userId;
      if (generatedId) {
        sessionStorage.setItem('pending_verify_email', data.email);
        router.push(`/verify-email?id=${encodeURIComponent(generatedId)}`);
      } else {
        router.push(`/verify-email`);
      }
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        setServerError(err.errors[0]?.message);
      } else {
        setServerError(err.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col justify-between items-center px-4 py-8 selection:bg-amber-100 selection:text-amber-900">
      <div />

      {/* Centered Register Card */}
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
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Create Studio Account</h1>
            <p className="text-xs text-stone-500 mt-1">
              Start your 14-day trial for bridal studio management
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

            {/* Artist / Studio Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Full Name / Studio Artist
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Pooja Sundaram"
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-stone-50/70 border rounded-xl text-sm text-stone-900 placeholder-stone-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-600 ${
                    errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-stone-200 hover:border-stone-300'
                  }`}
                  {...register('name', { required: 'Name is required' })}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.name.message}</p>
              )}
            </div>

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

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  className={`w-full pl-10 pr-10 py-2.5 sm:py-3 bg-stone-50/70 border rounded-xl text-sm text-stone-900 placeholder-stone-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-600 ${
                    errors.password ? 'border-rose-400 bg-rose-50/20' : 'border-stone-200 hover:border-stone-300'
                  }`}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.password.message}</p>
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Studio Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Sign in link */}
            <div className="text-center text-xs text-stone-500 pt-3 border-t border-stone-100">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-amber-700 hover:text-amber-800 hover:underline">
                Sign in
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
