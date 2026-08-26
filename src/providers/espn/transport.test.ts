import { describe, it, expect, vi } from 'vitest'
import { fetchEspnScoreboardByDate } from './transport'

function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as unknown as Response
}

describe('espnTransport', () => {
  it('builds the scoreboard URL with a compact dates parameter', async () => {
    const fetchImpl = vi.fn(() => Promise.resolve(okResponse({ events: [] })))
    await fetchEspnScoreboardByDate({ slug: 'eng.1', dateKey: '2026-08-29', fetchImpl })

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=20260829',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('returns the parsed payload', async () => {
    const payload = { events: [{ id: 'e1' }] }
    const result = await fetchEspnScoreboardByDate({
      slug: 'ksa.1',
      dateKey: '2026-08-25',
      fetchImpl: () => Promise.resolve(okResponse(payload)),
    })
    expect(result.events).toHaveLength(1)
  })

  it('wraps network failures as transport errors', async () => {
    const promise = fetchEspnScoreboardByDate({
      slug: 'eng.1',
      dateKey: '2026-08-29',
      fetchImpl: () => Promise.reject(new Error('offline')),
    })
    await expect(promise).rejects.toMatchObject({ code: 'transport', name: 'EspnError' })
  })

  it('wraps non-OK responses as http errors (ESPN filters clients aggressively)', async () => {
    const promise = fetchEspnScoreboardByDate({
      slug: 'eng.1',
      dateKey: '2026-08-29',
      fetchImpl: () =>
        Promise.resolve({ ok: false, status: 403, json: () => Promise.resolve({}) } as unknown as Response),
    })
    await expect(promise).rejects.toMatchObject({ code: 'http' })
  })

  it('wraps malformed JSON as invalid-response errors', async () => {
    const promise = fetchEspnScoreboardByDate({
      slug: 'eng.1',
      dateKey: '2026-08-29',
      fetchImpl: () =>
        Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new Error('bad json')) } as unknown as Response),
    })
    await expect(promise).rejects.toMatchObject({ code: 'invalid-response' })
  })
})
