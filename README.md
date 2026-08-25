# TnFootPulse

> The football matches worth watching from Tunisia.

A smart football agenda: today's fixtures ranked 0–100 by a deterministic,
explainable priority score combining competition prestige, team quality,
match stakes, and how convenient the kickoff hour is for a viewer in
Tunisia. Full specification in [`SPEC.md`](./SPEC.md); work tracked on
[GitHub issues](https://github.com/Aymen-khlil/TnFootPulse/issues).

## Getting started

```bash
npm install
cp .env.example .env   # then paste both provider credentials
npm run dev            # http://localhost:5173
```

Other scripts:

```bash
npm test        # Vitest suite (scoring engine + provider pipeline)
npm run typecheck
npm run build   # typecheck + production build
```

## Providers

TnFootPulse combines **two football data providers** behind one normalized
layer; the scoring engine and UI never know which provider supplied a match.
Ownership is exclusive per competition (see `src/data/competitions.ts`):

| Provider | Competitions | Request strategy |
|---|---|---|
| football-data.org (free tier) | UCL, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Primeira, Eredivisie | One ranged request per 7-day window (`dateFrom/dateTo`) |
| API-Football direct (free plan) | **Tunisian Ligue 1**, Europa/Conference League, cups, CAF CL, Saudi Pro League | One request per date |

**Date windows differ by design.** football-data.org serves arbitrary future
ranges. The API-Football free plan empirically restricts future dates
(*"Free plans do not have access to this date…"*) — the app guards requests
with a conservative window constant and degrades the provider's contribution
gracefully when the API itself rejects a date, while football-data.org keeps
supplying fixtures independently.

Deduplication is provider-independent: composite identity of internal
competition + canonical team names with a ±15-minute kickoff tolerance.

## Provider credentials

- `VITE_FOOTBALL_DATA_API_TOKEN` — register at
  [football-data.org](https://www.football-data.org/client/register) (free tier).
- `VITE_API_FOOTBALL_KEY` — register at [api-football.com](https://www.api-football.com/)
  (direct channel, 100 requests/day).

Never hardcode credentials. **Local MVP only:** both tokens ship to the
browser frontend by design; before any public deployment they MUST move
behind a server-side/serverless proxy.

### CORS note

**Verified working directly (2026-08-25):** both providers answer browser
calls with `access-control-allow-origin: *` — API-Football whitelists
`x-apisports-key`, football-data.org whitelists `X-Auth-Token` — so no proxy
is needed for local development. Send **only** those single headers (extra
headers trigger preflight rejections). The prepared dev-server proxy block
in the Vite config stays as the seam for a future serverless proxy.
API-Football's free plan also enforces a per-minute limit of 10 requests
on top of the daily 100. See SPEC.md §17 for the verify-before-coding checklist.

## Architecture in one line

```text
football-data.org ──┐
                    ├→ normalize → merge/dedupe → pure scoring engine → UI
API-Football ───────┘   (same internal Match model from both providers)
```

The scoring engine accepts normalized matches and returns a full breakdown;
it is pure, deterministic, and tested without any network access. Football
facts (API), football knowledge (`src/data/`), and scoring (`src/scoring/`)
are three separately-owned layers that never mix.
