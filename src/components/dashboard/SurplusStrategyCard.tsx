import React, { useState, useEffect } from 'react';
import type { OneTimeTransaction, OneTimeTransactionType } from '../../types/loan';
import { formatCurrency } from '../../utils/formatters';
import {
  Wallet,
  RotateCcw,
  FileSpreadsheet,
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Layers,
  ChevronUp,
  PiggyBank,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { DatePickerPopup } from '../controls/DatePickerPopup';
import { FriendlyNumberInput } from '../controls/FriendlyNumberInput';

interface SurplusStrategyCardProps {
  baselineSurplus: number;
  monthlySurplusStartDate?: string;
  oneTimeTransactions?: OneTimeTransaction[];
  currencyCode: string;
  hasCustomOverrides: boolean;
  loanStartDate: string;
  onChangeBaseline: (val: number) => void;
  onChangeMonthlySurplusStartDate?: (date: string) => void;
  onAddTransaction: (tx: OneTimeTransaction) => void;
  onRemoveTransaction: (id: string) => void;
  onResetAll: () => void;
  onLoadExcelScenario: () => void;
}

export const SurplusStrategyCard: React.FC<SurplusStrategyCardProps> = ({
  baselineSurplus,
  monthlySurplusStartDate,
  oneTimeTransactions = [],
  currencyCode,
  hasCustomOverrides,
  loanStartDate,
  onChangeBaseline,
  onChangeMonthlySurplusStartDate,
  onAddTransaction,
  onRemoveTransaction,
  onResetAll,
  onLoadExcelScenario,
}) => {
  const isIndian = currencyCode === 'INR';

  // State for One-Time Transaction entry form
  const [showAddForm, setShowAddForm] = useState<boolean>(true);
  const [txType, setTxType] = useState<OneTimeTransactionType>('DEPOSIT');
  const [txAmount, setTxAmount] = useState<number>(isIndian ? 100000 : 5000);
  const [txDate, setTxDate] = useState<string>(() => {
    // Default to ~6 months into the loan
    if (loanStartDate) {
      const parts = loanStartDate.split('-');
      const y = parseInt(parts[0] || '2024', 10);
      const m = parseInt(parts[1] || '1', 10);
      const targetDate = new Date(y, m - 1 + 6, 1);
      return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-01`;
    }
    return '2025-01-01';
  });
  const [txLabel, setTxLabel] = useState<string>('');
  const [lastAddedNotice, setLastAddedNotice] = useState<string | null>(null);

  // Sync default transaction date when loan start date shifts
  useEffect(() => {
    if (loanStartDate) {
      const parts = loanStartDate.split('-');
      const y = parseInt(parts[0] || '2024', 10);
      const m = parseInt(parts[1] || '1', 10);
      const targetDate = new Date(y, m - 1 + 6, 1);
      const defaultDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-01`;
      setTxDate((prev) => (!prev || prev < loanStartDate ? defaultDate : prev));
    }
  }, [loanStartDate]);

  const [showDateFilterForMonthly, setShowDateFilterForMonthly] = useState<boolean>(
    Boolean(monthlySurplusStartDate && monthlySurplusStartDate !== loanStartDate)
  );

  const presets = isIndian
    ? [
        { label: '₹0 (Default)', value: 0 },
        { label: '₹10k', value: 10000 },
        { label: '₹25k (Excel)', value: 25000 },
        { label: '₹50k', value: 50000 },
        { label: '₹1 Lakh', value: 100000 },
        { label: '₹2.5 Lakh', value: 250000 },
      ]
    : [
        { label: '$0 (Default)', value: 0 },
        { label: '$250', value: 250 },
        { label: '$500', value: 500 },
        { label: '$1,000', value: 1000 },
        { label: '$2,500', value: 2500 },
        { label: '$5,000', value: 5000 },
      ];

  const depositPresets = isIndian
    ? [
        { label: '+₹50k', value: 50000 },
        { label: '+₹1L', value: 100000 },
        { label: '+₹2L', value: 200000 },
        { label: '+₹5L', value: 500000 },
        { label: '+₹10L', value: 1000000 },
      ]
    : [
        { label: '+$1,000', value: 1000 },
        { label: '+$2,500', value: 2500 },
        { label: '+$5,000', value: 5000 },
        { label: '+$10,000', value: 10000 },
        { label: '+$25,000', value: 25000 },
      ];

  const withdrawalPresets = isIndian
    ? [
        { label: '-₹25k', value: 25000 },
        { label: '-₹50k', value: 50000 },
        { label: '-₹1L', value: 100000 },
        { label: '-₹2L', value: 200000 },
        { label: '-₹5L', value: 500000 },
      ]
    : [
        { label: '-$1,000', value: 1000 },
        { label: '-$2,500', value: 2500 },
        { label: '-$5,000', value: 5000 },
        { label: '-$10,000', value: 10000 },
      ];

  const handleCreateTransaction = () => {
    if (!txAmount || txAmount <= 0) return;

    const newTx: OneTimeTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: txType,
      amount: txAmount,
      date: txDate,
      label: txLabel.trim() || undefined,
    };

    onAddTransaction(newTx);
    setLastAddedNotice(
      `${txType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} of ${formatCurrency(
        txAmount,
        currencyCode
      )} added!`
    );
    setTxLabel('');

    // Clear notice after 3 seconds
    setTimeout(() => {
      setLastAddedNotice(null);
    }, 3000);
  };

  const totalDeposited = oneTimeTransactions
    .filter((t) => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawn = oneTimeTransactions
    .filter((t) => t.type === 'WITHDRAWAL')
    .reduce((sum, t) => sum + t.amount, 0);

  const netOneTime = totalDeposited - totalWithdrawn;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-800 space-y-6 w-full">
      {/* Header and Reset Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Parked Surplus & Overdraft Strategy
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Zero Lock-In
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily interest offset engine via recurring monthly surplus and flexible multiple lump-sum deposits / withdrawals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(hasCustomOverrides || baselineSurplus > 0 || oneTimeTransactions.length > 0) && (
            <button
              type="button"
              onClick={onResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-all active:scale-95"
              title="Reset baseline, custom overrides, and one-time transactions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Surplus</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLoadExcelScenario}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all active:scale-95"
            title="Load your last entered calculation data feed or sample scenario"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Sample/last data</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Responsive Strategy Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION 1: Monthly Recurring Parked Surplus (5 cols on lg) */}
        <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  1. Monthly Parked Surplus (Recurring)
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextState = !showDateFilterForMonthly;
                  setShowDateFilterForMonthly(nextState);
                  if (!nextState && onChangeMonthlySurplusStartDate) {
                    onChangeMonthlySurplusStartDate('');
                  } else if (nextState && onChangeMonthlySurplusStartDate && !monthlySurplusStartDate) {
                    onChangeMonthlySurplusStartDate(loanStartDate);
                  }
                }}
                className="text-[11px] text-slate-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>
                  {showDateFilterForMonthly && monthlySurplusStartDate
                    ? `Starts: ${monthlySurplusStartDate}`
                    : 'Set Start Date'}
                </span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Permanent monthly cash parked in the OD current account. Directly offsets interest every single day without locking funds.
            </p>

            {/* Start Date Selector for Monthly Surplus (Optional) */}
            {showDateFilterForMonthly && onChangeMonthlySurplusStartDate && (
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5 animate-in fade-in">
                <span className="text-[11px] text-slate-400 font-medium">
                  Apply recurring surplus starting from:
                </span>
                <DatePickerPopup
                  label="Monthly Surplus Effective Date"
                  selectedDate={monthlySurplusStartDate || loanStartDate}
                  onChange={onChangeMonthlySurplusStartDate}
                />
              </div>
            )}

            {/* Input Box with FriendlyNumberInput */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-300 font-medium">Monthly Amount:</span>
                <div className="w-36">
                  <FriendlyNumberInput
                    value={baselineSurplus}
                    onChange={onChangeBaseline}
                    min={0}
                    max={10000000}
                    placeholder="0"
                    className="w-full py-1.5 px-2.5 text-right font-mono text-sm font-bold text-emerald-400 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-850">
                <span>Active Monthly Offset:</span>
                <strong className="text-white font-mono">
                  {formatCurrency(baselineSurplus, currencyCode)}/mo
                </strong>
              </div>
            </div>

            {/* Preset Buttons */}
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => {
                  const isActive = baselineSurplus === preset.value;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onChangeBaseline(preset.value)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all active:scale-95 ${
                        isActive
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 font-bold'
                          : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 border border-slate-700/50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
            💡 <em>Tip: You can also override surplus for any individual month directly in the 360-month ledger table below.</em>
          </div>
        </div>

        {/* SECTION 2: Multiple One-Time Lump-Sum Deposits & Withdrawals (7 cols on lg) */}
        <div className="lg:col-span-7 p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                2. One-Time Deposits & Withdrawals (Multiple Entries)
              </span>
              {oneTimeTransactions.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {oneTimeTransactions.length} {oneTimeTransactions.length === 1 ? 'Entry' : 'Entries'}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all active:scale-95"
            >
              {showAddForm ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Hide Form</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Event</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Add multiple lump-sum events (annual bonuses, liquidity withdrawals, tax refunds, renovation expenses). All entries are dynamically factored into amortization interest math and milestones.
          </p>

          {/* Add Transaction Interactive Box (No Form Element to Prevent Browser Validation Popups) */}
          {showAddForm && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
                <span>Enter Lump-Sum Event Details</span>
                {lastAddedNotice ? (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {lastAddedNotice}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-normal">
                    Applies on exact transaction date
                  </span>
                )}
              </div>

              {/* Transaction Type Selector: Deposit vs Withdrawal */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('DEPOSIT')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    txType === 'DEPOSIT'
                      ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900 text-slate-400 border border-slate-700/80 hover:bg-slate-850'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  <span>One-Time Deposit (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTxType('WITHDRAWAL')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    txType === 'WITHDRAWAL'
                      ? 'bg-rose-500/20 text-rose-300 border-2 border-rose-500 shadow-md shadow-rose-500/10'
                      : 'bg-slate-900 text-slate-400 border border-slate-700/80 hover:bg-slate-850'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 text-rose-400" />
                  <span>One-Time Withdrawal (-)</span>
                </button>
              </div>

              {/* Amount & Date Grid with FriendlyNumberInput */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Amount */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {txType === 'DEPOSIT' ? 'Deposit Amount' : 'Withdrawal Amount'}
                  </label>
                  <FriendlyNumberInput
                    value={txAmount}
                    onChange={(val) => setTxAmount(val)}
                    min={0}
                    placeholder="0"
                    onEnterPress={handleCreateTransaction}
                    className={`w-full py-2 px-3 text-right font-mono text-sm font-bold rounded-xl border focus:outline-none focus:ring-1 ${
                      txType === 'DEPOSIT'
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 focus:ring-emerald-400'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-300 focus:ring-rose-400'
                    }`}
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <DatePickerPopup
                    label="Transaction Date"
                    selectedDate={txDate}
                    onChange={setTxDate}
                  />
                </div>
              </div>

              {/* Quick Amount Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 mr-1">Presets:</span>
                {(txType === 'DEPOSIT' ? depositPresets : withdrawalPresets).map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setTxAmount(p.value)}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Note/Description and Add Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder={
                    txType === 'DEPOSIT'
                      ? 'Note / Reason (e.g. Annual Bonus, Asset Sale, Tax Refund)...'
                      : 'Note / Reason (e.g. Home Renovation, Medical, Tuition)...'
                  }
                  value={txLabel}
                  onChange={(e) => setTxLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateTransaction();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <button
                  type="button"
                  onClick={handleCreateTransaction}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer ${
                    txType === 'DEPOSIT'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold'
                      : 'bg-rose-500 hover:bg-rose-400 text-white font-extrabold'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {txType === 'DEPOSIT'
                      ? `Add Deposit (+${formatCurrency(txAmount, currencyCode, true)})`
                      : `Add Withdrawal (-${formatCurrency(txAmount, currencyCode, true)})`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* List of Multiple Active One-Time Transactions */}
          {oneTimeTransactions.length > 0 ? (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Scheduled One-Time Events ({oneTimeTransactions.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Multiple deposits & withdrawals are aggregated per month
                </span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {oneTimeTransactions.map((tx, idx) => {
                  const isDeposit = tx.type === 'DEPOSIT';
                  return (
                    <div
                      key={tx.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
                        isDeposit
                          ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                          : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono text-slate-400 w-4 text-center">
                          #{idx + 1}
                        </span>
                        <div
                          className={`p-1.5 rounded-lg ${
                            isDeposit
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {isDeposit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold font-mono ${
                                isDeposit ? 'text-emerald-300' : 'text-rose-300'
                              }`}
                            >
                              {isDeposit ? '+' : '-'}
                              {formatCurrency(tx.amount, currencyCode)}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {tx.date}
                            </span>
                          </div>

                          {tx.label && (
                            <span className="text-[11px] text-slate-300 block font-normal mt-0.5">
                              {tx.label}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveTransaction(tx.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove this event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Net One-Time Summary Pill */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">
                    Deposits: <strong>+{formatCurrency(totalDeposited, currencyCode, true)}</strong>
                  </span>
                  <span className="text-rose-400">
                    Withdrawals: <strong>-{formatCurrency(totalWithdrawn, currencyCode, true)}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Net Lump-Sum Offset:</span>
                  <strong
                    className={
                      netOneTime >= 0 ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'
                    }
                  >
                    {netOneTime >= 0 ? '+' : ''}
                    {formatCurrency(netOneTime, currencyCode)}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                No one-time events added yet. Fill the details above and click "+ Add Deposit / Withdrawal" to schedule multiple lump-sums.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
