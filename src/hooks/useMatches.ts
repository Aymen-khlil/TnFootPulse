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
import { MANUAL_REFRESH_COOLDOWN_MS, REVALIDATE_TICK_MS } from '@/config/limits'
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
  /**
   * True while the manual 🔄 button is inside its cooldown window —
   * mashing refresh must not translate into a request storm.
   */
  isRefreshCoolingDown: boolean
}

/**
 * The app's single data touchpoint. Delegates provider orchestration,
 * merging, dedup and scoring to the agenda service; caches per date so
 * revisits cost nothing. Initial load pre-warms tomorrow in parallel.
 *
 * A visibility-gated background tick calls the agenda service every
 * minute; the cache layers make ticks free unless the entry's freshness
 * window has passed — which is exactly how live-window score updates
 * happen without any dedicated polling loop against API-Football.
 */
export function useMatches(deps?: AgendaDeps): MatchesState {
  const agendaDeps = deps ?? defaultAgendaDeps
  const [selectedDateKey, setSelectedDateKey] = useState(todayInTunis)
  const [agendaByDate, setAgendaByDate] = useState<Record<string, AgendaResult>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<MatchLoadError | null>(null)
  const [isRefreshCoolingDown, setIsRefreshCoolingDown] = useState(false)

  const load = useCallback(
    async (dateKey: string, options: { silent?: boolean } = {}) => {
      const silent = options.silent === true
      if (!silent) {
        setIsLoading(true)
        setError(null)
      }
      try {
        const agenda = await getAgendaForDate(dateKey, agendaDeps)
        setAgendaByDate((prev) => ({ ...prev, [dateKey]: agenda }))
      } catch (cause) {
        if (!silent) setError(toLoadError(cause))
      } finally {
        if (!silent) setIsLoading(false)
      }
    },
    [agendaDeps],
  )

  useEffect(() => {
    void load(selectedDateKey)
  }, [load, selectedDateKey])

  // Background revalidation. Hidden tabs skip ticks so backgrounded
  // sessions never spend quota.
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return
      }
      void load(selectedDateKey, { silent: true })
    }, REVALIDATE_TICK_MS)
    return () => window.clearInterval(intervalId)
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

  const lastManualRefreshRef = useRef(0)
  const retry = useCallback(() => {
    const now = Date.now()
    if (now - lastManualRefreshRef.current < MANUAL_REFRESH_COOLDOWN_MS) {
      return
    }
    lastManualRefreshRef.current = now
    setIsRefreshCoolingDown(true)
    resetAgendaCache()
    void load(selectedDateKey)
  }, [load, selectedDateKey])

  useEffect(() => {
    if (!isRefreshCoolingDown) return
    const elapsed = Date.now() - lastManualRefreshRef.current
    const remaining = Math.max(0, MANUAL_REFRESH_COOLDOWN_MS - elapsed)
    const timerId = window.setTimeout(
      () => setIsRefreshCoolingDown(false),
      remaining,
    )
    return () => window.clearTimeout(timerId)
  }, [isRefreshCoolingDown])

  return {
    selectedDateKey,
    selectDate,
    scoredMatches: agendaByDate[selectedDateKey]?.matches ?? [],
    providerNotices: agendaByDate[selectedDateKey]?.providerNotices ?? [],
    isLoading,
    error,
    retry,
    isRefreshCoolingDown,
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
