import { useMemo, useState } from 'react'
import type { ScoredMatch } from '@/types/football'
import { useMatches } from '@/hooks/useMatches'
import { Header } from '@/components/Header'
import { DateSelector } from '@/components/DateSelector'
import {
  MatchFilters,
  type PriorityFilter,
} from '@/components/MatchFilters'
import { MatchList } from '@/components/MatchList'
import { MatchDetailsDialog } from '@/components/MatchDetailsDialog'
import { AgendaSkeleton } from '@/components/MatchCardSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'

function Home() {
  const {
    selectedDateKey,
    selectDate,
    scoredMatches,
    providerNotices,
    isLoading,
    error,
    retry,
    isRefreshCoolingDown,
  } = useMatches()

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [competitionFilter, setCompetitionFilter] = useState('all')
  const [detail, setDetail] = useState<ScoredMatch | null>(null)

  const worthCount = useMemo(
    () =>
      scoredMatches.filter((s) =>
        ['must-watch', 'high-priority'].includes(s.priority.category)
      ).length,
    [scoredMatches],
  )

  const filtered = useMemo(
    () =>
      scoredMatches.filter(({ priority, match }) =>
        (priorityFilter === 'all' || priority.category === priorityFilter) &&
        (competitionFilter === 'all' || match.competition.id === competitionFilter),
      ),
    [scoredMatches, priorityFilter, competitionFilter],
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        onRefresh={retry}
        isRefreshing={isLoading}
        isCoolingDown={isRefreshCoolingDown}
      />
      <main className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-8">
        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Football Tonight
          </h1>
          {worthCount > 0 && (
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-primary">
              <span aria-hidden>⚡</span>
              {worthCount} match{worthCount === 1 ? '' : 'es'} worth watching
            </p>
          )}
          <p className="mt-1 text-sm text-muted">
            All times are Tunisia time
          </p>
          <DateSelector
            selectedDateKey={selectedDateKey}
            onSelect={selectDate}
            className="mt-4"
          />
        </section>

        <div className="my-6 space-y-3">
          <MatchFilters
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            competitionFilter={competitionFilter}
            onCompetitionFilterChange={setCompetitionFilter}
            scoredMatches={scoredMatches}
          />
        </div>

        {providerNotices.length > 0 && !isLoading && (
          <div role="status" className="mb-4 space-y-1">
            {providerNotices.map((notice) => (
              <p key={notice} className="text-sm text-amber-400/90">
                ⓘ {notice}
              </p>
            ))}
          </div>
        )}

        {isLoading ? (
          <AgendaSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={retry} />
        ) : scoredMatches.length === 0 ? (
          <EmptyState variant="no-matches" />
        ) : filtered.length === 0 ? (
          <EmptyState variant="no-filter-match" />
        ) : (
          <MatchList scoredMatches={filtered} onSelect={setDetail} />
        )}
      </main>

      <MatchDetailsDialog
        scored={detail}
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
      />
    </div>
  )
}

export { Home }