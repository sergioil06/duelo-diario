"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface Series {
  id: string;
  name: string;
  /** Token CSS del color (validado para claro y oscuro). */
  color: string;
}

export interface Row {
  key: string;
  label: string;
  values: Record<string, number>;
}

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

/**
 * Barras agrupadas en vertical (una por serie y periodo).
 * Marcas finas con extremo redondeado de 4px, 2px de separación entre barras,
 * rejilla discreta, tooltip al pasar/tocar y tabla accesible.
 */
export function GroupedBars({ rows, series, title, height = 200 }: { rows: Row[]; series: Series[]; title: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const tableId = useId();
  // Medimos el ancho real para que textos y barras no se encojan en el móvil.
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const max = niceMax(Math.max(0, ...rows.flatMap((r) => series.map((s) => r.values[s.id] ?? 0))));
  const ticks = [0, max / 2, max];
  const H = height;
  const pad = { l: 36, r: 8, t: 10, b: 24 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const band = iw / rows.length;
  const gap = 2;
  const barW = Math.max(3, Math.min(18, (band * 0.7 - gap * (series.length - 1)) / series.length));
  const groupW = barW * series.length + gap * (series.length - 1);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const labelEvery = Math.ceil(rows.length / Math.max(3, Math.floor(W / 70)));
  const r = 4;

  const barPath = (x: number, v: number) => {
    const top = y(v);
    const h = pad.t + ih - top;
    if (h <= 0) return "";
    const rr = Math.min(r, h, barW / 2);
    return `M${x},${pad.t + ih}V${top + rr}Q${x},${top} ${x + rr},${top}H${x + barW - rr}Q${x + barW},${top} ${x + barW},${top + rr}V${pad.t + ih}Z`;
  };

  return (
    <figure className="m-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <figcaption className="font-display text-lg font-extrabold">{title}</figcaption>
        <ul className="flex gap-3 text-[13px] font-bold text-muted" aria-label="Leyenda">
          {series.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-[3px]" style={{ background: s.color }} aria-hidden="true" />
              {s.name}
            </li>
          ))}
        </ul>
      </div>

      <div ref={box} className="relative mt-2">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block" role="img" aria-label={`${title}. Abre la tabla para ver los datos.`} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth={1} />
              <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize={12} fill="var(--muted)" fontWeight={700}>
                {t}
              </text>
            </g>
          ))}
          {rows.map((row, i) => {
            const x0 = pad.l + band * i + (band - groupW) / 2;
            return (
              <g key={row.key}>
                {hover === i && <rect x={pad.l + band * i} y={pad.t} width={band} height={ih} fill="var(--surface-2)" opacity={0.7} />}
                {series.map((s, j) => (
                  <path key={s.id} d={barPath(x0 + j * (barW + gap), row.values[s.id] ?? 0)} fill={s.color} />
                ))}
                {i % labelEvery === 0 && (
                  <text x={pad.l + band * i + band / 2} y={H - 6} textAnchor="middle" fontSize={12} fill="var(--muted)" fontWeight={700}>
                    {row.label}
                  </text>
                )}
                {/* Zona de toque más grande que la barra */}
                <rect
                  x={pad.l + band * i}
                  y={pad.t}
                  width={band}
                  height={ih + pad.b}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onClick={() => setHover(hover === i ? null : i)}
                />
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 min-w-32 -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-xs font-bold text-bg shadow-lg"
            style={{ left: `${Math.min(85, Math.max(15, ((pad.l + band * hover + band / 2) / W) * 100))}%` }}
          >
            <p className="font-extrabold">{rows[hover].label}</p>
            {series.map((s) => (
              <p key={s.id} className="mt-0.5 flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
                  {s.name}
                </span>
                <span className="tabular-nums">{rows[hover].values[s.id] ?? 0}</span>
              </p>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-expanded={table}
        aria-controls={tableId}
        onClick={() => setTable(!table)}
        className="mt-1 min-h-10 text-sm font-extrabold text-primary"
      >
        {table ? "Ocultar tabla" : "Ver tabla"}
      </button>
      {table && (
        <div id={tableId} className="mt-1 max-h-64 overflow-auto rounded-2xl border-2 border-surface-2">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr>
                <th className="px-3 py-2 text-left">Periodo</th>
                {series.map((s) => (
                  <th key={s.id} className="px-3 py-2 text-right">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-surface-2">
                  <td className="px-3 py-1.5 font-bold">{row.label}</td>
                  {series.map((s) => (
                    <td key={s.id} className="px-3 py-1.5 text-right tabular-nums">
                      {row.values[s.id] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
