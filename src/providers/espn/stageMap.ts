import type { StageKind } from '@/types/football'

/**
 * ESPN's per-event stage signal is the free-text `season.slug` — round
 * labels ("round-of-16", "quarterfinals") for cups, season names
 * ("2026-27-laliga", "torneo-clausura-2026") for leagues. Best-effort
 * classification; anything unrecognized is a plain league match.
 */
export function normalizeEspnStage(seasonSlug: string | undefined): StageKind {
  if (!seasonSlug) return 'league-match'
  const slug = seasonSlug.toLowerCase()
  if (slug.includes('semi')) return 'semi-final'
  if (slug.includes('quarter')) return 'quarter-final'
  if (slug === 'final' || slug.endsWith('-final') || slug.includes('the-final')) return 'final'
  if (
    slug.includes('playoff') ||
    slug.includes('play-off') ||
    slug.includes('round')
  ) {
    return 'knockout-round'
  }
  if (slug.includes('group') || slug.includes('league-phase')) return 'group-phase'
  return 'league-match'
}
