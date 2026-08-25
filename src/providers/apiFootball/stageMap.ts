import type { StageKind } from '@/types/football'

/**
 * Maps API-Football league.round strings to internal stages.
 * Order-sensitive: "Quarter-finals" contains "final", so quarter is
 * tested first. Unrecognized strings degrade conservatively to a normal
 * league match with a dev-mode warning so drift stays visible.
 */
export function normalizeStage(rawRound: string | undefined): StageKind {
  const round = (rawRound ?? '').toLowerCase()

  if (!round) {
    warnUnrecognized(rawRound)
    return 'league-match'
  }

  if (/3rd place|third place/.test(round)) return 'knockout-round'
  if (/quarter/.test(round)) return 'quarter-final'
  if (/semi/.test(round)) return 'semi-final'
  if (/final/.test(round)) return 'final'
  if (
    /round of \d+|1\/8|1\/16|last 16|last 32|first round|1st round|2nd round|3rd round|4th round|5th round|6th round|\d+(st|nd|rd|th) round|qualifying|preliminary/.test(
      round,
    )
  ) {
    return 'knockout-round'
  }
  if (/play-?off/.test(round)) return 'playoff'
  if (/group|league phase/.test(round)) return 'group-phase'
  if (/regular season|match ?day/.test(round)) return 'league-match'

  warnUnrecognized(rawRound)
  return 'league-match'
}

function warnUnrecognized(rawRound: string | undefined): void {
  if (import.meta.env.DEV) {
    console.warn(`[apiFootball/normalizeStage] Unrecognized round string: "${rawRound}" — treated as a regular league match.`)
  }
}
