import { useMemo } from 'react'
import type { ScoredMatch } from '@/types/football'
import { PRIORITY_CATEGORY_ORDER, priorityCategoryMeta } from '@/scoring/priorityCategory'
import { competitionDisplayName } from '@/data/competitions'
import { cn } from '@/lib/utils'

export const PRIORITY_FILTER_VALUES = [
  'all',
  ...PRIORITY_CATEGORY_ORDER.filter((c) => c !== 'low-priority'),
] as const

export type PriorityFilter = (typeof PRIORITY_FILTER_VALUES)[number]

type MatchFiltersProps = {
  priorityFilter: PriorityFilter
  onPriorityFilterChange: (filter: PriorityFilter) => void
  competitionFilter: string
  onCompetitionFilterChange: (competitionId: string) => void
  scoredMatches: ScoredMatch[]
}

function FilterGroupLabel({ children }: { children: string }) {
  return (
    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted">
      {children}
    </p>
  )
}

function Pill({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
        selected
          ? 'border-primary/60 bg-primary/10 text-primary'
          : 'border-border text-muted hover:border-border hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

/** Labeled pill groups: priority bands + that day's competitions (ADR-0001). */
function MatchFilters({
  priorityFilter,
  onPriorityFilterChange,
  competitionFilter,
  onCompetitionFilterChange,
  scoredMatches,
}: MatchFiltersProps) {
  const competitionOptions = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; country?: string }>()
    for (const { match } of scoredMatches) {
      if (!byId.has(match.competition.id)) byId.set(match.competition.id, match.competition)
    }
    return [...byId.values()]
  }, [scoredMatches])

  return (
    <div className="space-y-4">
      <div>
        <FilterGroupLabel>Priority</FilterGroupLabel>
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill selected={priorityFilter === 'all'} onClick={() => onPriorityFilterChange('all')}>
            All
          </Pill>
          {PRIORITY_CATEGORY_ORDER.filter((c) => c !== 'low-priority').map((category) => {
            const meta = priorityCategoryMeta(category)
            return (
              <Pill
                key={category}
                selected={priorityFilter === category}
                onClick={() => onPriorityFilterChange(category as PriorityFilter)}
              >
                <span aria-hidden className="mr-1">{meta.emoji}</span>
                {meta.label}
              </Pill>
            )
          })}
        </div>
      </div>

      {competitionOptions.length > 0 && (
        <div>
          <FilterGroupLabel>Competitions</FilterGroupLabel>
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill selected={competitionFilter === 'all'} onClick={() => onCompetitionFilterChange('all')}>
              All
            </Pill>
            {competitionOptions.map((comp) => (
              <Pill
                key={comp.id}
                selected={competitionFilter === comp.id}
                onClick={() => onCompetitionFilterChange(comp.id)}
              >
                {shortCompetitionLabel(comp)}
              </Pill>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Compact chip label: well-known abbreviations, country disambiguation otherwise. */
function shortCompetitionLabel(comp: { id: string; name: string; country?: string }): string {
  if (comp.id === 'ucl') return 'UCL'
  if (comp.id === 'tunisian-ligue-1') return 'Tunisian Ligue 1'
  return competitionDisplayName(comp)
}

export { MatchFilters, shortCompetitionLabel }
