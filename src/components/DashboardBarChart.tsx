type BarItem = {
  label: string;
  value: number;
};

type DashboardBarChartProps = {
  items: BarItem[];
  title?: string;
  emptyText?: string;
  valueSuffix?: string;
};

export default function DashboardBarChart({
  items,
  title = 'Grafik Batang',
  emptyText = 'Belum ada data.',
  valueSuffix = ' postingan',
}: DashboardBarChartProps) {
  const max = items.reduce((acc, item) => Math.max(acc, item.value), 0);
  const height = 260;
  const paddingY = 32;
  const safeMax = max || 1;
  const barGap = 14;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Statistik</p>
          <h2 className="mt-2 font-display text-3xl text-white">{title}</h2>
        </div>
        <p className="text-sm text-slate-400">
          Total: <span className="font-semibold text-white">{items.reduce((acc, item) => acc + item.value, 0)}</span>
          {valueSuffix}
        </p>
      </div>

      {!items.length ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-slate-400">
          {emptyText}
        </div>
      ) : (
        <div className="mt-8">
          <div
            className="relative w-full border-b border-l border-white/10"
            style={{ height }}
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = height - paddingY - ratio * (height - paddingY * 2);
              const value = Math.round(ratio * safeMax);
              return (
                <div
                  key={`grid-${ratio}`}
                  className="absolute left-0 right-0 border-t border-dashed border-white/5"
                  style={{ top: y }}
                >
                  <span className="absolute -left-1 -translate-x-full -translate-y-1/2 text-[11px] text-slate-500">
                    {value}
                  </span>
                </div>
              );
            })}

            <div className="absolute inset-x-4 bottom-0 top-0 flex items-end justify-stretch gap-[clamp(6px,1vw,18px)]">
              {items.map((item, index) => {
                const ratio = safeMax === 0 ? 0 : item.value / safeMax;
                const barHeight = Math.max(ratio * (height - paddingY * 2), item.value > 0 ? 6 : 0);
                const barWidth = `calc((100% - ${(items.length - 1) * barGap}px) / ${items.length})`;
                return (
                  <div
                    key={`bar-${index}-${item.label}`}
                    className="group relative flex flex-1 flex-col items-center justify-end"
                    style={{ maxWidth: barWidth, minWidth: 0 }}
                  >
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.25)] transition group-hover:from-emerald-500 group-hover:to-emerald-300"
                      style={{ height: barHeight }}
                      title={`${item.label}: ${item.value}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex justify-stretch gap-[clamp(6px,1vw,18px)] px-4">
            {items.map((item, index) => {
              const barWidth = `calc((100% - ${(items.length - 1) * barGap}px) / ${items.length})`;
              return (
                <div
                  key={`label-${index}-${item.label}`}
                  className="flex flex-1 flex-col items-center justify-start gap-1"
                  style={{ maxWidth: barWidth, minWidth: 0 }}
                >
                  <span className="line-clamp-1 text-[11px] font-semibold text-emerald-200">
                    {item.value}
                  </span>
                  <span
                    className="line-clamp-2 w-full break-words text-center text-[11px] leading-4 text-slate-400"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
