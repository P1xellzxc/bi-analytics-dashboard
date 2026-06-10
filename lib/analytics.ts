import { Dataset, Filters, R, RACE, ResultRow } from "./types";

const pct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : null);
const avg = (sum: number, d: number) => (d > 0 ? sum / d : null);

export function applyFilters(data: Dataset, f: Filters): ResultRow[] {
  return data.results.filter((r) => {
    const race = data.races[r[R.race]];
    const year = race[RACE.year];
    if (year < f.seasonFrom || year > f.seasonTo) return false;
    if (f.session === "race" && r[R.sprint] === 1) return false;
    if (f.session === "sprint" && r[R.sprint] === 0) return false;
    if (f.driver !== null && r[R.driver] !== f.driver) return false;
    if (f.team !== null && r[R.constructor] !== f.team) return false;
    if (f.circuit !== null && race[RACE.circuit] !== f.circuit) return false;
    if (f.circuitCountry && data.circuits[race[RACE.circuit]].country !== f.circuitCountry) return false;
    if (f.driverNationality && data.drivers[r[R.driver]].nationality !== f.driverNationality) return false;
    if (f.status !== "all") {
      const s = r[R.status];
      if (f.status === "finished" && s !== 0) return false;
      if (f.status === "mechanical" && s !== 1) return false;
      if (f.status === "incident" && s !== 2) return false;
      if (f.status === "dsq" && s !== 3) return false;
    }
    if (f.gridBucket !== "all") {
      const g = r[R.grid];
      if (f.gridBucket === "pole" && g !== 1) return false;
      if (f.gridBucket === "front" && (g < 1 || g > 2)) return false;
      if (f.gridBucket === "top10" && (g < 1 || g > 10)) return false;
      if (f.gridBucket === "back" && g <= 10) return false;
      if (f.gridBucket === "pit" && g !== 0) return false;
    }
    return true;
  });
}

export interface Kpis {
  entries: number;
  races: number;
  wins: number;
  winPct: number | null;
  podiums: number;
  podiumPct: number | null;
  poles: number;
  points: number;
  pointsPerEntry: number | null;
  avgFinish: number | null; // classified results only
  avgGrid: number | null; // grid > 0 only
  posGained: number | null; // grid - finish, classified with grid > 0
  dnfPct: number | null; // mechanical + incident
  mechPct: number | null;
  incidentPct: number | null;
  avgPitMs: number | null;
  lapsLed: number;
  fastestLaps: number;
  pointsPerEntryExclMech: number | null; // PPR excluding mechanical-DNF entries
  avgTeammateGapMs: number | null; // mean quali gap to best teammate (capped at 3s outliers)
  poleWinConversion: number | null; // % of races won from pole (league view)
  avgFinishersPerRace: number | null;
  uniqueWinners: number;
}

export function computeKpis(rows: ResultRow[]): Kpis {
  let wins = 0;
  let podiums = 0;
  let poles = 0;
  let points = 0;
  let finSum = 0;
  let finN = 0;
  let gridSum = 0;
  let gridN = 0;
  let gainSum = 0;
  let gainN = 0;
  let mech = 0;
  let incident = 0;
  let pitMsSum = 0;
  let pitN = 0;
  let lapsLed = 0;
  let fastestLaps = 0;
  let poleWins = 0;
  let finished = 0;
  let tmGapSum = 0;
  let tmGapN = 0;
  const raceIds = new Set<number>();
  const winners = new Set<number>();

  for (const r of rows) {
    raceIds.add(r[R.race]);
    const pos = r[R.pos];
    if (pos === 1) {
      wins++;
      winners.add(r[R.driver]);
      if (r[R.grid] === 1) poleWins++;
    }
    if (pos !== null && pos <= 3) podiums++;
    const q = r[R.quali];
    if (q === 1 || (q === null && r[R.grid] === 1)) poles++;
    points += r[R.points];
    if (pos !== null) {
      finSum += pos;
      finN++;
    }
    if (r[R.grid] > 0) {
      gridSum += r[R.grid];
      gridN++;
      if (pos !== null) {
        gainSum += r[R.grid] - pos;
        gainN++;
      }
    }
    if (r[R.status] === 0) finished++;
    if (r[R.status] === 1) mech++;
    if (r[R.status] === 2) incident++;
    const pitAvg = r[R.pitAvgMs];
    const pitCount = r[R.pitCount];
    if (pitAvg !== null && pitCount !== null) {
      pitMsSum += pitAvg * pitCount;
      pitN += pitCount;
    }
    lapsLed += r[R.lapsLed];
    fastestLaps += r[R.fastestLap];
    const gap = r[R.tmGap];
    // Gaps beyond ±3s are wet sessions, damage or out-laps, not pace.
    if (gap !== null && Math.abs(gap) <= 3000) {
      tmGapSum += gap;
      tmGapN++;
    }
  }

  const n = rows.length;
  return {
    entries: n,
    races: raceIds.size,
    wins,
    winPct: pct(wins, raceIds.size),
    podiums,
    podiumPct: pct(podiums, n),
    poles,
    points,
    pointsPerEntry: avg(points, n),
    avgFinish: avg(finSum, finN),
    avgGrid: avg(gridSum, gridN),
    posGained: avg(gainSum, gainN),
    dnfPct: pct(mech + incident, n),
    mechPct: pct(mech, n),
    incidentPct: pct(incident, n),
    avgPitMs: avg(pitMsSum, pitN),
    lapsLed,
    fastestLaps,
    pointsPerEntryExclMech: avg(points, n - mech),
    avgTeammateGapMs: avg(tmGapSum, tmGapN),
    poleWinConversion: pct(poleWins, wins),
    avgFinishersPerRace: avg(finished, raceIds.size),
    uniqueWinners: winners.size,
  };
}

