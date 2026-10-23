import type { SimulationInputs } from '../types/loan';
import { deserializeSimulationState } from './urlSerializer';

export const STORAGE_KEY = 'maxgain_user_scenario';
export const LEGACY_STORAGE_KEY = 'maxgain_last_data_feed';

/**
 * Default reference scenario matching the 52L Excel model
 */
export const DEFAULT_EXCEL_SCENARIO: SimulationInputs = {
  principal: 5200000,
  tenureYears: 20,
  startDate: '2024-08-01',
  mode: 'FIX_EMI',
  currencyCode: 'INR',
  lockInPhases: [
    { id: 'phase-1', name: 'Excel 20-Year Term', durationYears: 20, ratePercent: 9.5 },
  ],
  fallbackRatePercent: 9.5,
  fallbackYoYAdjustment: 0,
  baselineMonthlySurplus: 0,
  monthlySurplusStartDate: '',
  oneTimeTransactions: [],
  customSurplusLedger: {
    1: 25000,
    2: 25000,
    3: 25000,
    4: 25000,
    5: 25000,
    6: 25000,
    7: 25000,
    8: 25000,
    9: 25000,
    10: 25000,
    11: 25000,
    12: 25000,
  },
  salaryCycle: {
    enabled: false,
    monthlySalary: 150000,
    parkingDays: 10,
    withdrawalPercent: 60,
    accumulateRetainedSavings: false,
  },
};

/**
 * Loads the active scenario from URL share hash, persistent localStorage,
 * or falls back to the default 52L Excel scenario template.
 */
export function getSavedScenario(): SimulationInputs {
  if (typeof window === 'undefined') return DEFAULT_EXCEL_SCENARIO;

  // 1. URL share hash priority
  if (window.location.hash.startsWith('#share=')) {
    try {
      const encoded = window.location.hash.replace('#share=', '');
      const restored = deserializeSimulationState(encoded);
      if (restored) return { ...DEFAULT_EXCEL_SCENARIO, ...restored };
    } catch {
      // ignore
    }
  }

  // 2. Persistent localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.principal === 'number' && parsed.principal > 0) {
        return {
          ...DEFAULT_EXCEL_SCENARIO,
          ...parsed,
          lockInPhases:
            Array.isArray(parsed.lockInPhases) && parsed.lockInPhases.length > 0
              ? parsed.lockInPhases
              : DEFAULT_EXCEL_SCENARIO.lockInPhases,
          oneTimeTransactions: Array.isArray(parsed.oneTimeTransactions)
            ? parsed.oneTimeTransactions
            : [],
          customSurplusLedger:
            parsed.customSurplusLedger !== undefined && typeof parsed.customSurplusLedger === 'object'
              ? parsed.customSurplusLedger
              : DEFAULT_EXCEL_SCENARIO.customSurplusLedger,
          salaryCycle: parsed.salaryCycle
            ? { ...DEFAULT_EXCEL_SCENARIO.salaryCycle, ...parsed.salaryCycle }
            : DEFAULT_EXCEL_SCENARIO.salaryCycle,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load user scenario:', err);
  }

  return DEFAULT_EXCEL_SCENARIO;
}

/**
 * Immediately persists scenario to localStorage
 */
export function saveScenario(inputs: SimulationInputs): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(inputs);
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(LEGACY_STORAGE_KEY, serialized);
  } catch (err) {
    console.warn('Failed to persist user scenario:', err);
  }
}
