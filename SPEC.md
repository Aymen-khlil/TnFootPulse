# TnFootPulse — MVP Specification V2

> **The football matches worth watching from Tunisia.**
>
> V2 incorporates all nine grilling-round decisions (Aug 2026). Supersedes the V1 draft.
> Status: **awaiting approval — no implementation started.**

---

## 1. Product

A smart football agenda answering one question:

> **"What football matches are worth watching today from Tunisia?"**

Fixtures are fetched, converted to Tunisia time, scored 0–100 across four deterministic
dimensions (competition, teams, context, viewing time), ranked, grouped, and explained.
Not a news site, betting platform, or SofaScore clone.

### Core formula

```text
Competition (≤30) + Teams (≤25) + Context (≤25) + Tunisia time (≤20) = Priority ≤ 100
```

Deterministic, explainable, testable. The user can always see why a match scored what it did.

---

## 2. Decision Log (grilling round, applied)

| # | Decision |
|---|----------|
| Q1 | Direct API-Sports channel: `v3.football.api-sports.io`, header `x-apisports-key`, free plan 100 req/day. **No RapidAPI.** |
| Q2 | **One `/fixtures` request per date** (`timezone=Africa/Tunis`), client-side competition filtering, in-memory session cache. Initial load ≈ 2 requests. Never per-league requests. |
| Q3 | Direct browser calls first; **Vite dev-server proxy** is the approved CORS fallback (dev seam for a future serverless proxy). Local-only key exposure via `.env` accepted. |
| Q4 | "Today" = **calendar day in Africa/Tunis**. Show `NS` + live states; hide finished/postponed/cancelled/abandoned. Live matches get a LIVE badge + subtle pulse. |
| Q5 | Formula unchanged. All spec examples corrected to actual arithmetic. Do not bend math to fit desired outcomes. |
| Q6 | Team matching by **normalized name** (+ alias map, optional `apiId` field for future migration). Unknown-team fallback **30/100**, config constant. |
| Q7 | Curate ~60–80 teams incl. Espérance de Tunis, Club Africain, CS Sfaxien, Étoile du Sahel. Six rivalries incl. two Tunisian. |
| Q8 | English-only UI. Local-only deployment. No i18n/auth/db/backend/serverless in MVP. |
| Q9 | npm + **Vitest**, tests mirroring `src/scoring/`. |

---

## 3. Scope

**In:** Today's + tomorrow's matches (plus on-demand dates), free API integration, Tunisia timezone conversion, priority scoring/ranking/categories, competition + priority filters, match detail dialog with score breakdown, loading/empty/error states, responsive mobile/desktop UI, unit tests for the scoring engine.

**Out (MVP):** Auth, accounts, database, backend, serverless functions, betting, player stats, live commentary, news, fantasy, social, notifications, payments, AI-generated scores, i18n, polling, favorites, PWA.

---

## 4. Technology Stack

React · TypeScript · Vite · Tailwind CSS · shadcn/ui · Radix UI · Lucide icons · Vitest · npm

shadcn components installed selectively: `card`, `badge`, `button`, `tabs`, `select`, `dialog`, `separator`, `skeleton`, `progress`, `tooltip`.

---

## 5. Verified API Facts (checked Aug 2026)

Implementation must not contradict these. Re-verify at implementation start.

- Base URL: `https://v3.football.api-sports.io`
- Auth: header `x-apisports-key`. GET-only. Only whitelisted headers allowed — do not send `Content-Type` or RapidAPI headers.
- Free plan: **100 requests/day** (reset 00:00 UTC), all competitions included, recent seasons only.
- `GET /fixtures?date=YYYY-MM-DD&timezone=Africa/Tunis` → **all** fixtures for that date in one response, kickoffs pre-converted to Tunis time (ISO-8601 with offset + unix `timestamp`). No pagination on date queries.
- Fixture object provides: `fixture.id`, `fixture.date`, `fixture.timestamp`, `fixture.status.{short,long,elapsed}`, `league.{id,name,country,logo,season,round}`, `teams.home/away {id,name,logo,winner}`, `goals.{home,away}`.
- Status shorts: `TBD, NS, 1H, HT, 2H, ET, BT, P, SUSP, INT, LIVE, FT, AET, PEN, PST, CANC, ABD, AWD, WO`.
- Known caveat: some minor competitions only report final results late (status may stay `NS`); LIVE accuracy is best-effort for those.
- Standings endpoint exists (`GET /standings`) — **deferred**, but the context-score seam supports it later.

