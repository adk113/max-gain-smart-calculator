import type {
  MonthlyAmortizationRow,
  SimulationInputs,
  SimulationSummary,
  FinancialMilestoneInsight,
  SalaryExpenseRow,
  ExpenseAllocationMode,
} from '../types/loan';
import { addMonthsToDate, formatDurationSaved, formatCurrency, formatPercentage } from '../utils/formatters';
import { buildRateSchedule } from './rateLedger';

/**
 * Standard PMT / EMI formula matching Excel's PMT(rate, nper, -pv)
 */
export function calculateEmi(principal: number, annualRatePercent: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  const monthlyRate = annualRatePercent / 12 / 100;
  if (monthlyRate === 0) return principal / tenureMonths;

  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return isFinite(emi) ? emi : 0;
}

export interface SalaryIntervalSegment {
  startDay: number;
  endDay: number;
  days: number;
  intervalFraction: number;
  balance: number;
  retainedPercent: number;
  departingExpenses: { label: string; amount: number; day: number }[];
}

export interface DailySalaryBalancePoint {
  day: number;
  dayLabel: string;
  balance: number;
  retainedPercent: number;
  withdrawnOnDay: number;
  cumulativeWithdrawn: number;
  expenseDetails: {
    id: string;
    label: string;
    amount: number;
    percentOfSalary: number;
    mode: ExpenseAllocationMode;
    rawValue: number;
  }[];
}

export interface MonthlySalaryCycleSimulation {
  salary: number;
  daysInMonth: number;
  totalExpensesAmount: number;
  totalExpensesPercent: number;
  retainedEndOfMonth: number;
  retainedEndOfMonthPercent: number;
  baseMonthlyFloat: number;
  intervals: SalaryIntervalSegment[];
  dailyCurve: DailySalaryBalancePoint[];
}

/**
 * Resolves a single SalaryExpenseRow into its absolute currency amount and percentage of net salary.
 */
export function resolveExpenseRowAmount(
  row: SalaryExpenseRow,
  salary: number
): { amount: number; percentOfSalary: number; clampedDay: number } {
  const safeSalary = Math.max(0, salary || 0);
  const rawVal = Math.max(0, Number(row.value) || 0);
  const clampedDay = Math.min(31, Math.max(1, Math.round(Number(row.dayOfMonth) || 1)));

  if (row.allocationMode === 'PERCENTAGE') {
    const pct = Math.min(100, rawVal);
    const amount = (safeSalary * pct) / 100;
    return { amount, percentOfSalary: pct, clampedDay };
  } else {
    const amount = rawVal;
    const percentOfSalary = safeSalary > 0 ? (amount / safeSalary) * 100 : 0;
    return { amount, percentOfSalary, clampedDay };
  }
}

/**
 * Simulates the multi-drop daily cash balance curve and interval fractions across a monthly cycle.
 * If no custom expense rows are initialized, all expense deductions cleanly default to Zero (0).
 */
