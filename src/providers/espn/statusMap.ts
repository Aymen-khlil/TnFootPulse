import type { MatchStatus } from '@/types/football'

export type NormalizedEspnStatus = {
  visible: boolean
  status: MatchStatus
  minuteElapsed?: number
}

/**
 * ESPN state whitelist (`competitions[].status.type.state`).
 * Parity rule with the other two providers (SPEC §12): finished matches
 * are NEVER visible — the agenda is a watch guide, not a results board.
 *   visible/scheduled: pre
 *   visible/live:      in  (minute derived from clock seconds)
 *   hidden:            post (+ anything unseen)
 */
export function normalizeEspnStatus(
  state: string | undefined,
  clockSeconds: number | undefined,
): NormalizedEspnStatus {
  if (state === 'pre') return { visible: true, status: 'scheduled' }
  if (state === 'in') {
    return {
      visible: true,
      status: 'live',
      minuteElapsed:
        typeof clockSeconds === 'number' && clockSeconds > 0
          ? Math.round(clockSeconds / 60)
          : undefined,
    }
  }
  return { visible: false, status: 'scheduled' }
}
