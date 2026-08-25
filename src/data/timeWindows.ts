/**
 * Football knowledge: how convenient a kickoff hour is for viewers in
 * Tunisia. Half-open intervals [startMinute, endMinute) on minutes since
 * Tunis midnight; midnight-wrapping windows are split explicitly.
 */
export type TimeWindow = {
  startMinute: number
  endMinute: number
  score: number
  label: string
}

export const TIME_WINDOWS: TimeWindow[] = [
  { startMinute: 360, endMinute: 780, score: 4, label: 'Morning kickoff' },
  { startMinute: 780, endMinute: 900, score: 8, label: 'Early afternoon' },
  { startMinute: 900, endMinute: 960, score: 12, label: 'Late afternoon' },
  { startMinute: 960, endMinute: 1080, score: 17, label: 'Good evening slot' },
  { startMinute: 1080, endMinute: 1290, score: 20, label: 'Prime Tunisia time' },
  { startMinute: 1290, endMinute: 1350, score: 17, label: 'Good evening slot' },
  { startMinute: 1350, endMinute: 1410, score: 12, label: 'Night kickoff' },
  { startMinute: 1410, endMinute: 1440, score: 7, label: 'Late night' },
  { startMinute: 0, endMinute: 30, score: 7, label: 'Late night' },
  { startMinute: 30, endMinute: 120, score: 3, label: 'Very late night' },
  { startMinute: 120, endMinute: 360, score: 0, label: 'Overnight' },
]
