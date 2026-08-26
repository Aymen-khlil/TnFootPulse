import type { ProviderId } from '@/types/football'
import { todayInTunis } from '@/utils/timezone'
import {
  API_FOOTBALL_DAILY_BUDGET,
  FOOTBALL_DATA_DAILY_BUDGET,
  PROVIDER_BURST_MAX_PER_MINUTE,
  PROVIDER_BURST_WINDOW_MS,
} from '@/config/limits'

/**
 * Raised when a provider's self-imposed budget guard blocks a real
 * network call. Callers translate this into graceful degradation
 * ("updates paused") instead of letting retry loops burn the day's
 * quota and take the whole provider dark.
 */
export class ProviderBudgetError extends Error {
  readonly code = 'budget-exhausted' as const
  readonly provider: ProviderId
  readonly scope: 'burst' | 'daily'

  constructor(provider: ProviderId, scope: 'burst' | 'daily') {
    super(
      scope === 'daily'
        ? `${provider} daily call budget exhausted; updates pause until tomorrow.`
        : `${provider} burst limit reached; slow down requests.`,
    )
    this.name = 'ProviderBudgetError'
    this.provider = provider
    this.scope = scope
  }
}

/**
 * Minimal key/value surface so the pacer works in the browser
 * (localStorage), in node tests (in-memory fallback), and under
 * privacy modes that throw on storage access.
 */
export interface PacerStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function safeLocalStorage(): PacerStore | null {
  try {
    const store = (globalThis as Record<string, unknown>).localStorage as
      | PacerStore
      | undefined
    if (store) {
      const probe = '__tfp_probe__'
      store.setItem(probe, probe)
      store.removeItem(probe)
      return store
    }
  } catch {
    // fall through to memory
  }
  return null
}

function memoryStore(): PacerStore {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  }
}

export type ProviderPacerOptions = {
  /** Injectable clock for tests. */
  now?: () => number
  /** Injectable Tunis date key for tests. */
  todayKey?: () => string
  /** Injectable persistence layer for tests. */
  store?: PacerStore
}

/**
 * Budget guard for one provider's real network calls.
 *
 * Two layers:
 *  - Burst guard: rolling-window cap (in-memory; a page reload resets it,
 *    which is fine — reloads are exactly when we WANT restraint).
 *  - Daily cap: persisted per Tunis calendar day so the tank survives
 *    reloads. Counters self-clean on rollover.
 *
 * `admit()` both checks and records: call it immediately before issuing
 * a real request, never speculatively.
 */
export class ProviderPacer {
  private readonly provider: ProviderId
  private readonly dailyCap: number
  private readonly burstMax: number
  private readonly now: () => number
  private readonly todayKey: () => string
  private readonly store: PacerStore
  private burstTimestamps: number[] = []

  constructor(
    provider: ProviderId,
    dailyCap: number,
    options: ProviderPacerOptions = {},
  ) {
    this.provider = provider
    this.dailyCap = dailyCap
    this.burstMax = PROVIDER_BURST_MAX_PER_MINUTE
    this.now = options.now ?? Date.now
    this.todayKey = options.todayKey ?? todayInTunis
    this.store = options.store ?? safeLocalStorage() ?? memoryStore()
  }

  /**
   * @throws ProviderBudgetError when the burst window or the daily
   * budget is exhausted.
   */
  admit(): void {
    const now = this.now()

    this.burstTimestamps = this.burstTimestamps.filter(
      (ts) => now - ts < PROVIDER_BURST_WINDOW_MS,
    )
    if (this.burstTimestamps.length >= this.burstMax) {
      throw new ProviderBudgetError(this.provider, 'burst')
    }

    const key = this.dailyStorageKey()
    const usedToday = this.readCount(key)
    if (usedToday >= this.dailyCap) {
      throw new ProviderBudgetError(this.provider, 'daily')
    }

    this.burstTimestamps.push(now)
    this.writeCount(key, usedToday + 1)
  }

  remainingToday(): number {
    return Math.max(0, this.dailyCap - this.readCount(this.dailyStorageKey()))
  }

  /** Test/session reset — clears burst history and TODAY's counter only. */
  reset(): void {
    this.burstTimestamps = []
    this.store.removeItem(this.dailyStorageKey())
  }

  private readCount(key: string): number {
    try {
      const raw = this.store.getItem(key)
      const parsed = raw === null ? Number.NaN : Number.parseInt(raw, 10)
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
    } catch {
      return 0
    }
  }

  private writeCount(key: string, count: number): void {
    try {
      this.store.setItem(key, String(count))
    } catch {
      // Quota/privacy failures must never break the request path.
    }
  }

  private dailyStorageKey(): string {
    return `tfp:pacer:v1:${this.provider}:${this.todayKey()}`
  }
}

export const footballDataPacer = new ProviderPacer(
  'football-data',
  FOOTBALL_DATA_DAILY_BUDGET,
)

export const apiFootballPacer = new ProviderPacer(
  'api-football',
  API_FOOTBALL_DAILY_BUDGET,
)
