import { describe, it, expect } from 'vitest'
import {
  TUNISIAN_ELITE_CLUBS,
  tunisianEliteCount,
} from './tunisianEliteClubs'
import { teamRatingByName, UNKNOWN_TEAM_RATING } from './teams'

describe('TUNISIAN_ELITE_CLUBS — curated dataset invariants', () => {
  it('lists exactly the four historically dominant clubs', () => {
    expect(TUNISIAN_ELITE_CLUBS).toHaveLength(4)
    expect(TUNISIAN_ELITE_CLUBS).toContain('Espérance de Tunis')
    expect(TUNISIAN_ELITE_CLUBS).toContain('Club Africain')
    expect(TUNISIAN_ELITE_CLUBS).toContain('Étoile du Sahel')
    expect(TUNISIAN_ELITE_CLUBS).toContain('CS Sfaxien')
  })

  it('every club resolves to a curated rating (no unknown fallback)', () => {
    for (const name of TUNISIAN_ELITE_CLUBS) {
      expect(
        teamRatingByName(name),
        `${name} must exist in TEAM_CONFIGS`,
      ).not.toBe(UNKNOWN_TEAM_RATING)
    }
  })

  it('counts elite participation through aliases and either order', () => {
    expect(tunisianEliteCount('Esperance Sportive de Tunis', 'Stade Tunisien')).toBe(1)
    expect(tunisianEliteCount('Sfaxien', 'Etoile du Sahel')).toBe(2)
    expect(tunisianEliteCount('CA Bizertin', 'US Monastir')).toBe(0)
  })
})
