import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ProviderRequestCache } from './providerCache'

beforeEach(() => {
  // module-level singleton is avoided in tests; each suite builds its own
})

describe('ProviderRequestCache', () => {
  it('runs a task once and serves repeat keys from cache', async () => {
    const cache = new ProviderRequestCache()
    let calls = 0
    const task = async () => {
      calls++
      return ['match']
    }

    await cache.run('api-football:date:2026-08-25', task)
    await cache.run('api-football:date:2026-08-25', task)
    await cache.run('api-football:date:2026-08-25', task)

    expect(calls).toBe(1)
  })

  it('dedupes concurrent tasks for the same key', async () => {
    const cache = new ProviderRequestCache()
    let calls = 0
    const task = async () => {
      calls++
      await new Promise((r) => setTimeout(r, 10))
      return 'x'
    }

    await Promise.all([
      cache.run('football-data:range:a..b', task),
      cache.run('football-data:range:a..b', task),
    ])

    expect(calls).toBe(1)
  })

  it('keeps distinct keys isolated (provider + scope)', async () => {
    const cache = new ProviderRequestCache()
    const seen: string[] = []
    const taskFor = (tag: string) => async () => {
      seen.push(tag)
      return tag
    }

    await cache.run('api-football:date:2026-08-25', taskFor('af-25'))
    await cache.run('football-data:range:2026-08-25..2026-08-26', taskFor('fd-range'))
    await cache.run('api-football:date:2026-08-26', taskFor('af-26'))
    await cache.run('api-football:date:2026-08-25', taskFor('af-25-again'))

    expect(seen).toEqual(['af-25', 'fd-range', 'af-26'])
  })

  it('evicts failed entries so retry genuinely reruns', async () => {
    const cache = new ProviderRequestCache()
    let calls = 0
    const failingThenWorking = async () => {
      calls++
      if (calls === 1) throw new Error('network down')
      return 'recovered'
    }

    await expect(cache.run('k', failingThenWorking)).rejects.toThrow('network down')
    expect(await cache.run('k', failingThenWorking)).toBe('recovered')
    expect(calls).toBe(2)
  })

  it('clear() forgets everything', async () => {
    const cache = new ProviderRequestCache()
    let calls = 0
    const task = async () => {
      calls++
      return 1
    }
    await cache.run('a', task)
    cache.clear()
    await cache.run('a', task)
    expect(calls).toBe(2)
  })

  describe('TTL entries', () => {
    it('serves within the window and refetches after expiry', async () => {
      vi.useFakeTimers()
      try {
        const cache = new ProviderRequestCache()
        let calls = 0
        const task = async () => {
          calls++
          return ['match']
        }

        await cache.run('k', task, () => 60_000)
        await cache.run('k', task, () => 60_000)
        expect(calls).toBe(1)

        vi.advanceTimersByTime(61_000)
        await cache.run('k', task, () => 60_000)
        expect(calls).toBe(2)
      } finally {
        vi.useRealTimers()
      }
    })

    it('derives the window per result (empty results expire sooner)', async () => {
      vi.useFakeTimers()
      try {
        const cache = new ProviderRequestCache()
        let calls = 0
        const task = async () => {
          calls++
          return calls === 1 ? [] : ['fresh']
        }
        const ttlFromResult = (value: string[]) =>
          value.length === 0 ? 10 * 60_000 : 3 * 60 * 60_000

        await cache.run('k', task, ttlFromResult) // empty → 10 min window
        vi.advanceTimersByTime(11 * 60_000)
        await cache.run('k', task, ttlFromResult) // expired, refetches fresh → 3 h window
        expect(calls).toBe(2)

        vi.advanceTimersByTime(30 * 60_000) // well inside the 3 h window
        await cache.run('k', task, ttlFromResult)
        expect(calls).toBe(2)
      } finally {
        vi.useRealTimers()
      }
    })

    it('entries without a resolver never expire (existing behavior)', async () => {
      vi.useFakeTimers()
      try {
        const cache = new ProviderRequestCache()
        let calls = 0
        const task = async () => {
          calls++
          return 'x'
        }

        await cache.run('k', task)
        vi.advanceTimersByTime(24 * 60 * 60_000)
        await cache.run('k', task)
        expect(calls).toBe(1)
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
