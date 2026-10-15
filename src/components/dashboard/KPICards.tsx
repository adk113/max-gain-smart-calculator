import React, { useEffect } from 'react';
import type { SimulationSummary } from '../../types/loan';
import { formatCurrency, formatDurationSaved } from '../../utils/formatters';
import { Sparkles, CalendarCheck, ShieldCheck, TrendingDown, PiggyBank } from 'lucide-react';
import confetti from 'canvas-confetti';

interface KPICardsProps {
  summary: SimulationSummary;
  currencyCode: string;
}

export const KPICards: React.FC<KPICardsProps> = ({ summary, currencyCode }) => {
  // Fire confetti if user has saved substantial months
  useEffect(() => {
    if (summary.monthsSaved > 0) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#6366f1', '#38bdf8'],
        });
      } catch {
        // Safe fallback in headless/test environments
      }
    }
  }, [summary.actualClosureMonth, summary.monthsSaved]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Lifetime Interest Saved */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden border border-emerald-500/30 glow-emerald bg-gradient-to-br from-emerald-950/30 to-slate-900/60 shadow-xl">
        <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Lifetime Interest Saved
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            -{summary.interestReductionPercent}%
          </span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-300 tracking-tight">
          {formatCurrency(summary.lifetimeInterestSaved, currencyCode)}
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between font-medium">
          <span>MaxGain: {formatCurrency(summary.totalInterestPaid, currencyCode, true)}</span>
          <span className="line-through text-slate-500">
            Std: {formatCurrency(summary.standardTotalInterestPaid, currencyCode, true)}
          </span>
        </div>
      </div>

      {/* 2. Loan Closure Month & Tenure Saved */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden border border-indigo-500/30 glow-indigo bg-gradient-to-br from-indigo-950/30 to-slate-900/60 shadow-xl">
        <div className="flex items-center justify-between text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4 text-indigo-400" />
            Payoff Timeline
          </span>
          {summary.monthsSaved > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
              ⚡ Early Closure
            </span>
          )}
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
          Month {summary.actualClosureMonth}
          <span className="text-xs font-normal text-slate-400 ml-1.5">
            of {summary.originalTenureMonths}
          </span>
        </div>
        <div className="text-[11px] text-indigo-300 mt-2 font-medium flex items-center gap-1">
          {summary.monthsSaved > 0 ? (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Paid off <strong>{formatDurationSaved(summary.monthsSaved)}</strong> earlier!</span>
            </>
          ) : (
            <span className="text-slate-400">Completes on full term: {summary.actualClosureDate}</span>
          )}
        </div>
      </div>

      {/* 3. Monthly Benchmark EMI */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5">
            <PiggyBank className="w-4 h-4 text-amber-400" />
            Benchmark EMI
          </span>
          <span className="text-[10px] font-mono text-slate-400">Scheduled</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
          {formatCurrency(summary.initialBenchmarkEmi, currencyCode)}
          <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2">
          Initial monthly obligation calculated at opening rate.
        </div>
      </div>

      {/* 4. Total Cash Outflow */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden border border-slate-800 bg-slate-900/60 shadow-xl">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Total Loan Outflow
          </span>
          <span className="text-[10px] font-mono text-slate-400">Prin + Int</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
          {formatCurrency(summary.totalAmountPaid, currencyCode, true)}
        </div>
        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between font-medium">
          <span>Principal: {formatCurrency(summary.totalPrincipal, currencyCode, true)}</span>
          <span className="text-emerald-400">
            Net Outflow: {formatCurrency(summary.totalAmountPaid, currencyCode, true)}
          </span>
        </div>
      </div>
    </div>
  );
};
