import { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/layout/Header';
import { MobileTabBar, type ActiveTab } from './components/layout/MobileTabBar';
import { DualSliderInput } from './components/controls/DualSliderInput';
import { DatePickerPopup } from './components/controls/DatePickerPopup';
import { ModeToggle } from './components/controls/ModeToggle';
import { LockInPhaseManager } from './components/controls/LockInPhaseManager';
import { KPICards } from './components/dashboard/KPICards';
import { AmortizationChart } from './components/dashboard/AmortizationChart';
import { SurplusStrategyCard } from './components/dashboard/SurplusStrategyCard';
import { SalaryCycleSimulator } from './components/dashboard/SalaryCycleSimulator';
import { InsightsTimeline } from './components/dashboard/InsightsTimeline';
import { LedgerTable } from './components/ledger/LedgerTable';

import type { SimulationInputs, LockInPhase, LoanMode, SalaryCycleConfig, OneTimeTransaction } from './types/loan';
import { runSimulation } from './engine/amortizationEngine';
import { copyShareableLink, deserializeSimulationState } from './engine/urlSerializer';
import { getCurrencyConfig } from './utils/formatters';
import { ScreenScrollSlideBar } from './components/layout/ScreenScrollSlideBar';
import { ExportCsvModal } from './components/controls/ExportCsvModal';
import { getSavedScenario, saveScenario, DEFAULT_EXCEL_SCENARIO } from './engine/scenarioStorage';

export function App() {
  // Safe-scroll slider lock and mobile export modal state
  const [slidersLocked, setSlidersLocked] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Synchronously initialize state from persistent storage or default 52L Excel scenario
  const [initialData] = useState<SimulationInputs>(() => getSavedScenario());

  const [currencyCode, setCurrencyCode] = useState<string>(initialData.currencyCode);
  const [principal, setPrincipal] = useState<number>(initialData.principal);
  const [tenureYears, setTenureYears] = useState<number>(initialData.tenureYears);
  const [startDate, setStartDate] = useState<string>(initialData.startDate);
  const [mode, setMode] = useState<LoanMode>(initialData.mode);
  const [lockInPhases, setLockInPhases] = useState<LockInPhase[]>(initialData.lockInPhases);
  const [fallbackRate, setFallbackRate] = useState<number>(initialData.fallbackRatePercent);
  const [fallbackYoY, setFallbackYoY] = useState<number>(initialData.fallbackYoYAdjustment);
  const [baselineSurplus, setBaselineSurplus] = useState<number>(initialData.baselineMonthlySurplus);
  const [monthlySurplusStartDate, setMonthlySurplusStartDate] = useState<string>(
    initialData.monthlySurplusStartDate || ''
  );
  const [oneTimeTransactions, setOneTimeTransactions] = useState<OneTimeTransaction[]>(
    initialData.oneTimeTransactions || []
  );
  const [customSurplusLedger, setCustomSurplusLedger] = useState<Record<number, number>>(
    initialData.customSurplusLedger || {}
  );

  // Salary parking cycle configuration (e.g., salary on 1st, parked 10 days, 60% withdrawn for bills)
  const [salaryCycle, setSalaryCycle] = useState<SalaryCycleConfig>(
    initialData.salaryCycle || DEFAULT_EXCEL_SCENARIO.salaryCycle
  );

  const [activeMobileTab, setActiveMobileTab] = useState<ActiveTab>('inputs');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Theme state: dark | light (persisted in localStorage)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('maxgain_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem('maxgain_theme', theme);
    } catch {
      // ignore
    }
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // DOM section references for smooth scrolling
  const inputsRef = useRef<HTMLDivElement>(null);
  const kpisRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const ledgerRef = useRef<HTMLDivElement>(null);

  const applyInputs = (data: Partial<SimulationInputs>) => {
    if (data.principal !== undefined) setPrincipal(data.principal);
    if (data.tenureYears !== undefined) setTenureYears(data.tenureYears);
    if (data.startDate !== undefined) setStartDate(data.startDate);
    if (data.mode !== undefined) setMode(data.mode);
    if (data.currencyCode !== undefined) setCurrencyCode(data.currencyCode);
    if (data.lockInPhases !== undefined) setLockInPhases(data.lockInPhases);
    if (data.fallbackRatePercent !== undefined) setFallbackRate(data.fallbackRatePercent);
    if (data.fallbackYoYAdjustment !== undefined) setFallbackYoY(data.fallbackYoYAdjustment);
    if (data.baselineMonthlySurplus !== undefined) setBaselineSurplus(data.baselineMonthlySurplus);
    if (data.monthlySurplusStartDate !== undefined) setMonthlySurplusStartDate(data.monthlySurplusStartDate);
    if (data.oneTimeTransactions !== undefined) setOneTimeTransactions(data.oneTimeTransactions);
    if (data.customSurplusLedger !== undefined) setCustomSurplusLedger(data.customSurplusLedger);
    if (data.salaryCycle !== undefined) setSalaryCycle(data.salaryCycle);
  };

  // Listen to hash changes in case a new share link is opened while already on the page
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.startsWith('#share=')) {
        const encoded = window.location.hash.replace('#share=', '');
        const restored = deserializeSimulationState(encoded);
        if (restored) applyInputs(restored);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const currentInputs: SimulationInputs = useMemo(
    () => ({
      principal,
      tenureYears,
      startDate,
      mode,
      currencyCode,
      lockInPhases,
      fallbackRatePercent: fallbackRate,
      fallbackYoYAdjustment: fallbackYoY,
      baselineMonthlySurplus: baselineSurplus,
      monthlySurplusStartDate,
      oneTimeTransactions,
      customSurplusLedger,
      salaryCycle,
    }),
    [
      principal,
      tenureYears,
      startDate,
      mode,
      currencyCode,
      lockInPhases,
      fallbackRate,
      fallbackYoY,
      baselineSurplus,
      monthlySurplusStartDate,
      oneTimeTransactions,
      customSurplusLedger,
      salaryCycle,
    ]
  );

  // Run simulation reactively (< 5ms)
  const { rows, summary } = useMemo(() => runSimulation(currentInputs), [currentInputs]);

  const currencyConfig = getCurrencyConfig(currencyCode);

  // Handlers for One-Time Transactions (Deposits / Withdrawals)
  const handleAddTransaction = (tx: OneTimeTransaction) => {
    setOneTimeTransactions((prev) => [...prev, tx]);
  };

  const handleRemoveTransaction = (id: string) => {
    setOneTimeTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Handler to update a single month's surplus in ledger
  const handleUpdateMonthSurplus = (month: number, value: number) => {
    setCustomSurplusLedger((prev) => {
      const next = { ...prev };
      if (value === 0) {
        delete next[month];
      } else {
        next[month] = value;
      }
      return next;
    });
  };

  // Reset all custom overrides to 0
  const handleResetAllSurplus = () => {
    setBaselineSurplus(0);
    setMonthlySurplusStartDate('');
    setOneTimeTransactions([]);
    setCustomSurplusLedger({});
    setSalaryCycle((prev) => ({ ...prev, enabled: false }));
  };

  const isInitialMount = useRef(true);

  // Keep the latest data feed in storage (immediately persists and overwrites as user types/adjusts)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveScenario(currentInputs);
  }, [currentInputs]);

  // Ensure latest inputs are persisted even on instant browser tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScenario(currentInputs);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentInputs]);

  const triggerToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Load sample or last data feed (overwriting entry with current calculation inputs)
  const handleLoadSampleOrLastData = () => {
    const saved = getSavedScenario();
    applyInputs(saved);
    triggerToast('Loaded saved calculation data successfully!');
  };

  const handleMobileTabSelect = (tab: ActiveTab) => {
    setActiveMobileTab(tab);
    if (tab === 'inputs') inputsRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (tab === 'kpis') kpisRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (tab === 'chart') chartRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (tab === 'ledger') ledgerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isIndian = currencyConfig.isIndianNotation ?? false;

  return (
    <div
      className={`min-h-screen ${
        theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
      } flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-200`}
    >
      {/* Header with Currency, Theme Toggle & Sharing */}
      <Header
        currencyCode={currencyCode}
        onSelectCurrency={setCurrencyCode}
        onCopyShareLink={() => copyShareableLink(currentInputs)}
        onExportCsv={() => setIsExportModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 pb-24 md:pb-12">
        {/* Top Hero Banner */}
        <section className="glass-card rounded-2xl p-4 sm:p-6 border border-slate-800 bg-gradient-to-r from-slate-900/90 via-indigo-950/20 to-emerald-950/20 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                SBI MaxGain • ICICI Home Loan Advantage OD Engine
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-2 tracking-tight">
                Overdraft Prepayment & Multi-Tier Amortization Simulator
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Model 30-year home loan overdraft dynamics with zero lock-in. Park emergency cash or your
                monthly salary float, slash accrued interest, and liquidate debt years ahead of schedule.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Safe Scroll Mode / Lock Sliders Toggle */}
              <button
                type="button"
                onClick={() => setSlidersLocked(!slidersLocked)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer ${
                  slidersLocked
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30 font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title={
                  slidersLocked
                    ? 'Sliders Locked (Touch-safe scrolling enabled). Tap to unlock.'
                    : 'Lock sliders to safely scroll on touch screens without accidentally modifying values.'
                }
              >
                {slidersLocked ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    <span>🔒 Sliders Locked (Safe Scroll)</span>
                  </>
                ) : (
                  <>
                    <span>🔓 Lock Sliders (Safe Scroll)</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleLoadSampleOrLastData}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all active:scale-95 shadow-sm cursor-pointer flex items-center gap-1.5"
                  title="Load your last entered calculation data feed or sample scenario"
                >
                  <span>📊 Load Sample/last data</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: Dual Input Controls & Configuration */}
        <div ref={inputsRef} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            {/* 1. Loan Amount */}
            <DualSliderInput
              label="Loan Amount Principal"
              value={principal}
              min={isIndian ? 500000 : 50000}
              max={isIndian ? 50000000 : 2500000}
              step={isIndian ? 50000 : 5000}
              prefix={currencyConfig.symbol}
              isCurrency={true}
              isIndianNotation={isIndian}
              isLocked={slidersLocked}
              presets={
                isIndian
                  ? [
                      { label: '30L', value: 3000000 },
                      { label: '52L (Excel)', value: 5200000 },
                      { label: '75L', value: 7500000 },
                      { label: '1 Cr', value: 10000000 },
                      { label: '1.5 Cr', value: 15000000 },
                    ]
                  : [
                      { label: '$250k', value: 250000 },
                      { label: '$500k', value: 500000 },
                      { label: '$750k', value: 750000 },
                      { label: '$1M', value: 1000000 },
                    ]
              }
              onChange={setPrincipal}
            />

            {/* 2. Base Tenure (Years) */}
            <DualSliderInput
              label="Base Loan Tenure"
              value={tenureYears}
              min={1}
              max={30}
              step={1}
              unit="Yrs"
              isLocked={slidersLocked}
              presets={[
                { label: '10 Yrs', value: 10 },
                { label: '15 Yrs', value: 15 },
                { label: '20 Yrs (Excel)', value: 20 },
                { label: '25 Yrs', value: 25 },
                { label: '30 Yrs', value: 30 },
              ]}
              onChange={setTenureYears}
              helperText="Full 360-month amortization schedule framework."
            />

            {/* 3. Date Picker & Scheduled Closure Card */}
            <div className="glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 flex flex-col justify-between space-y-3 h-full">
              <DatePickerPopup
                label="Loan Start Date"
                selectedDate={startDate}
                onChange={setStartDate}
              />

              <div className="pt-1 border-t border-slate-800/80">
                <span className="block text-[10px] text-slate-400 font-mono mb-0.5">
                  Scheduled Standard Closure:
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {summary.originalClosureDate} ({tenureYears * 12} Mos)
                </span>
              </div>
            </div>

            {/* 4. Tenure vs. EMI Strategy Mode Card */}
            <ModeToggle mode={mode} onChange={setMode} />
          </div>

          {/* Parked Surplus Strategy Card (Full Width) */}
          <SurplusStrategyCard
            baselineSurplus={baselineSurplus}
            monthlySurplusStartDate={monthlySurplusStartDate}
            oneTimeTransactions={oneTimeTransactions}
            currencyCode={currencyCode}
            hasCustomOverrides={
              Object.keys(customSurplusLedger).length > 0 ||
              baselineSurplus > 0 ||
              oneTimeTransactions.length > 0
            }
            loanStartDate={startDate}
            onChangeBaseline={setBaselineSurplus}
            onChangeMonthlySurplusStartDate={setMonthlySurplusStartDate}
            onAddTransaction={handleAddTransaction}
            onRemoveTransaction={handleRemoveTransaction}
            onResetAll={handleResetAllSurplus}
            onLoadExcelScenario={handleLoadSampleOrLastData}
          />

          {/* Smart Salary Float & Parking Cycle Simulator */}
          <SalaryCycleSimulator
            config={salaryCycle}
            currencyCode={currencyCode}
            effectiveMonthlyFloat={summary.effectiveMonthlySalaryFloat}
            monthlyInterestSaved={summary.monthlyInterestSavedFromFloat}
            onChangeConfig={setSalaryCycle}
            isLocked={slidersLocked}
          />

          {/* Multi-Tier Interest Rate Lock-In Ledger */}
          <LockInPhaseManager
            phases={lockInPhases}
            fallbackRate={fallbackRate}
            fallbackYoY={fallbackYoY}
            maxYears={30}
            onChangePhases={setLockInPhases}
            onChangeFallbackRate={setFallbackRate}
            onChangeFallbackYoY={setFallbackYoY}
          />
        </div>

        {/* SECTION 2: KPI Summary Cards */}
        <div ref={kpisRef} className="space-y-4 pt-2">
          <KPICards summary={summary} currencyCode={currencyCode} />
        </div>

        {/* SECTION 3: Smart Insights & Milestones Timeline */}
        <InsightsTimeline milestones={summary.milestones} />

        {/* SECTION 4: Amortization Trajectory Chart */}
        <div ref={chartRef} className="pt-2">
          <AmortizationChart rows={rows} summary={summary} currencyCode={currencyCode} />
        </div>

        {/* SECTION 5: 360-Month Interactive What-If Ledger Table */}
        <div ref={ledgerRef} className="pt-2">
          <LedgerTable
            rows={rows}
            summary={summary}
            currencyCode={currencyCode}
            onUpdateMonthSurplus={handleUpdateMonthSurplus}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Max Gain Smart Loan Simulator • 100% Client-Side Local Engine • Free & Open
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            adk113/max-gain-smart-calculator
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Tab Navigation */}
      <MobileTabBar activeTab={activeMobileTab} onSelectTab={handleMobileTabSelect} />

      {/* Screen Vertical Slide Bar (Safe scrolling without touching values) */}
      <ScreenScrollSlideBar
        slidersLocked={slidersLocked}
        onToggleSlidersLock={() => setSlidersLocked(!slidersLocked)}
      />

      {/* Mobile-Friendly CSV Export Modal */}
      <ExportCsvModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        rows={rows}
        inputs={currentInputs}
        summary={summary}
      />

      {/* Interactive Toast Notification */}
      {toastNotice && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastNotice}</span>
        </div>
      )}
    </div>
  );
}

export default App;
