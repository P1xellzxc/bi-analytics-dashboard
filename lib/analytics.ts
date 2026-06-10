import { Dataset, Filters, G, GameRow, Team } from "./types";

const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : null);
const avg = (sum: number, d: number) => (d > 0 ? sum / d : null);

export function applyFilters(data: Dataset, f: Filters): GameRow[] {
  const teamMatchesScope = (idx: number) => {
    const t = data.teams[idx];
    if (f.conference !== "all" && t.conference !== f.conference) return false;
    if (f.division && t.division !== f.division) return false;
    return true;
  };
  return data.games.filter((g) => {
    if (g[G.season] < f.seasonFrom || g[G.season] > f.seasonTo) return false;
    const isPlayoff = g[G.week] >= 19;
    if (f.gameType === "regular" && isPlayoff) return false;
    if (f.gameType === "playoffs" && !isPlayoff) return false;
    if (f.week !== null && g[G.week] !== f.week) return false;
    if (f.team !== null) {
      if (g[G.home] !== f.team && g[G.away] !== f.team) return false;
    } else if (f.conference !== "all" || f.division) {
      if (!teamMatchesScope(g[G.home]) && !teamMatchesScope(g[G.away])) return false;
    }
    if (f.venue === "stadium" && g[G.neutral] === 1) return false;
    if (f.venue === "neutral" && g[G.neutral] === 0) return false;
    if (f.weather !== null && g[G.weather] !== f.weather) return false;
    return true;
  });
}

export interface Kpis {
  games: number;
  avgTotalPoints: number | null;
  avgMargin: number | null;
  homeWinPct: number | null; // ties count as half, neutral-site games excluded
  favoriteSuPct: number | null;
  favoriteAtsPct: number | null;
  overPct: number | null;
  avgSpread: number | null;
  avgOuLine: number | null;
  // populated only when a single team is selected
  teamWinPct: number | null;
  teamRecord: string | null;
}

/** ATS result from the favorite's perspective: 1 cover, 0 push, -1 fail; null if no line. */
function favoriteAtsResult(g: GameRow): number | null {
  const fav = g[G.fav];
  const spread = g[G.spread];
  if (spread === null || fav === -1) return null;
  const margin =
    fav === g[G.home] ? g[G.scoreHome] - g[G.scoreAway] : fav === g[G.away] ? g[G.scoreAway] - g[G.scoreHome] : null;
  if (margin === null) return null; // pick'em or favorite not in this game
  const cover = margin + spread; // spread is negative
  return cover > 0 ? 1 : cover === 0 ? 0 : -1;
}

export function computeKpis(games: GameRow[], teamIdx: number | null): Kpis {
  let totalPts = 0;
  let totalMargin = 0;
  let homeDecided = 0;
  let homeWins = 0; // ties weighted 0.5
  let favDecided = 0;
  let favWins = 0;
  let atsDecided = 0;
  let atsCovers = 0;
  let ouDecided = 0;
  let overs = 0;
  let spreadSum = 0;
  let spreadN = 0;
  let ouSum = 0;
  let ouN = 0;
  let tW = 0,
    tL = 0,
    tT = 0;

  for (const g of games) {
    const hs = g[G.scoreHome];
    const as = g[G.scoreAway];
    totalPts += hs + as;
    totalMargin += Math.abs(hs - as);

    if (g[G.neutral] === 0) {
      homeDecided++;
      homeWins += hs > as ? 1 : hs === as ? 0.5 : 0;
    }

    const fav = g[G.fav];
    if (fav >= 0 && (fav === g[G.home] || fav === g[G.away]) && hs !== as) {
      favDecided++;
      const favScore = fav === g[G.home] ? hs : as;
      const dogScore = fav === g[G.home] ? as : hs;
      if (favScore > dogScore) favWins++;
    }

    const ats = favoriteAtsResult(g);
    if (ats !== null && ats !== 0) {
      atsDecided++;
      if (ats === 1) atsCovers++;
    }

    const ou = g[G.ou];
    if (ou !== null) {
      ouSum += ou;
      ouN++;
      const total = hs + as;
      if (total !== ou) {
        ouDecided++;
        if (total > ou) overs++;
      }
    }
    if (g[G.spread] !== null) {
      spreadSum += g[G.spread]!;
      spreadN++;
    }

    if (teamIdx !== null && (g[G.home] === teamIdx || g[G.away] === teamIdx)) {
      const mine = g[G.home] === teamIdx ? hs : as;
      const theirs = g[G.home] === teamIdx ? as : hs;
      if (mine > theirs) tW++;
      else if (mine < theirs) tL++;
      else tT++;
    }
  }

  const n = games.length;
  return {
    games: n,
    avgTotalPoints: avg(totalPts, n),
    avgMargin: avg(totalMargin, n),
    homeWinPct: pct(homeWins, homeDecided),
    favoriteSuPct: pct(favWins, favDecided),
    favoriteAtsPct: pct(atsCovers, atsDecided),
    overPct: pct(overs, ouDecided),
    avgSpread: avg(spreadSum, spreadN),
    avgOuLine: avg(ouSum, ouN),
    teamWinPct: teamIdx !== null ? pct(tW + tT * 0.5, tW + tL + tT) : null,
    teamRecord: teamIdx !== null ? `${tW}-${tL}${tT ? `-${tT}` : ""}` : null,
  };
}

