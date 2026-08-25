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
import { PriorityBreakdown } from './PriorityBreakdown'

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
            {match.homeTeam.name}
            <span className="mx-2 font-normal text-muted">vs</span>
            {match.awayTeam.name}
          </DialogTitle>
          <DialogDescription>
            {match.status === 'live' ? (
              <LiveBadge minuteElapsed={match.minuteElapsed} className="mt-1" />
            ) : (
              `${formatTunisTime(match.kickoff)} · Tunisia time`
            )}
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm font-medium text-muted">
          {competitionDisplayName(match.competition)}
        </p>

        <PriorityLabel priority={priority} />

        <Separator />

        <section>
          <h3 className="mb-3 text-sm font-semibold">Why this match?</h3>
          <PriorityBreakdown priority={priority} />
        </section>
      </DialogContent>
    </Dialog>
  )
}

export { MatchDetailsDialog }
