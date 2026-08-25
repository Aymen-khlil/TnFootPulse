import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ErrorStateProps = {
  message?: string
  onRetry: () => void
}

/** Never exposes raw API errors — friendly copy plus a retry action. */
function ErrorState({ message, onRetry }: ErrorStateProps) {
  const friendly =
    message && !message.includes('Missing API key')
      ? "Unable to load today's matches."
      : (message ?? "Unable to load today's matches.")
  const hint =
    message && message.includes('Missing API key')
      ? undefined
      : 'Please try again.'

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-14 text-center">
      <AlertTriangle className="h-6 w-6 text-primary" aria-hidden />
      <h3 className="text-base font-semibold">{friendly}</h3>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      {message?.includes('Missing API key') && (
        <p className="max-w-sm text-sm text-muted">{message}</p>
      )}
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
        <RefreshCw className="h-4 w-4" aria-hidden />
        Retry
      </Button>
    </div>
  )
}

export { ErrorState }
