/**
 * Football knowledge: competitions TnFootPulse cares about, with
 * application-owned ratings on a 0–30 scale.
 *
 * All ids below were verified against the live API directory on
 * 2026-08-25 (ticket #5), including current-season coverage.
 */

export type CompetitionConfig = {
  id: string
  name: string
  country: string
  rating: number
}

export const DEFAULT_COMPETITION_SCORE = 6

export const COMPETITION_CONFIGS: CompetitionConfig[] = [
  { id: '2', name: 'UEFA Champions League', country: 'World', rating: 30 },
  { id: '3', name: 'UEFA Europa League', country: 'World', rating: 26 },
  { id: '848', name: 'UEFA Europa Conference League', country: 'World', rating: 21 },
  { id: '39', name: 'Premier League', country: 'England', rating: 25 },
  { id: '140', name: 'La Liga', country: 'Spain', rating: 25 },
  { id: '135', name: 'Serie A', country: 'Italy', rating: 24 },
  { id: '78', name: 'Bundesliga', country: 'Germany', rating: 24 },
  { id: '61', name: 'Ligue 1', country: 'France', rating: 22 },
  { id: '13', name: 'CONMEBOL Libertadores', country: 'World', rating: 18 },
  { id: '94', name: 'Primeira Liga', country: 'Portugal', rating: 19 },
  { id: '88', name: 'Eredivisie', country: 'Netherlands', rating: 18 },
  { id: '203', name: 'Süper Lig', country: 'Turkey', rating: 17 },
  { id: '307', name: 'Saudi Pro League', country: 'Saudi Arabia', rating: 15 },
  { id: '202', name: 'Ligue 1', country: 'Tunisia', rating: 14 },
  { id: '45', name: 'FA Cup', country: 'England', rating: 12 },
  { id: '48', name: 'League Cup', country: 'England', rating: 12 },
  { id: '143', name: 'Copa del Rey', country: 'Spain', rating: 12 },
  { id: '137', name: 'Coppa Italia', country: 'Italy', rating: 12 },
  { id: '81', name: 'DFB-Pokal', country: 'Germany', rating: 11 },
  { id: '12', name: 'CAF Champions League', country: 'Africa', rating: 12 },
]

const RATINGS_BY_ID = new Map(COMPETITION_CONFIGS.map((c) => [c.id, c.rating]))

/** Rating for an API league id; falls back for allowlisted-but-unrated ids. */
export function competitionRatingById(id: string): number {
  return RATINGS_BY_ID.get(id) ?? DEFAULT_COMPETITION_SCORE
}

export function isSupportedCompetition(id: string): boolean {
  return RATINGS_BY_ID.has(id)
}

/** Distinct display name for a competition, disambiguating shared names. */
export function competitionDisplayName(config: {
  name: string
  country?: string
}): string {
  return config.country === 'World' || config.country === 'Africa'
    ? config.name
    : `${config.name} (${config.country})`
}
