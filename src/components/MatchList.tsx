import type { ScoredMatch } from '@/types/football'
import {
  PRIORITY_CATEGORY_ORDER,
  priorityCategoryMeta,
} from '@/scoring/priorityCategory'
import { FeaturedMatchCard } from './FeaturedMatchCard'
import { MatchCard } from './MatchCard'

type MatchListProps = {
  scoredMatches: ScoredMatch[]
  onSelect: (scored: ScoredMatch) => void
}

/** Groups by priority category (display order), descending score within each. */
function MatchList({ scoredMatches, onSelect }: MatchListProps) {
  return (
    <div className="space-y-8">
      {PRIORITY_CATEGORY_ORDER.map((category) => {
        const group = scoredMatches.filter((s) => s.priority.category === category)
        if (group.length === 0) return null
        const meta = priorityCategoryMeta(category)

        return (
          <section key={category}>
            <div className="mb-3 flex items-baseline gap-2">
              <h2 className="text-lg font-bold tracking-tight">
                <span aria-hidden>{meta.emoji}</span> {meta.label}
              </h2>
              <span className="text-xs text-muted">
                ({meta.min}-{meta.max})
              </span>
            </div>

            {category === 'must-watch' ? (
              <div className="space-y-3">
                {group.map((scored) => (
                  <FeaturedMatchCard key={scored.match.id} scored={scored} onSelect={onSelect} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {group.map((scored) => (
                  <MatchCard key={scored.match.id} scored={scored} onSelect={onSelect} />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

export { MatchList }
