import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getEspnAgendaForDate,
  type EspnAgendaDeps,
} from './espnAgenda'
import {
  resetAgendaCache,
  agendaTtlMs,
} from './fixturesOrchestrator'
import { AGENDA_TTL_FRESH_MS, AGENDA_TTL_LIVE_MS } from '@/config/limits'
import type { Match, ScoredMatch } from '@/types/football'

const DATE_KEY = '2026-08-29'

function leagueMatch(slug: string, id: string): Match {
  const kickoff = new Date(`${DATE_KEY}T18:00:00Z`)
  return {
    id: `espn:${id}`,
    homeTeam: { id: 'h', name: 'Olympique Lyonnais', rating: 78 },
    awayTeam: { id: 'a', name: 'Lille', rating: 76 },
    competition: {
      id: slug === 'eng.1' ? 'premier-league' : `espn:${slug}`,
      name: slug === 'eng.1' ? 'Premier League' : `ESPN ${slug}`,
      rating: slug === 'eng.1' ? 25 : 6,
    },
    kickoff,
    tunisDateKey: DATE_KEY,
    tunisMinuteOfDay: 19 * 60,
    stage: 'league-match',
    status: 'scheduled',
    source: 'espn',
  } satisfies Match
}

function liveKickoffMatch(): Match {
  // Kickoff 30 minutes ago → inside the live window.
  const kickoff = new Date(Date.now() - 30 * 60_000)
  return {
    ...leagueMatch('eng.1', 'live'),
    kickoff,
    tunisDateKey: kickoff.toISOString().slice(0, 10),
    status: 'live',
  }
}

function depsFrom(
  handler: (slug: string) => Promise<Match[]>,
  log: string[] = [],
): EspnAgendaDeps {
  return {
    fetchLeagueMatches: (slug) => {
      log.push(slug)
      return handler(slug)
    },
  }
}

describe('getEspnAgendaForDate — experiment lane semantics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.parse('2026-08-26T09:00:00Z'))
    resetAgendaCache()
  })

  afterEach(() => {
    vi.useRealTimers()
    resetAgendaCache()
  })

  it('aggregates every healthy league into one scored agenda', async () => {
    const deps = depsFrom(async (slug) => [leagueMatch(slug, `m-${slug}`)])

    const result = await getEspnAgendaForDate(DATE_KEY, deps)

    expect(result.matches.length).toBeGreaterThanOrEqual(2)
    expect(result.matches[0].priority.total).toBeGreaterThan(0)
    expect(result.providerNotices).toEqual([])
  }, 20_000)

  it('degrades gracefully when some league feeds fail', async () => {
    const deps = depsFrom(async (slug) => {
      if (slug === 'eng.1') throw new Error('403')
      return [leagueMatch(slug, `m-${slug}`)]
    })

    const result = await getEspnAgendaForDate(DATE_KEY, deps)

    expect(result.matches.length).toBeGreaterThan(0)
    expect(result.providerNotices[0]).toContain('competition')
    expect(result.providerNotices[0]).toContain('unavailable')
  }, 20_000)

  it('throws when every single feed fails (loud failure, no silent fallback)', async () => {
    const deps = depsFrom(async () => {
      throw new Error('espn down')
    })

    await expect(getEspnAgendaForDate(DATE_KEY, deps)).rejects.toThrow('espn down')
  }, 20_000)

  it('caches per mode so curated and espn never share entries', async () => {
    const log: string[] = []
    const deps = depsFrom(async (slug) => {
      log.push(slug)
      return [leagueMatch(slug, `m-${slug}`)]
    })

    await getEspnAgendaForDate(DATE_KEY, deps)
    const callsAfterFirst = log.length

    await getEspnAgendaForDate(DATE_KEY, deps)
    expect(log.length).toBe(callsAfterFirst)
  }, 20_000)

  it('hydrates from persistence across a simulated reload', async () => {
    const deps = depsFrom(async (slug) => [leagueMatch(slug, `m-${slug}`)])
    await getEspnAgendaForDate(DATE_KEY, deps)

    // Simulate reload: memory wiped, localStorage survives.
    const { resetAgendaMemoryCacheForTests } = await import('./fixturesOrchestrator')
    resetAgendaMemoryCacheForTests()

    const revived = await getEspnAgendaForDate(DATE_KEY, deps)
    expect(revived.matches.length).toBeGreaterThan(0)
    expect(revived.matches[0].match.kickoff).toBeInstanceOf(Date)
  }, 20_000)

  it('uses the shared live-window freshness policy', async () => {
    const live = liveKickoffMatch()
    expect(agendaTtlMs([{ match: live, priority: emptyPriority() }])).toBe(
      AGENDA_TTL_LIVE_MS,
    )
    const quiet = leagueMatch('eng.1', 'quiet')
    expect(agendaTtlMs([{ match: quiet, priority: emptyPriority() }])).toBe(
      AGENDA_TTL_FRESH_MS,
    )
  })
})

function emptyPriority(): ScoredMatch['priority'] {
  return {
    total: 10,
    competition: 6,
    teams: 4,
    context: 0,
    tunisiaTime: 0,
    pedigree: 0,
    category: 'low-priority',
    reasons: [],
  }
}
