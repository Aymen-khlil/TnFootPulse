import type { Match } from '@/types/football'

export type FixturesTransport = (dateKey: string) => Promise<Match[]>

const cache = new Map<string, Promise<Match[]>>()

/**
 * Session-lifetime cache keyed by Tunis date key. Stores promises so
 * concurrent callers share one in-flight request; failed fetches evict
 * their entry so retry genuinely refetches.
 */
export function getMatchesForDate(
  dateKey: string,
  transport: FixturesTransport,
): Promise<Match[]> {
  const existing = cache.get(dateKey)
  if (existing) return existing

  const request = transport(dateKey).catch((error: unknown) => {
    cache.delete(dateKey)
    throw error
  })
  cache.set(dateKey, request)
  return request
}

export function clearFixturesCache(): void {
  cache.clear()
}
