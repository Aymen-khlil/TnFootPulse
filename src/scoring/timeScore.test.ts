import { describe, it, expect } from 'vitest'
import { timeScore } from './timeScore'

describe('timeScore', () => {
  it('scores the configured windows', () => {
    expect(timeScore(12 * 60)).toBe(4) // 06:00–13:00
    expect(timeScore(13 * 60)).toBe(8) // 13:00–15:00
    expect(timeScore(15 * 60)).toBe(12) // 15:00–16:00
    expect(timeScore(16 * 60)).toBe(17) // 16:00–18:00
    expect(timeScore(19 * 60)).toBe(20) // prime time
    expect(timeScore(21 * 60 + 45)).toBe(17) // 21:30–22:30
    expect(timeScore(23 * 60)).toBe(12) // 22:30–23:30
    expect(timeScore(23 * 60 + 45)).toBe(7) // 23:30–00:30
    expect(timeScore(15)).toBe(7) // 00:00–00:30
    expect(timeScore(30)).toBe(3) // 00:30–02:00
    expect(timeScore(3 * 60)).toBe(0) // dead of night
    expect(timeScore(5 * 60 + 59)).toBe(0)
  })

  it('treats windows as half-open [start, end)', () => {
    expect(timeScore(1079)).toBe(17) // 17:59
    expect(timeScore(1080)).toBe(20) // 18:00
    expect(timeScore(1289)).toBe(20) // 21:29
    expect(timeScore(1290)).toBe(17) // 21:30
    expect(timeScore(29)).toBe(7) // 00:29
    expect(timeScore(30)).toBe(3) // 00:30
  })
})
