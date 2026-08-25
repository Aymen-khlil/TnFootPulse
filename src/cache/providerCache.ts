export type CacheTask<T> = () => Promise<T>

/**
 * Provider-aware request cache. Keys MUST embed the provider plus the
 * request scope (single date vs range) so distinct providers/queries can
 * never collide: e.g. "api-football:date:2026-08-25" vs
 * "football-data:range:2026-08-25..2026-09-01".
 *
 * Stores promises so concurrent callers share one in-flight request;
 * failed tasks evict their entry so retry genuinely refetches.
 */
export class ProviderRequestCache {
  private promises = new Map<string, Promise<unknown>>()

  run<T>(key: string, task: CacheTask<T>): Promise<T> {
    const existing = this.promises.get(key)
    if (existing) return existing as Promise<T>

    const request = task().catch((error: unknown) => {
      this.promises.delete(key)
      throw error
    }) as Promise<T>
    this.promises.set(key, request)
    return request
  }

  clear(): void {
    this.promises.clear()
  }
}

export const providerRequestCache = new ProviderRequestCache()
