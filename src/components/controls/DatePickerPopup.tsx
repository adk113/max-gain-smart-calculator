import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerPopupProps {
  label: string;
  selectedDate: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

export const DatePickerPopup: React.FC<DatePickerPopupProps> = ({
  label,
  selectedDate,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-indexed

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

  const handleSelectDay = (day: number) => {
    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  // Format display text (e.g., "Aug 1, 2024")
  const dateObj = new Date(selectedDate);
  const displayLabel = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : selectedDate;

  return (
    <div className="relative inline-block w-full" ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm font-semibold text-white hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all shadow-inner active:scale-98"
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-4 h-4 text-emerald-400" />
          <span>{displayLabel}</span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Change
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="font-bold text-sm text-white">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 ml-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center py-2 text-[11px] font-semibold text-slate-400">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
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
                  className={`h-8 w-8 mx-auto rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick presets */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                onChange(d);
                setIsOpen(false);
              }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              First of Current Month
            </button>
            <button
              type="button"
              onClick={() => {
                // User's Excel sample start date
                onChange('2024-08-01');
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-slate-300"
            >
              Excel Date (Aug 2024)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
