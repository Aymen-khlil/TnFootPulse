import { describe, it, expect } from 'vitest'
import { fetchFootballDataMatchesInRange, FootballDataError } from './transport'
import samplePayload from '@/test/fixtures/fd-matches-sample.json'

const JSON_OK = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('footballData transport', () => {
  it('builds the ranged request with competitions param and X-Auth-Token only', async () => {
    let capturedUrl = ''
    let capturedHeaders: Headers | undefined
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input)
      capturedHeaders = new Headers(init?.headers)
      return JSON_OK(samplePayload)
    }) as typeof fetch

    await fetchFootballDataMatchesInRange({
      fromKey: '2026-10-20',
      toKey: '2026-10-22',
      token: 'fd-token',
      fetchImpl,
    })

    expect(capturedUrl).toContain('/football-data/v4/matches')
    expect(capturedUrl).not.toContain('https://api.football-data.org')
    // dateTo is exclusive at the API — we request one extra day
    expect(capturedUrl).toContain('dateFrom=2026-10-20')
    expect(capturedUrl).toContain('dateTo=2026-10-23')
    expect(capturedUrl).toContain(
      `competitions=${encodeURIComponent('CL,PL,PD,SA,BL1,FL1,PPL,DED')}`,
    )
    expect(capturedHeaders?.get('X-Auth-Token')).toBe('fd-token')
    // undici lowercases header names on the wire
    expect([...capturedHeaders!.keys()].map((k) => k.toLowerCase())).toEqual([
      'x-auth-token',
    ])
  })

  it('filters results inclusively despite the exclusive dateTo request', async () => {
    // Payload contains fixtures on Oct 20–22 only; all must survive.
    const matches = await fetchFootballDataMatchesInRange({
      fromKey: '2026-10-20',
      toKey: '2026-10-22',
      token: 'fd-token',
      fetchImpl: (async () => JSON_OK(samplePayload)) as typeof fetch,
    })
    // TIMED + IN_PLAY + SCHEDULED survive (POSTPONED/FINISHED filtered by status)
    expect(matches.map((m) => m.id)).toEqual(['fd:5000001', 'fd:5000002', 'fd:5000004'])
  })

  it('drops fixtures beyond the inclusive end even if the API returns them', async () => {
    const payload = {
      resultSet: { count: 2 },
      matches: [
        ...samplePayload.matches.slice(0, 1),
        {
          ...samplePayload.matches[0],
          id: 999,
          utcDate: '2026-10-23T12:00:00Z', // inside the exclusive request day
        },
      ],
    }
    const matches = await fetchFootballDataMatchesInRange({
      fromKey: '2026-10-20',
      toKey: '2026-10-22',
      token: 'fd-token',
      fetchImpl: (async () => JSON_OK(payload)) as typeof fetch,
    })
    expect(matches.some((m) => m.id === 'fd:999')).toBe(false)
  })

  it('fails fast when no token is configured', async () => {
    await expect(
      fetchFootballDataMatchesInRange({
        fromKey: '2026-10-20',
        toKey: '2026-10-22',
        token: '',
        fetchImpl: (async () => JSON_OK(samplePayload)) as typeof fetch,
      }),
    ).rejects.toThrow(/Missing football-data\.org token/)
  })

  it('maps 403 restricted resources to a typed error', async () => {
    const error = await fetchFootballDataMatchesInRange({
      fromKey: '2026-10-20',
      toKey: '2026-10-22',
      token: 'free-token',
      fetchImpl: (async () => new Response(null, { status: 403 })) as typeof fetch,
    }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(FootballDataError)
    expect((error as FootballDataError).code).toBe('restricted')
  })

  it('maps HTTP failures to typed errors without leaking raw responses', async () => {
    const error = await fetchFootballDataMatchesInRange({
      fromKey: '2026-10-20',
      toKey: '2026-10-22',
      token: 'fd-token',
      fetchImpl: (async () => new Response(null, { status: 429 })) as typeof fetch,
    }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(FootballDataError)
    expect((error as FootballDataError).code).toBe('http')
  })
})
