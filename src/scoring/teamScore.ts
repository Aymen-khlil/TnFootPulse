import type { Team } from '@/types/football'

export const MAX_TEAM_SCORE = 25

/**
 * "How interesting are these teams?" — average of both curated ratings,
 * scaled to the 25-point cap and rounded to an integer.
 */
export function teamScore(home: Team, away: Team): number {
  const average = (home.rating + away.rating) / 2
  return clamp(Math.round((average / 100) * MAX_TEAM_SCORE))
}

function clamp(score: number): number {
  return Math.min(MAX_TEAM_SCORE, Math.max(0, score))
}
