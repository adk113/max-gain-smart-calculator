import React from 'react';
import type { LockInPhase } from '../../types/loan';
import { Layers, Plus, Trash2, ArrowRight } from 'lucide-react';

interface LockInPhaseManagerProps {
  phases: LockInPhase[];
  fallbackRate: number;
  fallbackYoY: number;
  maxYears?: number;
  onChangePhases: (phases: LockInPhase[]) => void;
  onChangeFallbackRate: (rate: number) => void;
  onChangeFallbackYoY: (yoy: number) => void;
}

export const LockInPhaseManager: React.FC<LockInPhaseManagerProps> = ({
  phases,
  fallbackRate,
  fallbackYoY,
  maxYears = 30,
  onChangePhases,
  onChangeFallbackRate,
  onChangeFallbackYoY,
}) => {
  const totalPhaseYears = phases.reduce((acc, p) => acc + p.durationYears, 0);
  const remainingYears = Math.max(0, maxYears - totalPhaseYears);

  const handleAddPhase = () => {
    if (totalPhaseYears >= maxYears) return;
    const nextIdx = phases.length + 1;
    const newPhase: LockInPhase = {
      id: `phase-${Date.now()}`,
      name: `Phase ${nextIdx}`,
      durationYears: Math.min(2, remainingYears || 1),
      ratePercent: fallbackRate || 8.75,
    };
    onChangePhases([...phases, newPhase]);
  };

  const handleRemovePhase = (id: string) => {
    if (phases.length <= 1) return; // Keep at least one phase
    onChangePhases(phases.filter((p) => p.id !== id));
  };

  const handleUpdatePhase = (id: string, updates: Partial<LockInPhase>) => {
    onChangePhases(
      phases.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  // Calculate start and end year offsets for each phase
  let currentYearTracker = 0;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Multi-Tier Rate Lock-In Ledger
          </h3>
        </div>
        <button
          type="button"
          onClick={handleAddPhase}
          disabled={totalPhaseYears >= maxYears}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Lock-In Phase</span>
        </button>
      </div>

      {/* Visual Timeline Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>30-Year Rate Timeline</span>
          <span>{totalPhaseYears} Yrs Fixed + {remainingYears} Yrs Variable</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 flex overflow-hidden">
          {phases.map((phase, idx) => {
            const widthPct = (phase.durationYears / maxYears) * 100;
            const colors = [
              'bg-emerald-500',
              'bg-teal-500',
              'bg-cyan-500',
              'bg-blue-500',
            ];
            const color = colors[idx % colors.length];
            return (
              <div
                key={phase.id}
                style={{ width: `${widthPct}%` }}
                className={`${color} h-full relative group transition-all`}
                title={`${phase.name}: ${phase.durationYears} Yrs @ ${phase.ratePercent}%`}
              />
            );
          })}
          {remainingYears > 0 && (
            <div
              style={{ width: `${(remainingYears / maxYears) * 100}%` }}
              className="bg-indigo-600/70 h-full relative group"
              title={`Fallback Variable: ${remainingYears} Yrs @ ${fallbackRate}% YoY`}
            />
          )}
        </div>
      </div>

      {/* Chained Fixed Rate Phase Rows */}
      <div className="space-y-2.5">
        {phases.map((phase, idx) => {
          const startYear = currentYearTracker;
          const endYear = currentYearTracker + phase.durationYears;
          currentYearTracker = endYear;

          return (
            <div
              key={phase.id}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20">
                  {idx + 1}
                </span>
                <div>
                  <input
                    type="text"
                    value={phase.name}
                    onChange={(e) => handleUpdatePhase(phase.id, { name: e.target.value })}
                    className="bg-transparent font-bold text-xs text-white focus:outline-none focus:underline"
                  />
                  <div className="text-[10px] text-slate-400 font-mono">
                    Year {startYear + 1} to Year {endYear} (Months {startYear * 12 + 1} - {endYear * 12})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Duration */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Duration:</span>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={maxYears}
                      value={phase.durationYears}
                      onChange={(e) =>
                        handleUpdatePhase(phase.id, {
                          durationYears: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-16 py-1 px-2 text-right font-mono text-xs font-bold text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 ml-1">Yrs</span>
                  </div>
                </div>

                {/* Rate */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Rate:</span>
                  <div className="relative">
                    <input
                      type="number"
                      step={0.05}
                      min={1}
                      max={25}
                      value={phase.ratePercent}
                      onChange={(e) =>
                        handleUpdatePhase(phase.id, {
                          ratePercent: Math.max(0.1, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-20 py-1 px-2 text-right font-mono text-xs font-bold text-emerald-400 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 ml-1">%</span>
                  </div>
                </div>

                {/* Delete button */}
                {phases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhase(phase.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove this lock-in phase"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fallback Variable Rate Section */}
      <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
            <span>Fallback Timeline (Year {totalPhaseYears + 1} to Year {maxYears})</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Months {totalPhaseYears * 12 + 1} to {maxYears * 12}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Base Fallback Rate */}
          <div className="flex items-center justify-between gap-2 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-300">Base Variable Rate:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step={0.05}
                min={1}
                max={25}
                value={fallbackRate}
                onChange={(e) => onChangeFallbackRate(parseFloat(e.target.value) || 8.5)}
                className="w-18 py-1 px-2 text-right font-mono text-xs font-bold text-indigo-300 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-400">%</span>
            </div>
          </div>

          {/* YoY Rate Adjustment */}
          <div className="flex items-center justify-between gap-2 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-300">Year-on-Year Drift:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step={0.05}
                min={-3}
                max={3}
                value={fallbackYoY}
                onChange={(e) => onChangeFallbackYoY(parseFloat(e.target.value) || 0)}
                className="w-18 py-1 px-2 text-right font-mono text-xs font-bold text-indigo-300 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-400">%/yr</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
