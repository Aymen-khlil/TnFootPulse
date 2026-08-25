import { describe, it, expect } from 'vitest'
import { fetchFixturesByDate, FootballApiError } from './footballApi'
import samplePayload from '@/test/fixtures/api-fixtures-sample.json'

const JSON_OK = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('footballApi transport', () => {
  it('builds the fixtures-by-date request with the whitelisted auth header only', async () => {
    let capturedUrl = ''
    let capturedHeaders: Headers | undefined
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input)
      capturedHeaders = new Headers(init?.headers)
      return JSON_OK(samplePayload)
    }) as typeof fetch

    await fetchFixturesByDate({ dateKey: '2026-08-25', apiKey: 'test-key', fetchImpl })

    expect(capturedUrl).toContain('https://v3.football.api-sports.io/fixtures')
    expect(capturedUrl).toContain('date=2026-08-25')
    expect(capturedUrl).toContain('timezone=Africa%2FTunis')
    expect(capturedHeaders?.get('x-apisports-key')).toBe('test-key')
    expect([...capturedHeaders!.keys()]).toEqual(['x-apisports-key'])
  })

  it('returns normalized matches on success', async () => {
    const matches = await fetchFixturesByDate({
      dateKey: '2026-08-25',
      apiKey: 'test-key',
      fetchImpl: (async () => JSON_OK(samplePayload)) as typeof fetch,
    })
    expect(matches).toHaveLength(5)
    expect(matches[0].status).toBeDefined()
  })

  it('fails fast when no API key is configured', async () => {
    await expect(
      fetchFixturesByDate({
        dateKey: '2026-08-25',
        apiKey: '',
        fetchImpl: (async () => JSON_OK(samplePayload)) as typeof fetch,
      }),
    ).rejects.toThrow(/Missing API key/)
  })

  it('maps HTTP failures to typed errors without leaking raw responses', async () => {
    const error = await fetchFixturesByDate({
      dateKey: '2026-08-25',
      apiKey: 'bad-key',
      fetchImpl: (async () => new Response(null, { status: 403 })) as typeof fetch,
    }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(FootballApiError)
    expect((error as Error).message).toContain('403')
  })

  it('surfaces API-level rejections carried in the errors field', async () => {
    const rejected = { ...samplePayload, errors: { token: 'Error/misused token' } }
    const error = await fetchFixturesByDate({
      dateKey: '2026-08-25',
      apiKey: 'bad-key',
      fetchImpl: (async () => JSON_OK(rejected)) as typeof fetch,
    }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(FootballApiError)
    expect((error as Error).message).toContain('misused token')
  })
})
