// Converts the raw Kaggle CSVs in /data into a compact JSON payload consumed
// by the dashboard at runtime (public/data/games.json).
// Run with: node scripts/build-data.mjs  (wired into `npm run build` via prebuild)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    // No quoted fields exist in these CSVs, simple split is safe.
    const cells = line.split(",");
    const row = {};
    header.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

// Canonical modern franchise names per team_id (the teams CSV lists every
// historical name; the dashboard groups all of them under one franchise).
const CURRENT_NAMES = {
  ARI: "Arizona Cardinals",
  ATL: "Atlanta Falcons",
  BAL: "Baltimore Ravens",
  BUF: "Buffalo Bills",
  CAR: "Carolina Panthers",
  CHI: "Chicago Bears",
  CIN: "Cincinnati Bengals",
  CLE: "Cleveland Browns",
  DAL: "Dallas Cowboys",
  DEN: "Denver Broncos",
  DET: "Detroit Lions",
  GB: "Green Bay Packers",
  HOU: "Houston Texans",
  IND: "Indianapolis Colts",
  JAX: "Jacksonville Jaguars",
  KC: "Kansas City Chiefs",
  LAC: "Los Angeles Chargers",
  LAR: "Los Angeles Rams",
  LVR: "Las Vegas Raiders",
  MIA: "Miami Dolphins",
  MIN: "Minnesota Vikings",
  NE: "New England Patriots",
  NO: "New Orleans Saints",
  NYG: "New York Giants",
  NYJ: "New York Jets",
  PHI: "Philadelphia Eagles",
  PIT: "Pittsburgh Steelers",
  SEA: "Seattle Seahawks",
  SF: "San Francisco 49ers",
  TB: "Tampa Bay Buccaneers",
  TEN: "Tennessee Titans",
  WAS: "Washington Commanders",
};

const teamsRaw = parseCsv(readFileSync(join(root, "data/nfl_teams.csv"), "utf8"));
const nameToId = {};
const franchises = {}; // id -> { name, division }
for (const t of teamsRaw) {
  nameToId[t.team_name] = t.team_id;
  const f = (franchises[t.team_id] ??= { name: CURRENT_NAMES[t.team_id] ?? t.team_name, division: "" });
  if (t.team_division) f.division = t.team_division; // prefer a row with a current division
}

const ids = Object.keys(franchises).sort();
const teams = ids.map((id) => ({
  id,
  name: franchises[id].name,
  division: franchises[id].division,
  conference: franchises[id].division.startsWith("AFC") ? "AFC" : "NFC",
}));
const idToIdx = Object.fromEntries(ids.map((id, i) => [id, i]));

const PLAYOFF_WEEKS = { Wildcard: 19, Division: 20, Conference: 21, Superbowl: 22 };

function weatherCategory(detail, temp) {
  const d = detail.toLowerCase();
  if (d.includes("indoor") || d.includes("closed")) return 1; // indoor / dome
  if (d.includes("snow")) return 3;
  if (d.includes("rain")) return 2;
  if (d.includes("fog")) return 4;
  if (temp !== null) return 0; // outdoor, no precipitation recorded
  return 5; // unknown
}

const num = (s) => (s === "" || s === undefined ? null : Number(s));
// Source data is imperial; the dashboard is metric.
const fToC = (f) => (f === null ? null : Math.round(((f - 32) * 5) / 9));
const mphToKmh = (mph) => (mph === null ? null : Math.round(mph * 1.609344));

const gamesRaw = parseCsv(readFileSync(join(root, "data/spreadspoke_scores.csv"), "utf8"));
const games = [];
for (const g of gamesRaw) {
  const home = idToIdx[nameToId[g.team_home]];
  const away = idToIdx[nameToId[g.team_away]];
  if (home === undefined || away === undefined || g.score_home === "") continue;
  const temp = num(g.weather_temperature);
  games.push([
    Number(g.schedule_season), // 0 season
    PLAYOFF_WEEKS[g.schedule_week] ?? Number(g.schedule_week), // 1 week (19-22 = playoff rounds)
    home, // 2 home team index
    away, // 3 away team index
    Number(g.score_home), // 4
    Number(g.score_away), // 5
    g.team_favorite_id === "PICK" ? -2 : idToIdx[g.team_favorite_id] ?? -1, // 6 favorite (-2 pick'em, -1 none)
    num(g.spread_favorite), // 7 spread (negative = favorite lays points)
    num(g.over_under_line), // 8 over/under line
    g.stadium_neutral === "TRUE" ? 1 : 0, // 9 neutral site
    fToC(temp), // 10 temperature °C
    mphToKmh(num(g.weather_wind_mph)), // 11 wind km/h
    weatherCategory(g.weather_detail ?? "", temp), // 12 weather category
  ]);
}

const out = { teams, games };
mkdirSync(join(root, "public/data"), { recursive: true });
writeFileSync(join(root, "public/data/games.json"), JSON.stringify(out));
console.log(`Wrote ${games.length} games, ${teams.length} franchises -> public/data/games.json`);
