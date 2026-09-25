import type { ChartResponse, MovieHistoryResponse, Timeframe } from '../types/boxoffice'

// ── Mock dataset ──────────────────────────────────────────────────────────────

const MOCK_MOVIES = [
  { rank: 1,  title: 'Spider-Man: Brand New Day',     gross: 84_500_000, theaters: 4420, avg: 19117, total_gross: 382_000_000, weeks: 3, distributor: 'Sony' },
  { rank: 2,  title: 'The Odyssey',                   gross: 32_100_000, theaters: 3950, avg:  8126, total_gross: 194_500_000, weeks: 3, distributor: 'Universal' },
  { rank: 3,  title: 'The End of Oak Street',          gross: 28_800_000, theaters: 3620, avg:  7955, total_gross:  28_800_000, weeks: 1, distributor: 'Warner Bros.' },
  { rank: 4,  title: 'PAW Patrol: The Dino Movie',     gross: 19_400_000, theaters: 3350, avg:  5791, total_gross:  19_400_000, weeks: 1, distributor: 'Paramount' },
  { rank: 5,  title: 'Insidious: Out of the Further',  gross: 16_500_000, theaters: 2890, avg:  5709, total_gross:  16_500_000, weeks: 1, distributor: 'Sony' },
  { rank: 6,  title: 'Mutiny',                         gross: 10_200_000, theaters: 2500, avg:  4080, total_gross:  10_200_000, weeks: 1, distributor: 'Lionsgate' },
  { rank: 7,  title: 'Coyote vs. Acme',                gross:  8_900_000, theaters: 2100, avg:  4238, total_gross:   8_900_000, weeks: 1, distributor: 'Warner Bros.' },
  { rank: 8,  title: 'The Dog Stars',                  gross:  6_400_000, theaters: 1800, avg:  3555, total_gross:   6_400_000, weeks: 1, distributor: 'Disney' },
  { rank: 9,  title: 'Ember Road',                     gross:  3_200_000, theaters: 1450, avg:  2206, total_gross:  19_800_000, weeks: 3, distributor: 'Focus Features' },
  { rank: 10, title: 'Polar Night',                    gross:  1_800_000, theaters:  950, avg:  1894, total_gross:  12_400_000, weeks: 4, distributor: 'NEON' },
]

// Slight variation per timeframe so switching tabs feels meaningful
const TIMEFRAME_MULTIPLIERS: Record<Timeframe, number> = {
  weekend: 1.00,
  weekly:  2.30,
  daily:   0.18,
  monthly: 8.50,
}

function mockChart(tf: Timeframe): ChartResponse {
  const mul = TIMEFRAME_MULTIPLIERS[tf]
  return {
    source: 'mock',
    movies: MOCK_MOVIES.map((m) => ({
      ...m,
      gross:       Math.round(m.gross * mul),
      avg:         Math.round(m.avg   * mul),
      total_gross: Math.round(m.total_gross * mul),
    })),
  }
}

// Realistic weekly decay for each mock movie
const HISTORIES: Record<string, Array<{ week: number; gross: number; theaters: number; avg: number }>> = {
  'Spider-Man: Brand New Day': [
    { week: 1, gross: 145_000_000, theaters: 4420, avg: 32805 },
    { week: 2, gross: 96_000_000,  theaters: 4420, avg: 21719 },
    { week: 3, gross: 84_500_000,  theaters: 4420, avg: 19117 },
  ],
  'The Odyssey': [
    { week: 1, gross: 68_000_000, theaters: 3950, avg: 17215 },
    { week: 2, gross: 44_000_000, theaters: 3950, avg: 11139 },
    { week: 3, gross: 32_100_000, theaters: 3950, avg: 8126 },
  ],
  'Ember Road': [
    { week: 1, gross: 8_200_000, theaters: 1450, avg: 5655 },
    { week: 2, gross: 5_100_000, theaters: 1450, avg: 3517 },
    { week: 3, gross: 3_200_000, theaters: 1450, avg: 2206 },
  ],
  'Polar Night': [
    { week: 1, gross: 6_200_000, theaters: 950, avg: 6526 },
    { week: 2, gross: 3_900_000, theaters: 950, avg: 4105 },
    { week: 3, gross: 2_400_000, theaters: 950, avg: 2526 },
    { week: 4, gross: 1_800_000, theaters: 950, avg: 1894 },
  ],
}

