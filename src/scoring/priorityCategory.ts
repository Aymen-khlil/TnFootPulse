import type { PriorityCategoryName } from '@/types/football'

export type PriorityCategoryMeta = {
  name: PriorityCategoryName
  emoji: string
  label: string
  min: number
  max: number
  /** Badge styling per category; priority colors outrank competition colors. */
  badgeClass: string
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
      badgeClass:
        'border-transparent bg-gradient-to-r from-primary to-pulse text-white',
    },
    'high-priority': {
      name: 'high-priority',
      emoji: '🔴',
      label: 'High Priority',
      min: 80,
      max: 89,
      badgeClass: 'border-transparent bg-primary/90 text-white',
    },
    'worth-watching': {
      name: 'worth-watching',
      emoji: '⭐',
      label: 'Worth Watching',
      min: 70,
      max: 79,
      badgeClass: 'border-transparent bg-amber-500/90 text-black',
    },
    'if-you-have-time': {
      name: 'if-you-have-time',
      emoji: '👀',
      label: 'If You Have Time',
      min: 55,
      max: 69,
      badgeClass: 'border-transparent bg-sky-800 text-sky-100',
    },
    'low-priority': {
      name: 'low-priority',
      emoji: '💤',
      label: 'Low Priority',
      min: 0,
      max: 54,
      badgeClass: 'border-border bg-elevated text-muted',
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
