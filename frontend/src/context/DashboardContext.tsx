import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Timeframe } from '../types/boxoffice'

// ── Context shape ─────────────────────────────────────────────────────────────

interface DashboardContextValue {
  selectedMovie: string | null
  setSelectedMovie: (title: string | null) => void
  timeframe: Timeframe
  setTimeframe: (t: Timeframe) => void
  isDemo: boolean
  setIsDemo: (val: boolean) => void
  toggleDemo: () => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()

  // Hydrate from URL on first render
  const [selectedMovie, _setSelectedMovie] = useState<string | null>(
    searchParams.get('movie'),
  )
  const [timeframe, _setTimeframe] = useState<Timeframe>(
    (searchParams.get('tf') as Timeframe | null) ?? 'weekend',
  )
  const [isDemo, _setIsDemo] = useState<boolean>(() => {
    const urlParam = searchParams.get('demo')
    if (urlParam !== null) {
      return urlParam === 'true' || urlParam === '1'
    }
    const saved = localStorage.getItem('boxoffice_demo_mode')
    if (saved !== null) {
      return saved === 'true'
    }
    return true
  })

  const setSelectedMovie = useCallback(
    (title: string | null) => {
      _setSelectedMovie(title)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (title) next.set('movie', title)
          else next.delete('movie')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setTimeframe = useCallback(
    (t: Timeframe) => {
      _setTimeframe(t)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('tf', t)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setIsDemo = useCallback(
    (val: boolean) => {
      _setIsDemo(val)
      try {
        localStorage.setItem('boxoffice_demo_mode', String(val))
      } catch {}
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('demo', String(val))
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const toggleDemo = useCallback(() => {
    setIsDemo(!isDemo)
  }, [isDemo, setIsDemo])

  // Sync state when browser back/forward navigation changes URL
  useEffect(() => {
    _setSelectedMovie(searchParams.get('movie'))
    _setTimeframe((searchParams.get('tf') as Timeframe | null) ?? 'weekend')
    const urlParam = searchParams.get('demo')
    if (urlParam !== null) {
      _setIsDemo(urlParam === 'true' || urlParam === '1')
    }
  }, [searchParams])

  return (
    <DashboardContext.Provider
      value={{
        selectedMovie,
        setSelectedMovie,
        timeframe,
        setTimeframe,
        isDemo,
        setIsDemo,
        toggleDemo,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used inside <DashboardProvider>')
  return ctx
}
