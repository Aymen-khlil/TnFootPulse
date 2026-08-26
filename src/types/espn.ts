/**
 * Minimal structural types for ESPN's unofficial site API scoreboard
 * payloads. Shaped against live responses observed 2026-08-26; kept
 * permissive because the API is undocumented and may drift.
 */

export type EspnCompetitor = {
  id: string
  homeAway: 'home' | 'away'
  score?: string
  team: {
    id: string
    displayName?: string
    shortDisplayName?: string
    name?: string
    abbreviation?: string
    logo?: string
  }
}

export type EspnStatusType = {
  state?: 'pre' | 'in' | 'post'
  completed?: boolean
  description?: string
  shortDetail?: string
  detail?: string
}

export type EspnCompetition = {
  competitors?: EspnCompetitor[]
  status?: {
    clock?: number
    displayClock?: string
    period?: number
    type?: EspnStatusType
  }
  notes?: Array<{ text?: string } | string>
}

export type EspnEvent = {
  id: string
  uid?: string
  date: string
  name?: string
  shortName?: string
  season?: { year?: number; slug?: string }
  competitions?: EspnCompetition[]
}

export type EspnScoreboardResponse = {
  leagues?: unknown[]
  events?: EspnEvent[]
  day?: { date?: string }
}