export function simulateMonthlySalaryCycle(
  salary: number,
  expenses?: SalaryExpenseRow[],
  daysInMonth: number = 30,
  legacyParkingDays: number = 0,
  legacyWithdrawalPercent: number = 0
): MonthlySalaryCycleSimulation {
  const safeDaysInMonth = Math.min(31, Math.max(28, Math.round(daysInMonth || 30)));
  const safeSalary = Math.max(0, Number(salary) || 0);

  // Build effective expense list:
  // If expenses array is provided (even if empty []), use it directly; if empty, all expense values default to 0.
  // Only fall back to legacy single-drop if expenses is undefined AND legacy parameters > 0.
  let effectiveExpenses: SalaryExpenseRow[] = [];
  if (Array.isArray(expenses)) {
    effectiveExpenses = expenses;
  } else if (legacyParkingDays > 0 && legacyWithdrawalPercent > 0) {
    effectiveExpenses = [
      {
        id: 'legacy-withdrawal',
        label: 'Scheduled Expense Withdrawal',
        dayOfMonth: Math.min(31, Math.max(1, legacyParkingDays + 1)),
        allocationMode: 'PERCENTAGE',
        value: Math.min(100, Math.max(0, legacyWithdrawalPercent)),
      },
    ];
  }

  // Group resolved expenses by calendar day within [1..safeDaysInMonth]
  const expensesByDay: Record<
    number,
    {
      id: string;
      label: string;
      amount: number;
      percentOfSalary: number;
      mode: ExpenseAllocationMode;
      rawValue: number;
    }[]
  > = {};

  let totalRawExpensesAmount = 0;

  for (const row of effectiveExpenses) {
    if (!row) continue;
    const { amount, percentOfSalary, clampedDay } = resolveExpenseRowAmount(row, safeSalary);
    if (amount <= 0 && (Number(row.value) || 0) <= 0) {
      // Zero-value expense row contributes 0 deduction
      continue;
    }
    const effectiveDay = Math.min(safeDaysInMonth, Math.max(1, clampedDay));
    if (!expensesByDay[effectiveDay]) {
      expensesByDay[effectiveDay] = [];
    }
    expensesByDay[effectiveDay].push({
      id: row.id,
      label: row.label || 'Expense Outflow',
      amount,
      percentOfSalary,
      mode: row.allocationMode,
      rawValue: Math.max(0, Number(row.value) || 0),
    });
    totalRawExpensesAmount += amount;
  }

  // Simulate Day 1 to safeDaysInMonth
  const dailyCurve: DailySalaryBalancePoint[] = [];
  let cumulativeWithdrawn = 0;

  for (let d = 1; d <= safeDaysInMonth; d++) {
    const dayExpenses = expensesByDay[d] || [];
    const withdrawnOnDay = dayExpenses.reduce((sum, item) => sum + item.amount, 0);
    cumulativeWithdrawn += withdrawnOnDay;

    const balance = Math.max(0, safeSalary - cumulativeWithdrawn);
    const retainedPercent = safeSalary > 0 ? (balance / safeSalary) * 100 : 0;

    dailyCurve.push({
      day: d,
      dayLabel: `Day ${d}`,
      balance,
      retainedPercent,
      withdrawnOnDay,
      cumulativeWithdrawn,
      expenseDetails: dayExpenses,
    });
  }

  // Construct precise sequential interval segments based on drop dates
  const intervals: SalaryIntervalSegment[] = [];
  if (dailyCurve.length > 0) {
    let segStart = 1;
    let segBalance = dailyCurve[0].balance;
    let segRetainedPct = dailyCurve[0].retainedPercent;
    let segExpenses = dailyCurve[0].expenseDetails.map((e) => ({
      label: e.label,
      amount: e.amount,
      day: 1,
    }));

    for (let d = 2; d <= safeDaysInMonth; d++) {
      const pt = dailyCurve[d - 1];
      const hasDropToday = pt.expenseDetails.length > 0;
      if (hasDropToday) {
        const segDays = d - segStart;
        intervals.push({
          startDay: segStart,
          endDay: d - 1,
          days: segDays,
          intervalFraction: segDays / safeDaysInMonth,
          balance: segBalance,
          retainedPercent: segRetainedPct,
          departingExpenses: segExpenses,
        });
        segStart = d;
        segBalance = pt.balance;
        segRetainedPct = pt.retainedPercent;
        segExpenses = pt.expenseDetails.map((e) => ({
          label: e.label,
          amount: e.amount,
          day: d,
        }));
      }
    }

    // Push final interval segment through end of month
    const finalDays = safeDaysInMonth - segStart + 1;
    intervals.push({
      startDay: segStart,
      endDay: safeDaysInMonth,
      days: finalDays,
      intervalFraction: finalDays / safeDaysInMonth,
      balance: segBalance,
      retainedPercent: segRetainedPct,
      departingExpenses: segExpenses,
    });
  }

  // Sum interval balances weighted by their exact interval fractions
  const baseMonthlyFloat =
    safeSalary > 0
      ? intervals.reduce((acc, seg) => acc + seg.balance * seg.intervalFraction, 0)
      : 0;

  const retainedEndOfMonth =
    dailyCurve.length > 0 ? dailyCurve[dailyCurve.length - 1].balance : 0;
  const retainedEndOfMonthPercent =
    safeSalary > 0 ? (retainedEndOfMonth / safeSalary) * 100 : 0;
  const totalExpensesPercent =
    safeSalary > 0 ? (totalRawExpensesAmount / safeSalary) * 100 : 0;

  return {
    salary: safeSalary,
    daysInMonth: safeDaysInMonth,
    totalExpensesAmount: totalRawExpensesAmount,
    totalExpensesPercent,
    retainedEndOfMonth,
    retainedEndOfMonthPercent,
    baseMonthlyFloat,
    intervals,
    dailyCurve,
  };
}

