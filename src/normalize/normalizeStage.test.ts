import { describe, it, expect, vi } from 'vitest'
import { normalizeStage } from './normalizeStage'

describe('normalizeStage', () => {
  it('tests quarter before final ("Quarter-finals" contains "final")', () => {
    expect(normalizeStage('Quarter-finals')).toBe('quarter-final')
  })

  it('maps the documented cup rounds', () => {
    expect(normalizeStage('Final')).toBe('final')
    expect(normalizeStage('Semi-finals')).toBe('semi-final')
    expect(normalizeStage('Round of 16')).toBe('knockout-round')
    expect(normalizeStage('3rd Round')).toBe('knockout-round')
    expect(normalizeStage('Play-off Round')).toBe('playoff')
    expect(normalizeStage('Group Stage - 1')).toBe('group-phase')
    expect(normalizeStage('League Phase - 6')).toBe('group-phase')
    expect(normalizeStage('Regular Season - 19')).toBe('league-match')
  })

  it('handles third-place matches as knockout rounds', () => {
    expect(normalizeStage('3rd Place Final')).toBe('knockout-round')
  })

  it('is case-insensitive and whitespace tolerant', () => {
    expect(normalizeStage('GROUP STAGE')).toBe('group-phase')
    expect(normalizeStage('  regular season  ')).toBe('league-match')
  })

  it('degrades unrecognized strings conservatively with a dev warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(normalizeStage('Weird Cup Format')).toBe('league-match')
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  it('warns and degrades empty or missing rounds to a league match', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(normalizeStage('')).toBe('league-match')
    expect(normalizeStage(undefined)).toBe('league-match')
    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })
})
