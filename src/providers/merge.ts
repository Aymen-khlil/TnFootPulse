import type { Match } from '@/types/football'
import { canonicalTeamName } from '@/data/teams'
import { normalizeTeamName } from '@/utils/normalizeName'
import { DEDUPLICATION_WINDOW_MINUTES } from '@/config/limits'

/**
 * Provider-independent match merging/deduplication.
 *
 * Provider ids are never assumed globally unique. Identity falls back to
 * a composite of normalized competition + canonical team names, with a
 * ±15-minute kickoff tolerance so small timestamp/naming drift between
 * providers cannot produce duplicates.
 *
 * Groups are passed in preference order: when duplicates collapse, the
 * earliest-passed copy wins.
 */
export function mergeMatches(...groups: Match[][]): Match[] {
  const byIdentity = new Map<string, Match[]>()

  for (const match of groups.flat()) {
    const key = identityKey(match)
    const bucket = byIdentity.get(key)
    if (bucket) bucket.push(match)
    else byIdentity.set(key, [match])
  }

  const merged: Match[] = []
  for (const candidates of byIdentity.values()) {
    candidates.sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime())
    let kept: Match | null = null
    for (const candidate of candidates) {
      if (
        kept &&
        Math.abs(candidate.kickoff.getTime() - kept.kickoff.getTime()) <=
          DEDUPLICATION_WINDOW_MINUTES * 60_000
      ) {
        continue // duplicate — earlier-passed copy already kept
      }
      kept = candidate
      merged.push(candidate)
    }
  }

  return merged.sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime())
}

function identityKey(match: Match): string {
  return [
    match.competition.id,
    normalizeTeamName(canonicalTeamName(match.homeTeam.name)),
    normalizeTeamName(canonicalTeamName(match.awayTeam.name)),
  ].join('|')
}