export interface SeasonPoint {
  season: number;
  points: number;
  wins: number;
  mechPct: number | null;
  incidentPct: number | null;
  avgPitS: number | null;
  entries: number;
}

export function seasonTrends(rows: ResultRow[], data: Dataset): SeasonPoint[] {
  const by = new Map<number, ResultRow[]>();
  for (const r of rows) {
    const y = data.races[r[R.race]][RACE.year];
    const arr = by.get(y);
    if (arr) arr.push(r);
    else by.set(y, [r]);
  }
  return [...by.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([season, rs]) => {
      const k = computeKpis(rs);
      return {
        season,
        points: k.points,
        wins: k.wins,
        mechPct: k.mechPct,
        incidentPct: k.incidentPct,
        avgPitS: k.avgPitMs !== null ? k.avgPitMs / 1000 : null,
        entries: rs.length,
      };
    });
}

/** Average classified finish position and win rate by starting grid slot (1..20). */
export function gridToFinish(rows: ResultRow[]): { grid: number; avgFinish: number | null; winPct: number | null; entries: number }[] {
  const buckets = Array.from({ length: 20 }, () => ({ finSum: 0, finN: 0, wins: 0, n: 0 }));
  for (const r of rows) {
    const g = r[R.grid];
    if (g < 1 || g > 20) continue;
    const b = buckets[g - 1];
    b.n++;
    const pos = r[R.pos];
    if (pos !== null) {
      b.finSum += pos;
      b.finN++;
      if (pos === 1) b.wins++;
    }
  }
  return buckets.map((b, i) => ({
    grid: i + 1,
    avgFinish: avg(b.finSum, b.finN),
    winPct: pct(b.wins, b.n),
    entries: b.n,
  }));
}

export interface StandingRow {
  idx: number;
  name: string;
  sub: string; // nationality (drivers) / nationality (constructors)
  entries: number;
  wins: number;
  podiums: number;
  poles: number;
  points: number;
  pointsPerEntry: number;
  avgFinish: number | null;
  dnfPct: number | null;
  lapsLed: number;
}

export function standings(rows: ResultRow[], data: Dataset, by: "driver" | "constructor"): StandingRow[] {
  const key = by === "driver" ? R.driver : R.constructor;
  const acc = new Map<number, { n: number; wins: number; pod: number; poles: number; pts: number; finSum: number; finN: number; dnf: number; led: number }>();
  for (const r of rows) {
    const id = r[key];
    let a = acc.get(id);
    if (!a) {
      a = { n: 0, wins: 0, pod: 0, poles: 0, pts: 0, finSum: 0, finN: 0, dnf: 0, led: 0 };
      acc.set(id, a);
    }
    a.n++;
    const pos = r[R.pos];
    if (pos === 1) a.wins++;
    if (pos !== null && pos <= 3) a.pod++;
    const q = r[R.quali];
    if (q === 1 || (q === null && r[R.grid] === 1)) a.poles++;
    a.pts += r[R.points];
    if (pos !== null) {
      a.finSum += pos;
      a.finN++;
    }
    if (r[R.status] === 1 || r[R.status] === 2) a.dnf++;
    a.led += r[R.lapsLed];
  }
  return [...acc.entries()].map(([idx, a]) => ({
    idx,
    name: by === "driver" ? data.drivers[idx].name : data.constructors[idx].name,
    sub: by === "driver" ? data.drivers[idx].nationality : data.constructors[idx].nationality,
    entries: a.n,
    wins: a.wins,
    podiums: a.pod,
    poles: a.poles,
    points: Math.round(a.pts * 100) / 100,
    pointsPerEntry: a.n ? a.pts / a.n : 0,
    avgFinish: avg(a.finSum, a.finN),
    dnfPct: pct(a.dnf, a.n),
    lapsLed: a.led,
  }));
}

/** Win rate + entries per circuit country — where races are won/lost. */
export function finishDistribution(rows: ResultRow[]): { label: string; entries: number }[] {
  const edges = [
    { label: "P1", test: (p: number) => p === 1 },
    { label: "P2–P3", test: (p: number) => p >= 2 && p <= 3 },
    { label: "P4–P6", test: (p: number) => p >= 4 && p <= 6 },
    { label: "P7–P10", test: (p: number) => p >= 7 && p <= 10 },
    { label: "P11+", test: (p: number) => p >= 11 },
  ];
  const out = edges.map((e) => ({ label: e.label, entries: 0 }));
  let dnf = 0;
  for (const r of rows) {
    const p = r[R.pos];
    if (p === null) {
      dnf++;
      continue;
    }
    const i = edges.findIndex((e) => e.test(p));
    if (i >= 0) out[i].entries++;
  }
  out.push({ label: "DNF/NC", entries: dnf });
  return out;
}
