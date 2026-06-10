# F1 Analytics Dashboard

Interactive Formula 1 analytics dashboard built with **Next.js**, **Tailwind CSS** and **Recharts**, covering every World Championship race from 1950 to the present — 1,125 Grands Prix, 27,000+ race entries, with qualifying, reliability and pit stop data.

## KPIs

The metrics F1 performance analysts actually track, in two modes:

**League view (no driver/constructor selected)**

| KPI | Why it matters |
| --- | --- |
| **Unique winners** | Competitiveness of an era — few winners means dominance |
| **DNF rate** (mechanical vs incident) | The engineering story: ~40% attrition in the 1950s, single digits today |
| **Pole → win conversion** | How much qualifying decides the race vs overtaking |
| **Avg pit-lane time** | Operations benchmark (2011+), red-flag outliers excluded |
| **Finishers per race** | Attrition in one number |

**Entity view (driver or constructor selected)**

| KPI | Why it matters |
| --- | --- |
| **Wins / win rate** | The headline metric — all-time greats sit above 20% |
| **Podiums / podium rate + poles** | Consistency that wins championships, plus one-lap pace |
| **Points per race** | Fairest cross-era comparison (calendars grew from 7 to 24 races) |
| **Avg positions gained** | Race craft: grid slot vs classified finish |
| **DNF rate** (mechanical vs incident) | Reliability vs crash-proneness |

Charts: points by season (career arcs), reliability & attrition trend, grid slot → average finish, finishing-position distribution, pit stop performance by season, and a sortable championship table with a Drivers/Constructors toggle (entries, wins, podiums, poles, points, pts/race, avg finish, DNF %).

## Filters

Season range (1950→present) · session (GP / sprint) · driver · constructor · driver nationality · circuit · circuit country · result status (finished / mechanical DNF / incident DNF / disqualified) · grid position bucket (pole, front row, top 10, P11+, pit-lane start).

All filtering and aggregation happen client-side over a compact ~1.3 MB JSON payload, so every interaction is instant.

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
npm run build:data   # data/*.csv -> public/data/f1.json
npm run dev          # http://localhost:3000
```

`npm run build` regenerates the data payload automatically via the `prebuild` hook.

### Data pipeline

`scripts/build-data.mjs` joins the 14 Ergast-schema CSVs in `data/` into one flat result-level table:

- `results.csv` + `sprint_results.csv` — the core rows (one per car per race)
- `races.csv`, `drivers.csv`, `constructors.csv`, `circuits.csv`, `status.csv` — dimensions
- `qualifying.csv` — qualifying classification (poles; from 1994)
- `pit_stops.csv` — folded into per-entry stop count and average pit-lane time (from 2011; stops > 60 s excluded as red-flag outliers)
- `lap_times.csv` (589k rows, 17 MB) — pre-aggregated at build time into laps-led per entry, so it never ships to the browser
- DNF statuses are classified into finished / mechanical / incident / disqualified / other

To refresh with new seasons, replace the CSVs in `data/` and rebuild.

## Deploying to a subdomain

1. **Vercel**: import this repo — it auto-detects Next.js; `prebuild` generates the data payload during the build. No env vars needed.
2. **DNS (Cloudflare)**: add a `CNAME` record for your subdomain (e.g. `f1`) pointing to `cname.vercel-dns.com`, and add the same domain under the Vercel project's *Settings → Domains*. Keep the Cloudflare proxy on if you want Zero Trust in front.
3. **Access control (optional)**: add a Cloudflare Zero Trust Access application for the subdomain to gate the dashboard behind email login.

## Notes on the data

- Qualifying data begins in 1994; poles for earlier seasons fall back to grid P1.
- Pit stop data begins in 2011 and measures pit-lane time (entry to exit), not stationary time.
- Laps-led and pit metrics cover Grands Prix only (not sprints).
- The 1950–1960 Indianapolis 500 races are part of the historical World Championship and are included.
- Points follow the scoring system of each season — use Pts/Race within an era for fair comparisons.

## Data source & attribution

The data comes from the Kaggle dataset **[Formula 1 World Championship (1950–2024)](https://www.kaggle.com/datasets/rohanrao/formula-1-world-championship-1950-2020)** by Rohan Rao (vopani), itself sourced from the **[Ergast Developer API](http://ergast.com/mrd/)**. The CSVs remain subject to the dataset's license and terms as published on Kaggle. This project is unofficial and is not associated in any way with the Formula 1 companies. F1 and related marks are trademarks of Formula One Licensing B.V.

## License

The source code is released under the [MIT License](LICENSE). The license covers the code only — see the data attribution above for the dataset's terms.
