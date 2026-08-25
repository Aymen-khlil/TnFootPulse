import type { Match, ScoredMatch } from '@/types/football'
import { calculatePriority } from '@/scoring/calculatePriority'
import { mergeMatches } from '@/providers/merge'
import {
  providerRequestCache,
} from '@/cache/providerCache'
import {
  API_FOOTBALL_MAX_DAYS_AHEAD,
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

/**
 * Single orchestration point: date → both providers (respecting their
 * different capabilities/windows) → normalized merges → dedupe → score
 * → priority-sorted agenda. Scoring receives only provider-independent
 * internal Matches; the UI consumes ScoredMatch[] blindly.
 *
 * Results are cached per date (`agenda:<key>`) on top of the
 * provider-scoped request caches, so revisiting a date costs nothing.
 */
export async function getAgendaForDate(
  dateKey: string,
  deps: AgendaDeps = defaultAgendaDeps,
): Promise<ScoredMatch[]> {
  return providerRequestCache.run(`agenda:${dateKey}`, async () => {
    const from = dateKey
    const to = shiftDateKey(dateKey, FOOTBALL_DATA_RANGE_DAYS - 1)

    const attempts: Array<Promise<Match[]>> = []
    const failures: unknown[] = []

    const fdJob = deps
      .fetchFootballData({ from, to })
      .catch((error: unknown) => {
        failures.push(error)
        return [] as Match[]
      })
    attempts.push(fdJob)

    let afJob: Promise<Match[]> | null = null
    if (apiFootballWindowAllows(dateKey)) {
      afJob = deps.fetchApiFootball(dateKey).catch((error: unknown) => {
        // Free-plan future-date rejection: graceful no-op for this
        // provider — never surfaced as an app error, never retried here.
        if (error instanceof FootballApiError && error.code === 'plan-date-restricted') {
          warnDev('API-Football rejected the date as outside the free-plan window.')
          return [] as Match[]
        }
        failures.push(error)
        return [] as Match[]
      })
      attempts.push(afJob)
    }

    const [fdMatches, afMatches] = await Promise.all([
      fdJob,
      afJob ?? Promise.resolve([] as Match[]),
    ])

    const combined = mergeMatches(fdMatches, afMatches)

    if (combined.length === 0 && failures.length === attempts.length && failures.length > 0) {
      throw failures[0]
    }
    if (failures.length > 0) {
      warnDev(
        `${failures.length} provider(s) failed but partial results are available; continuing.`,
      )
    }

    return combined
      .map((match) => ({ match, priority: calculatePriority(match) }))
      .sort(
        (a, b) =>
          b.priority.total - a.priority.total ||
          a.match.kickoff.getTime() - b.match.kickoff.getTime(),
      )
  })
}

/** Initial-load prefetch of tomorrow (SPEC §7 parallel warm-up). */
export function prefetchTomorrow(deps: AgendaDeps = defaultAgendaDeps): void {
  void getAgendaForDate(shiftDateKey(todayInTunis(), 1), deps).catch(() => {})
}

export function resetAgendaCache(): void {
  providerRequestCache.clear()
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
