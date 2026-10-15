import React, { useState, useEffect } from 'react';
import { formatCompactDenomination } from '../../utils/formatters';

interface DualSliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  prefix?: string;
  isCurrency?: boolean;
  isIndianNotation?: boolean;
  presets?: { label: string; value: number }[];
  onChange: (val: number) => void;
  helperText?: string;
  isLocked?: boolean;
}

export const DualSliderInput: React.FC<DualSliderInputProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  prefix = '',
  isCurrency = false,
  isIndianNotation = true,
  presets = [],
  onChange,
  helperText,
  isLocked = false,
}) => {
  const [textVal, setTextVal] = useState<string>(value.toString());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setTextVal(value.toString());
    }
  }, [value, isFocused]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value);
    onChange(num);
    setTextVal(num.toString());
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      setTextVal('');
      onChange(min);
      return;
    }
    // Filter numeric characters
    let cleaned = raw.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    if (cleaned.length > 1 && cleaned.startsWith('0') && !cleaned.startsWith('0.')) {
      cleaned = cleaned.replace(/^0+/, '');
      if (cleaned === '') cleaned = '0';
    }
    setTextVal(cleaned);
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    setTimeout(() => {
      e.target.select();
    }, 10);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(textVal.replace(/,/g, ''));
    if (isNaN(parsed) || parsed < min) {
      onChange(min);
      setTextVal(min.toString());
    } else if (parsed > max) {
      onChange(max);
      setTextVal(max.toString());
    } else {
      onChange(parsed);
      setTextVal(parsed.toString());
    }
  };

  const progressPercent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 transition-all hover:border-slate-600/60 shadow-lg">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            {label}
          </label>
          {isLocked && (
            <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
              🔒 Locked
            </span>
          )}
        </div>
        
        {/* Linked Manual Text Input Box */}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-emerald-400 font-bold text-sm pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={textVal}
            onChange={handleTextChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`w-32 sm:w-36 py-1.5 text-right font-mono text-sm sm:text-base font-bold text-white bg-slate-900/90 border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
              prefix ? 'pl-7 pr-3' : 'px-3'
            } ${unit ? 'pr-8' : ''} border-slate-700/80 shadow-inner`}
          />
          {unit && (
            <span className="absolute right-2.5 text-slate-400 text-xs font-semibold pointer-events-none">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Linked Smooth Slider Bar Component */}
      <div className="relative pt-1 pb-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={isLocked}
          onChange={handleSliderChange}
          className={`w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none touch-pan-y ${
            isLocked ? 'pointer-events-none opacity-50 cursor-not-allowed' : ''
          }`}
          style={{
            background: `linear-gradient(to right, #10b981 ${progressPercent}%, #1e293b ${progressPercent}%)`,
            touchAction: 'pan-y',
          }}
        />
        <div className="flex justify-between items-center text-[10px] sm:text-xs text-slate-400 font-mono mt-1.5">
          <span>
            {prefix}
            {isCurrency ? formatCompactDenomination(min, isIndianNotation) : min}
            {unit}
          </span>
          <span className="text-emerald-400 font-medium">
            {isCurrency ? formatCompactDenomination(value, isIndianNotation) : `${value} ${unit}`}
          </span>
          <span>
            {prefix}
            {isCurrency ? formatCompactDenomination(max, isIndianNotation) : max}
            {unit}
          </span>
        </div>
      </div>

      {/* Quick Preset Chips */}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-slate-800/80">
          {presets.map((preset) => {
            const isActive = Math.abs(preset.value - value) < 0.001;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onChange(preset.value);
                  setTextVal(preset.value.toString());
                }}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all active:scale-95 ${
                  isActive
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 font-bold'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-slate-400 mt-2 font-normal leading-relaxed">{helperText}</p>
      )}
    </div>
  );
};
