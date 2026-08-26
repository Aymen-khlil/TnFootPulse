import { describe, it, expect } from 'vitest'
import {
  ProviderPacer,
  ProviderBudgetError,
} from './providerPacer'
import { PROVIDER_BURST_MAX_PER_MINUTE } from '@/config/limits'

function memoryStore() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    snapshot: () => map,
  }
}

function pacer(dailyCap = 100, nowMs = 1_000_000) {
  const store = memoryStore()
  let now = nowMs
  const instance = new ProviderPacer('football-data', dailyCap, {
    now: () => now,
    todayKey: () => '2026-08-26',
    store,
  })
  return {
    instance,
    store,
    advance: (ms: number) => {
      now += ms
    },
  }
}

describe('providerPacer — burst guard', () => {
  it('admits up to the burst cap within the rolling window', () => {
    const { instance } = pacer()
    for (let i = 0; i < PROVIDER_BURST_MAX_PER_MINUTE; i += 1) {
      expect(() => instance.admit()).not.toThrow()
    }
  })

  it('rejects the call that would exceed the burst cap', () => {
    const { instance, advance } = pacer()
    for (let i = 0; i < PROVIDER_BURST_MAX_PER_MINUTE; i += 1) instance.admit()

    expect(() => instance.admit()).toThrow(ProviderBudgetError)
    try {
      instance.admit()
    } catch (error) {
      expect((error as ProviderBudgetError).scope).toBe('burst')
      expect((error as ProviderBudgetError).code).toBe('budget-exhausted')
    }
    advance(60_001)
    expect(() => instance.admit()).not.toThrow()
  })

  it('frees burst slots as timestamps leave the window (sliding)', () => {
    const { instance, advance } = pacer()
    // Stamps land 9s apart: after 8 admits the newest is at t+63s while
    // the oldest sits at t+0 — exactly past the 60s horizon, so one
    // slot must have reopened for the final admit.
    for (let i = 0; i < PROVIDER_BURST_MAX_PER_MINUTE; i += 1) {
      instance.admit()
      advance(9_000)
    }
    expect(() => instance.admit()).not.toThrow()
  })
})

describe('providerPacer — daily budget', () => {
  it('counts admitted calls against the daily cap', () => {
    const { instance, advance } = pacer(3)
    instance.admit()
    advance(10_000)
    instance.admit()
    expect(instance.remainingToday()).toBe(1)

    advance(10_000)
    instance.admit()
    expect(instance.remainingToday()).toBe(0)
    expect(() => instance.admit()).toThrow(ProviderBudgetError)
  })

  it('daily rejections never consume burst slots or counters', () => {
    const { instance } = pacer(1)
    instance.admit()
    const before = instance.remainingToday()
    expect(() => instance.admit()).toThrow(ProviderBudgetError)
    expect(instance.remainingToday()).toBe(before)
  })

  it('resets on Tunis-day rollover via a fresh storage key', () => {
    const store = memoryStore()
    let dayKey = '2026-08-26'
    let now = 1_000_000
    const instance = new ProviderPacer('api-football', 2, {
      now: () => now,
      todayKey: () => dayKey,
      store,
    })

    instance.admit()
    instance.admit()
    expect(() => instance.admit()).toThrow(ProviderBudgetError)

    dayKey = '2026-08-27'
    now += 86_400_000
    expect(() => instance.admit()).not.toThrow()
  })
})
