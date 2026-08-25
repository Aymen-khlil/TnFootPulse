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

The transport calls `https://v3.football.api-sports.io` directly from the
browser, sending **only** the `x-apisports-key` header (the API rejects
preflights carrying anything else). If direct calls fail empirically, enable
the prepared dev-server proxy block in the Vite config and point the service's
base URL at `/football-api` — the same seam a future serverless proxy would
occupy. See SPEC.md §17 for the verify-before-coding checklist.

## Architecture in one line

```text
API-Football → transport → date cache → normalize/filter → pure scoring engine → hook → React UI
```

The scoring engine accepts normalized matches and returns a full breakdown;
it is pure, deterministic, and tested without any network access. Football
facts (API), football knowledge (`src/data/`), and scoring (`src/scoring/`)
are three separately-owned layers that never mix.
