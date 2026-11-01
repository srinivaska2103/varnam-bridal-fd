/**
 * Centralized Feature Access Configuration
 * Maps routes and feature identifiers to required subscription tiers and details.
 */

export const PLAN_TIERS = {
  NONE: 'NONE',
  STARTER: 'STARTER',
  GROWTH: 'GROWTH',
  PREMIUM: 'PREMIUM',
};

export const PLAN_RANKS = {
  NONE: 0,
  STARTER: 1,
  GROWTH: 2,
  PREMIUM: 3,
};

export const FEATURES = {
  // Starter Tiers (Core Studio Operations)
  DASHBOARD: 'DASHBOARD_ANALYTICS',
  CUSTOMERS: 'CUSTOMER_MANAGEMENT',
  ENQUIRIES: 'ENQUIRY_MANAGEMENT',
  BOOKINGS: 'BOOKING_MANAGEMENT',
  CONSULTATIONS: 'CONSULTATIONS',
  SERVICES: 'SERVICES_AND_PACKAGES',
  PACKAGES: 'SERVICES_AND_PACKAGES',
  QUOTATIONS: 'QUOTATIONS',
  PAYMENTS: 'PAYMENT_TRACKING',
  EXPENSES: 'EXPENSES',
  INVENTORY: 'INVENTORY_MANAGEMENT',
  REPORTS: 'DASHBOARD_ANALYTICS',
  NOTIFICATIONS: 'NOTIFICATIONS',
  CUSTOM_ENQUIRY_FORM: 'CUSTOM_ENQUIRY_FORM',

  // Growth Tiers (Online Presence & Public Enquiries)
  WEBSITE: 'BRANDED_WEBSITE',
  PUBLIC_ENQUIRIES: 'WEBSITE_ENQUIRY_FORM',
  PORTFOLIO: 'PORTFOLIO_SHOWCASE',
  PUBLIC_SERVICES: 'PUBLIC_SERVICE_CATALOGUE',

  // Premium Tiers (Custom Domain & Dedicated Cloud)
  CUSTOM_DOMAIN: 'CUSTOM_DOMAIN_SUPPORT',
  DEDICATED_HOSTING: 'DEDICATED_HOSTING',
};

/**
 * Route-to-Feature Mapping
 */
export const ROUTE_FEATURE_MAP = {
  '/dashboard': {
    featureKey: FEATURES.DASHBOARD,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Studio Dashboard',
    description: 'Real-time studio revenue, booking trends, enquiry pipeline, and performance analytics.',
  },
  '/customers': {
    featureKey: FEATURES.CUSTOMERS,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Customer Directory',
    description: 'Manage client profiles, contact information, booking history, and preferences.',
  },
  '/enquiries': {
    featureKey: FEATURES.ENQUIRIES,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Enquiry Management',
    description: 'Track client leads, stages, follow-ups, and booking conversion pipeline.',
  },
  '/bookings': {
    featureKey: FEATURES.BOOKINGS,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Bookings & Calendar',
    description: 'Schedule bridal trials, ceremonies, artists assignments, and event timelines.',
  },
  '/consultations': {
    featureKey: FEATURES.CONSULTATIONS,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Client Consultations',
    description: 'Schedule and manage in-person or video bridal makeup consultations.',
  },
  '/services': {
    featureKey: FEATURES.SERVICES,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Service Catalog',
    description: 'Configure bridal services, pricing, durations, and category definitions.',
  },
  '/packages': {
    featureKey: FEATURES.PACKAGES,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Bridal Packages',
    description: 'Bundle multiple services into custom packages and bridal combos.',
  },
  '/quotations': {
    featureKey: FEATURES.QUOTATIONS,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Quotations & Estimates',
    description: 'Generate professional digital estimates, terms, and cost breakdowns for clients.',
  },
  '/payments': {
    featureKey: FEATURES.PAYMENTS,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Payment Records',
    description: 'Track advances, milestones, dues, and payment transaction receipts.',
  },
  '/expenses': {
    featureKey: FEATURES.EXPENSES,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Studio Expenses',
    description: 'Record operating expenses, cosmetics procurement, vendor payouts, and overheads.',
  },
  '/inventory': {
    featureKey: FEATURES.INVENTORY,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Inventory & Cosmetics',
    description: 'Track cosmetics stock levels, shades, batch expiry, and studio kit movements.',
  },
  '/reports': {
    featureKey: FEATURES.REPORTS,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Reports & Analytics',
    description: 'Financial reports, monthly revenue breakdowns, service performance, and staff insights.',
  },
  '/notifications': {
    featureKey: FEATURES.NOTIFICATIONS,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Client Notifications',
    description: 'Automated SMS, email, and WhatsApp appointment confirmations and reminders.',
  },
  '/settings/enquiry-form': {
    featureKey: FEATURES.CUSTOM_ENQUIRY_FORM,
    requiredTier: PLAN_TIERS.STARTER,
    title: 'Custom Enquiry Form',
    description: 'Shareable branded enquiry links and custom lead intake form builder.',
  },
  '/website': {
    featureKey: FEATURES.WEBSITE,
    requiredTier: PLAN_TIERS.GROWTH,
    title: 'Branded Website & Enquiries',
    description: 'Custom public website showcase, online bridal enquiry forms, and portfolio gallery.',
  },
};

/**
 * Check if user plan meets or exceeds required tier
 */
export function hasTierAccess(currentTier, requiredTier) {
  const currentRank = PLAN_RANKS[currentTier] || 0;
  const requiredRank = PLAN_RANKS[requiredTier] || 0;
  return currentRank >= requiredRank;
}

/**
 * Resolve required plan name for human-friendly displays
 */
export function getRequiredPlanName(requiredTier) {
  switch (requiredTier) {
    case PLAN_TIERS.PREMIUM:
      return 'Premium (₹29,999)';
    case PLAN_TIERS.GROWTH:
      return 'Growth (₹999/mo)';
    case PLAN_TIERS.STARTER:
      return 'Starter (₹599/mo)';
    default:
      return 'Active Plan';
  }
}
