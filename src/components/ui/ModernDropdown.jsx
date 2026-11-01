'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/formatters';

/**
 * ModernDropdown - A sleek custom dropdown component matching VARNAM luxury design:
 * - Rounded corners, warm border, custom badge/icon support
 * - Eliminates default browser select & blue highlight
 * - Smooth transition, outside click dismissal, accessible
 */
export function ModernDropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  className,
  buttonClassName,
  menuClassName,
  disabled = false,
  error,
  helperText,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const [filterText, setFilterText] = useState('');

  // Reset filter when closed
  useEffect(() => {
    if (!isOpen) setFilterText('');
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!filterText.trim()) return options;
    const q = filterText.toLowerCase().trim();
    return options.filter((opt) => {
      const labelMatch = opt.label?.toLowerCase().includes(q);
      const valMatch = String(opt.value).toLowerCase().includes(q);
      const subMatch = opt.subText ? String(opt.subText).toLowerCase().includes(q) : false;
      const searchTerms = opt.searchTerms ? String(opt.searchTerms).toLowerCase().includes(q) : false;
      return labelMatch || valMatch || subMatch || searchTerms;
    });
  }, [options, filterText]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  return (
    <div className={cn('w-full relative space-y-1.5', className)} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-stone-700">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer shadow-2xs text-left',
          isOpen
            ? 'border-[#F97316] ring-2 ring-[#F97316]/15'
            : error
            ? 'border-rose-400 ring-2 ring-rose-500/15'
            : 'border-[#F0E7DE] hover:border-stone-300',
          disabled && 'opacity-50 cursor-not-allowed bg-stone-50',
          buttonClassName
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedOption?.badgeColor && (
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                selectedOption.badgeColor
              )}
            />
          )}
          {selectedOption?.icon && (
            <span className="shrink-0 text-stone-400">{selectedOption.icon}</span>
          )}
          <span
            className={cn(
              'font-semibold truncate',
              selectedOption ? 'text-stone-900' : 'text-stone-400'
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 ml-2',
            isOpen && 'rotate-180 text-[#F97316]'
          )}
        />
      </button>

      {/* Dropdown Menu - Mobile 360px & Desktop Viewport Safe */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 right-0 top-full mt-1.5 bg-white border border-orange-200/80 rounded-2xl shadow-[0_16px_40px_rgba(249,115,22,0.15)] py-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-hidden flex flex-col ring-1 ring-orange-500/10 max-w-[calc(100vw-32px)]',
            menuClassName
          )}
        >
          {/* Search bar inside dropdown if there are 4 or more options, or explicitly searchable */}
          {options.length >= 4 && (
            <div className="p-2 border-b border-stone-100 bg-stone-50/50">
              <input
                type="text"
                autoFocus
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Search..."
                className="w-full px-2.5 py-1.5 bg-white border border-[#F0E7DE] rounded-lg text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#F97316]"
              />
            </div>
          )}

          <div className="overflow-y-auto max-h-56 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3.5 py-3 text-xs text-stone-400 text-center">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3.5 py-2 text-xs sm:text-sm text-left transition-colors cursor-pointer group',
                      isSelected
                        ? 'bg-orange-50/80 text-[#C2410C] font-bold'
                        : 'text-stone-700 hover:bg-stone-50 font-medium'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {opt.badgeColor && (
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full shrink-0',
                            opt.badgeColor
                          )}
                        />
                      )}
                      {opt.icon && (
                        <span className="shrink-0 text-stone-400 group-hover:text-stone-600">
                          {opt.icon}
                        </span>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{opt.label}</span>
                        {opt.subText && (
                          <span className="text-[11px] text-stone-400 font-normal truncate">
                            {opt.subText}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#F97316] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && <p className="text-xs text-stone-500">{helperText}</p>}
    </div>
  );
}
