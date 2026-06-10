export interface Team {
  id: string;
  name: string;
  division: string;
  conference: "AFC" | "NFC";
}

// Compact tuple emitted by scripts/build-data.mjs
// [season, week, homeIdx, awayIdx, scoreHome, scoreAway, favIdx, spread, ouLine, neutral, temp, wind, weatherCat]
export type GameRow = [
  number, // 0 season
  number, // 1 week (1-18 regular, 19 WC, 20 Div, 21 Conf, 22 SB)
  number, // 2 home team index
  number, // 3 away team index
  number, // 4 home score
  number, // 5 away score
  number, // 6 favorite team index (-2 pick'em, -1 unknown)
  number | null, // 7 spread (negative, from favorite's perspective)
  number | null, // 8 over/under line
  number, // 9 neutral site (0/1)
  number | null, // 10 temperature °C
  number | null, // 11 wind km/h
  number, // 12 weather category
];

export const G = {
  season: 0,
  week: 1,
  home: 2,
  away: 3,
  scoreHome: 4,
  scoreAway: 5,
  fav: 6,
  spread: 7,
  ou: 8,
  neutral: 9,
  temp: 10,
  wind: 11,
  weather: 12,
} as const;

export interface Dataset {
  teams: Team[];
  games: GameRow[];
}

export const WEATHER_LABELS = ["Outdoor (clear)", "Indoor / Dome", "Rain", "Snow", "Fog", "Unknown"];

export const PLAYOFF_WEEK_LABELS: Record<number, string> = {
  19: "Wildcard",
  20: "Division",
  21: "Conference",
  22: "Super Bowl",
};

export function weekLabel(week: number): string {
  return PLAYOFF_WEEK_LABELS[week] ?? `Week ${week}`;
}

export interface Filters {
  seasonFrom: number;
  seasonTo: number;
  gameType: "all" | "regular" | "playoffs";
  week: number | null;
  conference: "all" | "AFC" | "NFC";
  division: string;
  team: number | null; // team index
  venue: "all" | "stadium" | "neutral";
  weather: number | null; // weather category
}
