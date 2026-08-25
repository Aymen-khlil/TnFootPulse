# 0002 — Club pedigree floors

Date: 2026-08-25
Status: Accepted
Supersedes: SPEC.md §11 worked examples E1c, E2, E4, E5 (totals only)
Context docs: CONTEXT.md ("Club Pedigree Floor", "UEFA Ranked Club", "Tunisian Elite Club", "Pedigree Top-Up")

## Context

The Pulse Score is a pure function of four components (competition, team
importance, context, Tunisia viewing time). That purity produced honest but
occasionally counter-intuitive verdicts for a Tunisia-first audience:

- Elite-vs-elite league games could land below marquee thresholds purely on
  viewing time (Liverpool–Manchester City at 17:30 scored 71).
- The Tunis derby — the biggest fixture in the app's home market — scored 60,
  "If You Have Time", which reads as an insult to the core audience.
- Meanwhile the original spec explicitly rejected "big competition = big
  score"; that principle stays. What changed is the introduction of a
 *club-level* (not competition-level) minimum.

## Decision

Introduce **club pedigree floors**: a minimum total Pulse Score for matches
involving clubs with proven standing, enforced as a fifth scoring component —
the **pedigree top-up** — so components plus top-up always sum to the total
and the Intelligence Report shows exactly why a score was lifted.

Two independent floor systems, combined best-floor-wins:

| System | Trigger | Floor |
|---|---|---|
| UEFA top-20 (five-year sporting coefficient, curated per season from kassiesa.net) | BOTH teams ranked | rank 1–10 → 90 · rank 11–15 → 80 · rank 16–20 → 70 |
| Tunisian elite (EST, Club Africain, Étoile du Sahel, CS Sfaxien — fixed list) | ONE team elite → 70; BOTH elite → 80 |

Rules binding both systems:

- **Competitive matches only** — no floor fires when the competition name
  indicates a friendly.
- **No permanent rating boost** — unranked-vs-ranked matches are scored by the
  four base components alone; the engine already rewards big clubs there.
- **Best-floor-wins** across systems/tiers (e.g. Bayern vs Benfica floors at
  90 via Bayern's rank 1).
- Floors never lower a score; when the base sum already meets the floor the
  pedigree component is 0 and invisible.

## Consequences

Positive:

- Elite clashes and Tunisian flagship fixtures can no longer fall below their
  promised bands regardless of kickoff time or stage.
- Explainability preserved: the fifth row appears only when it fired, labeled
  "UEFA pedigree — <club> (rank N)" or "Tunisian elite pedigree".
- Curated lists are season-scoped and auditable; updating them once per season
  is a data edit, not a logic change.

Negative / accepted costs:

- Worked-example totals changed: E1c 85→90, E2 71→90, E4 78→90, E5 60→80.
  Four fixtures crossing the 90 boundary now read MUST WATCH; some inflation
  of the top band is an intended trade-off of guaranteeing floors.
- The ranking list goes stale within a season; staleness is bounded by the
  season label (`UEFA_RANKING_SEASON`) rather than solved.
- `PriorityResult` gained a required `pedigree` field — a one-time type ripple
  across UI consumers.
