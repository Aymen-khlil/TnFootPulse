export type StageKind =
  | 'final'
  | 'semi-final'
  | 'quarter-final'
  | 'knockout-round'
  | 'playoff'
  | 'group-phase'
  | 'league-match'

export type MatchStatus = 'scheduled' | 'live'

export type Team = {
  id: string
  name: string
  logo?: string
  /** Application-owned rating on a 0–100 scale (curated or fallback). */
  rating: number
}

export type Competition = {
  /** API-Football league id. */
  id: string
  name: string
  country?: string
  logo?: string
  /** Application-owned rating on a 0–30 scale. */
  rating: number
}

export type Match = {
  id: string
  homeTeam: Team
  awayTeam: Team
  competition: Competition
  kickoff: Date
  /** Calendar day of kickoff in Africa/Tunis, YYYY-MM-DD. */
  tunisDateKey: string
  /** Minutes since Tunis midnight (0–1439). */
  tunisMinuteOfDay: number
  stage: StageKind
  /** Original API round string, preserved for debugging/explanation. */
  rawRound?: string
  status: MatchStatus
  minuteElapsed?: number
  score?: { home: number; away: number }
}

export type ScoredMatch = {
  match: Match
  priority: PriorityResult
}

export type PriorityCategoryName =
  | 'must-watch'
  | 'high-priority'
  | 'worth-watching'
  | 'if-you-have-time'
  | 'low-priority'

export type PriorityResult = {
  total: number
  competition: number
  teams: number
  context: number
  tunisiaTime: number
  category: PriorityCategoryName
  reasons: string[]
}
