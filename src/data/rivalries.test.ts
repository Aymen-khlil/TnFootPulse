import { describe, it, expect } from 'vitest'
import { RIVALRIES, isRivalry } from './rivalries'

describe('rivalry detection (SPEC §14 cases 3 and 8)', () => {
  it('recognizes all six configured rivalries in both home/away orders', () => {
    for (const { teams } of RIVALRIES) {
      const [a, b] = teams
      expect(isRivalry(a, b)).toBe(true)
      expect(isRivalry(b, a)).toBe(true)
    }
  })

  it('matches aliases and diacritic-stripped variants', () => {
    expect(isRivalry('Esperance de Tunis', 'Club Africain')).toBe(true)
    expect(isRivalry('Club Africain', 'Etoile du Sahel')).toBe(false)
    expect(isRivalry('Inter Milan', 'AC Milan')).toBe(true)
  })

  it('rejects non-pairs', () => {
    expect(isRivalry('Liverpool', 'Manchester City')).toBe(false)
    expect(isRivalry('Arsenal', 'Chelsea')).toBe(false)
    expect(isRivalry('Barcelona', 'Atlético Madrid')).toBe(false)
    expect(isRivalry('Real Madrid', 'Real Madrid')).toBe(false)
    expect(isRivalry('', '')).toBe(false)
  })
})
