import { describe, it, expect } from 'vitest'
import { clampCompetitionScore } from './competitionScore'
import { competitionRatingById } from '@/data/competitions'

describe('competitionScore', () => {
  it('passes through configured ratings', () => {
    expect(clampCompetitionScore(30)).toBe(30)
    expect(clampCompetitionScore(14)).toBe(14)
  })

  it('clamps out-of-range ratings', () => {
    expect(clampCompetitionScore(45)).toBe(30)
    expect(clampCompetitionScore(-3)).toBe(0)
  })

  it('falls back to the default rating for unlisted competition ids', () => {
    expect(competitionRatingById('999999')).toBe(6)
    expect(competitionRatingById('2')).toBe(30) // Champions League
  })
})
