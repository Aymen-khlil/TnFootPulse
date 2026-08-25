import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getAgendaForDate,
  resetAgendaCache,
  type AgendaDeps,
} from './fixturesOrchestrator'
import { AGENDA_TTL_EMPTY_MS, AGENDA_TTL_FRESH_MS } from '@/config/limits'
import type { Match } from '@/types/football'

function laLigaMatch(id: string): Match {
  return {
    id,
    homeTeam: { id: 'rm', name: 'Real Madrid', rating: 100 },
    awayTeam: { id: 'rso', name: 'Real Sociedad', rating: 75 },
    competition: { id: 'PD', name: 'La Liga', country: 'Spain', rating: 25 },
    kickoff: new Date('2026-08-27T20:00:00Z'),
    tunisDateKey: '2026-08-27',
    tunisMinuteOfDay: 21 * 60,
    stage: 'league-match',
    status: 'scheduled',
    source: 'football-data',
  }
}

function depsWith(series: Array<Match[] | Error>): AgendaDeps & { calls: number } {
  const deps: AgendaDeps & { calls: number } = {
    calls: 0,
    fetchFootballData: () => {
      const value = series[Math.min(step, series.length - 1)]
      step += 1
      deps.calls += 1
      if (value instanceof Error) return Promise.reject(value)
      return Promise.resolve(value)
    },
    // Outside the AF window for 2026-08-27; never called for these dates.
    fetchApiFootball: () => Promise.resolve([]),
  }
  let step = 0
  return deps
}

describe('fixturesOrchestrator — agenda staleness (Option C: TTL auto-refresh)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // The orchestrator caches via the module-level singleton; isolate tests.
    resetAgendaCache()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reflects provider retractions once the fresh-data TTL passes', async () => {
    const deps = depsWith([[laLigaMatch('m1')], []])

    const first = await getAgendaForDate('2026-08-27', deps)
    expect(first.matches).toHaveLength(1)

    vi.advanceTimersByTime(AGENDA_TTL_FRESH_MS + 1)
    const second = await getAgendaForDate('2026-08-27', deps)
    expect(second.matches).toHaveLength(0)
  })

  it('serves repeat requests inside the TTL window without refetching', async () => {
    const deps = depsWith([[laLigaMatch('m1')]])

    const first = await getAgendaForDate('2026-08-27', deps)
    vi.advanceTimersByTime(AGENDA_TTL_FRESH_MS - 60_000)
    const second = await getAgendaForDate('2026-08-27', deps)

    expect(second.matches).toHaveLength(1)
    expect(deps.calls).toBe(1)
    expect(second).toBe(first)
  })

  it('rechecks empty agendas on the shorter empty-TTL', async () => {
    const deps = depsWith([[], [laLigaMatch('m1')]])

    const first = await getAgendaForDate('2026-08-27', deps)
    expect(first.matches).toHaveLength(0)

    // Still stale inside the empty window…
    vi.advanceTimersByTime(AGENDA_TTL_EMPTY_MS - 60_000)
    expect((await getAgendaForDate('2026-08-27', deps)).matches).toHaveLength(0)
    expect(deps.calls).toBe(1)

    // …but refetched right after it.
    vi.advanceTimersByTime(61_000)
    const third = await getAgendaForDate('2026-08-27', deps)
    expect(third.matches).toHaveLength(1)
    expect(deps.calls).toBe(2)
  })
})
