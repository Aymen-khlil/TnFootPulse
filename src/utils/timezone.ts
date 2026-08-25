export const TUNIS_TIMEZONE = 'Africa/Tunis'

function partsIn(
  date: Date,
  options: Intl.DateTimeFormatOptions,
): Record<string, string> {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TUNIS_TIMEZONE,
    ...options,
  })
  const parts = formatter.formatToParts(date)
  return Object.fromEntries(
    parts.filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]),
  )
}

/** Calendar day of an instant in Africa/Tunis, as YYYY-MM-DD. */
export function tunisDateKey(date: Date): string {
  return partsIn(date, { year: 'numeric', month: '2-digit', day: '2-digit' })
    .year + '-' + partsIn(date, { year: 'numeric', month: '2-digit', day: '2-digit' }).month + '-' + partsIn(date, { year: 'numeric', month: '2-digit', day: '2-digit' }).day
}

/** Minutes since Tunis midnight (0–1439) for an instant. */
export function tunisMinuteOfDay(date: Date): number {
  const p = partsIn(date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  return Number(p.hour) * 60 + Number(p.minute)
}

/** HH:mm wall-clock label in Tunis. */
export function formatTunisTime(date: Date): string {
  const p = partsIn(date, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  return `${p.hour}:${p.minute}`
}

/** Human date label like "Tuesday, August 25" for a YYYY-MM-DD key, rendered in Tunis. */
export function formatTunisDateLabel(dateKey: string): string {
  const instant = new Date(`${dateKey}T12:00:00Z`)
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TUNIS_TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(instant)
}

/** Today's calendar day in Tunis, as YYYY-MM-DD. */
export function todayInTunis(): string {
  return tunisDateKey(new Date())
}

/** Shift a YYYY-MM-DD key by N days (calendar arithmetic, TZ-safe). */
export function shiftDateKey(dateKey: string, days: number): string {
  const instant = new Date(`${dateKey}T00:00:00Z`)
  instant.setUTCDate(instant.getUTCDate() + days)
  return instant.toISOString().slice(0, 10)
}
