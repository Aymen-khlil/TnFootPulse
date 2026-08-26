import { cn } from '@/lib/utils'
import type { SourceMode } from '@/types/football'

const MODE_LABELS: Record<SourceMode, string> = {
  curated: 'Curated',
  espn: 'ESPN',
}

/**
 * Source Mode switch (CONTEXT.md: "Source Mode"). Exclusive pipelines:
 * flipping this swaps the entire data lane, never a merge. Session-only
 * by design — the app always boots in Curated Mode.
 */
function SourceModeToggle({
  mode,
  onChange,
  className,
}: {
  mode: SourceMode
  onChange: (mode: SourceMode) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label="Data source"
      className={cn(
        'flex items-center rounded-lg border border-border bg-card/60 p-0.5 text-xs',
        className,
      )}
    >
      {(Object.keys(MODE_LABELS) as SourceMode[]).map((key) => {
        const active = key === mode
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(key)}
            title={
              key === 'espn'
                ? 'Experimental source — broad world coverage, unofficial feed'
                : 'Curated pipeline — fd.org primary + API-Football'
            }
            className={cn(
              'rounded-md px-2.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active
                ? 'bg-primary/15 text-primary shadow-sm'
                : 'text-muted hover:text-foreground',
            )}
          >
            {MODE_LABELS[key]}
            {key === 'espn' && (
              <span aria-hidden className="ml-1 text-[10px] opacity-70">
                β
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export { SourceModeToggle }
