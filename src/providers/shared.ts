import { tunisDateKey, tunisMinuteOfDay } from '@/utils/timezone'

/** Shared normalization helpers — identical treatment for both providers. */
export function tunisFields(kickoff: Date): {
  tunisDateKey: string
  tunisMinuteOfDay: number
} {
  return {
    tunisDateKey: tunisDateKey(kickoff),
    tunisMinuteOfDay: tunisMinuteOfDay(kickoff),
  }
}
