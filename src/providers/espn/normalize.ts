import type { EspnCompetition, EspnEvent, EspnScoreboardResponse } from '@/types/espn'
import type { Match, Team } from '@/types/football'
import type { ResolvedEspnLeague } from '@/config/espnLeagues'
import { teamRatingByName } from '@/data/teams'
import { normalizeEspnStatus } from './statusMap'
import { normalizeEspnStage } from './stageMap'
import { tunisFields } from '@/providers/shared'

/**
 * Normalizes one ESPN scoreboard payload into internal Matches using the
 * resolved league identity. Events whose status is not pre/in are
 * dropped here — before scoring or UI ever see them (SPEC §12).
 */
export function normalizeEspnScoreboard(
  payload: EspnScoreboardResponse,
  league: ResolvedEspnLeague,
): Match[] {
  const matches: Match[] = []
  for (const event of payload.events ?? []) {
    const match = toMatch(event, firstCompetition(event), league)
    if (match) matches.push(match)
  }
  return matches
}

function firstCompetition(event: EspnEvent): EspnCompetition | undefined {
  return event.competitions?.[0]
}

function toMatch(
  event: EspnEvent,
  competition: EspnCompetition | undefined,
  league: ResolvedEspnLeague,
): Match | null {
  if (!event.id || !competition) return null

  const status = normalizeEspnStatus(
    competition.status?.type?.state,
    competition.status?.clock,
  )
  if (!status.visible) return null

  const home = competitorBySide(competition, 'home')
  const away = competitorBySide(competition, 'away')
  if (!home || !away) return null

  const kickoff = new Date(event.date)
  if (Number.isNaN(kickoff.getTime())) return null

  return {
    id: `espn:${event.id}`,
    homeTeam: toTeam(home),
    awayTeam: toTeam(away),
    competition: {
      id: league.internalId,
      name: league.name,
      country: league.country,
      rating: league.rating,
    },
    kickoff,
    ...tunisFields(kickoff),
    stage: normalizeEspnStage(event.season?.slug),
    rawRound: event.season?.slug,
    status: status.status,
    minuteElapsed: status.minuteElapsed,
    score: parseScore(home.score, away.score),
    source: 'espn',
  }
}

function competitorBySide(competition: EspnCompetition, side: 'home' | 'away') {
  return competition.competitors?.find((c) => c.homeAway === side)
}

function parseScore(
  homeRaw: string | undefined,
  awayRaw: string | undefined,
): { home: number; away: number } | undefined {
  if (homeRaw === undefined || awayRaw === undefined) return undefined
  const home = Number.parseInt(homeRaw, 10)
  const away = Number.parseInt(awayRaw, 10)
  if (!Number.isFinite(home) || !Number.isFinite(away)) return undefined
  return { home, away }
}

function toTeam(competitor: { id: string; team?: { id?: string; displayName?: string; name?: string; logo?: string } }): Team {
  const name =
    competitor.team?.displayName ??
    competitor.team?.name ??
    competitor.team?.id ??
    'Unknown'
  return {
    id: String(competitor.team?.id ?? competitor.id),
    name,
    logo: competitor.team?.logo ?? undefined,
    rating: teamRatingByName(name),
  }
}
