export type LoanMode = 'FIX_EMI' | 'FIX_TENURE';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  isIndianNotation?: boolean;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', locale: 'en-IN', isIndianNotation: true },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', locale: 'en-GB' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)', locale: 'en-AE' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (CAD)', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD)', locale: 'en-AU' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD)', locale: 'en-SG' },
];

export interface LockInPhase {
  id: string;
  name: string;
  durationYears: number;
  ratePercent: number;
}

export interface SimulationInputs {
  principal: number;
  tenureYears: number;
  startDate: string; // YYYY-MM-DD
  mode: LoanMode;
  currencyCode: string;
  lockInPhases: LockInPhase[];
  fallbackRatePercent: number;
  fallbackYoYAdjustment: number;
  baselineMonthlySurplus: number;
  customSurplusLedger: Record<number, number>;
}

export interface MonthlyAmortizationRow {
  month: number;
  year: number;
  dateStr: string;
  isoDate: string;
  annualRate: number;
  monthlyRate: number;
  openingPrincipal: number;
  parkedSurplus: number;
  effectivePrincipal: number;
  accruedInterest: number;
  standardAccruedInterest: number;
  activeEmi: number;
  standardEmi: number;
  principalPaid: number;
  prepaymentOrSurplus: number;
  closingPrincipal: number;
  standardClosingPrincipal: number;
  cumulativeInterestPaid: number;
  cumulativeStandardInterestPaid: number;
  cumulativeTotalPaid: number;
  cumulativeStandardTotalPaid: number;
  isClosureMonth: boolean;
  isClosed: boolean;
}

export interface FinancialMilestoneInsight {
  id: string;
  type: 'TENURE_CHANGE' | 'RATE_SHIFT' | 'EMI_CHANGE' | 'SURPLUS_IMPACT' | 'CLOSURE_EVENT';
  month: number;
  dateStr: string;
  title: string;
  description: string;
  badgeText: string;
  badgeColor: 'emerald' | 'indigo' | 'amber' | 'blue' | 'purple' | 'rose';
}

export interface SimulationSummary {
  totalPrincipal: number;
  totalInterestPaid: number;
  standardTotalInterestPaid: number;
  lifetimeInterestSaved: number;
  totalAmountPaid: number;
  standardTotalAmountPaid: number;
  actualClosureMonth: number;
  actualClosureDate: string;
  originalTenureMonths: number;
  originalClosureDate: string;
  monthsSaved: number;
  yearsSaved: number;
  monthsRemainderSaved: number;
  initialBenchmarkEmi: number;
  interestReductionPercent: number;
  milestones: FinancialMilestoneInsight[];
}
