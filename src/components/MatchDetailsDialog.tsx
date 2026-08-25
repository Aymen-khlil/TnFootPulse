import { Clock } from 'lucide-react'
import type { ScoredMatch } from '@/types/football'
import { formatTunisTime } from '@/utils/timezone'
import { competitionDisplayName } from '@/data/competitions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { PriorityLabel } from './PriorityBadge'
import { LiveBadge } from './LiveBadge'
import { PulseGauge } from '@/components/ui/gauge'
import { ComponentRows, ReasonList } from './PriorityBreakdown'
import { TeamLogo } from './TeamLogo'

type MatchDetailsDialogProps = {
  scored: ScoredMatch | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function MatchDetailsDialog({ scored, open, onOpenChange }: MatchDetailsDialogProps) {
  if (!scored) return null
  const { match, priority } = scored

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl leading-tight">
            <div className="flex items-center gap-3">
              <TeamLogo src={match.homeTeam.logo} name={match.homeTeam.name} size={40} />
              <span className="flex-1 text-center text-muted">vs</span>
              <TeamLogo src={match.awayTeam.logo} name={match.awayTeam.name} size={40} />
            </div>
          </DialogTitle>
          <DialogDescription className="mt-3 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              {match.status === 'live' ? (
                <LiveBadge minuteElapsed={match.minuteElapsed} className="mt-1" />
              ) : (
                <>
                  <Clock className="h-4 w-4 text-muted" aria-hidden />
                  <time>{formatTunisTime(match.kickoff)}</time>
                </>
              )}
            </div>
            <p className="text-sm font-medium text-muted">
              {competitionDisplayName({
                name: match.competition.name,
                country: match.competition.country,
              })}
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center mb-4">
          <PulseGauge value={priority.total} category={priority.category} size={72} />
        </div>

        <PriorityLabel priority={priority} />

        <Separator />

        <section>
          <h3 className="mb-3 text-sm font-semibold">Why this match?</h3>
          <ComponentRows priority={priority} />
          <ReasonList priority={priority} />
        </section>
      </DialogContent>
    </Dialog>
  )
}

export { MatchDetailsDialog }