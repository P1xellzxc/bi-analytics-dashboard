"use client";

import { Dataset, Filters } from "@/lib/types";

interface FilterBarProps {
  filters: Filters;
  setFilters: (f: Filters) => void;
  data: Dataset;
  seasons: number[];
  entryCount: number;
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
  "bg-surface border border-edge rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent hover:border-ink-muted transition-colors cursor-pointer max-w-44";

export function FilterBar({ filters, setFilters, data, seasons, entryCount, totalCount }: FilterBarProps) {
  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch });

  const driverOptions = data.drivers
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => !filters.driverNationality || d.nationality === filters.driverNationality)
    .sort((a, b) => a.d.name.localeCompare(b.d.name));
  const constructorOptions = data.constructors.map((c, i) => ({ c, i })).sort((a, b) => a.c.name.localeCompare(b.c.name));
  const circuitOptions = data.circuits
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => !filters.circuitCountry || c.country === filters.circuitCountry)
    .sort((a, b) => a.c.name.localeCompare(b.c.name));
  const countries = [...new Set(data.circuits.map((c) => c.country))].sort();
  const nationalities = [...new Set(data.drivers.map((d) => d.nationality))].sort();

  const defaults: Filters = {
    seasonFrom: seasons[0],
    seasonTo: seasons[seasons.length - 1],
    session: "all",
    driver: null,
    team: null,
    circuit: null,
    circuitCountry: "",
    driverNationality: "",
    status: "all",
    gridBucket: "all",
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
        <Field label="Session">
          <select
            className={selectCls}
            value={filters.session}
            onChange={(e) => set({ session: e.target.value as Filters["session"] })}
          >
            <option value="all">GP + Sprint</option>
            <option value="race">Grand Prix only</option>
            <option value="sprint">Sprint only</option>
          </select>
        </Field>
        <Field label="Driver">
          <select
            className={selectCls}
            value={filters.driver ?? ""}
            onChange={(e) => set({ driver: e.target.value === "" ? null : Number(e.target.value) })}
          >
            <option value="">All drivers</option>
            {driverOptions.map(({ d, i }) => (
              <option key={i} value={i}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Constructor">
          <select
            className={selectCls}
            value={filters.team ?? ""}
            onChange={(e) => set({ team: e.target.value === "" ? null : Number(e.target.value) })}
          >
            <option value="">All constructors</option>
            {constructorOptions.map(({ c, i }) => (
              <option key={i} value={i}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Driver nationality">
          <select
            className={selectCls}
            value={filters.driverNationality}
            onChange={(e) => set({ driverNationality: e.target.value, driver: null })}
          >
            <option value="">All nationalities</option>
            {nationalities.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Circuit country">
          <select
            className={selectCls}
            value={filters.circuitCountry}
            onChange={(e) => set({ circuitCountry: e.target.value, circuit: null })}
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Circuit">
          <select
            className={selectCls}
            value={filters.circuit ?? ""}
            onChange={(e) => set({ circuit: e.target.value === "" ? null : Number(e.target.value) })}
          >
            <option value="">All circuits</option>
            {circuitOptions.map(({ c, i }) => (
              <option key={i} value={i}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Result status">
          <select
            className={selectCls}
            value={filters.status}
            onChange={(e) => set({ status: e.target.value as Filters["status"] })}
          >
            <option value="all">All results</option>
            <option value="finished">Finished / classified</option>
            <option value="mechanical">DNF — mechanical</option>
            <option value="incident">DNF — incident</option>
            <option value="dsq">Disqualified</option>
          </select>
        </Field>
        <Field label="Grid position">
          <select
            className={selectCls}
            value={filters.gridBucket}
            onChange={(e) => set({ gridBucket: e.target.value as Filters["gridBucket"] })}
          >
            <option value="all">Any grid slot</option>
            <option value="pole">Pole (P1)</option>
            <option value="front">Front row (P1–P2)</option>
            <option value="top10">Top 10</option>
            <option value="back">P11 or lower</option>
            <option value="pit">Pit lane start</option>
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
          {entryCount.toLocaleString()} of {totalCount.toLocaleString()} entries
        </span>
      </div>
    </div>
  );
}
