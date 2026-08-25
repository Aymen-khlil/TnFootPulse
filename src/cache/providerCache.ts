export type CacheTask<T> = () => Promise<T>

/**
 * Resolves a cache window from a task's result, in milliseconds.
 * Returning the value lets callers keep fresh data longer than empty
 * data without any extra bookkeeping at the call site.
 */
export type TtlResolver<T> = (value: T) => number

type CacheEntry = {
  promise: Promise<unknown>
  /** Epoch ms after which the entry must be refetched; undefined = session-long. */
  expiresAt?: number
}

/**
 * Provider-aware request cache. Keys MUST embed the provider plus the
 * request scope (single date vs range) so distinct providers/queries can
 * never collide: e.g. "api-football:date:2026-08-25" vs
 * "football-data:range:2026-08-25..2026-09-01".
 *
 * Stores promises so concurrent callers share one in-flight request;
 * failed tasks evict their entry so retry genuinely refetches. Entries
 * created with a TtlResolver expire silently and refetch on next read —
 * bounded staleness instead of forever-frozen snapshots.
 */
export class ProviderRequestCache {
  private entries = new Map<string, CacheEntry>()

  run<T>(key: string, task: CacheTask<T>, ttlMs?: TtlResolver<T>): Promise<T> {
    const existing = this.entries.get(key)
    if (
      existing &&
      (existing.expiresAt === undefined || Date.now() < existing.expiresAt)
    ) {
      return existing.promise as Promise<T>
    }
    this.entries.delete(key)

    const promise = task().catch((error: unknown) => {
      this.entries.delete(key)
      throw error
    }) as Promise<T>

    const entry: CacheEntry = { promise }
    if (ttlMs) {
      void promise.then(
        (value) => {
          entry.expiresAt = Date.now() + Math.max(0, ttlMs(value))
        },
        () => {},
      )
    }
    this.entries.set(key, entry)
    return promise
  }

  clear(): void {
    this.entries.clear()
  }
}

export const providerRequestCache = new ProviderRequestCache()
