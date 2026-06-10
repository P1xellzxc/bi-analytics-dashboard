# NFL Analytics Dashboard

Interactive sports analytics dashboard built with **Next.js**, **Tailwind CSS** and **Recharts**, covering every NFL game from 1966 to the present (~14,400 games) with Vegas point spreads, over/under lines and game-time weather.

## KPIs

The dashboard tracks the metrics standard in sports/betting analytics:

| KPI | Why it matters |
| --- | --- |
| **Home win %** | Quantifies home-field advantage (ties count half, neutral sites excluded) |
| **Favorite ATS cover %** | The core betting KPI — how often the favorite beats the spread (pushes excluded). Above 52.4% beats the standard −110 vig |
| **Over hit %** | How often the combined score beats the over/under line |
| **Favorite SU win %** | How often the favorite wins straight up |
| **Avg points / game** | League scoring environment (combined points) |
| **Avg victory margin** | Game competitiveness |
| **Team win % / record** | Shown when a single team is selected |

Charts: scoring trend by season, home-field advantage by season, betting market efficiency (ATS & over rates vs the 50% line), total-points distribution, weather impact on scoring, and a sortable franchise table (W-L-T, Win %, PF/G, PA/G, ATS %, Over %).

## Filters

Season range · game type (regular / playoffs) · week (incl. playoff rounds) · conference · division · team · venue (home stadium / neutral site) · weather (outdoor, indoor/dome, rain, snow, fog).

All filtering and aggregation happen client-side over a compact ~580 KB JSON payload, so every interaction is instant.

## Development

```bash
npm install
npm run build:data   # data/*.csv -> public/data/games.json
npm run dev          # http://localhost:3000
```

`npm run build` regenerates the data payload automatically via the `prebuild` hook.

### Data pipeline

- `data/nfl_teams.csv` — franchise metadata (historical names are merged into the current franchise, e.g. Oakland Raiders → Las Vegas Raiders)
- `data/spreadspoke_scores.csv` — game results, spreads, totals, weather
- `scripts/build-data.mjs` — converts both CSVs into the compact tuple format in `public/data/games.json`

To refresh with new seasons, replace the CSV in `data/` and rebuild.

## Deploying to a subdomain

1. **Vercel**: import this repo — it auto-detects Next.js; `prebuild` generates the data payload during the build. No env vars needed.
2. **DNS (Cloudflare)**: add a `CNAME` record for your subdomain (e.g. `nfl`) pointing to `cname.vercel-dns.com`, and add the same domain under the Vercel project's *Settings → Domains*. Keep the Cloudflare proxy on if you want Zero Trust in front.
3. **Access control (optional)**: add a Cloudflare Zero Trust Access application for the subdomain to gate the dashboard behind email login.

## Notes on the data

- Spread coverage starts in the late 1960s and over/under lines in the late 1970s; rates show "—" where no line exists.
- Weather is missing for ~10% of games; the weather filter's "Unknown" bucket holds those.
- ATS pushes and over/under pushes are excluded from cover/over rates (industry convention).
