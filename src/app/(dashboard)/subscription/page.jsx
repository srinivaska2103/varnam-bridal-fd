'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Check,
  Building2,
  Calendar,
  Lock,
  Layers,
  HelpCircle,
  Globe,
  Receipt,
  IndianRupee,
  Tag,
  ChevronRight,
  ExternalLink,
  PhoneCall,
} from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { websiteService } from '@/services/website';
import { useToast } from '@/components/ui/Toast';
import { Button, Card, Badge, LoadingSpinner, EmptyState, PageHeader } from '@/components/ui';
import { ContactSalesModal } from '@/components/subscription/ContactSalesModal';

// Dynamically load official Razorpay SDK script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};


// Feature matrix mapping based on specification
const PLAN_SPECS = {
  BASIC_MONTHLY: {
    tier: 'STARTER',
    badge: 'Starter',
    tagline: 'Essential studio management tool for independent bridal artists.',
    popular: false,
    color: 'stone',
    featuresList: [
      'Customer Management',
      'Enquiry Management',
      'Bookings & Calendar',
      'Consultations',
      'Services & Packages',
      'Quotations',
      'Manual Payment Records',
      'Expenses Tracking',
      'Reports & Analytics',
      'Notifications',
      'Custom Enquiry Form',
    ],
  },
  GROWTH_MONTHLY: {
    tier: 'GROWTH',
    badge: 'Growth',
    tagline: 'Ideal for scaling studios that want online client acquisition.',
    popular: true,
    color: 'orange',
    featuresList: [
      'All Starter features',
      'Website enquiry functionality',
      'Publicly shareable enquiry form',
      'Public service and package enquiry functionality',
      'Client intake automation',
    ],
  },
  EXCLUSIVE_LIFETIME: {
    tier: 'PREMIUM',
    badge: 'Premium',
    tagline: 'Full luxury suite with a custom-hosted branded website.',
    popular: false,
    color: 'purple',
    featuresList: [
      'All Growth features',
      'Branded business website',
      'Custom domain name',
      'Dedicated hosting server',
      'One year of free domain registration',
      'One year of free server hosting',
      'VIP priority concierge support',
    ],
  },
};

