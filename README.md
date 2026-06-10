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

## Design system — cinematic 60-30-10, Pantone

The UI follows the 60-30-10 color rule with Pantone colors. Every text/background pairing is verified against WCAG AA (≥ 4.5:1 for normal text):

| Role | Pantone | Hex | Share | Contrast on surface |
| --- | --- | --- | --- | --- |
| Dominant (page background) | Black 6 C | `#101820` | 60% | — |
| Secondary (cards, panels, table) | 433 C | `#1D252D` | 30% | — |
| Accent (KPIs, primary series, focus) | 3395 C | `#00C389` | 10% | 6.8:1 ✓ |
| Primary text | Cool Gray 1 C | `#D9D9D6` | — | 11.0:1 ✓ |
| Secondary text | Cool Gray 7 C | `#97999B` | — | 5.4:1 ✓ |
| Negative values | 178 C | `#FF585D` | — | 5.0:1 ✓ |
| Chart series 2 | 279 C | `#418FDE` | — | 4.6:1 ✓ |
| Chart series 3 | 1235 C | `#FFB81C` | — | 9.0:1 ✓ |
| Borders / grid lines (decorative) | 432 C | `#333F48` | — | n/a |

Pantone Warm Red C was considered for negatives but rejected (4.3:1, below AA); 178 C passes. Tokens are defined once in `app/globals.css` (`@theme`) and used as Tailwind classes (`bg-surface`, `text-ink`, `text-accent`, …).

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

## Data source & attribution

The data comes from the Kaggle dataset **[NFL scores and betting data](https://www.kaggle.com/datasets/tobycrabtree/nfl-scores-and-betting-data)** by Toby Crabtree (spreadspoke) — game results since 1966 with betting odds since the late 1970s, compiled from public sources (ESPN, NFL.com, Pro Football Reference) and updated during the season.

- `data/spreadspoke_scores.csv` — scores, spreads, over/under lines, stadium and weather
- `data/nfl_teams.csv` — franchise names, IDs, conferences and divisions

The CSVs remain subject to the dataset's license and terms as published on Kaggle. This project is not affiliated with or endorsed by the NFL.

## License

The source code is released under the [MIT License](LICENSE). The license covers the code only — see the data attribution above for the dataset's terms.
