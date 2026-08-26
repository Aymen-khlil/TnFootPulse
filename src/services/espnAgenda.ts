import type { Match, ScoredMatch } from '@/types/football'
import { calculatePriority } from '@/scoring/calculatePriority'
import { providerRequestCache } from '@/cache/providerCache'
import { loadFreshAgenda, saveAgenda } from '@/cache/agendaStorage'
import { agendaTtlMs, ESPN_AGENDA_CACHE_PREFIX } from './fixturesOrchestrator'
import { ESPN_LEAGUES, espnLeagueBySlug } from '@/config/espnLeagues'
import {
  fetchEspnScoreboardByDate,
} from '@/providers/espn/transport'
import { normalizeEspnScoreboard } from '@/providers/espn/normalize'

/**
 * ESPN Mode orchestrator — the Experimental Source's exclusive pipeline
 * (CONTEXT.md: "Source Mode"). Never merges with the curated agenda.
 *
 * One scoreboard request per manifest slug per day, fired in parallel.
 * Per-league failures degrade into a notice; a total failure throws so
 * the UI can offer the loud "back to Curated" path (experiment honesty).
 * Freshness reuses the exact shared policy of Curated Mode, and results
 * persist under the espn namespace — reloads stay free in both modes.
 *
 * No budget pacer here by design: ESPN has no quota to protect, volume
 * is inherently bounded (manifest size × visited dates), and caches keep
 * repeats free. See docs/adr/0003.
 */

export type EspnAgendaDeps = {
  /** Transport+normalize for one league slug (seam for tests). */
  fetchLeagueMatches: (slug: string, dateKey: string) => Promise<Match[]>
}

export const defaultEspnAgendaDeps: EspnAgendaDeps = {
  fetchLeagueMatches: async (slug, dateKey) => {
    const league = espnLeagueBySlug(slug)
    if (!league) return []
    const payload = await fetchEspnScoreboardByDate({ slug, dateKey })
    return normalizeEspnScoreboard(payload, league)
  },
}

export type EspnAgendaResult = {
  matches: ScoredMatch[]
  providerNotices: string[]
}

export async function getEspnAgendaForDate(
  dateKey: string,
  deps: EspnAgendaDeps = defaultEspnAgendaDeps,
): Promise<EspnAgendaResult> {
  return providerRequestCache.run(
    `${ESPN_AGENDA_CACHE_PREFIX}${dateKey}`,
    async () => {
      // Reload survival inside the ESPN lane only.
      const stored = loadFreshAgenda(dateKey, Date.now(), 'espn')
      if (stored) {
        return { matches: stored.matches, providerNotices: stored.providerNotices }
      }

      const settled = await Promise.allSettled(
        ESPN_LEAGUES.map((league) => deps.fetchLeagueMatches(league.slug, dateKey)),
      )

      const failures: unknown[] = []
      const combined: Match[] = []
      for (const outcome of settled) {
        if (outcome.status === 'fulfilled') {
          combined.push(...outcome.value)
        } else {
          failures.push(outcome.reason)
        }
      }

      // HARD RULE parity with Curated Mode: only the selected Tunisian
      // calendar day renders.
      const dayMatches = combined.filter((m) => m.tunisDateKey === dateKey)

      if (dayMatches.length === 0 && failures.length === settled.length) {
        throw failures[0] instanceof Error
          ? failures[0]
          : new Error('The ESPN feed is unavailable.')
      }

      const providerNotices: string[] = []
      if (failures.length > 0) {
        providerNotices.push(
          `ESPN feed: ${failures.length} competition${failures.length === 1 ? '' : 's'} unavailable right now.`,
        )
      }

      const result: EspnAgendaResult = {
        matches: dayMatches
          .map((match) => ({ match, priority: calculatePriority(match) }))
          .sort(
            (a, b) =>
              b.priority.total - a.priority.total ||
              a.match.kickoff.getTime() - b.match.kickoff.getTime(),
          ),
        providerNotices,
      }

      saveAgenda(dateKey, result, agendaTtlMs(result.matches), Date.now(), 'espn')
      return result
    },
    (result) => agendaTtlMs(result.matches),
  )
}
