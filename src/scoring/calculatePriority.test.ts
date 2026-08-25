import { describe, it, expect } from 'vitest'
import { calculatePriority } from './calculatePriority'
import type { Match } from '@/types/football'

function team(name: string, rating: number) {
  return { id: name.toLowerCase().replace(/\s+/g, '-'), name, rating }
}

function match(overrides: Partial<Match> = {}): Match {
  return {
    id: 'm1',
    homeTeam: team('A', 30),
    awayTeam: team('B', 30),
    competition: {
      id: '2',
      name: 'UEFA Champions League',
      country: 'World',
      rating: 30,
    },
    kickoff: new Date('2026-08-25T19:00:00Z'),
    tunisDateKey: '2026-08-25',
    tunisMinuteOfDay: 20 * 60,
    stage: 'group-phase',
    status: 'scheduled',
    ...overrides,
  }
}

describe('calculatePriority — worked examples from SPEC.md §11', () => {
  it('E1a: group-stage Clásico scores 93 (MUST WATCH)', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('Real Madrid', 100),
        awayTeam: team('Barcelona', 99),
        stage: 'group-phase',
      }),
    )
    expect(result.competition).toBe(30)
    expect(result.teams).toBe(25)
    expect(result.context).toBe(18)
    expect(result.tunisiaTime).toBe(20)
    expect(result.total).toBe(93)
    expect(result.category).toBe('must-watch')
    const reasons = result.reasons.join(' | ')
    expect(reasons).toContain('rivalry')
    expect(reasons).toContain('Champions League')
  })

  it('E1b: the same fixture as a final reaches exactly 100', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('Real Madrid', 100),
        awayTeam: team('Barcelona', 99),
        stage: 'final',
      }),
    )
    expect(result.context).toBe(25)
    expect(result.total).toBe(100)
    expect(result.category).toBe('must-watch')
  })

  it('E1c: league Clásico lifts from 85 to the 90 pedigree floor (MUST WATCH)', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('Real Madrid', 100),
        awayTeam: team('Barcelona', 99),
        competition: { id: '140', name: 'La Liga', country: 'Spain', rating: 25 },
        stage: 'league-match',
      }),
    )
    expect(result.pedigree).toBe(5)
    expect(result.total).toBe(90)
    expect(result.category).toBe('must-watch')
  })

  it('E2: Liverpool vs Man City in the PL at 17:30 lifts from 71 to the 90 floor (MUST WATCH)', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('Liverpool', 96),
        awayTeam: team('Manchester City', 95),
        competition: {
          id: '39',
          name: 'Premier League',
          country: 'England',
          rating: 25,
        },
        stage: 'league-match',
        tunisMinuteOfDay: 17 * 60 + 30,
      }),
    )
    expect(result.competition).toBe(25)
    expect(result.teams).toBe(24)
    expect(result.context).toBe(5)
    expect(result.tunisiaTime).toBe(17)
    expect(result.pedigree).toBe(19)
    expect(result.total).toBe(90)
    expect(result.category).toBe('must-watch')
  })

  it('E3: Champions League with unknown teams scores 66 (IF YOU HAVE TIME)', () => {
    const result = calculatePriority(match()) // both teams default to rating 30
    expect(result.teams).toBe(8)
    expect(result.total).toBe(66)
    expect(result.category).toBe('if-you-have-time')
  })

  it('E4: a CL semi-final at 00:30 Tunisia lifts from 78 to the 90 floor (MUST WATCH)', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('PSG', 94),
        awayTeam: team('Borussia Dortmund', 85),
        stage: 'semi-final',
        tunisMinuteOfDay: 30,
      }),
    )
    expect(result.tunisiaTime).toBe(3)
    expect(result.pedigree).toBe(12)
    expect(result.total).toBe(90)
    expect(result.category).toBe('must-watch')
  })

  it('E5: the Tunis derby lifts from 60 to the 80 both-elite floor (HIGH PRIORITY)', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('Espérance de Tunis', 46),
        awayTeam: team('Club Africain', 42),
        competition: {
          id: '202',
          name: 'Ligue 1',
          country: 'Tunisia',
          rating: 14,
        },
        stage: 'league-match',
      }),
    )
    expect(result.competition).toBe(14)
    expect(result.teams).toBe(11)
    expect(result.context).toBe(15)
    expect(result.tunisiaTime).toBe(20)
    expect(result.pedigree).toBe(20)
    expect(result.total).toBe(80)
    expect(result.category).toBe('high-priority')
  })

  it('E6: an Eredivisie prime-time mid-table clash scores 62 (SPEC §14 case 5)', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('Ajax', 76),
        awayTeam: team('PSV', 77),
        competition: {
          id: '88',
          name: 'Eredivisie',
          country: 'Netherlands',
          rating: 18,
        },
        stage: 'league-match',
      }),
    )
    // 18 + round(76.5 × 0.25)=19 + 5 + 20 = 62
    expect(result.competition).toBe(18)
    expect(result.teams).toBe(19)
    expect(result.total).toBe(62)
    expect(result.category).toBe('if-you-have-time')
  })
})

