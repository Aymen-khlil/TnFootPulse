import { canonicalTeamName } from '@/data/teams'
import { normalizeTeamName } from '@/utils/normalizeName'

/**
 * Football knowledge: the top 20 of UEFA's five-year sporting club
 * coefficient, curated once per season (ADR-0002). Source: kassiesa.net
 * five-year ranking used for seeding; verified against the live table
 * on 2026-08-25. Names use TnFootPulse canonical team names so lookups
 * resolve through the shared alias map.
 */

export const UEFA_RANKING_SEASON = '2026/27'

export type UefaRankedClub = {
  rank: number
  name: string
}

export const UEFA_TOP20: UefaRankedClub[] = [
  { rank: 1, name: 'Bayern Munich' },
  { rank: 2, name: 'Arsenal' },
  { rank: 3, name: 'Real Madrid' },
  { rank: 4, name: 'PSG' },
  { rank: 5, name: 'Inter' },
  { rank: 6, name: 'Manchester City' },
  { rank: 7, name: 'Barcelona' },
  { rank: 8, name: 'Liverpool' },
  { rank: 9, name: 'Borussia Dortmund' },
  { rank: 10, name: 'Bayer Leverkusen' },
  { rank: 11, name: 'Atlético Madrid' },
  { rank: 12, name: 'Aston Villa' },
  { rank: 13, name: 'Roma' },
  { rank: 14, name: 'Tottenham' },
  { rank: 15, name: 'Porto' },
  { rank: 16, name: 'Fiorentina' },
  { rank: 17, name: 'Club Brugge' },
  { rank: 18, name: 'Chelsea' },
  { rank: 19, name: 'Sporting CP' },
  { rank: 20, name: 'Benfica' },
]

const RANK_BY_NORMALIZED_NAME = new Map<string, number>(
  UEFA_TOP20.map(({ rank, name }) => [normalizeTeamName(canonicalTeamName(name)), rank]),
)

/** UEFA coefficient rank for any provider spelling; undefined when unranked. */
export function uefaRankByName(name: string): number | undefined {
  return RANK_BY_NORMALIZED_NAME.get(normalizeTeamName(canonicalTeamName(name)))
}
