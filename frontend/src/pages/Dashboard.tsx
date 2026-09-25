import { useEffect, useRef, useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import {
  fetchWeekend, fetchWeekly, fetchDaily, fetchMonthly,
} from '../lib/api'
import type { Movie } from '../types/boxoffice'
import { KPICards } from '../components/KPICards'
import { WeeklyOverviewChart } from '../components/WeeklyOverviewChart'
import { MovieDrillDownModal } from '../components/MovieDrillDownModal'
import { TimeframeSelector } from '../components/TimeframeSelector'
import { RankingsTable } from '../components/RankingsTable'
import { DataSourceToggle } from '../components/DataSourceToggle'
import { AlertTriangle, Clock, RefreshCw, Zap } from 'lucide-react'

export function Dashboard() {
  const { timeframe, setTimeframe, isDemo, setIsDemo } = useDashboard()
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'live' | 'mock'>(isDemo ? 'mock' : 'live')
  const reqIdRef = useRef(0)

  const loadData = () => {
    const curId = ++reqIdRef.current
    setLoading(true)
    setError(null)

    const fetcher =
      timeframe === 'weekend' ? fetchWeekend(isDemo) :
        timeframe === 'weekly' ? fetchWeekly(isDemo) :
          timeframe === 'daily' ? fetchDaily(isDemo) :
            fetchMonthly(isDemo)

    fetcher
      .then((res) => {
        if (curId === reqIdRef.current) {
          setMovies(res.movies)
          setSource(res.source)
        }
      })
      .catch((e: Error) => {
        if (curId === reqIdRef.current) {
          setError(e.message)
        }
      })
      .finally(() => {
        if (curId === reqIdRef.current) {
          setLoading(false)
        }
      })
  }

  const getChartTitle = () => {
    switch (timeframe) {
      case 'weekend': return 'Domestic Weekend Box Office'
      case 'weekly': return 'Domestic Weekly Box Office'
      case 'daily': return 'Domestic Daily Box Office'
      case 'monthly': return 'Domestic Monthly Box Office'
      default: return 'Domestic Box Office'
    }
  }

  // Reload whenever timeframe or isDemo changes
  useEffect(() => {
    loadData()
  }, [timeframe, isDemo]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-surface-900 text-slate-800">
      {/* ── Main Navigation bar ──────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-surface-950 text-white border-b border-slate-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-brand-500 text-slate-950 font-black px-2.5 py-1 rounded text-xs tracking-wider shadow-sm">
              BoxOffice Tracker
            </div>
            <div className="h-5 w-[1px] bg-slate-700" />
          </div>

          <div className="flex items-center gap-3">
            {/* Interactive Data Source Toggle */}
            <DataSourceToggle compact />
          </div>
        </div>
      </header>

      {/* ── Secondary Sub-Header ───────────────────────────────── */}
      <section className="sticky top-[50px] z-20 bg-white border-b border-surface-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{getChartTitle()}</h2>
              {source === 'mock' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-500/10 text-amber-800 border border-brand-500/20">
                  <Zap className="w-3 h-3 text-brand-600 fill-brand-600" />
                  Demo Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {movies.length > 0 ? `Showing top ${movies.length} releases` : 'Loading report...'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <TimeframeSelector value={timeframe} onChange={setTimeframe} />
            <button
              id="refresh-btn"
              onClick={loadData}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white transition-all duration-150 shadow-sm cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live data slow warning banner with instant switch to demo */}
        {loading && !isDemo && (
          <div className="border-t border-amber-200 bg-amber-50 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 text-xs text-amber-900 animate-fade-in">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 animate-spin flex-shrink-0" />
              <span>
                Scraping live Box Office Mojo data. Live queries can take 10–25 seconds...
              </span>
            </div>
            <button
              type="button"
              id="switch-to-demo-quick-btn"
              onClick={() => setIsDemo(true)}
              className="inline-flex items-center gap-1 font-bold bg-amber-200/70 hover:bg-amber-300 text-amber-950 px-2.5 py-1 rounded transition-colors duration-150 cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3 h-3 text-amber-700 fill-amber-700" />
              Switch to Instant Demo
            </button>
          </div>
        )}
      </section>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-danger text-sm animate-fade-in shadow-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={loadData} className="ml-auto underline text-xs hover:no-underline font-semibold">Retry</button>
          </div>
        )}

        {/* KPI Cards */}
        <KPICards movies={movies} loading={loading} />

        {/* Main chart */}
        <WeeklyOverviewChart movies={movies} loading={loading} />

        {/* Rankings table */}
        <RankingsTable movies={movies} loading={loading} />
      </main>

      {/* Drill-down modal (global) */}
      <MovieDrillDownModal />
    </div>
  )
}
