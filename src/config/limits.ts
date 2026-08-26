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

/**
 * Agenda freshness windows (ADR: Option C staleness policy). Fresh
 * agendas revalidate every 3h — comfortably inside fd.org's ~10
 * requests/day budget since week-aligned ranges amortize across dates.
 * Empty agendas recheck after 10 minutes so provider outages and
 * mid-day fixture releases surface quickly.
 */
export const AGENDA_TTL_FRESH_MS = 3 * 60 * 60_000
export const AGENDA_TTL_EMPTY_MS = 10 * 60_000

/**
 * Live-window score policy. While any known kickoff sits inside its live
 * window, agendas revalidate on a short cadence so scores creep forward;
 * outside windows the fresh TTL applies. Windows are derived from the
 * already-cached kickoff times — knowing "a match is probably live now"
 * costs zero requests.
 */
export const AGENDA_TTL_LIVE_MS = 12 * 60_000
export const LIVE_WINDOW_BEFORE_MINUTES = 10
export const LIVE_WINDOW_AFTER_MINUTES = 165

/**
 * Self-imposed provider budgets — deliberately well under the real
 * ceilings (~1279/day observed for fd.org free tier, 100/day for
 * API-Football free plan) so drift, retries or bugs degrade gracefully
 * ("updates paused") instead of exhausting the tank and going dark.
 */
export const FOOTBALL_DATA_DAILY_BUDGET = 400
export const API_FOOTBALL_DAILY_BUDGET = 60

/** Burst throttle guard: max real calls per rolling minute per provider. */
export const PROVIDER_BURST_MAX_PER_MINUTE = 8
export const PROVIDER_BURST_WINDOW_MS = 60_000

/** Manual 🔄 refresh pacing: minimum spacing between forced reloads. */
export const MANUAL_REFRESH_COOLDOWN_MS = 60_000

/** Background revalidation tick (cache makes ticks free unless expired). */
export const REVALIDATE_TICK_MS = 60_000

/** Kickoff-drift tolerance for cross-provider deduplication. */
export const DEDUPLICATION_WINDOW_MINUTES = 15
