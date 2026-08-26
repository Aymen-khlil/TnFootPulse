# 0003 — ESPN as an Experimental Source Mode beside the curated pipeline

Date: 2026-08-26
Status: Accepted

## Context

TnFootPulse's agenda comes from a curated two-provider pipeline:
football-data.org (primary, week-range) and API-Football (exclusives +
backup fill), guarded by budget pacers because both free tiers are
scarce (≈1,279 calls/day and 100 calls/day respectively). fd.org's free
tier also delays live scores, and API-Football quota is too tight to
poll during matches.

A third data source surfaced: ESPN's undocumented site API
(`site.api.espn.com/.../soccer/<slug>/scoreboard`). It is public,
browser-accessible, needs no key, serves near-real-time statuses
(state pre/in/post with minute clocks), and covers leagues across
Europe, the Americas, Asia and Africa — but it is unofficial,
undocumented, client-filtered (shell clients receive 403), and can
change or vanish at any time. Tunisia has no coverage there at all
(`tun.1` → 400).

## Decision

ESPN is integrated as an **exclusive second Source Mode**, never as a
third provider inside the curated pipeline:

1. **Toggle-gated lane.** A header switch selects Curated or ESPN Mode.
   The choice is session-only; the app always boots in Curated Mode.
2. **No merging.** ESPN results are cached, persisted and rendered in
   their own namespace. A bad ESPN response can never contaminate the
   curated agenda.
3. **Identical scoring engine.** ESPN events normalize into internal
   Matches and flow through `calculatePriority`. Slugs that map onto
   curated competitions reuse their internalId/rating so scores match
   across modes; world-only leagues score honestly at default weights.
4. **Same product rules.** Only the selected Tunisian calendar day
   renders; finished matches stay hidden (SPEC §12); the shared
   live-window TTL policy governs freshness in both modes.
5. **Loud failure.** When the whole ESPN feed fails, ESPN Mode shows an
   honest error with a one-click return to Curated Mode — no silent
   fallback, no truth-swapping.
6. **No budget pacer on ESPN.** There is no shared quota to protect;
   request volume is inherently bounded by manifest size × visited
   dates, and caches keep repeats free.

### Scope: per-league endpoints, not the `all` endpoint

The consolidated `soccer/all/scoreboard` endpoint was evaluated and
rejected. Evidence from live probes (2026-08-26):

- Events carry no machine-readable competition key; the root `leagues`
  array is an empty stub. Attribution would require maintaining our own
  numeric league-id table against an unstable unofficial API.
- Payloads run ~872KB–1MB+ per day versus tens of KB per league.
- Content skews to minor competitions (regional cups, preliminary
  qualifying rounds, friendlies) — noise relative to the product.

Per-league slugs make attribution implicit and stable by construction,
keep payloads small, and let one broken slug drop out without touching
the rest.

## Consequences

- The experiment cannot degrade the curated pipeline: separate cache
  namespaces (`agenda:` vs `espn-agenda:`), separate persistence keys
  (`tfp:agenda:v2:<mode>:<date>`), separate failure UI.
- Coverage asymmetry is intentional and user-visible: ESPN Mode sees
  ~30 competitions across four confederations but zero Tunisian
  football; Curated Mode remains Tunisia-first.
- Tomorrow warm-up prefetching runs in Curated Mode only, keeping the
  experimental lane strictly on-demand.
- If ESPN's client filtering ever blocks direct browser calls (CORS),
  the fallback is routing through the existing Vite dev proxy pattern;
  production deployment would need its own proxy for parity.
- Because the source is unofficial, shape drift may break normalization
  at any time; per-league failure isolation bounds the blast radius to
  notices rather than outages.
