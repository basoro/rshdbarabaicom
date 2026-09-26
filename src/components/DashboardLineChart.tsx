type LinePoint = {
  label: string;
  value: number;
};

type ChartVariant = 'emerald' | 'cyan' | 'rose' | 'amber';

type DashboardLineChartProps = {
  points: LinePoint[];
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  emptyText?: string;
  valueSuffix?: string;
  variant?: ChartVariant;
};

const variantStyles: Record<
  ChartVariant,
  {
    eyebrow: string;
    accent: string;
    accentDark: string;
    valueFill: string;
    gradientFrom: string;
    gradientTo: string;
  }
> = {
  emerald: {
    eyebrow: 'text-emerald-700 dark:text-emerald-300',
    accent: '#34d399',
    accentDark: '#059669',
    valueFill: 'fill-emerald-700 dark:fill-emerald-200',
    gradientFrom: 'rgba(16, 185, 129, 0.35)',
    gradientTo: 'rgba(16, 185, 129, 0)',
  },
  cyan: {
    eyebrow: 'text-cyan-700 dark:text-cyan-300',
    accent: '#22d3ee',
    accentDark: '#0891b2',
    valueFill: 'fill-cyan-700 dark:fill-cyan-200',
    gradientFrom: 'rgba(6, 182, 212, 0.35)',
    gradientTo: 'rgba(6, 182, 212, 0)',
  },
  rose: {
    eyebrow: 'text-rose-700 dark:text-rose-300',
    accent: '#fb7185',
    accentDark: '#e11d48',
    valueFill: 'fill-rose-700 dark:fill-rose-200',
    gradientFrom: 'rgba(244, 63, 94, 0.32)',
    gradientTo: 'rgba(244, 63, 94, 0)',
  },
  amber: {
    eyebrow: 'text-amber-700 dark:text-amber-300',
    accent: '#fbbf24',
    accentDark: '#d97706',
    valueFill: 'fill-amber-700 dark:fill-amber-200',
    gradientFrom: 'rgba(245, 158, 11, 0.32)',
    gradientTo: 'rgba(245, 158, 11, 0)',
  },
};

export default function DashboardLineChart({
  points,
  title = 'Grafik Tren',
  subtitle,
  eyebrow = 'Tahunan',
  emptyText = 'Belum ada data.',
  valueSuffix = ' postingan',
  variant = 'emerald',
}: DashboardLineChartProps) {
  const style = variantStyles[variant];
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

  const gradientId = `line-area-${variant}`;

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`text-[11px] uppercase tracking-[0.32em] ${style.eyebrow}`}>{eyebrow}</p>
          <h2 className="mt-2 font-display text-[26px] leading-tight text-slate-900 dark:text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-2 text-[13px] text-slate-600 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        <p className="text-[13px] text-slate-600 dark:text-slate-400">
          Total:{' '}
          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{total}</span>
          {valueSuffix}
        </p>
      </div>

      {!points.length ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-[13px] text-slate-500 dark:border-white/10 dark:text-slate-400">
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
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={style.accentDark} stopOpacity="0.35" />
                <stop offset="100%" stopColor={style.accentDark} stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingY + innerHeight - ratio * innerHeight;
              const value = Math.round(ratio * safeMax);
              return (
                <g key={`grid-${variant}-${ratio}`}>
                  <line
                    x1={paddingX}
                    x2={chartWidth - paddingX}
                    y1={y}
                    y2={y}
                    className="stroke-slate-200 dark:stroke-white/10"
                    strokeDasharray="4 6"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10.5"
                    fill="#64748b"
                    className="tabular-nums"
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
              className="stroke-slate-300 dark:stroke-white/10"
            />
            <line
              x1={paddingX}
              x2={chartWidth - paddingX}
              y1={paddingY + innerHeight}
              y2={paddingY + innerHeight}
              className="stroke-slate-300 dark:stroke-white/10"
            />

            {areaPath ? (
              <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
            ) : null}
            {linePath ? (
              <path
                d={linePath}
                fill="none"
                stroke={style.accent}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {coords.map((coord, index) => (
              <g key={`point-${variant}-${index}-${coord.label}`}>
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="6"
                  className="fill-white dark:fill-slate-950"
                  stroke={style.accent}
                  strokeWidth="2"
                />
                <circle cx={coord.x} cy={coord.y} r="2.5" fill={style.accent} />
                <title>{`${coord.label}: ${coord.value}`}</title>
              </g>
            ))}

            {coords.map((coord, index) => (
              <g key={`xlabel-${variant}-${index}-${coord.label}`}>
                <text
                  x={coord.x}
                  y={chartHeight + 22}
                  textAnchor="middle"
                  fontSize="10.5"
                  className="fill-slate-500 dark:fill-slate-400"
                >
                  {coord.label}
                </text>
                <text
                  x={coord.x}
                  y={coord.y - 12}
                  textAnchor="middle"
                  fontSize="10.5"
                  className={`${style.valueFill} tabular-nums`}
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