describe('calculatePriority — club pedigree floors (ADR-0002)', () => {
  it('adds no pedigree when the component sum already meets the floor', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('Real Madrid', 100),
        awayTeam: team('Barcelona', 99),
        stage: 'group-phase',
      }),
    )
    expect(result.pedigree).toBe(0)
    expect(result.total).toBe(93)
  })

  it('tops up a league Clásico from 85 to the 90 floor', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('Real Madrid', 100),
        awayTeam: team('Barcelona', 99),
        competition: { id: '140', name: 'La Liga', country: 'Spain', rating: 25 },
        stage: 'league-match',
      }),
    )
    expect(result.pedigree).toBe(5)
    expect(result.total).toBe(90)
    expect(result.category).toBe('must-watch')
    expect(result.reasons.join(' | ')).toMatch(/UEFA pedigree/i)
  })

  it('lifts Liverpool vs Man City from 71 to 90', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('Liverpool', 96),
        awayTeam: team('Manchester City', 95),
        competition: { id: '39', name: 'Premier League', country: 'England', rating: 25 },
        stage: 'league-match',
        tunisMinuteOfDay: 17 * 60 + 30,
      }),
    )
    expect(result.pedigree).toBe(19)
    expect(result.total).toBe(90)
    expect(result.category).toBe('must-watch')
  })

  it('does not fire for matches without two ranked clubs', () => {
    const result = calculatePriority(match()) // unknown teams, UCL
    expect(result.pedigree).toBe(0)
    expect(result.total).toBe(66)
    expect(result.reasons.join(' | ')).not.toMatch(/pedigree/i)
  })

  it('lifts the Tunis derby to the 80 both-elite floor', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('Espérance de Tunis', 46),
        awayTeam: team('Club Africain', 42),
        competition: { id: '202', name: 'Ligue 1', country: 'Tunisia', rating: 14 },
        stage: 'league-match',
      }),
    )
    expect(result.pedigree).toBe(20)
    expect(result.total).toBe(80)
    expect(result.category).toBe('high-priority')
    expect(result.reasons.join(' | ')).toMatch(/Tunisian/i)
  })

  it('components plus pedigree always sum to the total', () => {
    const samples = [
      match(),
      match({ homeTeam: team('Bayern Munich', 95), awayTeam: team('Benfica', 81) }),
      match({
        homeTeam: team('Espérance de Tunis', 46),
        awayTeam: team('Stade Tunisien', 32),
        competition: { id: '202', name: 'Ligue 1', country: 'Tunisia', rating: 14 },
        stage: 'league-match',
      }),
    ]
    for (const m of samples) {
      const r = calculatePriority(m)
      expect(r.competition + r.teams + r.context + r.tunisiaTime + r.pedigree).toBe(r.total)
    }
  })
})

describe('calculatePriority — guarantees', () => {
  it('never exceeds 100 even with out-of-range inputs', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('Absurd FC', 500),
        awayTeam: team('Absurd United', 500),
        competition: { id: 'x', name: 'Absurd', rating: 90 },
        stage: 'final',
      }),
    )
    expect(result.total).toBeLessThanOrEqual(100)
  })

  it('never falls below 0 with hostile inputs', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('Bad', -1000),
        awayTeam: team('Worse', -1000),
        competition: { id: 'y', name: 'Bad Comp', rating: -100 },
        tunisMinuteOfDay: -500,
      }),
    )
    expect(result.total).toBeGreaterThanOrEqual(0)
  })

  it('is deterministic for identical input', () => {
    const m = match()
    expect(calculatePriority(m)).toEqual(calculatePriority(m))
  })

  it('reports rivalry only when one applies', () => {
    const without = calculatePriority(match({ stage: 'league-match' }))
    expect(without.reasons.join(' ').toLowerCase()).not.toContain('rivalry')

    const withRivalry = calculatePriority(
      match({
        stage: 'league-match',
        rawRound: 'Regular Season - 3',
      }),
    )
    // No rivalry configured for teams A/B → context stays at base
    expect(withRivalry.context).toBe(5)
  })
})