export default function SubscriptionPage() {
  const { user, currentBusiness, memberships } = useAuthStore();
  const businessId = currentBusiness?.id || currentBusiness?.business_id;
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Search parameters for Razorpay return callbacks
  const searchParams = useSearchParams();
  const rawOrderId = searchParams.get('order_id') || searchParams.get('sub_id');
  const orderIdParam = rawOrderId && !rawOrderId.includes('{') ? rawOrderId : null;
  const verifiedOrderIdRef = useRef(null);

  // Modal / Dialog States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);
  const [isScheduleConfirmModalOpen, setIsScheduleConfirmModalOpen] = useState(false);
  const [pendingPlanToSchedule, setPendingPlanToSchedule] = useState(null);

  // Active membership role check
  const isOwnerOrManager = useMemo(() => {
    if (!memberships || !businessId) return false;
    const member = memberships.find((m) => (m.businesses?.id || m.id || m.business_id) === businessId);
    return member?.role === 'OWNER' || member?.role === 'MANAGER' || !member; // fallback to true if single-owner
  }, [memberships, businessId]);

  // 1. Fetch Subscription & Entitlements
  const {
    data: subscriptionData,
    isLoading: isSubLoading,
    isError: isSubError,
    error: subError,
    refetch: refetchSubscription,
  } = useQuery({
    queryKey: ['subscription-features', businessId],
    queryFn: () => websiteService.getSubscriptionFeatures(businessId),
    enabled: !!businessId,
  });

  // 2. Fetch Available Plans from Backend
  const {
    data: plansData = [],
    isLoading: isPlansLoading,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ['commercial-plans'],
    queryFn: () => websiteService.getAllPlans(),
  });

  // 3. Fetch Billing & Payment History
  const {
    data: paymentHistory = [],
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchPaymentHistory,
  } = useQuery({
    queryKey: ['payment-history', businessId],
    queryFn: () => websiteService.getPaymentHistory(businessId),
    enabled: !!businessId,
    // Automatically poll every 5s if there is any pending payment awaiting verification
    refetchInterval: (data) => {
      const hasPending = Array.isArray(data) && data.some((item) => item.status === 'PENDING');
      return hasPending ? 4000 : false;
    },
  });

  // Automatically verify any pending order in history so the user doesn't have to click "Verify"
  const pendingOrdersCheckedRef = useRef(new Set());
  useEffect(() => {
    if (businessId && Array.isArray(paymentHistory)) {
      const pendingOrders = paymentHistory.filter(
        (o) => o.status === 'PENDING' && o.orderId && !pendingOrdersCheckedRef.current.has(o.orderId)
      );

      pendingOrders.forEach((o) => {
        pendingOrdersCheckedRef.current.add(o.orderId);
        websiteService
          .verifyPayment(businessId, o.orderId)
          .then((res) => {
            if (res?.isPaid || res?.status === 'SUCCESS') {
              queryClient.invalidateQueries({ queryKey: ['subscription-features', businessId] });
              queryClient.invalidateQueries({ queryKey: ['payment-history', businessId] });
              queryClient.invalidateQueries({ queryKey: ['website-config'] });
              addToast({
                title: 'Payment Confirmed!',
                description: `Your ${res.planName || 'subscription'} is active and features are unlocked!`,
                variant: 'success',
              });
            }
          })
          .catch(() => {});
      });
    }
  }, [paymentHistory, businessId, queryClient, addToast]);

  // Automatically verify payment if returning from Razorpay checkout with order_id
  useEffect(() => {
    if (orderIdParam && businessId && verifiedOrderIdRef.current !== orderIdParam) {
      verifiedOrderIdRef.current = orderIdParam;
      
      let attempts = 0;
      const verifyAttempt = () => {
        attempts += 1;
        websiteService
          .verifyPayment(businessId, orderIdParam)
          .then((res) => {
            queryClient.invalidateQueries({ queryKey: ['subscription-features', businessId] });
            queryClient.invalidateQueries({ queryKey: ['payment-history', businessId] });
            queryClient.invalidateQueries({ queryKey: ['website-config'] });

            if (res?.isPaid || res?.status === 'SUCCESS') {
              addToast({
                title: 'Payment Successful!',
                description: `Your subscription to ${res.planName || 'selected plan'} has been activated and features unlocked.`,
                variant: 'success',
              });
            } else if (res?.status === 'PENDING' && attempts < 3) {
              // Razorpay webhook or banking auth may take a few seconds, retry shortly
              setTimeout(verifyAttempt, 2500);
            } else {
              addToast({
                title: 'Payment Status Update',
                description: res?.message || 'Verification complete.',
                variant: 'info',
              });
            }
          })
          .catch((err) => {
            console.warn('Payment verification issue:', err);
            queryClient.invalidateQueries({ queryKey: ['payment-history', businessId] });
          });
      };

      verifyAttempt();
    }
  }, [orderIdParam, businessId, addToast, queryClient]);

  // Razorpay Checkout Mutation
  const isSubmittingCheckoutRef = useRef(false);
  const checkoutMutation = useMutation({
    mutationFn: async (targetPlanCode) => {
      if (isSubmittingCheckoutRef.current) {
        throw new Error('Checkout request is already processing');
      }
      isSubmittingCheckoutRef.current = true;
      try {
        return await websiteService.createCheckout(businessId, targetPlanCode);
      } finally {
        isSubmittingCheckoutRef.current = false;
      }
    },
    onSuccess: async (data) => {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || typeof window === 'undefined' || !window.Razorpay) {
        addToast({
          title: 'Gateway Error',
          description: 'Failed to load Razorpay SDK. Please check your internet connection and try again.',
          variant: 'danger',
        });
        return;
      }

      if (!data?.keyId) {
        addToast({
          title: 'Configuration Error',
          description: 'Payment gateway configuration missing. Please contact support.',
          variant: 'danger',
        });
        return;
      }

      try {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: 'VARNAM Bridal Software',
          description: `Subscription: ${data.planName || 'Bridal Studio Management'}`,
          order_id: data.orderId || data.rzpOrderId || undefined,
          notes: {
            businessId,
            planCode: data.planCode,
            subscription_id: data.subscriptionId || '',
          },
          prefill: {
            name: user?.name || user?.email?.split('@')[0] || data.customer?.name || '',
            email: user?.email || data.customer?.email || '',
            contact: user?.phone || data.customer?.contact || '',
          },
          theme: {
            color: '#F97316', // VARNAM Orange
          },
          handler: async (response) => {
            try {
              addToast({
                title: 'Processing Payment',
                description: 'Verifying payment with bank. Please wait...',
                variant: 'info',
              });

              const verificationResult = await websiteService.verifyPayment(businessId, {
                orderId: data.orderId || response.razorpay_order_id,
                subscriptionId: data.subscriptionId || response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id || data.orderId,
                razorpay_subscription_id: response.razorpay_subscription_id || data.subscriptionId,
                razorpay_signature: response.razorpay_signature,
              });

              queryClient.invalidateQueries({ queryKey: ['subscription-features', businessId] });
              queryClient.invalidateQueries({ queryKey: ['payment-history', businessId] });
              queryClient.invalidateQueries({ queryKey: ['website-config'] });

              if (verificationResult?.isPaid || verificationResult?.status === 'SUCCESS') {
                addToast({
                  title: 'Payment Successful!',
                  description: `Activated ${verificationResult.planName || data.planName}. Features are unlocked!`,
                  variant: 'success',
                });
              } else {
                addToast({
                  title: 'Payment Pending',
                  description: 'Payment completed. Bank confirmation in progress.',
                  variant: 'info',
                });
              }
            } catch (err) {
              addToast({
                title: 'Verification Notice',
                description: err.response?.data?.message || 'Payment recorded. Verifying with gateway...',
                variant: 'warning',
              });
              queryClient.invalidateQueries({ queryKey: ['payment-history', businessId] });
              queryClient.invalidateQueries({ queryKey: ['subscription-features', businessId] });
            }
          },
          modal: {
            ondismiss: () => {
              addToast({
                title: 'Checkout Incomplete',
                description: 'Payment window was closed before completing checkout.',
                variant: 'warning',
              });
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response) => {
          addToast({
            title: 'Payment Failed',
            description: response.error?.description || 'Your transaction was declined by the bank.',
            variant: 'danger',
          });
        });
        rzp.open();
      } catch (err) {
        addToast({
          title: 'Gateway Error',
          description: err.message || 'Could not launch Razorpay checkout',
          variant: 'danger',
        });
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to initiate checkout';
      addToast({ title: 'Checkout Failed', description: msg, variant: 'danger' });
    },
  });

  // Cancel Subscription Mutation
  const cancelMutation = useMutation({
    mutationFn: (reason) => websiteService.cancelSubscription(businessId, reason),
    onSuccess: (res) => {
      setIsCancelModalOpen(false);
      setCancellationReason('');
      queryClient.invalidateQueries({ queryKey: ['subscription-features', businessId] });
      addToast({
        title: 'Subscription Cancelled',
        description: res?.message || 'Your subscription will not renew.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel subscription';
      addToast({ title: 'Cancellation Error', description: msg, variant: 'danger' });
    },
  });

  // Reactivate Subscription Mutation
  const reactivateMutation = useMutation({
    mutationFn: () => websiteService.reactivateSubscription(businessId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-features', businessId] });
      addToast({
        title: 'Subscription Reactivated',
        description: res?.message || 'Your subscription has been renewed successfully.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to reactivate subscription';
      addToast({ title: 'Reactivation Error', description: msg, variant: 'danger' });
    },
  });

  // Toggle Auto-Renewal Mutation
  const autoRenewMutation = useMutation({
    mutationFn: (newVal) => websiteService.updateAutoRenewal(businessId, newVal),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-features', businessId] });
      addToast({
        title: 'Auto-Renewal Updated',
        description: res?.message || 'Preference updated.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update auto-renewal';
      addToast({ title: 'Update Failed', description: msg, variant: 'danger' });
    },
  });

  // Schedule Plan Change Mutation (e.g. Starter -> Growth or Growth -> Starter at billing cycle end)
  const scheduleChangeMutation = useMutation({
    mutationFn: (targetPlanCode) => websiteService.schedulePlanChange(businessId, targetPlanCode),
    onSuccess: (res) => {
      setIsScheduleConfirmModalOpen(false);
      setPendingPlanToSchedule(null);
      queryClient.invalidateQueries({ queryKey: ['subscription-features', businessId] });
      addToast({
        title: 'Plan Change Scheduled',
        description: res?.message || 'Your plan change has been scheduled successfully.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to schedule plan change';
      addToast({ title: 'Schedule Failed', description: msg, variant: 'danger' });
    },
  });

  // Cancel Scheduled Plan Change Mutation
  const cancelScheduledChangeMutation = useMutation({
    mutationFn: () => websiteService.cancelScheduledChange(businessId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-features', businessId] });
      addToast({
        title: 'Scheduled Change Removed',
        description: res?.message || 'Your scheduled plan change has been cancelled.',
        variant: 'success',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to remove scheduled change';
      addToast({ title: 'Action Failed', description: msg, variant: 'danger' });
    },
  });

  // Derived current subscription status properties
  const status = (subscriptionData?.subscriptionStatus || subscriptionData?.status || 'NO_SUBSCRIPTION').toUpperCase();
  const planCode = subscriptionData?.planCode;
  const planName = subscriptionData?.planName || 'No Active Plan';
  const priceRupees = subscriptionData?.priceRupees ?? 0;
  const billingType = subscriptionData?.billingType; // 'RECURRING' or 'ONE_TIME'
  const isOneTime = billingType === 'ONE_TIME' || subscriptionData?.isExclusive;
  const autoRenew = Boolean(subscriptionData?.autoRenew);
  const startsAt = subscriptionData?.startsAt ? new Date(subscriptionData.startsAt) : null;
  const endsAt = subscriptionData?.endsAt ? new Date(subscriptionData.endsAt) : null;
  const purchaseReference = subscriptionData?.purchaseReference;

  // Status Badge Component
  const renderStatusBadge = (st) => {
    switch (st) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case 'TRIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            Trial
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Cancelled
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200">
            <AlertCircle className="w-3 h-3 text-stone-500" />
            Expired
          </span>
        );
      case 'PAST_DUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Past Due
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200">
            No Subscription
          </span>
        );
    }
  };

  if (!businessId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Building2}
          title="No Studio Selected"
          description="Please select or configure an active studio to manage subscriptions."
        />
      </div>
    );
  }

  if (isSubLoading && !subscriptionData) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <LoadingSpinner text="Loading subscription details..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fadeIn">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#F0E7DE]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-orange-100/70 text-[#C2410C]">
              <CreditCard className="w-6 h-6" />
            </span>
            Subscription &amp; Billing
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage your plan, billing preferences, and subscription status for{' '}
            <strong className="text-stone-700">{currentBusiness?.name || 'your studio'}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchSubscription();
              refetchPaymentHistory();
            }}
            className="rounded-xl border-stone-200 hover:bg-stone-50 text-stone-700"
            title="Refresh subscription data"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Sync
          </Button>

          <Button
            size="sm"
            onClick={() => setIsChangePlanOpen((prev) => !prev)}
            className="bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-xl shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-200" />
            {isChangePlanOpen ? 'Hide Plans' : 'Change Plan'}
          </Button>
        </div>
      </div>

      {/* ========================================================
          SUBSCRIPTION NOTICES (Orange Theme)
          - Case A / C: Plan Switch Notice (e.g. Starter -> Growth scheduled)
          - Case B: Subscription Cancellation Notice with Reactivate Starter button
         ======================================================== */}

      {/* Case A & C: Scheduled Plan Change Banner */}
      {subscriptionData?.scheduledChange && (
        <div className="rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] p-5 shadow-xs transition-all animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 text-[#EA580C]">
                <Calendar className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#9A3412] leading-tight">
                  Your plan change is scheduled
                </h3>
                <p className="text-xs sm:text-sm text-[#7C2D12] leading-relaxed max-w-3xl">
                  Your <strong className="font-semibold text-stone-900">{subscriptionData.scheduledChange.currentPlanName || planName}</strong>{' '}
                  ({subscriptionData.scheduledChange.currentPlanCode === 'BASIC_MONTHLY' ? '₹599/month' : '₹999/month'}) will remain active until{' '}
                  <strong className="font-semibold text-stone-900">
                    {new Date(subscriptionData.scheduledChange.effectiveDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </strong>
                  . Your <strong className="font-semibold text-stone-900">{subscriptionData.scheduledChange.targetPlanName}</strong>{' '}
                  (₹{subscriptionData.scheduledChange.targetPriceRupees}/month) will take effect according to your subscription schedule. You can activate the{' '}
                  {subscriptionData.scheduledChange.currentPlanName || 'Starter'} plan again after your current subscription ends.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#EA580C] border border-[#FED7AA]">
                    <Clock className="w-3 h-3 text-[#EA580C]" />
                    Effective Date:{' '}
                    {new Date(subscriptionData.scheduledChange.effectiveDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white text-stone-600 border border-stone-200">
                    Next Plan: {subscriptionData.scheduledChange.targetPlanName} (₹{subscriptionData.scheduledChange.targetPriceRupees}/mo)
                  </span>
                </div>
              </div>
            </div>

            {isOwnerOrManager && (
              <div className="shrink-0 sm:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={cancelScheduledChangeMutation.isPending}
                  onClick={() => cancelScheduledChangeMutation.mutate()}
                  className="w-full sm:w-auto bg-white hover:bg-orange-50 border-[#FED7AA] text-[#C2410C] font-bold text-xs rounded-xl"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Cancel Scheduled Change
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Case B: Subscription Cancellation Notice Banner */}
      {status === 'CANCELLED' && (
        <div className="rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] p-5 shadow-xs transition-all animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 text-[#EA580C]">
                <AlertCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#9A3412] leading-tight">
                  Your {planName.includes('Starter') ? 'Starter' : planName} plan is scheduled to end
                </h3>
                <p className="text-xs sm:text-sm text-[#7C2D12] leading-relaxed max-w-3xl">
                  Your {planName.includes('Starter') ? 'Starter' : planName} subscription remains active until{' '}
                  <strong className="font-semibold text-stone-900">
                    {endsAt
                      ? endsAt.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'the end of your billing cycle'}
                  </strong>
                  . You can reactivate your subscription before it expires to continue using your plan without interruption.
                </p>
                <div className="pt-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#EA580C] border border-[#FED7AA]">
                    <Clock className="w-3 h-3 text-[#EA580C]" />
                    Full access retained until{' '}
                    {endsAt
                      ? endsAt.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'period end'}
                  </span>
                </div>
              </div>
            </div>

            {isOwnerOrManager && (
              <div className="shrink-0 sm:self-center">
                <Button
                  size="sm"
                  isLoading={reactivateMutation.isPending}
                  onClick={() => reactivateMutation.mutate()}
                  className="w-full sm:w-auto bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Reactivate {planName.includes('Starter') ? 'Starter' : planName}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Subscription Overview Card */}
      <div className="bg-white rounded-3xl border border-[#F0E7DE] shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-orange-50/50 via-stone-50/30 to-amber-50/30 border-b border-[#F0E7DE]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold tracking-wider uppercase text-stone-500">Current Plan</span>
                {renderStatusBadge(status)}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight flex items-center gap-3">
                {planName}
                {isOneTime && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-100 text-[#C2410C] border border-orange-200">
                    Lifetime VIP
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-xl">
                {planCode === 'EXCLUSIVE_LIFETIME'
                  ? 'Includes customized portfolio showcase website, free domain registration, and high-performance cloud hosting.'
                  : planCode === 'GROWTH_MONTHLY'
                  ? 'Includes customer intake automation, website inquiries, and shareable public booking forms.'
                  : planCode === 'BASIC_MONTHLY'
                  ? 'Core bridal makeup studio management, bookings, consultations, expenses, and analytics.'
                  : 'Get started with a plan below to unlock full studio features and branded client portals.'}
              </p>
            </div>

            <div className="flex flex-col sm:items-end justify-center bg-white/80 backdrop-blur-xs p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-400">Price</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-stone-900">
                  ₹{priceRupees.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-semibold text-stone-500">
                  {isOneTime ? 'one-time' : '/month'}
                </span>
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                {isOneTime ? 'Lifetime platform license' : 'Billed monthly via Secure Pay'}
              </div>
            </div>
          </div>
        </div>

        {/* Overview Key Details Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-white">
          {/* Start Date */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-stone-400 block">Subscription Started</span>
            <div className="text-sm font-semibold text-stone-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
              {startsAt ? startsAt.toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Not activated'}
            </div>
          </div>

          {/* Renewal / Expiry Date */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-stone-400 block">
              {isOneTime ? 'Hosting Validity' : status === 'CANCELLED' ? 'Access Valid Until' : 'Next Billing Date'}
            </span>
            <div className="text-sm font-semibold text-stone-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-stone-400 shrink-0" />
              {endsAt ? endsAt.toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Never expires'}
            </div>
          </div>

          {/* Auto-Renewal Status */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-stone-400 block">Auto-Renewal</span>
            <div className="text-sm font-semibold text-stone-800 flex items-center gap-2">
              {isOneTime ? (
                <span className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                  One-time purchase
                </span>
              ) : autoRenew && status === 'ACTIVE' ? (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                </span>
              ) : (
                <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                  Disabled
                </span>
              )}
            </div>
          </div>

          {/* Razorpay Reference ID */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-stone-400 block">Payment Reference</span>
            <div className="text-xs font-mono font-medium text-stone-700 truncate" title={purchaseReference || 'N/A'}>
              {purchaseReference ? (
                <span className="bg-stone-50 px-2 py-1 rounded border border-stone-200">
                  {purchaseReference.slice(0, 18)}...
                </span>
              ) : (
                'Standard Portal'
              )}
            </div>
          </div>
        </div>

        {/* Actions Bar inside Overview Card */}
        <div className="px-6 sm:px-8 py-4 bg-stone-50/80 border-t border-[#F0E7DE] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Bank-grade 256-bit secure payments processed via Secure Pay</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-Renewal Toggle for Recurring Active Plans */}
            {!isOneTime && status === 'ACTIVE' && isOwnerOrManager && (
              <Button
                variant="outline"
                size="sm"
                isLoading={autoRenewMutation.isPending}
                onClick={() => autoRenewMutation.mutate(!autoRenew)}
                className="text-xs font-semibold rounded-xl border-stone-200 text-stone-700 hover:bg-white"
              >
                {autoRenew ? 'Disable Auto-Renewal' : 'Enable Auto-Renewal'}
              </Button>
            )}

            {/* Reactivate Button (if cancelled and not expired) */}
            {status === 'CANCELLED' && isOwnerOrManager && (
              <Button
                size="sm"
                isLoading={reactivateMutation.isPending}
                onClick={() => reactivateMutation.mutate()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reactivate Subscription
              </Button>
            )}

            {/* Cancel Button (if active and not one-time) */}
            {status === 'ACTIVE' && !isOneTime && isOwnerOrManager && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 text-xs font-semibold rounded-xl"
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Subscription Plans Comparison Section */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              Available Studio Plans
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Choose the right tier for your bridal studio. Upgrades activate instantly upon payment.
            </p>
          </div>
        </div>

        {isPlansLoading && plansData.length === 0 ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner text="Loading plans..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {plansData.map((plan) => {
              const planMeta = PLAN_SPECS[plan.code] || {
                tier: 'CUSTOM',
                badge: plan.name,
                tagline: plan.description || 'Special plan',
                popular: false,
                color: 'stone',
                featuresList: [],
              };

              const isCurrent = planCode === plan.code && (status === 'ACTIVE' || status === 'TRIAL');
              const isPopular = planMeta.popular;
              const isExclusivePlan = plan.code === 'EXCLUSIVE_LIFETIME';

              return (
                <div
                  key={plan.id || plan.code}
                  className={`relative flex flex-col justify-between rounded-3xl transition-all duration-200 bg-white border ${
                    isCurrent
                      ? 'border-emerald-400 ring-2 ring-emerald-400/20 shadow-md'
                      : isPopular
                      ? 'border-orange-300 ring-1 ring-orange-200/50 shadow-sm hover:shadow-md'
                      : 'border-[#F0E7DE] hover:border-stone-300 shadow-2xs hover:shadow-xs'
                  } p-6 sm:p-7 overflow-hidden`}
                >
                  {/* Popular or Current Badge */}
                  {isCurrent && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Check className="w-3 h-3" /> Current Plan
                      </span>
                    </div>
                  )}

                  {!isCurrent && isPopular && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-100 text-[#C2410C] border border-orange-300">
                        <Sparkles className="w-3 h-3 text-orange-600" /> Recommended
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-stone-900">{plan.name}</h3>
                      <p className="text-xs text-stone-500 min-h-[36px]">{planMeta.tagline}</p>
                    </div>

                    {/* Pricing */}
                    <div className="mt-5 pb-5 border-b border-stone-100">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-3xl sm:text-4xl font-extrabold text-stone-900">
                          ₹{plan.basePriceRupees ? plan.basePriceRupees.toLocaleString('en-IN') : plan.priceRupees.toLocaleString('en-IN')}
                        </span>
                        {!isExclusivePlan && (
                          <span className="text-base font-bold text-orange-600 bg-orange-50 border border-orange-200/60 px-1.5 py-0.5 rounded-md">
                            + 2%
                          </span>
                        )}
                        <span className="text-xs font-semibold text-stone-500">
                          {isExclusivePlan ? 'one-time' : '/month'}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 mt-1 block">
                        {isExclusivePlan ? 'Includes 1 yr domain & hosting' : 'Auto-renews monthly'}
                      </span>
                    </div>

                    {/* Features list */}
                    <div className="py-5 space-y-3">
                      <div className="text-xs font-bold text-stone-800 uppercase tracking-wider">Included Features</div>
                      <ul className="space-y-2.5">
                        {planMeta.featuresList.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-stone-700">
                            <span className="w-4 h-4 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                            <span className="leading-relaxed">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="pt-4 border-t border-stone-100">
                    {isCurrent ? (
                      <Button
                        disabled
                        variant="secondary"
                        className="w-full text-xs font-bold py-2.5 rounded-xl cursor-not-allowed bg-stone-100 text-stone-500"
                      >
                        Active Plan
                      </Button>
                    ) : isExclusivePlan ? (
                      <Button
                        size="md"
                        onClick={() => setIsContactSalesOpen(true)}
                        className="w-full text-xs font-bold py-2.5 rounded-xl shadow-xs bg-[#EA580C] hover:bg-[#C2410C] active:bg-[#9A3412] text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        Contact Sales
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        {/* If this target plan is already scheduled */}
                        {subscriptionData?.scheduledChange?.targetPlanCode === plan.code ? (
                          <div className="space-y-1.5">
                            <Button
                              disabled
                              variant="secondary"
                              className="w-full text-xs font-bold py-2 rounded-xl bg-orange-50 text-[#C2410C] border border-[#FED7AA] cursor-not-allowed"
                            >
                              <Clock className="w-3.5 h-3.5 mr-1 text-[#EA580C]" />
                              Change Scheduled
                            </Button>
                            <p className="text-[10px] text-center text-stone-500">
                              Takes effect on{' '}
                              {new Date(subscriptionData.scheduledChange.effectiveDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          </div>
                        ) : status === 'ACTIVE' && ['BASIC_MONTHLY', 'GROWTH_MONTHLY'].includes(planCode) ? (
                          <div className="flex flex-col gap-1.5">
                            <Button
                              size="md"
                              disabled={!isOwnerOrManager}
                              onClick={() => {
                                setPendingPlanToSchedule(plan);
                                setIsScheduleConfirmModalOpen(true);
                              }}
                              className="w-full text-xs font-bold py-2.5 rounded-xl shadow-xs bg-[#EA580C] hover:bg-[#C2410C] active:bg-[#9A3412] text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Calendar className="w-3.5 h-3.5 text-amber-200" />
                              Schedule Switch to {plan.name}
                            </Button>
                            <button
                              type="button"
                              disabled={checkoutMutation.isPending || !isOwnerOrManager}
                              onClick={() => {
                                setSelectedPlanForCheckout(plan.code);
                                checkoutMutation.mutate(plan.code);
                              }}
                              className="text-[10px] text-stone-500 hover:text-stone-800 underline text-center cursor-pointer py-0.5"
                            >
                              Or switch immediately with Secure Pay
                            </button>
                          </div>
                        ) : (
                          <Button
                            size="md"
                            isLoading={checkoutMutation.isPending && selectedPlanForCheckout === plan.code}
                            disabled={checkoutMutation.isPending || !isOwnerOrManager}
                            onClick={() => {
                              setSelectedPlanForCheckout(plan.code);
                              checkoutMutation.mutate(plan.code);
                            }}
                            className="w-full text-xs font-bold py-2.5 rounded-xl shadow-xs bg-[#EA580C] hover:bg-[#C2410C] active:bg-[#9A3412] text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>Subscribe to {plan.name}</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Billing and Payment History Section */}
      <div className="bg-white rounded-3xl border border-[#F0E7DE] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-6 border-b border-[#F0E7DE] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#C2410C]">
                <IndianRupee className="w-4 h-4" />
              </span>
              Billing &amp; Payment History
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Confirmed payments and subscription orders recorded for this studio.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchPaymentHistory()}
            className="rounded-xl border-stone-200 text-xs font-semibold text-stone-700"
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Refresh
          </Button>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          {isHistoryLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner text="Loading payment records..." />
            </div>
          ) : isHistoryError ? (
            <div className="p-8 text-center">
              <p className="text-xs text-rose-600 font-semibold mb-2">Failed to load billing history.</p>
              <Button size="sm" variant="outline" onClick={() => refetchPaymentHistory()}>
                Retry
              </Button>
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F97316] mx-auto mb-3 shadow-xs">
                <IndianRupee className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-stone-700">No payment records yet</h4>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                Invoices and transaction receipts will appear here automatically once payments are completed.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-100">
                  <th className="py-3 px-5">Receipt / Order ID</th>
                  <th className="py-3 px-5">Plan</th>
                  <th className="py-3 px-5">Amount</th>
                  <th className="py-3 px-5">Payment Date</th>
                  <th className="py-3 px-5">Method</th>
                  <th className="py-3 px-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                {paymentHistory.map((item) => {
                  const isSuccess = item.status === 'SUCCESS' || item.status === 'PAID';
                  const isFailed = item.status === 'FAILED';
                  const isPending = item.status === 'PENDING';

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-5 font-mono text-stone-800 font-medium">
                        {item.orderId || item.id.slice(0, 12)}
                      </td>
                      <td className="py-3 px-5">
                        <span className="font-semibold text-stone-900">{item.planName}</span>
                        {item.orderType === 'RECURRING' && (
                          <span className="text-[10px] text-stone-400 block">Monthly Recurring</span>
                        )}
                      </td>
                      <td className="py-3 px-5 font-semibold text-stone-900">
                        ₹{item.amountRupees?.toLocaleString('en-IN') || 0}
                      </td>
                      <td className="py-3 px-5 text-stone-500">
                        {item.paidAt
                          ? new Date(item.paidAt).toLocaleDateString('en-IN', {
                              dateStyle: 'medium',
                            })
                          : new Date(item.createdAt).toLocaleDateString('en-IN', {
                              dateStyle: 'medium',
                            })}
                      </td>
                      <td className="py-3 px-5 text-stone-600">{item.paymentMethod || item.paymentProvider || 'Secure Pay'}</td>
                      <td className="py-3 px-5">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Success
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Failed
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {item.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                websiteService
                                  .verifyPayment(businessId, item.orderId)
                                  .then((res) => {
                                    queryClient.invalidateQueries({ queryKey: ['subscription-features', businessId] });
                                    queryClient.invalidateQueries({ queryKey: ['payment-history', businessId] });
                                    if (res?.isPaid) {
                                      addToast({
                                        title: 'Payment Confirmed!',
                                        description: `Activated ${res.planName}.`,
                                        variant: 'success',
                                      });
                                    } else {
                                      addToast({
                                        title: 'Status: Pending',
                                        description: res?.message || 'Payment has not been confirmed yet.',
                                        variant: 'warning',
                                      });
                                    }
                                  })
                                  .catch((err) => {
                                    addToast({
                                      title: 'Verification Failed',
                                      description: err.message || 'Could not verify payment.',
                                      variant: 'error',
                                    });
                                  });
                              }}
                              className="text-[11px] font-semibold text-[#F97316] hover:underline cursor-pointer"
                            >
                              Verify
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 5. Cancellation Confirmation Dialog */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-stone-900">Cancel Your Subscription?</h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Are you sure you want to cancel your <strong className="text-stone-800">{planName}</strong> plan?
              Your active features will remain available until the end of your billing cycle on{' '}
              <strong className="text-stone-800">
                {endsAt ? endsAt.toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'the current period'}
              </strong>
              , after which your account will revert to the free tier.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Reason for cancellation (optional):
              </label>
              <textarea
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Let us know how we can improve..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-stone-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(false)}
                className="rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50"
              >
                Keep Subscription
              </Button>
              <Button
                size="sm"
                isLoading={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(cancellationReason)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Plan Change Confirmation Dialog */}
      {isScheduleConfirmModalOpen && pendingPlanToSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#FED7AA] animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-[#FED7AA] flex items-center justify-center text-[#EA580C] mb-4">
              <Calendar className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-lg font-bold text-stone-900">
              Schedule Switch to {pendingPlanToSchedule.name}?
            </h3>

            <div className="mt-3 p-3.5 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] text-xs text-[#7C2D12] space-y-2 leading-relaxed">
              <p>
                Your current <strong className="font-semibold text-stone-900">{planName}</strong> plan will remain active until{' '}
                <strong className="font-semibold text-stone-900">
                  {endsAt ? endsAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'the end of your current period'}
                </strong>
                .
              </p>
              <p>
                Your new <strong className="font-semibold text-stone-900">{pendingPlanToSchedule.name}</strong> (₹{pendingPlanToSchedule.priceRupees}/month) plan will take effect automatically upon period completion without interrupting your studio workflows.
              </p>
              <p className="text-[11px] text-stone-600">
                You will not be billed twice. You can activate or revert back to the {planName} plan at any time.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-stone-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsScheduleConfirmModalOpen(false);
                  setPendingPlanToSchedule(null);
                }}
                className="rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50"
              >
                Keep Current Schedule
              </Button>
              <Button
                size="sm"
                isLoading={scheduleChangeMutation.isPending}
                onClick={() => scheduleChangeMutation.mutate(pendingPlanToSchedule.code)}
                className="bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold rounded-xl shadow-xs"
              >
                Confirm Plan Switch
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Contact Sales Modal */}
      <ContactSalesModal
        isOpen={isContactSalesOpen}
        onClose={() => setIsContactSalesOpen(false)}
      />
    </div>
  );
}
