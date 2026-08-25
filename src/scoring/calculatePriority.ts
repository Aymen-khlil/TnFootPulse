import type { Match, PriorityResult } from '@/types/football'
import { isRivalry } from '@/data/rivalries'
import { clampCompetitionScore } from './competitionScore'
import { teamScore } from './teamScore'
import { contextScore } from './contextScore'
import { timeScore, timeWindowLabel } from './timeScore'
import { getPriorityCategory, STAGE_LABELS } from './priorityCategory'

/**
 * The deterministic, explainable priority engine.
 *
 * Accepts a fully normalized Match and returns the complete breakdown.
 * Pure: no I/O, no React, no API knowledge. Every reason string reflects
 * values that were actually applied.
 */
export function calculatePriority(match: Match): PriorityResult {
  const competition = clampCompetitionScore(match.competition.rating)
  const teams = teamScore(match.homeTeam, match.awayTeam)
  const rivalry = isRivalry(match.homeTeam.name, match.awayTeam.name)
  const context = contextScore(match.stage, rivalry)
  const tunisiaTime = timeScore(match.tunisMinuteOfDay)

  const total = Math.min(100, Math.max(0, competition + teams + context + tunisiaTime))

  return {
    total,
    competition,
    teams,
    context,
    tunisiaTime,
    category: getPriorityCategory(total),
    reasons: [
      `${match.competition.name} · +${competition}`,
      `${teamDescriptor(match)} · +${teams}`,
      `${contextDescriptor(match.stage, rivalry)} · +${context}`,
      `${timeWindowLabel(match.tunisMinuteOfDay)} · +${tunisiaTime}`,
    ],
  }
}

function teamDescriptor({ homeTeam, awayTeam }: Match): string {
  const average = (homeTeam.rating + awayTeam.rating) / 2
  const quality =
    average >= 90
      ? 'Elite teams'
      : average >= 78
        ? 'Strong sides'
        : average >= 60
          ? 'Established clubs'
          : 'Modest opposition'
  return `${quality} — ${homeTeam.name} vs ${awayTeam.name}`
}

function contextDescriptor(stage: Match['stage'], rivalry: boolean): string {
  const parts = [STAGE_LABELS[stage]]
  if (rivalry) parts.push('Major rivalry')
  return parts.join(' + ')
}
