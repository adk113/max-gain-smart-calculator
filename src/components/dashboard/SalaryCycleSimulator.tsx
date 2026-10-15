import React from 'react';
import type { SalaryCycleConfig } from '../../types/loan';
import { formatCurrency } from '../../utils/formatters';
import { Calendar, RefreshCw, Sparkles } from 'lucide-react';

interface SalaryCycleSimulatorProps {
  config: SalaryCycleConfig;
  currencyCode: string;
  effectiveMonthlyFloat: number;
  monthlyInterestSaved: number;
  onChangeConfig: (newConfig: SalaryCycleConfig) => void;
}

export const SalaryCycleSimulator: React.FC<SalaryCycleSimulatorProps> = ({
  config,
  currencyCode,
  effectiveMonthlyFloat,
  monthlyInterestSaved,
  onChangeConfig,
}) => {
  const isIndian = currencyCode === 'INR';
  const salary = config.monthlySalary;
  const days = config.parkingDays;
  const withdrawalPct = config.withdrawalPercent;
  const retainedPct = 100 - withdrawalPct;
  const withdrawnAmount = Math.round((salary * withdrawalPct) / 100);
  const retainedAmount = Math.round((salary * retainedPct) / 100);

  const salaryPresets = isIndian
    ? [
        { label: '₹75k', value: 75000 },
        { label: '₹1.2L', value: 120000 },
        { label: '₹1.5L', value: 150000 },
        { label: '₹2L', value: 200000 },
        { label: '₹3L', value: 300000 },
      ]
    : [
        { label: '$3k', value: 3000 },
        { label: '$5k', value: 5000 },
        { label: '$8k', value: 8000 },
        { label: '$12k', value: 12000 },
      ];

  const daysPresets = [5, 10, 15, 20];
  const withdrawalPresets = [40, 50, 60, 75, 90];

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-slate-900/60 to-emerald-950/20 space-y-5">
      {/* Header with Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <RefreshCw className={`w-5 h-5 ${config.enabled ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Smart Salary Float & Parking Cycle Simulator
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                What-If Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Model parking your monthly paycheck into the overdraft account for a few days before paying bills.
            </p>
          </div>
        </div>

        {/* Enable / Disable Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onChangeConfig({ ...config, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
          <span className="ml-3 text-xs font-bold text-slate-200">
            {config.enabled ? 'Active' : 'Disabled'}
          </span>
        </label>
      </div>

      {/* Visual 30-Day Monthly Cycle Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-bold flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            30-Day Monthly Cashflow Timeline
          </span>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            Effective Daily Float: {formatCurrency(effectiveMonthlyFloat, currencyCode)}/mo
          </span>
        </div>

        {/* 30-Day Split Visualizer Bar */}
        <div className="w-full h-8 rounded-xl bg-slate-800 p-1 flex items-center overflow-hidden border border-slate-700/80 shadow-inner">
          {/* Phase 1: Full Salary Parked */}
          <div
            style={{ width: `${(days / 30) * 100}%` }}
            className="h-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center text-[11px] font-extrabold text-slate-950 shadow-md transition-all truncate px-2"
            title={`Days 1 to ${days}: 100% Salary Parked (${formatCurrency(salary, currencyCode)})`}
          >
            Day 1–{days}: 100% ({formatCurrency(salary, currencyCode, true)})
          </div>

          {/* Phase 2: Retained Float After Expense Withdrawal */}
          <div
            style={{ width: `${((30 - days) / 30) * 100}%` }}
            className="h-full rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center text-[11px] font-extrabold text-white shadow-md transition-all truncate px-2 ml-1"
            title={`Days ${days + 1} to 30: ${retainedPct}% Retained (${formatCurrency(retainedAmount, currencyCode)})`}
          >
            Day {days + 1}–30: {retainedPct}% Retained ({formatCurrency(retainedAmount, currencyCode, true)})
          </div>
        </div>

        {/* Explanation of the Timing Formula */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-400 font-mono">
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span className="text-emerald-400 font-bold block">1. Inflow on 1st:</span>
            <span>Deposit {formatCurrency(salary, currencyCode)} for {days} days</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span className="text-amber-400 font-bold block">2. Bills on Day {days + 1}:</span>
            <span>Withdraw {withdrawalPct}% ({formatCurrency(withdrawnAmount, currencyCode)})</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span className="text-indigo-400 font-bold block">3. Month-End Float:</span>
            <span>{retainedPct}% ({formatCurrency(retainedAmount, currencyCode)}) for {30 - days} days</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Monthly Inflow / Salary Amount */}
        <div className="space-y-2 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Monthly Salary
            </label>
            <input
              type="number"
              step={5000}
              min={10000}
              max={5000000}
              value={salary}
              onChange={(e) =>
                onChangeConfig({ ...config, monthlySalary: Math.max(0, parseFloat(e.target.value) || 0) })
              }
              className="w-24 py-1 px-2 text-right font-mono text-xs font-bold text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <input
            type="range"
            min={isIndian ? 25000 : 1000}
            max={isIndian ? 500000 : 25000}
            step={isIndian ? 5000 : 500}
            value={salary}
            onChange={(e) =>
              onChangeConfig({ ...config, monthlySalary: parseFloat(e.target.value) || 0 })
            }
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />

          <div className="flex flex-wrap gap-1 pt-1">
            {salaryPresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onChangeConfig({ ...config, monthlySalary: p.value })}
                className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all ${
                  salary === p.value
                    ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Days Parked Before Spending */}
        <div className="space-y-2 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Parking Window (Days)
            </label>
            <span className="font-mono text-xs font-bold text-emerald-400">
              {days} Days
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={29}
            step={1}
            value={days}
            onChange={(e) =>
              onChangeConfig({ ...config, parkingDays: parseInt(e.target.value) || 10 })
            }
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>1 Day</span>
            <span>15 Days</span>
            <span>29 Days</span>
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {daysPresets.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChangeConfig({ ...config, parkingDays: d })}
                className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all ${
                  days === d
                    ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>

        {/* 3. Expense Withdrawal % */}
        <div className="space-y-2 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Expense Withdrawal %
            </label>
            <span className="font-mono text-xs font-bold text-amber-400">
              {withdrawalPct}% ({formatCurrency(withdrawnAmount, currencyCode, true)})
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={withdrawalPct}
            onChange={(e) =>
              onChangeConfig({ ...config, withdrawalPercent: parseInt(e.target.value) || 60 })
            }
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>0% (Full Save)</span>
            <span>50%</span>
            <span>100% (All Spent)</span>
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {withdrawalPresets.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onChangeConfig({ ...config, withdrawalPercent: w })}
                className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all ${
                  withdrawalPct === w
                    ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {w}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Insights Banner */}
      {config.enabled && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">
                Zero Extra Capital Required!
              </div>
              <div className="text-[11px] text-emerald-300/90 leading-tight">
                By simply routing your regular monthly salary through your Max Gain account and parking it for {days} days before paying expenses, you maintain an effective monthly interest offset of{' '}
                <strong className="text-white font-mono">{formatCurrency(effectiveMonthlyFloat, currencyCode)}</strong>.
              </div>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-emerald-500/20 sm:pl-4 whitespace-nowrap">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Monthly Pure Interest Saved</div>
            <div className="text-base font-extrabold font-mono text-emerald-300">
              +{formatCurrency(monthlyInterestSaved, currencyCode)}/mo
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
