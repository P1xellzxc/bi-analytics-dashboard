// Converts the raw F1 CSVs in /data (Ergast schema via Kaggle) into a compact
// JSON payload consumed by the dashboard at runtime (public/data/f1.json).
// Run with: node scripts/build-data.mjs  (wired into `npm run build` via prebuild)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Quote-aware CSV line splitter (fields may be quoted; \N means null).
function splitLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((v) => (v === "\\N" ? "" : v.trim()));
}

function parseCsv(file) {
  const lines = readFileSync(join(root, "data", file), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  const header = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    const row = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

const num = (s) => (s === "" || s === undefined ? null : Number(s));

// ---- Lookups -------------------------------------------------------------
const driversRaw = parseCsv("drivers.csv");
const constructorsRaw = parseCsv("constructors.csv");
const circuitsRaw = parseCsv("circuits.csv");
const racesRaw = parseCsv("races.csv").sort((a, b) => num(a.year) - num(b.year) || num(a.round) - num(b.round));
const statusRaw = parseCsv("status.csv");

const driverIdx = new Map(driversRaw.map((d, i) => [d.driverId, i]));
const constructorIdx = new Map(constructorsRaw.map((c, i) => [c.constructorId, i]));
const circuitIdx = new Map(circuitsRaw.map((c, i) => [c.circuitId, i]));
const raceIdx = new Map(racesRaw.map((r, i) => [r.raceId, i]));

const drivers = driversRaw.map((d) => ({
  name: `${d.forename} ${d.surname}`,
  code: d.code || d.surname.slice(0, 3).toUpperCase(),
  nationality: d.nationality,
}));
const constructors = constructorsRaw.map((c) => ({ name: c.name, nationality: c.nationality }));
const circuits = circuitsRaw.map((c) => ({ name: c.name, country: c.country, location: c.location }));
const races = racesRaw.map((r) => [num(r.year), num(r.round), circuitIdx.get(r.circuitId), r.name.replace(" Grand Prix", " GP")]);

// ---- Status classification ----------------------------------------------
// 0 finished/classified, 1 mechanical DNF, 2 incident (crash/collision/spin),
// 3 disqualified/not allowed to start, 4 other (withdrew, injury, ...)
const INCIDENT = new Set(["Accident", "Collision", "Spun off", "Collision damage", "Fatal accident", "Damage", "Debris"]);
const ADMIN = new Set(["Disqualified", "Excluded", "Did not qualify", "Did not prequalify", "107% Rule", "Underweight", "Safety belt"]);
const OTHER = new Set([
  "Withdrew", "Injured", "Injury", "Driver unwell", "Illness", "Physical", "Eye injury",
  "Safety concerns", "Not restarted", "Safety", "Driver Seat", "Stalled", "Out of fuel", "Did not start",
]);
const statusClass = new Map(
  statusRaw.map((s) => {
    const t = s.status;
    let cls;
    if (t === "Finished" || t.startsWith("+") || t === "Not classified") cls = 0;
    else if (INCIDENT.has(t)) cls = 2;
    else if (ADMIN.has(t)) cls = 3;
    else if (OTHER.has(t)) cls = 4;
    else cls = 1; // mechanical/technical retirement
    return [s.statusId, cls];
  }),
);

// ---- Aggregations folded into result rows --------------------------------
// Laps led per (raceId, driverId) from 589k lap_times rows.
const lapsLed = new Map();
for (const l of parseCsv("lap_times.csv")) {
  if (l.position === "1") {
    const k = `${l.raceId}:${l.driverId}`;
    lapsLed.set(k, (lapsLed.get(k) ?? 0) + 1);
  }
}

// Pit stop count + total pit-lane time (entry to exit) per (raceId, driverId), 2011+.
// Stops longer than 60s are red-flag waits or repairs, not racing stops — excluded
// from the time average (still counted as stops).
const pits = new Map();
for (const p of parseCsv("pit_stops.csv")) {
  const k = `${p.raceId}:${p.driverId}`;
  const cur = pits.get(k) ?? { n: 0, ms: 0, msN: 0 };
  cur.n++;
  const ms = num(p.milliseconds) ?? 0;
  if (ms > 0 && ms <= 60000) {
    cur.ms += ms;
    cur.msN++;
  }
  pits.set(k, cur);
}

// Qualifying classification position per (raceId, driverId), and teammate
// qualifying delta: gap in ms to the best teammate's time in the deepest
// session both drivers set a time (Q3 > Q2 > Q1). Identical machinery makes
// this the purest raw-pace metric.
function lapMs(t) {
  if (!t) return null;
  const m = t.match(/^(\d+):(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  return Math.round((Number(m[1]) * 60 + Number(m[2])) * 1000);
}

const quali = new Map();
const qualiByRaceTeam = new Map(); // `${raceId}:${constructorId}` -> [{driverId, q1, q2, q3}]
for (const q of parseCsv("qualifying.csv")) {
  quali.set(`${q.raceId}:${q.driverId}`, num(q.position));
  const k = `${q.raceId}:${q.constructorId}`;
  const arr = qualiByRaceTeam.get(k) ?? [];
  arr.push({ driverId: q.driverId, q1: lapMs(q.q1), q2: lapMs(q.q2), q3: lapMs(q.q3) });
  qualiByRaceTeam.set(k, arr);
}

const teammateGap = new Map(); // `${raceId}:${driverId}` -> ms (+ slower than best teammate)
for (const [key, entries] of qualiByRaceTeam) {
  if (entries.length < 2) continue;
  const raceId = key.split(":")[0];
  for (const me of entries) {
    let best = null;
    for (const session of ["q3", "q2", "q1"]) {
      const mine = me[session];
      if (mine === null) continue;
      const rivals = entries.filter((e) => e !== me && e[session] !== null).map((e) => e[session]);
      if (rivals.length === 0) continue;
      best = mine - Math.min(...rivals);
      break; // deepest common session wins
    }
    if (best !== null) teammateGap.set(`${raceId}:${me.driverId}`, best);
  }
}

// ---- Result rows ----------------------------------------------------------
// [raceIdx, driverIdx, constructorIdx, grid, posOrder, classifiedPos|null, points,
//  statusClass, qualiPos|null, lapsLed, pitCount|null, pitAvgMs|null, fastestLap01, sprint01,
//  teammateQualiGapMs|null]
const rows = [];
function addResults(file, isSprint) {
  for (const r of parseCsv(file)) {
    const ri = raceIdx.get(r.raceId);
    const di = driverIdx.get(r.driverId);
    const ci = constructorIdx.get(r.constructorId);
    if (ri === undefined || di === undefined || ci === undefined) continue;
    const k = `${r.raceId}:${r.driverId}`;
    const pit = !isSprint ? pits.get(k) : undefined;
    rows.push([
      ri,
      di,
      ci,
      num(r.grid) ?? 0,
      num(r.positionOrder),
      num(r.position),
      num(r.points) ?? 0,
      statusClass.get(r.statusId) ?? 4,
      !isSprint ? (quali.get(k) ?? null) : null,
      !isSprint ? (lapsLed.get(k) ?? 0) : 0,
      pit ? pit.n : null,
      pit && pit.msN > 0 ? Math.round(pit.ms / pit.msN) : null,
      !isSprint && r.rank === "1" ? 1 : 0,
      isSprint ? 1 : 0,
      !isSprint ? (teammateGap.get(k) ?? null) : null,
    ]);
  }
}
addResults("results.csv", false);
addResults("sprint_results.csv", true);

const out = { drivers, constructors, circuits, races, results: rows };
mkdirSync(join(root, "public/data"), { recursive: true });
writeFileSync(join(root, "public/data/f1.json"), JSON.stringify(out));
const mb = (JSON.stringify(out).length / 1e6).toFixed(2);
console.log(`Wrote ${rows.length} results, ${races.length} races, ${drivers.length} drivers -> public/data/f1.json (${mb} MB)`);
