export function ChartCard({
  title,
  sub,
  info,
  children,
  className = "",
}: {
  title: string;
  sub?: string;
  info?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-edge/50 bg-surface p-4 flex flex-col gap-3 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {sub && <p className="text-xs text-ink-muted mt-0.5">{sub}</p>}
      </div>
      <div className="h-64">{children}</div>
      {info && (
        <p className="text-xs leading-relaxed text-ink-muted border-t border-edge/50 pt-2.5">
          <span className="font-medium text-ink-muted">What it&apos;s for: </span>
          {info}
        </p>
      )}
    </div>
  );
}

// Pantone series colors: 3395 C / 279 C / 1235 C on 433 C surfaces.
export const CHART_COLORS = {
  primary: "#00c389",
  secondary: "#418fde",
  tertiary: "#ffb81c",
  grid: "#333f48",
  axis: "#97999b",
  reference: "#75787b",
};

export const tooltipStyle = {
  backgroundColor: "#1d252d",
  border: "1px solid #333f48",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#d9d9d6",
};
