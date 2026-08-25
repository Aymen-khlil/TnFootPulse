/** Raw football-data.org v4 payload shapes (matches list). */

export type FootballDataTeamRef = {
  id: number
  name: string
  shortName?: string
  tla?: string
  crest?: string | null
}

export type FootballDataCompetitionRef = {
  id: number
  name: string
  code: string
  type?: string
  emblem?: string | null
}

export type FootballDataMatch = {
  id: number
  /** ISO-8601 UTC, e.g. "2026-10-20T19:00:00Z". v4 has no timezone param. */
  utcDate: string
  status: string
  minute?: string | null
  matchday?: number | null
  stage?: string | null
  group?: string | null
  competition: FootballDataCompetitionRef
  homeTeam: FootballDataTeamRef
  awayTeam: FootballDataTeamRef
  score: {
    winner: string | null
    duration: string
    fullTime: { home: number | null; away: number | null }
    halfTime: { home: number | null; away: number | null }
  }
}

export type FootballDataMatchesResponse = {
  filters?: Record<string, unknown>
  resultSet?: {
    count: number
    first?: string
    last?: string
    played?: number
  }
  matches: FootballDataMatch[]
}
