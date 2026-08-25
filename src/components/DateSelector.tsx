import { shiftDateKey, todayInTunis } from '@/utils/timezone'
import { cn } from '@/lib/utils'

type DateSelectorProps = {
  selectedDateKey: string
  onSelect: (dateKey: string) => void
  className?: string
}

const WEEKDAY_SHORT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Tunis',
  weekday: 'short',
})
const DAY_NUMBER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Tunis',
  day: 'numeric',
})

/** Seven-day pill strip starting at TODAY (ADR-0001 redesign). */
function DateSelector({ selectedDateKey, onSelect, className }: DateSelectorProps) {
  const today = todayInTunis()
  const days = Array.from({ length: 7 }, (_, i) => shiftDateKey(today, i))

  return (
    <div className={cn('-mx-4 overflow-x-auto px-4 pb-1', className)}>
      <div className="flex w-max items-center gap-1">
        {days.map((key, index) => {
          const selected = key === selectedDateKey
          const instant = new Date(`${key}T12:00:00Z`)
          const label =
            index === 0
              ? 'TODAY'
              : `${WEEKDAY_SHORT.format(instant).toUpperCase()} ${DAY_NUMBER.format(instant)}`
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={selected}
              className={cn(
                'relative rounded-md px-3 py-2 text-xs font-bold tracking-wider transition-colors',
                selected
                  ? 'text-foreground'
                  : 'text-muted hover:text-foreground',
              )}
            >
              {label}
              <span
                aria-hidden
                className={cn(
                  'absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-colors',
                  selected ? 'bg-pulse' : 'bg-transparent',
                )}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { DateSelector }
