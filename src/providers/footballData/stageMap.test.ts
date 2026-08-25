import { describe, it, expect, vi } from 'vitest'
import { normalizeStage } from './stageMap'

describe('footballData stageMap', () => {
  it('maps the documented cup stages', () => {
    expect(normalizeStage('FINAL')).toBe('final')
    expect(normalizeStage('SEMI_FINALS')).toBe('semi-final')
    expect(normalizeStage('QUARTER_FINALS')).toBe('quarter-final')
    expect(normalizeStage('THIRD_PLACE')).toBe('knockout-round')
    expect(normalizeStage('LAST_16')).toBe('knockout-round')
    expect(normalizeStage('LAST_32')).toBe('knockout-round')
    expect(normalizeStage('LAST_64')).toBe('knockout-round')
  })

  it('maps qualification and playoff rounds', () => {
    expect(normalizeStage('PLAYOFF_ROUND_1')).toBe('playoff')
    expect(normalizeStage('PLAYOFF_ROUND_2')).toBe('playoff')
    expect(normalizeStage('PLAYOFFS')).toBe('playoff')
    expect(normalizeStage('PRELIMINARY_ROUND')).toBe('playoff')
    expect(normalizeStage('QUALIFICATION_ROUND_2')).toBe('playoff')
  })

  it('maps league stages to plain league matches', () => {
    expect(normalizeStage('REGULAR_SEASON')).toBe('league-match')
    expect(normalizeStage('APERTURA')).toBe('league-match')
    expect(normalizeStage('CLAUSURA')).toBe('league-match')
    expect(normalizeStage('RELEGATION_ROUND')).toBe('league-match')
  })

  it('maps group football explicitly', () => {
    expect(normalizeStage('GROUP_STAGE')).toBe('group-phase')
  })

  it('warns and degrades unrecognized or empty stages conservatively', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(normalizeStage('SOMETHING_ELSE')).toBe('league-match')
    expect(normalizeStage(null)).toBe('league-match')
    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })
})
