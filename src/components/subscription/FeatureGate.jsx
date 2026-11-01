'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, Sparkles, ArrowRight, ShieldAlert, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui';
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { PLAN_TIERS, ROUTE_FEATURE_MAP, getRequiredPlanName, hasTierAccess } from '@/lib/feature-access';
import { ContactSalesModal } from './ContactSalesModal';

/**
 * Route / Component Gate that protects content from unauthorized subscription tiers.
 * If user does not meet required plan, displays a locked feature banner and upgrade CTA.
 */
export function FeatureGate({
  children,
  routePath,
  requiredTier = PLAN_TIERS.STARTER,
  featureKey,
  featureTitle,
  featureDescription,
}) {
  const { hasActiveSubscription, planTier, features, isLoading } = useFeatureAccess();
  const [showContactSales, setShowContactSales] = useState(false);

  // If specific routePath is provided, deduce metadata
  const mapped = routePath ? ROUTE_FEATURE_MAP[routePath] : null;
  const effectiveTier = mapped?.requiredTier || requiredTier;
  const effectiveTitle = featureTitle || mapped?.title || 'Feature';
  const effectiveDescription =
    featureDescription ||
    mapped?.description ||
    'Upgrade your subscription plan to unlock this feature for your studio.';
  const effectiveFeatureKey = featureKey || mapped?.featureKey;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-stone-500">Checking subscription entitlement...</span>
        </div>
      </div>
    );
  }

  // Check entitlement
  let hasAccess = false;
  if (hasActiveSubscription) {
    const tierSufficient = hasTierAccess(planTier, effectiveTier);
    const featureAllowed = effectiveFeatureKey && features[effectiveFeatureKey] !== undefined
      ? Boolean(features[effectiveFeatureKey])
      : true;

    hasAccess = tierSufficient && featureAllowed;
  }

  // If entitled, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  const isPremiumRequired = effectiveTier === PLAN_TIERS.PREMIUM;
  const planName = getRequiredPlanName(effectiveTier);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-[#F0E7DE] shadow-sm p-6 sm:p-10 text-center space-y-6">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-3xl bg-orange-50 border border-orange-200/80 text-[#EA580C] flex items-center justify-center mx-auto shadow-2xs">
          <Lock className="w-8 h-8" />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
            Requires {planName}
          </div>

          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">
            {effectiveTitle} is Locked
          </h2>

          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
            {effectiveDescription}
          </p>
        </div>

        {/* Feature Benefits Box */}
        <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#F0E7DE] text-left space-y-2">
          <div className="text-xs font-bold text-stone-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#EA580C]" />
            Plan Entitlement Requirements:
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            {!hasActiveSubscription
              ? 'Your account currently does not have an active subscription plan. Subscribe to any plan to begin accessing studio management tools.'
              : `Your current ${planTier} plan does not include ${effectiveTitle}. Upgrade to ${planName} to gain instant access.`}
          </p>
        </div>

        {/* Upgrade / Contact Sales Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isPremiumRequired ? (
            <Button
              variant="primary"
              onClick={() => setShowContactSales(true)}
              className="w-full sm:w-auto text-xs font-bold py-3 px-6 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <PhoneCall className="w-4 h-4" />
              Contact Sales for Premium (₹29,999)
            </Button>
          ) : (
            <Link href="/subscription" className="w-full sm:w-auto">
              <Button
                variant="primary"
                className="w-full text-xs font-bold py-3 px-6 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>View Subscription Plans</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}

          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              className="w-full text-xs font-semibold py-3 px-5 rounded-xl cursor-pointer"
            >
              Back to Overview
            </Button>
          </Link>
        </div>

        <ContactSalesModal
          isOpen={showContactSales}
          onClose={() => setShowContactSales(false)}
        />
      </div>
    </div>
  );
}
