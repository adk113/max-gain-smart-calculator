import type { LockInPhase } from '../types/loan';

/**
 * Resolves the 360-month interest rate schedule based on multi-tier lock-in phases
 * and year-on-year fallback variable rates.
 */
export function buildRateSchedule(
  lockInPhases: LockInPhase[],
  fallbackRatePercent: number,
  fallbackYoYAdjustment: number = 0,
  maxMonths: number = 360
): number[] {
  // 1-indexed array for month 1 to 360
  const rates: number[] = new Array(maxMonths + 1).fill(fallbackRatePercent);

  let currentMonth = 1;

  for (const phase of lockInPhases) {
    const phaseMonths = Math.round(phase.durationYears * 12);
    const endMonth = Math.min(maxMonths, currentMonth + phaseMonths - 1);

    for (let m = currentMonth; m <= endMonth; m++) {
      rates[m] = phase.ratePercent;
    }

    currentMonth = endMonth + 1;
    if (currentMonth > maxMonths) break;
  }

  // Fallback for remaining period up to 360 months
  if (currentMonth <= maxMonths) {
    const fallbackStartMonth = currentMonth;
    for (let m = fallbackStartMonth; m <= maxMonths; m++) {
      const yearIndex = Math.floor((m - fallbackStartMonth) / 12);
      const adjustedRate = Math.max(1.0, fallbackRatePercent + yearIndex * fallbackYoYAdjustment);
      rates[m] = Number(adjustedRate.toFixed(2));
    }
  }

  return rates;
}
