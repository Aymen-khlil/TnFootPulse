import type { EspnScoreboardResponse } from '@/types/espn'

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer'

export type EspnErrorCode =
  | 'transport'
  | 'http'
  | 'invalid-response'

/**
 * Error type for the unofficial ESPN feed. Kept separate from the other
 * providers' errors so ESPN Mode failure handling stays self-contained.
 */
export class EspnError extends Error {
  readonly code: EspnErrorCode
  override readonly cause?: unknown

  constructor(code: EspnErrorCode, message: string, cause?: unknown) {
    super(message)
    this.name = 'EspnError'
    this.code = code
    this.cause = cause
  }
}

export type FetchEspnScoreboardOptions = {
  slug: string
  /** Tunis calendar day, YYYY-MM-DD; sent compactly (?dates=YYYYMMDD). */
  dateKey: string
  fetchImpl?: typeof fetch
}

/**
 * One GET per league per day against ESPN's undocumented site API.
 * No auth headers exist; the endpoint is public but client-filtered,
 * which is exactly why this whole pipeline stays an Experimental Source.
 */
export async function fetchEspnScoreboardByDate({
  slug,
  dateKey,
  fetchImpl = fetch,
}: FetchEspnScoreboardOptions): Promise<EspnScoreboardResponse> {
  const compactDate = dateKey.replaceAll('-', '')
  const url = `${ESPN_API_BASE}/${encodeURIComponent(slug)}/scoreboard?dates=${compactDate}`

  let response: Response
  try {
    response = await fetchImpl(url, { method: 'GET' })
  } catch (cause) {
    throw new EspnError('transport', `Could not reach the ESPN feed (${slug}).`, cause)
  }

  if (!response.ok) {
    throw new EspnError('http', `The ESPN feed returned an error (${response.status}) for ${slug}.`)
  }

  let body: EspnScoreboardResponse
  try {
    body = (await response.json()) as EspnScoreboardResponse
  } catch (cause) {
    throw new EspnError('invalid-response', 'The ESPN feed sent an invalid response.', cause)
  }

  if (!body || typeof body !== 'object') {
    throw new EspnError('invalid-response', 'The ESPN feed sent an unexpected payload shape.')
  }
  return body
}
