import { Progress } from '@/components/ui/progress'
import type { PriorityResult } from '@/types/football'
import { priorityCategoryMeta } from '@/scoring/priorityCategory'

const COMPONENT_CAPS = [
  { key: 'competition', label: 'Competition', cap: 30 },
  { key: 'teams', label: 'Team importance', cap: 25 },
  { key: 'context', label: 'Match context', cap: 25 },
  { key: 'tunisiaTime', label: 'Tunisia viewing time', cap: 20 },
] as const

/** Renders the engine's actual numbers — the UI never recomputes anything. */
function PriorityBreakdown({ priority }: { priority: PriorityResult }) {
  const meta = priorityCategoryMeta(priority.category)
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold tabular-nums">{priority.total}</span>
          <span className="text-sm text-muted">/ 100</span>
        </div>
        <Progress value={priority.total} className="mt-1.5 h-2.5" indicatorClassName={meta.badgeClass} />
      </div>

      <div className="space-y-3">
        {COMPONENT_CAPS.map(({ key, label, cap }) => {
          const value = priority[key]
          return (
            <div key={key}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span>{label}</span>
                <span className="font-semibold tabular-nums text-muted">
                  +{value} <span className="text-xs">/ {cap}</span>
                </span>
              </div>
              <Progress value={(value / cap) * 100} aria-label={`${label}: ${value} of ${cap}`} />
            </div>
          )
        })}
      </div>

      <ul className="space-y-1.5 text-sm text-muted">
        {priority.reasons.map((reason) => (
          <li key={reason}>· {reason}</li>
        ))}
      </ul>
    </div>
  )
}

export { PriorityBreakdown }
