import { describe, it, expect, vi } from 'vitest'
import { teamRatingByName } from './teams'
import { calculatePriority } from '@/scoring/calculatePriority'
import type { Match } from '@/types/football'

function team(name: string) {
  return { id: name.toLowerCase().replace(/\s+/g, '-'), name, rating: teamRatingByName(name) }
}

describe('football-data.org official-name resolution', () => {
  it('resolves "Real Sociedad de Fútbol" to the curated 75', () => {
    expect(teamRatingByName('Real Sociedad de Fútbol')).toBe(75)
  })

  it('resolves the other observed fd.org long forms', () => {
    expect(teamRatingByName('Real Betis Balompié')).toBe(73)
    expect(teamRatingByName('Club Atlético de Madrid')).toBe(86)
    expect(teamRatingByName('FC Internazionale Milano')).toBe(90)
    expect(teamRatingByName('SSC Napoli')).toBe(85)
    expect(teamRatingByName('Atalanta BC')).toBe(80)
    expect(teamRatingByName('ACF Fiorentina')).toBe(75)
    expect(teamRatingByName('Bologna FC 1909')).toBe(72)
    expect(teamRatingByName('Bayer 04 Leverkusen')).toBe(84)
    expect(teamRatingByName('Olympique de Marseille')).toBe(77)
    expect(teamRatingByName('OGC Nice')).toBe(71)
    expect(teamRatingByName('Lille OSC')).toBe(73)
    expect(teamRatingByName('Sport Lisboa e Benfica')).toBe(81)
    expect(teamRatingByName('Feyenoord Rotterdam')).toBe(75)
  })

  it('warns once per distinct unresolved name in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(teamRatingByName('Totally Unknown FC')).toBe(30)
    expect(teamRatingByName('Totally Unknown FC')).toBe(30)
    const unknownWarnings = warn.mock.calls.filter((c) =>
      String(c[0]).includes('Totally Unknown FC'),
    )
    expect(unknownWarnings).toHaveLength(1)
    warn.mockRestore()
  })
})

describe('acceptance: Real Madrid CF vs Real Sociedad de Fútbol (SPEC §11-style)', () => {
  function laLigaMatch(homeName: string, awayName: string): Match {
    return {
      id: 'fd-acceptance',
      homeTeam: team(homeName),
      awayTeam: team(awayName),
      competition: { id: 'la-liga', name: 'La Liga', country: 'Spain', rating: 25 },
      kickoff: new Date('2026-08-26T19:00:00Z'),
      tunisDateKey: '2026-08-26',
      tunisMinuteOfDay: 20 * 60,
      stage: 'league-match',
      status: 'scheduled',
    }
  }

  it('scores 22 for teams and 72 total (WORTH WATCHING)', () => {
    const result = calculatePriority(
      laLigaMatch('Real Madrid CF', 'Real Sociedad de Fútbol'),
    )
    // (100 + 75) / 2 = 87.5 → ×0.25 = 21.875 → round = 22
    expect(result.teams).toBe(22)
    expect(result.competition).toBe(25)
    expect(result.context).toBe(5)
    expect(result.tunisiaTime).toBe(20)
    expect(result.total).toBe(72)
    expect(result.category).toBe('worth-watching')
    expect(result.reasons.join(' ')).toContain('Strong sides')
  })

  it('keeps the previously-broken variant at its corrected value, not 16', () => {
    expect(calculatePriority(laLigaMatch('Real Madrid CF', 'Real Sociedad de Fútbol')).teams).not.toBe(16)
  })
})
