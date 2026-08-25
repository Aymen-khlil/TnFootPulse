import type { MatchStatus } from '@/types/football'

export type NormalizedStatus = {
  visible: boolean
  status: MatchStatus
  minuteElapsed?: number
}

const LIVE_SHORTS = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'SUSP', 'INT'])

/**
 * API-Football status whitelist. Only not-started and in-play fixtures
 * are visible in the agenda (SPEC §12):
 *   visible/scheduled: NS
 *   visible/live:      1H HT 2H ET BT P LIVE SUSP INT
 *   hidden:            TBD FT AET PEN PST CANC ABD AWD WO (+ unseen)
 */
export function normalizeStatus(short: string, elapsed: number | null): NormalizedStatus {
  if (short === 'NS') return { visible: true, status: 'scheduled' }
  if (LIVE_SHORTS.has(short)) {
    return {
      visible: true,
      status: 'live',
      minuteElapsed: elapsed ?? undefined,
    }
  }
  return { visible: false, status: 'scheduled' }
}
