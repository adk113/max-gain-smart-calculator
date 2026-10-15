import React, { useState } from 'react';
import { CurrencySelector } from '../controls/CurrencySelector';
import { Share2, Download, Check, Shield } from 'lucide-react';

interface HeaderProps {
  currencyCode: string;
  onSelectCurrency: (code: string) => void;
  onCopyShareLink: () => Promise<boolean>;
  onExportCsv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currencyCode,
  onSelectCurrency,
  onCopyShareLink,
  onExportCsv,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShareClick = async () => {
    const success = await onCopyShareLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                MaxGain <span className="text-emerald-400">Simulator</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                v1.0 • OD Loan
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Home Loan Advantage Overdraft & Multi-Tier Lock-In Amortizer
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Picker (Defaults to INR) */}
          <CurrencySelector selectedCode={currencyCode} onSelect={onSelectCurrency} />

          {/* Shareable Link Button */}
          <button
            type="button"
            onClick={handleShareClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-emerald-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200'
            }`}
            title="Copy shareable link with full simulation parameters"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span className="hidden sm:inline">Copied Link!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Share Simulation</span>
              </>
            )}
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold transition-all active:scale-95"
            title="Download full 360-month dataset to CSV"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Download CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
