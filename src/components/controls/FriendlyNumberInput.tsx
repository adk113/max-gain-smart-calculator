import React, { useState, useEffect, useRef } from 'react';

export interface FriendlyNumberInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  allowNegative?: boolean;
  autoSelectOnFocus?: boolean;
  onEnterPress?: () => void;
}

/**
 * FriendlyNumberInput
 * Solves the classic React controlled number input issues:
 * 1. Automatically selects the entire text on focus so typing replaces the existing number directly.
 * 2. Allows deleting everything: clearing the field sets value to 0 in state without popping the '0' back in while typing.
 * 3. Uses text input with numeric/decimal inputMode to avoid browser "Enter a valid value" validation popups and awkward spin buttons.
 * 4. Snaps cleanly to min/max on blur.
 */
export const FriendlyNumberInput: React.FC<FriendlyNumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  className = '',
  placeholder = '0',
  prefix,
  suffix,
  disabled = false,
  allowNegative = false,
  autoSelectOnFocus = true,
  onEnterPress,
}) => {
  const [displayVal, setDisplayVal] = useState<string>(() => (value === 0 ? '0' : value.toString()));
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal display value when external prop changes and input is not being actively typed into
  useEffect(() => {
    if (!isFocused) {
      setDisplayVal(value === 0 ? '0' : value.toString());
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow user to delete everything cleanly
    if (raw === '') {
      setDisplayVal('');
      onChange(0);
      return;
    }

    // Filter valid numeric characters
    let cleaned = allowNegative
      ? raw.replace(/(?!^)-/g, '').replace(/[^0-9.-]/g, '')
      : raw.replace(/[^0-9.]/g, '');

    // Allow only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    // Clean up leading zeros if typing new digits (e.g. typing '5' over '0' -> '5' instead of '05')
    if (cleaned.length > 1 && cleaned.startsWith('0') && !cleaned.startsWith('0.')) {
      cleaned = cleaned.replace(/^0+/, '');
      if (cleaned === '') cleaned = '0';
    }

    setDisplayVal(cleaned);

    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (autoSelectOnFocus) {
      // Small timeout ensures selection works reliably on iOS Safari and touch devices
      setTimeout(() => {
        e.target.select();
      }, 10);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    if (displayVal.trim() === '' || displayVal === '-') {
      const fallback = min !== undefined ? min : 0;
      setDisplayVal(fallback.toString());
      onChange(fallback);
      return;
    }

    const parsed = parseFloat(displayVal);
    if (isNaN(parsed)) {
      const fallback = min !== undefined ? min : 0;
      setDisplayVal(fallback.toString());
      onChange(fallback);
    } else {
      let bounded = parsed;
      if (min !== undefined && bounded < min) bounded = min;
      if (max !== undefined && bounded > max) bounded = max;

      setDisplayVal(bounded.toString());
      onChange(bounded);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
      if (onEnterPress) {
        onEnterPress();
      }
    }
  };

  return (
    <div className="relative inline-flex items-center w-full">
      {prefix && (
        <span className="absolute left-2.5 text-xs font-semibold text-slate-400 pointer-events-none select-none">
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        disabled={disabled}
        placeholder={placeholder}
        value={displayVal}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`${className} ${prefix ? 'pl-6' : ''} ${suffix ? 'pr-6' : ''}`}
      />
      {suffix && (
        <span className="absolute right-2.5 text-xs font-semibold text-slate-400 pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  );
};
