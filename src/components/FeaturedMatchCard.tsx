import { Clock, Zap } from 'lucide-react'
import type { ScoredMatch } from '@/types/football'
import { FEATURED_CARD_ACCENT_CLASS, STAGE_LABELS } from '@/scoring/priorityCategory'
import { formatTunisTime } from '@/utils/timezone'
import { PulseGauge } from '@/components/ui/gauge'
import { ComponentRows } from './PriorityBreakdown'
import { LiveBadge } from './LiveBadge'
import { TeamLogo } from './TeamLogo'
import { shortCompetitionLabel } from './MatchFilters'
import { cn } from '@/lib/utils'

type FeaturedMatchCardProps = {
  scored: ScoredMatch
  onSelect: (scored: ScoredMatch) => void
}

/** Featured treatment for the top bands (ADR-0001): category-tinted border + Intelligence Report panel. */
function FeaturedMatchCard({ scored, onSelect }: FeaturedMatchCardProps) {
  const { match, priority } = scored
  const accent = FEATURED_CARD_ACCENT_CLASS[priority.category]
  const stageLabel =
    match.stage !== 'league-match' ? STAGE_LABELS[match.stage].toUpperCase() : null

  return (
    <button
      type="button"
      onClick={() => onSelect(scored)}
      className={cn(
        'group w-full rounded-xl border bg-gradient-to-br from-card to-elevated p-5 text-left shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6',
        accent,
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-border bg-elevated px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-foreground">
              ★ {shortCompetitionLabel(match.competition)}
              {stageLabel && <span className="text-muted"> · {stageLabel}</span>}
            </span>
            {match.status === 'live' ? (
              <LiveBadge minuteElapsed={match.minuteElapsed} />
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-muted">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {formatTunisTime(match.kickoff)} (Tunisia Time)
              </span>
            )}
            {priority.tunisiaTime >= 20 && (
              <span className="flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                <Zap className="h-3 w-3" aria-hidden />
                PRIME TIME
              </span>
            )}
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3">
              <TeamLogo src={match.homeTeam.logo} name={match.homeTeam.name} size={44} />
              <p className="truncate text-2xl font-bold leading-tight">
                {match.homeTeam.name}
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">vs</p>
            <div className="flex items-center gap-3">
              <TeamLogo src={match.awayTeam.logo} name={match.awayTeam.name} size={44} />
              <p className="truncate text-2xl font-bold leading-tight">
                {match.awayTeam.name}
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 rounded-xl border border-border bg-elevated/60 p-4 sm:w-60">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
            Intelligence Report
          </p>
          <div className="mt-3 flex justify-center">
            <PulseGauge value={priority.total} category={priority.category} size={96} />
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <ComponentRows priority={priority} />
          </div>
        </div>
      </div>
    </button>
  )
}

export { FeaturedMatchCard }
