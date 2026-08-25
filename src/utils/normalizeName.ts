/**
 * Normalizes club names for dataset lookups:
 * lowercase → trim → strip diacritics → collapse whitespace →
 * drop common trailing club-suffixes ("Liverpool FC" ≙ "Liverpool").
 */
const TRAILING_SUFFIX = /\s+(fc|cf|sc|afc|bk)$/i

export function normalizeTeamName(name: string): string {
  let normalized = name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')

  // Repeatedly strip so "X FC SC"-style oddities collapse too.
  let previous: string | null = null
  while (previous !== normalized) {
    previous = normalized
    normalized = normalized.replace(TRAILING_SUFFIX, '').trim()
  }
  return normalized
}
