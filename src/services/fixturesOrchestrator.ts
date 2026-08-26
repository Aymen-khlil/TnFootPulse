import type { Match, ScoredMatch, SourceMode } from '@/types/football'
import { calculatePriority } from '@/scoring/calculatePriority'
import { mergeMatches } from '@/providers/merge'
import {
  providerRequestCache,
} from '@/cache/providerCache'
import {
  loadFreshAgenda,
  saveAgenda,
  clearAgendaStorage,
} from '@/cache/agendaStorage'
import {
  apiFootballPacer,
  footballDataPacer,
  ProviderBudgetError,
} from '@/services/providerPacer'
import {
  AGENDA_TTL_EMPTY_MS,
  AGENDA_TTL_FRESH_MS,
  AGENDA_TTL_LIVE_MS,
  API_FOOTBALL_MAX_DAYS_AHEAD,
  FOOTBALL_DATA_RANGE_DAYS,
  LIVE_WINDOW_AFTER_MINUTES,
  LIVE_WINDOW_BEFORE_MINUTES,
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
  // The budget guards live HERE — the outermost network seam — so the
  // transports stay pure and every real request (initial load, prefetch,
  // revalidation tick) passes exactly one admission gate.
  fetchFootballData: ({ from, to }) => {
    footballDataPacer.admit()
    return fetchFootballDataMatchesInRange({ fromKey: from, toKey: to })
  },
  fetchApiFootball: (dateKey) => {
    apiFootballPacer.admit()
    return fetchApiFootballFixturesByDate({ dateKey })
  },
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
 * Successful agendas are also persisted (localStorage) and re-hydrated
 * after a page reload, making reloads quota-free within their freshness
 * window.
 *
 * Freshness is live-aware (Option C + score policy): empty agendas
 * recheck after 10min; otherwise the entry lives 3h, EXCEPT it never
 * overshoots into a kickoff's live window — once a window is active the
 * cadence tightens to 12min so scores creep forward without polling AF
 * or burning fd.org's tank.
 */
/** Memory-cache lane prefixes — single source of truth for both modes. */
export const CURATED_AGENDA_CACHE_PREFIX = 'agenda:'
export const ESPN_AGENDA_CACHE_PREFIX = 'espn-agenda:'

export async function getAgendaForDate(
  dateKey: string,
  deps: AgendaDeps = defaultAgendaDeps,
): Promise<AgendaResult> {
  return providerRequestCache.run(
    `${CURATED_AGENDA_CACHE_PREFIX}${dateKey}`,
    async () => {
    // Reload survival: a persisted snapshot inside its freshness window
    // answers immediately — zero network, zero quota.
    const stored = loadFreshAgenda(dateKey)
    if (stored) {
      return { matches: stored.matches, providerNotices: stored.providerNotices }
    }

    // Week-aligned fd.org window: any two dates inside the same 7-day
    // block share ONE cached ranged request instead of refetching.
    const { from, to } = footballDataWindowFor(dateKey)

    const failures: unknown[] = []
    const providerNotices: string[] = []
    let fdFailure: unknown = null

    const fdJob = deps
      .fetchFootballData({ from, to })
      .catch((error: unknown) => {
        // Daily-budget exhaustion is a planned pause, not a provider
        // outage — degrade via notice, never as a thrown agenda error.
        if (
          error instanceof ProviderBudgetError &&
          error.scope === 'daily'
        ) {
          providerNotices.push(
            'football-data.org daily budget guard reached — European updates pause until tomorrow.',
          )
          return [] as Match[]
        }
        failures.push(error)
        fdFailure = error
        return [] as Match[]
      })

    let afJob: Promise<Match[]> | null = null
    if (apiFootballWindowAllows(dateKey)) {
      afJob = deps.fetchApiFootball(dateKey).catch((error: unknown) => {
        // Free-plan future-date rejection: graceful no-op for this
        // provider — expected behavior, not surfaced as a notice.
        if (error instanceof FootballApiError && error.code === 'plan-date-restricted') {
          warnDev('API-Football rejected the date as outside the free-plan window.')
          return [] as Match[]
        }
        if (error instanceof ProviderBudgetError && error.scope === 'daily') {
          providerNotices.push(
            'API-Football daily budget guard reached — Tunisian and cup updates pause until tomorrow.',
          )
          return [] as Match[]
        }
        failures.push(error)
        providerNotices.push(
          'Tunisian and other league fixtures may be incomplete right now.',
        )
        return [] as Match[]
      })
    }

    const [fdMatches, afMatches] = await Promise.all([
      fdJob,
      afJob ?? Promise.resolve([] as Match[]),
    ])

    if (fdFailure !== null) {
      if (afMatches.length > 0) {
        // Backup path: API-Football's date response already carries the
        // Euro leagues, so the agenda degrades to today+tomorrow coverage
        // instead of going dark.
        providerNotices.push(
          'European fixtures are running on the backup source — today and tomorrow only.',
        )
      } else {
        providerNotices.push(
          'European fixtures are unavailable right now (football-data.org).',
        )
      }
    }

    const combined = mergeMatches(fdMatches, afMatches)

    // HARD RULE: an agenda for a date contains ONLY that Tunisian
    // calendar day's matches — the fd.org range exists purely as a
    // network-efficiency device, never as extra display content.
    const dayCombined = combined.filter((m) => m.tunisDateKey === dateKey)

    if (
      dayCombined.length === 0 &&
      failures.length === 1 + (afJob !== null ? 1 : 0)
    ) {
      // Every provider that was consulted failed — surface as a real
      // error so the UI can offer retry.
      throw failures[0]
    }
    if (failures.length > 0) {
      warnDev(
        `${failures.length} provider(s) failed but partial results are available; continuing.`,
      )
    }

    const result: AgendaResult = {
      matches: dayCombined
        .map((match) => ({ match, priority: calculatePriority(match) }))
        .sort(
          (a, b) =>
            b.priority.total - a.priority.total ||
            a.match.kickoff.getTime() - b.match.kickoff.getTime(),
        ),
      providerNotices,
    }

    // Persist with the SAME freshness policy the memory cache uses, so a
    // reload resumes exactly where the session would have been.
    const ttlMs = agendaTtlMs(result.matches)
    saveAgenda(dateKey, result, ttlMs)
    return result
    },
    (result) => agendaTtlMs(result.matches),
  )
}

/** Initial-load prefetch of tomorrow (SPEC §7 parallel warm-up). */
export function prefetchTomorrow(deps: AgendaDeps = defaultAgendaDeps): void {
  void getAgendaForDate(shiftDateKey(todayInTunis(), 1), deps).catch(() => {})
}

/**
 * Manual-refresh semantics for one Source Mode (or all when omitted):
 * wipe BOTH cache layers of that lane so the next load is a guaranteed
 * network round-trip. Persisted snapshots are deliberately included —
 * "refresh" that serves a localStorage copy would be a lie.
 */
export function resetAgendaCache(mode?: SourceMode): void {
  if (mode === 'espn') {
    providerRequestCache.clear(ESPN_AGENDA_CACHE_PREFIX)
    clearAgendaStorage('espn')
    return
  }
  if (mode === 'curated') {
    providerRequestCache.clear(CURATED_AGENDA_CACHE_PREFIX)
    clearAgendaStorage('curated')
    return
  }
  providerRequestCache.clear()
  clearAgendaStorage()
}

/**
 * Test seam simulating a page reload: memory gone, persistence intact.
 * The next `getAgendaForDate` must hydrate from storage, not network.
 */
export function resetAgendaMemoryCacheForTests(): void {
  providerRequestCache.clear()
}

/**
 * Live-aware freshness policy — single source for both cache layers.
 *
 *  - empty agenda → short empty-TTL (fixtures can land mid-day)
 *  - any kickoff inside its live window (start−10min … +2h45) → tight
 *    live cadence; scores update without polling AF
 *  - otherwise: never overshoot INTO the next window — expire just as
 *    it opens (floored at 30s) so the first live poll lands on time;
 *    far-future windows simply clamp to the standard fresh TTL
 */
export function agendaTtlMs(matches: ScoredMatch[], now: number = Date.now()): number {
  if (matches.length === 0) return AGENDA_TTL_EMPTY_MS

  const before = LIVE_WINDOW_BEFORE_MINUTES * 60_000
  const after = LIVE_WINDOW_AFTER_MINUTES * 60_000
  let nextWindowStart = Number.POSITIVE_INFINITY

  for (const { match } of matches) {
    const start = match.kickoff.getTime() - before
    const end = match.kickoff.getTime() + after
    if (now >= start && now <= end) return AGENDA_TTL_LIVE_MS
    if (start > now && start < nextWindowStart) nextWindowStart = start
  }

  if (nextWindowStart !== Number.POSITIVE_INFINITY) {
    return Math.max(30_000, Math.min(AGENDA_TTL_FRESH_MS, nextWindowStart - now))
  }
  return AGENDA_TTL_FRESH_MS
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
