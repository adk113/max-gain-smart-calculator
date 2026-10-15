import React from 'react';
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
import type { MonthlyAmortizationRow, SimulationSummary } from '../../types/loan';
import { formatCurrency, formatCompactDenomination } from '../../utils/formatters';
import { TrendingDown } from 'lucide-react';

interface AmortizationChartProps {
  rows: MonthlyAmortizationRow[];
  summary: SimulationSummary;
  currencyCode: string;
}

export const AmortizationChart: React.FC<AmortizationChartProps> = ({
  rows,
  summary,
  currencyCode,
}) => {
  // Downsample or pick yearly intervals + key months so chart is fluid and crisp
  const chartData = rows
    .filter((r) => r.month % 6 === 0 || r.month === 1 || r.isClosureMonth || r.month === summary.originalTenureMonths)
    .map((r) => ({
      month: r.month,
      dateStr: r.dateStr,
      maxGainBalance: r.closingPrincipal,
      standardBalance: r.standardClosingPrincipal,
      accruedInterest: r.accruedInterest,
    }));

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Amortization Trajectory: Target vs. Actual Max Gain
          </h3>
        </div>
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
      </div>

      <div className="h-64 sm:h-80 w-full pt-2">
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
              tickFormatter={(v) => formatCompactDenomination(v, currencyCode === 'INR')}
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
                        <span className="font-bold">{formatCurrency(data.maxGainBalance, currencyCode)}</span>
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
      </div>
    </div>
  );
};
