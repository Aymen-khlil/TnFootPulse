import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScoredMatch } from '@/types/football'
import {
  defaultAgendaDeps,
  getAgendaForDate,
  prefetchTomorrow,
  resetAgendaCache,
  type AgendaDeps,
  type AgendaResult,
} from '@/services/fixturesOrchestrator'
import { todayInTunis } from '@/utils/timezone'

export type MatchLoadError = {
  kind: 'config' | 'transient'
  message: string
}

export type MatchesState = {
  selectedDateKey: string
  selectDate: (dateKey: string) => void
  scoredMatches: ScoredMatch[]
  /** Non-blocking explanations when one provider contributed nothing. */
  providerNotices: string[]
  isLoading: boolean
  error: MatchLoadError | null
  retry: () => void
}

/**
 * The app's single data touchpoint. Delegates provider orchestration,
 * merging, dedup and scoring to the agenda service; caches per date so
 * revisits cost nothing. Initial load pre-warms tomorrow in parallel.
 */
export function useMatches(deps?: AgendaDeps): MatchesState {
  const agendaDeps = deps ?? defaultAgendaDeps
  const [selectedDateKey, setSelectedDateKey] = useState(todayInTunis)
  const [agendaByDate, setAgendaByDate] = useState<Record<string, AgendaResult>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<MatchLoadError | null>(null)

  const load = useCallback(
    async (dateKey: string) => {
      setIsLoading(true)
      setError(null)
      try {
        const agenda = await getAgendaForDate(dateKey, agendaDeps)
        setAgendaByDate((prev) => ({ ...prev, [dateKey]: agenda }))
      } catch (cause) {
        setError(toLoadError(cause))
      } finally {
        setIsLoading(false)
      }
    },
    [agendaDeps],
  )

  useEffect(() => {
    void load(selectedDateKey)
  }, [load, selectedDateKey])

  const prefetched = useRef(false)
  useEffect(() => {
    if (prefetched.current) return
    prefetched.current = true
    prefetchTomorrow(agendaDeps)
  }, [agendaDeps])

  const selectDate = useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey)
  }, [])

  const retry = useCallback(() => {
    resetAgendaCache()
    void load(selectedDateKey)
  }, [load, selectedDateKey])

  return {
    selectedDateKey,
    selectDate,
    scoredMatches: agendaByDate[selectedDateKey]?.matches ?? [],
    providerNotices: agendaByDate[selectedDateKey]?.providerNotices ?? [],
    isLoading,
    error,
    retry,
  }
}

function toLoadError(cause: unknown): MatchLoadError {
  const code = (cause as { code?: string } | null)?.code
  if (code === 'missing-key' || code === 'missing-token') {
    return {
      kind: 'config',
      message:
        cause instanceof Error && cause.message
          ? cause.message
          : 'Provider credentials are missing.',
    }
  }
  return {
    kind: 'transient',
    message: "Unable to load today's matches. Please try again.",
  }
}
