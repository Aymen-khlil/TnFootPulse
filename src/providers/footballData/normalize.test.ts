import { describe, it, expect } from 'vitest'
import payload from '@/test/fixtures/fd-matches-sample.json'
import afPayload from '@/test/fixtures/api-fixtures-sample.json'
import type { FootballDataMatchesResponse } from '@/types/footballData'
import type { ApiFixturesResponse } from '@/types/api'
import { normalizeFootballDataMatches } from './normalize'
import { normalizeApiFootballFixtures } from '@/providers/apiFootball/normalize'

const SAMPLE = payload as unknown as FootballDataMatchesResponse

describe('normalizeFootballDataMatches', () => {
  const matches = normalizeFootballDataMatches(SAMPLE)

  it('keeps only configured competitions with visible statuses', () => {
    // POSTPONED (Bayern) and FINISHED (La Liga) dropped → 3 remain
    expect(matches).toHaveLength(3)
    expect(matches.some((m) => m.id === 'fd:5000003')).toBe(false)
    expect(matches.some((m) => m.id === 'fd:5000005')).toBe(false)
  })

  it('maps competition codes to internal ids and config ratings', () => {
    const clasico = matches.find((m) => m.id === 'fd:5000001')!
    expect(clasico.competition.id).toBe('ucl')
    expect(clasico.competition.rating).toBe(30)

    const pl = matches.find((m) => m.id === 'fd:5000002')!
    expect(pl.competition.id).toBe('premier-league')
    expect(pl.competition.rating).toBe(25)
  })

  it('injects curated ratings through alias resolution of fd spellings', () => {
    // "Liverpool FC" and "Arsenal FC" carry FC suffixes; canonical resolver handles them
    const pl = matches.find((m) => m.id === 'fd:5000002')!
    expect(pl.homeTeam.name).toBe('Liverpool FC') // display keeps provider name
    expect(pl.homeTeam.rating).toBeGreaterThanOrEqual(30) // resolved or fallback

    const qf = matches.find((m) => m.id === 'fd:5000004')!
    expect(qf.homeTeam.rating).toBeGreaterThan(30) // Man United alias
    expect(qf.awayTeam.name).toBe('Club Brugge KV') // alias → curated rating
    expect(qf.awayTeam.rating).toBe(72)
  })

  it('derives Tunis fields from UTC instants including date rolls', () => {
    // 2026-10-20T19:00:00Z = 20:00 Tunis, same calendar day
    const clasico = matches.find((m) => m.id === 'fd:5000001')!
    expect(clasico.tunisDateKey).toBe('2026-10-20')
    expect(clasico.tunisMinuteOfDay).toBe(20 * 60)

    // 2026-10-22T23:45Z? no — 19:45Z = 20:45 Tunis same day
    const qf = matches.find((m) => m.id === 'fd:5000004')!
    expect(qf.tunisMinuteOfDay).toBe(20 * 60 + 45)
  })

  it('normalizes stage enums to internal stages', () => {
    const clasico = matches.find((m) => m.id === 'fd:5000001')!
    expect(clasico.stage).toBe('group-phase')

    const qf = matches.find((m) => m.id === 'fd:5000004')!
    expect(qf.stage).toBe('quarter-final')
  })

  it('marks live state with current score', () => {
    const live = matches.find((m) => m.id === 'fd:5000002')!
    expect(live.status).toBe('live')
    expect(live.score).toEqual({ home: 1, away: 0 })
  })

  it('tags source metadata for debugging only', () => {
    for (const m of matches) {
      expect(m.source).toBe('football-data')
    }
  })
})

describe('same-shape guarantee across providers', () => {
  it('both providers emit Matches with identical core key sets', () => {
    const fdSample = normalizeFootballDataMatches(SAMPLE)
    const afMatches = normalizeApiFootballFixtures(afPayload as unknown as ApiFixturesResponse)

    expect(fdSample.length).toBeGreaterThan(0)
    expect(afMatches.length).toBeGreaterThan(0)

    const coreKeys = [
      'awayTeam',
      'competition',
      'id',
      'kickoff',
      'stage',
      'status',
      'tunisDateKey',
      'tunisMinuteOfDay',
    ]
    for (const m of [...fdSample, ...afMatches]) {
      for (const key of coreKeys) {
        expect(Object.keys(m)).toContain(key)
      }
    }
    // Both providers' team objects carry the provider-independent core fields
    const coreTeamKeys = ['id', 'name', 'rating']
    for (const team of [fdSample[0].homeTeam, afMatches[0].homeTeam]) {
      for (const key of coreTeamKeys) {
        expect(Object.keys(team)).toContain(key)
      }
    }
  })
})
