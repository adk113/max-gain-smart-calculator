import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';

interface DatePickerPopupProps {
  label: string;
  selectedDate: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Smart date parser that accepts:
 * - YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
 * - DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
 * - YYYY-MM (defaults to 1st)
 * - Standard textual dates (e.g. "Aug 1 2024")
 */
function parseSmartDate(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Format 1: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1990 && y <= 2070) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Format 2: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1990 && y <= 2070) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Format 3: YYYY-MM
  const ymMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (ymMatch) {
    const y = parseInt(ymMatch[1], 10);
    const m = parseInt(ymMatch[2], 10);
    if (m >= 1 && m <= 12 && y >= 1990 && y <= 2070) {
      return `${y}-${String(m).padStart(2, '0')}-01`;
    }
  }

  // Fallback: Date.parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = parsed.getMonth() + 1;
    const d = parsed.getDate();
    if (y >= 1990 && y <= 2070) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  return null;
}

export const DatePickerPopup: React.FC<DatePickerPopupProps> = ({
  label,
  selectedDate,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse initial selectedDate parts
  const initialYear = useMemo(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return parseInt(selectedDate.substring(0, 4), 10);
    }
    return 2024;
  }, [selectedDate]);

  const initialMonth = useMemo(() => {
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return parseInt(selectedDate.substring(5, 7), 10) - 1;
    }
    return 7; // August (0-indexed)
  }, [selectedDate]);

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth); // 0-indexed

  // Manual typing state for input field
  const [inputText, setInputText] = useState<string>(selectedDate || '');
  const [popupInputText, setPopupInputText] = useState<string>(selectedDate || '');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Sync external selectedDate changes into text and view
  useEffect(() => {
    if (!isTyping) {
      setInputText(selectedDate);
      setPopupInputText(selectedDate);
      if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        setViewYear(parseInt(selectedDate.substring(0, 4), 10));
        setViewMonth(parseInt(selectedDate.substring(5, 7), 10) - 1);
      }
    }
  }, [selectedDate, isTyping]);

  // Close popup on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Year options for the dropdown (from 1995 to 2065 covers all loan durations)
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = 1995; y <= 2065; y++) {
      years.push(y);
    }
    return years;
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon...

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleYearChange = (newYear: number) => {
    setViewYear(newYear);
    // If selected date is in view, keep month/day aligned
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const m = parts[1];
        const d = parts[2];
        const newFormatted = `${newYear}-${m}-${d}`;
        onChange(newFormatted);
      }
    }
  };

  const handleMonthChange = (newMonth: number) => {
    setViewMonth(newMonth);
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const y = parts[0];
        const d = parts[2];
        const newFormatted = `${y}-${String(newMonth + 1).padStart(2, '0')}-${d}`;
        onChange(newFormatted);
      }
    }
  };

  const handleSelectDay = (day: number) => {
    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formatted);
    setInputText(formatted);
    setPopupInputText(formatted);
    setIsOpen(false);
  };

  // Direct manual typing handlers on the main input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    const validIso = parseSmartDate(val);
    if (validIso) {
      onChange(validIso);
      setPopupInputText(validIso);
      const parts = validIso.split('-');
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsTyping(true);
    setTimeout(() => {
      e.target.select();
    }, 10);
  };

  const handleInputBlur = () => {
    setIsTyping(false);
    const validIso = parseSmartDate(inputText);
    if (validIso) {
      setInputText(validIso);
      onChange(validIso);
    } else {
      // Revert to valid selectedDate if user left invalid text
      setInputText(selectedDate);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const validIso = parseSmartDate(inputText);
      if (validIso) {
        setInputText(validIso);
        onChange(validIso);
      }
      inputRef.current?.blur();
      setIsOpen(false);
    }
  };

  // Manual input inside popup
  const handleApplyPopupInput = () => {
    const validIso = parseSmartDate(popupInputText);
    if (validIso) {
      onChange(validIso);
      setInputText(validIso);
      const parts = validIso.split('-');
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
      setIsOpen(false);
    }
  };

  // Human-readable date label (e.g. "Aug 1, 2024")
  const displayFriendlyText = useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (m >= 0 && m < 12) {
        return `${MONTH_NAMES[m].substring(0, 3)} ${d}, ${y}`;
      }
    }
    return selectedDate;
  }, [selectedDate]);

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {/* Label and Friendly Display */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {label}
        </label>
        {displayFriendlyText && (
          <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {displayFriendlyText}
          </span>
        )}
      </div>

      {/* Main Dual Trigger: Editable Input + Calendar Button */}
      <div className="flex items-center rounded-xl bg-slate-900/90 border border-slate-700/80 focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-inner overflow-hidden">
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            autoComplete="off"
            value={inputText}
            placeholder="YYYY-MM-DD"
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-full py-2 px-3 bg-transparent font-mono text-sm font-bold text-white placeholder-slate-500 focus:outline-none"
            title="Type date directly (YYYY-MM-DD or DD/MM/YYYY) or open calendar"
          />
        </div>

        {/* Toggle Calendar Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-l transition-all cursor-pointer ${
            isOpen
              ? 'bg-emerald-500 text-slate-950 font-extrabold border-emerald-400 shadow-md'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 border-slate-700 hover:text-white'
          }`}
          title="Open interactive calendar picker"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>Calendar</span>
        </button>
      </div>

      {/* Dropdown Calendar Popup */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-88 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95">
          {/* Header with Month & Year Dropdown Selectors */}
          <div className="flex items-center justify-between gap-1.5 pb-3 border-b border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month & Year Select Dropdowns */}
            <div className="flex items-center gap-1.5 flex-1 justify-center">
              {/* Month Selector */}
              <select
                value={viewMonth}
                onChange={(e) => handleMonthChange(parseInt(e.target.value, 10))}
                className="bg-slate-800 text-white font-bold text-xs py-1 px-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={viewYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                className="bg-slate-800 text-emerald-400 font-bold font-mono text-xs py-1 px-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white cursor-pointer ml-1"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Year Steppers */}
          <div className="flex items-center justify-between gap-1 py-2 border-b border-slate-800/80 text-[10px] font-mono text-slate-400">
            <span className="text-[10px] uppercase text-slate-500 font-sans">Quick Jump:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleYearChange(viewYear - 5)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              >
                -5 Yrs
              </button>
              <button
                type="button"
                onClick={() => handleYearChange(viewYear - 1)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              >
                -1 Yr
              </button>
              <button
                type="button"
                onClick={() => handleYearChange(viewYear + 1)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              >
                +1 Yr
              </button>
              <button
                type="button"
                onClick={() => handleYearChange(viewYear + 5)}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              >
                +5 Yrs
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center py-2 text-[11px] font-semibold text-slate-400">
            <span className="text-rose-400">Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span className="text-indigo-400">Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Blank fillers for first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span key={`blank-${i}`} className="h-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const curFormatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = curFormatted === selectedDate;
              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto rounded-lg text-xs font-mono font-medium flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20 scale-105'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Manual Type-In Bar inside Popup */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Or type YYYY-MM-DD..."
              value={popupInputText}
              onChange={(e) => setPopupInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyPopupInput();
              }}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleApplyPopupInput}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center justify-between pt-2 text-[11px]">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                onChange(d);
                setInputText(d);
                setPopupInputText(d);
                setViewYear(now.getFullYear());
                setViewMonth(now.getMonth());
                setIsOpen(false);
              }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
            >
              1st of Current Month
            </button>

            <button
              type="button"
              onClick={() => {
                onChange('2024-08-01');
                setInputText('2024-08-01');
                setPopupInputText('2024-08-01');
                setViewYear(2024);
                setViewMonth(7);
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-slate-300 cursor-pointer"
            >
              Excel Date (Aug 2024)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
