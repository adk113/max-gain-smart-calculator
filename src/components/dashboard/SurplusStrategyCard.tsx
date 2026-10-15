import React, { useState } from 'react';
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
} from 'lucide-react';
import { DatePickerPopup } from '../controls/DatePickerPopup';

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
  const [showAddForm, setShowAddForm] = useState<boolean>(oneTimeTransactions.length > 0);
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

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || txAmount <= 0) return;

    const newTx: OneTimeTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: txType,
      amount: txAmount,
      date: txDate,
      label: txLabel.trim() || undefined,
    };

    onAddTransaction(newTx);
    setTxLabel('');
  };

  const totalDeposited = oneTimeTransactions
    .filter((t) => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawn = oneTimeTransactions
    .filter((t) => t.type === 'WITHDRAWAL')
    .reduce((sum, t) => sum + t.amount, 0);

  const netOneTime = totalDeposited - totalWithdrawn;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 space-y-4">
      {/* Header and Reset Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Parked Surplus & Overdraft Strategy
            </h3>
            <p className="text-[11px] text-slate-400">
              Zero lock-in daily interest offsets via monthly surplus and lump-sum deposits / withdrawals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(hasCustomOverrides || baselineSurplus > 0 || oneTimeTransactions.length > 0) && (
            <button
              type="button"
              onClick={onResetAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-all active:scale-95"
              title="Reset baseline, custom overrides, and one-time transactions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Strategy</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLoadExcelScenario}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all active:scale-95"
            title="Load ₹52 Lakhs @ 9.5% with ₹25k prepayments matching the Excel workbook"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Excel Sample</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Money parked in your Max Gain overdraft account acts as an instant interest offset without lock-in:
        <code className="text-emerald-400 font-mono ml-1">
          Interest = max(0, (Principal - Surplus) * Rate/12)
        </code>.
      </p>

      {/* SECTION 1: Monthly Recurring Parked Surplus */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
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

        {/* Start Date Selector for Monthly Surplus (Optional) */}
        {showDateFilterForMonthly && onChangeMonthlySurplusStartDate && (
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
            <span className="text-[11px] text-slate-400">
              Apply monthly surplus starting from:
            </span>
            <div className="w-full sm:w-56">
              <DatePickerPopup
                label="Monthly Surplus Effective Date"
                selectedDate={monthlySurplusStartDate || loanStartDate}
                onChange={onChangeMonthlySurplusStartDate}
              />
            </div>
          </div>
        )}

        {/* Linked Slider & Manual Text Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-300 font-medium">Monthly Amount:</span>
            <div className="relative flex items-center">
              <input
                type="number"
                step={1000}
                min={0}
                max={10000000}
                value={baselineSurplus}
                onChange={(e) => onChangeBaseline(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-28 py-1 px-2 text-right font-mono text-xs font-bold text-emerald-400 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center text-xs text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
            <span>Current active offset: </span>
            <strong className="text-white ml-1 font-mono">
              {formatCurrency(baselineSurplus, currencyCode)}/mo
            </strong>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
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
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: One-Time Lump-Sum Deposits & Withdrawals */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              2. One-Time Deposits & Withdrawals (Lump-Sum)
            </span>
            {oneTimeTransactions.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {oneTimeTransactions.length} {oneTimeTransactions.length === 1 ? 'event' : 'events'}
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
                <span>+ Add Deposit / Withdrawal</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          Model lump-sum events (annual bonuses, asset sales, or liquidity withdrawals for renovations).
          Deposits save interest and reduce loan term; withdrawals draw down surplus funds and adjust future interest.
        </p>

        {/* Add Transaction Interactive Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateTransaction}
            className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
              <span>New One-Time Transaction</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Reflects instantly in amortization, milestones & ledger
              </span>
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

            {/* Amount & Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Amount */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {txType === 'DEPOSIT' ? 'Deposit Amount' : 'Withdrawal Amount'}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step={1000}
                    min={1}
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                    className={`w-full py-2 px-3 text-right font-mono text-sm font-bold rounded-xl border focus:outline-none focus:ring-1 ${
                      txType === 'DEPOSIT'
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 focus:ring-emerald-400'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-300 focus:ring-rose-400'
                    }`}
                  />
                </div>
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

            {/* Note/Description and Submit */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <input
                type="text"
                placeholder={
                  txType === 'DEPOSIT'
                    ? 'Label / Note (e.g. Diwali Bonus, Asset Sale, Tax Refund)...'
                    : 'Label / Note (e.g. Home Renovation, Medical, Tuition)...'
                }
                value={txLabel}
                onChange={(e) => setTxLabel(e.target.value)}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <button
                type="submit"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${
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
          </form>
        )}

        {/* List of Active One-Time Transactions */}
        {oneTimeTransactions.length > 0 ? (
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active One-Time Events ({oneTimeTransactions.length})
            </span>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {oneTimeTransactions.map((tx) => {
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
                            className={`text-xs font-bold ${
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
                          <span className="text-[11px] text-slate-300 block font-normal">
                            {tx.label}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveTransaction(tx.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Net One-Time Summary Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-emerald-400">
                  Deposits: <strong>+{formatCurrency(totalDeposited, currencyCode, true)}</strong>
                </span>
                <span className="text-rose-400">
                  Withdrawals: <strong>-{formatCurrency(totalWithdrawn, currencyCode, true)}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Net One-Time:</span>
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
          <div className="p-3 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>No one-time deposits or withdrawals scheduled yet. Click "+ Add Deposit / Withdrawal" above.</span>
          </div>
        )}
      </div>
    </div>
  );
};
