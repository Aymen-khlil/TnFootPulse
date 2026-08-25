import type { ApiFixture, ApiFixturesResponse } from '@/types/api'
import type { Match, Team } from '@/types/football'
import { competitionRatingById, isSupportedCompetition } from '@/data/competitions'
import { teamRatingByName } from '@/data/teams'
import { normalizeStatus } from './statusMap'
import { normalizeStage } from './normalizeStage'
import { tunisDateKey, tunisMinuteOfDay } from '@/utils/timezone'

/**
 * Normalizes a raw fixtures-by-date payload into internal Match models.
 * Drops non-allowlisted competitions and invisible statuses BEFORE the
 * scoring engine ever sees them. Kickoff instants carry Tunis calendar
 * fields derived here so scoring never touches timezone logic itself.
 */
export function normalizeFixtures(payload: ApiFixturesResponse): Match[] {
  const matches: Match[] = []
  for (const apiFixture of payload.response) {
    const leagueId = String(apiFixture.league.id)
    if (!isSupportedCompetition(leagueId)) continue

    const status = normalizeStatus(
      apiFixture.fixture.status.short,
      apiFixture.fixture.status.elapsed,
    )
    if (!status.visible) continue

    matches.push(toMatch(apiFixture, status))
  }
  return matches
}

function toMatch(
  api: ApiFixture,
  status: ReturnType<typeof normalizeStatus>,
): Match {
  const kickoff = new Date(api.fixture.date)

  return {
    id: String(api.fixture.id),
    homeTeam: toTeam(api.teams.home),
    awayTeam: toTeam(api.teams.away),
    competition: {
      id: String(api.league.id),
      name: api.league.name,
      country: api.league.country,
      logo: api.league.logo ?? undefined,
      rating: competitionRatingById(String(api.league.id)),
    },
    kickoff,
    tunisDateKey: tunisDateKey(kickoff),
    tunisMinuteOfDay: tunisMinuteOfDay(kickoff),
    stage: normalizeStage(api.league.round),
    rawRound: api.league.round,
    status: status.status,
    minuteElapsed: status.minuteElapsed,
    score:
      api.goals.home !== null && api.goals.away !== null
        ? { home: api.goals.home, away: api.goals.away }
        : undefined,
  }
}

function toTeam(ref: { id: number; name: string; logo: string | null }): Team {
  return {
    id: String(ref.id),
    name: ref.name,
    logo: ref.logo ?? undefined,
    rating: teamRatingByName(ref.name),
  }
}
