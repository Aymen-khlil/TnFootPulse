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

  it('E1c: league Clásico scores 85 (HIGH PRIORITY)', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('Real Madrid', 100),
        awayTeam: team('Barcelona', 99),
        competition: { id: '140', name: 'La Liga', country: 'Spain', rating: 25 },
        stage: 'league-match',
      }),
    )
    expect(result.total).toBe(85)
    expect(result.category).toBe('high-priority')
  })

  it('E2: Liverpool vs Man City in the PL at 17:30 scores 71 (WORTH WATCHING)', () => {
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
    expect(result.total).toBe(71)
    expect(result.category).toBe('worth-watching')
  })

  it('E3: Champions League with unknown teams scores 66 (IF YOU HAVE TIME)', () => {
    const result = calculatePriority(match()) // both teams default to rating 30
    expect(result.teams).toBe(8)
    expect(result.total).toBe(66)
    expect(result.category).toBe('if-you-have-time')
  })

  it('E4: a CL semi-final at 00:30 Tunisia drops to 78 (poor viewing time)', () => {
    const result = calculatePriority(
      match({
        homeTeam: team('PSG', 94),
        awayTeam: team('Borussia Dortmund', 85),
        stage: 'semi-final',
        tunisMinuteOfDay: 30,
      }),
    )
    expect(result.tunisiaTime).toBe(3)
    expect(result.total).toBe(78)
    expect(result.category).toBe('worth-watching')
  })

  it('E5: the Tunis derby caps around 60 (IF YOU HAVE TIME)', () => {
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
    expect(result.total).toBe(60)
    expect(result.category).toBe('if-you-have-time')
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
