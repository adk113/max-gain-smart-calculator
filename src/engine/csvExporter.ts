import type { MonthlyAmortizationRow, SimulationInputs, SimulationSummary } from '../types/loan';

export function exportSimulationToCsv(
  rows: MonthlyAmortizationRow[],
  inputs: SimulationInputs,
  summary: SimulationSummary
): void {
  const headers = [
    'Month',
    'Year',
    'Date',
    'Interest Rate (%)',
    'Opening Principal',
    'Monthly Surplus Base',
    'One-Time Deposit',
    'One-Time Withdrawal',
    'Net Prepayment/Surplus',
    'Parked Surplus (Offset)',
    'Effective Principal (Interest Base)',
    'Accrued Interest',
    'Standard Loan Accrued Interest',
    'Monthly Interest Saved',
    'Active EMI Paid',
    'Standard Loan EMI',
    'Principal Paid',
    'Closing Principal Balance',
    'Standard Loan Closing Principal',
    'Cumulative Interest Paid',
    'Cumulative Standard Interest',
    'Cumulative Total Paid',
    'Cumulative Standard Total Paid',
    'Loan Closure Status',
  ];

  const csvRows: string[] = [];

  // Header metadata block
  csvRows.push(`# Max Gain / Home Loan Advantage Simulation Report`);
  csvRows.push(`# Loan Amount,${inputs.principal},Currency,${inputs.currencyCode}`);
  csvRows.push(`# Tenure Years,${inputs.tenureYears},Mode,${inputs.mode}`);
  csvRows.push(`# Initial Benchmark EMI,${summary.initialBenchmarkEmi}`);
  csvRows.push(`# Lifetime Interest Saved,${summary.lifetimeInterestSaved}`);
  csvRows.push(`# Total One-Time Deposited,${summary.totalOneTimeDeposited},Total One-Time Withdrawn,${summary.totalOneTimeWithdrawn}`);
  csvRows.push(`# Loan Closed in Month,${summary.actualClosureMonth} of ${summary.originalTenureMonths} (Saved ${summary.monthsSaved} months)`);
  csvRows.push(``);
  csvRows.push(headers.join(','));

  for (const r of rows) {
    const status = r.isClosureMonth
      ? 'LOAN_CLOSED_THIS_MONTH'
      : r.isClosed
      ? 'CLOSED'
      : 'ACTIVE';

    const row = [
      r.month,
      r.year,
      `"${r.dateStr}"`,
      r.annualRate.toFixed(2),
      r.openingPrincipal,
      r.monthlySurplus,
      r.oneTimeDeposit,
      r.oneTimeWithdrawal,
      r.prepaymentOrSurplus,
      r.parkedSurplus,
      r.effectivePrincipal,
      r.accruedInterest,
      r.standardAccruedInterest,
      r.monthlyInterestSaved,
      r.activeEmi,
      r.standardEmi,
      r.principalPaid,
      r.closingPrincipal,
      r.standardClosingPrincipal,
      r.cumulativeInterestPaid,
      r.cumulativeStandardInterestPaid,
      r.cumulativeTotalPaid,
      r.cumulativeStandardTotalPaid,
      status,
    ];

    csvRows.push(row.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `maxgain_simulation_${inputs.currencyCode}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
