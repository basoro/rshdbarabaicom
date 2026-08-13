type LinePoint = {
  label: string;
  value: number;
};

type DashboardLineChartProps = {
  points: LinePoint[];
  title?: string;
  subtitle?: string;
  emptyText?: string;
  valueSuffix?: string;
};

export default function DashboardLineChart({
  points,
  title = 'Grafik Tren',
  subtitle,
  emptyText = 'Belum ada data.',
  valueSuffix = ' postingan',
}: DashboardLineChartProps) {
  const max = points.reduce((acc, point) => Math.max(acc, point.value), 0);
  const chartWidth = 720;
  const chartHeight = 260;
  const paddingX = 36;
  const paddingY = 36;
  const safeMax = max || 1;
  const total = points.reduce((acc, point) => acc + point.value, 0);

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? paddingX + innerWidth / 2
        : paddingX + (index / (points.length - 1)) * innerWidth;
    const ratio = point.value / safeMax;
    const y = paddingY + innerHeight - ratio * innerHeight;
    return { x, y, ...point };
  });

  const linePath = coords
    .map((coord, index) => `${index === 0 ? 'M' : 'L'}${coord.x.toFixed(2)},${coord.y.toFixed(2)}`)
    .join(' ');

  const areaPath = coords.length
    ? `${linePath} L${coords[coords.length - 1].x.toFixed(2)},${paddingY + innerHeight} L${coords[0].x.toFixed(2)},${paddingY + innerHeight} Z`
    : '';

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Tahunan</p>
          <h2 className="mt-2 font-display text-3xl text-white">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
        </div>
        <p className="text-sm text-slate-400">
          Total: <span className="font-semibold text-white">{total}</span>
          {valueSuffix}
        </p>
      </div>

      {!points.length ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight + 36}`}
            className="w-full min-w-[520px]"
            role="img"
            aria-label={title}
          >
            <defs>
              <linearGradient id="line-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingY + innerHeight - ratio * innerHeight;
              const value = Math.round(ratio * safeMax);
              return (
                <g key={`grid-${ratio}`}>
                  <line
                    x1={paddingX}
                    x2={chartWidth - paddingX}
                    y1={y}
                    y2={y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="4 6"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="#64748b"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            <line
              x1={paddingX}
              x2={paddingX}
              y1={paddingY}
              y2={paddingY + innerHeight}
              stroke="rgba(255,255,255,0.1)"
            />
            <line
              x1={paddingX}
              x2={chartWidth - paddingX}
              y1={paddingY + innerHeight}
              y2={paddingY + innerHeight}
              stroke="rgba(255,255,255,0.1)"
            />

            {areaPath ? (
              <path d={areaPath} fill="url(#line-area)" stroke="none" />
            ) : null}
            {linePath ? (
              <path
                d={linePath}
                fill="none"
                stroke="#34d399"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {coords.map((coord, index) => (
              <g key={`point-${index}-${coord.label}`}>
                <circle cx={coord.x} cy={coord.y} r="6" fill="#020617" stroke="#34d399" strokeWidth="2" />
                <circle cx={coord.x} cy={coord.y} r="2.5" fill="#34d399" />
                <title>{`${coord.label}: ${coord.value}`}</title>
              </g>
            ))}

            {coords.map((coord, index) => (
              <g key={`xlabel-${index}-${coord.label}`}>
                <text
                  x={coord.x}
                  y={chartHeight + 22}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#94a3b8"
                >
                  {coord.label}
                </text>
                <text
                  x={coord.x}
                  y={coord.y - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#a7f3d0"
                  fontWeight="600"
                >
                  {coord.value}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
