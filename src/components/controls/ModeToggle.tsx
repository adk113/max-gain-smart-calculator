import React from 'react';
import type { LoanMode } from '../../types/loan';
import { Zap, Clock } from 'lucide-react';

interface ModeToggleProps {
  mode: LoanMode;
  onChange: (mode: LoanMode) => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 flex flex-col justify-between space-y-3 h-full">
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          Tenure vs. EMI Mode
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Strategy
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => onChange('FIX_EMI')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mode === 'FIX_EMI'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span>Fix EMI</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('FIX_TENURE')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            mode === 'FIX_TENURE'
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25 font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Fix Tenure</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        {mode === 'FIX_EMI' ? (
          <>
            <strong className="text-emerald-400">Fix EMI:</strong> Constant EMI. Prepayments & surplus cut tenure off the loan.
          </>
        ) : (
          <>
            <strong className="text-indigo-400">Fix Tenure:</strong> Locked duration. Surplus lowers monthly EMI for cashflow relief.
          </>
        )}
      </p>
    </div>
  );
};
