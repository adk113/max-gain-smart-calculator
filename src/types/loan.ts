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

export interface SalaryCycleConfig {
  enabled: boolean;
  monthlySalary: number;
  parkingDays: number; // e.g. 10 days parked at 100%
  withdrawalPercent: number; // e.g. 60% withdrawn on day (parkingDays + 1)
  accumulateRetainedSavings: boolean; // false = static monthly float, true = adds retained savings month-over-month
}

export type OneTimeTransactionType = 'DEPOSIT' | 'WITHDRAWAL';

export interface OneTimeTransaction {
  id: string;
  type: OneTimeTransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  label?: string; // e.g. "Bonus", "Emergency Fund", "Tax Refund"
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
  monthlySurplusStartDate?: string; // Optional start date for recurring monthly surplus
  oneTimeTransactions?: OneTimeTransaction[]; // Lump-sum deposits and withdrawals
  customSurplusLedger: Record<number, number>;
  salaryCycle: SalaryCycleConfig;
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
  salaryFloatOffset: number;
  oneTimeDeposit: number;
  oneTimeWithdrawal: number;
  netOneTimeSurplus: number;
  monthlySurplus: number;
  effectivePrincipal: number;
  accruedInterest: number;
  standardAccruedInterest: number;
  monthlyInterestSaved: number;
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
  transactions?: OneTimeTransaction[];
}

export interface FinancialMilestoneInsight {
  id: string;
  type: 'TENURE_CHANGE' | 'RATE_SHIFT' | 'EMI_CHANGE' | 'SURPLUS_IMPACT' | 'SALARY_CYCLE' | 'CLOSURE_EVENT';
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
  effectiveMonthlySalaryFloat: number;
  monthlyInterestSavedFromFloat: number;
  totalOneTimeDeposited: number;
  totalOneTimeWithdrawn: number;
  netOneTimeSurplus: number;
  milestones: FinancialMilestoneInsight[];
}
