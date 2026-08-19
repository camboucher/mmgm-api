# mmgm-api

Backend for [Monday Morning GM](https://github.com/camboucher/monday-morning-gm) — pulls a fantasy football league's season history from the [Sleeper API](https://docs.sleeper.com/) and turns it into the per-team stats that power the frontend's "Wrapped" insight cards (best drafter, best decision maker, and more).

## What it does

Given a Sleeper league ID, it walks that league's rosters, draft, and week-by-week transactions/matchups, then attributes each team's points back to how they were acquired — drafted, traded for, or picked up off waivers. That breakdown is what turns into insights like "78% of your points came from your draft picks."

## API

```
GET /leagues/:leagueId
```

Returns a season analysis for every roster in the league.

```json
{
  "leagueAnalysis": { ... }
}
```

## Stack

Node.js + Express, TypeScript for local dev (`ts-node-dev`), no database — all league data is fetched live from Sleeper on each request.

## Local development

```bash
yarn install
yarn dev
```

Runs on `http://localhost:3000` by default. Configure via a `.env` file (gitignored):

```
PORT=3000
FRONTEND_URL=http://localhost:5173
```

## Related

- [monday-morning-gm](https://github.com/camboucher/monday-morning-gm) — the frontend that consumes this API
