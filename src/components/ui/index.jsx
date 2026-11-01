import React from 'react';
import { cn } from '@/utils/formatters';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  isLoading = false,
  disabled,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99] cursor-pointer';

  const variants = {
    primary:
      'bg-amber-600 hover:bg-amber-700 text-white shadow-sm focus:ring-amber-500',
    secondary:
      'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 focus:ring-stone-400',
    outline:
      'bg-transparent hover:bg-stone-50 text-stone-700 border border-stone-300 focus:ring-stone-300',
    ghost:
      'bg-transparent hover:bg-stone-100 text-stone-600 focus:ring-stone-200',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

export function Input({ label, error, helperText, className, id, ...props }) {
  const inputId = id || props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-stone-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-3.5 py-2 bg-white border rounded-xl text-sm text-stone-800 placeholder-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600',
          error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-stone-200',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-stone-500 mt-1">{helperText}</p>}
    </div>
  );
}

export function Select({ label, error, helperText, options = [], className, id, children, ...props }) {
  const selectId = id || props.name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-stone-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'w-full appearance-none px-3.5 py-2.5 pr-9 bg-white border rounded-xl text-xs sm:text-sm font-medium text-stone-800 transition-all cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#F97316]/20 focus:border-[#F97316]',
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-[#F0E7DE] hover:border-stone-300',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-stone-500 mt-1">{helperText}</p>}
    </div>
  );
}

export function Card({ children, className, title, subtitle, action, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]',
        className
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
          <div>
            {title && <h3 className="font-semibold text-stone-800 text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-stone-100 text-stone-700 border-stone-200',
    primary: 'bg-amber-50 text-amber-800 border-amber-200/80',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
    info: 'bg-sky-50 text-sky-800 border-sky-200/80',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}

export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-stone-500 gap-3">
      <div className="w-8 h-8 border-3 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
      <span className="text-xs font-medium">{text}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50">
      {Icon && (
        <div className="mx-auto w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-stone-400 mb-3 border border-stone-100">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
      {description && <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, breadcrumb }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        {breadcrumb && <div className="text-xs text-stone-400 mb-1">{breadcrumb}</div>}
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-stone-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full bg-white rounded-3xl border border-[#F0E7DE] shadow-2xl z-10 my-auto animate-in zoom-in-95 duration-150',
          sizeClasses[size] || sizeClasses.md
        )}
      >
        {title && (
          <div className="px-6 py-4 border-b border-[#F0E7DE] flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export { ModernDropdown } from './ModernDropdown';
export { ModernDatePicker } from './ModernDatePicker';
export { ModernTimePicker } from './ModernTimePicker';

