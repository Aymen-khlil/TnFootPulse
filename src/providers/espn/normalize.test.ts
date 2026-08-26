import { describe, it, expect } from 'vitest'
import { normalizeEspnScoreboard } from './normalize'
import { espnLeagueBySlug } from '@/config/espnLeagues'
import type { EspnScoreboardResponse } from '@/types/espn'

const eng = espnLeagueBySlug('eng.1')!

function event(overrides: Record<string, unknown>): EspnScoreboardResponse {
  return {
    events: [
      {
        id: '401900388',
        uid: 's:600~l:770~e:401900388',
        date: '2026-08-25T18:00Z',
        name: 'Al Nassr at Al Ettifaq',
        shortName: 'NSR @ ETT',
        season: { year: 2026, slug: '2026-27-saudi-pro-league' },
        competitions: [
          {
            status: { clock: 5400, displayClock: "90'+8'", period: 2 },
            competitors: [
              {
                id: '8363',
                homeAway: 'home',
                score: '2',
                team: { id: '8363', displayName: 'Al Ettifaq', abbreviation: 'ETT' },
              },
              {
                id: '817',
                homeAway: 'away',
                score: '3',
                team: { id: '817', displayName: 'Al Nassr', abbreviation: 'NSR' },
              },
            ],
            ...overrides,
          },
        ],
      },
    ],
  } as EspnScoreboardResponse
}

describe('normalizeEspnScoreboard', () => {
  it('maps curated slugs onto curated competition identity for scoring parity', () => {
    const payload = event({}) as EspnScoreboardResponse
    payload.events![0].competitions![0].status!.type = { state: 'pre' }

    const matches = normalizeEspnScoreboard(payload, eng)
    expect(matches).toHaveLength(1)
    // Parity with Curated Mode: same internalId and rating as fd.org's PL
    expect(matches[0].competition.id).toBe('premier-league')
    expect(matches[0].competition.rating).toBe(25)
    expect(matches[0].source).toBe('espn')
  })

  it('keeps scheduled matches with parsed scores', () => {
    const payload = event({
      status: { clock: undefined },
    }) as EspnScoreboardResponse
    payload.events![0].competitions![0].status!.type = { state: 'pre' }

    const matches = normalizeEspnScoreboard(payload, eng)
    expect(matches[0].status).toBe('scheduled')
    expect(matches[0].score).toEqual({ home: 2, away: 3 })
  })

  it('marks in-play matches live with elapsed minutes', () => {
    const payload = event({}) as EspnScoreboardResponse
    payload.events![0].competitions![0].status!.type = {
      state: 'in',
    }

    const matches = normalizeEspnScoreboard(payload, eng)
    expect(matches[0].status).toBe('live')
    expect(matches[0].minuteElapsed).toBe(90)
  })

  it('drops finished matches entirely (spec §12 parity)', () => {
    const payload = event({}) as EspnScoreboardResponse
    payload.events![0].competitions![0].status!.type = { state: 'post' }

    expect(normalizeEspnScoreboard(payload, eng)).toHaveLength(0)
  })

  it('skips malformed events without killing the batch', () => {
    const payload: EspnScoreboardResponse = {
      events: [
        { id: 'e1', date: '2026-08-25T18:00Z', competitions: [] },
        { id: 'e2', date: 'not-a-date', competitions: [{}] },
        {
          id: 'e3',
          date: '2026-08-25T20:00Z',
          season: { slug: 'group-stage' },
          competitions: [
            {
              status: { type: { state: 'pre' } },
              competitors: [
                { id: 'h', homeAway: 'home', team: { id: 'h', displayName: 'Olympique Lyonnais' } },
                { id: 'a', homeAway: 'away', team: { id: 'a', displayName: 'Marseille' } },
              ],
            },
          ],
        },
      ],
    }
    // e1/e2 malformed; only e3 survives
    const matches = normalizeEspnScoreboard(payload, eng)
    expect(matches).toHaveLength(1)
    expect(matches[0].stage).toBe('group-phase')
    expect(matches[0].tunisDateKey).toBe('2026-08-25')
  })
})
