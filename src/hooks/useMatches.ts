import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Match, ScoredMatch } from '@/types/football'
import { calculatePriority } from '@/scoring/calculatePriority'
import { FootballApiError, footballApiTransport } from '@/services/footballApi'
import {
  getMatchesForDate,
  type FixturesTransport,
} from '@/cache/fixturesCache'
import { shiftDateKey, todayInTunis } from '@/utils/timezone'

export type MatchLoadError = {
  kind: 'config' | 'transient'
  message: string
}

export type MatchesState = {
  selectedDateKey: string
  selectDate: (dateKey: string) => void
  scoredMatches: ScoredMatch[]
  isLoading: boolean
  error: MatchLoadError | null
  retry: () => void
}

/**
 * The app's single fetch point. Orchestrates cache → transport →
 * normalize (inside the transport) → score. Initial load pre-fetches
 * tomorrow in parallel (SPEC §7); other dates load on demand. The UI
 * never fetches or scores.
 */
export function useMatches(
  transport: FixturesTransport = footballApiTransport,
): MatchesState {
  const [selectedDateKey, setSelectedDateKey] = useState(todayInTunis)
  const [matchesByDate, setMatchesByDate] = useState<Record<string, Match[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<MatchLoadError | null>(null)

  const store = useCallback((dateKey: string, matches: Match[]) => {
    setMatchesByDate((prev) => ({ ...prev, [dateKey]: matches }))
  }, [])

  const load = useCallback(
    async (dateKey: string) => {
      if (matchesByDate[dateKey]) return
      setIsLoading(true)
      setError(null)
      try {
        const matches = await getMatchesForDate(dateKey, transport)
        store(dateKey, matches)
      } catch (cause) {
        if (cause instanceof FootballApiError && cause.code === 'missing-key') {
          setError({ kind: 'config', message: cause.message })
        } else {
          setError({
            kind: 'transient',
            message: "Unable to load today's matches. Please try again.",
          })
        }
      } finally {
        setIsLoading(false)
      }
    },
    // Loads are per-date idempotent; state reads inside are guarded by the cache map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store, transport],
  )

  useEffect(() => {
    void load(selectedDateKey)
  }, [load, selectedDateKey])

  // Parallel pre-fetch of tomorrow on first mount (SPEC §7 initial load).
  const prefetchedTomorrow = useRef(false)
  useEffect(() => {
    if (prefetchedTomorrow.current) return
    prefetchedTomorrow.current = true
    const tomorrow = shiftDateKey(todayInTunis(), 1)
    void getMatchesForDate(tomorrow, transport)
      .then((matches) => store(tomorrow, matches))
      .catch(() => {}) // surfaced when the user actually selects that date
  }, [store, transport])

  const scoredMatches = useMemo(() => {
    const matches = matchesByDate[selectedDateKey] ?? []
    return matches
      .map((match) => ({ match, priority: calculatePriority(match) }))
      .sort(
        (a, b) =>
          b.priority.total - a.priority.total ||
          a.match.kickoff.getTime() - b.match.kickoff.getTime(),
      )
  }, [matchesByDate, selectedDateKey])

  const selectDate = useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey)
  }, [])

  const retry = useCallback(() => {
    void load(selectedDateKey)
  }, [load, selectedDateKey])

  return { selectedDateKey, selectDate, scoredMatches, isLoading, error, retry }
}
