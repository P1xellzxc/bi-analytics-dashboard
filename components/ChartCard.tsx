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
    <div className={`rounded-xl border border-edge/50 bg-surface p-3 sm:p-4 flex flex-col gap-3 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {sub && <p className="text-xs text-ink-muted mt-0.5">{sub}</p>}
      </div>
      <div className="h-56 sm:h-64">{children}</div>
      {info && (
        <p className="text-xs leading-relaxed text-ink-muted border-t border-edge/50 pt-2.5">
          <span className="font-medium text-ink-muted">What it&apos;s for: </span>
          {info}
        </p>
      )}
    </div>
  );
}
