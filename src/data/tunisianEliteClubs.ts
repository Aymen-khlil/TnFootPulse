import { canonicalTeamName } from '@/data/teams'
import { normalizeTeamName } from '@/utils/normalizeName'

/**
 * Football knowledge: Tunisia's four historically dominant clubs
 * (ADR-0002). A fixed list, consciously maintained — not a rating
 * threshold — so membership changes are deliberate decisions.
 */

export const TUNISIAN_ELITE_CLUBS: readonly string[] = [
  'Espérance de Tunis',
  'Club Africain',
  'Étoile du Sahel',
  'CS Sfaxien',
]

const ELITE_NORMALIZED = new Set(
  TUNISIAN_ELITE_CLUBS.map((name) => normalizeTeamName(canonicalTeamName(name))),
)

function isTunisianElite(name: string): boolean {
  return ELITE_NORMALIZED.has(normalizeTeamName(canonicalTeamName(name)))
}

/** How many of the two sides are Tunisian elite clubs (0, 1 or 2). */
export function tunisianEliteCount(teamAName: string, teamBName: string): 0 | 1 | 2 {
  return (Number(isTunisianElite(teamAName)) + Number(isTunisianElite(teamBName))) as 0 | 1 | 2
}
