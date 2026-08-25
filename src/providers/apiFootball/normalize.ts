import type { ApiFixture, ApiFixturesResponse } from '@/types/api'
import type { Match, Team } from '@/types/football'
import { competitionByApiFootballLeagueId } from '@/data/competitions'
import { teamRatingByName } from '@/data/teams'
import { normalizeStatus } from './statusMap'
import { normalizeStage } from './stageMap'
import { tunisFields } from '@/providers/shared'

/**
 * Normalizes a raw API-Football fixtures-by-date payload into internal
 * Match models. Competitions without routing config are dropped here —
 * before scoring or UI ever see them.
 */
export function normalizeApiFootballFixtures(payload: ApiFixturesResponse): Match[] {
  const matches: Match[] = []
  for (const apiFixture of payload.response) {
    const competitionConfig = competitionByApiFootballLeagueId(apiFixture.league.id)
    if (!competitionConfig) continue

    const status = normalizeStatus(
      apiFixture.fixture.status.short,
      apiFixture.fixture.status.elapsed,
    )
    if (!status.visible) continue

    matches.push(toMatch(apiFixture, competitionConfig.internalId, status))
  }
  return matches
}

function toMatch(
  api: ApiFixture,
  internalCompetitionId: string,
  status: ReturnType<typeof normalizeStatus>,
): Match {
  const kickoff = new Date(api.fixture.date)
  const competitionConfig = competitionByApiFootballLeagueId(api.league.id)!

  return {
    id: `af:${api.fixture.id}`,
    homeTeam: toTeam(api.teams.home),
    awayTeam: toTeam(api.teams.away),
    competition: {
      id: internalCompetitionId,
      name: competitionConfig.name,
      country: competitionConfig.country,
      logo: api.league.logo ?? undefined,
      rating: competitionConfig.rating,
    },
    kickoff,
    ...tunisFields(kickoff),
    stage: normalizeStage(api.league.round),
    rawRound: api.league.round,
    status: status.status,
    minuteElapsed: status.minuteElapsed,
    score:
      api.goals.home !== null && api.goals.away !== null
        ? { home: api.goals.home, away: api.goals.away }
        : undefined,
    source: 'api-football',
  }
}

function toTeam(ref: { id: number; name: string; logo: string | null }): Team {
  return {
    id: String(ref.id),
    name: ref.name,
    logo: ref.logo ?? undefined,
    rating: teamRatingByName(ref.name),
    apiFootballId: ref.id,
  }
}
