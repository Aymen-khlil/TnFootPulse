import type { Match, ScoredMatch } from '@/types/football'
import { calculatePriority } from '@/scoring/calculatePriority'
import { mergeMatches } from '@/providers/merge'
import {
  providerRequestCache,
} from '@/cache/providerCache'
import {
  API_FOOTBALL_MAX_DAYS_AHEAD,
  AGENDA_TTL_EMPTY_MS,
  AGENDA_TTL_FRESH_MS,
  FOOTBALL_DATA_RANGE_DAYS,
} from '@/config/limits'
import {
  fetchFootballDataMatchesInRange,
} from '@/providers/footballData/transport'
import {
  fetchApiFootballFixturesByDate,
  FootballApiError,
} from '@/providers/apiFootball/transport'
import { shiftDateKey, todayInTunis } from '@/utils/timezone'

export type AgendaDeps = {
  fetchFootballData: (range: { from: string; to: string }) => Promise<Match[]>
  fetchApiFootball: (dateKey: string) => Promise<Match[]>
}

export const defaultAgendaDeps: AgendaDeps = {
  fetchFootballData: ({ from, to }) =>
    fetchFootballDataMatchesInRange({ fromKey: from, toKey: to }),
  fetchApiFootball: (dateKey) => fetchApiFootballFixturesByDate({ dateKey }),
}

export type AgendaResult = {
  matches: ScoredMatch[]
  /** Non-blocking explanation when one provider contributed nothing. */
  providerNotices: string[]
}

/**
 * Single orchestration point: date → both providers (respecting their
 * different capabilities/windows) → normalized merges → dedupe → score
 * → priority-sorted agenda. Scoring receives only provider-independent
 * internal Matches; the UI consumes ScoredMatch[] blindly.
 *
 * Results are cached per date (`agenda:<key>`) on top of the
 * provider-scoped request caches, so revisiting a date costs nothing.
 * Entries carry a freshness window (Option C): fresh agendas live 3h,
 * empty ones 10min — providers can retract or release fixtures and the
 * agenda heals without user action.
 */
export async function getAgendaForDate(
  dateKey: string,
  deps: AgendaDeps = defaultAgendaDeps,
): Promise<AgendaResult> {
  return providerRequestCache.run(
    `agenda:${dateKey}`,
    async () => {
    // Week-aligned fd.org window: any two dates inside the same 7-day
    // block share ONE cached ranged request instead of refetching.
    const { from, to } = footballDataWindowFor(dateKey)

    const attempts: Array<Promise<Match[]>> = []
    const failures: unknown[] = []
    const providerNotices: string[] = []

    const fdJob = deps
      .fetchFootballData({ from, to })
      .catch((error: unknown) => {
        failures.push(error)
        providerNotices.push(
          'European fixtures are unavailable right now (football-data.org).',
        )
        return [] as Match[]
      })
    attempts.push(fdJob)

    let afJob: Promise<Match[]> | null = null
    if (apiFootballWindowAllows(dateKey)) {
      afJob = deps.fetchApiFootball(dateKey).catch((error: unknown) => {
        // Free-plan future-date rejection: graceful no-op for this
        // provider — expected behavior, not surfaced as a notice.
        if (error instanceof FootballApiError && error.code === 'plan-date-restricted') {
          warnDev('API-Football rejected the date as outside the free-plan window.')
          return [] as Match[]
        }
        failures.push(error)
        providerNotices.push(
          'Tunisian and other league fixtures may be incomplete right now.',
        )
        return [] as Match[]
      })
      attempts.push(afJob)
    }

    const [fdMatches, afMatches] = await Promise.all([
      fdJob,
      afJob ?? Promise.resolve([] as Match[]),
    ])

    const combined = mergeMatches(fdMatches, afMatches)

    // HARD RULE: an agenda for a date contains ONLY that Tunisian
    // calendar day's matches — the fd.org range exists purely as a
    // network-efficiency device, never as extra display content.
    const dayCombined = combined.filter((m) => m.tunisDateKey === dateKey)

    if (dayCombined.length === 0 && failures.length === attempts.length && failures.length > 0) {
      throw failures[0]
    }
    if (failures.length > 0) {
      warnDev(
        `${failures.length} provider(s) failed but partial results are available; continuing.`,
      )
    }

    return {
      matches: dayCombined
        .map((match) => ({ match, priority: calculatePriority(match) }))
        .sort(
          (a, b) =>
            b.priority.total - a.priority.total ||
            a.match.kickoff.getTime() - b.match.kickoff.getTime(),
        ),
      providerNotices,
    }
    },
    (result) => (result.matches.length > 0 ? AGENDA_TTL_FRESH_MS : AGENDA_TTL_EMPTY_MS),
  )
}

/** Initial-load prefetch of tomorrow (SPEC §7 parallel warm-up). */
export function prefetchTomorrow(deps: AgendaDeps = defaultAgendaDeps): void {
  void getAgendaForDate(shiftDateKey(todayInTunis(), 1), deps).catch(() => {})
}

export function resetAgendaCache(): void {
  providerRequestCache.clear()
}

/**
 * Week-aligned fd.org window containing `dateKey`: anchored on today,
 * stepped in whole 7-day blocks so consecutive selected dates reuse the
 * same cached ranged request (today+tomorrow share block 0, etc.).
 */
function footballDataWindowFor(dateKey: string): { from: string; to: string } {
  const today = todayInTunis()
  const offset = daysBetween(today, dateKey)
  const index = Math.floor(offset / FOOTBALL_DATA_RANGE_DAYS)
  const from = shiftDateKey(today, index * FOOTBALL_DATA_RANGE_DAYS)
  return { from, to: shiftDateKey(from, FOOTBALL_DATA_RANGE_DAYS - 1) }
}

/**
 * Conservative local guard so we never waste quota on requests the free
 * plan is known to reject. NOT a guaranteed availability window — the
 * authoritative signal is the API's own 'plan-date-restricted' reply.
 */
function apiFootballWindowAllows(dateKey: string): boolean {
  const today = todayInTunis()
  return (
    daysBetween(today, dateKey) >= 0 &&
    daysBetween(today, dateKey) <= API_FOOTBALL_MAX_DAYS_AHEAD
  )
}

/** Whole-day difference between two YYYY-MM-DD keys (b - a). */
function daysBetween(a: string, b: string): number {
  const start = new Date(`${a}T00:00:00Z`).getTime()
  const end = new Date(`${b}T00:00:00Z`).getTime()
  return Math.round((end - start) / 86_400_000)
}

function warnDev(message: string): void {
  if (import.meta.env.DEV) console.warn(`[fixturesOrchestrator] ${message}`)
}
