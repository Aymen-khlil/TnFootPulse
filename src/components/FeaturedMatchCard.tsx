import { Clock } from 'lucide-react'
import type { ScoredMatch } from '@/types/football'
import { formatTunisTime } from '@/utils/timezone'
import { competitionDisplayName } from '@/data/competitions'
import { LiveBadge } from './LiveBadge'
import { PriorityLabel } from './PriorityBadge'
import { ChipRow, matchChips } from './MatchCard'

type FeaturedMatchCardProps = {
  scored: ScoredMatch
  onSelect: (scored: ScoredMatch) => void
}

/** Prominent treatment for the day's MUST WATCH fixtures. */
function FeaturedMatchCard({ scored, onSelect }: FeaturedMatchCardProps) {
  const { match, priority } = scored
  return (
    <button
      type="button"
      onClick={() => onSelect(scored)}
      className="group w-full rounded-xl border border-primary/30 bg-gradient-to-br from-card to-elevated p-5 text-left shadow-lg shadow-primary/10 transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {match.status === 'live' ? (
            <LiveBadge minuteElapsed={match.minuteElapsed} />
          ) : (
            <span className="flex items-center gap-1.5 text-lg font-semibold">
              <Clock className="h-4 w-4 text-pulse" aria-hidden />
              <time>{formatTunisTime(match.kickoff)}</time>
            </span>
          )}
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-muted">
          {competitionDisplayName(match.competition)}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xl font-bold leading-tight sm:text-2xl">{match.homeTeam.name}</p>
          <p className="text-xl font-bold leading-tight sm:text-2xl">{match.awayTeam.name}</p>
        </div>
        <PriorityLabel priority={priority} />
      </div>

      <ChipRow
        chips={[match.competition.name, ...matchChips(scored)]}
        trophyFor={match.competition.name}
      />

      <p className="mt-4 text-sm font-medium text-primary group-hover:underline">
        Why is this important? →
      </p>
    </button>
  )
}

export { FeaturedMatchCard }
