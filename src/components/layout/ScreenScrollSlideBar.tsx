import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

interface ScreenScrollSlideBarProps {
  slidersLocked: boolean;
  onToggleSlidersLock: () => void;
  sections?: { id: string; label: string; icon?: string }[];
}

export const ScreenScrollSlideBar: React.FC<ScreenScrollSlideBarProps> = ({
  slidersLocked,
  onToggleSlidersLock,
}) => {
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<string>('Top');
  const trackRef = useRef<HTMLDivElement>(null);

  // Monitor window scroll to update slider thumb position
  const updateScrollProgress = useCallback(() => {
    if (isDragging) return; // Don't let window scroll override while user is actively dragging the slider
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (scrollHeight > 0) {
      const pct = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
      setScrollPercent(pct);

      // Section identification
      if (pct < 15) setCurrentSection('Loan Inputs');
      else if (pct < 35) setCurrentSection('Strategy Mode');
      else if (pct < 55) setCurrentSection('Surplus & Rates');
      else if (pct < 75) setCurrentSection('Salary Float');
      else if (pct < 95) setCurrentSection('360-Mo Ledger');
      else setCurrentSection('Summary');
    }
  }, [isDragging]);

  useEffect(() => {
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();
    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, [updateScrollProgress]);

  // Handle dragging the vertical slide bar
  const handleScrollToPercent = (percent: number) => {
    const clamped = Math.min(100, Math.max(0, percent));
    setScrollPercent(clamped);
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const targetY = (clamped / 100) * scrollHeight;
    window.scrollTo({
      top: targetY,
      behavior: 'auto',
    });
  };

  const calculatePercentFromEvent = (clientY: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const offsetY = clientY - rect.top;
    const pct = (offsetY / rect.height) * 100;
    return Math.min(100, Math.max(0, pct));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const pct = calculatePercentFromEvent(e.clientY);
    handleScrollToPercent(pct);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const pct = calculatePercentFromEvent(e.clientY);
    handleScrollToPercent(pct);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <aside
      aria-label="Screen Scroll Slide Bar"
      className="fixed right-1 sm:right-3 top-24 bottom-24 z-30 flex flex-col items-center select-none pointer-events-none"
    >
      {/* Outer Panel */}
      <div
        className={`pointer-events-auto flex flex-col items-center glass-panel rounded-2xl border border-slate-700/80 shadow-2xl transition-all duration-200 ${
          isCollapsed ? 'py-2 px-1 bg-slate-900/80 w-8' : 'py-2.5 px-1.5 bg-slate-950/90 w-11 sm:w-12'
        }`}
      >
        {/* Top Control: Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mb-1"
          title={isCollapsed ? 'Expand Slide Bar' : 'Collapse Slide Bar'}
          aria-label="Toggle Slide Bar"
        >
          {isCollapsed ? (
            <PanelRightOpen className="w-3.5 h-3.5" />
          ) : (
            <PanelRightClose className="w-3.5 h-3.5" />
          )}
        </button>

        {!isCollapsed && (
          <>
            {/* Top Jump Button */}
            <button
              type="button"
              onClick={handleScrollToTop}
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
              title="Jump to Top"
              aria-label="Jump to top"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Slider Lock / Safe Scroll Mode Button */}
            <button
              type="button"
              onClick={onToggleSlidersLock}
              className={`p-1 my-1 rounded-lg transition-all text-xs flex flex-col items-center ${
                slidersLocked
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
              }`}
              title={
                slidersLocked
                  ? 'Sliders Locked (Touch-safe scrolling enabled). Tap to unlock.'
                  : 'Sliders Active. Tap to lock sliders and prevent accidental touches while scrolling.'
              }
              aria-label="Toggle Slider Lock"
            >
              {slidersLocked ? (
                <Lock className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
          </>
        )}

        {/* Vertical Track Container */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`relative flex-1 my-2 rounded-full cursor-pointer touch-none transition-all flex justify-center ${
            isCollapsed
              ? 'w-1.5 bg-slate-800 hover:w-2'
              : 'w-2 sm:w-2.5 bg-slate-800/90 border border-slate-700/60 hover:w-3'
          }`}
          title="Drag or tap to slide/scroll the screen"
        >
          {/* Active Fill Track */}
          <div
            style={{ height: `${scrollPercent}%` }}
            className="w-full rounded-full bg-gradient-to-b from-indigo-500 via-teal-400 to-emerald-400 opacity-80"
          />

          {/* Draggable Slide Handle / Thumb */}
          <div
            style={{
              top: `${scrollPercent}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute left-1/2 rounded-full transition-transform flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing ${
              isDragging
                ? 'w-7 h-7 sm:w-8 sm:h-8 bg-emerald-400 text-slate-950 scale-110 shadow-emerald-500/50'
                : 'w-6 h-6 sm:w-7 sm:h-7 bg-slate-800 border-2 border-emerald-400 text-emerald-400 hover:scale-105 shadow-black/60'
            }`}
          >
            <ChevronsUpDown className="w-3.5 h-3.5 pointer-events-none" />
          </div>

          {/* Floating Section Pill while dragging */}
          {isDragging && !isCollapsed && (
            <div
              style={{
                top: `${scrollPercent}%`,
                transform: 'translate(-100%, -50%)',
              }}
              className="absolute right-9 mr-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-emerald-500/60 text-white text-[11px] font-mono font-bold whitespace-nowrap shadow-2xl pointer-events-none animate-in fade-in flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentSection}</span>
              <span className="text-emerald-400 font-extrabold">{Math.round(scrollPercent)}%</span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <>
            {/* Bottom Jump Button */}
            <button
              type="button"
              onClick={handleScrollToBottom}
              className="p-1 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
              title="Jump to Bottom (Ledger)"
              aria-label="Jump to bottom"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Percentage Display */}
            <span className="text-[9px] font-mono text-slate-400 mt-1 font-semibold">
              {Math.round(scrollPercent)}%
            </span>
          </>
        )}
      </div>

      {/* Helper Tag when Sliders Locked */}
      {slidersLocked && !isCollapsed && (
        <div className="mt-1.5 px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-bold font-mono tracking-tight text-center pointer-events-auto">
          LOCK
        </div>
      )}
    </aside>
  );
};
