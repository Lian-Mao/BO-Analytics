import { Zap, Radio } from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
import clsx from 'clsx'

interface DataSourceToggleProps {
  className?: string
  compact?: boolean
}

export function DataSourceToggle({ className, compact = false }: DataSourceToggleProps) {
  const { isDemo, setIsDemo } = useDashboard()

  return (
    <div
      id="data-source-toggle-container"
      className={clsx(
        'inline-flex items-center p-1 rounded-full border transition-all duration-200 select-none',
        compact
          ? 'bg-slate-900/90 border-slate-700/80 shadow-inner'
          : 'bg-slate-100 border-slate-200 shadow-sm',
        className,
      )}
      role="radiogroup"
      aria-label="Data Source Mode"
    >
      {/* Demo Data Option */}
      <button
        type="button"
        id="toggle-demo-mode-btn"
        role="radio"
        aria-checked={isDemo}
        onClick={() => setIsDemo(true)}
        className={clsx(
          'relative flex items-center gap-1.5 rounded-full font-semibold transition-all duration-200 cursor-pointer',
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm',
          isDemo
            ? 'bg-brand-500 text-slate-950 font-bold shadow-sm'
            : compact
            ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60',
        )}
        title="Instant load with curated 2026 box office demo data"
      >
        <Zap
          className={clsx(
            compact ? 'w-3.5 h-3.5' : 'w-4 h-4',
            isDemo ? 'fill-slate-950 text-slate-950' : 'text-brand-500',
          )}
        />
        <span>Demo Data</span>
        {isDemo && (
          <span
            className={clsx(
              'px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase tracking-wider',
              'bg-slate-950/20 text-slate-900',
            )}
          >
            Fast
          </span>
        )}
      </button>

      {/* Live Data Option */}
      <button
        type="button"
        id="toggle-live-mode-btn"
        role="radio"
        aria-checked={!isDemo}
        onClick={() => setIsDemo(false)}
        className={clsx(
          'relative flex items-center gap-1.5 rounded-full font-semibold transition-all duration-200 cursor-pointer',
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm',
          !isDemo
            ? compact
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'bg-emerald-600 text-white font-bold shadow-sm'
            : compact
            ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60',
        )}
        title="Live Box Office Mojo scraping (may take 10-25 seconds)"
      >
        <span className="relative flex h-2 w-2">
          {!isDemo && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={clsx(
              'relative inline-flex rounded-full h-2 w-2',
              !isDemo ? (compact ? 'bg-slate-950' : 'bg-emerald-300') : 'bg-slate-400',
            )}
          />
        </span>
        <Radio className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>Live Mojo</span>
      </button>
    </div>
  )
}
