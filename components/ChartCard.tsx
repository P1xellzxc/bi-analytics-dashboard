export function ChartCard({
  title,
  sub,
  children,
  className = "",
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-3 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

export const CHART_COLORS = {
  primary: "#10b981",
  secondary: "#60a5fa",
  tertiary: "#f59e0b",
  grid: "#27272a",
  axis: "#71717a",
  reference: "#52525b",
};

export const tooltipStyle = {
  backgroundColor: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#e4e4e7",
};