---

## 6. Architecture

```text
API-Football (v3.football.api-sports.io)
      ↓
services/footballApi.ts        ← fetch only: auth header, URL building, error mapping
      ↓
cache/fixturesCache.ts         ← date-keyed, promise-deduped, session lifetime
      ↓
normalize/normalizeFixture.ts  ← raw payload → internal Match model
      ↓
filter                         ← status visibility + competition allowlist
      ↓
scoring/calculatePriority.ts   ← pure functions over Match models, zero I/O
      ↓
hooks/useMatches.ts            ← orchestration: dates, loading/error, memoization
      ↓
React UI                       ← display only; NEVER calculates scores
```

Layer rules:

1. API integration isolated in `services/`; no React imports, no scoring logic.
2. Scoring engine pure and independent of React/API; accepts normalized `Match`, returns `PriorityResult`.
3. Configuration (competitions, teams, rivalries, time windows, thresholds) lives in `src/data/`, separate from scoring functions.
4. Football facts (API) ≠ football knowledge (`src/data/`) ≠ scoring (`src/scoring/`). Never mixed.
5. Timezone logic isolated in `utils/timezone.ts`. Never manually offset hours; always format through `Intl` with `timeZone: 'Africa/Tunis'`.
6. Single fetch point per app (`useMatches`) — components never fetch individually.

---

## 7. API Request & Cache Strategy

### Request shape

```text
GET /fixtures?date={YYYY-MM-DD}&timezone=Africa/Tunis
Authorization via x-apisports-key header (or Vite proxy rewrite)
```

### Flow

**Initial load**
1. Compute today's and tomorrow's date key in Africa/Tunis.
2. Fire both requests (parallel).
3. Cache both by date key → normalize → score → display today.

**Other dates** (on demand)
1. Cache hit → use it, zero requests.
2. Miss → one request → cache → normalize → score → display.

Browsing a full week ≈ 7 requests/day total. Quota headroom is large (100/day).

### Cache semantics

- In-memory `Map<dateKey, Promise<NormalizedMatch[]>>` — stores the **promise**, so concurrent callers share one in-flight request (dedupe).
- Session lifetime only: cleared on reload. Acceptable because agenda data is day-scoped and quota headroom is large.
- **No polling in MVP.** Consequence: LIVE badges/scores are snapshots from fetch time. Accepted limitation (see Risks).
- No persistent storage, no TTL invalidation in MVP.

### Error handling

- Network/HTTP errors map to a typed `FootballApiError` (message + cause); raw errors never reach the UI.
- UI shows: "Unable to load today's matches. Please try again." + Retry button (re-invokes fetch for the failed date; promise-map entry evicted on failure so retry actually refetches).

---

## 8. Internal Data Model

```ts
type MatchStatus =
  | 'scheduled'          // NS
  | 'live'               // 1H HT 2H ET BT P LIVE SUSP INT
  ;                      // everything else → filtered out before the model exists

type Team = {
  id: string;
  name: string;
  logo?: string;
  rating: number;        // injected from curated dataset; fallback if unknown
};

type Competition = {
  id: string;            // API league id (as string)
  name: string;
  country?: string;
  logo?: string;
  rating: number;        // 0–30 scale
};

type Match = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  competition: Competition;
  kickoff: Date;         // instant; Tunis wall-clock derived via utils/timezone
  tunisDateKey: string;  // 'YYYY-MM-DD' in Africa/Tunis — grouping key
  tunisMinuteOfDay: number; // 0–1439 — input to timeScore
  stage: StageKind;      // normalized from API league.round
  rawRound?: string;     // preserved for debugging/explanations
  status: MatchStatus;
  minuteElapsed?: number;
  score?: { home: number; away: number };
};

type StageKind =
  | 'final' | 'semi-final' | 'quarter-final'
  | 'knockout-round' | 'playoff'
  | 'group-phase' | 'league-match';

type PriorityResult = {
  total: number;                     // 0–100, integer, clamped
  competition: number;               // ≤30
  teams: number;                     // ≤25
  context: number;                   // ≤25
  tunisiaTime: number;               // ≤20
  category: PriorityCategory;
  reasons: string[];                 // reflect ACTUAL computed values
};
```

