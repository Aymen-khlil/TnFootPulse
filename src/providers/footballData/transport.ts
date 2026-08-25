import type { Match } from '@/types/football'
import type { FootballDataMatchesResponse } from '@/types/footballData'
import { normalizeFootballDataMatches } from './normalize'
import {
  footballDataCompetitionsParam,
} from '@/data/competitions'

const API_BASE = 'https://api.football-data.org/v4'

export type FootballDataErrorCode =
  | 'missing-token'
  | 'transport'
  | 'http'
  | 'invalid-response'
  /** 403 — competition not in the free tier. */
  | 'restricted'

export class FootballDataError extends Error {
  readonly code: FootballDataErrorCode
  override readonly cause?: unknown

  constructor(code: FootballDataErrorCode, message: string, cause?: unknown) {
    super(message)
    this.name = 'FootballDataError'
    this.code = code
    this.cause = cause
  }
}

export type FetchMatchesInRangeOptions = {
  fromKey: string
  /** Inclusive end date key; converted internally because the API's dateTo is exclusive. */
  toKey: string
  token?: string
  fetchImpl?: typeof fetch
}

/**
 * football-data.org transport: ONE ranged request covers every
 * configured fd competition for the window. Sends only the documented
 * `X-Auth-Token` header (their CORS allow-list). The API treats dateTo
 * as exclusive, so we request one extra day and filter inclusively.
 */
export async function fetchFootballDataMatchesInRange({
  fromKey,
  toKey,
  token,
  fetchImpl = fetch,
}: FetchMatchesInRangeOptions): Promise<Match[]> {
  const resolvedToken = token ?? import.meta.env.VITE_FOOTBALL_DATA_API_TOKEN

  if (!resolvedToken) {
    throw new FootballDataError(
      'missing-token',
      'Missing football-data.org token. Set VITE_FOOTBALL_DATA_API_TOKEN in your .env file.',
    )
  }

  const exclusiveTo = shiftDayKey(toKey, 1)
  const url =
    `${API_BASE}/matches?dateFrom=${encodeURIComponent(fromKey)}` +
    `&dateTo=${encodeURIComponent(exclusiveTo)}` +
    `&competitions=${encodeURIComponent(footballDataCompetitionsParam())}`

  let response: Response
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      headers: { 'X-Auth-Token': resolvedToken },
    })
  } catch (cause) {
    throw new FootballDataError('transport', 'Could not reach the football data service.', cause)
  }

  if (response.status === 403) {
    throw new FootballDataError(
      'restricted',
      'football-data.org free tier does not include a requested resource.',
    )
  }
  if (!response.ok) {
    throw new FootballDataError(
      'http',
      `The football data service returned an error (${response.status}).`,
    )
  }

  const body = (await response.json().catch((cause: unknown) => {
    throw new FootballDataError('invalid-response', 'The football data service sent an invalid response.', cause)
  })) as FootballDataMatchesResponse

  const inclusiveEnd = new Date(`${toKey}T23:59:59Z`).getTime()
  const scoped = {
    ...body,
    matches: body.matches.filter(
      (m) => new Date(m.utcDate).getTime() <= inclusiveEnd,
    ),
  }
  return normalizeFootballDataMatches(scoped)
}

function shiftDayKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const footballDataTransport = async (range: {
  from: string
  to: string
}): Promise<Match[]> => fetchFootballDataMatchesInRange({ fromKey: range.from, toKey: range.to })
