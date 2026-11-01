'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { websiteService } from '@/services/website';
import {
  PLAN_TIERS,
  PLAN_RANKS,
  ROUTE_FEATURE_MAP,
  hasTierAccess,
  getRequiredPlanName,
} from '@/lib/feature-access';

/**
 * Custom hook for subscription feature authorization
 */
export function useFeatureAccess() {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || currentBusiness?.business_id;

  const {
    data: featureData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['subscription-features', businessId],
    queryFn: () => websiteService.getSubscriptionFeatures(businessId),
    enabled: !!businessId,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    refetchOnWindowFocus: true,
  });

  const parsed = useMemo(() => {
    // If no business or features not loaded yet
    if (!featureData) {
      return {
        hasActiveSubscription: false,
        planTier: PLAN_TIERS.NONE,
        planCode: null,
        planName: 'No Active Plan',
        status: 'NO_SUBSCRIPTION',
        endsAt: null,
        features: {},
      };
    }

    const status = featureData.status || featureData.subscriptionStatus || 'NO_SUBSCRIPTION';
    const now = new Date();
    const hasTimeRemaining = featureData.endsAt ? new Date(featureData.endsAt) > now : false;
    const isCancelledGracePeriod = (status === 'CANCELLED' && hasTimeRemaining) || Boolean(featureData.isCancelledGracePeriod);
    const isActive = ['ACTIVE', 'TRIAL'].includes(status) || isCancelledGracePeriod;

    // Tier calculation from backend planCode or planTier
    let planTier = PLAN_TIERS.NONE;
    if (isActive) {
      if (featureData.planTier === 'PREMIUM' || featureData.planCode === 'EXCLUSIVE_LIFETIME') {
        planTier = PLAN_TIERS.PREMIUM;
      } else if (featureData.planTier === 'GROWTH' || featureData.planCode === 'GROWTH_MONTHLY') {
        planTier = PLAN_TIERS.GROWTH;
      } else if (featureData.planTier === 'STARTER' || featureData.planCode === 'BASIC_MONTHLY') {
        planTier = PLAN_TIERS.STARTER;
      }
    }

    return {
      hasActiveSubscription: isActive,
      isCancelledGracePeriod,
      planTier,
      planCode: featureData.planCode || null,
      planName: featureData.planName || (isActive ? 'Active Subscription' : 'No Active Plan'),
      status,
      endsAt: featureData.endsAt ? new Date(featureData.endsAt) : null,
      features: featureData.features || {},
    };
  }, [featureData]);

  /**
   * Check if a specific feature key is permitted
   */
  const hasFeature = (featureKey) => {
    if (!parsed.hasActiveSubscription) return false;
    // Check specific feature toggle returned by backend
    if (parsed.features && parsed.features[featureKey] !== undefined) {
      return Boolean(parsed.features[featureKey]);
    }
    // Fallback based on tier
    return parsed.planTier !== PLAN_TIERS.NONE;
  };

  /**
   * Check if user can access a specific route
   */
  const canAccessRoute = (routePath) => {
    // Whitelisted routes: settings, subscription, and onboarding are open
    if (
      routePath === '/subscription' ||
      routePath.startsWith('/subscription') ||
      routePath === '/settings' ||
      routePath === '/profile'
    ) {
      return true;
    }

    const routeConfig = ROUTE_FEATURE_MAP[routePath];
    if (!routeConfig) {
      // If not specifically mapped, allow if has any active subscription
      return parsed.hasActiveSubscription;
    }

    // Must have active plan
    if (!parsed.hasActiveSubscription) {
      return false;
    }

    // Must meet tier requirement
    if (!hasTierAccess(parsed.planTier, routeConfig.requiredTier)) {
      return false;
    }

    // Must have backend feature flag if defined
    if (routeConfig.featureKey && parsed.features[routeConfig.featureKey] !== undefined) {
      return Boolean(parsed.features[routeConfig.featureKey]);
    }

    return true;
  };

  /**
   * Get route lock status & details
   */
  const getRouteLockInfo = (routePath) => {
    const routeConfig = ROUTE_FEATURE_MAP[routePath];
    const isLocked = !canAccessRoute(routePath);
    const requiredTier = routeConfig?.requiredTier || PLAN_TIERS.STARTER;

    return {
      isLocked,
      title: routeConfig?.title || 'Feature Locked',
      description: routeConfig?.description || 'Upgrade your subscription to unlock this feature.',
      requiredTier,
      requiredPlanName: getRequiredPlanName(requiredTier),
      requiresGrowth: requiredTier === PLAN_TIERS.GROWTH,
      requiresPremium: requiredTier === PLAN_TIERS.PREMIUM,
      requiresStarter: requiredTier === PLAN_TIERS.STARTER,
    };
  };

  return {
    isLoading,
    isError,
    refetch,
    ...parsed,
    hasFeature,
    canAccessRoute,
    getRouteLockInfo,
  };
}
