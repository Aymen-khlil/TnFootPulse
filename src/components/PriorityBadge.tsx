import type { PriorityCategoryName, PriorityResult } from '@/types/football'
import { priorityCategoryMeta } from '@/scoring/priorityCategory'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type PriorityBadgeProps = {
  category: PriorityCategoryName
  total: number
  size?: 'sm' | 'lg'
  className?: string
}

function PriorityBadge({ category, total, size = 'sm', className }: PriorityBadgeProps) {
  const meta = priorityCategoryMeta(category)
  return (
    <Badge
      className={cn(
        meta.badgeClass,
        size === 'lg' ? 'px-3 py-1 text-sm' : 'text-xs',
        className,
      )}
    >
      <span aria-hidden>{meta.emoji}</span>
      <span>{total}</span>
      <span className="sr-only">{meta.label}</span>
    </Badge>
  )
}

/** Full badge including the category label (dialog / featured contexts). */
function PriorityLabel({ priority }: { priority: PriorityResult }) {
  const meta = priorityCategoryMeta(priority.category)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
        meta.badgeClass,
      )}
    >
      <span aria-hidden>{meta.emoji}</span>
      <span>
        {priority.total} · {meta.label}
      </span>
    </span>
  )
}

export { PriorityBadge, PriorityLabel }
