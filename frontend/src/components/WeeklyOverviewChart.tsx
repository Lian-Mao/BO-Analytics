import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import type { Movie } from '../types/boxoffice'
import { formatMoney, formatMoneyFull } from '../lib/api'
import { useDashboard } from '../context/DashboardContext'
import { MousePointerClick } from 'lucide-react'
import clsx from 'clsx'

interface WeeklyOverviewChartProps {
  movies: Movie[]
  loading: boolean
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as Movie

  const wowChange = d.weeks > 1
    ? ((d.gross / (d.total_gross - d.gross) - 1) * 100)
    : null

  return (
    <div className="chart-tooltip min-w-[220px]">
      <p className="text-slate-900 font-bold text-sm mb-2 leading-tight">{d.title}</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Weekend Gross</span>
          <span className="text-[#0066c0] font-mono font-bold">{formatMoneyFull(d.gross)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Theaters</span>
          <span className="text-slate-800 font-mono font-semibold">{d.theaters.toLocaleString()}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Avg / Theater</span>
          <span className="text-slate-700 font-mono">{formatMoneyFull(d.avg)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Cumulative</span>
          <span className="text-slate-700 font-mono">{formatMoneyFull(d.total_gross)}</span>
        </div>
        {wowChange !== null && (
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">WoW Change</span>
            <span className={clsx('font-mono font-semibold', wowChange >= 0 ? 'text-green-700' : 'text-danger')}>
              {wowChange >= 0 ? '+' : ''}{wowChange.toFixed(1)}%
            </span>
          </div>
        )}
        {d.weeks === 1 && (
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">Week</span>
            <span className="text-green-700 font-mono font-semibold">Opening 🎬</span>
          </div>
        )}
      </div>
      <div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[11px] text-[#dda20c] font-semibold">
        <MousePointerClick className="w-3.5 h-3.5" />
        Click bar to drill down
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="shimmer h-6 w-48 rounded mb-6" />
      <div className="flex items-end gap-3 h-64">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 shimmer rounded-t"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function WeeklyOverviewChart({ movies, loading }: WeeklyOverviewChartProps) {
  const { setSelectedMovie } = useDashboard()

  if (loading) return <ChartSkeleton />

  const data = movies.slice(0, 10)

  const handleBarClick = (entry: { payload?: Movie }) => {
    if (entry?.payload?.title) {
      setSelectedMovie(entry.payload.title)
    }
  }

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Box Office Chart</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Top {data.length} films — click any bar to drill down
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <MousePointerClick className="w-3.5 h-3.5 text-[#dda20c]" />
          <span>Click to explore</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 40 }}
          barCategoryGap="18%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="title"
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter' }}
            tickFormatter={(v: string) => v.length > 12 ? `${v.slice(0, 12)}…` : v}
            axisLine={false}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter' }}
            tickFormatter={(v: number) => formatMoney(v)}
            axisLine={false}
            tickLine={false}
            width={58}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
          />
          <Bar
            dataKey="gross"
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={handleBarClick}
          >
            {data.map((_, index) => {
              const barColor = index === 0 ? '#f5c518' : '#0066c0' // Gold for #1, Blue for others
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={barColor}
                  fillOpacity={0.9}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
