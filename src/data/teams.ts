import { normalizeTeamName } from '@/utils/normalizeName'

/**
 * Football knowledge: application-owned team ratings (0–100).
 * ~60–80 curated clubs covering CL regulars, the priority leagues,
 * Saudi clubs and major Tunisian sides. Unknown teams fall back to
 * UNKNOWN_TEAM_RATING. apiId is optional — enables migration to
 * ID-keyed matching later without bulk collection now.
 */

export const UNKNOWN_TEAM_RATING = 30

export type TeamConfig = {
  name: string
  aliases?: string[]
  apiId?: number
  rating: number
}

export const TEAM_CONFIGS: TeamConfig[] = [
  // Premier League
  { name: 'Manchester City', aliases: ['Man City'], apiId: 50, rating: 97 },
  { name: 'Liverpool', apiId: 40, rating: 96 },
  { name: 'Arsenal', apiId: 42, rating: 92 },
  { name: 'Chelsea', apiId: 49, rating: 87 },
  { name: 'Manchester United', aliases: ['Man United', 'Manchester Utd'], apiId: 33, rating: 86 },
  { name: 'Tottenham', aliases: ['Tottenham Hotspur'], apiId: 47, rating: 84 },
  { name: 'Newcastle United', aliases: ['Newcastle'], rating: 79 },
  { name: 'Aston Villa', rating: 78 },
  { name: 'Brighton', aliases: ['Brighton & Hove Albion', 'Brighton and Hove Albion'], rating: 74 },
  { name: 'West Ham', aliases: ['West Ham United'], rating: 72 },
  { name: 'Nottingham Forest', rating: 70 },
  { name: 'Crystal Palace', rating: 69 },
  { name: 'Everton', rating: 68 },
  { name: 'Fulham', rating: 67 },
  { name: 'Brentford', rating: 66 },
  { name: 'Bournemouth', aliases: ['AFC Bournemouth'], rating: 65 },
  { name: 'Wolves', aliases: ['Wolverhampton Wanderers'], rating: 64 },

  // La Liga
  { name: 'Real Madrid', apiId: 541, rating: 100 },
  { name: 'Barcelona', aliases: ['FC Barcelona'], apiId: 529, rating: 99 },
  { name: 'Atlético Madrid', aliases: ['Atletico Madrid', 'Club Atlético de Madrid'], rating: 86 },
  { name: 'Sevilla', rating: 78 },
  { name: 'Athletic Club', aliases: ['Athletic Bilbao'], rating: 76 },
  { name: 'Real Sociedad', aliases: ['Real Sociedad de Fútbol'], rating: 75 },
  { name: 'Villarreal', rating: 74 },
  { name: 'Real Betis', aliases: ['Real Betis Balompié'], rating: 73 },
  { name: 'Valencia', rating: 71 },
  { name: 'Girona', rating: 70 },

  // Serie A
  { name: 'Inter', aliases: ['Inter Milan', 'Internazionale', 'FC Internazionale Milano'], rating: 90 },
  { name: 'AC Milan', aliases: ['Milan'], rating: 88 },
  { name: 'Juventus', rating: 86 },
  { name: 'Napoli', aliases: ['SSC Napoli'], rating: 85 },
  { name: 'Atalanta', aliases: ['Atalanta BC'], rating: 80 },
  { name: 'Roma', aliases: ['AS Roma'], rating: 80 },
  { name: 'Lazio', aliases: ['SS Lazio'], rating: 79 },
  { name: 'Fiorentina', aliases: ['ACF Fiorentina'], rating: 75 },
  { name: 'Bologna', aliases: ['Bologna FC 1909'], rating: 72 },

  // Bundesliga
  { name: 'Bayern Munich', aliases: ['Bayern', 'FC Bayern München', 'Bayern Munchen'], rating: 95 },
  { name: 'Borussia Dortmund', aliases: ['Dortmund', 'BVB'], rating: 85 },
  { name: 'Bayer Leverkusen', aliases: ['Leverkusen', 'Bayer 04 Leverkusen'], rating: 84 },
  { name: 'RB Leipzig', aliases: ['RasenBallsport Leipzig'], rating: 82 },
  { name: 'Eintracht Frankfurt', rating: 76 },
  { name: 'VfB Stuttgart', aliases: ['Stuttgart'], rating: 74 },

  // Ligue 1
  { name: 'PSG', aliases: ['Paris Saint Germain', 'Paris Saint-Germain', 'Paris SG'], rating: 94 },
  { name: 'Monaco', aliases: ['AS Monaco'], rating: 78 },
  { name: 'Marseille', aliases: ['Olympique de Marseille'], rating: 77 },
  { name: 'Lyon', aliases: ['Olympique Lyonnais'], rating: 75 },
  { name: 'Lille', aliases: ['LOSC Lille', 'Lille OSC'], rating: 73 },
  { name: 'Nice', aliases: ['OGC Nice'], rating: 71 },

  // Portugal
  { name: 'Benfica', aliases: ['SL Benfica', 'Sport Lisboa e Benfica'], rating: 81 },
  { name: 'Porto', aliases: ['FC Porto'], rating: 81 },
  { name: 'Sporting CP', aliases: ['Sporting Lisbon', 'Sporting Clube de Portugal'], rating: 80 },

  // Netherlands
  { name: 'PSV', aliases: ['PSV Eindhoven'], rating: 77 },
  { name: 'Ajax', aliases: ['AFC Ajax'], rating: 76 },
  { name: 'Feyenoord', aliases: ['Feyenoord Rotterdam'], rating: 75 },
  { name: 'AZ Alkmaar', aliases: ['AZ'], rating: 70 },

  // Turkey
  { name: 'Galatasaray', rating: 76 },
  { name: 'Fenerbahçe', aliases: ['Fenerbahce'], rating: 76 },
  { name: 'Beşiktaş', aliases: ['Besiktas'], rating: 73 },
  { name: 'Trabzonspor', rating: 69 },

  // Saudi Pro League
  { name: 'Al Hilal', rating: 74 },
  { name: 'Al Nassr', rating: 73 },
  { name: 'Al Ittihad', rating: 71 },
  { name: 'Al Ahli', rating: 70 },

  // Tunisia — Ligue 1
  { name: 'Espérance de Tunis', aliases: ['Esperance de Tunis', 'Esperance Sportive de Tunis'], rating: 46 },
  { name: 'Club Africain', rating: 42 },
  { name: 'Étoile du Sahel', aliases: ['Etoile du Sahel', 'Etoile Sportive du Sahel'], rating: 41 },
  { name: 'CS Sfaxien', aliases: ['Sfaxien'], rating: 40 },
  { name: 'Stade Tunisien', rating: 32 },

  // European regulars
  { name: 'Celtic', rating: 72 },
  { name: 'Rangers', rating: 69 },
  { name: 'Club Brugge', aliases: ['Club Brugge KV'], rating: 72 },
  { name: 'Olympiacos', aliases: ['Olympiakos'], rating: 72 },
  { name: 'Red Bull Salzburg', aliases: ['RB Salzburg'], rating: 72 },
  { name: 'Shakhtar Donetsk', rating: 70 },
  { name: 'Union Saint-Gilloise', aliases: ['Union SG', 'Union Saint Gilloise'], rating: 71 },
  { name: 'Dinamo Zagreb', rating: 69 },
]

