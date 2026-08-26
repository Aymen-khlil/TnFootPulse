import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SourceMode } from '@/types/football'
import { SourceModeToggle } from '@/components/SourceModeToggle'

function Header({
  className,
  onRefresh,
  isRefreshing = false,
  isCoolingDown = false,
  sourceMode = 'curated',
  onSourceModeChange,
}: {
  className?: string
  /** Manual freshness override (Option C): busts the ACTIVE Source Mode's caches and refetches. */
  onRefresh?: () => void
  isRefreshing?: boolean
  /** Pacer cooldown: refresh fired recently; button rests to protect quota. */
  isCoolingDown?: boolean
  /** Active Source Mode rendered by the agenda below (CONTEXT.md). */
  sourceMode?: SourceMode
  onSourceModeChange?: (mode: SourceMode) => void
}) {
  const refreshBlocked = isRefreshing || isCoolingDown
  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75',
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-lg">⚽</span>
          <span className="text-lg font-bold tracking-tight">TnFootPulse</span>
          <span
            aria-hidden
            className="ml-0.5 h-1.5 w-1.5 rounded-full bg-pulse animate-pulse-dot"
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-muted">
          {onSourceModeChange && (
            <SourceModeToggle mode={sourceMode} onChange={onSourceModeChange} />
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshBlocked}
              aria-label="Refresh fixtures"
              title={isCoolingDown ? 'Refresh is cooling down' : 'Refresh fixtures'}
              className="rounded-lg border border-border p-1.5 text-muted transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <RefreshCw
                aria-hidden
                className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
              />
            </button>
          )}
          <span aria-hidden>🇹🇳</span>
          <span>Tunisia</span>
        </div>
      </div>
    </header>
  )
}

export { Header }
