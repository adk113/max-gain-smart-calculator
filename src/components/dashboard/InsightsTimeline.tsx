import React from 'react';
import type { FinancialMilestoneInsight } from '../../types/loan';
import { Lightbulb, ArrowUpRight, ArrowDownRight, Calendar, Sparkles, CheckCircle } from 'lucide-react';

interface InsightsTimelineProps {
  milestones: FinancialMilestoneInsight[];
}

export const InsightsTimeline: React.FC<InsightsTimelineProps> = ({ milestones }) => {
  if (!milestones || milestones.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-800 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Smart Milestone & Schedule Insights
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Dynamic Analysis
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {milestones.map((m) => {
          let badgeBg = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
          let icon = <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />;

          if (m.badgeColor === 'emerald') {
            badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold';
            icon = <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />;
          } else if (m.badgeColor === 'rose') {
            badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
            icon = <ArrowUpRight className="w-4 h-4 text-rose-400 shrink-0" />;
          } else if (m.badgeColor === 'amber') {
            badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            icon = <ArrowDownRight className="w-4 h-4 text-amber-400 shrink-0" />;
          }

          if (m.type === 'CLOSURE_EVENT') {
            icon = <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
          }

          return (
            <div
              key={m.id}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                    {icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{m.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {m.dateStr} • Month #{m.month}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border whitespace-nowrap ${badgeBg}`}
                >
                  {m.badgeText}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                {m.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
