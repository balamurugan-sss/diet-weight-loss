"use client";

import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
  desc?: string;
}

interface ChipSelectProps<T extends string> {
  options: Option<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  multi?: boolean;
  columns?: 1 | 2 | 3;
}

export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  multi = false,
  columns = 2,
}: ChipSelectProps<T>) {
  function toggle(v: T) {
    if (multi) {
      onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    } else {
      onChange([v]);
    }
  }

  return (
    <div
      className={cn(
        "grid gap-2.5",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3"
      )}
    >
      {options.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all",
              active ? "text-white shadow-lg" : ""
            )}
            style={
              active
                ? { backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))", borderColor: "transparent" }
                : { borderColor: "var(--card-border)", background: "var(--card)" }
            }
          >
            {opt.label}
            {opt.desc && (
              <span
                className="mt-0.5 block text-xs font-normal"
                style={{ color: active ? "rgba(255,255,255,0.85)" : "var(--muted)" }}
              >
                {opt.desc}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
