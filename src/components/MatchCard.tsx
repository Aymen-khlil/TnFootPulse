import { Trophy } from 'lucide-react'
import type { ScoredMatch } from '@/types/football'
import { priorityCategoryMeta } from '@/scoring/priorityCategory'
import { timeWindowLabel } from '@/scoring/timeScore'
import { formatTunisTime } from '@/utils/timezone'
import { competitionDisplayName } from '@/data/competitions'
import { cn } from '@/lib/utils'
import { LiveBadge } from './LiveBadge'
import { TeamLogo } from './TeamLogo'

/** Band-colored score chip (ADR-0001: color = category). */
function ScoreChip({ scored }: { scored: ScoredMatch }) {
  const meta = priorityCategoryMeta(scored.priority.category)
  return (
    <span
      className={cn(
        'rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums',
        meta.badgeClass,
      )}
    >
      {scored.priority.total}
      <span className="sr-only"> Pulse Score</span>
    </span>
  )
}

/** Compact display-only signals (team quality + viewing time), from engine output values. */
function teamQualityLabel(teams: number): string {
  if (teams >= 23) return 'Elite teams'
  if (teams >= 20) return 'Strong sides'
  if (teams >= 15) return 'Solid teams'
  return 'Modest teams'
}

function timeShortLabel(minuteOfDay: number, score: number): string | null {
  if (score <= 0) return null
  const label = timeWindowLabel(minuteOfDay)
  if (label === 'Prime Tunisia time') return 'Prime time'
  if (label === 'Good evening slot') return 'Good time'
  if (label === 'Night kickoff') return 'Night'
  if (label === 'Late night' || label === 'Very late night') return 'Late night'
  if (label === 'Early afternoon' || label === 'Late afternoon') return 'Afternoon'
  if (label === 'Morning kickoff') return 'Morning'
  return null // Overnight
}

type MatchCardProps = {
  scored: ScoredMatch
  onSelect: (scored: ScoredMatch) => void
}

function MatchCard({ scored, onSelect }: MatchCardProps) {
  const { match, priority } = scored
  const isLive = match.status === 'live'
  const chips = [
    `${teamQualityLabel(priority.teams)} +${priority.teams}`,
    timeShortLabel(match.tunisMinuteOfDay, priority.tunisiaTime) &&
      `+${priority.tunisiaTime}`,
  ].filter(Boolean) as string[]

  return (
    <button
      type="button"
      onClick={() => onSelect(scored)}
      className={cn(
        'group w-full rounded-xl border bg-card p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isLive
          ? 'border-primary/40 hover:border-primary/70'
          : 'border-border hover:border-primary/40 hover:bg-elevated',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted">
          {isLive ? (
            <LiveBadge minuteElapsed={match.minuteElapsed} />
          ) : (
            <>
              <span className="font-semibold uppercase tracking-wide">
                {match.competition.name}
              </span>
              <span aria-hidden>·</span>
              <time>{formatTunisTime(match.kickoff)}</time>
            </>
          )}
        </div>
        <ScoreChip scored={scored} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2.5">
            <TeamLogo src={match.homeTeam.logo} name={match.homeTeam.name} size={28} />
            <p className="truncate text-base font-semibold leading-tight">
              {match.homeTeam.name}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <TeamLogo src={match.awayTeam.logo} name={match.awayTeam.name} size={28} />
            <p className="truncate text-base font-semibold leading-tight">
              {match.awayTeam.name}
            </p>
          </div>
        </div>
        {isLive && match.score && (
          <div className="flex flex-col items-end text-xl font-bold tabular-nums">
            <span>{match.score.home}</span>
            <span>{match.score.away}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <Trophy className="h-3.5 w-3.5" aria-hidden />
        {competitionDisplayName(match.competition)}
      </div>

      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-emerald-400/80">
          {chips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      )}
    </button>
  )
}

export { MatchCard }
