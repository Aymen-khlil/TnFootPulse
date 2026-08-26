import { FlaskConical, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Q7 contract: the experimental lane fails LOUDLY inside its own lane.
 * No silent fallback to Curated data — the user gets an honest error and
 * a one-click way back.
 */
function EspnModeFallback({
  onBackToCurated,
  onRetry,
}: {
  onBackToCurated: () => void
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-14 text-center">
      <FlaskConical className="h-6 w-6 text-primary" aria-hidden />
      <h3 className="text-base font-semibold">
        The ESPN experiment is unavailable
      </h3>
      <p className="max-w-sm text-sm text-muted">
        The unofficial ESPN feed could not be reached. Curated Mode is
        unaffected — your regular pipeline is one click away.
      </p>
      <div className="mt-1 flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBackToCurated}>
          Back to Curated Mode
        </Button>
        <Button variant="ghost" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Retry ESPN
        </Button>
      </div>
    </div>
  )
}

export { EspnModeFallback }
