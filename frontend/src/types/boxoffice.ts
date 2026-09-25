// ── Core movie data from the /api/weekend | /api/weekly | /api/daily | /api/monthly endpoints ──

export interface Movie {
  rank: number
  title: string
  gross: number        // raw integer, e.g. 48200000
  theaters: number
  avg: number
  total_gross: number
  weeks: number
  distributor: string
}

export interface ChartResponse {
  source: 'live' | 'mock'
  year?: number
  week?: number
  month?: number
  date?: string
  movies: Movie[]
}

// ── Weekly history for a single movie (drill-down) ──

export interface WeekHistory {
  week: number
  gross: number
  theaters: number
  avg: number
}

export interface MovieHistoryResponse {
  source: 'live' | 'mock'
  title: string
  history: WeekHistory[]
}

// ── Timeframe options ──

export type Timeframe = 'weekend' | 'weekly' | 'daily' | 'monthly'

// ── Query params for each timeframe ──

export interface TimeframeParams {
  weekend:  { year: number; week: number }
  weekly:   { year: number; week: number }
  daily:    { date: string }
  monthly:  { year: number; month: number }
}
