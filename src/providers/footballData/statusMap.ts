import type { MatchStatus } from '@/types/football'

export type NormalizedStatus = {
  visible: boolean
  status: MatchStatus
}

const LIVE_STATUSES = new Set([
  'IN_PLAY',
  'PAUSED',
  'EXTRA_TIME',
  'PENALTY_SHOOTOUT',
  'SUSPENDED', // parity with API-Football INT handling: shown as live
])

/**
 * football-data.org status whitelist (v4 enum). `LIVE` exists only as a
 * filter pseudo-status, never a field value.
 *   visible/scheduled: SCHEDULED, TIMED
 *   visible/live:      IN_PLAY, PAUSED, EXTRA_TIME, PENALTY_SHOOTOUT, SUSPENDED
 *   hidden:            FINISHED, POSTPONED, CANCELLED, AWARDED (+ unseen)
 */
export function normalizeStatus(status: string): NormalizedStatus {
  if (status === 'SCHEDULED' || status === 'TIMED') {
    return { visible: true, status: 'scheduled' }
  }
  if (LIVE_STATUSES.has(status)) {
    return { visible: true, status: 'live' }
  }
  return { visible: false, status: 'scheduled' }
}
