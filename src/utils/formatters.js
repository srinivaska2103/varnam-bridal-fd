/**
 * Utility for combining CSS class names safely
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format currency in Indian Rupees (paise to INR string)
 */
export function formatINR(paise = 0) {
  const rupees = Number(paise) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Format dates cleanly for UI display
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

/**
 * Format full date & time for records
 */
export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}
