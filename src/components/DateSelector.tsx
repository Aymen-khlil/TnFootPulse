import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  formatTunisDateLabel,
  shiftDateKey,
  todayInTunis,
} from '@/utils/timezone'
import { cn } from '@/lib/utils'

type DateSelectorProps = {
  selectedDateKey: string
  onSelect: (dateKey: string) => void
  className?: string
}

/** Today/Tomorrow quick tabs plus day-stepping for dates beyond tomorrow. */
function DateSelector({ selectedDateKey, onSelect, className }: DateSelectorProps) {
  const today = todayInTunis()
  const tomorrow = shiftDateKey(today, 1)

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <Tabs value={isPreset(selectedDateKey, today, tomorrow)} onValueChange={(v) => v && onSelect(v)}>
        <TabsList>
          <TabsTrigger value={today}>Today</TabsTrigger>
          <TabsTrigger value={tomorrow}>Tomorrow</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous day"
          onClick={() => onSelect(shiftDateKey(selectedDateKey, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next day"
          onClick={() => onSelect(shiftDateKey(selectedDateKey, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="flex items-center gap-1.5 text-sm font-medium text-muted">
        <Calendar className="h-4 w-4" aria-hidden />
        {formatTunisDateLabel(selectedDateKey)}
      </p>
    </div>
  )
}

function isPreset(key: string, today: string, tomorrow: string): string {
  if (key === today) return today
  if (key === tomorrow) return tomorrow
  // Radix Tabs needs a controlled value; off-preset dates highlight nothing.
  return ''
}

export { DateSelector }
