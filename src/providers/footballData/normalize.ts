import type { FootballDataMatch, FootballDataMatchesResponse } from '@/types/footballData'
import type { Match, Team } from '@/types/football'
import { competitionByFootballDataCode } from '@/data/competitions'
import { teamRatingByName } from '@/data/teams'
import { normalizeStatus } from './statusMap'
import { normalizeStage } from './stageMap'
import { tunisFields } from '@/providers/shared'

/**
 * Normalizes a raw football-data.org matches payload into the same
 * internal Match model the API-Football provider emits. Competitions
 * without routing config are dropped before scoring/UI.
 */
export function normalizeFootballDataMatches(payload: FootballDataMatchesResponse): Match[] {
  const matches: Match[] = []
  for (const fd of payload.matches) {
    const competitionConfig = competitionByFootballDataCode(fd.competition.code)
    if (!competitionConfig) continue

    const status = normalizeStatus(fd.status)
    if (!status.visible) continue

    matches.push(toMatch(fd, competitionConfig.internalId, status))
  }
  return matches
}

function toMatch(
  fd: FootballDataMatch,
  internalCompetitionId: string,
  status: ReturnType<typeof normalizeStatus>,
): Match {
  const kickoff = new Date(fd.utcDate) // UTC instant — Tunis fields derived here
  const competitionConfig = competitionByFootballDataCode(fd.competition.code)!
  const score =
    fd.score.fullTime.home !== null && fd.score.fullTime.away !== null
      ? { home: fd.score.fullTime.home, away: fd.score.fullTime.away }
      : undefined

  return {
    id: `fd:${fd.id}`,
    homeTeam: toTeam(fd.homeTeam),
    awayTeam: toTeam(fd.awayTeam),
    competition: {
      id: internalCompetitionId,
      name: competitionConfig.name,
      country: competitionConfig.country,
      logo: fd.competition.emblem ?? undefined,
      rating: competitionConfig.rating,
    },
    kickoff,
    ...tunisFields(kickoff),
    stage: normalizeStage(fd.stage),
    rawRound:
      fd.stage ?? (fd.matchday != null ? `Matchday ${fd.matchday}` : undefined),
    status: status.status,
    score,
    source: 'football-data',
  }
}

function toTeam(ref: { id: number; name: string; crest?: string | null }): Team {
  return {
    id: String(ref.id),
    name: ref.name,
    logo: ref.crest ?? undefined,
    rating: teamRatingByName(ref.name),
    footballDataId: ref.id,
  }
}
