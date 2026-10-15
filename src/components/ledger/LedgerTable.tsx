import React, { useState } from 'react';
import type { MonthlyAmortizationRow, SimulationSummary } from '../../types/loan';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import {
  Table,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface LedgerTableProps {
  rows: MonthlyAmortizationRow[];
  summary: SimulationSummary;
  currencyCode: string;
  onUpdateMonthSurplus: (month: number, value: number) => void;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  rows,
  summary,
  currencyCode,
  onUpdateMonthSurplus,
}) => {
  const [pageSize, setPageSize] = useState<number>(12); // Default: 1 Year (12 months)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyActiveActivity, setOnlyActiveActivity] = useState<boolean>(false);

  // Quick jump helper
  const handleJumpToMonth = (monthNumber: number) => {
    const targetPage = Math.ceil(monthNumber / pageSize);
    setCurrentPage(Math.min(totalPages, Math.max(1, targetPage)));
  };

  // Filtered rows for search and activity filter
  const filteredRows = rows.filter((r) => {
    if (onlyActiveActivity) {
      const hasActivity =
        r.prepaymentOrSurplus !== 0 ||
        (r.transactions && r.transactions.length > 0) ||
        r.salaryFloatOffset > 0 ||
        r.isClosureMonth;
      if (!hasActivity) return false;
    }

    if (!searchQuery.trim()) return true;

    const query = searchQuery.trim().toLowerCase();
    const hasMatchingTx = r.transactions?.some(
      (tx) =>
        tx.type.toLowerCase().includes(query) ||
        tx.date.toLowerCase().includes(query) ||
        (tx.label && tx.label.toLowerCase().includes(query))
    );

    return (
      r.month.toString() === query ||
      r.year.toString() === query ||
      r.dateStr.toLowerCase().includes(query) ||
      (query === 'deposit' && (r.oneTimeDeposit > 0 || r.prepaymentOrSurplus > 0)) ||
      (query === 'withdrawal' && (r.oneTimeWithdrawal > 0 || r.prepaymentOrSurplus < 0)) ||
      hasMatchingTx
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pageRows = filteredRows.slice(startIndex, startIndex + pageSize);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Paginated 360-Month What-If Ledger
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive monthly schedule with real-time interest savings, deposits (+), and withdrawals (-).
            </p>
          </div>
        </div>

        {/* Quick jump badges */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleJumpToMonth(1)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Year 1
          </button>
          <button
            type="button"
            onClick={() => handleJumpToMonth(60)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Year 5
          </button>
          <button
            type="button"
            onClick={() => handleJumpToMonth(120)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Year 10
          </button>
          <button
            type="button"
            onClick={() => handleJumpToMonth(summary.actualClosureMonth)}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center gap-1 active:scale-95"
            title="Jump to the exact month where balance reaches 0"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Closure Month ({summary.actualClosureMonth})</span>
          </button>
        </div>
      </div>

      {/* Pagination Toolbar, Search & Activity Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search month, date, deposit, withdrawal..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-60 sm:w-64"
            />
          </div>

          {/* Activity filter button */}
          <button
            type="button"
            onClick={() => {
              setOnlyActiveActivity(!onlyActiveActivity);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
              onlyActiveActivity
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-700/80 hover:text-slate-200'
            }`}
            title="Filter to months with surplus, deposits, withdrawals, or closure"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{onlyActiveActivity ? 'Active Months Only' : 'Filter Activity'}</span>
          </button>

          {/* Page size dropdown */}
          <div className="flex items-center gap-1.5 text-slate-400 ml-1">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 text-white border border-slate-700/80 rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              <option value={12}>12 Mos (1 Yr)</option>
              <option value={24}>24 Mos (2 Yrs)</option>
              <option value={60}>60 Mos (5 Yrs)</option>
              <option value={120}>120 Mos (10 Yrs)</option>
              <option value={360}>All 360 Months</option>
            </select>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono text-[11px]">
            Page {currentPage} of {totalPages} ({filteredRows.length} rows)
          </span>
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-800 uppercase tracking-wider sticky top-0 z-10">
              <th className="py-3 px-3">Mo</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-2 text-right">Rate</th>
              <th className="py-3 px-3 text-right">Opening Bal</th>
              <th className="py-3 px-3 text-center min-w-[160px]">
                Surplus / Prepay / Txn (OD)
              </th>
              <th className="py-3 px-3 text-right">Accrued Int (Saved)</th>
              <th className="py-3 px-3 text-right">Active EMI</th>
              <th className="py-3 px-3 text-right">Principal Paid</th>
              <th className="py-3 px-3 text-right">Closing Bal</th>
              <th className="py-3 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {pageRows.map((r) => {
              const isClosure = r.isClosureMonth;
              const isClosed = r.isClosed && !isClosure;
              const intDiff = r.standardAccruedInterest - r.accruedInterest;

              return (
                <tr
                  key={r.month}
                  className={`transition-colors ${
                    isClosure
                      ? 'bg-emerald-950/60 border-y-2 border-emerald-400 font-bold glow-emerald'
                      : isClosed
                      ? 'opacity-40 bg-slate-950/40'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  {/* Month */}
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-white">#{r.month}</span>
                    <span className="block text-[10px] text-slate-500">Yr {r.year}</span>
                  </td>

                  {/* Date */}
                  <td className="py-2.5 px-3 text-slate-300 font-medium whitespace-nowrap">
                    {r.dateStr}
                  </td>

                  {/* Rate */}
                  <td className="py-2.5 px-2 text-right text-emerald-400 font-medium">
                    {formatPercentage(r.annualRate)}
                  </td>

                  {/* Opening Balance */}
                  <td className="py-2.5 px-3 text-right text-slate-300">
                    {formatCurrency(r.openingPrincipal, currencyCode)}
                  </td>

                  {/* Interactive Surplus & One-Time Transactions Cell */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="relative inline-flex flex-col items-center max-w-[200px]">
                      <input
                        type="number"
                        step={1000}
                        min={-50000000}
                        value={r.prepaymentOrSurplus || 0}
                        disabled={isClosed}
                        onChange={(e) =>
                          onUpdateMonthSurplus(r.month, parseFloat(e.target.value) || 0)
                        }
                        className={`w-32 py-1 px-2 text-right font-mono text-xs font-bold rounded-lg border transition-all focus:outline-none focus:ring-1 ${
                          r.prepaymentOrSurplus > 0
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 focus:ring-emerald-400'
                            : r.prepaymentOrSurplus < 0
                            ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 focus:ring-rose-400'
                            : 'bg-slate-900/80 border-slate-700 text-slate-400 focus:ring-slate-500'
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                        title="Enter net parked surplus (+) or withdrawal (-) for this month (default 0)"
                      />

                      {/* Badges for One-Time Transactions on this exact month */}
                      {r.transactions && r.transactions.length > 0 && !isClosed && (
                        <div className="flex flex-col gap-0.5 mt-1 w-full">
                          {r.transactions.map((tx) => {
                            const isDep = tx.type === 'DEPOSIT';
                            return (
                              <span
                                key={tx.id}
                                className={`inline-flex items-center justify-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
                                  isDep
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                }`}
                                title={`${isDep ? 'One-Time Deposit' : 'One-Time Withdrawal'} on ${tx.date}${
                                  tx.label ? `: ${tx.label}` : ''
                                }`}
                              >
                                {isDep ? (
                                  <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-400" />
                                ) : (
                                  <ArrowUpRight className="w-2.5 h-2.5 text-rose-400" />
                                )}
                                <span>
                                  {isDep ? '+' : '-'}
                                  {formatCurrency(tx.amount, currencyCode, true)}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Salary Float Offset subtext */}
                      {r.salaryFloatOffset > 0 && !isClosed && (
                        <span
                          className="text-[10px] text-emerald-400 font-mono mt-0.5"
                          title="Automatic time-weighted salary parking float"
                        >
                          +{formatCurrency(r.salaryFloatOffset, currencyCode, true)} float
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Accrued Interest & Monthly Interest Saved */}
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-amber-300/90 font-medium">
                      {formatCurrency(r.accruedInterest, currencyCode)}
                    </span>
                    {!isClosed && (
                      <div className="mt-0.5">
                        {intDiff > 0.5 ? (
                          <span
                            className="inline-block text-[10px] text-emerald-400 font-mono font-bold"
                            title={`Saved ${formatCurrency(intDiff, currencyCode)} vs standard loan this month`}
                          >
                            Saved {formatCurrency(intDiff, currencyCode, true)}
                          </span>
                        ) : intDiff < -0.5 ? (
                          <span
                            className="inline-block text-[10px] text-rose-400 font-mono font-bold"
                            title={`+${formatCurrency(Math.abs(intDiff), currencyCode)} interest cost this month`}
                          >
                            +{formatCurrency(Math.abs(intDiff), currencyCode, true)} cost
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] text-slate-500 font-mono">
                            0 saved
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Active EMI */}
                  <td className="py-2.5 px-3 text-right text-white font-semibold">
                    {formatCurrency(r.activeEmi, currencyCode)}
                  </td>

                  {/* Principal Paid */}
                  <td className="py-2.5 px-3 text-right text-emerald-400">
                    {formatCurrency(r.principalPaid, currencyCode)}
                  </td>

                  {/* Closing Balance */}
                  <td className="py-2.5 px-3 text-right font-bold text-white">
                    {formatCurrency(r.closingPrincipal, currencyCode)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {isClosure ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-[10px] shadow-lg animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        LOAN CLOSED!
                      </span>
                    ) : isClosed ? (
                      <span className="text-[10px] text-slate-500 font-mono">Paid Off</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400/80 font-mono">Active</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
