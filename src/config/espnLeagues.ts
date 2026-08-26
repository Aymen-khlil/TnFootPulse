import { DEFAULT_COMPETITION_SCORE, competitionByInternalId } from '@/data/competitions'

/**
 * ESPN Mode competition manifest — the verified slug list behind the
 * experimental Source Mode (probe-verified against live responses on
 * 2026-08-26 unless noted). Dead slugs are tolerated at runtime: the
 * transport fails per-league and that league simply contributes nothing.
 *
 * `internalId` maps a slug onto an existing curated CompetitionConfig so
 * overlapping competitions score IDENTICALLY in both Source Modes —
 * same name, country, and rating flow into calculatePriority. Leagues
 * without a curated twin get an espn-scoped identity, an optional
 * hand-tuned rating, or the default score.
 */

export type EspnLeagueConfig = {
  /** ESPN scoreboard slug, e.g. "eng.1". */
  slug: string
  /** Curated internalId to reuse for full scoring parity, when one exists. */
  internalId?: string
  /** Display metadata for leagues without a curated twin. */
  name?: string
  country?: string
  rating?: number
}

export const ESPN_LEAGUES: EspnLeagueConfig[] = [
  // Europe — big five + Portugal/Netherlands map onto curated configs
  { slug: 'eng.1', internalId: 'premier-league' },
  { slug: 'esp.1', internalId: 'la-liga' },
  { slug: 'ita.1', internalId: 'serie-a' },
  { slug: 'ger.1', internalId: 'bundesliga' },
  { slug: 'fra.1', internalId: 'ligue-1' },
  { slug: 'por.1', internalId: 'primeira-liga' },
  { slug: 'ned.1', internalId: 'eredivisie' },
  // Europe — additional leagues (espn-scoped identities)
  { slug: 'eng.2', name: 'EFL Championship', country: 'England', rating: 10 },
  { slug: 'bel.1', name: 'Belgian Pro League', country: 'Belgium' },
  { slug: 'tur.1', name: 'Süper Lig', country: 'Türkiye', rating: 12 },
  { slug: 'sco.1', name: 'Scottish Premiership', country: 'Scotland', rating: 8 },
  { slug: 'gre.1', name: 'Super League Greece', country: 'Greece' },
  { slug: 'rus.1', name: 'Russian Premier League', country: 'Russia', rating: 8 },
  { slug: 'sui.1', name: 'Swiss Super League', country: 'Switzerland' },
  { slug: 'aut.1', name: 'Austrian Bundesliga', country: 'Austria' },
  { slug: 'den.1', name: 'Danish Superliga', country: 'Denmark' },
  // UEFA cups — all curated
  { slug: 'uefa.champions', internalId: 'ucl' },
  { slug: 'uefa.europa', internalId: 'europa-league' },
  { slug: 'uefa.europa.conf', internalId: 'conference-league' },
  // South America
  { slug: 'conmebol.libertadores', internalId: 'libertadores' },
  { slug: 'bra.1', name: 'Brasileirão Série A', country: 'Brazil', rating: 16 },
  { slug: 'arg.1', name: 'Liga Profesional de Fútbol', country: 'Argentina', rating: 14 },
  { slug: 'conmebol.sudamericana', name: 'CONMEBOL Sudamericana', country: 'South America', rating: 13 },
  { slug: 'col.1', name: 'Categoría Primera A', country: 'Colombia' },
  { slug: 'chi.1', name: 'Primera División', country: 'Chile' },
  { slug: 'uru.1', name: 'Primera División', country: 'Uruguay' },
  // North America
  { slug: 'mex.1', name: 'Liga BBVA MX', country: 'Mexico', rating: 13 },
  { slug: 'usa.1', name: 'MLS', country: 'USA', rating: 10 },
  { slug: 'concacaf.leagues.cup', name: 'Leagues Cup', country: 'North America', rating: 11 },
  // Asia
  { slug: 'ksa.1', internalId: 'saudi-pro-league' },
  { slug: 'jpn.1', name: 'J1 League', country: 'Japan', rating: 9 },
  { slug: 'qat.1', name: 'Qatar Stars League', country: 'Qatar' },
  { slug: 'uae.1', name: 'UAE Pro League', country: 'UAE' },
  { slug: 'ind.1', name: 'Indian Super League', country: 'India' },
  { slug: 'chn.1', name: 'Chinese Super League', country: 'China' },
  { slug: 'aus.1', name: 'A-League Men', country: 'Australia' },
  // Africa (Tunisian Ligue 1 has NO ESPN coverage — tun.1 returns 400)
  { slug: 'rsa.1', name: 'Premier Soccer League', country: 'South Africa' },
]

export type ResolvedEspnLeague = {
  slug: string
  /** Competition identity used by scoring/UI; curated id when mapped. */
  internalId: string
  name: string
  country?: string
  rating: number
}

const RESOLVED: Map<string, ResolvedEspnLeague> = (() => {
  const resolved = new Map<string, ResolvedEspnLeague>()
  for (const entry of ESPN_LEAGUES) {
    const curated = entry.internalId ? competitionByInternalId(entry.internalId) : undefined
    if (curated) {
      resolved.set(entry.slug, {
        slug: entry.slug,
        internalId: curated.internalId,
        name: curated.name,
        country: curated.country,
        rating: curated.rating,
      })
    } else {
      resolved.set(entry.slug, {
        slug: entry.slug,
        internalId: `espn:${entry.slug}`,
        name: entry.name ?? entry.slug,
        country: entry.country,
        rating: entry.rating ?? DEFAULT_COMPETITION_SCORE,
      })
    }
  }
  return resolved
})()

export function espnLeagueBySlug(slug: string): ResolvedEspnLeague | undefined {
  return RESOLVED.get(slug)
}
