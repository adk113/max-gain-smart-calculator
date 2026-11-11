import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type {
  SalaryCycleConfig,
  SalaryExpenseRow,
  ExpenseAllocationMode,
} from '../../types/loan';
import {
  formatCurrency,
  formatCompactDenomination,
  getCurrencyConfig,
} from '../../utils/formatters';
import {
  simulateMonthlySalaryCycle,
  resolveExpenseRowAmount,
} from '../../engine/amortizationEngine';
import {
  Calendar,
  RefreshCw,
  Sparkles,
  Plus,
  Trash2,
  Sliders,
  Layers,
  RotateCcw,
  TrendingDown,
  Tag,
} from 'lucide-react';
import { FriendlyNumberInput } from '../controls/FriendlyNumberInput';

interface SalaryCycleSimulatorProps {
  config: SalaryCycleConfig;
  currencyCode: string;
  effectiveMonthlyFloat: number;
  monthlyInterestSaved: number;
  onChangeConfig: (newConfig: SalaryCycleConfig) => void;
  isLocked?: boolean;
}

const EXPENSE_LABEL_PRESETS = [
  'Credit Card Bill',
  'SIP Deduction',
  'EMI Payment',
  'School Fees',
  'Rent / Maintenance',
  'Utility & Bills',
  'Miscellaneous',
];

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export const SalaryCycleSimulator: React.FC<SalaryCycleSimulatorProps> = ({
  config,
  currencyCode,
  effectiveMonthlyFloat,
  monthlyInterestSaved,
  onChangeConfig,
  isLocked = false,
}) => {
  const isIndian = currencyCode === 'INR';
  const currencyConfig = getCurrencyConfig(currencyCode);
  const salary = config.monthlySalary || 0;
  const expenses: SalaryExpenseRow[] = Array.isArray(config.expenses) ? config.expenses : [];

  // Run multi-drop simulation across a 31-day typical month cycle for chart & interval analytics
  const cycleSim31 = simulateMonthlySalaryCycle(
    salary,
    expenses,
    31,
    config.parkingDays,
    config.withdrawalPercent
  );
  // Also compute standard 30-day cycle metrics matching the summary engine
  const cycleSim30 = simulateMonthlySalaryCycle(
    salary,
    expenses,
    30,
    config.parkingDays,
    config.withdrawalPercent
  );

  const totalWithdrawnAmount = Math.round(cycleSim30.totalExpensesAmount);
  const totalWithdrawnPct = Math.round(cycleSim30.totalExpensesPercent * 10) / 10;
  const retainedAmount = Math.round(cycleSim30.retainedEndOfMonth);
  const retainedPct = Math.round(cycleSim30.retainedEndOfMonthPercent * 10) / 10;

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

  const absoluteExpensePresets = isIndian
    ? [
        { label: '₹0', value: 0 },
        { label: '₹10k', value: 10000 },
        { label: '₹25k', value: 25000 },
        { label: '₹40k', value: 40000 },
        { label: '₹60k', value: 60000 },
      ]
    : [
        { label: '$0', value: 0 },
        { label: '$500', value: 500 },
        { label: '$1k', value: 1000 },
        { label: '$2k', value: 2000 },
        { label: '$3k', value: 3000 },
      ];

  const percentExpensePresets = [0, 10, 15, 20, 25, 30, 50];
  const dayQuickPresets = [1, 5, 10, 15, 25, 30];

  // Add a new Expense Tracker row (defaults value to 0 to preserve baseline until adjusted)
  const handleAddExpenseRow = () => {
    const defaultCycleTemplates = [
      { label: 'SIP Deduction', day: 5 },
      { label: 'EMI Payment', day: 10 },
      { label: 'Credit Card Bill', day: 25 },
      { label: 'School Fees', day: 15 },
      { label: 'Miscellaneous', day: 20 },
    ];
    const nextTemplate = defaultCycleTemplates[expenses.length % defaultCycleTemplates.length];

    const newRow: SalaryExpenseRow = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: nextTemplate.label,
      dayOfMonth: nextTemplate.day,
      allocationMode: 'PERCENTAGE',
      value: 0,
    };

    onChangeConfig({
      ...config,
      enabled: true,
      parkingDays: 0,
      withdrawalPercent: 0,
      expenses: [...expenses, newRow],
    });
  };

  // Load a sample 3-drop schedule matching the specification example (Day 5 SIP, Day 10 EMI, Day 25 Credit Card)
  const handleLoadSampleMultiDrop = () => {
    const sampleRows: SalaryExpenseRow[] = [
      {
        id: `exp-sip-${Date.now()}`,
        label: 'SIP Deduction',
        dayOfMonth: 5,
        allocationMode: 'PERCENTAGE',
        value: 20,
      },
      {
        id: `exp-emi-${Date.now() + 1}`,
        label: 'EMI Payment',
        dayOfMonth: 10,
        allocationMode: 'PERCENTAGE',
        value: 20,
      },
      {
        id: `exp-cc-${Date.now() + 2}`,
        label: 'Credit Card Bill',
        dayOfMonth: 25,
        allocationMode: 'PERCENTAGE',
        value: 20,
      },
    ];

    onChangeConfig({
      ...config,
      enabled: true,
      monthlySalary: salary > 0 ? salary : isIndian ? 150000 : 6000,
      parkingDays: 0,
      withdrawalPercent: 0,
      expenses: sampleRows,
    });
  };

  // Clear all expense rows and reset values cleanly to Zero (0)
  const handleClearExpenses = () => {
    onChangeConfig({
      ...config,
      parkingDays: 0,
      withdrawalPercent: 0,
      expenses: [],
    });
  };

  // Update a specific expense row
  const handleUpdateExpenseRow = (id: string, patch: Partial<SalaryExpenseRow>) => {
    const updated = expenses.map((row) => {
      if (row.id !== id) return row;
      return { ...row, ...patch };
    });
    onChangeConfig({
      ...config,
      parkingDays: 0,
      withdrawalPercent: 0,
      expenses: updated,
    });
  };

  // Toggle between ABSOLUTE and PERCENTAGE mode for a specific row
  const handleToggleAllocationMode = (row: SalaryExpenseRow, targetMode: ExpenseAllocationMode) => {
    if (row.allocationMode === targetMode) return;

    let convertedValue = 0;
    if (targetMode === 'ABSOLUTE') {
      // Convert percentage of net salary to absolute amount
      convertedValue = salary > 0 ? Math.round((salary * Math.min(100, Math.max(0, row.value))) / 100) : 0;
    } else {
      // Convert absolute amount to percentage of net salary
      convertedValue =
        salary > 0 ? Math.min(100, Math.round(((Math.max(0, row.value) / salary) * 100) * 10) / 10) : 0;
    }

    handleUpdateExpenseRow(row.id, {
      allocationMode: targetMode,
      value: convertedValue,
    });
  };

  // Remove a specific expense row
  const handleRemoveExpenseRow = (id: string) => {
    onChangeConfig({
      ...config,
      parkingDays: 0,
      withdrawalPercent: 0,
      expenses: expenses.filter((r) => r.id !== id),
    });
  };

  // Distinct drop days for ReferenceLine markers on the Recharts chart
  const activeDropDays = Array.from(
    new Set(
      expenses
        .filter((e) => (Number(e.value) || 0) > 0)
        .map((e) => Math.min(31, Math.max(1, Math.round(e.dayOfMonth || 1))))
    )
  ).sort((a, b) => a - b);

  const segmentColors = [
    'from-emerald-500 to-teal-400 text-slate-950',
    'from-teal-500 to-cyan-500 text-slate-950',
    'from-indigo-500 to-blue-500 text-white',
    'from-violet-500 to-purple-500 text-white',
    'from-amber-500 to-orange-500 text-slate-950',
  ];

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-slate-900/60 to-emerald-950/20 space-y-5">
      {/* Header with Master Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <RefreshCw
              className={`w-5 h-5 ${config.enabled ? 'animate-spin' : ''}`}
              style={{ animationDuration: '10s' }}
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Smart Salary Float & Parking Cycle Simulator
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Multi-Date Expense Ledger
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Model parking your monthly paycheck on Day 1 with staggered multi-date cash departures (SIPs, EMIs, Credit Cards) across Days 1–31.
            </p>
          </div>
        </div>

        {/* Enable / Disable Toggle Switch */}
        <div className="flex items-center gap-3 self-end sm:self-center">
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
      </div>

      {/* Top Row: Monthly Net Salary Flow Input + Live Multi-Drop Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Monthly Net Salary Flow Input Card (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5 bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div>
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Total Net Salary Flow (Day 1)
              </label>
              <span className="text-[11px] text-slate-400">
                Credited to Max Gain OD account on Day 1
              </span>
            </div>
            <div className="w-36">
              <FriendlyNumberInput
                value={salary}
                min={0}
                max={10000000}
                prefix={currencyConfig.symbol}
                onChange={(val) => onChangeConfig({ ...config, monthlySalary: val })}
                className="w-full py-1.5 px-2.5 text-right font-mono text-xs sm:text-sm font-bold text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={isIndian ? 500000 : 25000}
            step={isIndian ? 5000 : 500}
            value={Math.min(isIndian ? 500000 : 25000, salary)}
            disabled={isLocked}
            onChange={(e) =>
              onChangeConfig({ ...config, monthlySalary: parseFloat(e.target.value) || 0 })
            }
            className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 touch-pan-y ${
              isLocked ? 'pointer-events-none opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ touchAction: 'pan-y' }}
          />

          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
            <div className="flex flex-wrap gap-1">
              {salaryPresets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, monthlySalary: p.value })}
                  className={`text-[10px] px-2 py-0.5 rounded font-mono transition-all cursor-pointer ${
                    salary === p.value
                      ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Accumulate Retained Monthly Savings Option */}
            <label
              className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer select-none"
              title="When enabled, any unspent salary remaining at month-end accumulates in the overdraft account month-over-month"
            >
              <input
                type="checkbox"
                checked={Boolean(config.accumulateRetainedSavings)}
                onChange={(e) =>
                  onChangeConfig({ ...config, accumulateRetainedSavings: e.target.checked })
                }
                className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
              />
              <span>Compound Unspent Float</span>
            </label>
          </div>
        </div>

        {/* Live Multi-Drop Metrics Overview (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">
              1. Day 1 Salary Parked
            </span>
            <div className="text-base sm:text-lg font-extrabold font-mono text-emerald-400 mt-1">
              {formatCurrency(salary, currencyCode)}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1">
              100% Initial Float Base
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">
              2. Multi-Date Outflows ({expenses.length})
            </span>
            <div className="text-base sm:text-lg font-extrabold font-mono text-amber-400 mt-1">
              {formatCurrency(totalWithdrawnAmount, currencyCode)}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1">
              {totalWithdrawnPct}% of Net Salary Withdrawn
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400">
              3. Month-End Retained
            </span>
            <div className="text-base sm:text-lg font-extrabold font-mono text-indigo-300 mt-1">
              {formatCurrency(retainedAmount, currencyCode)}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1">
              {retainedPct}% Parked Through Day 31
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: Granular Multi-Date Expense Entry Panel ("Add Expense Tracker") */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Granular Multi-Date Expense Ledger</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {expenses.length} {expenses.length === 1 ? 'Row' : 'Rows'}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Configure exact calendar days (Day 1–31) and allocation modes (% of Salary or Absolute Amount) for each recurring monthly expense.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddExpenseRow}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense Tracker</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSampleMultiDrop}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Populate sample multi-drop schedule: Day 5 SIP, Day 10 EMI, Day 25 Credit Card Bill"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Multi-Drop</span>
            </button>

            {expenses.length > 0 && (
              <button
                type="button"
                onClick={handleClearExpenses}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-medium transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                title="Clear all custom expense rows and default values to Zero (0)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset (0)</span>
              </button>
            )}
          </div>
        </div>

        {/* Expense Tracker Rows or Clean Zero-Default Empty State */}
        {expenses.length === 0 ? (
          <div className="p-5 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-3">
            <div className="text-xs font-semibold text-slate-300">
              No Custom Expense Rows Initialized — All Expense Outflows Default to Zero (0)
            </div>
            <p className="text-[11px] text-slate-400 max-w-xl mx-auto leading-relaxed">
              Baseline logic execution is preserved. Click{' '}
              <strong className="text-emerald-300">+ Add Expense Tracker</strong> to add staggered monthly outflows (e.g. Day 5 SIP Deduction, Day 10 EMI Payment, Day 25 Credit Card Bill), or load the sample multi-drop ledger.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleAddExpenseRow}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Expense Tracker Row</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSampleMultiDrop}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Load Sample (Day 5 SIP • Day 10 EMI • Day 25 CC)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((row, index) => {
              const { amount: resolvedAmt, percentOfSalary: resolvedPct, clampedDay } =
                resolveExpenseRowAmount(row, salary);
              const isPctMode = row.allocationMode === 'PERCENTAGE';
              const sliderMax = isPctMode
                ? 100
                : Math.max(salary > 0 ? salary : isIndian ? 150000 : 10000, row.value || 0);
              const sliderStep = isPctMode ? 1 : isIndian ? 1000 : 50;

              return (
                <div
                  key={row.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 transition-all space-y-3"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                    {/* 1. Expense Label Tag (Preset Dropdown + Instant Custom Text Input) - 4 cols */}
                    <div className="lg:col-span-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-indigo-400" />
                          <span>#{index + 1} Expense Label Tag</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveExpenseRow(row.id)}
                          className="lg:hidden text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                          title="Remove Expense Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex gap-1.5">
                        <select
                          value={
                            EXPENSE_LABEL_PRESETS.includes(row.label) ? row.label : '__CUSTOM__'
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== '__CUSTOM__') {
                              handleUpdateExpenseRow(row.id, { label: val });
                            }
                          }}
                          className="bg-slate-900 text-slate-200 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 shrink-0"
                          title="Select preset expense category"
                        >
                          {EXPENSE_LABEL_PRESETS.map((preset) => (
                            <option key={preset} value={preset}>
                              {preset}
                            </option>
                          ))}
                          <option value="__CUSTOM__">Custom Tag...</option>
                        </select>

                        <input
                          type="text"
                          value={row.label}
                          placeholder="e.g. Credit Card Bill"
                          onChange={(e) =>
                            handleUpdateExpenseRow(row.id, { label: e.target.value })
                          }
                          className="w-full bg-slate-900 text-white border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* 2. Day of the Month Selector (Bounded Day 1 to Day 31) - 3 cols */}
                    <div className="lg:col-span-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-400" />
                          <span>Debit Day (1–31)</span>
                        </label>
                        <span className="text-[11px] font-mono font-bold text-emerald-400">
                          {getOrdinalSuffix(clampedDay)} of Month
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={clampedDay}
                          onChange={(e) =>
                            handleUpdateExpenseRow(row.id, {
                              dayOfMonth: Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)),
                            })
                          }
                          className="bg-slate-900 text-white font-mono border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-1"
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>
                              Day {d} ({getOrdinalSuffix(d)})
                            </option>
                          ))}
                        </select>

                        <div className="w-16">
                          <FriendlyNumberInput
                            value={clampedDay}
                            min={1}
                            max={31}
                            onChange={(val) =>
                              handleUpdateExpenseRow(row.id, {
                                dayOfMonth: Math.min(31, Math.max(1, Math.round(val || 1))),
                              })
                            }
                            className="w-full py-1.5 px-2 text-center font-mono text-xs font-bold text-emerald-300 bg-slate-900 border border-slate-700/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Responsive Day 1-31 Slider + Quick Day Pills */}
                      <input
                        type="range"
                        min={1}
                        max={31}
                        step={1}
                        value={clampedDay}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleUpdateExpenseRow(row.id, {
                            dayOfMonth: Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)),
                          })
                        }
                        className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 touch-pan-y ${
                          isLocked ? 'pointer-events-none opacity-50 cursor-not-allowed' : ''
                        }`}
                        style={{ touchAction: 'pan-y' }}
                      />

                      <div className="flex flex-wrap gap-1">
                        {dayQuickPresets.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => handleUpdateExpenseRow(row.id, { dayOfMonth: d })}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition-all cursor-pointer ${
                              clampedDay === d
                                ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            D{d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Value Allocation Mode Toggle + Linked Slider & Manual Input Override - 5 cols */}
                    <div className="lg:col-span-5 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        {/* Allocation Mode Switch */}
                        <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-700/80">
                          <button
                            type="button"
                            onClick={() => handleToggleAllocationMode(row, 'PERCENTAGE')}
                            className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                              isPctMode
                                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Allocate expense as a Percentage of Total Net Salary Flow"
                          >
                            % of Net Salary
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleAllocationMode(row, 'ABSOLUTE')}
                            className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                              !isPctMode
                                ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Allocate expense as an Absolute Figure Amount"
                          >
                            {currencyConfig.symbol} Absolute Figure
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Computed Counterpart Badge */}
                          <span className="text-[11px] font-mono text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {isPctMode
                              ? `= ${formatCurrency(Math.round(resolvedAmt), currencyCode)}`
                              : `= ${resolvedPct.toFixed(1)}% of salary`}
                          </span>

                          {/* Desktop Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveExpenseRow(row.id)}
                            className="hidden lg:inline-flex text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove Expense Tracker Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Linked Slider + Instantaneous Manual Input Box Override */}
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1">
                          <input
                            type="range"
                            min={0}
                            max={sliderMax}
                            step={sliderStep}
                            value={Math.min(sliderMax, Math.max(0, row.value || 0))}
                            disabled={isLocked}
                            onChange={(e) =>
                              handleUpdateExpenseRow(row.id, {
                                value: parseFloat(e.target.value) || 0,
                              })
                            }
                            className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer ${
                              isPctMode ? 'accent-amber-400' : 'accent-indigo-400'
                            } touch-pan-y ${
                              isLocked ? 'pointer-events-none opacity-50 cursor-not-allowed' : ''
                            }`}
                            style={{ touchAction: 'pan-y' }}
                          />
                        </div>

                        <div className="w-28 sm:w-32 shrink-0">
                          <FriendlyNumberInput
                            value={row.value || 0}
                            min={0}
                            max={isPctMode ? 100 : 100000000}
                            prefix={!isPctMode ? currencyConfig.symbol : undefined}
                            suffix={isPctMode ? '%' : undefined}
                            onChange={(val) => handleUpdateExpenseRow(row.id, { value: val })}
                            className={`w-full py-1 px-2 text-right font-mono text-xs font-bold text-white bg-slate-900 border rounded-lg focus:outline-none focus:ring-1 ${
                              isPctMode
                                ? 'border-amber-500/40 focus:ring-amber-400'
                                : 'border-indigo-500/40 focus:ring-indigo-400'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Quick Value Presets */}
                      <div className="flex flex-wrap items-center justify-between gap-1 pt-0.5">
                        <div className="flex flex-wrap gap-1">
                          {isPctMode
                            ? percentExpensePresets.map((pct) => (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => handleUpdateExpenseRow(row.id, { value: pct })}
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition-all cursor-pointer ${
                                    Math.abs((row.value || 0) - pct) < 0.01
                                      ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))
                            : absoluteExpensePresets.map((preset) => (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateExpenseRow(row.id, { value: preset.value })
                                  }
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition-all cursor-pointer ${
                                    Math.abs((row.value || 0) - preset.value) < 0.01
                                      ? 'bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/40'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              ))}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          Outflow on Day {clampedDay}:{' '}
                          <strong className="text-amber-300">
                            -{formatCurrency(Math.round(resolvedAmt), currencyCode, true)}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalWithdrawnPct > 100 && (
          <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-mono">
            ⚠️ Scheduled expenses ({totalWithdrawnPct}%) exceed 100% of monthly net salary flow. Parked salary float automatically floors at {formatCurrency(0, currencyCode)} once salary is fully depleted.
          </div>
        )}
      </div>

      {/* SECTION: Interactive Recharts Intra-Month Cash Balance Curve & Staggered Timeline */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-400" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Intra-Month Staggered Cash Balance Curve (Days 1–31)
              </h4>
              <p className="text-[11px] text-slate-400">
                Real-time Recharts visualization of your parked salary float dropping sequentially on each designated expense date.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Effective Daily Float: {formatCurrency(effectiveMonthlyFloat, currencyCode)}/mo
            </span>
          </div>
        </div>

        {/* Recharts Step-After AreaChart for Intra-Month Cash Balance Curve */}
        <div className="h-56 sm:h-64 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={cycleSim31.dailyCurve}
              margin={{ top: 12, right: 14, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="salaryFloatCurveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="dayLabel"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                interval={2}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                domain={[0, Math.max(salary || 100000, 1000)]}
                tickFormatter={(v) => formatCompactDenomination(v, isIndian)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload;
                    return (
                      <div className="glass-panel p-3 rounded-xl border border-slate-700 shadow-2xl text-xs space-y-1.5 min-w-[210px]">
                        <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
                          <span>{pt.dayLabel} of Month</span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {pt.retainedPercent.toFixed(1)}% Parked
                          </span>
                        </div>
                        <div className="text-emerald-400 font-mono flex justify-between gap-4">
                          <span>Active Parked Balance:</span>
                          <span className="font-bold">
                            {formatCurrency(Math.round(pt.balance), currencyCode)}
                          </span>
                        </div>
                        {pt.expenseDetails && pt.expenseDetails.length > 0 && (
                          <div className="pt-1 border-t border-slate-800/80 space-y-1">
                            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                              Outflows Departing on {pt.dayLabel}:
                            </span>
                            {pt.expenseDetails.map(
                              (
                                exp: {
                                  id: string;
                                  label: string;
                                  amount: number;
                                  percentOfSalary: number;
                                },
                                i: number
                              ) => (
                                <div
                                  key={`${exp.id}-${i}`}
                                  className="text-[11px] font-mono text-amber-300 flex justify-between gap-3"
                                >
                                  <span>• {exp.label}:</span>
                                  <span className="font-bold">
                                    -{formatCurrency(Math.round(exp.amount), currencyCode)} (
                                    {exp.percentOfSalary.toFixed(1)}%)
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                        <div className="text-slate-400 font-mono text-[10px] flex justify-between gap-4 pt-0.5 border-t border-slate-800/60">
                          <span>Cumulative Withdrawn:</span>
                          <span>
                            {formatCurrency(Math.round(pt.cumulativeWithdrawn), currencyCode)}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Horizontal Reference Line for Time-Weighted Average Monthly Float */}
              {salary > 0 && (
                <ReferenceLine
                  y={cycleSim30.baseMonthlyFloat}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  label={{
                    value: `Avg Float: ${formatCurrency(Math.round(cycleSim30.baseMonthlyFloat), currencyCode, true)}`,
                    fill: '#38bdf8',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}

              {/* Vertical Reference Lines for Each Expense Drop Date */}
              {activeDropDays.map((dropDay) => (
                <ReferenceLine
                  key={`drop-day-${dropDay}`}
                  x={`Day ${dropDay}`}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{
                    value: `D${dropDay}`,
                    fill: '#fbbf24',
                    fontSize: 9,
                    position: 'top',
                  }}
                />
              ))}

              <Area
                type="stepAfter"
                dataKey="balance"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#salaryFloatCurveGrad)"
                name="Parked Salary Balance"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Multi-Interval Proportional Bar Visualizer */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sequential Interval Fractions (30-Day Banking Cycle):</span>
            </span>
            <span>{cycleSim30.intervals.length} Active Interval Segment(s)</span>
          </div>

          <div className="w-full h-8 rounded-xl bg-slate-800 p-1 flex items-center overflow-hidden border border-slate-700/80 shadow-inner gap-1">
            {cycleSim30.intervals.map((seg, idx) => {
              const widthPct = Math.max(4, seg.intervalFraction * 100);
              const colorClass = segmentColors[idx % segmentColors.length];
              return (
                <div
                  key={`${seg.startDay}-${seg.endDay}-${idx}`}
                  style={{ width: `${widthPct}%` }}
                  className={`h-full rounded-lg bg-gradient-to-r ${colorClass} flex items-center justify-center text-[10px] font-extrabold shadow-md transition-all truncate px-1.5`}
                  title={`Days ${seg.startDay}–${seg.endDay} (${seg.days}d • ${(
                    seg.intervalFraction * 100
                  ).toFixed(1)}% of month): ${formatCurrency(
                    Math.round(seg.balance),
                    currencyCode
                  )} (${seg.retainedPercent.toFixed(0)}%)`}
                >
                  D{seg.startDay}–{seg.endDay}: {seg.retainedPercent.toFixed(0)}% (
                  {formatCurrency(Math.round(seg.balance), currencyCode, true)})
                </div>
              );
            })}
          </div>

          {/* Interval Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 text-[11px] font-mono">
            {cycleSim30.intervals.map((seg, idx) => (
              <div
                key={`card-${seg.startDay}-${seg.endDay}-${idx}`}
                className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <span>
                    Days {seg.startDay}–{seg.endDay} ({seg.days}d)
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    {(seg.intervalFraction * 100).toFixed(1)}% wt
                  </span>
                </div>
                <div className="text-xs font-extrabold text-white mt-1">
                  {formatCurrency(Math.round(seg.balance), currencyCode)} Parked
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {seg.departingExpenses.length > 0
                    ? `Drop: ${seg.departingExpenses.map((e) => e.label).join(', ')}`
                    : 'Day 1 Salary Inflow Base'}
                </div>
              </div>
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
                Zero Extra Capital Required — Multi-Drop Precision Float!
              </div>
              <div className="text-[11px] text-emerald-300/90 leading-tight">
                By parking{' '}
                <strong className="text-white font-mono">
                  {formatCurrency(salary, currencyCode)}
                </strong>{' '}
                on Day 1 across{' '}
                <strong className="text-white font-mono">{expenses.length}</strong> scheduled expense row(s), your staggered daily balances generate a time-weighted average principal offset of{' '}
                <strong className="text-white font-mono">
                  {formatCurrency(effectiveMonthlyFloat, currencyCode)}
                </strong>{' '}
                every single month.
              </div>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-emerald-500/20 sm:pl-4 whitespace-nowrap">
            <div className="text-[10px] text-slate-400 uppercase font-mono">
              Monthly Pure Interest Saved
            </div>
            <div className="text-base font-extrabold font-mono text-emerald-300">
              +{formatCurrency(monthlyInterestSaved, currencyCode)}/mo
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
