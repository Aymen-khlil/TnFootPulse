export type ProviderId = 'football-data' | 'api-football' | 'espn'

/**
 * Which exclusive data pipeline produces the visible agenda (CONTEXT.md:
 * "Source Mode"). Modes never mix — see docs/adr/0003.
 */
export type SourceMode = 'curated' | 'espn'

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
  /** Stable internal identity (canonical dataset slug/id). */
  internalId?: string
  id: string
  name: string
  logo?: string
  /** Application-owned rating on a 0–100 scale (curated or fallback). */
  rating: number
  /** Provider-specific ids are optional metadata; never required. */
  apiFootballId?: number
  footballDataId?: number
}

export type Competition = {
  /** Stable TnFootPulse internal id — decoupled from both providers. */
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
  /** Provider-native round/stage value, preserved for debugging. */
  rawRound?: string
  status: MatchStatus
  minuteElapsed?: number
  score?: { home: number; away: number }
  /**
   * Debugging/tracing metadata ONLY. Must never be read by scoring,
   * rivalry detection, importance weighting, or UI rendering.
   */
  source?: ProviderId
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
  /** Pedigree top-up (ADR-0002): fills the gap to the club pedigree floor; 0 when none applies. */
  pedigree: number
  category: PriorityCategoryName
  reasons: string[]
}
