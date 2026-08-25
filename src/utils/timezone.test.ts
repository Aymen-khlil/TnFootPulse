import { describe, it, expect } from 'vitest'
import {
  tunisDateKey,
  tunisMinuteOfDay,
  formatTunisTime,
  formatTunisDateLabel,
  shiftDateKey,
} from './timezone'

// Tunisia is UTC+1 year-round, so instants are chosen for exact wall-clock math.

describe('Africa/Tunis date handling', () => {
  it('maps an instant to the Tunis calendar day', () => {
    expect(tunisDateKey(new Date('2026-08-25T21:00:00Z'))).toBe('2026-08-25')
  })

  it('rolls kickoffs after Tunis midnight into the next calendar day', () => {
    // 23:30Z = 00:30 next day in Tunis (+01:00)
    expect(tunisDateKey(new Date('2026-08-25T23:30:00Z'))).toBe('2026-08-26')
  })

  it('derives minutes since Tunis midnight', () => {
    expect(tunisMinuteOfDay(new Date('2026-08-25T21:00:00Z'))).toBe(22 * 60)
    expect(tunisMinuteOfDay(new Date('2026-08-25T23:30:00Z'))).toBe(30)
  })

  it('formats HH:mm labels in Tunis time', () => {
    expect(formatTunisTime(new Date('2026-08-25T19:00:00Z'))).toBe('20:00')
    expect(formatTunisTime(new Date('2026-08-25T23:30:00Z'))).toBe('00:30')
  })

  it('renders a human date label for a date key', () => {
    const label = formatTunisDateLabel('2026-08-25')
    expect(label).toContain('Tuesday')
    expect(label).toContain('August')
    expect(label).toContain('25')
  })

  it('shifts date keys across month boundaries', () => {
    expect(shiftDateKey('2026-08-31', 1)).toBe('2026-09-01')
    expect(shiftDateKey('2026-09-01', -1)).toBe('2026-08-31')
    expect(shiftDateKey('2026-12-31', 1)).toBe('2027-01-01')
  })
})
