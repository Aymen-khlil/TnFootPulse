import { normalizeTeamName } from '@/utils/normalizeName'

/**
 * Football knowledge: known rivalries. Single tier (+10) for MVP;
 * the weight field leaves room for future tiers (e.g. historic +8).
 */
export type Rivalry = {
  teams: [string, string]
  weight: number
}

export const RIVALRIES: Rivalry[] = [
  { teams: ['Barcelona', 'Real Madrid'], weight: 10 },
  { teams: ['Liverpool', 'Manchester United'], weight: 10 },
  { teams: ['Arsenal', 'Tottenham'], weight: 10 },
  { teams: ['Inter', 'AC Milan'], weight: 10 },
  { teams: ['Espérance de Tunis', 'Club Africain'], weight: 10 },
  { teams: ['Espérance de Tunis', 'Étoile du Sahel'], weight: 10 },
]

const NORMALIZED_PAIRS: Array<readonly [string, string]> = RIVALRIES.map(
  ({ teams }) => [normalizeTeamName(teams[0]), normalizeTeamName(teams[1])] as const,
)

/** True when the two clubs form one of the configured rivalries (either order). */
export function isRivalry(teamAName: string, teamBName: string): boolean {
  const a = normalizeTeamName(teamAName)
  const b = normalizeTeamName(teamBName)
  return NORMALIZED_PAIRS.some(
    ([x, y]) => (a === x && b === y) || (a === y && b === x),
  )
}
