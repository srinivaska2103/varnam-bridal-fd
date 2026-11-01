'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, Check, X, Sparkles } from 'lucide-react';
import { cn } from '@/utils/formatters';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

// Quick duration presets specifically helpful for bridal services & appointments
const QUICK_PRESETS = [
  { label: '30m', value: '00:30' },
  { label: '45m', value: '00:45' },
  { label: '1h', value: '01:00' },
  { label: '1h 30m', value: '01:30' },
  { label: '2h', value: '02:00' },
  { label: '2h 30m', value: '02:30' },
  { label: '3h', value: '03:00' },
  { label: '4h', value: '04:00' },
];

/**
 * ModernTimePicker - Luxury bridal themed responsive time & duration picker:
 * - Responsive popover positioning (auto left/right alignment, viewport overflow protection)
 * - Clean quick preset pills for bridal artistry durations
 * - 12-hour AM/PM label preview with clean typography
 * - Smooth scroll, clear button, outside click and ESC dismissal
 */
export function ModernTimePicker({
  value = '',
  onChange,
  label,
  placeholder = 'Select time...',
  className,
  error,
  align = 'auto', // 'auto' | 'left' | 'right'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const popoverRef = useRef(null);
  const hoursListRef = useRef(null);

  // Parse current value "HH:MM"
  const [selectedHour, selectedMinute] = (value && value.includes(':') ? value : '06:00').split(':');

  // Auto-scroll hours list to selected hour when opened
  useEffect(() => {
    if (isOpen && hoursListRef.current) {
      const selectedEl = hoursListRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleHourSelect = (h) => {
    const newTime = `${h}:${selectedMinute || '00'}`;
    onChange(newTime);
  };

  const handleMinuteSelect = (m) => {
    const newTime = `${selectedHour || '01'}:${m}`;
    onChange(newTime);
  };

  const handlePresetSelect = (presetVal) => {
    onChange(presetVal);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // 12-hour AM/PM format display
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${String(displayH).padStart(2, '0')}:${m} ${period}`;
  };

  return (
    <div className={cn('relative w-full space-y-1', className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-stone-700">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-xl text-xs transition-all duration-150 cursor-pointer shadow-2xs text-left group',
          isOpen
            ? 'border-[#F97316] ring-2 ring-[#F97316]/15'
            : error
            ? 'border-rose-400 ring-2 ring-rose-500/15'
            : 'border-[#F0E7DE] hover:border-stone-300'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-4 h-4 text-[#F97316] shrink-0" />
          {value ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-[#292524] truncate">
                {formatTimeDisplay(value)}
              </span>
              <span className="text-[11px] text-stone-400 font-normal shrink-0">
                ({value})
              </span>
            </div>
          ) : (
            <span className="font-normal text-stone-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClear(e);
              }}
              title="Clear time"
              className="p-0.5 text-stone-300 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 text-stone-400 transition-transform duration-200',
              isOpen && 'rotate-180 text-[#F97316]'
            )}
          />
        </div>
      </button>

      {/* Modern Time Picker Modal UI with Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={popoverRef}
            className="relative z-10 w-full max-w-[310px] bg-white border border-[#F0E7DE] rounded-3xl shadow-2xl p-4 sm:p-5 animate-in zoom-in-95 duration-150 my-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-[#F0E7DE]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#C2410C] flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-sm sm:text-base text-[#292524] tracking-tight">
                  Select Time
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                title="Close time picker"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Column Headers */}
            <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-orange-100/70 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              <span>Hours</span>
              <span>Minutes</span>
            </div>

            <div className="grid grid-cols-2 gap-2 h-44">
              {/* Hours Column */}
              <div ref={hoursListRef} className="overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {HOURS.map((h) => {
                  const isSelected = value && h === selectedHour;
                  const intH = parseInt(h, 10);
                  const period = intH >= 12 ? 'PM' : 'AM';
                  const displayH = intH % 12 === 0 ? 12 : intH % 12;

                  return (
                    <button
                      key={h}
                      type="button"
                      data-selected={isSelected ? 'true' : 'false'}
                      onClick={() => handleHourSelect(h)}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                        isSelected
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs font-bold'
                          : 'text-stone-700 hover:bg-orange-50/60'
                      )}
                    >
                      <span>{h}:00</span>
                      <span
                        className={cn(
                          'text-[10px]',
                          isSelected ? 'text-white/90 font-bold' : 'text-stone-400'
                        )}
                      >
                        {displayH} {period}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Minutes Column */}
              <div className="flex flex-col justify-between">
                <div className="space-y-1">
                  {MINUTES.map((m) => {
                    const isSelected = value && m === selectedMinute;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          handleMinuteSelect(m);
                          setIsOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                          isSelected
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs font-bold'
                            : 'text-stone-700 hover:bg-orange-50/60'
                        )}
                      >
                        <span>:{m} mins</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-1 text-white" />}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Actions: Clear & Done */}
                <div className="pt-2 mt-1 border-t border-orange-100/70 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[11px] font-bold text-stone-500 hover:text-orange-600 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-stone-50"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
