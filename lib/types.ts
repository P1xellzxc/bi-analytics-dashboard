export interface Driver {
  name: string;
  code: string;
  nationality: string;
}

export interface Constructor {
  name: string;
  nationality: string;
}

export interface Circuit {
  name: string;
  country: string;
  location: string;
}

// [year, round, circuitIdx, name]
export type RaceRow = [number, number, number, string];

// Compact tuple emitted by scripts/build-data.mjs
// [raceIdx, driverIdx, constructorIdx, grid, posOrder, classifiedPos|null, points,
//  statusClass, qualiPos|null, lapsLed, pitCount|null, pitAvgMs|null, fastestLap01, sprint01]
export type ResultRow = [
  number, // 0 race index
  number, // 1 driver index
  number, // 2 constructor index
  number, // 3 grid (0 = pit lane / unknown)
  number, // 4 finishing order (incl. DNFs, always set)
  number | null, // 5 classified position (null if not classified)
  number, // 6 points scored
  number, // 7 status class (see STATUS_LABELS)
  number | null, // 8 qualifying position (null pre-1994)
  number, // 9 laps led
  number | null, // 10 pit stop count (2011+ only)
  number | null, // 11 avg pit stop stationary ms (2011+ only)
  number, // 12 set fastest lap (0/1)
  number, // 13 sprint race (0/1)
];

export const R = {
  race: 0,
  driver: 1,
  constructor: 2,
  grid: 3,
  order: 4,
  pos: 5,
  points: 6,
  status: 7,
  quali: 8,
  lapsLed: 9,
  pitCount: 10,
  pitAvgMs: 11,
  fastestLap: 12,
  sprint: 13,
} as const;

export const RACE = { year: 0, round: 1, circuit: 2, name: 3 } as const;

// statusClass values
export const STATUS_LABELS = ["Finished", "Mechanical DNF", "Incident DNF", "Disqualified", "Other"];

export interface Dataset {
  drivers: Driver[];
  constructors: Constructor[];
  circuits: Circuit[];
  races: RaceRow[];
  results: ResultRow[];
}

export interface Filters {
  seasonFrom: number;
  seasonTo: number;
  session: "all" | "race" | "sprint";
  driver: number | null;
  team: number | null; // constructor index
  circuit: number | null;
  circuitCountry: string;
  driverNationality: string;
  status: "all" | "finished" | "mechanical" | "incident" | "dsq";
  gridBucket: "all" | "pole" | "front" | "top10" | "back" | "pit";
}
