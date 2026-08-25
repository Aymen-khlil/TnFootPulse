export const MAX_COMPETITION_SCORE = 30

/** Clamp a competition rating to the 0–30 component cap. */
export function clampCompetitionScore(rating: number): number {
  return Math.min(MAX_COMPETITION_SCORE, Math.max(0, Math.round(rating)))
}
