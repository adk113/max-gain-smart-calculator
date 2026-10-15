import React, { useState } from 'react';
import { Download, Share2, Copy, Check, X, FileSpreadsheet } from 'lucide-react';
import { exportSimulationToCsv, generateSimulationCsv } from '../../engine/csvExporter';
import type { MonthlyAmortizationRow, SimulationInputs, SimulationSummary } from '../../types/loan';
import { formatCurrency } from '../../utils/formatters';

interface ExportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: MonthlyAmortizationRow[];
  inputs: SimulationInputs;
  summary: SimulationSummary;
}

export const ExportCsvModal: React.FC<ExportCsvModalProps> = ({
  isOpen,
  onClose,
  rows,
  inputs,
  summary,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const result = await exportSimulationToCsv(rows, inputs, summary);
      if (result.success) {
        setStatusMessage(
          result.method === 'web-share' || result.method === 'capacitor-native'
            ? '✅ File shared / ready to save!'
            : '✅ Download started successfully!'
        );
      }
    } catch {
      setStatusMessage('❌ Export failed. You can copy the CSV text directly below.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      const csv = generateSimulationCsv(rows, inputs, summary);
      await navigator.clipboard.writeText(csv);
      setCopied(true);
      setStatusMessage('✅ CSV text copied to clipboard! Paste directly into Excel or Google Sheets.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setStatusMessage('⚠️ Could not copy directly. Please use the download option.');
    }
  };

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 text-white space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Export Simulation to CSV</h3>
              <p className="text-xs text-slate-400">Complete 360-month amortization ledger</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Summary Pill */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Loan Amount</span>
            <span className="text-slate-200 font-bold">{formatCurrency(inputs.principal, inputs.currencyCode)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Interest Saved</span>
            <span className="text-emerald-400 font-bold">{formatCurrency(summary.lifetimeInterestSaved, inputs.currencyCode)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Schedule Rows</span>
            <span className="text-indigo-300 font-bold">{rows.length} Months (30 Yrs)</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Closure Month</span>
            <span className="text-amber-300 font-bold">Month #{summary.actualClosureMonth}</span>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-medium text-slate-200 animate-in fade-in">
            {statusMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Main Download / Share Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            {isMobile ? (
              <>
                <Share2 className="w-4 h-4" />
                <span>{isExporting ? 'Preparing File...' : 'Download / Save to Files (Mobile)'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating...' : 'Download CSV File'}</span>
              </>
            )}
          </button>

          {/* Copy CSV to Clipboard (Guaranteed mobile workaround) */}
          <button
            type="button"
            onClick={handleCopyClipboard}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">CSV Copied! Ready to Paste</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy CSV Text (for Sheets / Excel)</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile Guidance Tip */}
        <p className="text-[11px] text-slate-500 leading-relaxed text-center">
          💡 <strong>Mobile tip:</strong> On iPhone, selecting <em>Save to Files</em> stores the CSV directly in your Files app or iCloud Drive. On Android, it saves to your Downloads folder.
        </p>
      </div>
    </div>
  );
};
