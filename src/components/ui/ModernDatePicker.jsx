'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/utils/formatters';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Safe local date parser for "YYYY-MM-DD" or ISO strings.
 * Avoids UTC timezone conversion shifts.
 */
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * ModernDatePicker - A luxury bridal themed date picker:
 * - High contrast, warm palette (#F97316 sunset orange, #292524 text)
 * - Smooth calendar popup with clean month navigation
 * - Outside month days are visually distinct and interactive
 * - Safe local date handling (no UTC date shifts)
 */
export function ModernDatePicker({
  value,
  onChange,
  placeholder = 'Select event date...',
  className,
  error,
  required,
  minDate,
  unavailableDates = [],
  disablePastDates = true,
  onMonthChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedDate = parseLocalDate(value);
  const initialDate = selectedDate || new Date();

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [prevValue, setPrevValue] = useState(value);

  // If value prop changes from outside (e.g. modal opens or date resets), adjust view month/year
  if (value !== prevValue) {
    setPrevValue(value);
    const parsed = parseLocalDate(value);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }

  // Close calendar on click outside
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

  const unavailableSet = React.useMemo(() => {
    return new Set(Array.isArray(unavailableDates) ? unavailableDates : []);
  }, [unavailableDates]);

  // Navigate months
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    let newMonth = viewMonth - 1;
    let newYear = viewYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
    if (onMonthChange) {
      onMonthChange({ year: newYear, month: newMonth });
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    let newMonth = viewMonth + 1;
    let newYear = viewYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
    if (onMonthChange) {
      onMonthChange({ year: newYear, month: newMonth });
    }
  };

  // Build days grid for the current viewMonth
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    calendarDays.push({
      day: daysInPrevMonth - i,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to fill 42 cells (6 full rows)
  const remainingCells = 42 - calendarDays.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    calendarDays.push({
      day: d,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
    });
  }

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth();
  const todayD = today.getDate();

  const isTodayDate = (y, m, d) => todayY === y && todayM === m && todayD === d;

  const isPastDate = (y, m, d) => {
    const target = new Date(y, m, d, 0, 0, 0, 0).getTime();
    const startOfToday = new Date(todayY, todayM, todayD, 0, 0, 0, 0).getTime();
    return target < startOfToday;
  };

  const getCellDateStr = (cell) => {
    const m = String(cell.month + 1).padStart(2, '0');
    const d = String(cell.day).padStart(2, '0');
    return `${cell.year}-${m}-${d}`;
  };

  const isBookedDate = (cell) => {
    const dateStr = getCellDateStr(cell);
    return unavailableSet.has(dateStr);
  };

  const handleSelectDay = (cell) => {
    const isPast = disablePastDates && isPastDate(cell.year, cell.month, cell.day);
    const isBooked = isBookedDate(cell);

    if (isPast || isBooked) {
      return;
    }

    // If a day from adjacent month is clicked, update viewMonth/viewYear
    if (!cell.isCurrentMonth) {
      setViewMonth(cell.month);
      setViewYear(cell.year);
    }

    const dateStr = getCellDateStr(cell);
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  const handleSetToday = (e) => {
    e.stopPropagation();
    const formattedMonth = String(todayM + 1).padStart(2, '0');
    const formattedDay = String(todayD).padStart(2, '0');
    const dateStr = `${todayY}-${formattedMonth}-${formattedDay}`;

    if (unavailableSet.has(dateStr)) {
      return;
    }

    onChange(dateStr);
    setViewYear(todayY);
    setViewMonth(todayM);
    setIsOpen(false);
  };

  // Display value
  let formattedDisplay = '';
  if (value) {
    const parsed = parseLocalDate(value);
    if (parsed) {
      formattedDisplay = parsed.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  const isSelectedDate = (y, m, d) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === y &&
      selectedDate.getMonth() === m &&
      selectedDate.getDate() === d
    );
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-xl text-xs transition-all duration-150 cursor-pointer shadow-2xs text-left',
          isOpen
            ? 'border-[#F97316] ring-2 ring-[#F97316]/15'
            : error
            ? 'border-rose-400 ring-2 ring-rose-500/15'
            : 'border-[#F0E7DE] hover:border-stone-300'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CalendarIcon
            className={cn(
              'w-4 h-4 shrink-0',
              value ? 'text-[#F97316]' : 'text-stone-400'
            )}
          />
          <span
            className={cn(
              'truncate font-semibold',
              value ? 'text-[#292524]' : 'text-stone-400 font-normal'
            )}
          >
            {formattedDisplay || placeholder}
          </span>
        </div>

        {value && (
          <span
            onClick={handleClear}
            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
            title="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {/* Modern Calendar Modal UI with Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-[330px] bg-white rounded-3xl border border-[#F0E7DE] shadow-2xl p-4 sm:p-5 animate-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#F0E7DE]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#C2410C] flex items-center justify-center">
                  <CalendarIcon className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-sm sm:text-base text-[#292524] tracking-tight">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer ml-1"
                  title="Close calendar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Row */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {DAY_LABELS.map((day) => (
                <span
                  key={day}
                  className="text-[10px] font-bold text-stone-400 uppercase py-0.5"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((cell, idx) => {
                const selected = isSelectedDate(cell.year, cell.month, cell.day);
                const isToday = isTodayDate(cell.year, cell.month, cell.day);
                const isPast = disablePastDates && isPastDate(cell.year, cell.month, cell.day);
                const isBooked = isBookedDate(cell);
                const isDisabled = isPast || isBooked;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectDay(cell)}
                    title={
                      isBooked
                        ? 'This date is already booked'
                        : isPast
                        ? 'Past date unavailable'
                        : undefined
                    }
                    className={cn(
                      'h-8 sm:h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all relative cursor-pointer active:scale-95',
                      selected
                        ? 'bg-[#F97316] text-white font-bold shadow-xs'
                        : isBooked
                        ? 'bg-rose-50 text-rose-400 border border-rose-200 line-through cursor-not-allowed opacity-80'
                        : isPast
                        ? 'text-stone-300 cursor-not-allowed opacity-35'
                        : isToday
                        ? 'bg-orange-50 text-[#C2410C] font-bold border border-orange-200 hover:bg-orange-100'
                        : cell.isCurrentMonth
                        ? 'text-[#292524] hover:bg-stone-100 font-medium'
                        : 'text-stone-400/80 hover:bg-stone-50 font-normal'
                    )}
                  >
                    {cell.day}
                    {isBooked && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-rose-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Availability Legend */}
            <div className="flex items-center justify-center gap-3.5 py-2 mt-2.5 border-t border-stone-100 text-[10px] text-stone-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F97316]" />
                Selected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-100 border border-rose-300" />
                Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-stone-100 border border-stone-200" />
                Available
              </span>
            </div>

            {/* Calendar Footer Actions */}
            <div className="flex items-center justify-between pt-2.5 border-t border-[#F0E7DE] text-xs">
              <button
                type="button"
                onClick={handleClear}
                className="font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-stone-100"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSetToday}
                className="font-bold text-[#F97316] hover:text-[#C2410C] transition-colors cursor-pointer py-1 px-3 rounded-lg bg-orange-50 hover:bg-orange-100"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
