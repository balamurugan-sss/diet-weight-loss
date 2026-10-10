"use client";

import { useState } from "react";

/**
 * Hourly average heart rate for one day: a single 2 px line (breaks where
 * nothing was recorded), a dashed resting-rate reference, a recessive grid and
 * a crosshair tooltip. A visually hidden table carries the same numbers.
 */
export function HeartRateLine({ hours, resting, labels }: { hours: (number | null)[]; resting: number | null; labels: { title: string; bpm: string; resting: string; hour: string } }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320;
  const H = 128;
  const pad = { l: 30, r: 8, t: 10, b: 20 };
  const vals = hours.filter((v): v is number => v != null);
  if (vals.length < 2) return null;
  const lo = Math.floor((Math.min(...vals, resting ?? Infinity) - 6) / 10) * 10;
  const hi = Math.ceil((Math.max(...vals) + 6) / 10) * 10;
  const x = (h: number) => pad.l + (h / 23) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const ticks = [lo, Math.round((lo + hi) / 2), hi];

  // Split into runs of consecutive recorded hours.
  const runs: [number, number][][] = [];
  hours.forEach((v, h) => {
    if (v == null) return;
    const last = runs.at(-1);
    if (last && last.at(-1)![0] === h - 1) last.push([h, v]);
    else runs.push([[h, v]]);
  });

  const nearest = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * W;
    const h = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * 23);
    let best: number | null = null;
    for (let d = 0; d < 24 && best == null; d++) for (const c of [h - d, h + d]) if (c >= 0 && c < 24 && hours[c] != null) best ??= c;
    return best;
  };
  const clock = (h: number) => `${String(h).padStart(2, "0")}:00`;
  const hv = hover != null ? hours[hover] : null;

  return (
    <figure className="relative">
      <figcaption className="mb-1 text-sm font-semibold text-muted">{labels.title}</figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none select-none"
        role="img"
        aria-label={labels.title}
        onPointerMove={(e) => setHover(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--color-line)" strokeWidth="1" />
            <text x={pad.l - 6} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="var(--color-muted)" className="tabular">
              {v}
            </text>
          </g>
        ))}
        {[0, 6, 12, 18, 23].map((h) => (
          <text key={h} x={x(h)} y={H - 5} textAnchor="middle" fontSize="10" fill="var(--color-muted)">
            {clock(h).slice(0, 2)}
          </text>
        ))}
        {resting != null && resting > lo && (
          <>
            <line x1={pad.l} x2={W - pad.r} y1={y(resting)} y2={y(resting)} stroke="var(--color-muted)" strokeDasharray="3 4" strokeWidth="1" />
            <text x={W - pad.r} y={y(resting) - 4} textAnchor="end" fontSize="10" fill="var(--color-muted)">
              {labels.resting} {resting}
            </text>
          </>
        )}
        {runs.map((run, i) =>
          run.length === 1 ? (
            <circle key={i} cx={x(run[0][0])} cy={y(run[0][1])} r="2.5" fill="var(--color-terracotta)" />
          ) : (
            <polyline key={i} points={run.map(([h, v]) => `${x(h)},${y(v)}`).join(" ")} fill="none" stroke="var(--color-terracotta)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          ),
        )}
        {hover != null && hv != null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="var(--color-ink-2)" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(hv)} r="4.5" fill="var(--color-terracotta)" stroke="var(--color-surface)" strokeWidth="2" />
          </>
        )}
      </svg>
      {hover != null && hv != null && (
        <div
          className="pointer-events-none absolute top-6 rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm shadow-[var(--shadow-lift)]"
          style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% - 3.5rem), calc(100% - 7rem))` }}
        >
          <span className="block text-xs text-muted">
            {clock(hover)}–{clock((hover + 1) % 24)}
          </span>
          <span className="font-bold tabular">
            {hv} {labels.bpm}
          </span>
        </div>
      )}
      <table className="sr-only">
        <thead>
          <tr>
            <th>{labels.hour}</th>
            <th>{labels.bpm}</th>
          </tr>
        </thead>
        <tbody>
          {hours.map((v, h) =>
            v == null ? null : (
              <tr key={h}>
                <td>{clock(h)}</td>
                <td>{v}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </figure>
  );
}
