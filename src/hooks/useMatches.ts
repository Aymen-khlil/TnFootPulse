import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Match, ScoredMatch } from '@/types/football'
import { calculatePriority } from '@/scoring/calculatePriority'
import {
  footballApiTransport,
} from '@/services/footballApi'
import {
  getMatchesForDate,
  type FixturesTransport,
} from '@/cache/fixturesCache'
import { todayInTunis } from '@/utils/timezone'

export type MatchesState = {
  selectedDateKey: string
  selectDate: (dateKey: string) => void
  scoredMatches: ScoredMatch[]
  isLoading: boolean
  error: string | null
  retry: () => void
}

/**
 * The app's single fetch point. Orchestrates cache → transport →
 * normalize (inside the transport) → score. UI never fetches or scores.
 */
export function useMatches(
  transport: FixturesTransport = footballApiTransport,
): MatchesState {
  const [selectedDateKey, setSelectedDateKey] = useState(todayInTunis)
  const [matchesByDate, setMatchesByDate] = useState<Record<string, Match[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (dateKey: string) => {
      if (matchesByDate[dateKey]) return
      setIsLoading(true)
      setError(null)
      try {
        const matches = await getMatchesForDate(dateKey, transport)
        setMatchesByDate((prev) => ({ ...prev, [dateKey]: matches }))
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Unable to load matches. Please try again.',
        )
      } finally {
        setIsLoading(false)
      }
    },
    // matchesByDate intentionally excluded: loads are per-date idempotent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transport],
  )

  useEffect(() => {
    void load(selectedDateKey)
  }, [load, selectedDateKey])

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