---

## 9. Configuration Data (`src/data/`)

### 9.1 Competitions — `competitions.ts`

Allowlist: fixtures whose `league.id` is **not** listed are dropped before scoring
(the fallback below covers allowlisted-but-unrated entries and future additions, not arbitrary world football).

| Competition | API league id | Score (/30) |
|---|---|---|
| UEFA Champions League | 2 | 30 |
| UEFA Europa League | 3 | 26 |
| Premier League | 39 | 25 |
| La Liga | 140 | 25 |
| Serie A | 135 | 24 |
| Bundesliga | 78 | 24 |
| Ligue 1 | 61 | 22 |
| Portuguese Primeira Liga | 94 | 19 |
| Eredivisie | 88 | 18 |
| Turkish Süper Lig | 203 | 17 |
| Saudi Pro League | 307 | 15 |
| Tunisian Ligue 1 | 202 | 14 |
| FA Cup | 45 | 12 |
| Copa del Rey | 143 | 12 |
| Coppa Italia | 137 | 12 |
| DFB-Pokal | 81 | 11 |
| CAF Champions League | 12 | 12 |
| **fallback constant** `DEFAULT_COMPETITION_SCORE` | — | 6 |

> League ids above are the commonly documented API-Football ids; **verify each id against a live response during implementation** and correct the table before wiring filters.

### 9.2 Teams — `teams.ts`

~60–80 entries. Anchor values (full list curated during implementation):

```ts
Real Madrid 100, Barcelona 99, Manchester City 97, Liverpool 96,
Bayern Munich 95, PSG 94, Arsenal 92, Inter 90, AC Milan 88,
Chelsea 87, Manchester United 86, Atlético Madrid 86, Juventus 86,
Napoli 85, Borussia Dortmund 85,
// Tunisian Ligue 1
Espérance de Tunis 46, Club Africain 42, Étoile du Sahel 41, CS Sfaxien 40

UNKNOWN_TEAM_RATING = 30   // config constant
```

Each entry: `{ name, aliases?: string[], apiId?: number, rating }`. `apiId` optional now — enables painless migration to ID-keyed lookup later. No bulk ID collection in MVP.

**Name normalization** (`normalizeTeamName`): lowercase → trim → Unicode NFD → strip combining marks (é→e) → collapse internal whitespace → lowercase-trimmed exact match against `name` + `aliases`.

Explicit aliases handle API naming variance, e.g.:
`"Paris Saint Germain" → PSG`, `"Esperance de Tunis" → Espérance de Tunis`,
`"Etoile du Sahel" → Étoile du Sahel`, `"Real Madrid CF" → Real Madrid`.

### 9.3 Rivalries — `rivalries.ts`

Single tier for MVP (`weight: 10`), schema allows future tiers (e.g. historic +8):

```ts
[
  ['Barcelona', 'Real Madrid'],
  ['Liverpool', 'Manchester United'],
  ['Arsenal', 'Tottenham'],
  ['Inter', 'AC Milan'],
  ['Espérance de Tunis', 'Club Africain'],      // Tunis derby
  ['Espérance de Tunis', 'Étoile du Sahel'],    // Tunisian Classico
]
```

Detection compares normalized names of home/away against each pair (either order).

### 9.4 Viewing-time windows — `timeWindows.ts`

Half-open intervals `[start, end)` on Tunis wall-clock minutes:

| Window (Tunis) | Score |
|---|---|
| 06:00–13:00 | 4 |
| 13:00–15:00 | 8 |
| 15:00–16:00 | 12 |
| 16:00–18:00 | 17 |
| **18:00–21:30** | **20** |
| 21:30–22:30 | 17 |
| 22:30–23:30 | 12 |
| 23:30–00:30 (wraps midnight) | 7 |
| 00:30–02:00 | 3 |
| 02:00–06:00 | 0 |

Because grouping is by Tunis calendar date, a 00:15 kickoff appears on that date and scores 7.

---

## 10. Scoring Algorithm (`src/scoring/`)

Pure functions. Deterministic. Integer outputs.

### 10.1 Competition — `competitionScore.ts` (≤30)

`score = competition.rating` (already on 0–30 scale). Clamp `[0, 30]`.

### 10.2 Teams — `teamScore.ts` (≤25)

```text
avgRating = (homeRating + awayRating) / 2
teamScore = round(avgRating / 100 × 25)      // Math.round, then clamp [0, 25]
```

Note: with rounding, a 100/99 pair yields `round(24.875) = 25` — elite pairs reach the cap; mediocre pairs don't.

### 10.3 Context — `contextScore.ts` (≤25)

Base by normalized stage:

| StageKind | Base |
|---|---|
| Final | 25 |
| Semi-final | 23 |
| Quarter-final | 20 |
| Knockout round | 18 |
| Playoff | 16 |
| Group phase | 8 |
| League match | 5 |

Bonuses (stacked, then capped):

| Condition | Bonus |
|---|---|
| Known rivalry pair | +10 |
| Title race / relegation / European-qualification battle | **not implemented in MVP** (standings deferred) — seam reserved |

```text
contextScore = min(base + bonuses, 25)
```

**Stage normalization** (`normalizeStage(rawRound)`): order-sensitive lowercase pattern matching on `league.round`:
1. contains `quarter` → quarter-final
2. contains `semi` → semi-final
3. equals/endswith `final` (after steps 1–2) → final
4. matches `round of 16` / `1/8` / `round of 32` / `1/16` → knockout-round
5. contains `play-off` / `playoff` → playoff
6. contains `group` → group-phase
7. contains `regular season` / `league phase` / `matchday` → league-match
8. **default → league-match** (conservative) + dev-mode console warning listing the unseen string

Real payloads will refine this table; the warning makes drift visible instead of silent.

### 10.4 Tunisia viewing time — `timeScore.ts` (≤20)

Lookup `tunisMinuteOfDay` against §9.4 table. Clamp `[0, 20]`.

### 10.5 Final — `calculatePriority.ts`

```text
priority = clamp(
  competitionScore + teamScore + contextScore + tunisiaTimeScore,
  0, 100
)
category = getPriorityCategory(priority)
reasons   = built ONLY from actually-applied rules/values
```

### 10.6 Categories — `priorityCategory.ts`

Inclusive ranges, reusable everywhere:

| Range | Category |
|---|---|
| 90–100 | 🔥 MUST WATCH |
| 80–89 | 🔴 HIGH PRIORITY |
| 70–79 | ⭐ WORTH WATCHING |
| 55–69 | 👀 IF YOU HAVE TIME |
| 0–54 | 💤 LOW PRIORITY |

Boundaries tested explicitly: 54/55, 69/70, 79/80, 89/90.

---

## 11. Corrected Worked Examples (authoritative arithmetic)

**E1a — El Clásico, Champions League *league phase*, Sat 20:00 Tunis**

```text
competition  CL                    +30
teams        (100+99)/2 → 24.875 → round → +25
context      group 8 + rivalry 10  +18
time         20:00                 +20
total                              93   🔥 MUST WATCH
```

**E1b — Same fixture as Champions League *Final*, 20:00 Tunis**

```text
30 + 25 + min(25+10, 25)=25 + 20 = 100   🔥 MUST WATCH
```

Only finals (or equivalent 25-base contexts) reach triple-digit territory. A group-stage Clásico does not automatically get 100.

**E1c — El Clásico, La Liga, 20:00 Tunis**

