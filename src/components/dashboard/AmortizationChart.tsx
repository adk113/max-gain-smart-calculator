import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import type {
  MonthlyAmortizationRow,
  SimulationSummary,
  SalaryCycleConfig,
} from '../../types/loan';
import { formatCurrency, formatCompactDenomination } from '../../utils/formatters';
import { simulateMonthlySalaryCycle } from '../../engine/amortizationEngine';
import { TrendingDown, Calendar } from 'lucide-react';

interface AmortizationChartProps {
  rows: MonthlyAmortizationRow[];
  summary: SimulationSummary;
  currencyCode: string;
  salaryCycle?: SalaryCycleConfig;
}

export const AmortizationChart: React.FC<AmortizationChartProps> = ({
  rows,
  summary,
  currencyCode,
  salaryCycle,
}) => {
  const [chartMode, setChartMode] = useState<'AMORTIZATION' | 'MONTHLY_CYCLE'>('AMORTIZATION');
  const isIndian = currencyCode === 'INR';

  // Downsample or pick yearly intervals + key months so chart is fluid and crisp
  const chartData = rows
    .filter(
      (r) =>
        r.month % 6 === 0 ||
        r.month === 1 ||
        r.isClosureMonth ||
        r.month === summary.originalTenureMonths
    )
    .map((r) => ({
      month: r.month,
      dateStr: r.dateStr,
      maxGainBalance: r.closingPrincipal,
      standardBalance: r.standardClosingPrincipal,
      accruedInterest: r.accruedInterest,
    }));

  const salarySim = simulateMonthlySalaryCycle(
    salaryCycle?.monthlySalary || 0,
    salaryCycle?.expenses || [],
    31,
    salaryCycle?.parkingDays || 0,
    salaryCycle?.withdrawalPercent || 0
  );

  const activeDropDays = Array.from(
    new Set(
      (salaryCycle?.expenses || [])
        .filter((e) => (Number(e.value) || 0) > 0)
        .map((e) => Math.min(31, Math.max(1, Math.round(e.dayOfMonth || 1))))
    )
  ).sort((a, b) => a - b);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {chartMode === 'AMORTIZATION' ? (
            <TrendingDown className="w-5 h-5 text-emerald-400" />
          ) : (
            <Calendar className="w-5 h-5 text-indigo-400" />
          )}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {chartMode === 'AMORTIZATION'
                ? 'Amortization Trajectory: Target vs. Actual Max Gain'
                : 'Typical Month Cycle: Staggered Cash Balance Curve (Days 1–31)'}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Chart View Switcher */}
          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setChartMode('AMORTIZATION')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                chartMode === 'AMORTIZATION'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30-Yr Loan Trajectory
            </button>
            <button
              type="button"
              onClick={() => setChartMode('MONTHLY_CYCLE')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                chartMode === 'MONTHLY_CYCLE'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Intra-Month Cash Cycle (Days 1–31)
            </button>
          </div>

          {chartMode === 'AMORTIZATION' ? (
            <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm" />
                Max Gain Principal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-500 inline-block shadow-sm" />
                Standard Benchmark
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm" />
                Parked Salary Balance
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-sm" />
                Staggered Drop Dates
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="h-64 sm:h-80 w-full pt-2">
        {chartMode === 'AMORTIZATION' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="maxGainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="stdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="dateStr"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                tickFormatter={(v) => formatCompactDenomination(v, isIndian)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="glass-panel p-3 rounded-xl border border-slate-700 shadow-2xl text-xs space-y-1.5">
                        <div className="font-bold text-white border-b border-slate-800 pb-1">
                          Month {data.month} ({data.dateStr})
                        </div>
                        <div className="text-emerald-400 font-mono flex justify-between gap-4">
                          <span>Max Gain Balance:</span>
                          <span className="font-bold">
                            {formatCurrency(data.maxGainBalance, currencyCode)}
                          </span>
                        </div>
                        <div className="text-slate-400 font-mono flex justify-between gap-4">
                          <span>Standard Balance:</span>
                          <span>{formatCurrency(data.standardBalance, currencyCode)}</span>
                        </div>
                        {data.maxGainBalance === 0 && (
                          <div className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded text-center">
                            🎉 Loan Closed!
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} content={() => null} />
              <ReferenceLine
                x={rows[summary.actualClosureMonth - 1]?.dateStr}
                stroke="#10b981"
                strokeDasharray="3 3"
                label={{
                  value: `Closure: Month ${summary.actualClosureMonth}`,
                  fill: '#10b981',
                  fontSize: 10,
                  position: 'top',
                }}
              />
              <Area
                type="monotone"
                dataKey="standardBalance"
                stroke="#64748b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#stdGrad)"
                name="Standard Loan"
              />
              <Area
                type="monotone"
                dataKey="maxGainBalance"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#maxGainGrad)"
                name="Max Gain Loan"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={salarySim.dailyCurve}
              margin={{ top: 12, right: 14, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="intraMonthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="dayLabel"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                interval={2}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                domain={[0, Math.max(salarySim.salary || 100000, 1000)]}
                tickFormatter={(v) => formatCompactDenomination(v, isIndian)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload;
                    return (
                      <div className="glass-panel p-3 rounded-xl border border-slate-700 shadow-2xl text-xs space-y-1.5 min-w-[200px]">
                        <div className="font-bold text-white border-b border-slate-800 pb-1 flex justify-between">
                          <span>{pt.dayLabel} of Month</span>
                          <span className="text-emerald-400 font-mono">
                            {pt.retainedPercent.toFixed(1)}% Retained
                          </span>
                        </div>
                        <div className="text-emerald-400 font-mono flex justify-between gap-4">
                          <span>Parked Salary Balance:</span>
                          <span className="font-bold">
                            {formatCurrency(Math.round(pt.balance), currencyCode)}
                          </span>
                        </div>
                        {pt.expenseDetails && pt.expenseDetails.length > 0 && (
                          <div className="pt-1 border-t border-slate-800 space-y-1">
                            <span className="text-[10px] font-mono text-amber-400 font-bold block">
                              Staggered Outflows on {pt.dayLabel}:
                            </span>
                            {pt.expenseDetails.map(
                              (
                                exp: {
                                  id: string;
                                  label: string;
                                  amount: number;
                                  percentOfSalary: number;
                                },
                                idx: number
                              ) => (
                                <div
                                  key={`${exp.id}-${idx}`}
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
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {salarySim.salary > 0 && (
                <ReferenceLine
                  y={salarySim.baseMonthlyFloat}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  label={{
                    value: `Effective Daily Float: ${formatCurrency(
                      Math.round(salarySim.baseMonthlyFloat),
                      currencyCode,
                      true
                    )}`,
                    fill: '#38bdf8',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}
              {activeDropDays.map((dropDay) => (
                <ReferenceLine
                  key={`chart-drop-${dropDay}`}
                  x={`Day ${dropDay}`}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  label={{
                    value: `Day ${dropDay}`,
                    fill: '#fbbf24',
                    fontSize: 10,
                    position: 'top',
                  }}
                />
              ))}
              <Area
                type="stepAfter"
                dataKey="balance"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#intraMonthGrad)"
                name="Parked Salary Balance"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
