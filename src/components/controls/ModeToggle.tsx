import React from 'react';
import type { LoanMode } from '../../types/loan';
import { Zap, Clock } from 'lucide-react';

interface ModeToggleProps {
  mode: LoanMode;
  onChange: (mode: LoanMode) => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="glass-card rounded-2xl p-3 sm:p-4 shadow-lg border border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Tenure vs. EMI Strategy
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Global Mode
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => onChange('FIX_EMI')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            mode === 'FIX_EMI'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4 shrink-0" />
          <span>Fix EMI (Fast Payoff)</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('FIX_TENURE')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
            mode === 'FIX_TENURE'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Fix Tenure (Low EMI)</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
        {mode === 'FIX_EMI' ? (
          <>
            <strong className="text-emerald-400">Fix EMI Mode:</strong> Regular EMI remains constant.
            Surplus interest savings accelerate principal liquidation, dramatically shrinking your tenure.
          </>
        ) : (
          <>
            <strong className="text-indigo-400">Fix Tenure Mode:</strong> Total loan duration remains locked.
            Surplus reduces required monthly EMI, maximizing immediate disposable cashflow.
          </>
        )}
      </p>
    </div>
  );
};
