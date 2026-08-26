import type { Match, ScoredMatch } from '@/types/football'

/**
 * localStorage-backed persistence for per-date agendas.
 *
 * Purpose: make reloads free. A page reload wipes the in-memory request
 * cache; without persistence every revisit re-burns provider quota for
 * data we already had. Snapshots are written through by the orchestrator
 * on every successful fetch and carry their own expiry, so freshness
 * rules stay in exactly one place (the orchestrator's TTL policy).
 *
 * Storage is optional by design: node tests and privacy modes fall back
 * to a process-local store with identical semantics. Serialization is
 * hand-rolled because `Match.kickoff` is a Date and must survive as a
 * real Date after revival — scoring and sorting depend on it.
 */

const KEY_PREFIX = 'tfp:agenda:v1:'

interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  /** Keys currently present (used by prefix sweeps). */
  keys(): string[]
}

function localStorageLike(): KeyValueStore | null {
  try {
    const candidate = (globalThis as Record<string, unknown>).localStorage as
      | (Pick<KeyValueStore, 'getItem' | 'setItem' | 'removeItem'> & { length: number; key(i: number): string | null })
      | undefined
    if (!candidate) return null
    const probe = '__tfp_probe__'
    candidate.setItem(probe, probe)
    candidate.removeItem(probe)
    return {
      getItem: (k) => candidate.getItem(k),
      setItem: (k, v) => candidate.setItem(k, v),
      removeItem: (k) => candidate.removeItem(k),
      keys: () => {
        const out: string[] = []
        for (let i = 0; i < candidate.length; i += 1) {
          const key = candidate.key(i)
          if (key !== null) out.push(key)
        }
        return out
      },
    }
  } catch {
    return null
  }
}

function memoryStore(): KeyValueStore {
  const map = new Map<string, string>()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
    keys: () => Array.from(map.keys()),
  }
}

/** Module-level singleton so every call shares one persistence surface. */
let resolvedStore: KeyValueStore | null = null

function store(): KeyValueStore {
  if (!resolvedStore) {
    resolvedStore = localStorageLike() ?? memoryStore()
  }
  return resolvedStore
}

/** Test seam: swap the persistence surface (also used to force memory mode). */
export function useStoreForTests(override: KeyValueStore | null): void {
  resolvedStore = override
}

type StoredAgenda = {
  savedAt: number
  expiresAt: number
  matches: ScoredMatch[]
  providerNotices: string[]
}

export type AgendaSnapshot = {
  matches: ScoredMatch[]
  providerNotices: string[]
}

function serializeMatch(match: Match): Match {
  // JSON.stringify turns Dates into ISO strings; make that explicit so
  // revival has exactly one shape to expect.
  return { ...match, kickoff: match.kickoff.toISOString() as unknown as Date }
}

function reviveMatch(raw: unknown): Match | null {
  const candidate = raw as Match | undefined
  if (!candidate || typeof candidate !== 'object') return null
  const kickoffRaw = (candidate as { kickoff?: unknown }).kickoff
  const kickoff =
    kickoffRaw instanceof Date
      ? kickoffRaw
      : typeof kickoffRaw === 'string'
        ? new Date(kickoffRaw)
        : null
  if (!kickoff || Number.isNaN(kickoff.getTime())) return null
  return { ...candidate, kickoff }
}

/** Persist an agenda snapshot with its freshness window. Quota errors are swallowed. */
export function saveAgenda(
  dateKey: string,
  snapshot: AgendaSnapshot,
  ttlMs: number,
  now: number = Date.now(),
): void {
  const stored: StoredAgenda = {
    savedAt: now,
    expiresAt: now + Math.max(0, ttlMs),
    matches: snapshot.matches.map((scored) => ({
      ...scored,
      match: serializeMatch(scored.match),
    })),
    providerNotices: [...snapshot.providerNotices],
  }
  try {
    store().setItem(KEY_PREFIX + dateKey, JSON.stringify(stored))
  } catch {
    // Persistence is best-effort; the in-memory cache still covers the session.
  }
}

/**
 * Return the persisted snapshot for `dateKey` when it exists and has not
 * expired. Corrupt or foreign-shaped entries are treated as absent and
 * evicted so a single bad write can never wedge a date permanently.
 */
export function loadFreshAgenda(
  dateKey: string,
  now: number = Date.now(),
): AgendaSnapshot | null {
  let raw: string | null = null
  try {
    raw = store().getItem(KEY_PREFIX + dateKey)
  } catch {
    return null
  }
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredAgenda
    if (
      typeof parsed?.savedAt !== 'number' ||
      typeof parsed?.expiresAt !== 'number' ||
      !Array.isArray(parsed.matches) ||
      !Array.isArray(parsed.providerNotices)
    ) {
      throw new Error('malformed snapshot')
    }
    if (now >= parsed.expiresAt) return null

    const matches: ScoredMatch[] = []
    for (const scored of parsed.matches) {
      const revivedMatch = reviveMatch(scored?.match)
      const priority = scored?.priority
      if (!revivedMatch || typeof priority !== 'object' || priority === null) {
        throw new Error('malformed match entry')
      }
      matches.push({ match: revivedMatch, priority })
    }

    return { matches, providerNotices: [...parsed.providerNotices] }
  } catch {
    try {
      store().removeItem(KEY_PREFIX + dateKey)
    } catch {
      // ignore
    }
    return null
  }
}

/** Drop ALL persisted agendas (manual refresh semantics: force network). */
export function clearAgendaStorage(): void {
  try {
    for (const key of store().keys()) {
      if (key.startsWith(KEY_PREFIX)) store().removeItem(key)
    }
  } catch {
    // best-effort
  }
}
