/**
 * Normalizes club names for dataset lookups: lowercase, trimmed,
 * diacritics stripped, whitespace collapsed.
 */
export function normalizeTeamName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
}
