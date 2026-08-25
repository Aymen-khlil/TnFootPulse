/**
 * Provider capability limits. The two providers intentionally differ.
 *
 * football-data.org (free tier): supports arbitrary date ranges via
 * dateFrom/dateTo — we anchor a rolling week on the selected date.
 *
 * API-Football (free plan): empirically RESTRICTS future dates
 * ("Free plans do not have access to this date, try from ...").
 * The constant below is a conservative local guard so we do not waste
 * quota on requests that will be rejected; it does NOT represent a
 * guaranteed availability window. The authoritative signal is the
 * API's own rejection, which the transport detects and converts into a
 * graceful "no matches for this provider/date" outcome.
 */

export const FOOTBALL_DATA_RANGE_DAYS = 7

/** Conservative guard only — see above. Tunable, not a promise. */
export const API_FOOTBALL_MAX_DAYS_AHEAD = 1

/** Kickoff-drift tolerance for cross-provider deduplication. */
export const DEDUPLICATION_WINDOW_MINUTES = 15