function mockHistory(title: string): Array<{ week: number; gross: number; theaters: number; avg: number }> {
  if (HISTORIES[title]) return HISTORIES[title]
  // Generate synthetic decay for unlisted titles
  const seed = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const opening = 15_000_000 + (seed % 40_000_000)
  const rows = []
  let gross = opening
  for (let w = 1; w <= 6; w++) {
    const theaters = Math.max(600, 3800 - (w - 1) * 500)
    rows.push({ week: w, gross: Math.round(gross), theaters, avg: Math.round(gross / theaters) })
    gross *= 0.50 + ((seed % 17) / 100)
    if (gross < 400_000) break
  }
  return rows
}

// Simulate a tiny async delay so loading states are visible
const delay = (ms = 280) => new Promise<void>((r) => setTimeout(r, ms))

// ── Public API ────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:8080/api'

export async function fetchWeekend(demo = false): Promise<ChartResponse> {
  const query = demo ? '?demo=true' : ''
  try {
    const res = await fetch(`${API_BASE}/weekend${query}`, {
      signal: demo ? AbortSignal.timeout(2000) : undefined,
    })
    if (!res.ok) throw new Error('Backend error')
    return await res.json()
  } catch (e) {
    if (!demo) console.warn('FastAPI backend failed, falling back to mock data:', e)
    await delay(demo ? 80 : 280)
    return mockChart('weekend')
  }
}

export async function fetchWeekly(demo = false): Promise<ChartResponse> {
  const query = demo ? '?demo=true' : ''
  try {
    const res = await fetch(`${API_BASE}/weekly${query}`, {
      signal: demo ? AbortSignal.timeout(2000) : undefined,
    })
    if (!res.ok) throw new Error('Backend error')
    return await res.json()
  } catch (e) {
    if (!demo) console.warn('FastAPI backend failed, falling back to mock data:', e)
    await delay(demo ? 80 : 280)
    return mockChart('weekly')
  }
}

export async function fetchDaily(demo = false): Promise<ChartResponse> {
  const query = demo ? '?demo=true' : ''
  try {
    const res = await fetch(`${API_BASE}/daily${query}`, {
      signal: demo ? AbortSignal.timeout(2000) : undefined,
    })
    if (!res.ok) throw new Error('Backend error')
    return await res.json()
  } catch (e) {
    if (!demo) console.warn('FastAPI backend failed, falling back to mock data:', e)
    await delay(demo ? 80 : 280)
    return mockChart('daily')
  }
}

export async function fetchMonthly(demo = false): Promise<ChartResponse> {
  const query = demo ? '?demo=true' : ''
  try {
    const res = await fetch(`${API_BASE}/monthly${query}`, {
      signal: demo ? AbortSignal.timeout(2000) : undefined,
    })
    if (!res.ok) throw new Error('Backend error')
    return await res.json()
  } catch (e) {
    if (!demo) console.warn('FastAPI backend failed, falling back to mock data:', e)
    await delay(demo ? 80 : 280)
    return mockChart('monthly')
  }
}

export async function fetchMovieHistory(title: string, demo = false): Promise<MovieHistoryResponse> {
  const query = demo ? '&demo=true' : ''
  try {
    const res = await fetch(`${API_BASE}/movie/history?title=${encodeURIComponent(title)}${query}`, {
      signal: demo ? AbortSignal.timeout(2000) : undefined,
    })
    if (!res.ok) throw new Error('Backend error')
    return await res.json()
  } catch (e) {
    if (!demo) console.warn('FastAPI backend failed, falling back to mock data:', e)
    await delay(demo ? 100 : 400)
    return { source: 'mock', title, history: mockHistory(title) }
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatMoney(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000)     return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)         return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toLocaleString()}`
}

export function formatMoneyFull(value: number): string {
  return `$${value.toLocaleString()}`
}

export function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}
