import { describe, it, expect } from 'vitest'
import { pedigreeFloor } from './pedigreeFloor'

const LA_LIGA = 'La Liga'

describe('pedigreeFloor — UEFA top-20 (both-team trigger)', () => {
  it('returns null when only one team is UEFA-ranked', () => {
    expect(pedigreeFloor('Real Madrid', 'Real Sociedad', LA_LIGA)).toBeNull()
    expect(pedigreeFloor('Getafe', 'Bayern Munich', 'Bundesliga')).toBeNull()
  })

  it('returns null when neither team is ranked', () => {
    expect(pedigreeFloor('Ajax', 'PSV', 'Eredivisie')).toBeNull()
  })

  it('applies floor 90 when both are in ranks 1–10', () => {
    const floor = pedigreeFloor('Bayern Munich', 'Real Madrid', LA_LIGA)
    expect(floor?.floor).toBe(90)
    expect(floor?.reasonLabel).toMatch(/UEFA pedigree/i)
    expect(floor?.reasonLabel).toMatch(/rank 1/i)
  })

  it('applies floor 80 when both are in ranks 11–15', () => {
    const floor = pedigreeFloor('Aston Villa', 'Roma', LA_LIGA)
    expect(floor?.floor).toBe(80)
  })

  it('applies floor 70 when both are in ranks 16–20', () => {
    const floor = pedigreeFloor('Fiorentina', 'Club Brugge', LA_LIGA)
    expect(floor?.floor).toBe(70)
  })

  it('best-floor-wins across tiers (rank 1 vs rank 20 → 90)', () => {
    const floor = pedigreeFloor('Bayern Munich', 'Benfica', LA_LIGA)
    expect(floor?.floor).toBe(90)
  })

  it('resolves provider aliases to canonical names', () => {
    const floor = pedigreeFloor('FC Bayern München', 'FC Barcelona', LA_LIGA)
    expect(floor?.floor).toBe(90)
  })
})

describe('pedigreeFloor — Tunisian elite clubs', () => {
  it('floor 70 when one elite club plays anyone else', () => {
    const floor = pedigreeFloor('Espérance de Tunis', 'Stade Tunisien', LA_LIGA)
    expect(floor?.floor).toBe(70)
    expect(floor?.reasonLabel).toMatch(/Tunisian/i)
  })

  it('floor 80 when two elite clubs meet', () => {
    expect(pedigreeFloor('Espérance de Tunis', 'Club Africain', LA_LIGA)?.floor).toBe(80)
    expect(pedigreeFloor('CS Sfaxien', 'Étoile du Sahel', LA_LIGA)?.floor).toBe(80)
  })

  it('no floor without an elite club', () => {
    expect(pedigreeFloor('Stade Tunisien', 'CA Bizertin', LA_LIGA)).toBeNull()
  })
})

describe('pedigreeFloor — cross-system and exemptions', () => {
  it('Tunisian elite vs UEFA top-20: only Tunisian floor fires (UEFA needs both)', () => {
    const floor = pedigreeFloor('Espérance de Tunis', 'Bayern Munich', 'CAF Champions League')
    expect(floor?.floor).toBe(70)
  })

  it('never fires for friendlies', () => {
    expect(pedigreeFloor('Bayern Munich', 'Real Madrid', 'Club Friendly Games')).toBeNull()
    expect(pedigreeFloor('Espérance de Tunis', 'Club Africain', 'Friendly International')).toBeNull()
  })

  it('detects friendlies across provider languages', () => {
    expect(pedigreeFloor('Bayern Munich', 'Real Madrid', 'Match amical')).toBeNull()
    expect(pedigreeFloor('Bayern Munich', 'Real Madrid', 'Amistoso Internacional')).toBeNull()
  })
})
