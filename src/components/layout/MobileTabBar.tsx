import React from 'react';
import { Sliders, Sparkles, TrendingDown, Table } from 'lucide-react';

export type ActiveTab = 'inputs' | 'kpis' | 'chart' | 'ledger';

interface MobileTabBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'inputs' as ActiveTab, label: 'Inputs', icon: Sliders },
    { id: 'kpis' as ActiveTab, label: 'Savings', icon: Sparkles },
    { id: 'chart' as ActiveTab, label: 'Trajectory', icon: TrendingDown },
    { id: 'ledger' as ActiveTab, label: '360 Ledger', icon: Table },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 md:hidden py-1.5 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'text-emerald-400 font-bold bg-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
