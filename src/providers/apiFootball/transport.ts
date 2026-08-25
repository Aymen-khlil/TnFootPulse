import type { ApiFixturesResponse } from '@/types/api'
import type { Match } from '@/types/football'
import { normalizeApiFootballFixtures } from './normalize'
import { TUNIS_TIMEZONE } from '@/utils/timezone'

const API_BASE = 'https://v3.football.api-sports.io'

export type ApiFootballErrorCode =
  | 'missing-key'
  | 'transport'
  | 'http'
  | 'invalid-response'
  | 'rejected'
  /** Free-plan future-date rejection ("Free plans do not have access to this date...") */
  | 'plan-date-restricted'

export class FootballApiError extends Error {
  readonly code: ApiFootballErrorCode
  override readonly cause?: unknown

  constructor(code: ApiFootballErrorCode, message: string, cause?: unknown) {
    super(message)
    this.name = 'FootballApiError'
    this.code = code
    this.cause = cause
  }
}

export type FetchFixturesOptions = {
  dateKey: string
  apiKey?: string
  fetchImpl?: typeof fetch
}

/**
 * API-Football transport. GET-only, one request per Tunis calendar
 * date, kickoffs pre-converted via the timezone parameter. Sends ONLY
 * the whitelisted auth header — the API rejects preflights otherwise.
 *
 * The free plan rejects out-of-window dates with an explanatory error;
 * that rejection is surfaced as the typed 'plan-date-restricted' code so
 * callers can degrade gracefully instead of retrying pointlessly.
 */
export async function fetchApiFootballFixturesByDate({
  dateKey,
  apiKey,
  fetchImpl = fetch,
}: FetchFixturesOptions): Promise<Match[]> {
  const key = apiKey ?? import.meta.env.VITE_API_FOOTBALL_KEY

  if (!key) {
    throw new FootballApiError(
      'missing-key',
      'Missing API-Football key. Set VITE_API_FOOTBALL_KEY in your .env file.',
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
  return normalizeApiFootballFixtures(body)
}

function assertNoApiErrors(body: ApiFixturesResponse): void {
  // The API signals plan/auth problems via its errors field.
  if (Array.isArray(body.errors)) {
    if (body.errors.length > 0) throw rejected(body.errors)
    return
  }
  if (body.errors && Object.keys(body.errors).length > 0) throw rejected(body.errors)
}

function rejected(errors: unknown): FootballApiError {
  const text = JSON.stringify(errors).toLowerCase()
  if (text.includes('free plans do not have access')) {
    return new FootballApiError(
      'plan-date-restricted',
      'API-Football free plan does not cover this date.',
    )
  }
  return new FootballApiError('rejected', `API request rejected: ${JSON.stringify(errors)}`)
}

export const apiFootballTransport = async (dateKey: string): Promise<Match[]> =>
  fetchApiFootballFixturesByDate({ dateKey })
