import { describe, it, expect } from 'vitest'
import { UEFA_TOP20, UEFA_RANKING_SEASON, uefaRankByName } from './uefaClubRankings'
import { teamRatingByName, UNKNOWN_TEAM_RATING } from './teams'

describe('UEFA_TOP20 — curated dataset invariants', () => {
  it('contains exactly ranks 1..20 with no gaps or duplicates', () => {
    const ranks = UEFA_TOP20.map((entry) => entry.rank).sort((a, b) => a - b)
    expect(ranks).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
  })

  it('every club resolves to a curated rating (no unknown fallback)', () => {
    for (const { name } of UEFA_TOP20) {
      expect(
        teamRatingByName(name),
        `${name} must exist in TEAM_CONFIGS`,
      ).not.toBe(UNKNOWN_TEAM_RATING)
    }
  })

  it('looks up ranks through provider aliases', () => {
    expect(uefaRankByName('FC Bayern München')).toBe(1)
    expect(uefaRankByName('Internazionale')).toBe(5)
    expect(uefaRankByName('Paris Saint-Germain')).toBe(4)
  })

  it('returns undefined for unranked clubs', () => {
    expect(uefaRankByName('Real Sociedad')).toBeUndefined()
    expect(uefaRankByName('Espérance de Tunis')).toBeUndefined()
  })

  it('is season-labeled so staleness is visible', () => {
    expect(UEFA_RANKING_SEASON).toMatch(/^\d{4}\/\d{2}$/)
  })
})