const RATING_BY_NORMALIZED_NAME = new Map<string, number>()
for (const config of TEAM_CONFIGS) {
  const canonical = normalizeTeamName(config.name)
  RATING_BY_NORMALIZED_NAME.set(canonical, config.rating)
  for (const alias of config.aliases ?? []) {
    const normalizedAlias = normalizeTeamName(alias)
    if (!RATING_BY_NORMALIZED_NAME.has(normalizedAlias)) {
      RATING_BY_NORMALIZED_NAME.set(normalizedAlias, config.rating)
    }
  }
}

const WARNED_UNKNOWN_NAMES = new Set<string>()

/** Curated rating for any team name; unknown clubs get UNKNOWN_TEAM_RATING. */
export function teamRatingByName(name: string): number {
  const rating = RATING_BY_NORMALIZED_NAME.get(normalizeTeamName(name))
  if (rating === undefined) {
    warnUnresolvedTeamName(name)
    return UNKNOWN_TEAM_RATING
  }
  return rating
}

/**
 * Silent fallback hides scoring degradation; surface it in dev so alias
 * gaps (like football-data.org's official long names) become visible.
 * Deduplicated per distinct name to keep the console readable.
 */
function warnUnresolvedTeamName(name: string): void {
  if (!import.meta.env.DEV) return
  if (WARNED_UNKNOWN_NAMES.has(name)) return
  WARNED_UNKNOWN_NAMES.add(name)
  console.warn(`[teams] No curated rating for "${name}" — using UNKNOWN_TEAM_RATING (${UNKNOWN_TEAM_RATING}). Add an alias in src/data/teams.ts if this club should resolve.`)
}

const CANONICAL_BY_NORMALIZED_NAME = new Map<string, string>()
for (const config of TEAM_CONFIGS) {
  const canonical = normalizeTeamName(config.name)
  if (!CANONICAL_BY_NORMALIZED_NAME.has(canonical)) {
    CANONICAL_BY_NORMALIZED_NAME.set(canonical, config.name)
  }
  for (const alias of config.aliases ?? []) {
    const normalizedAlias = normalizeTeamName(alias)
    if (!CANONICAL_BY_NORMALIZED_NAME.has(normalizedAlias)) {
      CANONICAL_BY_NORMALIZED_NAME.set(normalizedAlias, config.name)
    }
  }
}

/** Canonical dataset name for any known name/alias; unchanged when unknown. */
export function canonicalTeamName(name: string): string {
  return CANONICAL_BY_NORMALIZED_NAME.get(normalizeTeamName(name)) ?? name
}
