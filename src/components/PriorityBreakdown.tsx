import type { PriorityResult } from '@/types/football'
import { priorityCategoryMeta, PEDIGREE_ROW_ACCENT_CLASS } from '@/scoring/priorityCategory'

const COMPONENT_CAPS = [
  { key: 'competition', label: 'Competition', cap: 30 },
  { key: 'teams', label: 'Team importance', cap: 25 },
  { key: 'context', label: 'Match context', cap: 25 },
  { key: 'tunisiaTime', label: 'Tunisia viewing time', cap: 20 },
] as const

/** Numeric component rows (ADR-0001: replaces progress bars). */
function ComponentRows({ priority }: { priority: PriorityResult }) {
  return (
    <div className="space-y-2">
      {COMPONENT_CAPS.map(({ key, label, cap }) => {
        const value = priority[key]
        return (
          <div
            key={key}
            className="flex items-baseline justify-between gap-4 text-sm"
          >
            <span className="text-muted">{label}</span>
            <span className="font-semibold tabular-nums text-emerald-400">
              +{value} <span className="text-xs font-normal text-muted">/ {cap}</span>
            </span>
          </div>
        )
      })}
      {/* Pedigree top-up (ADR-0002): shown only when a floor lifted the total. */}
      {priority.pedigree > 0 && (
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-muted">Club pedigree</span>
          <span className={`font-semibold tabular-nums ${PEDIGREE_ROW_ACCENT_CLASS}`}>
            +{priority.pedigree}
          </span>
        </div>
      )}
    </div>
  )
}

/** Reasons list — verbatim from engine output, never recomputed. */
export function ReasonList({ priority }: { priority: PriorityResult }) {
  const meta = priorityCategoryMeta(priority.category)
  return (
    <ul className="space-y-1.5 text-sm text-muted">
      {priority.reasons.map((reason) => (
        <li key={reason} className="flex gap-2">
          <span aria-hidden className={meta.accentTextClass}>·</span>
          <span>{reason}</span>
        </li>
      ))}
    </ul>
  )
}

/** Full Intelligence Report body: component rows + reasons (gauge composed by caller). */
function PriorityBreakdown({ priority }: { priority: PriorityResult }) {
  return (
    <div className="space-y-4">
      <ComponentRows priority={priority} />
      <ReasonList priority={priority} />
    </div>
  )
}

export { PriorityBreakdown, ComponentRows }
