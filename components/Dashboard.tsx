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
      <div className="flex-1 flex items-center justify-center text-sm text-neg">
        Failed to load data: {error}
      </div>
    );
  }
  if (!data || !filters) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-ink-muted animate-pulse">
        Loading game data…
      </div>
    );
  }

  const selectedTeam = filters.team !== null ? data.teams[filters.team] : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 flex flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-ink">NFL Analytics</h1>
          <p className="text-sm text-ink-muted">
            Scores, point spreads &amp; totals · {seasons[0]}–{seasons[seasons.length - 1]} ·{" "}
            {data.games.length.toLocaleString()} games
          </p>
        </div>
        {selectedTeam && (
          <span className="text-sm text-accent font-medium">
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
        <KpiCard
          label="Games"
          value={kpis.games.toLocaleString()}
          info="How many games match the current filters. The bigger this number, the more trustworthy every other stat on the page."
        />
        {selectedTeam ? (
          <KpiCard
            label={`${data.teams[filters.team!].id} win %`}
            value={fmtPct(kpis.teamWinPct)}
            sub={kpis.teamRecord ?? undefined}
            accent
            info="The selected team's win rate and record over the filtered games (ties count as half a win)."
          />
        ) : (
          <KpiCard
            label="Home win %"
            value={fmtPct(kpis.homeWinPct)}
            sub="Neutral sites excluded"
            accent
            info="How often the home team wins — the simplest measure of home-field advantage. 50% would mean playing at home is worth nothing."
          />
        )}
        <KpiCard
          label="Avg points / game"
          value={fmtNum(kpis.avgTotalPoints)}
          sub="Both teams combined"
          info="Combined points scored by both teams per game — the overall scoring environment. Compare it to the average over/under line to see if games run hotter or colder than the market expects."
        />
        <KpiCard
          label="Avg victory margin"
          value={fmtNum(kpis.avgMargin)}
          info="Average gap between the winner and loser. Smaller margins mean more competitive games."
        />
        <KpiCard
          label="Favorite ATS cover %"
          value={fmtPct(kpis.favoriteAtsPct)}
          sub={`SU win ${fmtPct(kpis.favoriteSuPct)} · pushes excl.`}
          info="How often the favorite beats the point spread (ATS = against the spread). Above 52.4% would beat the bookmaker's fee; near 50% means the spreads are accurate. SU = straight-up wins, ignoring the spread."
        />
        <KpiCard
          label="Over hit %"
          value={fmtPct(kpis.overPct)}
          sub={`Avg O/U line ${fmtNum(kpis.avgOuLine)}`}
          info="How often the combined score finished above the sportsbook's over/under line. Near 50% means totals are priced well; a persistent lean is a betting signal."
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

      <footer className="text-xs text-ink-muted pt-2 pb-4">
        Data:{" "}
        <a
          href="https://www.kaggle.com/datasets/tobycrabtree/nfl-scores-and-betting-data"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-edge underline-offset-2 hover:text-ink transition-colors"
        >
          NFL scores and betting data
        </a>{" "}
        (Kaggle, spreadspoke), seasons {seasons[0]}–{seasons[seasons.length - 1]}. Spread and over/under coverage
        begins in the late 1970s; weather is unavailable for some games. ATS = against the spread; pushes are excluded
        from cover and over rates. Not affiliated with the NFL.
      </footer>
    </div>
  );
}
