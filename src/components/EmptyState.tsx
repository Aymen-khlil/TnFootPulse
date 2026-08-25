import type { LucideIcon } from 'lucide-react'
import { CalendarX2, Filter } from 'lucide-react'

type EmptyStateProps = {
  variant: 'no-matches' | 'no-filter-match'
}

const EMPTY_COPY: Record<
  EmptyStateProps['variant'],
  { icon: LucideIcon; title: string; message: string }
> = {
  'no-matches': {
    icon: CalendarX2,
    title: 'No football matches today',
    message: "There aren't any matches available for the selected filters. Try another date or competition.",
  },
  'no-filter-match': {
    icon: Filter,
    title: 'No matches in this selection',
    message: 'Nothing matches the current priority and competition filters.',
  },
}

function EmptyState({ variant }: EmptyStateProps) {
  const { icon: Icon, title, message } = EMPTY_COPY[variant]
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-14 text-center">
      <span aria-hidden className="text-4xl">⚽</span>
      <Icon className="h-5 w-5 text-muted" aria-hidden />
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-xs text-sm text-muted">{message}</p>
    </div>
  )
}

export { EmptyState }
