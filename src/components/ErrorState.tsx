import { AlertTriangle, KeyRound, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MatchLoadError } from '@/hooks/useMatches'

type ErrorStateProps = {
  error: MatchLoadError
  onRetry: () => void
}

/** Never exposes raw API errors — friendly copy; retry only helps transient failures. */
function ErrorState({ error, onRetry }: ErrorStateProps) {
  const isConfig = error.kind === 'config'
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-14 text-center">
      {isConfig ? (
        <KeyRound className="h-6 w-6 text-primary" aria-hidden />
      ) : (
        <AlertTriangle className="h-6 w-6 text-primary" aria-hidden />
      )}
      <h3 className="text-base font-semibold">
        {isConfig ? 'Configuration needed' : "Unable to load today's matches."}
      </h3>
      <p className="max-w-sm text-sm text-muted">
        {isConfig ? error.message : 'Please try again.'}
      </p>
      {!isConfig && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RefreshCw className="h-4 w-4" aria-hidden />
          Retry
        </Button>
      )}
    </div>
  )
}

export { ErrorState }
