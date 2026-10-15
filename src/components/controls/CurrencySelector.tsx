import React, { useState, useRef, useEffect } from 'react';
import { SUPPORTED_CURRENCIES } from '../../types/loan';
import { Coins, ChevronDown, Check } from 'lucide-react';

interface CurrencySelectorProps {
  selectedCode: string;
  onSelect: (code: string) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ selectedCode, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeCurrency =
    SUPPORTED_CURRENCIES.find((c) => c.code === selectedCode) || SUPPORTED_CURRENCIES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-sm font-medium text-slate-200 transition-all shadow-sm active:scale-95"
        title="Change currency (Default: INR)"
      >
        <Coins className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold text-emerald-400">{activeCurrency.symbol}</span>
        <span className="hidden sm:inline">{activeCurrency.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            Select Currency
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {SUPPORTED_CURRENCIES.map((currency) => {
              const isSelected = currency.code === selectedCode;
              return (
                <button
                  key={currency.code}
                  onClick={() => {
                    onSelect(currency.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-800 text-emerald-400 font-bold text-xs border border-slate-700">
                      {currency.symbol}
                    </span>
                    <span>{currency.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
