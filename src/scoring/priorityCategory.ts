import type { PriorityCategoryName, StageKind } from '@/types/football'

export type PriorityCategoryMeta = {
  name: PriorityCategoryName
  emoji: string
  label: string
  min: number
  max: number
  /** Badge/pill styling per category; color = category (ADR-0001). */
  badgeClass: string
  /** Accent text/stroke color for gauges, score chips and numbers. */
  accentTextClass: string
}

export const STAGE_LABELS: Record<StageKind, string> = {
  final: 'Final',
  'semi-final': 'Semi-final',
  'quarter-final': 'Quarter-final',
  'knockout-round': 'Knockout round',
  playoff: 'Playoff',
  'group-phase': 'Group stage',
  'league-match': 'League match',
}

export const PRIORITY_CATEGORY_ORDER: PriorityCategoryName[] = [
  'must-watch',
  'high-priority',
  'worth-watching',
  'if-you-have-time',
  'low-priority',
]

export const PRIORITY_CATEGORIES: Record<PriorityCategoryName, PriorityCategoryMeta> =
  {
    'must-watch': {
      name: 'must-watch',
      emoji: '🔥',
      label: 'Must Watch',
      min: 90,
      max: 100,
      badgeClass: 'border-transparent bg-crimson text-white',
      accentTextClass: 'text-red-400',
    },
    'high-priority': {
      name: 'high-priority',
      emoji: '🔴',
      label: 'High Priority',
      min: 80,
      max: 89,
      badgeClass: 'border-transparent bg-amber-500/90 text-amber-950',
      accentTextClass: 'text-amber-400',
    },
    'worth-watching': {
      name: 'worth-watching',
      emoji: '⭐',
      label: 'Worth Watching',
      min: 70,
      max: 79,
      badgeClass: 'border-transparent bg-emerald-500/90 text-emerald-950',
      accentTextClass: 'text-emerald-400',
    },
    'if-you-have-time': {
      name: 'if-you-have-time',
      emoji: '👀',
      label: 'If You Have Time',
      min: 55,
      max: 69,
      badgeClass: 'border-transparent bg-slate-700 text-slate-100',
      accentTextClass: 'text-slate-300',
    },
    'low-priority': {
      name: 'low-priority',
      emoji: '💤',
      label: 'Low Priority',
      min: 0,
      max: 54,
      badgeClass: 'border-border bg-elevated text-muted',
      accentTextClass: 'text-zinc-500',
    },
  }

export function getPriorityCategory(total: number): PriorityCategoryName {
  const score = Math.min(100, Math.max(0, total))
  for (const name of PRIORITY_CATEGORY_ORDER) {
    const { min, max } = PRIORITY_CATEGORIES[name]
    if (score >= min && score <= max) return name
  }
  return 'low-priority'
}

export function priorityCategoryMeta(name: PriorityCategoryName): PriorityCategoryMeta {
  return PRIORITY_CATEGORIES[name]
}

/** Accent for the pedigree top-up row (ADR-0001 keeps every color decision here or in the theme block). */
export const PEDIGREE_ROW_ACCENT_CLASS = 'text-amber-400'
