import { useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import type { Movie } from '../types/boxoffice'
import { formatMoney, formatMoneyFull } from '../lib/api'
import { ArrowUpDown, MousePointerClick, TrendingUp, TrendingDown } from 'lucide-react'
import clsx from 'clsx'

interface RankingsTableProps {
  movies: Movie[]
  loading: boolean
}

type SortKey = 'rank' | 'gross' | 'theaters' | 'avg' | 'total_gross' | 'weeks'

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="py-3 pr-4 last:pr-0">
          <div className="shimmer h-3.5 w-20 rounded" />
        </td>
      ))}
    </tr>
  )
}

export function RankingsTable({ movies, loading }: RankingsTableProps) {
  const { setSelectedMovie } = useDashboard()
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir(key === 'rank' ? 'asc' : 'desc') }
  }

  const sorted = [...movies].sort((a, b) => {
    const aVal = a[sortKey] as number
    const bVal = b[sortKey] as number
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal
  })

  const columns: { key: SortKey; label: string; align?: 'right' }[] = [
    { key: 'rank',        label: 'Rank'          },
    { key: 'gross',       label: 'Weekend Gross', align: 'right' },
    { key: 'theaters',    label: 'Theaters',      align: 'right' },
    { key: 'avg',         label: 'Avg / Theater', align: 'right' },
    { key: 'total_gross', label: 'Cumulative',    align: 'right' },
    { key: 'weeks',       label: 'Weeks',         align: 'right' },
  ]

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Full Rankings</h2>
          <p className="text-xs text-slate-500 mt-0.5">Click any row to drill down • Click column headers to sort</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <MousePointerClick className="w-3.5 h-3.5 text-[#dda20c]" />
          <span>Click row to explore</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="text-left text-xs font-bold text-slate-600 px-6 py-3">Title</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'text-xs font-bold text-slate-600 px-4 py-3 cursor-pointer select-none',
                    'hover:text-slate-900 transition-colors duration-150',
                    col.align === 'right' ? 'text-right' : 'text-left',
                  )}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown className={clsx(
                      'w-3 h-3',
                      sortKey === col.key ? 'text-[#dda20c]' : 'text-slate-400',
                    )} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
              : sorted.map((movie) => {
                  const wowChange = movie.weeks > 1 && movie.total_gross > movie.gross
                    ? ((movie.gross / (movie.total_gross - movie.gross) - 1) * 100)
                    : null

                  return (
                    <tr
                      key={movie.rank}
                      id={`row-${movie.rank}`}
                      onClick={() => setSelectedMovie(movie.title)}
                      className={clsx(
                        'border-b border-slate-100 cursor-pointer transition-all duration-150',
                        'even:bg-slate-50/30 hover:bg-slate-100/70',
                      )}
                    >
                      {/* Title */}
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-[#0066c0] text-sm hover:underline transition-colors">
                          {movie.title}
                        </span>
                        {movie.distributor && (
                          <span className="ml-2 text-[11px] text-slate-500 font-normal">{movie.distributor}</span>
                        )}
                      </td>

                      {/* Rank */}
                      <td className="px-4 py-3.5">
                        <span className={clsx(
                          'w-6 h-6 flex items-center justify-center rounded font-bold text-xs',
                          movie.rank === 1
                            ? 'bg-[#f5c518] text-slate-950 border border-[#dda20c]'
                            : 'text-slate-700 bg-slate-100 border border-slate-200',
                        )}>
                          {movie.rank}
                        </span>
                      </td>

                      {/* Weekend Gross */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-slate-900 font-mono font-bold text-sm">
                            {formatMoney(movie.gross)}
                          </span>
                          {wowChange !== null && (
                            <span className={clsx(
                              'text-[10px] font-semibold flex items-center gap-0.5 mt-0.5',
                              wowChange >= 0 ? 'text-green-700' : 'text-danger',
                            )}>
                              {wowChange >= 0
                                ? <TrendingUp className="w-2.5 h-2.5" />
                                : <TrendingDown className="w-2.5 h-2.5" />}
                              {Math.abs(wowChange).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Theaters */}
                      <td className="px-4 py-3.5 text-right text-sm text-slate-800 font-mono">
                        {movie.theaters.toLocaleString()}
                      </td>

                      {/* Avg */}
                      <td className="px-4 py-3.5 text-right text-sm text-slate-700 font-mono">
                        {formatMoney(movie.avg)}
                      </td>

                      {/* Cumulative */}
                      <td className="px-4 py-3.5 text-right text-sm text-slate-700 font-mono">
                        {formatMoneyFull(movie.total_gross)}
                      </td>

                      {/* Weeks */}
                      <td className="px-4 py-3.5 text-right">
                        <span className={clsx(
                          'kpi-badge',
                          movie.weeks === 1 ? 'kpi-badge-up' : 'kpi-badge-flat',
                        )}>
                          {movie.weeks === 1 ? '🎬 New' : `Wk ${movie.weeks}`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
