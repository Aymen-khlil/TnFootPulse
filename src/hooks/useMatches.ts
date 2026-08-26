import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScoredMatch, SourceMode } from '@/types/football'
import {
  defaultAgendaDeps,
  getAgendaForDate,
  prefetchTomorrow,
  resetAgendaCache,
  type AgendaDeps,
  type AgendaResult,
} from '@/services/fixturesOrchestrator'
import {
  defaultEspnAgendaDeps,
  getEspnAgendaForDate,
  type EspnAgendaDeps,
} from '@/services/espnAgenda'
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
  /** Active Source Mode; session-only, always starts curated. */
  sourceMode: SourceMode
  setSourceMode: (mode: SourceMode) => void
}

/**
 * The app's single data touchpoint. Delegates provider orchestration,
 * merging, dedup and scoring to the agenda services for the ACTIVE
 * Source Mode — pipelines never mix. Initial load pre-warms tomorrow in
 * Curated Mode only (the ESPN experiment stays frugal).
 *
 * A visibility-gated background tick calls the active service every
 * minute; the cache layers make ticks free unless the entry's freshness
 * window has passed — which is exactly how live-window score updates
 * happen without any dedicated polling loop against API-Football.
 */
export function useMatches(deps?: AgendaDeps, espnDeps?: EspnAgendaDeps): MatchesState {
  const agendaDeps = deps ?? defaultAgendaDeps
  const espnLaneDeps = espnDeps ?? defaultEspnAgendaDeps
  const [selectedDateKey, setSelectedDateKey] = useState(todayInTunis)
  const [sourceMode, setSourceMode] = useState<SourceMode>('curated')
  const [agendaByDate, setAgendaByDate] = useState<Record<string, AgendaResult>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<MatchLoadError | null>(null)
  const [isRefreshCoolingDown, setIsRefreshCoolingDown] = useState(false)

  const load = useCallback(
    async (dateKey: string, mode: SourceMode, options: { silent?: boolean } = {}) => {
      const silent = options.silent === true
      if (!silent) {
        setIsLoading(true)
        setError(null)
      }
      const cacheKey = `${mode}:${dateKey}`
      try {
        const agenda =
          mode === 'espn'
            ? await getEspnAgendaForDate(dateKey, espnLaneDeps)
            : await getAgendaForDate(dateKey, agendaDeps)
        setAgendaByDate((prev) => ({ ...prev, [cacheKey]: agenda }))
        // A successful load supersedes any previous failure — including
        // silent background recoveries of the experimental lane.
        setError(null)
      } catch (cause) {
        if (!silent) setError(toLoadError(cause, mode))
      } finally {
        if (!silent) setIsLoading(false)
      }
    },
    [agendaDeps, espnLaneDeps],
  )

  useEffect(() => {
    void load(selectedDateKey, sourceMode)
  }, [load, selectedDateKey, sourceMode])

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
      void load(selectedDateKey, sourceMode, { silent: true })
    }, REVALIDATE_TICK_MS)
    return () => window.clearInterval(intervalId)
  }, [load, selectedDateKey, sourceMode])

  // Tomorrow warm-up is a Curated Mode luxury — the experimental lane
  // stays strictly on-demand.
  const prefetched = useRef(false)
  useEffect(() => {
    if (prefetched.current || sourceMode !== 'curated') return
    prefetched.current = true
    prefetchTomorrow(agendaDeps)
  }, [agendaDeps, sourceMode])

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
    resetAgendaCache(sourceMode)
    void load(selectedDateKey, sourceMode)
  }, [load, selectedDateKey, sourceMode])

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

  const cacheKey = `${sourceMode}:${selectedDateKey}`
  return {
    selectedDateKey,
    selectDate,
    scoredMatches: agendaByDate[cacheKey]?.matches ?? [],
    providerNotices: agendaByDate[cacheKey]?.providerNotices ?? [],
    isLoading,
    error,
    retry,
    isRefreshCoolingDown,
    sourceMode,
    setSourceMode,
  }
}

function toLoadError(cause: unknown, mode: SourceMode): MatchLoadError {
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
  if (mode === 'espn') {
    const code = (cause as { code?: string } | null)?.code
    return {
      kind: 'transient',
      message:
        code === 'http'
          ? 'The experimental ESPN feed rejected this browser or is down.'
          : 'The experimental ESPN feed is unavailable right now.',
    }
  }
  return {
    kind: 'transient',
    message: "Unable to load today's matches. Please try again.",
  }
}
