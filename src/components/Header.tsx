import { cn } from '@/lib/utils'

function Header({ className }: { className?: string }) {
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
        <div className="flex items-center gap-1.5 text-sm text-muted">
          <span aria-hidden>🇹🇳</span>
          <span>Tunisia</span>
        </div>
      </div>
    </header>
  )
}

export { Header }
