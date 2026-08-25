import type { ApiFixturesResponse } from '@/types/api'
import { normalizeFixtures } from '@/normalize/normalizeFixtures'
import { TUNIS_TIMEZONE } from '@/utils/timezone'
import type { FixturesTransport } from '@/cache/fixturesCache'

const API_BASE = 'https://v3.football.api-sports.io'

export type FootballApiErrorCode =
  | 'missing-key'
  | 'transport'
  | 'http'
  | 'invalid-response'
  | 'rejected'

export class FootballApiError extends Error {
  readonly code: FootballApiErrorCode
  override readonly cause?: unknown

  constructor(code: FootballApiErrorCode, message: string, cause?: unknown) {
    super(message)
    this.name = 'FootballApiError'
    this.code = code
    this.cause = cause
  }
}

export type FetchFixturesOptions = {
  dateKey: string
  /** Overrides the env-provided key (used by tests and future proxy seam). */
  apiKey?: string
  fetchImpl?: typeof fetch
}

/**
 * The single API touchpoint. GET-only, one request per Tunis calendar
 * date, kickoffs pre-converted via the timezone parameter. Sends ONLY
 * the whitelisted auth header — the API rejects preflights otherwise.
 */
export async function fetchFixturesByDate({
  dateKey,
  apiKey,
  fetchImpl = fetch,
}: FetchFixturesOptions): Promise<ReturnType<typeof normalizeFixtures>> {
  const key = apiKey ?? import.meta.env.VITE_API_FOOTBALL_KEY

  if (!key) {
    throw new FootballApiError(
      'missing-key',
      'Missing API key. Set VITE_API_FOOTBALL_KEY in your .env file.',
    )
  }

  const url = `${API_BASE}/fixtures?date=${encodeURIComponent(dateKey)}&timezone=${encodeURIComponent(TUNIS_TIMEZONE)}`

  let response: Response
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      headers: { 'x-apisports-key': key },
    })
  } catch (cause) {
    throw new FootballApiError('transport', 'Could not reach the football data service.', cause)
  }

  if (!response.ok) {
    throw new FootballApiError(
      'http',
      `The football data service returned an error (${response.status}).`,
    )
  }

  const body = (await response.json().catch((cause: unknown) => {
    throw new FootballApiError('invalid-response', 'The football data service sent an invalid response.', cause)
  })) as ApiFixturesResponse

  assertNoApiErrors(body)
  return normalizeFixtures(body)
}

function assertNoApiErrors(body: ApiFixturesResponse): void {
  // The API signals plan/auth problems via its errors field.
  if (Array.isArray(body.errors)) {
    if (body.errors.length > 0) {
      throw new FootballApiError('rejected', `API request rejected: ${JSON.stringify(body.errors)}`)
    }
    return
  }
  if (body.errors && Object.keys(body.errors).length > 0) {
    throw new FootballApiError('rejected', `API request rejected: ${JSON.stringify(body.errors)}`)
  }
}

/** Default transport wired into the app; injectable elsewhere. */
export const footballApiTransport: FixturesTransport = (dateKey) =>
  fetchFixturesByDate({ dateKey })
