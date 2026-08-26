import { describe, it, expect } from 'vitest'
import { normalizeEspnStage } from './stageMap'

describe('espnStageMap', () => {
  it('maps knockout vocabulary onto StageKind', () => {
    expect(normalizeEspnStage('final')).toBe('final')
    expect(normalizeEspnStage('semifinals')).toBe('semi-final')
    expect(normalizeEspnStage('quarterfinals')).toBe('quarter-final')
    expect(normalizeEspnStage('round-of-16')).toBe('knockout-round')
    expect(normalizeEspnStage('second-round')).toBe('knockout-round')
    expect(normalizeEspnStage('preliminary-round')).toBe('knockout-round')
    expect(normalizeEspnStage('knockout-round-playoffs')).toBe('knockout-round')
  })

  it('maps group/league-phase vocabulary', () => {
    expect(normalizeEspnStage('group-stage')).toBe('group-phase')
    expect(normalizeEspnStage('league-phase')).toBe('group-phase')
  })

  it('treats season slugs and unknown rounds as league matches', () => {
    // Live evidence: league seasons carry slugs like "2026-27-laliga"
    expect(normalizeEspnStage('2026-27-laliga')).toBe('league-match')
    expect(normalizeEspnStage('torneo-clausura-2026')).toBe('league-match')
    expect(normalizeEspnStage(undefined)).toBe('league-match')
    expect(normalizeEspnStage('something-unheard-of')).toBe('league-match')
  })
})
