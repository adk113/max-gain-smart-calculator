import React, { useState } from 'react';
import type { MonthlyAmortizationRow, SimulationSummary } from '../../types/loan';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { Table, ChevronLeft, ChevronRight, CheckCircle2, Sparkles, Search } from 'lucide-react';

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

  const totalPages = Math.ceil(rows.length / pageSize);

  // Quick jump helper
  const handleJumpToMonth = (monthNumber: number) => {
    const targetPage = Math.ceil(monthNumber / pageSize);
    setCurrentPage(Math.min(totalPages, Math.max(1, targetPage)));
  };

  // Filtered rows for search (by month or year or date)
  const filteredRows = searchQuery.trim()
    ? rows.filter(
        (r) =>
          r.month.toString() === searchQuery.trim() ||
          r.year.toString() === searchQuery.trim() ||
          r.dateStr.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rows;

  const startIndex = (currentPage - 1) * pageSize;
  const pageRows = searchQuery.trim()
    ? filteredRows
    : filteredRows.slice(startIndex, startIndex + pageSize);

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
              Interactive monthly schedule. Edit any month's surplus to test instant payoff hypotheses.
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

      {/* Pagination Toolbar & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search month, year or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-52"
            />
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 ml-2">
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
        {!searchQuery && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px]">
              Page {currentPage} of {totalPages}
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
        )}
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
              <th className="py-3 px-3 text-center min-w-[140px]">
                Surplus / Prepay (OD)
              </th>
              <th className="py-3 px-3 text-right">Accrued Int</th>
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

                  {/* Interactive Surplus Text Input Cell (defaults to 0) */}
                  <td className="py-2.5 px-3 text-center">
                    <div className="relative inline-flex items-center">
                      <input
                        type="number"
                        step={1000}
                        min={0}
                        value={r.prepaymentOrSurplus || 0}
                        disabled={isClosed}
                        onChange={(e) =>
                          onUpdateMonthSurplus(r.month, Math.max(0, parseFloat(e.target.value) || 0))
                        }
                        className={`w-28 py-1 px-2 text-right font-mono text-xs font-bold rounded-lg border transition-all focus:outline-none focus:ring-1 focus:ring-emerald-400 ${
                          r.prepaymentOrSurplus > 0
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-900/80 border-slate-700 text-slate-400'
                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                        title="Enter parked surplus or prepayment for this month (default 0)"
                      />
                    </div>
                  </td>

                  {/* Accrued Interest */}
                  <td className="py-2.5 px-3 text-right text-amber-300/90 font-medium">
                    {formatCurrency(r.accruedInterest, currencyCode)}
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
