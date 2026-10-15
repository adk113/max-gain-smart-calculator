import React, { useState } from 'react';
import { CurrencySelector } from '../controls/CurrencySelector';
import { Share2, Download, Check, Shield, Smartphone, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currencyCode: string;
  onSelectCurrency: (code: string) => void;
  onCopyShareLink: () => Promise<boolean>;
  onExportCsv: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currencyCode,
  onSelectCurrency,
  onCopyShareLink,
  onExportCsv,
  theme,
  onToggleTheme,
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
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 shadow-xl safe-top-header">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-0 min-h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-lg font-extrabold text-white tracking-tight leading-tight">
                MaxGain <span className="text-emerald-400">Simulator</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                v1.0 • OD Loan
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Home Loan Advantage Overdraft & Multi-Tier Lock-In Amortizer
            </p>
          </div>
        </div>

        {/* Action Controls - Positioned below mobile status bar / punch hole */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 transition-all active:scale-95 shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Currency Picker (Defaults to INR) */}
          <CurrencySelector selectedCode={currencyCode} onSelect={onSelectCurrency} />

          {/* Shareable Link Button */}
          <button
            type="button"
            onClick={handleShareClick}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-emerald-500/30'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200'
            }`}
            title="Copy shareable link with full simulation parameters"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer"
            title="Download full 360-month dataset to CSV"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span className="text-xs font-bold">CSV</span>
          </button>

          {/* Get App / APK link */}
          <a
            href="/share"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 hover:from-emerald-500/30 hover:to-indigo-500/30 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold transition-all active:scale-95"
            title="Open Mobile App & APK Download Hub"
          >
            <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span className="hidden lg:inline">Get App</span>
          </a>
        </div>
      </div>
    </header>
  );
};
