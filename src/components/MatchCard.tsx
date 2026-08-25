import { Swords, Trophy } from 'lucide-react'
import type { ScoredMatch } from '@/types/football'
import { formatTunisTime } from '@/utils/timezone'
import { Badge } from '@/components/ui/badge'
import { LiveBadge } from './LiveBadge'
import { PriorityBadge } from './PriorityBadge'
import { competitionDisplayName } from '@/data/competitions'

/** Short display-only chips derived from engine output (never recomputes scores). */
function matchChips(scored: ScoredMatch): string[] {
  const chips: string[] = []
  const contextReason = scored.priority.reasons.find((r) =>
    /final|semi|quarter|knockout|playoff|group|league match|rivalry/i.test(r),
  )
  if (/rivalry/i.test(contextReason ?? '')) chips.push('Major rivalry')
  if (scored.match.stage !== 'league-match') {
    chips.push(
      scored.match.stage === 'final'
        ? 'Final'
        : scored.match.stage === 'group-phase'
          ? 'Group stage'
          : scored.match.stage === 'semi-final'
            ? 'Semi-final'
            : scored.match.stage === 'quarter-final'
              ? 'Quarter-final'
              : scored.match.stage === 'playoff'
                ? 'Playoff'
                : 'Knockout',
    )
  }
  if (scored.priority.tunisiaTime >= 17) chips.push('Good Tunisia time')
  return chips
}

type MatchCardProps = {
  scored: ScoredMatch
  onSelect: (scored: ScoredMatch) => void
}

function MatchCard({ scored, onSelect }: MatchCardProps) {
  const { match, priority } = scored
  return (
    <button
      type="button"
      onClick={() => onSelect(scored)}
      className="group w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted">
          {match.status === 'live' ? (
            <LiveBadge minuteElapsed={match.minuteElapsed} />
          ) : (
            <>
              <span aria-hidden>🕗</span>
              <time>{formatTunisTime(match.kickoff)}</time>
            </>
          )}
        </div>
        <PriorityBadge category={priority.category} total={priority.total} />
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-3">
        <p className="text-base font-semibold leading-tight">{match.homeTeam.name}</p>
        <p className="text-sm font-semibold tabular-nums text-muted">
          {match.score ? `${match.score.home} – ${match.score.away}` : ''}
        </p>
      </div>
      <p className="text-base font-semibold leading-tight">{match.awayTeam.name}</p>

      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        <Trophy className="h-3.5 w-3.5" aria-hidden />
        {competitionDisplayName(match.competition)}
      </div>

      {matchChips(scored).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {matchChips(scored).map((chip) => (
            <Badge key={chip} variant="outline" className="gap-1 font-normal">
              {chip === 'Major rivalry' && <Swords className="h-3 w-3" aria-hidden />}
              {chip}
            </Badge>
          ))}
        </div>
      )}
    </button>
  )
}

export { MatchCard, matchChips }
