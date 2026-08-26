import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getAgendaForDate,
  agendaTtlMs,
  resetAgendaCache,
  resetAgendaMemoryCacheForTests,
  type AgendaDeps,
} from './fixturesOrchestrator'
import { ProviderBudgetError } from './providerPacer'
import {
  AGENDA_TTL_EMPTY_MS,
  AGENDA_TTL_FRESH_MS,
  AGENDA_TTL_LIVE_MS,
} from '@/config/limits'
import type { Match, ScoredMatch } from '@/types/football'

function matchOn(
  dateKey: string,
  kickoffIso: string,
  id = 'm1',
  competitionId = 'premier-league',
): Match {
  const kickoff = new Date(kickoffIso)
  return {
    id,
    homeTeam: { id: 'h', name: 'Arsenal', rating: 88 },
    awayTeam: { id: 'a', name: 'Chelsea', rating: 84 },
    competition: { id: competitionId, name: 'Premier League', country: 'England', rating: 25 },
    kickoff,
    tunisDateKey: dateKey,
    tunisMinuteOfDay: 20 * 60,
    stage: 'league-match',
    status: 'scheduled',
    source: 'football-data',
  }
}

function scored(match: Match): ScoredMatch {
  return {
    match,
    priority: {
      total: 50,
      competition: 25,
      teams: 15,
      context: 0,
      tunisiaTime: 10,
      pedigree: 0,
      category: 'worth-watching',
      reasons: [],
    },
  }
}

describe('agendaTtlMs — live-window freshness policy', () => {
  it('uses the short empty-TTL for empty agendas', () => {
    expect(agendaTtlMs([], 1_000)).toBe(AGENDA_TTL_EMPTY_MS)
  })

  it('tightens to the live cadence inside an active window', () => {
    const now = Date.parse('2026-08-26T18:30:00Z')
    // Kickoff was 60min ago; window runs −10min … +165min.
    const m = scored(matchOn('2026-08-26', '2026-08-26T17:30:00Z'))
    expect(agendaTtlMs([m], now)).toBe(AGENDA_TTL_LIVE_MS)
  })

  it('never overshoots into a future window (expires as it opens)', () => {
    const now = Date.parse('2026-08-26T10:00:00Z')
    // Window opens at 11:20 (kickoff−10min) → TTL must be 80min, not 3h.
    const m = scored(matchOn('2026-08-26', '2026-08-26T11:30:00Z'))
    expect(agendaTtlMs([m], now)).toBe(80 * 60_000)
  })

  it('clamps to the fresh TTL when the next window is far away', () => {
    const now = Date.parse('2026-08-26T09:00:00Z')
    const m = scored(matchOn('2026-08-27', '2026-08-27T20:00:00Z'))
    expect(agendaTtlMs([m], now)).toBe(AGENDA_TTL_FRESH_MS)
  })

  it('falls back to the fresh TTL after every window has closed', () => {
    const now = Date.parse('2026-08-26T23:00:00Z')
    const m = scored(matchOn('2026-08-26', '2026-08-26T18:00:00Z'))
    expect(agendaTtlMs([m], now)).toBe(AGENDA_TTL_FRESH_MS)
  })
})

function farFutureDeps(series: Array<Match[] | Error>) {
  let step = 0
  const calls = { fd: 0, af: 0 }
  const deps: AgendaDeps = {
    fetchFootballData: () => {
      const value = series[Math.min(step, series.length - 1)]
      step += 1
      calls.fd += 1
      if (value instanceof Error) return Promise.reject(value)
      return Promise.resolve(value.filter((m) => m.source === 'football-data'))
    },
    fetchApiFootball: () => {
      calls.af += 1
      return Promise.resolve([])
    },
  }
  return { deps, calls }
}

// Far-future date keeps AF out of its free-plan window and every window
// math deterministic relative to the frozen clock below.
const DATE_KEY = '2026-09-24'
const T0 = Date.parse('2026-08-26T09:00:00Z')

describe('fixturesOrchestrator — reload survival via persisted agendas', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(T0)
    resetAgendaCache()
  })

  afterEach(() => {
    vi.useRealTimers()
    resetAgendaCache()
  })

  it('hydrates from persistence after a simulated reload without refetching', async () => {
    const fixture = matchOn(DATE_KEY, '2026-09-24T19:00:00Z')
    const { deps, calls } = farFutureDeps([[fixture]])

    await getAgendaForDate(DATE_KEY, deps)
    expect(calls.fd).toBe(1)

    // Page reload: memory wiped, localStorage survives.
    resetAgendaMemoryCacheForTests()
    const revived = await getAgendaForDate(DATE_KEY, deps)

    expect(calls.fd).toBe(1)
    expect(revived.matches).toHaveLength(1)
    expect(revived.matches[0].match.kickoff).toBeInstanceOf(Date)
    expect(revived.matches[0].match.id).toBe('m1')
  })

  it('refetches once the persisted freshness window has passed', async () => {
    const fixture = matchOn(DATE_KEY, '2026-09-24T19:00:00Z')
    const { deps, calls } = farFutureDeps([[fixture], [fixture]])

    await getAgendaForDate(DATE_KEY, deps)
    vi.advanceTimersByTime(AGENDA_TTL_FRESH_MS + 1)
    await getAgendaForDate(DATE_KEY, deps)

    expect(calls.fd).toBe(2)
  })

  it('manual refresh bypasses persistence and forces the network', async () => {
    const fixture = matchOn(DATE_KEY, '2026-09-24T19:00:00Z')
    const { deps, calls } = farFutureDeps([[fixture], [fixture]])

    await getAgendaForDate(DATE_KEY, deps)
    resetAgendaCache() // what the 🔄 button triggers
    await getAgendaForDate(DATE_KEY, deps)

    expect(calls.fd).toBe(2)
  })
})

describe('fixturesOrchestrator — backup + budget notices', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(T0)
    resetAgendaCache()
  })

  afterEach(() => {
    vi.useRealTimers()
    resetAgendaCache()
  })

  it('fills European fixtures from API-Football when fd.org fails', async () => {
    // AF-sourced copy of a Premier League match on an AF-window date.
    const afCopy = {
      ...matchOn('2026-08-26', '2026-08-26T19:00:00Z'),
      source: 'api-football' as const,
    }
    const deps: AgendaDeps = {
      fetchFootballData: () => Promise.reject(new Error('fd down')),
      fetchApiFootball: () => Promise.resolve([afCopy]),
    }

    const result = await getAgendaForDate('2026-08-26', deps)

    expect(result.matches).toHaveLength(1)
    expect(result.providerNotices).toEqual([
      'European fixtures are running on the backup source — today and tomorrow only.',
    ])
  })

  it('pauses European updates gracefully when the fd daily budget is spent', async () => {
    const { deps } = farFutureDeps([
      new ProviderBudgetError('football-data', 'daily'),
    ])

    const result = await getAgendaForDate(DATE_KEY, deps)

    expect(result.matches).toHaveLength(0)
    expect(result.providerNotices[0]).toContain('daily budget guard reached')
    expect(result.providerNotices[0]).toContain('European updates pause until tomorrow')
  })

  it('still throws when every consulted provider fails outright', async () => {
    const { deps } = farFutureDeps([new Error('both down')])

    await expect(getAgendaForDate(DATE_KEY, deps)).rejects.toThrow('both down')
  })
})
