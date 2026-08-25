import { UEFA_TOP20, uefaRankByName } from '@/data/uefaClubRankings'
import { tunisianEliteCount } from '@/data/tunisianEliteClubs'

/**
 * Club pedigree floors (ADR-0002): a minimum Pulse Score for matches
 * whose clubs carry proven standing. The floor is enforced by the
 * engine as a "pedigree" top-up component, so the Intelligence Report
 * stays honest about why a total was lifted.
 *
 * Two independent systems, combined best-floor-wins:
 *  - UEFA top 20 (both-team trigger): ranks 1–10 → 90, 11–15 → 80,
 *    16–20 → 70.
 *  - Tunisian elite (one-team trigger): any elite club → 70; two elite
 *    clubs facing each other → 80.
 *
 * Neither system fires for friendlies — preseason games must not
 * inherit competitive stakes.
 */

export type PedigreeFloor = {
  floor: number
  /** Human-readable justification, verbatim into the reasons list. */
  reasonLabel: string
}

const CANONICAL_NAME_BY_RANK = new Map<number, string>(
  UEFA_TOP20.map(({ rank, name }) => [rank, name]),
)

/**
 * Friendly detection must survive provider naming variety in a
 * Tunisia-first feed: English ("Club Friendly Games"), French
 * ("Match amical") and Spanish ("Amistoso") all occur.
 */
const FRIENDLY_PATTERN = /friendl|amical|amistoso/i

export function pedigreeFloor(
  homeName: string,
  awayName: string,
  competitionName: string,
): PedigreeFloor | null {
  if (FRIENDLY_PATTERN.test(competitionName)) return null

  const candidates = [uefaBothTeamFloor(homeName, awayName), tunisianEliteFloor(homeName, awayName)]
  const applicable = candidates.filter((c): c is PedigreeFloor => c !== null)

  if (applicable.length === 0) return null
  return applicable.reduce((best, next) => (next.floor > best.floor ? next : best))
}

function uefaBothTeamFloor(homeName: string, awayName: string): PedigreeFloor | null {
  const homeRank = uefaRankByName(homeName)
  const awayRank = uefaRankByName(awayName)
  if (homeRank === undefined || awayRank === undefined) return null

  // Best-floor-wins: the stronger-ranked side sets the binding floor,
  // and its rank anchors the reason label.
  const bindingRank = Math.min(homeRank, awayRank)
  const floor = bindingRank <= 10 ? 90 : bindingRank <= 15 ? 80 : 70
  const name = CANONICAL_NAME_BY_RANK.get(bindingRank) ?? 'ranked club'
  return { floor, reasonLabel: `UEFA pedigree — ${name} (rank ${bindingRank})` }
}

function tunisianEliteFloor(homeName: string, awayName: string): PedigreeFloor | null {
  const eliteCount = tunisianEliteCount(homeName, awayName)
  if (eliteCount === 0) return null
  const floor = eliteCount === 2 ? 80 : 70
  return { floor, reasonLabel: 'Tunisian elite pedigree' }
}
