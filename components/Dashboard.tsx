"use client";

import { useEffect, useMemo, useState } from "react";
import { applyFilters, computeKpis, pointsDistribution, seasonTrends, teamStats, weatherImpact } from "@/lib/analytics";
import { Dataset, Filters, G } from "@/lib/types";
import { FilterBar } from "./FilterBar";
import { KpiCard, fmtNum, fmtPct } from "./KpiCard";
import {
  BettingTrendChart,
  HomeAdvantageChart,
  PointsDistributionChart,
  ScoringTrendChart,
  WeatherImpactChart,
} from "./Charts";
import { TeamTable } from "./TeamTable";

export function Dashboard() {
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters | null>(null);

  useEffect(() => {
    fetch("/data/games.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: Dataset) => {
        setData(d);
        const seasons = d.games.map((g) => g[G.season]);
        setFilters({
          seasonFrom: Math.min(...seasons),
          seasonTo: Math.max(...seasons),
          gameType: "all",
          week: null,
          conference: "all",
          division: "",
          team: null,
          venue: "all",
          weather: null,
        });
      })
      .catch((e) => setError(String(e)));
  }, []);

  const seasons = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.games.map((g) => g[G.season]))].sort((a, b) => a - b);
  }, [data]);

  const filtered = useMemo(() => (data && filters ? applyFilters(data, filters) : []), [data, filters]);
  const kpis = useMemo(() => computeKpis(filtered, filters?.team ?? null), [filtered, filters?.team]);
  const trends = useMemo(() => seasonTrends(filtered), [filtered]);
  const distribution = useMemo(() => pointsDistribution(filtered), [filtered]);
  const weather = useMemo(() => weatherImpact(filtered), [filtered]);
  const tStats = useMemo(() => (data ? teamStats(filtered, data.teams) : []), [filtered, data]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-red-400">
        Failed to load data: {error}
      </div>
    );
  }
  if (!data || !filters) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-zinc-500 animate-pulse">
        Loading game data…
      </div>
    );
  }

  const selectedTeam = filters.team !== null ? data.teams[filters.team] : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 flex flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">NFL Analytics</h1>
          <p className="text-sm text-zinc-500">
            Scores, point spreads &amp; totals · {seasons[0]}–{seasons[seasons.length - 1]} ·{" "}
            {data.games.length.toLocaleString()} games
          </p>
        </div>
        {selectedTeam && (
          <span className="text-sm text-emerald-400 font-medium">
            {selectedTeam.name} · {selectedTeam.division}
          </span>
        )}
      </header>

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        teams={data.teams}
        seasons={seasons}
        gameCount={filtered.length}
        totalCount={data.games.length}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Games" value={kpis.games.toLocaleString()} />
        {selectedTeam ? (
          <KpiCard
            label={`${data.teams[filters.team!].id} win %`}
            value={fmtPct(kpis.teamWinPct)}
            sub={kpis.teamRecord ?? undefined}
            accent
          />
        ) : (
          <KpiCard label="Home win %" value={fmtPct(kpis.homeWinPct)} sub="Neutral sites excluded" accent />
        )}
        <KpiCard label="Avg points / game" value={fmtNum(kpis.avgTotalPoints)} sub="Both teams combined" />
        <KpiCard label="Avg victory margin" value={fmtNum(kpis.avgMargin)} />
        <KpiCard
          label="Favorite ATS cover %"
          value={fmtPct(kpis.favoriteAtsPct)}
          sub={`SU win ${fmtPct(kpis.favoriteSuPct)} · pushes excl.`}
        />
        <KpiCard
          label="Over hit %"
          value={fmtPct(kpis.overPct)}
          sub={`Avg O/U line ${fmtNum(kpis.avgOuLine)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScoringTrendChart data={trends} />
        <HomeAdvantageChart data={trends} />
        <BettingTrendChart data={trends} />
        <PointsDistributionChart data={distribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <WeatherImpactChart data={weather} />
        </div>
        <div className="lg:col-span-3">
          <TeamTable stats={tStats} />
        </div>
      </div>

      <footer className="text-xs text-zinc-600 pt-2 pb-4">
        Data: NFL game results &amp; Vegas lines (spreadspoke), seasons {seasons[0]}–{seasons[seasons.length - 1]}.
        Spread and over/under coverage begins in the late 1970s; weather is unavailable for some games. ATS = against
        the spread; pushes are excluded from cover and over rates.
      </footer>
    </div>
  );
}
