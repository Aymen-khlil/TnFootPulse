import { useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PriorityCategoryName, ScoredMatch } from '@/types/football'
import { PRIORITY_CATEGORY_ORDER, priorityCategoryMeta } from '@/scoring/priorityCategory'
import { competitionDisplayName } from '@/data/competitions'

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

function MatchFilters({
  priorityFilter,
  onPriorityFilterChange,
  competitionFilter,
  onCompetitionFilterChange,
  scoredMatches,
}: MatchFiltersProps) {
  const competitionOptions = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; country?: string; rating: number }>()
    for (const { match } of scoredMatches) {
      if (!byId.has(match.competition.id)) byId.set(match.competition.id, match.competition)
    }
    return [...byId.values()]
  }, [scoredMatches])

  return (
    <div className="space-y-3">
      <Tabs
        value={priorityFilter}
        onValueChange={(v) => onPriorityFilterChange(v as PriorityFilter)}
      >
        <TabsList className="h-auto max-w-full flex-wrap justify-start sm:flex-nowrap sm:overflow-x-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {PRIORITY_CATEGORY_ORDER.filter((c) => c !== 'low-priority').map((category) => {
            const meta = priorityCategoryMeta(category)
            return (
              <TabsTrigger key={category} value={category}>
                <span aria-hidden>{meta.emoji}</span>
                <span className="hidden md:inline">{meta.label}</span>
                <span className="md:hidden">{shortLabel(category)}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">Competition</span>
        <Select value={competitionFilter} onValueChange={onCompetitionFilterChange}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All competitions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All competitions</SelectItem>
            {competitionOptions.map((comp) => (
              <SelectItem key={comp.id} value={comp.id}>
                {competitionDisplayName(comp)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function shortLabel(category: PriorityCategoryName): string {
  switch (category) {
    case 'must-watch':
      return 'Must'
    case 'high-priority':
      return 'High'
    case 'worth-watching':
      return 'Worth'
    case 'if-you-have-time':
      return 'Maybe'
    default:
      return category
  }
}

export { MatchFilters }
