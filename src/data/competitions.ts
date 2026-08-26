import type { ProviderId } from '@/types/football'

/**
 * Centralized competition/provider routing — the single place where a
 * competition's internal identity, rating and owning provider meet.
 * Provider-specific ids live here and nowhere else.
 *
 * Routing model ("fd primary / AF exclusive + backup"):
 *  - football-data.org owns everything its free tier covers (Euro leagues,
 *    CL, Libertadores — LIB access verified live 2026-08-26). One ranged
 *    request per week block covers all of them.
 *  - API-Football owns the exclusives with no fd free-tier equivalent
 *    (Tunisia, Saudi, CAF, Europa/Conference League) for today+tomorrow.
 *  - Euro competitions ALSO carry apiFootballLeagueId so that, once those
 *    leagues are subscribed on the AF dashboard, every existing AF
 *    date-request returns them at ZERO extra cost — giving fd a silent
 *    backup source. The AF normalizer drops unsubscribed ids gracefully,
 *    so an unverified id can never break ingestion.
 *
 * fd codes verified against the published free-tier coverage list;
 * AF ids below the marker were verified against the live directory on
 * 2026-08-25. Backup ids marked "dashboard" take effect only after the
 * corresponding league is subscribed in the AF dashboard.
 */

export type CompetitionConfig = {
  /** Stable internal identity used across model/scoring/UI. */
  internalId: string
  name: string
  country: string
  rating: number
  provider: ProviderId
  /** API-Football numeric id — owning provider OR backup subscription. */
  apiFootballLeagueId?: number
  /** football-data.org competition code (when provider === 'football-data'). */
  footballDataCode?: string
}

export const DEFAULT_COMPETITION_SCORE = 6

export const COMPETITION_CONFIGS: CompetitionConfig[] = [
  // football-data.org (free tier) — primary source; AF ids = backup route
  { internalId: 'ucl', name: 'UEFA Champions League', country: 'World', rating: 30, provider: 'football-data', footballDataCode: 'CL', apiFootballLeagueId: 2 },
  { internalId: 'premier-league', name: 'Premier League', country: 'England', rating: 25, provider: 'football-data', footballDataCode: 'PL', apiFootballLeagueId: 39 },
  { internalId: 'la-liga', name: 'La Liga', country: 'Spain', rating: 25, provider: 'football-data', footballDataCode: 'PD', apiFootballLeagueId: 140 },
  { internalId: 'serie-a', name: 'Serie A', country: 'Italy', rating: 24, provider: 'football-data', footballDataCode: 'SA', apiFootballLeagueId: 135 },
  { internalId: 'bundesliga', name: 'Bundesliga', country: 'Germany', rating: 24, provider: 'football-data', footballDataCode: 'BL1', apiFootballLeagueId: 78 },
  { internalId: 'ligue-1', name: 'Ligue 1', country: 'France', rating: 22, provider: 'football-data', footballDataCode: 'FL1', apiFootballLeagueId: 61 },
  { internalId: 'primeira-liga', name: 'Primeira Liga', country: 'Portugal', rating: 19, provider: 'football-data', footballDataCode: 'PPL', apiFootballLeagueId: 94 },
  { internalId: 'eredivisie', name: 'Eredivisie', country: 'Netherlands', rating: 18, provider: 'football-data', footballDataCode: 'DED', apiFootballLeagueId: 88 },
  // NOTE: fd.org's Copa Libertadores code is CLI (verified live
  // 2026-08-26; LIB returns 404 — their filter endpoint echoes unknown
  // codes instead of rejecting them, which is why this was missed once).
  { internalId: 'libertadores', name: 'CONMEBOL Libertadores', country: 'World', rating: 18, provider: 'football-data', footballDataCode: 'CLI' },

  // API-Football exclusives (not available / not free on football-data.org)
  { internalId: 'europa-league', name: 'UEFA Europa League', country: 'World', rating: 26, provider: 'api-football', apiFootballLeagueId: 3 },
  { internalId: 'conference-league', name: 'UEFA Europa Conference League', country: 'World', rating: 21, provider: 'api-football', apiFootballLeagueId: 848 },
  { internalId: 'saudi-pro-league', name: 'Saudi Pro League', country: 'Saudi Arabia', rating: 15, provider: 'api-football', apiFootballLeagueId: 307 },
  { internalId: 'tunisian-ligue-1', name: 'Ligue 1', country: 'Tunisia', rating: 14, provider: 'api-football', apiFootballLeagueId: 202 },
  { internalId: 'fa-cup', name: 'FA Cup', country: 'England', rating: 12, provider: 'api-football', apiFootballLeagueId: 45 },
  { internalId: 'league-cup', name: 'League Cup', country: 'England', rating: 12, provider: 'api-football', apiFootballLeagueId: 48 },
  { internalId: 'copa-del-rey', name: 'Copa del Rey', country: 'Spain', rating: 12, provider: 'api-football', apiFootballLeagueId: 143 },
  { internalId: 'coppa-italia', name: 'Coppa Italia', country: 'Italy', rating: 12, provider: 'api-football', apiFootballLeagueId: 137 },
  { internalId: 'dfb-pokal', name: 'DFB-Pokal', country: 'Germany', rating: 11, provider: 'api-football', apiFootballLeagueId: 81 },
  { internalId: 'caf-champions-league', name: 'CAF Champions League', country: 'Africa', rating: 12, provider: 'api-football', apiFootballLeagueId: 12 },
]

const BY_INTERNAL_ID = new Map(COMPETITION_CONFIGS.map((c) => [c.internalId, c]))
const BY_AF_LEAGUE_ID = new Map(
  COMPETITION_CONFIGS.filter((c) => c.apiFootballLeagueId !== undefined).map((c) => [
    String(c.apiFootballLeagueId),
    c,
  ]),
)
const BY_FD_CODE = new Map(
  COMPETITION_CONFIGS.filter((c) => c.footballDataCode !== undefined).map((c) => [
    String(c.footballDataCode),
    c,
  ]),
)

export function competitionByInternalId(internalId: string): CompetitionConfig | undefined {
  return BY_INTERNAL_ID.get(internalId)
}

export function competitionByApiFootballLeagueId(id: string | number): CompetitionConfig | undefined {
  return BY_AF_LEAGUE_ID.get(String(id))
}

export function competitionByFootballDataCode(code: string): CompetitionConfig | undefined {
  return BY_FD_CODE.get(code)
}

/**
 * Rating lookup by either provider's id, falling back for unlisted ids.
 * Kept for the preserved scoring-foundation test suite.
 */
export function competitionRatingById(id: string): number {
  return (BY_AF_LEAGUE_ID.get(id) ?? BY_FD_CODE.get(id))?.rating ?? DEFAULT_COMPETITION_SCORE
}

/** Comma-joined football-data.org codes for the ranged matches query. */
export function footballDataCompetitionsParam(): string {
  return COMPETITION_CONFIGS.filter((c) => c.provider === 'football-data')
    .map((c) => c.footballDataCode)
    .join(',')
}

/** Distinct display name, disambiguating shared names ("Ligue 1" ×2). */
export function competitionDisplayName(config: {
  name: string
  country?: string
}): string {
  return config.country === 'World' || config.country === 'Africa'
    ? config.name
    : `${config.name} (${config.country})`
}
