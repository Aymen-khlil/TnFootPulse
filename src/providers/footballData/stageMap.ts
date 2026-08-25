import type { StageKind } from '@/types/football'

/**
 * Maps football-data.org v4 stage enums to internal stages.
 * Leagues carry `stage: REGULAR_SEASON` + integer matchday and have no
 * round-string resource — the raw stage is preserved on the Match for
 * debugging either way.
 */
const STAGE_MAP: Record<string, StageKind> = {
  FINAL: 'final',
  SEMI_FINALS: 'semi-final',
  QUARTER_FINALS: 'quarter-final',
  THIRD_PLACE: 'knockout-round',
  LAST_16: 'knockout-round',
  LAST_32: 'knockout-round',
  LAST_64: 'knockout-round',
  ROUND_1: 'knockout-round',
  ROUND_2: 'knockout-round',
  ROUND_3: 'knockout-round',
  ROUND_4: 'knockout-round',
  PLAYOFF_ROUND_1: 'playoff',
  PLAYOFF_ROUND_2: 'playoff',
  PLAYOFFS: 'playoff',
  PRELIMINARY_ROUND: 'playoff',
  QUALIFICATION: 'playoff',
  QUALIFICATION_ROUND_1: 'playoff',
  QUALIFICATION_ROUND_2: 'playoff',
  QUALIFICATION_ROUND_3: 'playoff',
  GROUP_STAGE: 'group-phase',
  REGULAR_SEASON: 'league-match',
  APERTURA: 'league-match',
  CLAUSURA: 'league-match',
  CHAMPIONSHIP: 'league-match',
  CHAMPIONSHIP_ROUND: 'league-match',
  RELEGATION: 'league-match',
  RELEGATION_ROUND: 'league-match',
}

export function normalizeStage(stage: string | null | undefined): StageKind {
  if (!stage) {
    warnUnrecognized(stage)
    return 'league-match'
  }
  const mapped = STAGE_MAP[stage]
  if (mapped) return mapped
  warnUnrecognized(stage)
  return 'league-match'
}

function warnUnrecognized(stage: string | null | undefined): void {
  if (import.meta.env.DEV) {
    console.warn(`[footballData/stageMap] Unrecognized stage: "${stage}" — treated as a regular league match.`)
  }
}
