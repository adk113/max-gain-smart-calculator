import React, { useState, useMemo } from 'react';
import { Download, Share2, Copy, Check, X, FileSpreadsheet, ExternalLink, HardDrive } from 'lucide-react';
import { exportSimulationToCsv, prepareCsvPackage } from '../../engine/csvExporter';
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

  // Pre-generate CSV package with ready dataUri and blobUrl upfront
  const csvPackage = useMemo(() => {
    if (!isOpen) return null;
    return prepareCsvPackage(rows, inputs, summary);
  }, [isOpen, rows, inputs, summary]);

  if (!isOpen || !csvPackage) return null;

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const isNative = csvPackage.isNativeAndroid;

  const handlePrimaryExport = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const result = await exportSimulationToCsv(rows, inputs, summary);
      if (result.success) {
        if (result.method === 'android-native') {
          setStatusMessage('✅ Saved to Downloads and opened system Share Sheet!');
        } else if (result.method === 'web-share') {
          setStatusMessage('✅ Opened Share Sheet! Select "Save to Files" or your preferred app.');
        } else if (result.method === 'share-dismissed') {
          setStatusMessage('ℹ️ Share sheet closed. You can also tap "Direct Download" below.');
        } else {
          setStatusMessage('✅ Download started! Check your notification bar or Downloads folder.');
        }
      } else {
        setStatusMessage('⚠️ Could not trigger system download. Tap "Direct Download" or "Copy CSV Text" below.');
      }
    } catch {
      setStatusMessage('⚠️ Export encountered an issue. Please use the "Direct Download" or "Copy CSV" option.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(csvPackage.csvContent);
      setCopied(true);
      setStatusMessage('✅ CSV text copied to clipboard! Paste directly into Excel, Google Sheets, or Numbers.');
      setTimeout(() => setCopied(false), 3500);
    } catch {
      setStatusMessage('⚠️ Could not copy directly. Please use the download buttons.');
    }
  };

  const handleOpenInNewTab = () => {
    try {
      const tab = window.open();
      if (tab) {
        tab.document.write(
          `<pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px; padding: 16px; background: #0f172a; color: #f8fafc;">${csvPackage.csvContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
        );
        tab.document.title = csvPackage.filename;
        tab.document.close();
        setStatusMessage('✅ CSV opened in a new tab! Use your browser menu to Save or Share.');
      } else {
        window.open(csvPackage.dataUri, '_blank');
      }
    } catch {
      window.open(csvPackage.dataUri, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 sm:p-6 text-white space-y-4 max-h-[92vh] overflow-y-auto">
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

        {/* Status Message Notification */}
        {statusMessage && (
          <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-medium text-slate-200 animate-in fade-in leading-relaxed">
            {statusMessage}
          </div>
        )}

        {/* Action Buttons Stack */}
        <div className="space-y-2.5 pt-1">
          {/* 1. Primary Action Button (Smart Android Bridge or Web Share) */}
          <button
            type="button"
            onClick={handlePrimaryExport}
            disabled={isExporting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            {isNative ? (
              <>
                <HardDrive className="w-4 h-4" />
                <span>{isExporting ? 'Saving to Downloads...' : 'Save to Downloads & Share (Android)'}</span>
              </>
            ) : isMobile ? (
              <>
                <Share2 className="w-4 h-4" />
                <span>{isExporting ? 'Opening Share...' : 'Save to Files / Share Sheet'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating...' : 'Download CSV File'}</span>
              </>
            )}
          </button>

          {/* 2. Direct Browser Download Link (Authentic user gesture tap for iOS Safari & Android Chrome) */}
          <a
            href={csvPackage.blobUrl || csvPackage.dataUri}
            download={csvPackage.filename}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              setStatusMessage('✅ Direct download link clicked! Check your device Downloads folder.');
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 text-center"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Direct Download (Tap to Save File)</span>
          </a>

          {/* 3. Open Raw CSV in New Tab (Zero-failure viewer / manual save) */}
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="w-full py-2 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/70 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>View / Open CSV in Browser</span>
          </button>

          {/* 4. Copy CSV to Clipboard (Guaranteed mobile workaround) */}
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

        {/* Guidance Tip */}
        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 leading-relaxed space-y-1">
          <p>
            💡 <strong>Android App:</strong> Tapping <em>Save to Downloads</em> stores the file in your device's <code>/Download</code> folder and opens the system Share Sheet.
          </p>
          <p>
            💡 <strong>Mobile Safari / Chrome:</strong> Tapping <em>Direct Download</em> prompts you to save the <code>.csv</code> file directly into your Files app.
          </p>
        </div>
      </div>
    </div>
  );
};
