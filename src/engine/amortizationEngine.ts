import type {
  MonthlyAmortizationRow,
  SimulationInputs,
  SimulationSummary,
  FinancialMilestoneInsight,
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

/**
 * Calculates the time-weighted daily average balance for the salary parking cycle
 */
export function calculateSalaryFloatOffset(
  salary: number,
  parkingDays: number,
  withdrawalPercent: number,
  monthIndex: number,
  accumulate: boolean
): number {
  if (salary <= 0) return 0;
  const safeDays = Math.min(29, Math.max(1, parkingDays));
  const safeWithdrawalPct = Math.min(100, Math.max(0, withdrawalPercent));
  const retainedFraction = (100 - safeWithdrawalPct) / 100;
  const retainedPerMonth = salary * retainedFraction;

  // Base monthly float: Days 1..D at 100% salary, Days (D+1)..30 at retained salary
  const baseMonthlyFloat = (salary * safeDays + retainedPerMonth * (30 - safeDays)) / 30;

  if (accumulate && monthIndex > 1) {
    const priorAccumulated = (monthIndex - 1) * retainedPerMonth;
    return baseMonthlyFloat + priorAccumulated;
  }

  return baseMonthlyFloat;
}

/**
 * Runs the complete 360-month Max Gain & Standard Amortization simulation
 * incorporating Multi-Tier rates, Overdraft daily salary float, and What-if prepayments.
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
    customSurplusLedger = {},
    salaryCycle = {
      enabled: false,
      monthlySalary: 150000,
      parkingDays: 10,
      withdrawalPercent: 60,
      accumulateRetainedSavings: false,
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
  let cumTotalMg = 0;
  let cumTotalStd = 0;

  let closureMonth = totalTenureMonths;
  let closureFound = false;

  const rows: MonthlyAmortizationRow[] = [];
  const rateChangeEvents: { month: number; fromRate: number; toRate: number }[] = [];

  // Month 1 base salary float for summary
  const effectiveMonthlySalaryFloat = salaryCycle.enabled
    ? calculateSalaryFloatOffset(
        salaryCycle.monthlySalary,
        salaryCycle.parkingDays,
        salaryCycle.withdrawalPercent,
        1,
        salaryCycle.accumulateRetainedSavings
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
      cumTotalStd += stdEmi;
      curPrincipalStd = stdClosing;
    } else {
      stdOpening = 0;
      stdClosing = 0;
    }

    // ==========================================
    // 2. MAX GAIN AMORTIZATION (With Salary Float + Surplus)
    // ==========================================
    let mgOpening = curPrincipalMg;
    let manualSurplus = 0;
    let salaryFloatOffset = 0;
    let totalParkedSurplus = 0;
    let effectivePrincipal = 0;
    let mgAccruedInterest = 0;
    let mgActiveEmi = 0;
    let mgPrincipalPaid = 0;
    let mgClosing = 0;
    let isClosureMonth = false;
    let isClosed = false;

    if (curPrincipalMg <= 0.01) {
      mgOpening = 0;
      manualSurplus = 0;
      salaryFloatOffset = 0;
      totalParkedSurplus = 0;
      effectivePrincipal = 0;
      mgAccruedInterest = 0;
      mgActiveEmi = 0;
      mgPrincipalPaid = 0;
      mgClosing = 0;
      isClosed = true;
    } else {
      manualSurplus =
        customSurplusLedger[m] !== undefined
          ? customSurplusLedger[m]
          : baselineMonthlySurplus;

      if (salaryCycle.enabled) {
        salaryFloatOffset = calculateSalaryFloatOffset(
          salaryCycle.monthlySalary,
          salaryCycle.parkingDays,
          salaryCycle.withdrawalPercent,
          m,
          salaryCycle.accumulateRetainedSavings
        );
      }

      // Total effective surplus parked in OD account
      totalParkedSurplus = Math.max(0, manualSurplus + salaryFloatOffset);
      effectivePrincipal = Math.max(0, mgOpening - totalParkedSurplus);

      // Accrued Interest = max(0, (Principal - Total Parked Surplus) * Rate/12)
      mgAccruedInterest = effectivePrincipal * monthlyRate;

      if (mode === 'FIX_EMI') {
        const targetEmi = initialBenchmarkEmi;
        const scheduledPrincipal = Math.max(0, targetEmi - mgAccruedInterest);
        const netPrincipalReduction = scheduledPrincipal + manualSurplus;

        if (mgOpening <= netPrincipalReduction) {
          mgPrincipalPaid = mgOpening;
          mgClosing = 0;
          mgActiveEmi = Math.max(0, mgOpening + mgAccruedInterest - Math.max(0, manualSurplus));
          isClosureMonth = true;
          isClosed = true;
          if (!closureFound) {
            closureMonth = m;
            closureFound = true;
          }
        } else {
          mgActiveEmi = targetEmi;
          mgPrincipalPaid = scheduledPrincipal;
          mgClosing = Math.max(0, mgOpening - scheduledPrincipal - manualSurplus);
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
        const netPrincipalReduction = scheduledPrincipalPart + manualSurplus;

        if (m >= totalTenureMonths || mgOpening <= netPrincipalReduction) {
          mgPrincipalPaid = mgOpening;
          mgActiveEmi = Math.max(0, mgOpening + mgAccruedInterest - Math.max(0, manualSurplus));
          mgClosing = 0;
          isClosureMonth = true;
          isClosed = true;
          if (!closureFound) {
            closureMonth = m;
            closureFound = true;
          }
        } else {
          mgPrincipalPaid = scheduledPrincipalPart;
          mgActiveEmi = mgPrincipalPaid + mgAccruedInterest;
          mgClosing = Math.max(0, mgOpening - scheduledPrincipalPart - manualSurplus);
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
      cumTotalMg += mgActiveEmi + Math.max(0, manualSurplus);
      curPrincipalMg = mgClosing;
    }

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
      effectivePrincipal: Math.round(effectivePrincipal * 100) / 100,
      accruedInterest: Math.round(mgAccruedInterest * 100) / 100,
      standardAccruedInterest: Math.round(stdAccruedInterest * 100) / 100,
      activeEmi: Math.round(mgActiveEmi * 100) / 100,
      standardEmi: Math.round(stdEmi * 100) / 100,
      principalPaid: Math.round(mgPrincipalPaid * 100) / 100,
      prepaymentOrSurplus: Math.round(manualSurplus * 100) / 100,
      closingPrincipal: Math.round(mgClosing * 100) / 100,
      standardClosingPrincipal: Math.round(stdClosing * 100) / 100,
      cumulativeInterestPaid: Math.round(cumInterestMg * 100) / 100,
      cumulativeStandardInterestPaid: Math.round(cumInterestStd * 100) / 100,
      cumulativeTotalPaid: Math.round(cumTotalMg * 100) / 100,
      cumulativeStandardTotalPaid: Math.round(cumTotalStd * 100) / 100,
      isClosureMonth,
      isClosed,
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
    milestones.push({
      id: 'salary-float-active',
      type: 'SALARY_CYCLE',
      month: 1,
      dateStr: addMonthsToDate(startDate, 0).dateStr,
      title: `Smart Salary Float Active: ${formatCurrency(effectiveMonthlySalaryFloat, currencyCode)}/mo Average Offset`,
      description: `Parking ${formatCurrency(salaryCycle.monthlySalary, currencyCode)} on the 1st for ${salaryCycle.parkingDays} days before withdrawing ${salaryCycle.withdrawalPercent}% maintains an effective average float of ${formatCurrency(effectiveMonthlySalaryFloat, currencyCode)} every month. This automatically saves ~${formatCurrency(monthlyInterestSavedFromFloat, currencyCode)} in interest each month!`,
      badgeText: `Smart Float Active`,
      badgeColor: 'emerald',
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
    totalAmountPaid: Math.round(cumTotalMg),
    standardTotalAmountPaid: Math.round(cumTotalStd),
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
    milestones,
  };

  return { rows, summary };
}
