import { describe, it, expect, beforeEach } from 'vitest'
import { getMatchesForDate, clearFixturesCache } from './fixturesCache'
import type { Match } from '@/types/football'

function fakeMatch(id: string): Match {
  return {
    id,
    homeTeam: { id: 'h', name: 'H', rating: 50 },
    awayTeam: { id: 'a', name: 'A', rating: 50 },
    competition: { id: '2', name: 'CL', rating: 30 },
    kickoff: new Date('2026-08-25T19:00:00Z'),
    tunisDateKey: '2026-08-25',
    tunisMinuteOfDay: 1200,
    stage: 'group-phase',
    status: 'scheduled',
  }
}

beforeEach(() => clearFixturesCache())

describe('fixturesCache', () => {
  it('fetches a date once and serves repeat selections from cache', async () => {
    let calls = 0
    const transport = async (dateKey: string) => {
      calls++
      return [fakeMatch(dateKey)]
    }

    await getMatchesForDate('2026-08-25', transport)
    await getMatchesForDate('2026-08-25', transport)
    await getMatchesForDate('2026-08-25', transport)

    expect(calls).toBe(1)
  })

  it('dedupes concurrent requests for the same date into one fetch', async () => {
    let calls = 0
    const transport = async () => {
      calls++
      await new Promise((r) => setTimeout(r, 10))
      return [fakeMatch('x')]
    }

    await Promise.all([
      getMatchesForDate('2026-08-25', transport),
      getMatchesForDate('2026-08-25', transport),
    ])

    expect(calls).toBe(1)
  })

  it('caches distinct dates independently', async () => {
    const dates: string[] = []
    const transport = async (dateKey: string) => {
      dates.push(dateKey)
      return [fakeMatch(dateKey)]
    }

    await getMatchesForDate('2026-08-25', transport)
    await getMatchesForDate('2026-08-26', transport)
    await getMatchesForDate('2026-08-25', transport)

    expect(dates).toEqual(['2026-08-25', '2026-08-26'])
  })

  it('evicts failed entries so retry genuinely refetches', async () => {
    let calls = 0
    const failingThenWorking = async () => {
      calls++
      if (calls === 1) throw new Error('network down')
      return [fakeMatch('recovered')]
    }

    await expect(getMatchesForDate('2026-08-25', failingThenWorking)).rejects.toThrow(
      'network down',
    )
    const recovered = await getMatchesForDate('2026-08-25', failingThenWorking)
    expect(recovered[0].id).toBe('recovered')
    expect(calls).toBe(2)
  })
})
