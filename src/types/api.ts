/** Raw API-Football fixture payload shapes (v3, fixtures-by-date). */

export type ApiFixtureStatus = {
  long: string
  short: string
  elapsed: number | null
}

export type ApiTeamRef = {
  id: number
  name: string
  logo: string | null
  winner: boolean | null
}

export type ApiLeagueRef = {
  id: number
  name: string
  country: string
  logo: string | null
  flag: string | null
  season: number
  round: string
}

export type ApiFixture = {
  fixture: {
    id: number
    referee: string | null
    timezone: string
    /** ISO-8601; pre-converted to the requested timezone when `timezone` param is sent. */
    date: string
    timestamp: number
    status: ApiFixtureStatus
  }
  league: ApiLeagueRef
  teams: { home: ApiTeamRef; away: ApiTeamRef }
  goals: { home: number | null; away: number | null }
}

export type ApiFixturesResponse = {
  get: string
  parameters: Record<string, string>
  errors: unknown[] | Record<string, unknown>
  results: number
  paging: { current: number; total: number }
  response: ApiFixture[]
}
