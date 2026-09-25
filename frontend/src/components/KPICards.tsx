import { TrendingUp, TrendingDown, Film, Building2, DollarSign, Calendar } from 'lucide-react'
import type { Movie } from '../types/boxoffice'
import { formatMoney } from '../lib/api'
import clsx from 'clsx'

interface KPICardsProps {
  movies: Movie[]
  loading: boolean
}

function SkeletonCard() {
  return (
    <div className="glass-card p-5 flex flex-col gap-3">
      <div className="shimmer h-4 w-24 rounded-md" />
      <div className="shimmer h-8 w-32 rounded-md" />
      <div className="shimmer h-3 w-20 rounded-md" />
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: 'amber' | 'indigo' | 'success'
}

function StatCard({ icon, label, value, sub, accent = 'amber' }: StatCardProps) {
  const borderClasses = {
    amber:   'border-l-4 border-l-[#f5c518]',
    indigo:  'border-l-4 border-l-[#0066c0]',
    success: 'border-l-4 border-l-[#16a34a]',
  }
  const iconClasses = {
    amber:   'text-[#b67a0a] bg-brand-50 border border-brand-100',
    indigo:  'text-[#0066c0] bg-blue-50 border border-blue-100',
    success: 'text-success bg-green-50 border border-green-100',
  }
  return (
    <div className={clsx(
      'glass-card p-5 flex flex-col gap-4 animate-slide-up hover:border-slate-300 transition-colors duration-200',
      borderClasses[accent]
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={clsx('p-1.5 rounded', iconClasses[accent])}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900 tracking-tight text-money">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export function KPICards({ movies, loading }: KPICardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (movies.length === 0) return null

  const top = movies[0]
  const totalGross = movies.reduce((sum, m) => sum + m.gross, 0)
  const totalTheaters = movies.reduce((sum, m) => sum + m.theaters, 0)
  const avgGross = Math.round(totalGross / movies.length)

  // Calculate weekend-over-weekend change using total_gross as a proxy
  const topGrossChange = top.weeks > 1
    ? ((top.gross / (top.total_gross - top.gross)) - 1) * 100
    : null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* #1 Movie */}
      <div className="glass-card p-5 flex flex-col gap-4 animate-slide-up hover:border-slate-300 border-l-4 border-l-[#f5c518] transition-colors duration-200 col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">#1 This Weekend</span>
          <div className="p-1.5 rounded text-[#b67a0a] bg-brand-50 border border-brand-100">
            <Film className="w-4 h-4" />
          </div>
        </div>
        <div>
          <p className="text-base font-extrabold text-slate-900 leading-tight line-clamp-2">{top.title}</p>
          <p className="text-2xl font-black text-[#dda20c] mt-1 text-money">{formatMoney(top.gross)}</p>
          {topGrossChange !== null && (
            <div className={clsx('mt-2 kpi-badge', topGrossChange >= 0 ? 'kpi-badge-up' : 'kpi-badge-down')}>
              {topGrossChange >= 0
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {Math.abs(topGrossChange).toFixed(1)}% WoW
            </div>
          )}
          {topGrossChange === null && (
            <span className="mt-2 kpi-badge kpi-badge-flat">Opening Weekend</span>
          )}
        </div>
      </div>

      {/* Total Gross */}
      <StatCard
        icon={<DollarSign className="w-4 h-4" />}
        label="Total Weekend Gross"
        value={formatMoney(totalGross)}
        sub={`${movies.length} films charted`}
        accent="indigo"
      />

      {/* Total Theaters */}
      <StatCard
        icon={<Building2 className="w-4 h-4" />}
        label="Total Theaters"
        value={totalTheaters.toLocaleString()}
        sub="across all releases"
        accent="success"
      />

      {/* Avg per Movie */}
      <StatCard
        icon={<Calendar className="w-4 h-4" />}
        label="Avg per Movie"
        value={formatMoney(avgGross)}
        sub="mean weekend gross"
        accent="amber"
      />
    </div>
  )
}
