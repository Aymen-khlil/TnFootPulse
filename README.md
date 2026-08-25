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
cp .env.example .env   # then paste your API-Sports key into VITE_API_FOOTBALL_KEY
npm run dev            # http://localhost:5173
```

Other scripts:

```bash
npm test        # Vitest suite (scoring engine + data pipeline)
npm run typecheck
npm run build   # typecheck + production build
```

## API key

- Register for the free plan at [api-football.com](https://www.api-football.com/)
  (direct channel, 100 requests/day).
- Put the key in `.env` as `VITE_API_FOOTBALL_KEY`. Never hardcode it.
- **Local MVP only:** the key ships to the browser frontend by design.
  Before any public deployment it must move behind a server-side/serverless proxy.

### CORS note

**Verified working directly (2026-08-25):** the API answers browser
preflights with `access-control-allow-origin: *` and whitelists
`x-apisports-key`, so no proxy is needed for local development — the app
calls `https://v3.football.api-sports.io` straight from the browser,
sending **only** that single header (anything else triggers preflight
rejections). The prepared dev-server proxy block in the Vite config stays
as the seam for a future serverless proxy at public-deployment time.
Free plan also enforces a per-minute limit of 10 requests (`x-ratelimit-limit`)
on top of the daily 100 — well above this app's ~2 requests per load.
See SPEC.md §17 for the verify-before-coding checklist.

## Architecture in one line

```text
API-Football → transport → date cache → normalize/filter → pure scoring engine → hook → React UI
```

The scoring engine accepts normalized matches and returns a full breakdown;
it is pure, deterministic, and tested without any network access. Football
facts (API), football knowledge (`src/data/`), and scoring (`src/scoring/`)
are three separately-owned layers that never mix.