/**
 * Calculates the time-weighted daily average balance for the salary parking cycle
 * supporting both the Multi-Date Dynamic Expense Ledger and legacy single-drop inputs.
 */
export function calculateSalaryFloatOffset(
  salary: number,
  parkingDays: number,
  withdrawalPercent: number,
  monthIndex: number,
  accumulate: boolean,
  expenses?: SalaryExpenseRow[],
  daysInMonth: number = 30
): number {
  if (salary <= 0) return 0;

  const sim = simulateMonthlySalaryCycle(
    salary,
    expenses,
    daysInMonth,
    parkingDays,
    withdrawalPercent
  );

  if (accumulate && monthIndex > 1) {
    const priorAccumulated = (monthIndex - 1) * sim.retainedEndOfMonth;
    return sim.baseMonthlyFloat + priorAccumulated;
  }

  return sim.baseMonthlyFloat;
}

/**
 * Robust date parser supporting YYYY-MM-DD and DD-MM-YYYY formats.
 */
export function parseYearMonthDay(dateStr: string): { year: number; month: number; day: number } {
  if (!dateStr) return { year: 2024, month: 1, day: 1 };
  const parts = dateStr.replace(/\//g, '-').split('-');
  let year = 2024;
  let month = 1;
  let day = 1;

  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0], 10) || 2024;
      month = parseInt(parts[1], 10) || 1;
      day = parseInt(parts[2], 10) || 1;
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY
      day = parseInt(parts[0], 10) || 1;
      month = parseInt(parts[1], 10) || 1;
      year = parseInt(parts[2], 10) || 2024;
    } else {
      year = parseInt(parts[0], 10) || 2024;
      month = parseInt(parts[1], 10) || 1;
      day = parseInt(parts[2], 10) || 1;
    }
  } else if (parts.length === 2) {
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10) || 2024;
      month = parseInt(parts[1], 10) || 1;
    } else {
      month = parseInt(parts[0], 10) || 1;
      year = parseInt(parts[1], 10) || 2024;
    }
  }
  return { year, month, day };
}

/**
 * Helper to calculate the 1-indexed month index of a target date relative to loan start date.
 */
export function getMonthIndexFromDate(startDateStr: string, targetDateStr: string): number {
  if (!startDateStr || !targetDateStr) return 1;
  const s = parseYearMonthDay(startDateStr);
  const t = parseYearMonthDay(targetDateStr);
  const diff = (t.year - s.year) * 12 + (t.month - s.month);
  return diff + 1;
}

/**
 * Runs the complete 360-month Max Gain & Standard Amortization simulation
 * incorporating Multi-Tier rates, Overdraft daily salary float, Monthly Surplus,
 * and One-Time Lump-Sum Deposits / Withdrawals with precise daily interest offsets.
 */