```text
25 + 25 + (5+10)=15 + 20 = 85   🔴 HIGH PRIORITY
```

**E2 — Liverpool vs Manchester City, Premier League, 17:30 Tunis** *(corrected — V1 claimed 85–95)*

```text
competition  PL                        +25
teams        (96+95)/2 → 23.875 → +24
context      league match, no bonus     +5
time         [16:00,18:00)             +17
total                                  71   ⭐ WORTH WATCHING
```

Consequence of deferring standings-based context: even a title-race clash stays ≤79 until that seam is filled (+8 would give 79). **Accepted for MVP** — flagged in Risks (#5).

**E3 — Champions League group phase, two unrated teams, 20:00 Tunis** *(corrected — V1 claimed 70–80)*

```text
30 + round(30×0.25)=8 + 8 + 20 = 66   👀 IF YOU HAVE TIME
```

Mid-rated CL squads (e.g. 55/55) score `30+14+8+20 = 72 ⭐`. The CL alone cannot carry unknown teams above ~70.

**E4 — Champions League semi-final, PSG vs Dortmund, 00:30 Tunis**

```text
30 + round(89.5×0.25)=22 + 23 + 3 = 78   ⭐ WORTH WATCHING
```

Football importance survives, poor Tunisia time drags it down — as intended.

**E5 — Tunis derby: Espérance vs Club Africain, Tunisian Ligue 1, 20:00 Tunis**

```text
14 + round(44×0.25)=11 + (5+10)=15 + 20 = 60   👀 IF YOU HAVE TIME
```

Structural ceiling for Tunisian league matches (~60s) given competition=14 and modest team ratings. Intentional weighting; revisit only if users signal otherwise (Risks #7).

---

## 12. Match Visibility & Status Rules

Whitelist approach — a fixture is shown iff `status.short ∈`:

```text
NS, 1H, HT, 2H, ET, BT, P, LIVE, SUSP, INT
```

Hidden: `FT, AET, PEN, PST, CANC, ABD, AWD, WO, TBD`.

Live states render a **LIVE** badge (+ elapsed minute when available) and the subtle pulse indicator. Filtering happens in `normalize/` (before scoring), isolated and unit-tested (test #15).

---

## 13. UI Specification

Unchanged from V1 in intent; deltas called out. Dark-first (`#09090B` / `#111113` / `#18181B` / `#27272A`), brand red `#E11D48` / pulse orange `#F97316` used sparingly, Inter, mobile-first, centered `max-width: 1280px` desktop, breakpoints 768/1024.

- **Header**: `⚽ TnFootPulse •(pulse dot)` left, `🇹🇳 Tunisia` right. Minimal.
- **Hero**: "Football Tonight" + Tunis weekday/date + "All times are Tunisia time" + `[Today][Tomorrow]` selector.
- **Filters**: priority Tabs (`All / 🔥 Must Watch / 🔴 High / ⭐ Worth / 👀 Maybe`) horizontally scrollable on mobile + competition Select (populated from allowlist present in that day's fixtures). No large filter panel.
- **Grouping**: by category, descending score within group; groups hidden when empty after filtering; distinct empty states for "no matches today" vs "no matches at this priority".
- **Featured card** for MUST WATCH: large layout, score prominent, reason chips (🏆 competition / ⚔️ rivalry / 🕗 time), "Why is this important? →".
- **Compact cards** elsewhere: two-column desktop grid, one-column mobile.
- **Detail dialog**: teams, time, competition, `N / 100` bar, four Progress bars (one per component with actual values), reason list. Reasons generated by the scoring engine, never re-derived in UI.
- **Live delta**: LIVE badge + pulsing dot on live cards; no continuous card animation otherwise.
- **Loading**: skeletons shaped like real cards. **Error**: friendly copy + Retry. **Empty**: per §filters above.
- Icons: Lucide only. Logo: football + pulse line, simple.

---

## 14. Testing Plan (Vitest, npm)

Scoring engine tested purely from constructed `Match` objects — zero network. Tests mirror source:

`calculatePriority.test.ts`, `competitionScore.test.ts`, `teamScore.test.ts`, `contextScore.test.ts`, `timeScore.test.ts`, `priorityCategory.test.ts`, plus `utils/timezone.test.ts` and `normalize/*.test.ts`.

Required cases:

1. CL + elite teams + prime time → high, exact-value assertion (E1a-style, 93-type outcome).
2. CL + unknown teams + prime time → 66-type outcome (E3).
3. PL rivalry pair + good time → rivalry bonus applied once, capped correctly.
4. Elite teams + 02:30 kickoff → time contributes 0.
5. Small league (Eredivisie) + prime time → mid score (E6: 18+19+5+20=62).
6. Final stage → context base 25.
7. Semi-final → 23.
8. Rivalry bonus: applied for all six pairs, both home/away orders, not for non-pairs.
9. Unknown-team fallback = 30 → teamScore 8 when paired with another unknown; averaged correctly vs rated opponent.
10. Unknown/unrated competition entry → `DEFAULT_COMPETITION_SCORE` 6.
11. Sum > 100 impossible (adversarial config) → clamped to 100.
12. Negative/adversarial inputs → clamped to ≥ 0.
13. Category boundaries: 54/55, 69/70, 79/80, 89/90.
14. Timezone: fixed instants (e.g. `2026-08-25T21:00:00Z`) → Tunis date key `2026-08-25`, minute-of-day 2200%… (=22:00); midnight-crossing kickoff assigned to correct Tunis date. Tests must not depend on machine TZ.
15. Status filtering: each API short maps to shown/hidden correctly; live set preserved.

---

## 15. File Manifest (planned)

```text
.env                          # VITE_API_FOOTBALL_KEY (gitignored)
.env.example                  # placeholder, committed
vite.config.ts                # react plugin; commented proxy block ready as CORS fallback
index.html
package.json
tsconfig.json
postcss.config.js / tailwind.config.ts (or CSS-first Tailwind config)

src/
├── main.tsx
├── App.tsx
├── index.css                          # Tailwind + design tokens
│
├── types/
│   └── football.ts                    # Match, Team, Competition, StageKind, PriorityResult, errors
│
├── services/
│   └── footballApi.ts                 # fetchFixturesByDate(dateKey): Promise<RawFixture[]>
│                                      # auth header, error mapping, zero scoring/React
├── cache/
│   └── fixturesCache.ts              # Map<dateKey, Promise<Match[]>>; dedupe + failure eviction
│
├── normalize/
│   ├── normalizeFixtures.ts           # raw[] → Match[] (inject ratings, stage, status, tz fields)
│   ├── statusMap.ts                   # API status short → internal status / visibility
│   └── normalizeStage.ts              # league.round → StageKind (+ dev warnings)
│
├── hooks/
│   └── useMatches.ts                  # date state, cache orchestration, loading/error/retry
│
├── scoring/
│   ├── calculatePriority.ts
│   ├── competitionScore.ts
│   ├── teamScore.ts
│   ├── contextScore.ts
│   ├── timeScore.ts
│   └── priorityCategory.ts
│
├── data/
│   ├── competitions.ts                # allowlist + ratings + DEFAULT_COMPETITION_SCORE
│   ├── teams.ts                       # ratings + aliases + UNKNOWN_TEAM_RATING
│   ├── rivalries.ts                   # six pairs, weighted schema
│   └── timeWindows.ts                 # Tunisia viewing-time bands
│
├── utils/
│   ├── timezone.ts                    # tunisDateKey, tunisMinuteOfDay, time label
│   ├── normalizeName.ts               # team-name normalization + alias resolution
│   └── format.ts                      # display formatting helpers
│
├── components/ui/                     # shadcn: card, badge, button, tabs, select, dialog,
│                                      #         separator, skeleton, progress, tooltip
├── components/
│   ├── Header.tsx
│   ├── DateSelector.tsx
│   ├── MatchFilters.tsx               # priority tabs + competition select
│   ├── MatchList.tsx                  # grouping + sorting container
│   ├── MatchCard.tsx                  # compact variant
│   ├── FeaturedMatchCard.tsx          # MUST-WATCH variant
│   ├── PriorityBadge.tsx
│   ├── PriorityBreakdown.tsx          # progress bars + reasons (dialog body)
│   ├── MatchDetailsDialog.tsx
│   ├── LiveBadge.tsx
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   └── MatchCardSkeleton.tsx
│
└── pages/
    └── Home.tsx
```

Deviations from V1 structure (justified): added `cache/`, `normalize/`, `hooks/`, `components/ui/`; split featured card out of `MatchCard`; `MatchList` owns grouping so `Home` stays thin.

---

## 16. Risks, Blockers & Assumptions

**Blockers (must clear before/at implementation start)**
1. **API key registration** — owner action; nothing can run without it.
2. **Empirical CORS check** — docs claim browser-direct works with strict header whitelist; unverified in practice. First runtime test: direct call from browser origin. Fallback (approved): Vite dev-server proxy. If neither works locally, stop and reassess.

**Risks / accepted limitations**
3. **Free-plan season restriction** — current season assumed included; verify with the first successful fixtures call (or `/status`).
4. **Live-data staleness** — no polling; live badges/scores are fetch-time snapshots until reload/manual retry.
5. **Big-fixture ceiling** — marquee league clashes (e.g. Liverpool–City) top out at 71 while standings context is deferred; even the reserved +8 wouldn't cross 80. Tuning lever: extend rivalries list or pull standings work forward — deliberately not done now.
6. **Low-profile CL fixtures** score ~66, below V1's stated 70–80 expectation. Accepted per Q5.
7. **Tunisian matches structurally capped near 60** due to competition/team weights. Intentional; revisit with user feedback.
8. **Stage-normalization drift** — real `league.round` strings may not match patterns; conservative default (league-match) + dev warning keeps failures visible, not silent.
9. **Name-matching fragility** — diacritics/alias gaps may misrate a club until its alias is added; mitigation: normalization warnings in dev mode when a lookup misses.
10. **Minor-competition status lag** — API docs note some small cups stay `NS` until result posting; LIVE badge unreliable there.
11. **Payload size** — busy Saturdays return hundreds of fixtures per single-date call; filtered client-side. Fine at MVP scale.
12. **Key exposure** — safe local-only; any future public deployment REQUIRES moving the key behind a proxy (documented seam).

**Assumptions**
13. League IDs in §9.1 match current API values (verify on first response; correct table if not).
14. Tunisia remains UTC+1 year-round; `Intl` with `Africa/Tunis` keeps us correct even if that changes.
15. One user, one browser, one session — cache coherence is trivial.

---

## 17. Verify-Before-Coding Checklist

Run immediately after scaffolding, with a real key:

- [ ] `GET /status` → confirms daily quota remaining.
- [ ] Direct browser call succeeds (else enable documented proxy path).
- [ ] `GET /fixtures?date=<today>&timezone=Africa/Tunis` → returns fixtures; kickoff ISO strings carry `+01:00`.
- [ ] Spot-check league ids for the §9.1 table against the response.
- [ ] Inspect `league.round` values across CL/cup/league fixtures → finalize `normalizeStage` patterns.
- [ ] Confirm Tunisian Ligue 1 fixtures appear with expected team names → seed aliases.

If any check contradicts this spec, **stop and flag** — do not silently invent workarounds.

---

## 18. Definition of Done

All V1 checkboxes, updated with:

- [ ] Direct API-Sports integration via `x-apisports-key`, ≤2 requests on initial load.
- [ ] Date-keyed promise cache; repeat date selections make zero requests.
- [ ] Status whitelist filtering (live shown w/ badge, finished hidden) unit-tested.
- [ ] Scoring engine passes the 15-case Vitest suite; examples E1a–E5 reproduce exactly.
- [ ] CORS path decided empirically (direct or documented proxy) and recorded in README.
- [ ] `.env.example` committed; `.env` gitignored; no hardcoded keys.
- [ ] No AI, no backend, no database, no auth, no i18n anywhere in the codebase.
