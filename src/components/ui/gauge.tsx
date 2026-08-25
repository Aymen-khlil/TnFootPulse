import { priorityCategoryMeta } from '@/scoring/priorityCategory'

/**
 * Circular Pulse Score gauge (ADR-0001). Stroke color follows the
 * priority band; the fill animates via CSS transition only.
 */
function PulseGauge({
  value,
  category,
  size = 96,
}: {
  value: number
  category: Parameters<typeof priorityCategoryMeta>[0]
  size?: number
}) {
  const meta = priorityCategoryMeta(category)
  const clamped = Math.min(100, Math.max(0, value))
  const stroke = size >= 88 ? 8 : 7
  const radius = (100 - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div
      className="relative inline-flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Pulse Score ${clamped} of 100`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-elevated"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke="currentColor"
          className={`${meta.accentTextClass} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold tabular-nums ${meta.accentTextClass} ${size >= 88 ? 'text-3xl' : 'text-2xl'}`}>
          {clamped}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-widest text-muted">
          Pulse Score
        </span>
      </div>
    </div>
  )
}

export { PulseGauge }
