import type { MonthlyAmortizationRow, SimulationInputs, SimulationSummary } from '../types/loan';

declare global {
  interface Window {
    AndroidNativeBridge?: {
      isNative?: () => boolean;
      saveAndShareCsv?: (filename: string, content: string) => boolean;
    };
  }
}

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

export interface CsvPackage {
  filename: string;
  csvContent: string;
  dataUri: string;
  blobUrl: string;
  isNativeAndroid: boolean;
  canWebShare: boolean;
}

/**
 * Pre-generate full CSV package with ready data URI and blob URL for direct tapping
 */
export function prepareCsvPackage(
  rows: MonthlyAmortizationRow[],
  inputs: SimulationInputs,
  summary: SimulationSummary
): CsvPackage {
  const csvContent = generateSimulationCsv(rows, inputs, summary);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `maxgain_simulation_${inputs.currencyCode}_${timestamp}.csv`;

  const isNativeAndroid =
    typeof window !== 'undefined' &&
    Boolean(window.AndroidNativeBridge && typeof window.AndroidNativeBridge.saveAndShareCsv === 'function');

  let blobUrl = '';
  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    blobUrl = URL.createObjectURL(blob);
  } catch {
    // safe fallback
  }

  const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);

  const canWebShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function';

  return {
    filename,
    csvContent,
    dataUri,
    blobUrl,
    isNativeAndroid,
    canWebShare,
  };
}

/**
 * Universal CSV Exporter supporting:
 * 1. Android APK native bridge (Direct save to Downloads + Android Share Sheet)
 * 2. Web Share API with File (iOS Safari "Save to Files", Android Chrome Share Sheet)
 * 3. Direct Blob URL download (Desktop / Laptop browsers)
 * 4. Data URI fallback
 */
export async function exportSimulationToCsv(
  rows: MonthlyAmortizationRow[],
  inputs: SimulationInputs,
  summary: SimulationSummary
): Promise<{ success: boolean; method: string; filename: string }> {
  const csvContent = generateSimulationCsv(rows, inputs, summary);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `maxgain_simulation_${inputs.currencyCode}_${timestamp}.csv`;

  // 1. Android Native Bridge (Inside the Android APK)
  if (
    typeof window !== 'undefined' &&
    window.AndroidNativeBridge &&
    typeof window.AndroidNativeBridge.saveAndShareCsv === 'function'
  ) {
    try {
      const ok = window.AndroidNativeBridge.saveAndShareCsv(filename, csvContent);
      if (ok) {
        return { success: true, method: 'android-native', filename };
      }
    } catch (err) {
      console.warn('Android native bridge call failed, falling back', err);
    }
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // 2. Web Share API with File (Mobile Safari, Mobile Chrome)
  if (isMobile && typeof navigator.canShare === 'function' && typeof File !== 'undefined') {
    let fileToShare: File | null = null;
    try {
      // Try text/csv first (standard for iOS Safari)
      const csvFile = new File([blob], filename, { type: 'text/csv' });
      if (navigator.canShare({ files: [csvFile] })) {
        fileToShare = csvFile;
      } else {
        // Try text/plain (required by Android Chromium's strict share whitelist)
        const textFile = new File([blob], filename, { type: 'text/plain' });
        if (navigator.canShare({ files: [textFile] })) {
          fileToShare = textFile;
        }
      }
    } catch (e) {
      console.warn('canShare check encountered an issue', e);
    }

    if (fileToShare) {
      try {
        await navigator.share({
          title: 'MaxGain Home Loan Simulation CSV',
          text: `Max Gain Simulation Schedule (${inputs.currencyCode})`,
          files: [fileToShare],
        });
        return { success: true, method: 'web-share', filename };
      } catch (err: unknown) {
        // AbortError is thrown when user closes/dismisses the share sheet
        if (err instanceof Error && err.name === 'AbortError') {
          return { success: true, method: 'share-dismissed', filename };
        }
        console.warn('Web Share failed, proceeding to Blob download', err);
      }
    }
  }

  // 3. Direct Blob URL download (Desktop & standard web browsers)
  try {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    link.target = '_blank';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 2500);

    return { success: true, method: 'blob-download', filename };
  } catch (err) {
    console.warn('Blob download failed, trying data URI fallback', err);
  }

  // 4. Fallback Data URI
  try {
    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, method: 'data-uri', filename };
  } catch (err) {
    console.error('All CSV export methods failed', err);
    return { success: false, method: 'failed', filename };
  }
}
