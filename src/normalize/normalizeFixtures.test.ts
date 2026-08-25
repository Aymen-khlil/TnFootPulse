import { describe, it, expect } from 'vitest'
import payload from '@/test/fixtures/api-fixtures-sample.json'
import type { ApiFixturesResponse } from '@/types/api'
import { normalizeFixtures } from './normalizeFixtures'

const SAMPLE = payload as unknown as ApiFixturesResponse

describe('normalizeFixtures', () => {
  const matches = normalizeFixtures(SAMPLE)

  it('keeps only allowlisted competitions with visible statuses', () => {
    // 8 raw fixtures: FT finished, PST postponed, one unsupported league → 5 remain
    expect(matches).toHaveLength(5)
    expect(matches.some((m) => m.id === '1000002')).toBe(false) // FT
    expect(matches.some((m) => m.id === '1000006')).toBe(false) // PST
    expect(matches.some((m) => m.id === '1000003')).toBe(false) // unsupported league
  })

  it('injects curated team ratings through alias resolution', () => {
    const clasico = matches.find((m) => m.id === '1000001')!
    expect(clasico.homeTeam.rating).toBe(100)
    expect(clasico.awayTeam.rating).toBe(99)

    // "Bayern München" resolves via diacritic-stripped normalization
    const pokal = matches.find((m) => m.id === '1000005')!
    expect(pokal.homeTeam.rating).toBe(95)
    expect(pokal.awayTeam.name).toBe('VfB Stuttgart')
    expect(pokal.awayTeam.rating).toBe(74)
  })

  it('falls back to the unknown-team rating for unlisted clubs', () => {
    const caf = matches.find((m) => m.id === '1000008')!
    expect(caf.homeTeam.name).toBe('Mamelodi Sundowns')
    expect(caf.homeTeam.rating).toBe(30)
    expect(caf.awayTeam.rating).toBe(30)
  })

  it('normalizes stage and injects competition ratings', () => {
    const clasico = matches.find((m) => m.id === '1000001')!
    expect(clasico.stage).toBe('group-phase') // "League Phase - 1"
    expect(clasico.competition.rating).toBe(30)

    const pokal = matches.find((m) => m.id === '1000005')!
    expect(pokal.stage).toBe('quarter-final') // "Quarter-finals" — not 'final'
    expect(pokal.competition.id).toBe('81')
    expect(pokal.competition.rating).toBe(11)
  })

  it('derives Tunis calendar fields from pre-converted kickoffs', () => {
    const clasico = matches.find((m) => m.id === '1000001')!
    expect(clasico.tunisDateKey).toBe('2026-08-25')
    expect(clasico.tunisMinuteOfDay).toBe(20 * 60)

    // Saudi fixture at 23:30 Tunis wall-clock stays on its Tunis date
    const saudi = matches.find((m) => m.id === '1000007')!
    expect(saudi.tunisDateKey).toBe('2026-08-25')
    expect(saudi.tunisMinuteOfDay).toBe(23 * 60 + 30)
  })

  it('preserves live state with elapsed minutes and score', () => {
    const eredivisie = matches.find((m) => m.id === '1000004')!
    expect(eredivisie.status).toBe('live')
    expect(eredivisie.minuteElapsed).toBe(34)
    expect(eredivisie.score).toEqual({ home: 1, away: 0 })
  })

  it('omits score when goals are null', () => {
    const caf = matches.find((m) => m.id === '1000008')!
    expect(caf.score).toBeUndefined()
  })
})
