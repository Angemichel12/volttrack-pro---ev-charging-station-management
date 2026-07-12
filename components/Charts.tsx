import React, { useLayoutEffect, useMemo, useRef, useState } from "react";

// ─── helpers ──────────────────────────────────────────────────────────────────

const niceCeil = (v: number): number => {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const unit = v / pow;
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10;
  return nice * pow;
};

const compact = (v: number): string =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  : v >= 1_000 ? `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`
  : `${Math.round(v * 100) / 100}`;

const useWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
};

export interface TrendPoint {
  date: string;
  value: number;
}

// ─── TrendChart — single-series daily line with crosshair tooltip ─────────────

export const TrendChart: React.FC<{
  data: TrendPoint[];
  unit?: string;          // prefix shown in tooltip/labels, e.g. "Rwf"
  height?: number;
}> = ({ data, unit = "", height = 220 }) => {
  const { ref, width } = useWidth();
  const [hover, setHover] = useState<number | null>(null);

  const pad = { top: 16, right: 16, bottom: 26, left: 44 };
  const innerW = Math.max(width - pad.left - pad.right, 0);
  const innerH = height - pad.top - pad.bottom;

  const { points, ticks, maxY } = useMemo(() => {
    const maxVal = Math.max(...data.map(d => d.value), 0);
    const maxY = niceCeil(maxVal * 1.1 || 1);
    const step = data.length > 1 ? innerW / (data.length - 1) : 0;
    const points = data.map((d, i) => ({
      ...d,
      x: pad.left + (data.length > 1 ? i * step : innerW / 2),
      y: pad.top + innerH - (d.value / maxY) * innerH,
    }));
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => ({
      value: maxY * t,
      y: pad.top + innerH - t * innerH,
    }));
    return { points, ticks, maxY };
  }, [data, innerW, innerH]);

  if (!data.length) return <div ref={ref} />;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${pad.top + innerH} L${points[0].x},${pad.top + innerH} Z`;
  const last = points[points.length - 1];
  const hovered = hover !== null ? points[hover] : null;

  // Label roughly every ~80px so x labels never collide
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(Math.floor(innerW / 80), 1)));

  const findNearest = (clientX: number, svg: SVGSVGElement) => {
    const x = clientX - svg.getBoundingClientRect().left;
    let best = 0;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - x);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  };

  return (
    <div ref={ref} className="relative w-full select-none">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          className="block touch-none"
          onPointerMove={e => setHover(findNearest(e.clientX, e.currentTarget))}
          onPointerLeave={() => setHover(null)}
        >
          {/* gridlines + y ticks */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={pad.left} x2={width - pad.right} y1={t.y} y2={t.y} stroke="#eceef1" strokeWidth={1} />
              <text x={pad.left - 8} y={t.y + 3.5} textAnchor="end" fontSize={10} fill="#9ca3af">
                {compact(t.value)}
              </text>
            </g>
          ))}

          {/* x labels */}
          {points.map((p, i) =>
            i % labelEvery === 0 ? (
              <text key={i} x={p.x} y={height - 8} textAnchor="middle" fontSize={10} fill="#9ca3af">
                {new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </text>
            ) : null
          )}

          {/* area wash + line */}
          <path d={areaPath} fill="#16a34a" opacity={0.08} />
          <path d={linePath} fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {/* crosshair */}
          {hovered && (
            <line x1={hovered.x} x2={hovered.x} y1={pad.top} y2={pad.top + innerH} stroke="#d1d5db" strokeWidth={1} />
          )}
          {hovered && <circle cx={hovered.x} cy={hovered.y} r={4.5} fill="#16a34a" stroke="#ffffff" strokeWidth={2} />}

          {/* endpoint marker + direct label */}
          <circle cx={last.x} cy={last.y} r={4} fill="#16a34a" stroke="#ffffff" strokeWidth={2} />
          {!hovered && maxY > 0 && (
            <text
              x={Math.min(last.x, width - pad.right)}
              y={Math.max(last.y - 10, 12)}
              textAnchor="end"
              fontSize={11}
              fontWeight={600}
              fill="#374151"
            >
              {unit ? `${unit} ${compact(last.value)}` : compact(last.value)}
            </text>
          )}
        </svg>
      )}

      {/* tooltip */}
      {hovered && width > 0 && (
        <div
          className="absolute z-10 pointer-events-none bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs"
          style={{
            left: Math.min(Math.max(hovered.x - 60, 0), width - 130),
            top: Math.max(hovered.y - 58, 0),
          }}
        >
          <p className="font-bold text-gray-900 text-sm">
            {unit ? `${unit} ` : ""}{hovered.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-gray-400 mt-0.5">
            {new Date(hovered.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── BarList — horizontal magnitude bars, one hue, value at the tip ───────────

export interface BarRow {
  label: string;
  value: number;
  sub?: string; // secondary detail, e.g. "12 sessions · 340 kW"
}

export const BarList: React.FC<{ rows: BarRow[]; unit?: string }> = ({ rows, unit = "" }) => {
  const max = Math.max(...rows.map(r => r.value), 0);
  return (
    <div className="space-y-4">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <p className="text-sm font-medium text-gray-700 truncate">{r.label}</p>
            <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
              {unit ? `${unit} ` : ""}{r.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 rounded-full transition-all duration-500"
              style={{ width: max > 0 ? `${Math.max((r.value / max) * 100, r.value > 0 ? 2 : 0)}%` : "0%" }}
            />
          </div>
          {r.sub && <p className="text-[11px] text-gray-400 mt-1">{r.sub}</p>}
        </div>
      ))}
    </div>
  );
};
