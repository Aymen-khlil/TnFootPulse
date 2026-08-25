import { cn } from '@/lib/utils'

type LiveBadgeProps = {
  minuteElapsed?: number
  className?: string
}

/** Live = emerald (ADR-0001): green signals in-play/positive. */
function LiveBadge({ minuteElapsed, className }: LiveBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary',
        className,
      )}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-pulse animate-pulse-dot"
      />
      <span>LIVE{minuteElapsed !== undefined ? ` ${minuteElapsed}'` : ''}</span>
    </span>
  )
}

export { LiveBadge }
