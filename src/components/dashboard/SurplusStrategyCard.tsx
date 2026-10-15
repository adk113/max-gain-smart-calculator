import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { Wallet, RotateCcw, FileSpreadsheet } from 'lucide-react';

interface SurplusStrategyCardProps {
  baselineSurplus: number;
  currencyCode: string;
  hasCustomOverrides: boolean;
  onChangeBaseline: (val: number) => void;
  onResetAll: () => void;
  onLoadExcelScenario: () => void;
}

export const SurplusStrategyCard: React.FC<SurplusStrategyCardProps> = ({
  baselineSurplus,
  currencyCode,
  hasCustomOverrides,
  onChangeBaseline,
  onResetAll,
  onLoadExcelScenario,
}) => {
  const isIndian = currencyCode === 'INR';
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

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Parked Surplus & Overdraft Strategy
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {hasCustomOverrides && (
            <button
              type="button"
              onClick={onResetAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition-all active:scale-95"
              title="Reset all custom monthly cells to 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Custom Cells</span>
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
        Money parked in your Max Gain overdraft account acts as an instant interest offset without lock-in.
        Every unit of parked surplus eliminates accrued interest:
        <code className="text-emerald-400 font-mono ml-1">
          Interest = max(0, (Principal - Surplus) * Rate/12)
        </code>.
      </p>

      {/* Linked Slider & Manual Text Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-300 font-medium">Monthly Parked Surplus:</span>
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
      <div className="flex flex-wrap gap-1.5 pt-1">
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
  );
};
