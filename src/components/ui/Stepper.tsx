"use client";

import { Minus, Plus } from "lucide-react";

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  format = (v: number) => String(v),
  label,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  label: string;
  size?: "md" | "lg";
}) {
  const btn = size === "lg" ? "size-14" : "size-10";
  const round = (v: number) => Math.round(v * 100) / 100;
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1" role="group" aria-label={label}>
      <button
        type="button"
        className={`${btn} grid place-items-center rounded-full text-forest hover:bg-forest-50 disabled:opacity-30`}
        onClick={() => onChange(round(Math.max(min, value - step)))}
        disabled={value <= min}
        aria-label={`${label} −`}
      >
        <Minus className="size-5" />
      </button>
      <output className="min-w-12 text-center text-base font-semibold tabular" aria-live="polite">
        {format(value)}
      </output>
      <button
        type="button"
        className={`${btn} grid place-items-center rounded-full text-forest hover:bg-forest-50 disabled:opacity-30`}
        onClick={() => onChange(round(Math.min(max, value + step)))}
        disabled={value >= max}
        aria-label={`${label} +`}
      >
        <Plus className="size-5" />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-sand p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-9 rounded-full px-3.5 text-sm font-semibold transition-colors ${
            value === o.value ? "bg-surface text-forest shadow-[var(--shadow-soft)]" : "text-muted hover:text-charcoal"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
