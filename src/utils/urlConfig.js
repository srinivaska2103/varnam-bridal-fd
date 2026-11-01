/**
 * Centralized URL & Domain Resolution Utility for VARNAM Frontend
 *
 * Rules:
 * 1. Development: http://localhost:3000 (or current browser origin if in dev)
 * 2. Production: https://app.varnam.vexatech.in
 * 3. Custom Domain (Premium studios): https://${custom_domain}
 * 4. All production URLs strictly enforce HTTPS.
 */

export const PRODUCTION_APP_URL = 'https://app.varnam.vexatech.in';
export const LOCAL_DEV_APP_URL = 'http://localhost:3000';

/**
 * Determine the base application URL dynamically based on environment & window origin.
 * @returns {string} e.g. "https://app.varnam.vexatech.in" or "http://localhost:3000"
 */
export function getAppBaseUrl() {
  // If explicitly configured via environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }

  // Check if running in production environment
  const isProd = process.env.NODE_ENV === 'production';

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // In production builds or when accessing through non-localhost domain, preserve origin or fallback to production
    if (isProd) {
      if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return origin.replace(/\/+$/, '');
      }
      return PRODUCTION_APP_URL;
    }
    // In local dev browser, use current origin
    return origin || LOCAL_DEV_APP_URL;
  }

  return isProd ? PRODUCTION_APP_URL : LOCAL_DEV_APP_URL;
}

/**
 * Generates the full public website URL for a studio.
 * Supports custom domain overrides for Premium studios.
 *
 * @param {string} slug - The unique studio slug or subdomain.
 * @param {string|null} customDomain - Optional custom domain configured by the studio.
 * @returns {string} The resolved absolute public URL.
 */
export function getPublicStudioUrl(slug, customDomain = null) {
  if (customDomain && customDomain.trim()) {
    const cleaned = customDomain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    if (cleaned) {
      return `https://${cleaned}`;
    }
  }

  if (!slug) return '';
  const base = getAppBaseUrl();
  const cleanSlug = slug.toString().trim().replace(/^\/+/, '');
  return `${base}/${cleanSlug}`;
}

/**
 * Generates the preview URL for a studio website.
 *
 * @param {string} slug - The unique studio slug or subdomain.
 * @param {string|null} customDomain - Optional custom domain.
 * @returns {string} The resolved absolute preview URL with query parameter.
 */
export function getPreviewStudioUrl(slug, customDomain = null) {
  const publicUrl = getPublicStudioUrl(slug, customDomain);
  if (!publicUrl) return '';
  return `${publicUrl}?preview=true`;
}

