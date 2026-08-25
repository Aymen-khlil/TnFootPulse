import { TIME_WINDOWS } from '@/data/timeWindows'
import type { TimeWindow } from '@/data/timeWindows'

export const MAX_TIME_SCORE = 20

/** Lookup of Tunis minute-of-day against the configured half-open windows. */
export function timeScore(tunisMinuteOfDay: number): number {
  const minute = clampMinute(tunisMinuteOfDay)
  return windowFor(minute)?.score ?? 0
}

/** Human label of the window a kickoff falls into ("Prime Tunisia time"). */
export function timeWindowLabel(tunisMinuteOfDay: number): string {
  const minute = clampMinute(tunisMinuteOfDay)
  return windowFor(minute)?.label ?? 'Overnight'
}

function windowFor(minute: number): TimeWindow | undefined {
  return TIME_WINDOWS.find(
    (w) => minute >= w.startMinute && minute < w.endMinute,
  )
}

function clampMinute(minute: number): number {
  return Math.min(1439, Math.max(0, Math.round(minute)))
}
