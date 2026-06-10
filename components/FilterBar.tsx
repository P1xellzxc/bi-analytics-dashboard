"use client";

import { Filters, Team, WEATHER_LABELS, weekLabel } from "@/lib/types";

interface FilterBarProps {
  filters: Filters;
  setFilters: (f: Filters) => void;
  teams: Team[];
  seasons: number[];
  gameCount: number;
  totalCount: number;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

const selectCls =
  "bg-surface border border-edge rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent hover:border-ink-muted transition-colors cursor-pointer";

export function FilterBar({ filters, setFilters, teams, seasons, gameCount, totalCount }: FilterBarProps) {
  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });
  const divisions = [...new Set(teams.map((t) => t.division))]
    .filter((d) => d && (filters.conference === "all" || d.startsWith(filters.conference)))
    .sort();
  const teamOptions = teams
    .map((t, i) => ({ t, i }))
    .filter(
      ({ t }) =>
        (filters.conference === "all" || t.conference === filters.conference) &&
        (!filters.division || t.division === filters.division),
    );
  const weeks = [...Array.from({ length: 18 }, (_, i) => i + 1), 19, 20, 21, 22];

  const defaults: Filters = {
    seasonFrom: seasons[0],
    seasonTo: seasons[seasons.length - 1],
    gameType: "all",
    week: null,
    conference: "all",
    division: "",
    team: null,
    venue: "all",
    weather: null,
  };
  const isDirty = JSON.stringify(filters) !== JSON.stringify(defaults);

  return (
    <div className="rounded-xl border border-edge/50 bg-surface p-4">
      <div className="flex flex-wrap gap-3 items-end">
        <Field label="Season from">
          <select
            className={selectCls}
            value={filters.seasonFrom}
            onChange={(e) => {
              const v = Number(e.target.value);
              set({ seasonFrom: v, seasonTo: Math.max(v, filters.seasonTo) });
            }}
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Season to">
          <select
            className={selectCls}
            value={filters.seasonTo}
            onChange={(e) => {
              const v = Number(e.target.value);
              set({ seasonTo: v, seasonFrom: Math.min(v, filters.seasonFrom) });
            }}
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Game type">
          <select
            className={selectCls}
            value={filters.gameType}
            onChange={(e) => set({ gameType: e.target.value as Filters["gameType"], week: null })}
          >
            <option value="all">All games</option>
            <option value="regular">Regular season</option>
            <option value="playoffs">Playoffs</option>
          </select>
        </Field>
        <Field label="Week">
          <select
            className={selectCls}
            value={filters.week ?? ""}
            onChange={(e) => set({ week: e.target.value === "" ? null : Number(e.target.value) })}
          >
            <option value="">All weeks</option>
            {weeks
              .filter((w) =>
                filters.gameType === "regular" ? w <= 18 : filters.gameType === "playoffs" ? w >= 19 : true,
              )
              .map((w) => (
                <option key={w} value={w}>
                  {weekLabel(w)}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Conference">
          <select
            className={selectCls}
            value={filters.conference}
            onChange={(e) => set({ conference: e.target.value as Filters["conference"], division: "", team: null })}
          >
            <option value="all">Both</option>
            <option value="AFC">AFC</option>
            <option value="NFC">NFC</option>
          </select>
        </Field>
        <Field label="Division">
          <select
            className={selectCls}
            value={filters.division}
            onChange={(e) => set({ division: e.target.value, team: null })}
          >
            <option value="">All divisions</option>
            {divisions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Team">
          <select
            className={selectCls}
            value={filters.team ?? ""}
            onChange={(e) => set({ team: e.target.value === "" ? null : Number(e.target.value) })}
          >
            <option value="">All teams</option>
            {teamOptions.map(({ t, i }) => (
              <option key={t.id} value={i}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Venue">
          <select
            className={selectCls}
            value={filters.venue}
            onChange={(e) => set({ venue: e.target.value as Filters["venue"] })}
          >
            <option value="all">All venues</option>
            <option value="stadium">Home stadium</option>
            <option value="neutral">Neutral site</option>
          </select>
        </Field>
        <Field label="Weather">
          <select
            className={selectCls}
            value={filters.weather ?? ""}
            onChange={(e) => set({ weather: e.target.value === "" ? null : Number(e.target.value) })}
          >
            <option value="">All conditions</option>
            {WEATHER_LABELS.map((w, i) => (
              <option key={w} value={i}>
                {w}
              </option>
            ))}
          </select>
        </Field>
        {isDirty && (
          <button
            onClick={() => setFilters(defaults)}
            className="px-3 py-1.5 text-sm rounded-lg border border-edge text-ink-muted hover:text-ink hover:border-ink-muted transition-colors cursor-pointer"
          >
            Reset
          </button>
        )}
        <span className="ml-auto text-xs text-ink-muted pb-1.5 tabular-nums">
          {gameCount.toLocaleString()} of {totalCount.toLocaleString()} games
        </span>
      </div>
    </div>
  );
}
