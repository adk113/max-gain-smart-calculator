import { SUPPORTED_CURRENCIES } from '../types/loan';

export function getCurrencyConfig(currencyCode: string) {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
  return found || SUPPORTED_CURRENCIES[0]; // fallback to INR
}

/**
 * Formats a numeric value into currency string.
 * For INR, supports standard Indian digit grouping (e.g. ₹75,00,000) or compact Lakhs/Crores.
 */
export function formatCurrency(
  value: number,
  currencyCode: string = 'INR',
  compact: boolean = false
): string {
  if (isNaN(value) || value === null || value === undefined) {
    value = 0;
  }

  const rounded = Math.round(value);
  const config = getCurrencyConfig(currencyCode);

  if (compact) {
    if (config.isIndianNotation) {
      const absVal = Math.abs(rounded);
      const sign = rounded < 0 ? '-' : '';
      if (absVal >= 10000000) {
        return `${sign}${config.symbol}${(absVal / 10000000).toFixed(2)} Cr`;
      } else if (absVal >= 100000) {
        return `${sign}${config.symbol}${(absVal / 100000).toFixed(2)} L`;
      } else if (absVal >= 1000) {
        return `${sign}${config.symbol}${(absVal / 1000).toFixed(1)} k`;
      }
      return `${sign}${config.symbol}${absVal}`;
    } else {
      const absVal = Math.abs(rounded);
      const sign = rounded < 0 ? '-' : '';
      if (absVal >= 1000000) {
        return `${sign}${config.symbol}${(absVal / 1000000).toFixed(2)} M`;
      } else if (absVal >= 1000) {
        return `${sign}${config.symbol}${(absVal / 1000).toFixed(1)} k`;
      }
      return `${sign}${config.symbol}${absVal}`;
    }
  }

  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(rounded);
  } catch {
    return `${config.symbol}${rounded.toLocaleString()}`;
  }
}

/**
 * Returns formatted compact text like "75 L" or "1.5 Cr" for slider tags
 */
export function formatCompactDenomination(val: number, isIndian: boolean = true): string {
  if (isIndian) {
    if (val >= 10000000) {
      const cr = val / 10000000;
      return `${Number.isInteger(cr) ? cr : cr.toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      const l = val / 100000;
      return `${Number.isInteger(l) ? l : l.toFixed(1)} L`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(0)}k`;
    }
    return val.toString();
  } else {
    if (val >= 1000000) {
      const m = val / 1000000;
      return `${Number.isInteger(m) ? m : m.toFixed(2)} M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(0)}k`;
    }
    return val.toString();
  }
}

export function formatPercentage(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

/**
 * Adds months to a YYYY-MM-DD or creates a readable "Mon YYYY" string
 */
export function addMonthsToDate(startDateStr: string, monthOffset: number): { dateStr: string; isoDate: string } {
  const parts = startDateStr.split('-');
  const year = parseInt(parts[0] || '2026', 10);
  const month = parseInt(parts[1] || '1', 10) - 1; // 0-indexed
  const day = parseInt(parts[2] || '1', 10);

  const d = new Date(year, month + monthOffset, day);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dateStr = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return { dateStr, isoDate };
}

export function formatDurationSaved(totalMonths: number): string {
  if (totalMonths <= 0) return '0 Months';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years > 0 && months > 0) {
    return `${years} ${years === 1 ? 'Year' : 'Years'}, ${months} ${months === 1 ? 'Month' : 'Months'}`;
  } else if (years > 0) {
    return `${years} ${years === 1 ? 'Year' : 'Years'}`;
  } else {
    return `${months} ${months === 1 ? 'Month' : 'Months'}`;
  }
}