export function runSimulation(inputs: SimulationInputs): {
  rows: MonthlyAmortizationRow[];
  summary: SimulationSummary;
} {
  const {
    principal,
    tenureYears,
    startDate,
    mode,
    currencyCode,
    lockInPhases,
    fallbackRatePercent,
    fallbackYoYAdjustment,
    baselineMonthlySurplus = 0,
    monthlySurplusStartDate,
    oneTimeTransactions = [],
    customSurplusLedger = {},
    salaryCycle = {
      enabled: false,
      monthlySalary: 150000,
      parkingDays: 0,
      withdrawalPercent: 0,
      accumulateRetainedSavings: false,
      expenses: [],
    },
  } = inputs;

  const totalTenureMonths = Math.min(360, Math.max(12, Math.round(tenureYears * 12)));
  const rateSchedule = buildRateSchedule(lockInPhases, fallbackRatePercent, fallbackYoYAdjustment, 360);

  const initialRate = rateSchedule[1] || fallbackRatePercent;
  const initialBenchmarkEmi = calculateEmi(principal, initialRate, totalTenureMonths);

  let curPrincipalMg = principal;
  let curPrincipalStd = principal;

  let cumInterestMg = 0;
  let cumInterestStd = 0;

  let closureMonth = totalTenureMonths;
  let closureFound = false;

  const rows: MonthlyAmortizationRow[] = [];
  const rateChangeEvents: { month: number; fromRate: number; toRate: number }[] = [];

  // Group one-time transactions by loan month index (1..360)
  const transactionsByMonth: Record<number, typeof oneTimeTransactions> = {};
  let totalOneTimeDeposited = 0;
  let totalOneTimeWithdrawn = 0;

  for (const tx of oneTimeTransactions) {
    if (!tx.amount || tx.amount <= 0 || !tx.date) continue;
    const mIdx = Math.max(1, Math.min(360, getMonthIndexFromDate(startDate, tx.date)));
    if (!transactionsByMonth[mIdx]) {
      transactionsByMonth[mIdx] = [];
    }
    transactionsByMonth[mIdx].push(tx);

    if (tx.type === 'DEPOSIT') {
      totalOneTimeDeposited += tx.amount;
    } else {
      totalOneTimeWithdrawn += tx.amount;
    }
  }

  const netOneTimeSurplus = totalOneTimeDeposited - totalOneTimeWithdrawn;
  const monthlySurplusStartMonth = monthlySurplusStartDate
    ? Math.max(1, getMonthIndexFromDate(startDate, monthlySurplusStartDate))
    : 1;

  // Month 1 base salary float for summary (using typical 30-day banking cycle)
  const effectiveMonthlySalaryFloat = salaryCycle.enabled
    ? calculateSalaryFloatOffset(
        salaryCycle.monthlySalary,
        salaryCycle.parkingDays,
        salaryCycle.withdrawalPercent,
        1,
        salaryCycle.accumulateRetainedSavings,
        salaryCycle.expenses,
        30
      )
    : 0;

  const monthlyInterestSavedFromFloat = effectiveMonthlySalaryFloat * (initialRate / 12 / 100);

  for (let m = 1; m <= 360; m++) {
    const annualRate = rateSchedule[m] || fallbackRatePercent;
    const prevRate = m > 1 ? (rateSchedule[m - 1] || fallbackRatePercent) : annualRate;

    if (m > 1 && Math.abs(annualRate - prevRate) > 0.001) {
      rateChangeEvents.push({ month: m, fromRate: prevRate, toRate: annualRate });
    }

    const monthlyRate = annualRate / 12 / 100;
    const { dateStr, isoDate } = addMonthsToDate(startDate, m - 1);
    const yearIndex = Math.ceil(m / 12);

    // ==========================================
    // 1. STANDARD AMORTIZATION BENCHMARK (0 Prepayment)
    // ==========================================
    let stdOpening = curPrincipalStd;
    let stdAccruedInterest = 0;
    let stdEmi = 0;
    let stdPrincipalPaid = 0;
    let stdClosing = 0;

    if (m <= totalTenureMonths && curPrincipalStd > 0.01) {
      stdAccruedInterest = stdOpening * monthlyRate;
      const remainingStdMonths = totalTenureMonths - m + 1;

      if (mode === 'FIX_EMI') {
        stdEmi = initialBenchmarkEmi;
      } else {
        stdEmi = calculateEmi(stdOpening, annualRate, remainingStdMonths);
      }

      if (stdOpening + stdAccruedInterest <= stdEmi || m === totalTenureMonths) {
        stdEmi = stdOpening + stdAccruedInterest;
        stdPrincipalPaid = stdOpening;
        stdClosing = 0;
      } else {
        stdPrincipalPaid = Math.max(0, stdEmi - stdAccruedInterest);
        stdClosing = Math.max(0, stdOpening - stdPrincipalPaid);
      }

      cumInterestStd += stdAccruedInterest;
      curPrincipalStd = stdClosing;
    } else {
      stdOpening = 0;
      stdClosing = 0;
    }

    // ==========================================
    // 2. MAX GAIN AMORTIZATION (With Monthly Surplus + Lump-Sum Txns + Salary Float)
    // ==========================================
    let mgOpening = curPrincipalMg;
    let salaryFloatOffset = 0;
    let totalParkedSurplus = 0;
    let effectivePrincipal = 0;
    let mgAccruedInterest = 0;
    let mgActiveEmi = 0;
    let mgPrincipalPaid = 0;
    let mgClosing = 0;
    let isClosureMonth = false;
    let isClosed = false;

    // Evaluate One-Time Transactions for Month m
    const monthTxs = transactionsByMonth[m] || [];
    let mOneTimeDeposit = 0;
    let mOneTimeWithdrawal = 0;
    let mOneTimeTimingFloat = 0;

    const currentYear = parseInt(isoDate.slice(0, 4), 10);
    const currentMonth = parseInt(isoDate.slice(5, 7), 10);
    const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate() || 30;

    for (const tx of monthTxs) {
      const { day: txDay } = parseYearMonthDay(tx.date);
      const remainingDays = Math.max(1, Math.min(daysInCurrentMonth, daysInCurrentMonth - txDay + 1));
      const timeWeight = remainingDays / daysInCurrentMonth;

      if (tx.type === 'DEPOSIT') {
        mOneTimeDeposit += tx.amount;
        mOneTimeTimingFloat += tx.amount * timeWeight;
      } else {
        mOneTimeWithdrawal += tx.amount;
        mOneTimeTimingFloat -= tx.amount * timeWeight;
      }
    }

    const netOneTime = mOneTimeDeposit - mOneTimeWithdrawal;

    // Monthly recurring surplus starts on or after monthlySurplusStartMonth
    const isMonthlySurplusActive = m >= monthlySurplusStartMonth;
    const baseMonthly = isMonthlySurplusActive ? baselineMonthlySurplus : 0;

    // Monthly recurring prepayment (custom ledger entry or baseline monthly surplus)
    const monthRecurringSurplus =
      customSurplusLedger[m] !== undefined
        ? customSurplusLedger[m]
        : baseMonthly;

    // Applied net surplus for this month (recurring monthly surplus + one-time net deposit/withdrawal)
    const appliedSurplus = monthRecurringSurplus + netOneTime;

    if (curPrincipalMg <= 0.01) {
      mgOpening = 0;
      salaryFloatOffset = 0;
      totalParkedSurplus = 0;
      effectivePrincipal = 0;
      mgAccruedInterest = 0;
      mgActiveEmi = 0;
      mgPrincipalPaid = 0;
      mgClosing = 0;
      isClosed = true;
    } else {
      if (salaryCycle.enabled) {
        salaryFloatOffset = calculateSalaryFloatOffset(
          salaryCycle.monthlySalary,
          salaryCycle.parkingDays,
          salaryCycle.withdrawalPercent,
          m,
          salaryCycle.accumulateRetainedSavings,
          salaryCycle.expenses,
          daysInCurrentMonth
        );
      }

      // Total effective surplus parked in OD account for interest offset
      // Precise daily time-weighted surplus in the transaction month (recurring + one-time float + salary float)
      const timingAdjustedSurplus = monthRecurringSurplus + mOneTimeTimingFloat;
      totalParkedSurplus = Math.max(0, timingAdjustedSurplus + salaryFloatOffset);

      effectivePrincipal = Math.max(0, mgOpening - totalParkedSurplus);

      // Accrued Interest = max(0, (Principal - Total Parked Surplus) * Rate/12)
      mgAccruedInterest = effectivePrincipal * monthlyRate;

      if (mode === 'FIX_EMI') {
        const targetEmi = initialBenchmarkEmi;
        const scheduledPrincipal = Math.max(0, targetEmi - mgAccruedInterest);
        const netPrincipalReduction = scheduledPrincipal + appliedSurplus;

        if (mgOpening <= netPrincipalReduction) {
          mgPrincipalPaid = mgOpening;
          mgClosing = 0;
          mgActiveEmi = Math.max(0, mgOpening + mgAccruedInterest - Math.max(0, appliedSurplus));
          isClosureMonth = true;
          isClosed = true;
          if (!closureFound) {
            closureMonth = m;
            closureFound = true;
          }
        } else {
          mgActiveEmi = targetEmi;
          mgPrincipalPaid = scheduledPrincipal;
          // Apply surplus: positive reduces principal, negative (withdrawal) draws down funds up to original loan limit
          mgClosing = Math.min(principal, Math.max(0, mgOpening - scheduledPrincipal - appliedSurplus));
          if (mgClosing <= 0.01) {
            mgClosing = 0;
            isClosureMonth = true;
            isClosed = true;
            if (!closureFound) {
              closureMonth = m;
              closureFound = true;
            }
          }
        }
      } else {
        // FIX_TENURE mode
        const remainingMonths = Math.max(1, totalTenureMonths - m + 1);
        const scheduledStdEmi = calculateEmi(mgOpening, annualRate, remainingMonths);
        const scheduledPrincipalPart = Math.max(0, scheduledStdEmi - (mgOpening * monthlyRate));
        const netPrincipalReduction = scheduledPrincipalPart + appliedSurplus;

        if (m >= totalTenureMonths || mgOpening <= netPrincipalReduction) {
          mgPrincipalPaid = mgOpening;
          mgActiveEmi = Math.max(0, mgOpening + mgAccruedInterest - Math.max(0, appliedSurplus));
          mgClosing = 0;
          isClosureMonth = true;
          isClosed = true;
          if (!closureFound) {
            closureMonth = m;
            closureFound = true;
          }
        } else {
          mgPrincipalPaid = scheduledPrincipalPart;
          mgActiveEmi = Math.max(0, mgPrincipalPaid + mgAccruedInterest);
          mgClosing = Math.min(principal, Math.max(0, mgOpening - scheduledPrincipalPart - appliedSurplus));
          if (mgClosing <= 0.01) {
            mgClosing = 0;
            isClosureMonth = true;
            isClosed = true;
            if (!closureFound) {
              closureMonth = m;
              closureFound = true;
            }
          }
        }
      }

      cumInterestMg += mgAccruedInterest;
      curPrincipalMg = mgClosing;
    }

    const monthlyInterestSaved = stdAccruedInterest - mgAccruedInterest;

    // Total outflow paid to the bank up to month m is cumulative principal repaid + cumulative interest paid.
    // Withdrawals against surplus are user's own funds and never counted as loan payments to the bank.
    const cumTotalMg = (principal - mgClosing) + cumInterestMg;
    const cumTotalStd = (principal - stdClosing) + cumInterestStd;

    rows.push({
      month: m,
      year: yearIndex,
      dateStr,
      isoDate,
      annualRate,
      monthlyRate,
      openingPrincipal: Math.round(mgOpening * 100) / 100,
      parkedSurplus: Math.round(totalParkedSurplus * 100) / 100,
      salaryFloatOffset: Math.round(salaryFloatOffset * 100) / 100,
      oneTimeDeposit: Math.round(mOneTimeDeposit * 100) / 100,
      oneTimeWithdrawal: Math.round(mOneTimeWithdrawal * 100) / 100,
      netOneTimeSurplus: Math.round(netOneTime * 100) / 100,
      monthlySurplus: Math.round(monthRecurringSurplus * 100) / 100,
      effectivePrincipal: Math.round(effectivePrincipal * 100) / 100,
      accruedInterest: Math.round(mgAccruedInterest * 100) / 100,
      standardAccruedInterest: Math.round(stdAccruedInterest * 100) / 100,
      monthlyInterestSaved: Math.round(monthlyInterestSaved * 100) / 100,
      activeEmi: Math.round(mgActiveEmi * 100) / 100,
      standardEmi: Math.round(stdEmi * 100) / 100,
      principalPaid: Math.round(mgPrincipalPaid * 100) / 100,
      prepaymentOrSurplus: Math.round(appliedSurplus * 100) / 100,
      closingPrincipal: Math.round(mgClosing * 100) / 100,
      standardClosingPrincipal: Math.round(stdClosing * 100) / 100,
      cumulativeInterestPaid: Math.round(cumInterestMg * 100) / 100,
      cumulativeStandardInterestPaid: Math.round(cumInterestStd * 100) / 100,
      cumulativeTotalPaid: Math.round(cumTotalMg * 100) / 100,
      cumulativeStandardTotalPaid: Math.round(cumTotalStd * 100) / 100,
      isClosureMonth,
      isClosed,
      transactions: monthTxs.length > 0 ? monthTxs : undefined,
    });
  }

  if (!closureFound) {
    closureMonth = totalTenureMonths;
  }

  const lifetimeInterestSaved = Math.max(0, Math.round(cumInterestStd - cumInterestMg));
  const monthsSaved = Math.max(0, totalTenureMonths - closureMonth);
  const yearsSaved = Math.floor(monthsSaved / 12);
  const monthsRemainderSaved = monthsSaved % 12;

  const interestReductionPercent =
    cumInterestStd > 0 ? Number(((lifetimeInterestSaved / cumInterestStd) * 100).toFixed(1)) : 0;

  const actualClosureDate = addMonthsToDate(startDate, closureMonth - 1).dateStr;
  const originalClosureDate = addMonthsToDate(startDate, totalTenureMonths - 1).dateStr;

  // ==========================================
  // 3. GENERATE ACTIONABLE FINANCIAL INSIGHTS & MILESTONES
  // ==========================================
  const milestones: FinancialMilestoneInsight[] = [];

  // Insight: Salary Float Cycle (if enabled)
  if (salaryCycle.enabled && salaryCycle.monthlySalary > 0) {
    const activeCycleSim = simulateMonthlySalaryCycle(
      salaryCycle.monthlySalary,
      salaryCycle.expenses,
      30,
      salaryCycle.parkingDays,
      salaryCycle.withdrawalPercent
    );
    const activeDropCount = (salaryCycle.expenses || []).filter((e) => (Number(e.value) || 0) > 0).length;
    const insightDescription =
      activeDropCount > 0
        ? `Parking ${formatCurrency(salaryCycle.monthlySalary, currencyCode)} on Day 1 across ${activeDropCount} staggered expense outflow(s) (${activeCycleSim.totalExpensesPercent.toFixed(1)}% total monthly deduction) maintains an effective time-weighted average float of ${formatCurrency(effectiveMonthlySalaryFloat, currencyCode)} every month. This automatically saves ~${formatCurrency(monthlyInterestSavedFromFloat, currencyCode)} in interest each month!`
        : `Parking ${formatCurrency(salaryCycle.monthlySalary, currencyCode)} on Day 1 with 0 custom expense outflows maintains an effective average float of ${formatCurrency(effectiveMonthlySalaryFloat, currencyCode)} every month. This automatically saves ~${formatCurrency(monthlyInterestSavedFromFloat, currencyCode)} in interest each month!`;

    milestones.push({
      id: 'salary-float-active',
      type: 'SALARY_CYCLE',
      month: 1,
      dateStr: addMonthsToDate(startDate, 0).dateStr,
      title: `Smart Salary Float Active: ${formatCurrency(effectiveMonthlySalaryFloat, currencyCode)}/mo Average Offset`,
      description: insightDescription,
      badgeText: activeDropCount > 0 ? `${activeDropCount}-Drop Float Active` : `Smart Float Active`,
      badgeColor: 'emerald',
    });
  }

  // Insight: One-Time Deposits and Withdrawals
  for (const tx of oneTimeTransactions) {
    if (!tx.amount || tx.amount <= 0 || !tx.date) continue;
    const txMonth = Math.max(1, Math.min(360, getMonthIndexFromDate(startDate, tx.date)));
    if (txMonth > closureMonth) continue;
    const isDeposit = tx.type === 'DEPOSIT';
    const txRow = rows[txMonth - 1];

    milestones.push({
      id: `one-time-${tx.id}`,
      type: 'SURPLUS_IMPACT',
      month: txMonth,
      dateStr: tx.date,
      title: isDeposit
        ? `One-Time Deposit: +${formatCurrency(tx.amount, currencyCode)}${tx.label ? ` (${tx.label})` : ''}`
        : `One-Time Withdrawal: -${formatCurrency(tx.amount, currencyCode)}${tx.label ? ` (${tx.label})` : ''}`,
      description: isDeposit
        ? `Lump-sum deposit of ${formatCurrency(tx.amount, currencyCode)} parked on ${tx.date} (Month ${txMonth}). Slashes active principal to ${formatCurrency(txRow?.closingPrincipal || 0, currencyCode)} and accelerates interest-free debt freedom.`
        : `Lump-sum withdrawal of ${formatCurrency(tx.amount, currencyCode)} taken on ${tx.date} (Month ${txMonth}) from overdraft facility. Active loan balance shifts to ${formatCurrency(txRow?.closingPrincipal || 0, currencyCode)}.`,
      badgeText: isDeposit ? `+${formatCurrency(tx.amount, currencyCode, true)} Deposit` : `-${formatCurrency(tx.amount, currencyCode, true)} Withdrawal`,
      badgeColor: isDeposit ? 'emerald' : 'rose',
    });
  }

  // Insight 1: Tenure Reduction / Closure Insight
  if (monthsSaved > 0) {
    milestones.push({
      id: 'tenure-reduced',
      type: 'TENURE_CHANGE',
      month: closureMonth,
      dateStr: actualClosureDate,
      title: `Loan Tenure Reduced by ${formatDurationSaved(monthsSaved)}`,
      description: `Thanks to your Max Gain parked surplus & prepayments, your loan closure moves earlier from ${originalClosureDate} to ${actualClosureDate}. You save ${monthsSaved} full monthly installments.`,
      badgeText: `Saved ${formatDurationSaved(monthsSaved)}`,
      badgeColor: 'emerald',
    });
  } else {
    milestones.push({
      id: 'tenure-standard',
      type: 'TENURE_CHANGE',
      month: totalTenureMonths,
      dateStr: originalClosureDate,
      title: `Standard Amortization Timeline (${tenureYears} Years)`,
      description: `Loan will close on ${originalClosureDate} (Month ${totalTenureMonths}). Park surplus funds into your Max Gain account to cut months off your term.`,
      badgeText: 'Standard Term',
      badgeColor: 'blue',
    });
  }

  // Insight 2: Initial EMI Baseline
  const startDateStr = addMonthsToDate(startDate, 0).dateStr;
  milestones.push({
    id: 'initial-emi',
    type: 'EMI_CHANGE',
    month: 1,
    dateStr: startDateStr,
    title: `Initial Benchmark EMI: ${formatCurrency(initialBenchmarkEmi, currencyCode)}/mo`,
    description: `Loan starts on ${startDateStr} at ${formatPercentage(initialRate)} annual interest rate. Base scheduled EMI is ${formatCurrency(initialBenchmarkEmi, currencyCode)}.`,
    badgeText: 'Loan Inception',
    badgeColor: 'indigo',
  });

  // Insight 3: Rate Transition & EMI Change Milestones
  for (const rc of rateChangeEvents) {
    if (rc.month > closureMonth) break;
    const changeDate = addMonthsToDate(startDate, rc.month - 1).dateStr;
    const rowAtMonth = rows[rc.month - 1];
    const diff = rc.toRate - rc.fromRate;
    const direction = diff > 0 ? 'increased' : 'reduced';

    milestones.push({
      id: `rate-change-${rc.month}`,
      type: 'RATE_SHIFT',
      month: rc.month,
      dateStr: changeDate,
      title: `Interest Rate Changed to ${formatPercentage(rc.toRate)} from ${changeDate}`,
      description: `Effective from Month ${rc.month} (${changeDate}), interest rate is ${direction} by ${Math.abs(diff).toFixed(2)}% (from ${formatPercentage(rc.fromRate)} to ${formatPercentage(rc.toRate)}). Active EMI this month is ${formatCurrency(rowAtMonth?.activeEmi || 0, currencyCode)}.`,
      badgeText: `${diff > 0 ? '+' : ''}${diff.toFixed(2)}% Rate Shift`,
      badgeColor: diff > 0 ? 'rose' : 'emerald',
    });
  }

  // Insight 4: Final Closure Payoff Event
  if (closureFound) {
    const finalRow = rows[closureMonth - 1];
    milestones.push({
      id: 'closure-payoff',
      type: 'CLOSURE_EVENT',
      month: closureMonth,
      dateStr: actualClosureDate,
      title: `Debt Freedom Day: ${actualClosureDate}`,
      description: `Final payout of ${formatCurrency(finalRow?.activeEmi || 0, currencyCode)} completely clears the remaining principal. Outstanding balance reaches zero.`,
      badgeText: '🎉 100% Paid Off',
      badgeColor: 'emerald',
    });
  }

  const summary: SimulationSummary = {
    totalPrincipal: Math.round(principal),
    totalInterestPaid: Math.round(cumInterestMg),
    standardTotalInterestPaid: Math.round(cumInterestStd),
    lifetimeInterestSaved,
    totalAmountPaid: Math.round(principal + cumInterestMg),
    standardTotalAmountPaid: Math.round(principal + cumInterestStd),
    actualClosureMonth: closureMonth,
    actualClosureDate,
    originalTenureMonths: totalTenureMonths,
    originalClosureDate,
    monthsSaved,
    yearsSaved,
    monthsRemainderSaved,
    initialBenchmarkEmi: Math.round(initialBenchmarkEmi),
    interestReductionPercent,
    effectiveMonthlySalaryFloat: Math.round(effectiveMonthlySalaryFloat),
    monthlyInterestSavedFromFloat: Math.round(monthlyInterestSavedFromFloat),
    totalOneTimeDeposited: Math.round(totalOneTimeDeposited),
    totalOneTimeWithdrawn: Math.round(totalOneTimeWithdrawn),
    netOneTimeSurplus: Math.round(netOneTimeSurplus),
    milestones,
  };

  return { rows, summary };
}