export interface SeasonTrendPoint {
  season: number;
  avgPoints: number | null;
  homeWinPct: number | null;
  favAtsPct: number | null;
  overPct: number | null;
  games: number;
}

export function seasonTrends(games: GameRow[]): SeasonTrendPoint[] {
  const by = new Map<number, GameRow[]>();
  for (const g of games) {
    const arr = by.get(g[G.season]);
    if (arr) arr.push(g);
    else by.set(g[G.season], [g]);
  }
  return [...by.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([season, gs]) => {
      const k = computeKpis(gs, null);
      return {
        season,
        avgPoints: k.avgTotalPoints,
        homeWinPct: k.homeWinPct,
        favAtsPct: k.favoriteAtsPct,
        overPct: k.overPct,
        games: gs.length,
      };
    });
}

export interface TeamStat {
  team: Team;
  games: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  pfPerGame: number;
  paPerGame: number;
  atsPct: number | null; // cover rate when this team is fav or dog
  overPct: number | null;
}

export function teamStats(games: GameRow[], teams: Team[]): TeamStat[] {
  const acc = teams.map(() => ({
    games: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    pf: 0,
    pa: 0,
    atsCovers: 0,
    atsDecided: 0,
    overs: 0,
    ouDecided: 0,
  }));

  for (const g of games) {
    const ats = favoriteAtsResult(g);
    const ou = g[G.ou];
    const total = g[G.scoreHome] + g[G.scoreAway];
    for (const side of [G.home, G.away] as const) {
      const idx = g[side];
      const a = acc[idx];
      const mine = side === G.home ? g[G.scoreHome] : g[G.scoreAway];
      const theirs = side === G.home ? g[G.scoreAway] : g[G.scoreHome];
      a.games++;
      a.pf += mine;
      a.pa += theirs;
      if (mine > theirs) a.wins++;
      else if (mine < theirs) a.losses++;
      else a.ties++;
      if (ats !== null && ats !== 0) {
        a.atsDecided++;
        const isFav = g[G.fav] === idx;
        if ((isFav && ats === 1) || (!isFav && ats === -1)) a.atsCovers++;
      }
      if (ou !== null && total !== ou) {
        a.ouDecided++;
        if (total > ou) a.overs++;
      }
    }
  }

  return teams
    .map((team, i) => {
      const a = acc[i];
      return {
        team,
        games: a.games,
        wins: a.wins,
        losses: a.losses,
        ties: a.ties,
        winPct: a.games ? ((a.wins + a.ties * 0.5) / a.games) * 100 : 0,
        pfPerGame: a.games ? a.pf / a.games : 0,
        paPerGame: a.games ? a.pa / a.games : 0,
        atsPct: pct(a.atsCovers, a.atsDecided),
        overPct: pct(a.overs, a.ouDecided),
      };
    })
    .filter((t) => t.games > 0);
}

export interface Bucket {
  label: string;
  games: number;
  value: number | null;
}

export function pointsDistribution(games: GameRow[]): Bucket[] {
  const edges = [0, 20, 30, 40, 50, 60, 70];
  const buckets = edges.map((lo, i) => ({
    label: i === edges.length - 1 ? `${lo}+` : `${lo}–${edges[i + 1] - 1}`,
    games: 0,
    value: null,
  }));
  for (const g of games) {
    const total = g[G.scoreHome] + g[G.scoreAway];
    let i = edges.findIndex((lo, j) => j === edges.length - 1 || (total >= lo && total < edges[j + 1]));
    if (i < 0) i = edges.length - 1;
    buckets[i].games++;
  }
  return buckets;
}

/** Avg total points + over rate by temperature bucket (outdoor games with temp data). */
export function weatherImpact(games: GameRow[]): { label: string; avgPoints: number | null; overPct: number | null; games: number }[] {
  const defs = [
    { label: "Below 32°F", test: (t: number) => t < 32 },
    { label: "32–49°F", test: (t: number) => t >= 32 && t < 50 },
    { label: "50–69°F", test: (t: number) => t >= 50 && t < 70 },
    { label: "70°F+", test: (t: number) => t >= 70 },
    { label: "Indoor", test: null as null | ((t: number) => boolean) },
  ];
  return defs.map((d) => {
    const subset = games.filter((g) => {
      if (d.test === null) return g[G.weather] === 1;
      const t = g[G.temp];
      return g[G.weather] !== 1 && t !== null && d.test(t);
    });
    const k = computeKpis(subset, null);
    return { label: d.label, avgPoints: k.avgTotalPoints, overPct: k.overPct, games: subset.length };
  });
}
