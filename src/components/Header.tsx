import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

function Header({
  className,
  onRefresh,
  isRefreshing = false,
}: {
  className?: string
  /** Manual freshness override (Option C): busts the agenda cache and refetches. */
  onRefresh?: () => void
  isRefreshing?: boolean
}) {
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
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh fixtures"
              title="Refresh fixtures"
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
