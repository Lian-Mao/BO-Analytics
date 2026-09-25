import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { X, Film, Zap, Clock } from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
import { fetchMovieHistory, formatMoney, formatMoneyFull } from '../lib/api'
import type { WeekHistory } from '../types/boxoffice'
import clsx from 'clsx'

// ── Area chart tooltip ────────────────────────────────────────────────────────

function AreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as WeekHistory
  return (
    <div className="chart-tooltip min-w-[180px]">
      <p className="text-slate-500 text-xs mb-2">Week {label}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Gross</span>
          <span className="text-[#0066c0] font-mono font-bold">{formatMoneyFull(d.gross)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Theaters</span>
          <span className="text-slate-800 font-mono font-semibold">{d.theaters.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Avg / Theater</span>
          <span className="text-slate-700 font-mono">{formatMoneyFull(d.avg)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Theater bar tooltip ───────────────────────────────────────────────────────

function TheaterTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as WeekHistory
  return (
    <div className="chart-tooltip">
      <p className="text-slate-500 text-xs mb-1">Week {label}</p>
      <p className="text-[#0066c0] font-mono font-bold text-sm">{d.theaters.toLocaleString()} theaters</p>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function MovieDrillDownModal() {
  const { selectedMovie, setSelectedMovie, isDemo, setIsDemo } = useDashboard()
  const [history, setHistory] = useState<WeekHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('revenue')
  const reqIdRef = useRef(0)

  const isOpen = selectedMovie !== null

  useEffect(() => {
    if (!selectedMovie) {
      setHistory([])
      return
    }
    const curId = ++reqIdRef.current
    setLoading(true)
    setError(null)
    setHistory([])
    setActiveTab('revenue')

    fetchMovieHistory(selectedMovie, isDemo)
      .then((res) => {
        if (curId === reqIdRef.current) {
          setHistory(res.history)
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
  }, [selectedMovie, isDemo])

  const close = () => {
    setSelectedMovie(null)
  }

  // Compute total gross from history
  const cumulativeGross = history.reduce((s, h) => s + h.gross, 0)
  const peakGross = history.reduce((m, h) => Math.max(m, h.gross), 0)
  const decayPct = history.length >= 2
    ? ((history[history.length - 1].gross / history[0].gross - 1) * 100)
    : null

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 animate-fade-in" />
        <Dialog.Content
          className={clsx(
            'fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
            'z-50 w-full md:max-w-3xl md:max-h-[90vh] overflow-y-auto',
            'glass-card md:rounded-lg border border-slate-200 shadow-2xl',
            'animate-slide-up p-0 bg-white',
          )}
          aria-describedby={undefined}
        >
          {/* ── Header ──────────────────────────────────────────── */}
          <div className="flex items-start justify-between p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded text-[#b67a0a] bg-brand-50 border border-brand-100">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Dialog.Title className="text-lg font-bold text-slate-900">
                    {selectedMovie}
                  </Dialog.Title>
                  {isDemo ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-amber-800 border border-brand-500/20">
                      <Zap className="w-2.5 h-2.5 text-brand-600 fill-brand-600" />
                      Demo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Revenue history &amp; theater breakdown</p>
              </div>
            </div>
            <button
              id="drill-down-close"
              onClick={close}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white transition-all duration-150 shadow-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Slow live notice inside modal */}
          {loading && !isDemo && (
            <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900 animate-fade-in">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin flex-shrink-0" />
                <span>Scraping 12-week history from Box Office Mojo. This may take 10–20 seconds...</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDemo(true)}
                className="inline-flex items-center gap-1 font-bold text-amber-950 underline hover:no-underline whitespace-nowrap cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-700 fill-amber-700" />
                Switch to Demo
              </button>
            </div>
          )}

          {/* ── Mini KPIs ────────────────────────────────────────── */}
          {!loading && history.length > 0 && (
            <div className="grid grid-cols-3 gap-px bg-slate-200 border-b border-slate-200">
              {[
                { label: 'Cumulative Gross', value: formatMoney(cumulativeGross), color: 'text-[#0066c0]', border: 'border-l-4 border-l-[#0066c0]' },
                { label: 'Peak Gross',       value: formatMoney(peakGross),       color: 'text-slate-900', border: 'border-l-4 border-l-[#f5c518]' },
                {
                  label: 'Total Decay',
                  value: decayPct !== null ? `${decayPct.toFixed(1)}%` : '—',
                  color: decayPct !== null && decayPct < 0 ? 'text-danger' : 'text-green-700',
                  border: decayPct !== null && decayPct < 0 ? 'border-l-4 border-l-danger' : 'border-l-4 border-l-[#16a34a]',
                },
              ].map((kpi) => (
                <div key={kpi.label} className={clsx("bg-white px-5 py-4", kpi.border)}>
                  <p className={clsx('text-base sm:text-lg font-black font-mono', kpi.color)}>{kpi.value}</p>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Body ────────────────────────────────────────────── */}
          <div className="p-6 bg-white">
            {loading && (
              <div className="space-y-4">
                <div className="shimmer h-6 w-40 rounded-md" />
                <div className="shimmer h-56 w-full rounded-xl" />
              </div>
            )}

            {error && (
              <div className="text-danger text-sm bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                {error}
              </div>
            )}

            {!loading && !error && history.length > 0 && (
              <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                <Tabs.List className="flex border-b border-surface-600 w-full mb-6 overflow-x-auto">
                  {[
                    { value: 'revenue',  label: 'Revenue Trend'     },
                    { value: 'theaters', label: 'Theater Count'      },
                    { value: 'table',    label: 'Data Table'         },
                  ].map((tab) => (
                    <Tabs.Trigger
                      key={tab.value}
                      id={`tab-${tab.value}`}
                      value={tab.value}
                      className={clsx(
                        'btn-tab text-sm -mb-[2px] whitespace-nowrap',
                        activeTab === tab.value ? 'btn-tab-active' : 'btn-tab-inactive',
                      )}
                    >
                      {tab.label}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>

                {/* Revenue Area Chart */}
                <Tabs.Content value="revenue" className="animate-fade-in">
                  <p className="text-xs text-slate-500 mb-4">
                    Week-by-week gross — hover for details
                  </p>
                  <ResponsiveContainer width="100%" height={256}>
                    <AreaChart data={history} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#f5c518" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#f5c518" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="week"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(v: number) => `Wk ${v}`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(v: number) => formatMoney(v)}
                        axisLine={false}
                        tickLine={false}
                        width={58}
                      />
                      <Tooltip content={<AreaTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="gross"
                        stroke="#f5c518"
                        strokeWidth={2.5}
                        fill="url(#grossGrad)"
                        dot={{ fill: '#f5c518', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#fbbf24', stroke: '#f5c518', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Tabs.Content>

                {/* Theater Count Bar Chart */}
                <Tabs.Content value="theaters" className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <Film className="w-3.5 h-3.5 text-[#0066c0]" />
                    <p className="text-xs text-slate-500">
                      Theater count by week (typically decreases over run)
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={256}>
                    <BarChart data={history} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="week"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(v: number) => `Wk ${v}`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(v: number) => v.toLocaleString()}
                        axisLine={false}
                        tickLine={false}
                        width={52}
                      />
                      <Tooltip content={<TheaterTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                      <Bar dataKey="theaters" fill="#0066c0" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Tabs.Content>

                {/* Data Table */}
                <Tabs.Content value="table" className="animate-fade-in">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50">
                          {['Week', 'Gross', 'Theaters', 'Avg / Theater', 'WoW Change'].map((h) => (
                            <th key={h} className="text-left text-xs font-bold text-slate-600 px-4 py-3 last:pr-0">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((row, i) => {
                          const prevGross = i > 0 ? history[i - 1].gross : null
                          const change = prevGross ? ((row.gross / prevGross - 1) * 100) : null
                          return (
                            <tr
                              key={row.week}
                              className="border-b border-slate-100 even:bg-slate-50/30 hover:bg-slate-100/70 transition-colors"
                            >
                              <td className="px-4 py-3 text-slate-600 font-mono font-semibold">Wk {row.week}</td>
                              <td className="px-4 py-3 text-[#0066c0] font-mono font-bold">
                                {formatMoneyFull(row.gross)}
                              </td>
                              <td className="px-4 py-3 text-slate-800 font-mono">
                                {row.theaters.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-slate-700 font-mono">
                                {formatMoneyFull(row.avg)}
                              </td>
                              <td className="px-4 py-3">
                                {change !== null ? (
                                  <span className={clsx(
                                    'kpi-badge',
                                    change >= 0 ? 'kpi-badge-up' : 'kpi-badge-down',
                                  )}>
                                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="kpi-badge kpi-badge-flat">Opening</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Tabs.Content>
              </Tabs.Root>
            )}

            {!loading && !error && history.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">No history data available.</p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
