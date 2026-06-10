"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyFilters,
  comebacks,
  computeKpis,
  eraDominance,
  finishDistribution,
  gridToFinish,
  seasonTrends,
  standings,
} from "@/lib/analytics";
import { Dataset, Filters, RACE } from "@/lib/types";
import { FilterBar } from "./FilterBar";
import { KpiCard, fmtNum, fmtPct } from "./KpiCard";
import {
  EraDominanceChart,
  FinishDistributionChart,
  GridToFinishChart,
  PitStopChart,
  PointsBySeasonChart,
  ReliabilityChart,
} from "./Charts";
import { StandingsTable } from "./StandingsTable";
import { ChampionshipBattle } from "./ChampionshipBattle";
import { ComebackTable } from "./ComebackTable";
import { ThemeToggle } from "./theme";

export function Dashboard() {
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters | null>(null);

  useEffect(() => {
    fetch("/data/f1.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: Dataset) => {
        setData(d);
        const years = d.races.map((r) => r[RACE.year]);
        setFilters({
          seasonFrom: Math.min(...years),
          seasonTo: Math.max(...years),
          session: "all",
          driver: null,
          team: null,
          circuit: null,
          circuitCountry: "",
          driverNationality: "",
          status: "all",
          gridBucket: "all",
        });
      })
      .catch((e) => setError(String(e)));
  }, []);

  const seasons = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.races.map((r) => r[RACE.year]))].sort((a, b) => a - b);
  }, [data]);

  const filtered = useMemo(() => (data && filters ? applyFilters(data, filters) : []), [data, filters]);
  const kpis = useMemo(() => computeKpis(filtered), [filtered]);
  const trends = useMemo(() => (data ? seasonTrends(filtered, data) : []), [filtered, data]);
  const gridStats = useMemo(() => gridToFinish(filtered), [filtered]);
  const distribution = useMemo(() => finishDistribution(filtered), [filtered]);
  const driverStandings = useMemo(() => (data ? standings(filtered, data, "driver") : []), [filtered, data]);
  const constructorStandings = useMemo(() => (data ? standings(filtered, data, "constructor") : []), [filtered, data]);
  const dominance = useMemo(() => (data ? eraDominance(filtered, data) : { seasons: [], names: [] }), [filtered, data]);
  const topComebacks = useMemo(() => (data ? comebacks(filtered, data) : []), [filtered, data]);

  if (error) {
    return <div className="flex-1 flex items-center justify-center text-sm text-neg">Failed to load data: {error}</div>;
  }
  if (!data || !filters) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-ink-muted animate-pulse">
        Loading race data…
      </div>
    );
  }

  const entityName =
    filters.driver !== null
      ? data.drivers[filters.driver].name
      : filters.team !== null
        ? data.constructors[filters.team].name
        : null;
  const entityMode = entityName !== null;

  return (
    <div className="w-full px-3 sm:px-4 xl:px-6 2xl:px-8 py-4 sm:py-6 flex flex-col gap-3 sm:gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-ink">F1 Analytics</h1>
          <p className="text-sm text-ink-muted">
            Results, qualifying, reliability &amp; pit stops · {seasons[0]}–{seasons[seasons.length - 1]} ·{" "}
            {data.races.length.toLocaleString()} races
          </p>
        </div>
        <div className="flex items-center gap-3">
          {entityName && (
            <span className="text-sm text-accent font-medium">
              {entityName}
              {filters.driver !== null && ` · ${data.drivers[filters.driver].nationality}`}
              {filters.driver === null && filters.team !== null && ` · ${data.constructors[filters.team].nationality}`}
            </span>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="md:sticky md:top-0 md:z-30 md:-mx-3 md:px-3 xl:-mx-6 xl:px-6 2xl:-mx-8 2xl:px-8 md:py-2 md:-my-2 md:bg-base">
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          data={data}
          seasons={seasons}
          entryCount={filtered.length}
          totalCount={data.results.length}
        />
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 ${entityMode ? "xl:grid-cols-7" : "xl:grid-cols-6"}`}>
        {entityMode ? (
          <>
            <KpiCard
              label="Entries"
              value={kpis.entries.toLocaleString()}
              sub={`${kpis.races.toLocaleString()} races`}
              info="Race starts matching the filters. More entries = more reliable percentages."
            />
            <KpiCard
              label="Wins"
              value={kpis.wins.toLocaleString()}
              sub={`Win rate ${fmtPct(kpis.winPct)}`}
              accent
              info="First places, and the share of entered races won. The all-time greats sit above 20%."
            />
            <KpiCard
              label="Podiums"
              value={kpis.podiums.toLocaleString()}
              sub={`${fmtPct(kpis.podiumPct)} of entries · ${kpis.poles} poles`}
              info="Top-3 finishes — the consistency measure that wins championships. Poles count qualifying P1s."
            />
            <KpiCard
              label="Points / race"
              value={fmtNum(kpis.pointsPerEntry, 2)}
              sub={`${fmtNum(kpis.pointsPerEntryExclMech, 2)} excl. mech DNF · ${kpis.points.toLocaleString()} total`}
              info="Average championship points per entry — the fairest cross-era comparison since calendars and scoring systems changed over time. The adjusted figure excludes entries lost to mechanical failure, isolating performance from car fragility."
            />
            <KpiCard
              label="Teammate quali delta"
              value={
                kpis.avgTeammateGapMs === null
                  ? "—"
                  : `${kpis.avgTeammateGapMs <= 0 ? "" : "+"}${(kpis.avgTeammateGapMs / 1000).toFixed(3)}s`
              }
              sub="Avg gap to teammate, 1994+"
              info="Average qualifying gap to the best teammate in the deepest session both ran (Q3 > Q2 > Q1). Identical machinery makes this the purest raw-pace metric: negative means faster than the teammate. Gaps over 3s (wet sessions, damage) are excluded."
            />
            <KpiCard
              label="Avg positions gained"
              value={kpis.posGained === null ? "—" : (kpis.posGained > 0 ? "+" : "") + kpis.posGained.toFixed(2)}
              sub={`Grid ${fmtNum(kpis.avgGrid)} → finish ${fmtNum(kpis.avgFinish)}`}
              info="Race craft: average places gained (+) or lost (−) between starting grid slot and classified finish. Positive means they race better than they qualify."
            />
            <KpiCard
              label="DNF rate"
              value={fmtPct(kpis.dnfPct)}
              sub={`Mech ${fmtPct(kpis.mechPct)} · incident ${fmtPct(kpis.incidentPct)}`}
              info="Share of entries not finished due to mechanical failure or on-track incident. The hidden championship-killer."
            />
          </>
        ) : (
          <>
            <KpiCard
              label="Races"
              value={kpis.races.toLocaleString()}
              sub={`${kpis.entries.toLocaleString()} entries`}
              info="Grands Prix (and sprints, if included) matching the filters, with total car entries."
            />
            <KpiCard
              label="Unique winners"
              value={kpis.uniqueWinners.toLocaleString()}
              accent
              info="How many different drivers won a race in this slice — a quick read on how competitive an era was. Few winners = dominance."
            />
            <KpiCard
              label="DNF rate"
              value={fmtPct(kpis.dnfPct)}
              sub={`Mech ${fmtPct(kpis.mechPct)} · incident ${fmtPct(kpis.incidentPct)}`}
              info="Share of all entries that retired. Watch it collapse from ~40% in the 1950s to single digits today — the story of F1 engineering."
            />
            <KpiCard
              label="Pole → win"
              value={fmtPct(kpis.poleWinConversion)}
              sub="Share of wins from pole"
              info="How often the race winner started from pole position. High values mean qualifying decides the race; low values mean overtaking (or chaos) matters."
            />
            <KpiCard
              label="Avg pit stop"
              value={kpis.avgPitMs === null ? "—" : `${(kpis.avgPitMs / 1000).toFixed(2)} s`}
              sub="Pit-lane time, 2011+"
              info="Average pit-lane time per stop (entry to exit, including the speed-limited drive-through — stationary time is only 2–3s of it). Red-flag stops over 60s are excluded. Data exists from 2011 onward."
            />
            <KpiCard
              label="Finishers / race"
              value={fmtNum(kpis.avgFinishersPerRace)}
              info="Average number of cars classified per race — attrition in one number. Modern races see almost the whole field finish; 1950s races often saw half retire."
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <PointsBySeasonChart data={trends} entityName={entityName} />
        <ReliabilityChart data={trends} />
        <GridToFinishChart data={gridStats} />
        <FinishDistributionChart data={distribution} />
        <EraDominanceChart data={dominance} />
        <PitStopChart data={trends} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="lg:col-span-3">
          <ChampionshipBattle data={data} />
        </div>
        <div className="lg:col-span-2">
          <ComebackTable rows={topComebacks} />
        </div>
      </div>

      <StandingsTable drivers={driverStandings} constructors={constructorStandings} />

      <footer className="text-xs text-ink-muted pt-2 pb-4">
        Data:{" "}
        <a
          href="https://www.kaggle.com/datasets/rohanrao/formula-1-world-championship-1950-2020"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-edge underline-offset-2 hover:text-ink transition-colors"
        >
          Formula 1 World Championship (1950–2024)
        </a>{" "}
        via Kaggle / Ergast API, seasons {seasons[0]}–{seasons[seasons.length - 1]}. Qualifying data begins in 1994 and
        pit stop data in 2011; poles before 1994 use grid P1. DNF = did not finish; sprints excluded from laps-led and
        pit metrics. Not affiliated with Formula 1.
      </footer>
    </div>
  );
}
