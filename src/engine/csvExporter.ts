import type { MonthlyAmortizationRow, SimulationInputs, SimulationSummary } from '../types/loan';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Generate CSV string from simulation data
 */
export function generateSimulationCsv(
  rows: MonthlyAmortizationRow[],
  inputs: SimulationInputs,
  summary: SimulationSummary
): string {
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

  return csvRows.join('\n');
}

/**
 * Universal CSV Exporter supporting Mobile (iOS Safari, Android Chrome, Capacitor) & Desktop.
 * 1. If in Capacitor Native App: uses native Filesystem & Share sheets.
 * 2. If in Mobile Safari/Chrome: uses Web Share API (navigator.share) with File object (allows 'Save to Files', AirDrop, Drive, etc.).
 * 3. Fallback: Blob URL download with cleanup.
 */
export async function exportSimulationToCsv(
  rows: MonthlyAmortizationRow[],
  inputs: SimulationInputs,
  summary: SimulationSummary
): Promise<{ success: boolean; method: string; filename: string }> {
  const csvContent = generateSimulationCsv(rows, inputs, summary);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `maxgain_simulation_${inputs.currencyCode}_${timestamp}.csv`;

  // 1. Native Capacitor Environment (Android APK / iOS App)
  if (Capacitor.isNativePlatform()) {
    try {
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title: 'MaxGain Home Loan Simulation CSV',
        text: `MaxGain Simulation Report (${inputs.currencyCode})`,
        url: savedFile.uri,
        dialogTitle: 'Save or Share Simulation CSV',
      });

      return { success: true, method: 'capacitor-native', filename };
    } catch (err) {
      console.warn('Capacitor native share failed, falling back to Web Share / Blob download', err);
    }
  }

  // 2. Mobile Web Share API (iOS Safari 15+, Android Chrome)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile && typeof navigator.canShare === 'function' && typeof File !== 'undefined') {
    try {
      const file = new File([blob], filename, { type: 'text/csv' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'MaxGain Home Loan Simulation CSV',
          text: `Max Gain Simulation Schedule (${inputs.currencyCode})`,
          files: [file],
        });
        return { success: true, method: 'web-share', filename };
      }
    } catch (err: unknown) {
      // AbortError is thrown when user cancels the share sheet
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: true, method: 'share-dismissed', filename };
      }
      console.warn('Web Share failed, proceeding to Blob download', err);
    }
  }

  // 3. Direct Blob URL download (Desktop & standard web browsers)
  try {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 2000);

    return { success: true, method: 'blob-download', filename };
  } catch (err) {
    console.error('Blob download failed', err);
    return { success: false, method: 'failed', filename };
  }
}
