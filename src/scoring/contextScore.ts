import type { StageKind } from '@/types/football'

export const MAX_CONTEXT_SCORE = 25

const STAGE_BASES: Record<StageKind, number> = {
  final: 25,
  'semi-final': 23,
  'quarter-final': 20,
  'knockout-round': 18,
  playoff: 16,
  'group-phase': 8,
  'league-match': 5,
}

const RIVALRY_BONUS = 10

/**
 * "How important is this particular match?" — stage baseline plus
 * rivalry bonus, capped at 25 so bonuses never stack unbounded.
 */
export function contextScore(stage: StageKind, isRivalryMatch: boolean): number {
  const base = STAGE_BASES[stage]
  const bonus = isRivalryMatch ? RIVALRY_BONUS : 0
  return Math.min(MAX_CONTEXT_SCORE, base + bonus)
}
